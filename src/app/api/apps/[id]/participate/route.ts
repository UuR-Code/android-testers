import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendNewTesterNotification } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Teste katılmak için lütfen giriş yapın." },
        { status: 401 }
      );
    }

    // Fetch the app with owner
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: {
        owner: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Uygulama bulunamadı." }, { status: 404 });
    }

    if (app.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Bu uygulama şu anda yeni test katılımlarına kapalıdır." },
        { status: 400 }
      );
    }

    // 1. Kullanıcı kendi uygulamasını test edemez!
    if (app.owner_id === currentUser.id) {
      return NextResponse.json(
        { error: "Kendi uygulamanızı test edemezsiniz." },
        { status: 400 }
      );
    }

    // 2. Kontenjan kontrolü
    if (app.current_tester_count >= app.target_tester_count) {
      return NextResponse.json(
        { error: "Bu uygulamanın testçi kontenjanı dolmuştur." },
        { status: 400 }
      );
    }

    // 3. Tekrar katılım kontrolü
    const existing = await prisma.testParticipation.findUnique({
      where: {
        app_id_user_id: {
          app_id: appId,
          user_id: currentUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu uygulamaya zaten katıldınız.", participation: existing },
        { status: 400 }
      );
    }

    // Atomic transaction: Create participation + increment app tester count
    const participation = await prisma.$transaction(async (tx) => {
      const part = await tx.testParticipation.create({
        data: {
          app_id: appId,
          user_id: currentUser.id,
          status: "JOINED", // Play Console daveti bekleniyor
        },
      });

      await tx.app.update({
        where: { id: appId },
        data: {
          current_tester_count: { increment: 1 },
        },
      });

      // Uygulama sahibine sistem içi bildirim oluştur
      await tx.notification.create({
        data: {
          user_id: app.owner_id,
          type: "NEW_TESTER",
          title: "Yeni Testçi Katıldı",
          message: `${currentUser.name || currentUser.email} kullanıcısı "${app.name}" uygulaması için teste katıldı.`,
          link: `/apps/${app.id}/manage`,
        },
      });

      return part;
    });

    // Send email to owner asynchronously
    if (app.owner.email_notifications) {
      sendNewTesterNotification(app.owner.email, app.name, currentUser.email).catch((err) =>
        console.error("Owner notification email failed:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test başvurunuz alındı! Testçi listesine eklendiniz.",
      participation,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Bu uygulamaya zaten katıldınız." },
        { status: 400 }
      );
    }
    console.error("Participate error:", error);
    return NextResponse.json(
      { error: "Teste katılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

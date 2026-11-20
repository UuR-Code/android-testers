import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Lütfen giriş yapın." }, { status: 401 });
    }

    const body = await request.json();
    const { feedback_type, feedback_text, tester_answer } = body;

    const validTypes = ["NO_PROBLEM", "BUG_FOUND", "SUGGESTION"];
    if (!feedback_type || !validTypes.includes(feedback_type)) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir geri bildirim seçeneği belirleyin." },
        { status: 400 }
      );
    }

    const participation = await prisma.testParticipation.findUnique({
      where: {
        app_id_user_id: {
          app_id: appId,
          user_id: currentUser.id,
        },
      },
      include: {
        app: true,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Bu uygulamaya henüz katılmadınız." },
        { status: 400 }
      );
    }

    if (participation.status === "APPROVED") {
      return NextResponse.json(
        { error: "Bu test zaten onaylanmış durumda." },
        { status: 400 }
      );
    }

    // Verification Question & Answer Check
    if (participation.app.verification_question && participation.app.verification_answer) {
      if (!tester_answer || typeof tester_answer !== "string" || !tester_answer.trim()) {
        return NextResponse.json(
          { error: "Lütfen geliştiricinin belirlediği doğrulama sorusunu yanıtlayın." },
          { status: 400 }
        );
      }

      const expected = participation.app.verification_answer.trim().toLowerCase();
      const provided = tester_answer.trim().toLowerCase();

      if (expected !== provided) {
        return NextResponse.json(
          { error: "Doğrulama sorusuna verdiğiniz yanıt hatalı. Lütfen uygulamayı telefonunuza indirip açarak cevabı kontrol edin." },
          { status: 400 }
        );
      }
    }

    // Update participation to CLAIMED_TESTED
    const updated = await prisma.$transaction(async (tx) => {
      const part = await tx.testParticipation.update({
        where: { id: participation.id },
        data: {
          status: "CLAIMED_TESTED",
          feedback_type,
          feedback_text: feedback_text?.trim() || null,
          tester_answer: tester_answer?.trim() || null,
          claimed_tested_at: new Date(),
        },
      });

      // Notify app owner
      await tx.notification.create({
        data: {
          user_id: participation.app.owner_id,
          type: "TEST_CLAIMED",
          title: "Test Geri Bildirimi Geldi 📝",
          message: `${currentUser.name || currentUser.email} kullanıcısı "${participation.app.name}" testini tamamladığını bildirdi.`,
          link: `/apps/${appId}/manage`,
        },
      });

      return part;
    });

    return NextResponse.json({
      success: true,
      message: "Geri bildiriminiz başarıyla iletildi, geliştirici onayı bekleniyor.",
      participation: updated,
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { error: "Geri bildirim gönderilemedi." },
      { status: 500 }
    );
  }
}

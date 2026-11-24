import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    const app = await prisma.app.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        ...(currentUser
          ? {
              participations: {
                where: { user_id: currentUser.id },
              },
            }
          : {}),
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Uygulama bulunamadı" }, { status: 404 });
    }

    const myParticipation = currentUser && (app as any).participations?.[0];
    const isOwner = currentUser?.id === app.owner_id;

    // Get breakdown stats for owner
    let ownerStats = null;
    if (isOwner || currentUser?.role === "ADMIN") {
      const approvedCount = await prisma.testParticipation.count({
        where: { app_id: app.id, status: "APPROVED" },
      });
      const pendingCount = await prisma.testParticipation.count({
        where: { app_id: app.id, status: { in: ["CLAIMED_TESTED", "JOINED", "INVITED"] } },
      });
      ownerStats = {
        approvedCount,
        pendingCount,
        totalCount: app.current_tester_count,
      };
    }

    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        category: app.category,
        description: app.description,
        icon_url: app.icon_url || "/icons/brandlook.svg",
        opt_in_url: app.opt_in_url,
        store_url: app.store_url,
        status: app.status,
        target_tester_count: app.target_tester_count,
        current_tester_count: app.current_tester_count,
        note_for_testers: app.note_for_testers,
        verification_question: app.verification_question,
        verification_answer: app.verification_answer,
        google_group_url: app.google_group_url,
        target_reached_at: app.target_reached_at,
        created_at: app.created_at,
        is_owner: isOwner,
        my_participation: myParticipation || null,
        owner_stats: ownerStats,
      },
    });
  } catch (error) {
    console.error("Get app error:", error);
    return NextResponse.json({ error: "Uygulama bilgileri getirilemedi" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "Uygulama bulunamadı" }, { status: 404 });
    }

    if (app.owner_id !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      category,
      description,
      icon_url,
      opt_in_url,
      store_url,
      google_group_url,
      verification_question,
      verification_answer,
      note_for_testers,
      status,
    } = body;

    const updated = await prisma.app.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(icon_url ? { icon_url } : {}),
        ...(opt_in_url ? { opt_in_url: opt_in_url.trim() } : {}),
        ...(store_url !== undefined ? { store_url: store_url?.trim() || null } : {}),
        ...(google_group_url !== undefined ? { google_group_url: google_group_url?.trim() || null } : {}),
        ...(verification_question !== undefined ? { verification_question: verification_question?.trim() || null } : {}),
        ...(verification_answer !== undefined ? { verification_answer: verification_answer?.trim() || null } : {}),
        ...(note_for_testers !== undefined ? { note_for_testers: note_for_testers?.trim() || null } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, message: "Uygulama başarıyla güncellendi.", app: updated });
  } catch (error) {
    console.error("Update app error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "Uygulama bulunamadı" }, { status: 404 });
    }

    if (app.owner_id !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    // Get system settings for publish cost refund
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const cost = settings?.app_creation_cost ?? 10;

    // REFUND POLICY:
    // If NO testers joined yet (current_tester_count === 0), full credit refund!
    if (app.current_tester_count === 0) {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Refund user
        const updatedUser = await tx.user.update({
          where: { id: currentUser.id },
          data: { credit_balance: { increment: cost } },
        });

        // 2. Mark app cancelled
        const cancelledApp = await tx.app.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        // 3. Log credit transaction
        await tx.creditTransaction.create({
          data: {
            user_id: currentUser.id,
            app_id: app.id,
            amount: cost,
            balance_after: updatedUser.credit_balance,
            transaction_type: "APP_CANCEL_REFUND",
            description: `Uygulama İptali Kredi İadesi (${app.name})`,
          },
        });

        // 4. In-app notification
        await tx.notification.create({
          data: {
            user_id: currentUser.id,
            type: "SYSTEM",
            title: `Kredi İadesi Yapıldı 🪙 +${cost}`,
            message: `"${app.name}" uygulaması iptal edildi ve henüz kimse katılmadığı için ${cost} krediniz hesabınıza eksiksiz iade edildi.`,
            link: "/?tab=profile",
          },
        });

        return { newBalance: updatedUser.credit_balance };
      });

      return NextResponse.json({
        success: true,
        refunded: true,
        refundAmount: cost,
        message: `Uygulama iptal edildi ve henüz testçi katılmadığı için ${cost} krediniz hesabınıza eksiksiz iade edildi! 🪙`,
        newBalance: result.newBalance,
      });
    } else {
      // Testers have already joined -> cancel without refund
      await prisma.app.update({
        where: { id },
        data: { status: "PAUSED" },
      });

      return NextResponse.json({
        success: true,
        refunded: false,
        message: `Uygulama yayından kaldırıldı. Daha önce ${app.current_tester_count} testçi katıldığı için kredi iadesi yapılmamıştır.`,
      });
    }
  } catch (error) {
    console.error("Delete app error:", error);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}

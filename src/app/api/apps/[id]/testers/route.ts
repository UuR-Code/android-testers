import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  sendTestApprovedNotification,
  sendInvitationReadyNotification,
  sendReminderEmail,
} from "@/lib/email";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    // Verify ownership
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true, owner_id: true, name: true, target_tester_count: true, current_tester_count: true },
    });

    if (!app) {
      return NextResponse.json({ error: "Uygulama bulunamadı." }, { status: 404 });
    }

    // STRICT SECURITY: Only app owner or system ADMIN can access tester email list!
    if (app.owner_id !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bu uygulamanın testçi listesini görme yetkiniz yok." },
        { status: 403 }
      );
    }

    const testers = await prisma.testParticipation.findMany({
      where: { app_id: appId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { joined_at: "desc" },
    });

    const formatted = testers.map((t) => ({
      participation_id: t.id,
      user_id: t.user_id,
      email: t.user.email,
      name: t.user.name,
      status: t.status,
      joined_at: t.joined_at,
      invited_at: t.invited_at,
      claimed_tested_at: t.claimed_tested_at,
      approved_at: t.approved_at,
      feedback_type: t.feedback_type,
      feedback_text: t.feedback_text,
      rejection_reason: t.rejection_reason,
      last_reminder_at: t.last_reminder_at,
    }));

    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        target_tester_count: app.target_tester_count,
        current_tester_count: app.current_tester_count,
      },
      testers: formatted,
    });
  } catch (error) {
    console.error("Get testers error:", error);
    return NextResponse.json({ error: "Testçiler getirilemedi." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: { owner: true },
    });

    if (!app) {
      return NextResponse.json({ error: "Uygulama bulunamadı." }, { status: 404 });
    }

    // STRICT SECURITY: Only app owner or system ADMIN can perform tester actions
    if (app.owner_id !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const body = await request.json();
    const { action, participation_id, reason, selected_ids } = body;

    // Get system settings for reward
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const reward = settings?.reward_per_approved_test ?? 1;
    const reminderCooldownHours = settings?.reminder_cooldown_hours ?? 24;

    // ACTION 1: APPROVE TESTER
    if (action === "APPROVE") {
      if (!participation_id) {
        return NextResponse.json({ error: "Katılım ID belirtilmedi." }, { status: 400 });
      }

      const participation = await prisma.testParticipation.findUnique({
        where: { id: participation_id },
        include: { user: true },
      });

      if (!participation || participation.app_id !== appId) {
        return NextResponse.json({ error: "Katılım kaydı bulunamadı." }, { status: 404 });
      }

      // Idempotency: if already approved, do nothing and avoid double credit!
      if (participation.status === "APPROVED") {
        return NextResponse.json({
          success: true,
          message: "Bu testçi zaten daha önce onaylanmış.",
        });
      }

      // Check if tester already received credit for this app
      const existingTx = await prisma.creditTransaction.findFirst({
        where: {
          user_id: participation.user_id,
          app_id: appId,
          transaction_type: "TEST_REWARD",
        },
      });

      if (existingTx) {
        return NextResponse.json(
          { error: "Bu kullanıcı bu uygulama için zaten kredi ödülü almış." },
          { status: 400 }
        );
      }

      // Atomic Transaction: Update participation status to APPROVED + Increment user credit + Log credit transaction
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update status
        const p = await tx.testParticipation.update({
          where: { id: participation_id },
          data: {
            status: "APPROVED",
            approved_at: new Date(),
          },
        });

        // 2. Increment user credit
        const updatedUser = await tx.user.update({
          where: { id: participation.user_id },
          data: {
            credit_balance: { increment: reward },
          },
        });

        // 3. Log credit transaction
        await tx.creditTransaction.create({
          data: {
            user_id: participation.user_id,
            app_id: appId,
            participation_id: participation.id,
            amount: reward,
            balance_after: updatedUser.credit_balance,
            transaction_type: "TEST_REWARD",
            description: `Test Onayı - ${app.name}`,
          },
        });

        // 4. Create in-app notification
        await tx.notification.create({
          data: {
            user_id: participation.user_id,
            type: "TEST_APPROVED",
            title: "Testin Onaylandı! 🎉",
            message: `"${app.name}" uygulaması için yaptığınız test onaylandı ve +${reward} kredi kazandınız.`,
            link: "/credits",
          },
        });

        return { participation: p, newBalance: updatedUser.credit_balance };
      });

      // Send email to tester asynchronously
      if (participation.user.email_notifications) {
        sendTestApprovedNotification(participation.user.email, app.name).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        message: `Testçi başarıyla onaylandı ve hesabına +${reward} kredi yüklendi.`,
      });
    }

    // ACTION 2: REJECT TESTER
    if (action === "REJECT") {
      if (!participation_id) {
        return NextResponse.json({ error: "Katılım ID belirtilmedi." }, { status: 400 });
      }

      const participation = await prisma.testParticipation.findUnique({
        where: { id: participation_id },
        include: { user: true },
      });

      if (!participation || participation.app_id !== appId) {
        return NextResponse.json({ error: "Katılım kaydı bulunamadı." }, { status: 404 });
      }

      // If rejecting, we reopen the slot by decrementing current_tester_count
      await prisma.$transaction(async (tx) => {
        await tx.testParticipation.update({
          where: { id: participation_id },
          data: {
            status: "REJECTED",
            rejection_reason: reason?.trim() || "Test gereksinimleri karşılanmadı.",
            rejected_at: new Date(),
          },
        });

        // Reopen slot
        if (app.current_tester_count > 0) {
          await tx.app.update({
            where: { id: appId },
            data: {
              current_tester_count: { decrement: 1 },
            },
          });
        }

        // Create notification
        await tx.notification.create({
          data: {
            user_id: participation.user_id,
            type: "TEST_REJECTED",
            title: "Test Başvurusu Reddedildi",
            message: `"${app.name}" uygulaması için test katılımınız reddedildi: ${reason || "Gereksinimler karşılanmadı."}`,
            link: "/tests",
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Testçi reddedildi ve kontenjan yeniden açıldı.",
      });
    }

    // ACTION 3: INVITE READY (Bulk or Single)
    if (action === "INVITE_READY") {
      const ids: string[] = Array.isArray(selected_ids) && selected_ids.length > 0
        ? selected_ids
        : participation_id
        ? [participation_id]
        : [];

      if (ids.length === 0) {
        // Apply to all pending JOINED testers
        const joinedTesters = await prisma.testParticipation.findMany({
          where: { app_id: appId, status: "JOINED" },
          select: { id: true, user: { select: { email: true, email_notifications: true } } },
        });

        await prisma.testParticipation.updateMany({
          where: { app_id: appId, status: "JOINED" },
          data: {
            status: "INVITED",
            invited_at: new Date(),
          },
        });

        // Send email to all
        for (const t of joinedTesters) {
          if (t.user.email_notifications) {
            sendInvitationReadyNotification(t.user.email, app.name, app.opt_in_url).catch(console.error);
          }
        }

        return NextResponse.json({
          success: true,
          message: `${joinedTesters.length} testçinin durumu "Davet Hazır" olarak güncellendi ve e-posta bildirimi gönderildi.`,
        });
      } else {
        const testersToUpdate = await prisma.testParticipation.findMany({
          where: { id: { in: ids }, app_id: appId },
          include: { user: true },
        });

        await prisma.testParticipation.updateMany({
          where: { id: { in: ids }, app_id: appId },
          data: {
            status: "INVITED",
            invited_at: new Date(),
          },
        });

        for (const t of testersToUpdate) {
          if (t.user.email_notifications) {
            sendInvitationReadyNotification(t.user.email, app.name, app.opt_in_url).catch(console.error);
          }
        }

        return NextResponse.json({
          success: true,
          message: `${testersToUpdate.length} testçinin durumu "Davet Hazır" yapıldı.`,
        });
      }
    }

    // ACTION 4: SEND REMINDER (Hatırlatma Gönder)
    if (action === "REMIND") {
      const ids: string[] = Array.isArray(selected_ids) && selected_ids.length > 0
        ? selected_ids
        : participation_id
        ? [participation_id]
        : [];

      const cooldownDate = new Date(Date.now() - reminderCooldownHours * 60 * 60 * 1000);

      // Find eligible testers (not approved, not rejected, not reminded within cooldown)
      const targetTesters = await prisma.testParticipation.findMany({
        where: {
          app_id: appId,
          status: { in: ["JOINED", "INVITED"] },
          ...(ids.length > 0 ? { id: { in: ids } } : {}),
          OR: [
            { last_reminder_at: null },
            { last_reminder_at: { lt: cooldownDate } },
          ],
        },
        include: { user: true },
      });

      if (targetTesters.length === 0) {
        return NextResponse.json({
          success: false,
          message: `Son ${reminderCooldownHours} saat içinde zaten hatırlatma gönderilmiş veya uygun bekleyen testçi bulunamadı.`,
        });
      }

      // Send reminders and update last_reminder_at
      for (const t of targetTesters) {
        await prisma.testParticipation.update({
          where: { id: t.id },
          data: { last_reminder_at: new Date() },
        });

        if (t.user.email_notifications) {
          sendReminderEmail(t.user.email, app.name, app.opt_in_url).catch(console.error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `${targetTesters.length} testçiye hatırlatma e-postası başarıyla gönderildi.`,
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem türü." }, { status: 400 });
  } catch (error) {
    console.error("Tester action error:", error);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

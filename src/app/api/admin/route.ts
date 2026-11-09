import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Yönetici yetkisi gereklidir." }, { status: 403 });
    }

    // 1. System Settings
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });

    // 2. Statistics
    const totalUsers = await prisma.user.count();
    const totalApps = await prisma.app.count();
    const activeApps = await prisma.app.count({ where: { status: "ACTIVE" } });
    const totalParticipations = await prisma.testParticipation.count();
    const pendingApprovals = await prisma.testParticipation.count({
      where: { status: "CLAIMED_TESTED" },
    });

    // Circulating credits
    const usersCreditSum = await prisma.user.aggregate({
      _sum: { credit_balance: true },
    });
    const circulatingCredits = usersCreditSum._sum.credit_balance || 0;

    // Credit stats
    const creditRewards = await prisma.creditTransaction.aggregate({
      where: { transaction_type: "TEST_REWARD" },
      _sum: { amount: true },
    });
    const creditSpent = await prisma.creditTransaction.aggregate({
      where: { transaction_type: "APP_PUBLISH" },
      _sum: { amount: true },
    });

    // 3. Recent Users
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credit_balance: true,
        created_at: true,
        _count: {
          select: {
            apps: true,
            participations: true,
          },
        },
      },
    });

    // 4. All Apps
    const apps = await prisma.app.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { participations: true },
        },
      },
    });

    // 5. Recent Email Logs
    const emailLogs = await prisma.emailLog.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
    });

    // 6. Recent Credit Transactions
    const recentTransactions = await prisma.creditTransaction.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json({
      stats: {
        total_users: totalUsers,
        total_apps: totalApps,
        active_apps: activeApps,
        total_participations: totalParticipations,
        pending_approvals: pendingApprovals,
        circulating_credits: circulatingCredits,
        total_rewards_given: creditRewards._sum.amount || 0,
        total_spent_on_apps: Math.abs(creditSpent._sum.amount || 0),
      },
      settings,
      users,
      apps,
      emailLogs,
      recentTransactions,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Yönetici verileri yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Yönetici yetkisi gereklidir." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // UPDATE SYSTEM SETTINGS
    if (action === "UPDATE_SETTINGS") {
      const {
        app_creation_cost,
        reward_per_approved_test,
        target_tester_count,
        max_active_apps_per_user,
        reminder_cooldown_hours,
      } = body.settings;

      const updated = await prisma.systemSetting.upsert({
        where: { id: "default" },
        update: {
          app_creation_cost: Number(app_creation_cost) || 10,
          reward_per_approved_test: Number(reward_per_approved_test) || 1,
          target_tester_count: Number(target_tester_count) || 20,
          max_active_apps_per_user: Number(max_active_apps_per_user) || 5,
          reminder_cooldown_hours: Number(reminder_cooldown_hours) || 24,
        },
        create: {
          id: "default",
          app_creation_cost: Number(app_creation_cost) || 10,
          reward_per_approved_test: Number(reward_per_approved_test) || 1,
          target_tester_count: Number(target_tester_count) || 20,
          max_active_apps_per_user: Number(max_active_apps_per_user) || 5,
          reminder_cooldown_hours: Number(reminder_cooldown_hours) || 24,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Sistem ayarları başarıyla güncellendi.",
        settings: updated,
      });
    }

    // ADJUST USER CREDITS MANUALLY
    if (action === "ADJUST_CREDITS") {
      const { user_id, amount, reason } = body;
      const numAmount = Number(amount);

      if (!user_id || isNaN(numAmount) || numAmount === 0) {
        return NextResponse.json(
          { error: "Geçerli bir kullanıcı ve kredi miktarı belirtin." },
          { status: 400 }
        );
      }

      const targetUser = await prisma.user.findUnique({ where: { id: user_id } });
      if (!targetUser) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: user_id },
          data: { credit_balance: { increment: numAmount } },
        });

        await tx.creditTransaction.create({
          data: {
            user_id,
            amount: numAmount,
            balance_after: u.credit_balance,
            transaction_type: "ADMIN_ADJUSTMENT",
            description: reason?.trim() || "Yönetici Manuel Kredi Düzeltmesi",
          },
        });

        await tx.notification.create({
          data: {
            user_id,
            type: "SYSTEM",
            title: numAmount > 0 ? "Kredi Eklendi" : "Kredi Düzenlendi",
            message: `Yönetici tarafından hesabınıza ${numAmount > 0 ? "+" : ""}${numAmount} kredi uygulandı (${reason || "Yönetici işlemi"}).`,
            link: "/credits",
          },
        });

        return u;
      });

      return NextResponse.json({
        success: true,
        message: `Kullanıcı kredisi başarıyla güncellendi. Yeni bakiye: ${updated.credit_balance}`,
      });
    }

    // TOGGLE APP STATUS (PAUSE / ACTIVATE)
    if (action === "TOGGLE_APP_STATUS") {
      const { app_id, status } = body;
      const updatedApp = await prisma.app.update({
        where: { id: app_id },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        message: `Uygulama durumu "${status}" olarak değiştirildi.`,
        app: updatedApp,
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}

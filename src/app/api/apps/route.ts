import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const tab = searchParams.get("tab") || "pool"; // 'pool', 'popular', 'new', 'completed'
    const currentUser = await getCurrentUser();

    // Get current target tester count setting
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const targetCount = settings?.target_tester_count ?? 20;

    // Fetch all active apps
    const apps = await prisma.app.findMany({
      where: {
        status: tab === "completed" ? "COMPLETED" : "ACTIVE",
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
                { category: { contains: search } },
              ],
            }
          : {}),
      },
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
                select: {
                  id: true,
                  status: true,
                  claimed_tested_at: true,
                  approved_at: true,
                },
              },
            }
          : {}),
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Custom sorting algorithm as specified:
    // 1. Not full (< targetCount) on top, full (>= targetCount) at bottom.
    // 2. For not full:
    //    If tab === 'popular': more participants first
    //    If tab === 'new': newer first
    //    Default ('pool'): fewest participants first, then older first
    const sortedApps = apps.sort((a, b) => {
      const aFull = a.current_tester_count >= (a.target_tester_count || targetCount);
      const bFull = b.current_tester_count >= (b.target_tester_count || targetCount);

      // Full apps go to bottom
      if (!aFull && bFull) return -1;
      if (aFull && !bFull) return 1;

      if (tab === "popular") {
        return b.current_tester_count - a.current_tester_count;
      }

      if (tab === "new") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      // Default Pool order:
      // - Az katılımcısı bulunan uygulamalar öncelikli
      // - Aynı katılımcı sayısında daha eski uygulamaya öncelik verilsin
      if (a.current_tester_count !== b.current_tester_count) {
        return a.current_tester_count - b.current_tester_count;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Format safe response for clients (no tester emails exposed!)
    const formatted = sortedApps.map((app) => {
      const participation = currentUser && (app as any).participations?.[0];
      const isOwner = currentUser?.id === app.owner_id;
      const isFull = app.current_tester_count >= (app.target_tester_count || targetCount);

      return {
        id: app.id,
        name: app.name,
        category: app.category,
        description: app.description,
        icon_url: app.icon_url || "/icons/brandlook.svg",
        opt_in_url: app.opt_in_url,
        store_url: app.store_url,
        status: app.status,
        target_tester_count: app.target_tester_count || targetCount,
        current_tester_count: app.current_tester_count,
        is_full: isFull,
        is_owner: isOwner,
        created_at: app.created_at,
        my_participation: participation
          ? {
              id: participation.id,
              status: participation.status,
              claimed_tested_at: participation.claimed_tested_at,
              approved_at: participation.approved_at,
            }
          : null,
      };
    });

    return NextResponse.json({ apps: formatted, targetCount });
  } catch (error) {
    console.error("List apps error:", error);
    return NextResponse.json({ error: "Uygulamalar getirilemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Uygulama eklemek için lütfen giriş yapın." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, category, description, icon_url, opt_in_url, store_url, note_for_testers } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Uygulama adı zorunludur." },
        { status: 400 }
      );
    }

    if (!opt_in_url || typeof opt_in_url !== "string" || !opt_in_url.startsWith("http")) {
      return NextResponse.json(
        { error: "Geçerli bir Google Play test katılım bağlantısı girin." },
        { status: 400 }
      );
    }

    // System settings
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const cost = settings?.app_creation_cost ?? 10;
    const maxActive = settings?.max_active_apps_per_user ?? 5;
    const defaultTarget = settings?.target_tester_count ?? 20;

    // Check active app count limit
    const activeAppsCount = await prisma.app.count({
      where: { owner_id: currentUser.id, status: "ACTIVE" },
    });

    if (activeAppsCount >= maxActive) {
      return NextResponse.json(
        { error: `Aynı anda en fazla ${maxActive} aktif uygulamanız bulunabilir.` },
        { status: 400 }
      );
    }

    // Check user credit balance
    const userInDb = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { credit_balance: true },
    });

    if (!userInDb || userInDb.credit_balance < cost) {
      const missing = cost - (userInDb?.credit_balance ?? 0);
      return NextResponse.json(
        {
          error: `Uygulama eklemek için ${missing} krediye daha ihtiyacın var. Diğer uygulamaları test ederek kredi kazanabilirsin.`,
          required: cost,
          current: userInDb?.credit_balance ?? 0,
          missing,
        },
        { status: 400 }
      );
    }

    // Atomic transaction: Deduct credit, log transaction, create app
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct credit
      const updatedUser = await tx.user.update({
        where: { id: currentUser.id },
        data: {
          credit_balance: { decrement: cost },
        },
      });

      // 2. Create app
      const newApp = await tx.app.create({
        data: {
          owner_id: currentUser.id,
          name: name.trim(),
          category: category?.trim() || "Genel",
          description: description?.trim() || null,
          icon_url: icon_url || "/icons/brandlook.svg",
          opt_in_url: opt_in_url.trim(),
          store_url: store_url?.trim() || null,
          note_for_testers: note_for_testers?.trim() || null,
          target_tester_count: defaultTarget,
          current_tester_count: 0,
          status: "ACTIVE",
        },
      });

      // 3. Log credit transaction
      await tx.creditTransaction.create({
        data: {
          user_id: currentUser.id,
          app_id: newApp.id,
          amount: -cost,
          balance_after: updatedUser.credit_balance,
          transaction_type: "APP_PUBLISH",
          description: `Uygulama Yayınlama (${newApp.name})`,
        },
      });

      return { app: newApp, newBalance: updatedUser.credit_balance };
    });

    return NextResponse.json({
      success: true,
      app: result.app,
      newBalance: result.newBalance,
      message: `${name} başarıyla yayınlandı ve ${cost} kredi hesabınızdan düşüldü.`,
    });
  } catch (error) {
    console.error("Create app error:", error);
    return NextResponse.json(
      { error: "Uygulama oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}

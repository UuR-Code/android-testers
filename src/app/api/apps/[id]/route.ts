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
    const { name, category, description, icon_url, opt_in_url, store_url, note_for_testers, status } = body;

    const updated = await prisma.app.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(icon_url ? { icon_url } : {}),
        ...(opt_in_url ? { opt_in_url: opt_in_url.trim() } : {}),
        ...(store_url !== undefined ? { store_url: store_url?.trim() || null } : {}),
        ...(note_for_testers !== undefined ? { note_for_testers: note_for_testers?.trim() || null } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, app: updated });
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

    // Set to COMPLETED / PAUSED or delete
    await prisma.app.update({
      where: { id },
      data: { status: "PAUSED" },
    });

    return NextResponse.json({ success: true, message: "Uygulama yayından kaldırıldı." });
  } catch (error) {
    console.error("Delete app error:", error);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}

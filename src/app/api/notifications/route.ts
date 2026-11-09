import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await prisma.notification.findMany({
      where: { user_id: currentUser.id },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Bildirimler alınamadı" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { user_id: currentUser.id, is_read: false },
      data: { is_read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Bildirimler güncellenemedi" }, { status: 500 });
  }
}

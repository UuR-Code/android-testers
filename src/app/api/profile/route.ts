import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Lütfen giriş yapın." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        credit_balance: true,
        email_notifications: true,
        created_at: true,
        _count: {
          select: {
            apps: true,
            participations: true,
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Profil getirilemedi" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const { email_notifications, name } = body;

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(typeof email_notifications === "boolean" ? { email_notifications } : {}),
        ...(name ? { name: name.trim() } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credit_balance: true,
        email_notifications: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Profil güncellenemedi" }, { status: 500 });
  }
}

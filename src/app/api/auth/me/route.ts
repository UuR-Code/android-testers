import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const unreadNotifications = await prisma.notification.count({
      where: { user_id: user.id, is_read: false },
    });

    const ownedAppsCount = await prisma.app.count({
      where: { owner_id: user.id },
    });

    const participatedTestsCount = await prisma.testParticipation.count({
      where: { user_id: user.id },
    });

    return NextResponse.json({
      user: {
        ...user,
        unreadNotifications,
        ownedAppsCount,
        participatedTestsCount,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

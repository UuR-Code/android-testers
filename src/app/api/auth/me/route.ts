import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
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

    return NextResponse.json(
      {
        user: {
          ...user,
          unreadNotifications,
          ownedAppsCount,
          participatedTestsCount,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

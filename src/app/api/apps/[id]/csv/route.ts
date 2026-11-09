import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return new NextResponse("Yetkisiz erişim", { status: 401 });
    }

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true, owner_id: true, name: true },
    });

    if (!app) {
      return new NextResponse("Uygulama bulunamadı", { status: 404 });
    }

    // STRICT SECURITY: Only app owner or system ADMIN
    if (app.owner_id !== currentUser.id && currentUser.role !== "ADMIN") {
      return new NextResponse("Yetkisiz erişim", { status: 403 });
    }

    // Fetch all active/joined testers for this app (excluding rejected)
    const testers = await prisma.testParticipation.findMany({
      where: {
        app_id: appId,
        status: { not: "REJECTED" },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    // Google Play Console CSV format:
    // Header can be omitted or standard email list
    const emails = testers.map((t) => t.user.email);
    const csvContent = emails.join("\r\n");

    const sanitizedName = app.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const filename = `${sanitizedName}_play_console_testers.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);
    return new NextResponse("CSV oluşturulamadı", { status: 500 });
  }
}

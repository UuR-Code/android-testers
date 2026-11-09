import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Lütfen giriş yapın." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // 'all', 'ongoing', 'pending', 'completed'

    const participations = await prisma.testParticipation.findMany({
      where: {
        user_id: currentUser.id,
      },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            category: true,
            icon_url: true,
            opt_in_url: true,
            store_url: true,
            status: true,
          },
        },
      },
      orderBy: { joined_at: "desc" },
    });

    // Summary counters
    const totalJoined = participations.length;
    const totalApproved = participations.filter((p) => p.status === "APPROVED").length;
    const totalCreditsEarned = totalApproved * 1; // 1 credit per approved test

    // Filter list
    const filtered = participations.filter((p) => {
      if (filter === "ongoing") {
        return p.status === "JOINED" || p.status === "INVITED";
      }
      if (filter === "pending") {
        return p.status === "CLAIMED_TESTED";
      }
      if (filter === "completed") {
        return p.status === "APPROVED" || p.status === "REJECTED";
      }
      return true;
    });

    const formatted = filtered.map((p) => {
      // Calculate 14-day tracking from joined date
      const daysSinceJoined = Math.floor(
        (Date.now() - new Date(p.joined_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, 14 - daysSinceJoined);

      return {
        id: p.id,
        app_id: p.app.id,
        app_name: p.app.name,
        category: p.app.category,
        icon_url: p.app.icon_url || "/icons/brandlook.svg",
        opt_in_url: p.app.opt_in_url,
        store_url: p.app.store_url,
        status: p.status, // JOINED, INVITED, CLAIMED_TESTED, APPROVED, REJECTED
        joined_at: p.joined_at,
        invited_at: p.invited_at,
        claimed_tested_at: p.claimed_tested_at,
        approved_at: p.approved_at,
        feedback_type: p.feedback_type,
        feedback_text: p.feedback_text,
        rejection_reason: p.rejection_reason,
        earned_credits: p.status === "APPROVED" ? 1 : 0,
        days_remaining: daysRemaining,
        days_tested: daysSinceJoined,
      };
    });

    return NextResponse.json({
      summary: {
        total_joined: totalJoined,
        total_approved: totalApproved,
        total_credits_earned: totalCreditsEarned,
      },
      tests: formatted,
    });
  } catch (error) {
    console.error("My tests error:", error);
    return NextResponse.json({ error: "Testler getirilemedi" }, { status: 500 });
  }
}

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
            verification_question: true,
            google_group_url: true,
            target_reached_at: true,
            target_tester_count: true,
            current_tester_count: true,
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
      // 14-day tracking starts ONLY once target tester count is reached
      const isTargetReached = Boolean(p.app.target_reached_at) || p.app.current_tester_count >= p.app.target_tester_count;
      const targetReachedDate = p.app.target_reached_at ? new Date(p.app.target_reached_at) : null;
      const daysSinceTarget = targetReachedDate
        ? Math.floor((Date.now() - targetReachedDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const daysRemaining = isTargetReached ? Math.max(0, 14 - daysSinceTarget) : 14;
      const is14DaysCompleted = isTargetReached && daysRemaining === 0;

      return {
        id: p.id,
        app_id: p.app.id,
        app_name: p.app.name,
        category: p.app.category,
        icon_url: p.app.icon_url || "/icons/brandlook.svg",
        opt_in_url: p.app.opt_in_url,
        store_url: p.app.store_url,
        google_group_url: p.app.google_group_url,
        verification_question: p.app.verification_question,
        target_tester_count: p.app.target_tester_count,
        current_tester_count: p.app.current_tester_count,
        status: p.status, // JOINED, INVITED, CLAIMED_TESTED, APPROVED, REJECTED
        failed_attempts: p.failed_attempts,
        is_locked_out: p.is_locked_out,
        joined_at: p.joined_at,
        invited_at: p.invited_at,
        claimed_tested_at: p.claimed_tested_at,
        approved_at: p.approved_at,
        feedback_type: p.feedback_type,
        feedback_text: p.feedback_text,
        rejection_reason: p.rejection_reason,
        earned_credits: p.status === "APPROVED" ? 1 : 0,
        is_target_reached: isTargetReached,
        days_remaining: daysRemaining,
        days_tested: daysSinceTarget,
        is_14_days_completed: is14DaysCompleted,
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

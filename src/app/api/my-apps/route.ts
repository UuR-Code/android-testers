import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Lütfen giriş yapın." }, { status: 401 });
    }

    const apps = await prisma.app.findMany({
      where: { owner_id: currentUser.id },
      include: {
        participations: {
          select: {
            id: true,
            status: true,
            joined_at: true,
            claimed_tested_at: true,
            approved_at: true,
            feedback_type: true,
            feedback_text: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { joined_at: "desc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const formatted = apps.map((app) => {
      const approvedCount = app.participations.filter((p) => p.status === "APPROVED").length;
      const pendingCount = app.participations.filter(
        (p) => p.status === "CLAIMED_TESTED" || p.status === "JOINED" || p.status === "INVITED"
      ).length;

      const isTargetReached = Boolean(app.target_reached_at) || app.current_tester_count >= app.target_tester_count;
      const targetReachedDate = app.target_reached_at ? new Date(app.target_reached_at) : null;
      const daysSinceTarget = targetReachedDate
        ? Math.floor((Date.now() - targetReachedDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const daysRemaining = isTargetReached ? Math.max(0, 14 - daysSinceTarget) : 14;
      const is14DaysCompleted = isTargetReached && daysRemaining === 0;

      return {
        id: app.id,
        name: app.name,
        category: app.category,
        description: app.description,
        icon_url: app.icon_url || "/icons/brandlook.svg",
        opt_in_url: app.opt_in_url,
        store_url: app.store_url,
        google_group_url: app.google_group_url,
        verification_question: app.verification_question,
        verification_answer: app.verification_answer,
        note_for_testers: app.note_for_testers,
        target_reached_at: app.target_reached_at,
        status: app.status,
        target_tester_count: app.target_tester_count,
        current_tester_count: app.current_tester_count,
        approved_count: approvedCount,
        pending_count: pendingCount,
        is_target_reached: isTargetReached,
        days_remaining: daysRemaining,
        days_passed: daysSinceTarget,
        is_14_days_completed: is14DaysCompleted,
        created_at: app.created_at,
        participations: app.participations.map((p) => ({
          id: p.id,
          user_id: p.user.id,
          email: p.user.email,
          name: p.user.name,
          status: p.status,
          joined_at: p.joined_at,
          claimed_tested_at: p.claimed_tested_at,
          approved_at: p.approved_at,
          feedback_type: p.feedback_type,
          feedback_text: p.feedback_text,
        })),
      };
    });

    return NextResponse.json({ apps: formatted });
  } catch (error) {
    console.error("My apps error:", error);
    return NextResponse.json({ error: "Uygulamalar getirilemedi" }, { status: 500 });
  }
}

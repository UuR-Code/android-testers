import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      universal_google_group_email:
        settings?.universal_google_group_email || "android-test-havuzu@googlegroups.com",
      universal_google_group_url:
        settings?.universal_google_group_url || "https://groups.google.com/g/android-test-havuzu",
      app_creation_cost: settings?.app_creation_cost ?? 10,
      reward_per_approved_test: settings?.reward_per_approved_test ?? 1,
      target_tester_count: settings?.target_tester_count ?? 20,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({
      universal_google_group_email: "android-test-havuzu@googlegroups.com",
      universal_google_group_url: "https://groups.google.com/g/android-test-havuzu",
      app_creation_cost: 10,
      reward_per_approved_test: 1,
      target_tester_count: 20,
    });
  }
}

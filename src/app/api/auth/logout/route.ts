import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Çıkış yapılırken bir sorun oluştu." }, { status: 500 });
  }
}

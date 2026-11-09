import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidGmail } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Lütfen bir Gmail adresi girin." },
        { status: 400 }
      );
    }

    if (!isValidGmail(email)) {
      return NextResponse.json(
        { error: "Yalnızca geçerli @gmail.com uzantılı hesaplar kabul edilir." },
        { status: 400 }
      );
    }

    // Rate limit check: max 3 requests in the last 2 minutes for this email
    const recentOtps = await prisma.otpCode.count({
      where: {
        email,
        created_at: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Çok fazla kod talep ettiniz. Lütfen 1 dakika bekleyin." },
        { status: 429 }
      );
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpCode.create({
      data: {
        email,
        code,
        expires_at: expiresAt,
      },
    });

    // Send email
    const emailResult = await sendOtpEmail(email, code);

    return NextResponse.json({
      success: true,
      message: "Doğrulama kodu e-posta adresinize gönderildi.",
      // Include debug code in development or when simulated for instant pairing & testing
      debugCode: emailResult.simulated || process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Kod gönderilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

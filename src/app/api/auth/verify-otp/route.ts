import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie, isValidGmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.toString().trim();

    if (!email || !code) {
      return NextResponse.json(
        { error: "E-posta ve doğrulama kodu gereklidir." },
        { status: 400 }
      );
    }

    if (!isValidGmail(email)) {
      return NextResponse.json(
        { error: "Yalnızca @gmail.com adresleri geçerlidir." },
        { status: 400 }
      );
    }

    // Verify OTP code
    const validOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!validOtp) {
      return NextResponse.json(
        { error: "Doğrulama kodu geçersiz veya süresi dolmuş." },
        { status: 400 }
      );
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: validOtp.id },
      data: { used: true },
    });

    // Check if user exists or create new user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const defaultName = email.split("@")[0].replace(/[._]/g, " ");
      user = await prisma.user.create({
        data: {
          email,
          name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
          credit_balance: 0,
          role: email === "admin@gmail.com" ? "ADMIN" : "USER",
        },
      });
    }

    // Create session token and set cookie
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        credit_balance: user.credit_balance,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Doğrulama işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}

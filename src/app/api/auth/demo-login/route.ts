import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie, clearSessionCookie, isValidGmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "E-posta adresi gereklidir." },
        { status: 400 }
      );
    }

    if (!isValidGmail(email)) {
      return NextResponse.json(
        { error: "Yalnızca @gmail.com adresleri geçerlidir." },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const defaultName = email.split("@")[0].replace(/[._]/g, " ");
      user = await prisma.user.create({
        data: {
          email,
          name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
          credit_balance: email === "admin@gmail.com" ? 50 : 7,
          role: email === "admin@gmail.com" ? "ADMIN" : "USER",
        },
      });
    }

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
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Giriş başarısız oldu." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Çıkış yapılamadı" }, { status: 500 });
  }
}

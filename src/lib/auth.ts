import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "android-testers-fallback-secret-2026-key"
);

const COOKIE_NAME = "at_session_token";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credit_balance: number;
}

/**
 * Signs a JWT token valid for 30 days
 */
export async function signSessionToken(payload: { id: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Sets session cookie in the response
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  let isHttps = false;
  try {
    const headersList = await headers();
    const proto = headersList.get("x-forwarded-proto");
    const referer = headersList.get("referer");
    if (proto === "https" || referer?.startsWith("https://")) {
      isHttps = true;
    }
  } catch (e) {
    // fallback if headers() unavailable
  }

  // Allow explicit override via environment variable if desired
  if (process.env.COOKIE_SECURE === "true") {
    isHttps = true;
  } else if (process.env.COOKIE_SECURE === "false") {
    isHttps = false;
  }

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Retrieves the currently authenticated user from cookie
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credit_balance: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Validates that an email is a legitimate Gmail address (@gmail.com)
 */
export function isValidGmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailRegex.test(normalized);
}

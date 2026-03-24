import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function logSecurityEvent(
  type: "failed_login" | "login_success" | "rate_limited",
  ip: string,
  details?: string
) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return;
  try {
    await convex.mutation(api.security.logEvent, { secret, type, ip, details });
  } catch {
    // Logging mag nooit de login blokkeren
  }
}

function signSessionToken(sessionId: string): string {
  // Gebruik AUTH_SECRET als dedicated signing key — NOOIT het wachtwoord als sleutel gebruiken
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(sessionId);
  return `${sessionId}.${hmac.digest("hex")}`;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`admin:${ip}`, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    await logSecurityEvent("rate_limited", ip, "Admin login rate limit bereikt");
    return NextResponse.json(
      { error: "Te veel pogingen. Probeer het later opnieuw." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    const passwordMatch = password?.length === adminPassword.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

    if (!passwordMatch) {
      await logSecurityEvent("failed_login", ip, "Ongeldig wachtwoord ingevoerd");
    }

    if (passwordMatch) {
      const sessionId = crypto.randomUUID();
      const token = signSessionToken(sessionId);
      const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 uur

      // Sla admin sessie op in Convex
      try {
        await convex.mutation(api.adminAuth.createSession, {
          token: sessionId,
          expiresAt,
          secret: process.env.ADMIN_SESSION_SECRET || "",
        });
      } catch (err) {
        console.error("Failed to create admin session in Convex:", err);
        // Ga door - cookie-based auth werkt nog steeds
      }

      await logSecurityEvent("login_success", ip, "Succesvol ingelogd");

      const response = NextResponse.json({
        success: true,
        adminToken: sessionId,
      });
      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

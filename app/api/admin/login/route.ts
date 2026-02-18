import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function signSessionToken(sessionId: string): string {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("No signing secret configured");
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

    if (password === adminPassword) {
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

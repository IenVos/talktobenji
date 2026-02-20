import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.talktobenji.com";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 3, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!email || !userId) {
      return NextResponse.json({ error: "E-mailadres en userId zijn verplicht" }, { status: 400 });
    }

    // Genereer 6-cijferige OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minuten

    // Sla op in Convex
    await convex.mutation(api.credentials.createEmailVerificationToken, {
      secret,
      userId: userId as Id<"users">,
      email,
      hashedOtp,
      expiresAt,
    });

    // Verstuur e-mail via Resend
    await resend.emails.send({
      from: "Talk To Benji <noreply@talktobenji.com>",
      to: email,
      subject: "Bevestig je e-mailadres — Talk To Benji",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <img src="${appUrl}/images/benji-logo-2.png" alt="Benji" width="40" height="40" style="display: block; margin: 0 auto 16px;" />
          <h1 style="font-size: 20px; text-align: center; color: #1a1a2e; margin-bottom: 8px;">Bevestig je e-mailadres</h1>
          <p style="font-size: 14px; color: #555; text-align: center; line-height: 1.5;">
            Gebruik de code hieronder om je e-mailadres te bevestigen. De code is 10 minuten geldig.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: #f0f4ff; border: 1px solid #c7d4f0; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
            Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het later opnieuw." }, { status: 500 });
  }
}

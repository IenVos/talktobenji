import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Te veel pogingen. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

    if (!email || !otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Vul een geldige 6-cijferige code in" }, { status: 400 });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await convex.mutation(api.credentials.verifyEmailOtp, {
      secret,
      email,
      hashedOtp,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = (error as { message?: string })?.message || "";
    if (msg.includes("onjuist")) {
      return NextResponse.json({ error: "De code is onjuist. Probeer het opnieuw." }, { status: 400 });
    }
    if (msg.includes("verlopen")) {
      return NextResponse.json({ error: "De code is verlopen. Vraag een nieuwe aan." }, { status: 400 });
    }
    if (msg.includes("niet gevonden")) {
      return NextResponse.json({ error: "De code is verlopen. Vraag een nieuwe aan." }, { status: 400 });
    }
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}

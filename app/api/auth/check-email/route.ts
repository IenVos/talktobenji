import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { maxAttempts: 20, windowMs: 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ exists: false }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false });
    }

    const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
    if (!secret) return NextResponse.json({ exists: false });

    const cred = await fetchQuery(api.credentials.getCredentialsByEmail, {
      secret: secret.trim(),
      email: email.trim().toLowerCase(),
    });

    return NextResponse.json({ exists: !!cred });
  } catch {
    return NextResponse.json({ exists: false });
  }
}

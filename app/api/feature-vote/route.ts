import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Rate limit per IP tegen spam
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`feature-vote:${ip}`, { maxAttempts: 10, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } });
  }

  try {
    const { featureId } = await request.json();
    if (!featureId || typeof featureId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Haal userId server-side op — vertrouw nooit de client
    const session = await getServerSession(authOptions);
    const userId = session?.userId as string | undefined;

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    await fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "featureVotes:vote",
        args: { featureId, userId: userId ?? undefined },
        format: "json",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

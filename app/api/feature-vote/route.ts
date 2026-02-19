import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { featureId, userId } = await request.json();
    if (!featureId || typeof featureId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // Roep Convex mutation aan via HTTP API — geen gegenereerde types nodig
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

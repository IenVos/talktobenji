import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get("section");
  if (!section) return NextResponse.json({ features: [] });

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return NextResponse.json({ features: [] });

  try {
    const res = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "comingSoonFeatures:listBySection",
        args: { section },
        format: "json",
      }),
    });
    const data = await res.json();
    return NextResponse.json({ features: data.value ?? [] });
  } catch {
    return NextResponse.json({ features: [] });
  }
}

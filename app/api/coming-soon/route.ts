import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get("section");
  if (!section) return NextResponse.json({ features: [] });

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return NextResponse.json({ features: [] });

  // "all" → alle actieve wensen samen (voor de Aankomend-pagina).
  const isAll = section === "all";

  try {
    const res = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: isAll ? "comingSoonFeatures:listAllActive" : "comingSoonFeatures:listBySection",
        args: isAll ? {} : { section },
        format: "json",
      }),
    });
    const data = await res.json();
    return NextResponse.json({ features: data.value ?? [] });
  } catch {
    return NextResponse.json({ features: [] });
  }
}

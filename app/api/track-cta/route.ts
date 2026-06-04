import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Registreert een CTA-klik. Wordt aangeroepen via navigator.sendBeacon() zodat
 * de registratie ook doorgaat als de bezoeker meteen naar de checkout navigeert.
 * Het IP wordt hier server-side uit de request gehaald (geen aparte /api/my-ip nodig);
 * de trackButtonClick-mutatie sluit uitgesloten IP's nog steeds zelf uit.
 */
export async function POST(request: NextRequest) {
  try {
    const { path, buttonLabel, sessionId } = await request.json();
    if (typeof path !== "string" || typeof buttonLabel !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined;

    await convex.mutation(api.siteAnalytics.trackButtonClick, {
      path,
      buttonLabel,
      sessionId: typeof sessionId === "string" ? sessionId : "",
      ip: ip && ip !== "unknown" ? ip : undefined,
    });
  } catch {
    // Tracking mag de bezoeker nooit blokkeren — fouten stil negeren.
  }
  return NextResponse.json({ ok: true });
}

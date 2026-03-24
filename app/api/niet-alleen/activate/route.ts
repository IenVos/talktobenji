/**
 * Interne API route — wordt aangeroepen door de KennisShop webhook
 * om het Niet Alleen profiel aan te maken en de welkomstmail te sturen.
 */
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, naam, userId, webhookSecret } = body;

  const expectedSecret = process.env.KENNISSHOP_WEBHOOK_SECRET;
  const secretValid =
    expectedSecret &&
    typeof webhookSecret === "string" &&
    webhookSecret.length === expectedSecret.length &&
    crypto.timingSafeEqual(Buffer.from(webhookSecret), Buffer.from(expectedSecret));

  if (!secretValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!email || !naam || !userId) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  try {
    await convex.action(api.nietAlleen.activeerEnStuurWelkom, { userId, email, naam });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[niet-alleen/activate] Fout:", err?.message);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}

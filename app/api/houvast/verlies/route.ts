import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Keuze uit de algemene Even Houvast-opvolgreeks: de lead geeft aan welk verlies
// het is. We leggen dat vast op de houvastBrief en sturen door naar de juiste LP.
// Token = HMAC-SHA256(secret, email) (zelfde berekening als afmelden/opvolg).

const LP_PER_TYPE: Record<string, string> = {
  persoon: "/lp/je-mist-iemand",
  huisdier: "/lp/niet-alleen-voor-hulp-bij-verlies-van-huisdier",
  scheiding: "/lp/mijn-relatie-is-voorbij",
  eenzaamheid: "/lp/ik-voel-me-eenzaam",
  kinderloos: "/lp/ongewenst-kinderloos-die-pijn-gaat-nooit-weg",
};

const BASIS = "https://www.talktobenji.com";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("e")?.trim().toLowerCase() || "";
  const token = request.nextUrl.searchParams.get("t")?.trim() || "";
  const type = request.nextUrl.searchParams.get("type")?.trim() || "";
  const secret = process.env.ADMIN_SESSION_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const lp = LP_PER_TYPE[type];
  // Bij een ongeldige link sturen we toch zacht door naar de algemene LP.
  const fallback = `${BASIS}/lp/je-hoeft-het-niet-alleen-te-doen`;

  if (!email || !token || !lp || !secret || !convexUrl) {
    return NextResponse.redirect(lp ? `${BASIS}${lp}` : fallback);
  }

  const verwacht = createHmac("sha256", secret).update(email).digest("hex").slice(0, 24);
  if (token !== verwacht) {
    // Token klopt niet: niet vastleggen, wel doorsturen naar de gekozen LP.
    return NextResponse.redirect(`${BASIS}${lp}`);
  }

  try {
    await fetchMutation(api.evenHouvastOpvolg.setVerliesType, { email, type, secret }, { url: convexUrl });
  } catch {
    // Vastleggen mislukt: doorsturen mag toch doorgaan.
  }

  return NextResponse.redirect(`${BASIS}${lp}`);
}

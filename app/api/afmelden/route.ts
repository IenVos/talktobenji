import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { unsubscribeFromMailerLite } from "@/lib/mailerlite";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Afmeldlink uit de Even Houvast-opvolgmails. Token = HMAC-SHA256(secret, email)
// (zelfde berekening als in convex/evenHouvastOpvolg.ts).
function bevestigingsPagina(titel: string, tekst: string): NextResponse {
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titel}</title></head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background:#fdf9f4; color:#3d3530; margin:0;">
    <div style="max-width:480px; margin:0 auto; padding:64px 24px; text-align:center;">
      <h1 style="font-size:20px; font-weight:600;">${titel}</h1>
      <p style="font-size:15px; line-height:1.7; color:#6b6460;">${tekst}</p>
      <p style="margin-top:32px;"><a href="https://www.talktobenji.com" style="color:#6d84a8;">Terug naar Talk To Benji</a></p>
    </div>
  </body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("e")?.trim().toLowerCase() || "";
  const token = request.nextUrl.searchParams.get("t")?.trim() || "";
  const secret = process.env.ADMIN_SESSION_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!email || !token || !secret || !convexUrl) {
    return bevestigingsPagina("Er ging iets mis", "Deze afmeldlink is ongeldig. Mail ons gerust via contactmetien@talktobenji.com.");
  }

  const verwacht = createHmac("sha256", secret).update(email).digest("hex").slice(0, 24);
  if (token !== verwacht) {
    return bevestigingsPagina("Er ging iets mis", "Deze afmeldlink is ongeldig of verlopen. Mail ons gerust via contactmetien@talktobenji.com.");
  }

  try {
    await fetchMutation(api.evenHouvastOpvolg.registreerAfmelding, { email, secret }, { url: convexUrl });
  } catch {
    return bevestigingsPagina("Er ging iets mis", "We konden je afmelding niet verwerken. Probeer het later opnieuw of mail contactmetien@talktobenji.com.");
  }

  // Ook in MailerLite op "unsubscribed" zetten, zodat deze persoon geen campagnes of
  // automations meer krijgt. Mag de bevestiging nooit breken: alleen loggen bij falen.
  await unsubscribeFromMailerLite({ email, context: "EH-afmelding" }).catch(() => false);

  return bevestigingsPagina(
    "Je bent afgemeld",
    "Je ontvangt geen opvolgmails meer van Even Houvast. Wat je eerder bewaarde, blijft van jou. Het ga je goed."
  );
}

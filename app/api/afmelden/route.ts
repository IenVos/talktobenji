import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Afmeldlink uit de Even Houvast-opvolgmails. Token = HMAC-SHA256(secret, email)
// (zelfde berekening als in convex/evenHouvastOpvolg.ts).

// Zachte landing na de afmelding: de mails stoppen, maar Benji blijft welkom. Eén
// klik, geen formulier, geen wachtwoord. benjiUrl is de persoonlijke één-klik-link.
function benjiKaart(benjiUrl: string): string {
  return `<div style="margin:36px 0 8px; background:#ffffff; border:1px solid #e7ded1; border-radius:16px; padding:26px 22px;">
      <p style="font-size:16px; font-weight:700; color:#3d3530; margin:0 0 8px;">Benji blijft er wél voor je</p>
      <p style="font-size:14px; line-height:1.65; color:#6b6460; margin:0 0 18px;">Geen mails meer, dat is goed. Maar je bent altijd welkom om je verhaal kwijt te kunnen bij Benji, wanneer jij wilt. Ook midden in de nacht. De eerste 7 dagen zijn gratis.</p>
      <a href="${benjiUrl}" style="display:inline-block; background:#fdf9f4; color:#9a8168; border:1.5px solid #9a8168; padding:11px 24px; border-radius:12px; font-weight:600; font-size:15px; text-decoration:none;">Maak kennis met Benji &rarr;</a>
      <p style="font-size:12px; line-height:1.5; color:#9a938c; margin:14px 0 0;">Geen formulier, geen wachtwoord.</p>
    </div>`;
}

function bevestigingsPagina(titel: string, tekst: string, benjiUrl?: string): NextResponse {
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titel}</title></head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background:#fdf9f4; color:#3d3530; margin:0;">
    <div style="max-width:480px; margin:0 auto; padding:64px 24px; text-align:center;">
      <h1 style="font-size:20px; font-weight:600;">${titel}</h1>
      <p style="font-size:15px; line-height:1.7; color:#6b6460;">${tekst}</p>
      ${benjiUrl ? benjiKaart(benjiUrl) : ""}
      <p style="margin-top:32px;"><a href="https://www.talktobenji.com" style="color:#6d84a8;">Terug naar Talk To Benji</a></p>
    </div>
  </body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: NextRequest) {
  // Voorbeeldweergave om het scherm te bekijken zonder echte afmelding of toegang.
  // Toont de bevestiging met de Benji-kaart en een niet-werkende voorbeeldknop.
  if (request.nextUrl.searchParams.get("preview") === "1") {
    return bevestigingsPagina(
      "Je bent afgemeld",
      "Je ontvangt geen opvolgmails meer van Even Houvast. Wat je eerder bewaarde, blijft van jou. Het ga je goed.",
      "https://www.talktobenji.com/benji-start?token=voorbeeld"
    );
  }

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

  // bron=checkout komt uit de herinneringsmail voor een niet-afgeronde bestelling.
  // Dan willen we alleen díe herinneringen stoppen, niet de Even Houvast-mails.
  const bron = request.nextUrl.searchParams.get("bron")?.trim() || "";

  try {
    if (bron === "checkout") {
      await fetchMutation(api.checkoutHerstel.afmelden, { email, secret }, { url: convexUrl });
      return bevestigingsPagina(
        "Je bent afgemeld",
        "We herinneren je niet meer aan je bestelling. Wil je later toch verder, dan ben je van harte welkom."
      );
    }
    // m = uit welke mail de link kwam ("brief" of mailnummer), type = verliestype.
    // Daarmee zie je in de admin bij welke mail mensen afhaken.
    const mail = request.nextUrl.searchParams.get("m")?.trim() || undefined;
    const verliestype = request.nextUrl.searchParams.get("type")?.trim() || undefined;
    await fetchMutation(
      api.evenHouvastOpvolg.registreerAfmelding,
      { email, secret, mail, verliestype },
      { url: convexUrl }
    );
  } catch {
    return bevestigingsPagina("Er ging iets mis", "We konden je afmelding niet verwerken. Probeer het later opnieuw of mail contactmetien@talktobenji.com.");
  }

  // Zachte landing: de mails stoppen, maar we bieden Benji nog aan met een
  // persoonlijke één-klik-link. Lukt het token maken niet, dan tonen we gewoon de
  // bevestiging zonder kaart (de afmelding zelf is al gelukt).
  let benjiUrl: string | undefined;
  try {
    const benjiToken = await fetchMutation(
      api.benjiStart.genereerTokenNaAfmelding,
      { email, secret },
      { url: convexUrl }
    );
    if (benjiToken) benjiUrl = `https://www.talktobenji.com/benji-start?token=${benjiToken}`;
  } catch {
    // stil: afmelding is gelukt, alleen het aanbod tonen we dan niet
  }

  return bevestigingsPagina(
    "Je bent afgemeld",
    "Je ontvangt geen opvolgmails meer van Even Houvast. Wat je eerder bewaarde, blijft van jou. Het ga je goed.",
    benjiUrl
  );
}

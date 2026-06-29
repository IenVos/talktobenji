/**
 * Gedeelde footer + helpers voor álle Even Houvast-mails (de brief én de
 * opvolgreeks), zodat ze onderaan exact hetzelfde zijn:
 *   - licht Talk To Benji-logo
 *   - link "Niet Alleen voor jou" (per verliestype)
 *   - uitnodiging om gewoon te antwoorden (geen e-mailadres meer)
 *   - wat ruimte, en daaronder de afmeldlink
 */

export function appBase(): string {
  // www = het canonieke domein (apex 307-redirect naar www). Maillinks dus direct
  // naar www, geen redirect-hop. Env APP_URL kan dit overschrijven.
  return (process.env.APP_URL || "https://www.talktobenji.com").replace(/\/+$/, "");
}

// Niet Alleen-landingspagina per verliestype (zelfde paden als de mail-defaults).
const NIET_ALLEEN_LP: Record<string, string> = {
  persoon: "/lp/je-mist-iemand",
  huisdier: "/lp/niet-alleen-voor-hulp-bij-verlies-van-huisdier",
  scheiding: "/lp/mijn-relatie-is-voorbij",
  eenzaamheid: "/lp/ik-voel-me-eenzaam",
  kinderloos: "/lp/ongewenst-kinderloos-die-pijn-gaat-nooit-weg",
  algemeen: "/lp/je-hoeft-het-niet-alleen-te-doen",
};

export function nietAlleenUrlVoorType(type: string): string {
  return `${appBase()}${NIET_ALLEEN_LP[type] ?? NIET_ALLEEN_LP.algemeen}`;
}

// HMAC-token voor de afmeldlink (gelijk berekend in /api/afmelden, Node-kant).
export async function ehAfmeldToken(email: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export async function ehAfmeldUrl(email: string): Promise<string> {
  const token = await ehAfmeldToken(email);
  return `${appBase()}/api/afmelden?e=${encodeURIComponent(email)}&t=${token}`;
}

// De vaste footer onder elke EH-mail. nietAlleenUrl = per type; afmeldUrl = met token.
export function ehFooter(nietAlleenUrl: string, afmeldUrl: string): string {
  return `
    <div style="text-align:center;margin-top:48px;">
      <img src="https://www.talktobenji.com/images/benji-logo-2.png" alt="Talk To Benji" width="46" height="46" style="display:inline-block;width:46px;height:46px;margin:0 0 12px 0;" />
      <p style="font-size:14px;font-weight:600;color:#3d3530;margin:0;">
        <a href="${nietAlleenUrl}" style="color:#6d84a8;text-decoration:underline;">Niet Alleen voor jou</a>
      </p>
      <p style="font-size:13px;color:#718096;margin:7px 0 0 0;">
        Heb je vragen? Beantwoord gewoon deze mail.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#a0aec0;margin:30px 0 0 0;border-top:1px solid #ece5dc;padding-top:16px;">
        <a href="${afmeldUrl}" style="color:#a0aec0;text-decoration:underline;">Geen opvolgmails meer ontvangen</a>
      </p>
    </div>`;
}

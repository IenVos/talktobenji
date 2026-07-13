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

// ── Opmaak van de mails van Ien ───────────────────────────────────────────────
// Dezelfde romp, knop en handtekening voor élke mail die van Ien komt, zodat ze
// er allemaal hetzelfde uitzien. (De opvolgreeks gebruikt dit ook.)

export function mailAlinea(p: string): string {
  return `<p style="font-size: 15px; line-height: 1.8; color: #4a5568;">${p.trim().replace(/\n/g, "<br/>")}</p>`;
}

export function mailKnop(tekst: string, url: string): string {
  return `
    <div style="margin: 28px 0;">
      <a href="${url}" style="background-color: #6d84a8; color: white; padding: 13px 26px;
         border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
        ${tekst}
      </a>
    </div>`;
}

export function mailHandtekeningIen(): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="padding-right: 14px; vertical-align: middle;">
          <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="52" height="52"
            style="border-radius: 50%; display: block; width: 52px; height: 52px; object-fit: cover;" />
        </td>
        <td style="vertical-align: middle;">
          <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0;">Ien</p>
          <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0;">Founder van Talk To Benji</p>
        </td>
      </tr>
    </table>`;
}

export function mailWrapper(inhoud: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 560px; margin: 0 auto; color: #2d3748; background: #fdf9f4; padding: 32px 24px;">
      ${inhoud}
    </div>`;
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

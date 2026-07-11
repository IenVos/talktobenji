import { Resend } from "resend";

/**
 * Waarschuwingsmail als een aanmelding NIET in MailerLite terechtkomt.
 *
 * Waarom: in juli 2026 liep het MailerLite-plan vol. MailerLite weigerde toen elke
 * nieuwe subscriber met "413 — subscriber limit", maar de bezoeker kreeg gewoon
 * "gelukt" te zien en de fout verdween in de serverlogs. Zo zijn 31 leads pas na
 * twee weken opgemerkt. Deze mail maakt zo'n stille mislukking direct zichtbaar:
 * de lead staat er compleet in, zodat die desnoods handmatig toegevoegd kan worden.
 */
async function meldMislukking(opts: {
  email: string;
  name?: string;
  context: string;
  reden: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "TalkToBenji <noreply@talktobenji.com>",
      to: adminEmail,
      subject: `⚠️ Lead niet in MailerLite: ${opts.email}`,
      html: `<div style="font-family:system-ui,sans-serif;padding:24px;color:#2d3748;">
        <p style="font-size:18px;font-weight:700;margin:0 0 12px 0;">Een aanmelding is NIET in MailerLite gezet</p>
        <p style="font-size:14px;margin:0 0 16px 0;color:#4a5568;">
          Deze persoon heeft zich wel aangemeld en haar mail gekregen, maar staat niet op de lijst.
          Voeg haar handmatig toe in MailerLite, of los de oorzaak hieronder op.
        </p>
        <table style="font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#718096;padding:3px 12px 3px 0;">E-mail</td><td style="font-weight:600;">${opts.email}</td></tr>
          <tr><td style="color:#718096;padding:3px 12px 3px 0;">Naam</td><td>${opts.name || "—"}</td></tr>
          <tr><td style="color:#718096;padding:3px 12px 3px 0;">Waar</td><td>${opts.context}</td></tr>
          <tr><td style="color:#718096;padding:3px 12px 3px 0;">Reden</td><td style="color:#c53030;">${opts.reden}</td></tr>
          <tr><td style="color:#718096;padding:3px 12px 3px 0;">Tijdstip</td><td>${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}</td></tr>
        </table>
        <p style="font-size:13px;margin:16px 0 0 0;color:#718096;">
          Staat er "subscriber limit" bij de reden? Dan zit je MailerLite-plan vol en lopen ALLE
          nieuwe leads mis totdat je upgradet of ruimte maakt.
        </p>
      </div>`,
    });
  } catch (err: any) {
    console.error(`[MailerLite] waarschuwingsmail versturen mislukt —`, err?.message);
  }
}

/**
 * Robuuste MailerLite-koppeling: voegt een subscriber toe aan een of meer groepen.
 *
 * Waarom deze helper bestaat: eerder werd `fetch(...).catch()` gebruikt zonder
 * de HTTP-status te checken. Een 4xx/5xx van MailerLite werd dan stil genegeerd,
 * waardoor aanmelders ongemerkt NIET op de lijst belandden (en dus ook geen
 * automation triggerden). Deze helper:
 *   - controleert `response.ok`,
 *   - logt status + foutmelding bij falen (zichtbaar in de serverlogs),
 *   - probeert 1x opnieuw bij een tijdelijke fout (429 / 5xx / netwerk),
 *   - mailt de admin zodra een lead definitief niet op de lijst komt,
 *   - geeft true/false terug zodat de aanroeper kan reageren.
 */
export async function addToMailerLite(opts: {
  email: string;
  name?: string;
  groups: string[];
  context: string;
}): Promise<boolean> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error(`[MailerLite] ${opts.context}: MAILERLITE_API_KEY ontbreekt — overgeslagen`);
    await meldMislukking({ ...opts, reden: "MAILERLITE_API_KEY ontbreekt op de server" });
    return false;
  }
  if (!opts.groups.length || opts.groups.some((g) => !g)) {
    console.error(`[MailerLite] ${opts.context}: geen geldige groep ingesteld — overgeslagen`);
    await meldMislukking({ ...opts, reden: "geen geldige MailerLite-groep ingesteld (env-variabele leeg?)" });
    return false;
  }

  const body = JSON.stringify({
    email: opts.email,
    fields: { name: opts.name ?? "" },
    groups: opts.groups,
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body,
      });

      if (res.ok) return true;

      const detail = await res.text().catch(() => "");
      // 4xx (behalve rate-limit) is een permanente fout — niet opnieuw proberen.
      if (res.status < 500 && res.status !== 429) {
        console.error(`[MailerLite] ${opts.context}: ${opts.email} geweigerd — status ${res.status} ${detail}`);
        await meldMislukking({ ...opts, reden: `MailerLite weigerde de aanmelding — status ${res.status}: ${detail.slice(0, 200)}` });
        return false;
      }
      console.warn(`[MailerLite] ${opts.context}: poging ${attempt} status ${res.status} — opnieuw proberen`);
    } catch (err) {
      console.warn(`[MailerLite] ${opts.context}: poging ${attempt} netwerkfout —`, err);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
  }

  console.error(`[MailerLite] ${opts.context}: ${opts.email} DEFINITIEF mislukt na retries — handmatig toevoegen`);
  await meldMislukking({ ...opts, reden: "MailerLite bleef onbereikbaar of gaf een serverfout, ook na opnieuw proberen" });
  return false;
}

/**
 * Zet een subscriber in MailerLite op "unsubscribed", zodat die geen campagnes of
 * automations meer ontvangt. Gebruikt de upsert-endpoint met `status`, dezelfde
 * robuustheid als `addToMailerLite` (status checken, 1x retry, loggen). Bestaat de
 * subscriber nog niet, dan wordt die als "unsubscribed" vastgelegd (suppressie),
 * wat precies de bedoeling is: deze persoon nooit meer benaderen.
 */
export async function unsubscribeFromMailerLite(opts: {
  email: string;
  context: string;
}): Promise<boolean> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error(`[MailerLite] ${opts.context}: MAILERLITE_API_KEY ontbreekt — afmelding niet doorgezet`);
    return false;
  }

  const body = JSON.stringify({ email: opts.email, status: "unsubscribed" });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body,
      });

      if (res.ok) return true;

      const detail = await res.text().catch(() => "");
      if (res.status < 500 && res.status !== 429) {
        console.error(`[MailerLite] ${opts.context}: afmelden ${opts.email} geweigerd — status ${res.status} ${detail}`);
        return false;
      }
      console.warn(`[MailerLite] ${opts.context}: afmelden poging ${attempt} status ${res.status} — opnieuw proberen`);
    } catch (err) {
      console.warn(`[MailerLite] ${opts.context}: afmelden poging ${attempt} netwerkfout —`, err);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
  }

  console.error(`[MailerLite] ${opts.context}: afmelden ${opts.email} DEFINITIEF mislukt na retries — handmatig afmelden in MailerLite`);
  return false;
}

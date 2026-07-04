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
    return false;
  }
  if (!opts.groups.length || opts.groups.some((g) => !g)) {
    console.error(`[MailerLite] ${opts.context}: geen geldige groep ingesteld — overgeslagen`);
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
        return false;
      }
      console.warn(`[MailerLite] ${opts.context}: poging ${attempt} status ${res.status} — opnieuw proberen`);
    } catch (err) {
      console.warn(`[MailerLite] ${opts.context}: poging ${attempt} netwerkfout —`, err);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
  }

  console.error(`[MailerLite] ${opts.context}: ${opts.email} DEFINITIEF mislukt na retries — handmatig toevoegen`);
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

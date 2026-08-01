/**
 * Waar wordt elke checkout gebruikt? Voor de checkout-beheerpagina: per checkout-slug
 * een lijst van vindplaatsen, zodat je ziet of een checkout in gebruik is (LP, mail of
 * funnel) en met welke naam. Is de lijst leeg, dan verwijst niets ernaar en kan die
 * checkout veilig uit of weg.
 *
 * Bronnen die gescand worden:
 *  - landingPages: hoofd-CTA, footer-CTA en de per-type-CTA's.
 *  - emailTemplates (opgeslagen mails) + DEFAULT_TEMPLATES (code-defaults voor mails
 *    die niet in de admin zijn overschreven, o.a. de verleng-mails jaar/kwartaal).
 *  - nietAlleenDagTemplates (de 30 dagmails per type).
 *  - funnelMails (evergreen), funnelLosseMails en losseMails (vrije mails).
 *  - de vaste proef-eind mail (hardcoded → /betalen/maand).
 *  - de Even Houvast-ervaren-funnel (de 6 kale betaalpagina's, zie kaalBetaalpaginas.ts).
 */
import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
import { DEFAULT_TEMPLATES } from "./emailTemplatesDefaults";

type Usage = { soort: "lp" | "mail" | "funnel"; label: string; url?: string };

// Vaste mapping van de kale EH-ervaren-funnel (bron: kaalBetaalpaginas.ts).
const KAAL_FUNNEL: Record<string, string> = {
  "even-houvast-huisdier-betalen": "EH-ervaren-funnel · huisdier",
  "even-houvast-persoon-betalen": "EH-ervaren-funnel · persoon",
  "even-houvast-scheiding-betalen": "EH-ervaren-funnel · scheiding",
  "even-houvast-eenzaamheid-betalen": "EH-ervaren-funnel · eenzaamheid",
  "even-houvast-kinderloos-betalen": "EH-ervaren-funnel · kinderloos",
  "even-houvast-algemeen-betalen": "EH-ervaren-funnel · algemeen",
};

function mailLabel(key: string, subject?: string): string {
  const s = subject ? ` — ${subject}` : "";
  const laatste = key.slice(-1);
  if (key.startsWith("eh_")) {
    const delen = key.split("_"); // eh_<type>_<n>
    return `EH ${delen[1]} · mail ${delen[2]}${s}`;
  }
  if (key.startsWith("renewal_maand_")) return `Verleng-mail maand ${laatste}${s}`;
  if (key.startsWith("renewal_kwartaal_")) return `Verleng-mail kwartaal ${laatste}${s}`;
  if (key.startsWith("renewal_jaar_")) return `Verleng-mail jaar ${laatste}${s}`;
  if (key.startsWith("renewal_email")) return `Verleng-mail jaar (oud) ${laatste}${s}`;
  if (key.startsWith("niet_alleen_")) return `Niet Alleen · ${key.replace("niet_alleen_", "")}${s}`;
  if (key.startsWith("trial_")) return `Trial-mail ${key.replace("trial_", "")}${s}`;
  if (key.startsWith("concept_")) return `Concept-mail · ${key.replace("concept_", "")}${s}`;
  if (key.startsWith("gift_")) return `Cadeau-mail · ${key.replace("gift_", "")}${s}`;
  return `${key}${s}`;
}

async function berekenGebruik(ctx: QueryCtx): Promise<Record<string, Usage[]>> {
    const checkouts = await ctx.db.query("checkoutProducts").collect();
    const geldig = new Set(checkouts.map((c) => c.slug));
    const result: Record<string, Usage[]> = {};
    for (const c of checkouts) result[c.slug] = [];

    // Welke bestaande checkout-slugs komen in deze teksten voor?
    // Herkent zowel volledige /betalen/<slug>-links als een kaal opgeslagen slug.
    const vindSlugs = (...teksten: (string | undefined | null)[]): string[] => {
      const found = new Set<string>();
      for (const t of teksten) {
        if (!t) continue;
        const re = /\/betalen\/([a-z0-9-]+)/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(t))) if (geldig.has(m[1])) found.add(m[1]);
        const kaal = t.trim();
        if (geldig.has(kaal)) found.add(kaal);
      }
      return [...found];
    };
    const voegToe = (slug: string, u: Usage) => {
      const lijst = result[slug];
      if (!lijst) return;
      if (!lijst.some((x) => x.soort === u.soort && x.label === u.label)) lijst.push(u);
    };

    // 1. Landingspagina's
    const lps = await ctx.db.query("landingPages").collect();
    for (const l of lps as any[]) {
      const slugs = vindSlugs(
        l.ctaUrl, l.footerCtaUrl,
        l.typeCtaUrlPersoon, l.typeCtaUrlHuisdier, l.typeCtaUrlRelatie,
        l.typeCtaUrlEenzaamheid, l.typeCtaUrlKinderloos,
      );
      for (const s of slugs) voegToe(s, { soort: "lp", label: `/lp/${l.slug}`, url: `/lp/${l.slug}` });
    }

    // 2a. Opgeslagen mail-templates
    const templates = await ctx.db.query("emailTemplates").collect();
    const gedekt = new Set<string>();
    for (const t of templates as any[]) {
      gedekt.add(t.key);
      for (const s of vindSlugs(t.buttonUrl, t.upsellUrl, t.bodyText)) {
        voegToe(s, { soort: "mail", label: mailLabel(t.key, t.subject) });
      }
    }
    // 2b. Code-defaults voor niet-overschreven mails (o.a. verleng-mails)
    for (const [key, def] of Object.entries(DEFAULT_TEMPLATES as Record<string, any>)) {
      if (gedekt.has(key)) continue;
      for (const s of vindSlugs(def.buttonUrl, def.upsellUrl, def.bodyText)) {
        voegToe(s, { soort: "mail", label: mailLabel(key, def.subject) });
      }
    }
    // 2c. Niet Alleen dagmails
    const naDag = await ctx.db.query("nietAlleenDagTemplates").collect();
    for (const t of naDag as any[]) {
      for (const s of vindSlugs(t.mailTekst)) {
        voegToe(s, { soort: "mail", label: `Niet Alleen dag ${t.dag} (${t.verliesType})` });
      }
    }
    // 2d. Vrije mails: evergreen, funnel-losse, losse
    for (const m of (await ctx.db.query("funnelMails").collect()) as any[]) {
      for (const s of vindSlugs(m.buttonUrl, m.bodyText)) voegToe(s, { soort: "mail", label: `Evergreen · ${m.subject}` });
    }
    for (const m of (await ctx.db.query("funnelLosseMails").collect()) as any[]) {
      for (const s of vindSlugs(m.buttonUrl, m.bodyText)) voegToe(s, { soort: "mail", label: `Funnel losse mail · ${m.subject}` });
    }
    for (const m of (await ctx.db.query("losseMails").collect()) as any[]) {
      for (const s of vindSlugs(m.buttonUrl, m.bodyText)) voegToe(s, { soort: "mail", label: `Losse mail · ${m.subject}` });
    }
    // 2e. Vaste proef-eind mail (hardcoded in emails.ts → /betalen/maand)
    if (geldig.has("maand")) {
      voegToe("maand", { soort: "mail", label: "Proef-eind mail — Morgen stopt je week met Benji" });
    }

    // 3. Even Houvast-ervaren-funnel (kale betaalpagina's)
    for (const [slug, label] of Object.entries(KAAL_FUNNEL)) {
      if (geldig.has(slug)) voegToe(slug, { soort: "funnel", label });
    }

    for (const k of Object.keys(result)) {
      result[k].sort((a, b) => a.soort.localeCompare(b.soort) || a.label.localeCompare(b.label));
    }
    return result;
}

export const perCheckout = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args): Promise<Record<string, Usage[]>> => {
    await checkAdmin(ctx, args.adminToken);
    return await berekenGebruik(ctx);
  },
});

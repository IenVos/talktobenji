/**
 * Zet de Benji-abonnementsproducten goed zodat de flow klopt:
 *  - accessDays: maand=30, 3-maanden=90, 6-maanden=180, maand-proef(€7)=30.
 *    (De webhook geeft toegang voor accessDays; zonder waarde viel dat terug op 365.)
 *  - 6-maanden: subscriptionType -> "halfjaar_toegang", zodat billingPeriod
 *    "half_yearly" wordt en de juiste (6-maanden) verlengmails vertrekken i.p.v.
 *    de kwartaal-reeks.
 *  - Opgeslagen verlengmail-templates: oude /betalen/kwartaal|halfjaar-links
 *    vervangen door /betalen/3-maanden|6-maanden (defaults staan al goed in code).
 *
 * Draai: npx convex run fixBenjiProductenSeed:fix
 * Re-runbaar.
 */
import { internalMutation } from "./_generated/server";

const PRODUCTEN: { slug: string; accessDays: number; subscriptionType?: string }[] = [
  { slug: "maand", accessDays: 30 },
  { slug: "maand-proef", accessDays: 30 },
  { slug: "3-maanden", accessDays: 90 },
  { slug: "6-maanden", accessDays: 180, subscriptionType: "halfjaar_toegang" },
];

export const fix = internalMutation({
  args: {},
  handler: async (ctx) => {
    const resultaat: { doel: string; actie: string }[] = [];

    // 1) Producten: accessDays + (voor 6-maanden) subscriptionType.
    for (const p of PRODUCTEN) {
      const doc = await ctx.db
        .query("checkoutProducts")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .first();
      if (!doc) {
        resultaat.push({ doel: p.slug, actie: "niet gevonden" });
        continue;
      }
      const patch: any = { accessDays: p.accessDays };
      if (p.subscriptionType) patch.subscriptionType = p.subscriptionType;
      await ctx.db.patch(doc._id, patch);
      resultaat.push({
        doel: p.slug,
        actie: `accessDays=${p.accessDays}${p.subscriptionType ? `, type=${p.subscriptionType}` : ""}`,
      });
    }

    // 2) Opgeslagen verlengmail-templates: oude betaal-links vervangen.
    const alle = await ctx.db.query("emailTemplates").collect();
    const vervang = (u?: string) =>
      (u ?? "")
        .replace("/betalen/kwartaal", "/betalen/3-maanden")
        .replace("/betalen/halfjaar", "/betalen/6-maanden");
    for (const t of alle) {
      if (!t.key.startsWith("renewal_")) continue;
      const nieuwButton = vervang(t.buttonUrl);
      const nieuwUpsell = vervang(t.upsellUrl);
      if (nieuwButton !== (t.buttonUrl ?? "") || nieuwUpsell !== (t.upsellUrl ?? "")) {
        const patch: any = { updatedAt: Date.now() };
        if (t.buttonUrl !== undefined) patch.buttonUrl = nieuwButton;
        if (t.upsellUrl !== undefined) patch.upsellUrl = nieuwUpsell;
        await ctx.db.patch(t._id, patch);
        resultaat.push({ doel: `template ${t.key}`, actie: "link bijgewerkt" });
      }
    }

    return resultaat;
  },
});

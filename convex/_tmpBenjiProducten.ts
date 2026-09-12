/**
 * Tijdelijk leeslijstje: welke checkout-producten bestaan er, met slug + prijs?
 * Draai: npx convex run _tmpBenjiProducten:lijst
 * (Mag na de diagnose weer weg.)
 */
import { internalQuery } from "./_generated/server";

export const lijst = internalQuery({
  args: {},
  handler: async (ctx) => {
    const producten = await ctx.db.query("checkoutProducts").collect();
    return producten
      .map((p) => ({
        slug: p.slug,
        naam: p.name,
        prijs: `€${(p.priceInCents / 100).toFixed(2)}`,
        subscriptionType: p.subscriptionType,
        stripe: p.stripePriceId ? "ja" : "nee",
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  },
});

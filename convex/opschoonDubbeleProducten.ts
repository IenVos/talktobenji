/**
 * Ruimt de oude dubbele Benji-checkoutproducten op die nergens meer in code
 * gebruikt worden (de actieve zijn: maand / 3-maanden / 6-maanden / maand-proef).
 *
 * Draai: npx convex run opschoonDubbeleProducten:opschonen
 * Verwijdert ALLEEN de exact genoemde slugs, als ze bestaan.
 */
import { internalMutation } from "./_generated/server";

const TE_VERWIJDEREN = ["benji-3-maanden", "benji-6-maanden"];

export const opschonen = internalMutation({
  args: {},
  handler: async (ctx) => {
    const resultaat: { slug: string; actie: string }[] = [];
    for (const slug of TE_VERWIJDEREN) {
      const doc = await ctx.db
        .query("checkoutProducts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!doc) {
        resultaat.push({ slug, actie: "bestond al niet meer" });
        continue;
      }
      await ctx.db.delete(doc._id);
      resultaat.push({ slug, actie: "verwijderd" });
    }
    return resultaat;
  },
});

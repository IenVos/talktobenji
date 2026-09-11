/**
 * Eén algemene Niet Alleen-checkout voor alle verliestypes.
 *
 * - maakAlgemeenNAProduct: dupliceert een bestaand NA-product naar slug
 *   "niet-alleen-programma" met LEEG verliesType. Het verliestype komt dan uit
 *   de LP-link (?type=...) via de webhook-metadata (verlies_type).
 * - zetNACtaNaarAlgemeen: laat de knoppen van de NA-blok-pagina's naar deze
 *   algemene checkout wijzen, mét het juiste ?type= per pagina. Behoudt alle
 *   overige blok-inhoud (leest de huidige blokken, past alleen ctaUrl aan).
 */
import { internalMutation } from "./_generated/server";

const ALGEMEEN_SLUG = "niet-alleen-programma";

export const maakAlgemeenNAProduct = internalMutation({
  args: {},
  handler: async (ctx) => {
    const bestaand = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", ALGEMEEN_SLUG))
      .first();
    const bron = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", "niet-alleen-verlies-persoon"))
      .first();
    if (!bron) throw new Error("Bronproduct niet-alleen-verlies-persoon niet gevonden.");

    const { _id, _creationTime, ...velden } = bron as any;
    const data = {
      ...velden,
      slug: ALGEMEEN_SLUG,
      name: "Niet Alleen",
      kortNaam: "N.A.",
      verliesType: undefined,      // leeg: type komt uit de LP-link (?type=)
      stripePriceId: undefined,    // eigen PaymentIntent-flow gebruikt priceInCents
      subscriptionType: "niet_alleen",
      isLive: true,
    };
    if (bestaand) {
      await ctx.db.patch(bestaand._id, data);
      return { slug: ALGEMEEN_SLUG, actie: "bijgewerkt", prijsCenten: velden.priceInCents };
    }
    await ctx.db.insert("checkoutProducts", data);
    return { slug: ALGEMEEN_SLUG, actie: "aangemaakt", prijsCenten: velden.priceInCents };
  },
});

const TYPE_PER_SLUG: Record<string, string> = {
  "verlies-huisdier": "huisdier",
  "verlies-persoon": "persoon",
  "relatie-voorbij": "scheiding",
  "ik-voel-me-eenzaam": "eenzaamheid",
  "ongewenst-kinderloos": "kinderloos",
};

export const zetNACtaNaarAlgemeen = internalMutation({
  args: {},
  handler: async (ctx) => {
    const res: any[] = [];
    for (const [slug, type] of Object.entries(TYPE_PER_SLUG)) {
      const pagina = await ctx.db
        .query("blokPaginas")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!pagina) { res.push({ slug, actie: "niet gevonden" }); continue; }
      const url = `/betalen/${ALGEMEEN_SLUG}?type=${type}`;
      let blocks: any[] = [];
      try { blocks = JSON.parse(pagina.blocksJson); } catch { blocks = []; }
      let aangepast = 0;
      const next = blocks.map((b) => {
        if (b && (b.type === "hero" || b.type === "offer" || b.type === "final") && "ctaUrl" in b) {
          aangepast++;
          return { ...b, ctaUrl: url };
        }
        return b;
      });
      await ctx.db.patch(pagina._id, { blocksJson: JSON.stringify(next), updatedAt: Date.now() });
      res.push({ slug, type, knoppen: aangepast });
    }
    return res;
  },
});

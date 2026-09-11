/**
 * Eén algemene Niet Alleen-checkout voor alle verliestypes: /betalen/niet-alleen.
 *
 * - zetNietAlleenAlgemeen: maakt het bestaande product "niet-alleen" algemeen
 *   (verliesType LEEG), zodat het verliestype uit de LP-link (?type=...) telt via
 *   de webhook-metadata. Ruimt het eerder aangemaakte "niet-alleen-programma" op.
 * - zetNACtaNaarAlgemeen: laat de knoppen van de NA-blok-pagina's naar deze
 *   checkout wijzen, mét het juiste ?type= per pagina (behoudt overige inhoud).
 */
import { internalMutation } from "./_generated/server";

const ALGEMEEN_SLUG = "niet-alleen";

export const zetNietAlleenAlgemeen = internalMutation({
  args: {},
  handler: async (ctx) => {
    const prod = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", ALGEMEEN_SLUG))
      .first();
    if (!prod) throw new Error(`Product "${ALGEMEEN_SLUG}" niet gevonden.`);
    await ctx.db.patch(prod._id, {
      verliesType: undefined,       // leeg: type komt uit de LP-link (?type=)
      subscriptionType: "niet_alleen",
      isLive: true,
    });

    // Opruimen: het eerder aangemaakte losse algemene product is niet meer nodig.
    const oud = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", "niet-alleen-programma"))
      .first();
    if (oud) await ctx.db.delete(oud._id);

    return { slug: ALGEMEEN_SLUG, verliesTypeGewist: true, oudeVerwijderd: !!oud };
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

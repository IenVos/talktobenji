/**
 * Werkt de screenshot-carrousels bij naar de nieuwe afbeeldingen + volgorde,
 * zonder overige (admin-bewerkte) content te overschrijven:
 *  - het "account"-blok op alle Zij aan Zij-pagina's (alleen de shots).
 *  - de homepage-carrousel (pageContent.screenshots), alleen als die al gezet is.
 *
 * Benji-chat blijft ongewijzigd, maar staat nu achteraan.
 * Draai: npx convex run updateAccountShotsSeed:updateAccountShots
 */
import { internalMutation } from "./_generated/server";

const ZAZ_SLUGS = [
  "zij-aan-zij",
  "zij-aan-zij-kinderloos",
  "zij-aan-zij-relatie",
  "zij-aan-zij-eenzaamheid",
  "zij-aan-zij-huisdier",
];

// Nieuwe volgorde in het account-blok (Benji-chat achteraan, ongewijzigde afbeelding).
const NIEUWE_SHOTS = [
  { img: "/images/screenshots/mijn-plek.png", label: "Mijn plek" },
  { img: "/images/screenshots/persoonlijke-doelen.png", label: "Persoonlijke doelen" },
  { img: "/images/screenshots/check-in.png", label: "Dagelijkse check-ins" },
  { img: "/images/screenshots/memories.png", label: "Memories" },
  { img: "/images/screenshots/inspiratie.png", label: "Inspiratie & troost" },
  { img: "/images/zij-aan-zij/gesprek.jpg", label: "Gesprek met Benji" },
];

// Homepage-carrousel (zelfde volgorde; Benji-chat gebruikt hier het .png).
const NIEUWE_FEATURES = [
  { id: "mijn-plek", label: "Mijn plek", image: "/images/screenshots/mijn-plek.png", imageAlt: "Mijn plek overzicht" },
  { id: "persoonlijke-doelen", label: "Persoonlijke doelen", image: "/images/screenshots/persoonlijke-doelen.png", imageAlt: "Persoonlijke doelen" },
  { id: "check-in", label: "Dagelijkse check-ins", image: "/images/screenshots/check-in.png", imageAlt: "Dagelijkse check-in" },
  { id: "memories", label: "Memories", image: "/images/screenshots/memories.png", imageAlt: "Memories" },
  { id: "inspiratie", label: "Inspiratie & troost", image: "/images/screenshots/inspiratie.png", imageAlt: "Inspiratie en troost" },
  { id: "gesprek", label: "Gesprek met Benji", image: "/images/screenshots/gesprek.png", imageAlt: "Gesprek met Benji" },
];

export const updateAccountShots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const resultaat: { doel: string; actie: string }[] = [];

    // 1) ZaZ-pagina's: alleen het account-blok bijwerken.
    for (const slug of ZAZ_SLUGS) {
      const doc = await ctx.db
        .query("blokPaginas")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!doc) {
        resultaat.push({ doel: slug, actie: "niet gevonden" });
        continue;
      }
      let blocks: any[];
      try {
        blocks = JSON.parse(doc.blocksJson);
      } catch {
        resultaat.push({ doel: slug, actie: "blocksJson onleesbaar" });
        continue;
      }
      let raak = false;
      const nieuw = blocks.map((b) => {
        if (b?.type === "account") {
          raak = true;
          return { ...b, shots: NIEUWE_SHOTS };
        }
        return b;
      });
      if (raak) {
        await ctx.db.patch(doc._id, { blocksJson: JSON.stringify(nieuw), updatedAt: Date.now() });
        resultaat.push({ doel: slug, actie: "account-blok bijgewerkt" });
      } else {
        resultaat.push({ doel: slug, actie: "geen account-blok" });
      }
    }

    // 2) Homepage-carrousel: alleen bijwerken als er al een set is opgeslagen
    //    (anders valt de homepage terug op de nieuwe DEFAULT_FEATURES in code).
    const home = await ctx.db
      .query("pageContent")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", "homepage"))
      .unique();
    if (home) {
      try {
        const content = JSON.parse(home.content) as Record<string, string>;
        if (content.screenshots) {
          content.screenshots = JSON.stringify(NIEUWE_FEATURES);
          await ctx.db.patch(home._id, { content: JSON.stringify(content), updatedAt: Date.now() });
          resultaat.push({ doel: "homepage.screenshots", actie: "bijgewerkt" });
        } else {
          resultaat.push({ doel: "homepage.screenshots", actie: "niet gezet (gebruikt default)" });
        }
      } catch {
        resultaat.push({ doel: "homepage.screenshots", actie: "content onleesbaar" });
      }
    } else {
      resultaat.push({ doel: "homepage.screenshots", actie: "geen homepage-content (gebruikt default)" });
    }

    return resultaat;
  },
});

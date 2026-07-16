/**
 * Maakt (of ververst) de kale betaalpagina's voor de Even Houvast-ervaren-funnel.
 *
 * Ze zijn een kloon van de bestaande type-checkouts (zelfde prijs, verliesType en
 * enrollment), maar met checkoutLayout "kaal": alleen een warme kop + het betaalveld.
 * Zo blijft de bestaande, geteste betaalflow ongewijzigd en klopt de enrollment
 * gegarandeerd. De producten verschijnen daarna gewoon in de checkout-admin en zijn
 * daar te bewerken (prijs, live aan/uit, enz.).
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./adminAuth";

// type → bestaande (bron)checkout-slug → nieuwe kale slug.
const TYPES = [
  { type: "huisdier", bron: "niet-alleen-huisdier", nieuw: "even-houvast-huisdier-betalen" },
  { type: "persoon", bron: "niet-alleen-verlies-persoon", nieuw: "even-houvast-persoon-betalen" },
  { type: "scheiding", bron: "niet-alleen-relatie", nieuw: "even-houvast-scheiding-betalen" },
  { type: "eenzaamheid", bron: "niet-alleen-eenzaamheid", nieuw: "even-houvast-eenzaamheid-betalen" },
  { type: "kinderloos", bron: "niet-alleen-kinderloos", nieuw: "even-houvast-kinderloos-betalen" },
  { type: "algemeen", bron: "je-hoeft-het-niet-alleen-te-dragen", nieuw: "even-houvast-algemeen-betalen" },
];

const KOP_DEFAULT = "Fijn dat je er bent, {naam}";
const SUB_DEFAULT = "Hieronder rond je het rustig af. Je begint wanneer jij er klaar voor bent.";

export const maakEvenHouvastBetaalpaginas = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    const resultaat: { type: string; slug: string; status: string }[] = [];

    for (const t of TYPES) {
      const bron = await ctx.db
        .query("checkoutProducts")
        .withIndex("by_slug", (q) => q.eq("slug", t.bron))
        .first();
      if (!bron) {
        resultaat.push({ type: t.type, slug: t.nieuw, status: "overgeslagen (bron ontbreekt)" });
        continue;
      }

      // Alleen de velden die de betaling/enrollment bepalen overnemen; de rest kaal.
      const velden = {
        name: bron.name,
        kortNaam: bron.kortNaam,
        verliesType: bron.verliesType ?? t.type,
        priceInCents: bron.priceInCents,
        stripePriceId: bron.stripePriceId,
        subscriptionType: bron.subscriptionType,
        accessDays: bron.accessDays,
        trustText: bron.trustText,
        herroepingTitle: bron.herroepingTitle,
        herroepingText: bron.herroepingText,
        followUpEmailSubject: bron.followUpEmailSubject,
        followUpEmailBody: bron.followUpEmailBody,
        buttonText: "Betaal €37",
        isLive: true,
        checkoutLayout: "kaal",
        kaalKop: KOP_DEFAULT,
        kaalSub: SUB_DEFAULT,
        giftEnabled: false,
        b2bEnabled: false,
        addOnEnabled: false,
        updatedAt: now,
      };

      const bestaand = await ctx.db
        .query("checkoutProducts")
        .withIndex("by_slug", (q) => q.eq("slug", t.nieuw))
        .first();
      if (bestaand) {
        // Bestaat al: alleen de enrollment-velden verversen, kop-teksten met rust
        // laten (die kan Ien inmiddels handmatig hebben aangepast).
        const { kaalKop, kaalSub, ...zonderKop } = velden;
        await ctx.db.patch(bestaand._id, zonderKop as any);
        resultaat.push({ type: t.type, slug: t.nieuw, status: "bijgewerkt" });
      } else {
        await ctx.db.insert("checkoutProducts", { slug: t.nieuw, ...velden, createdAt: now } as any);
        resultaat.push({ type: t.type, slug: t.nieuw, status: "aangemaakt" });
      }
    }

    return { resultaat };
  },
});

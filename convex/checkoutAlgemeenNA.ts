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

// FAQ (uit de oude LP) + EH-magnet blok + 7-dagen-garantie op de NA-blok-pagina's.
const FAQ_BRON: Record<string, string> = {
  "verlies-huisdier": "niet-alleen-voor-hulp-bij-verlies-van-huisdier",
  "verlies-persoon": "je-mist-iemand",
  "relatie-voorbij": "mijn-relatie-is-voorbij-oud",
  "ik-voel-me-eenzaam": "ik-voel-me-eenzaam",
  "ongewenst-kinderloos": "ongewenst-kinderloos-die-pijn-gaat-nooit-weg",
};
const EH_TYPE: Record<string, string> = {
  "verlies-huisdier": "huisdier",
  "verlies-persoon": "persoon",
  "relatie-voorbij": "scheiding",
  "ik-voel-me-eenzaam": "eenzaamheid",
  "ongewenst-kinderloos": "kinderloos",
};
const EH_TEKST =
  "Soms is de stap naar een volledig programma nog te groot.\n\nEn dat hoeft ook niet vandaag.\n\n**Maar als je hier bent, draag je iets. En dat verdient een plek.**\n\nEven Houvast is gratis, en het kost je maar een paar minuten:\n✓ Vijf korte vragen\n✓ Typen, inspreken of een foto toevoegen\n✓ Benji maakt er een persoonlijke brief van, om te bewaren\n\nGeen programma. Geen verplichting. Gewoon een klein moment voor het verlies dat je draagt.";
const GARANTIE = "Niet tevreden binnen 7 dagen? Je krijgt je geld terug, ook al ben je al begonnen.";
const rid = () => Math.random().toString(36).slice(2, 8);

export const vulNAFaqEnEh = internalMutation({
  args: {},
  handler: async (ctx) => {
    const res: any[] = [];
    for (const [slug, bronSlug] of Object.entries(FAQ_BRON)) {
      const pagina = await ctx.db
        .query("blokPaginas")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!pagina) { res.push({ slug, actie: "pagina niet gevonden" }); continue; }

      let blocks: any[] = [];
      try { blocks = JSON.parse(pagina.blocksJson); } catch { blocks = []; }

      // FAQ uit de oude LP
      const bron = await ctx.db
        .query("landingPages")
        .withIndex("by_slug", (q) => q.eq("slug", bronSlug))
        .first();
      let vragen: any[] = [];
      try { vragen = (bron as any)?.vragenJson ? JSON.parse((bron as any).vragenJson) : []; } catch {}

      const heeftFaq = blocks.some((b) => b?.type === "faq");
      const heeftEh = blocks.some((b) => b?.type === "ehmagnet");

      const nieuweBlokken: any[] = [];
      if (!heeftFaq && vragen.length > 0) {
        nieuweBlokken.push({
          key: `faq-${rid()}`, type: "faq", achtergrond: "paper",
          eyebrow: "Veelgestelde vragen", titel: "Veelgestelde vragen",
          items: vragen.map((v) => ({ vraag: String(v.vraag ?? "").trim(), antwoord: String(v.antwoord ?? "").trim() })),
        });
      }
      if (!heeftEh) {
        nieuweBlokken.push({
          key: `ehmagnet-${rid()}`, type: "ehmagnet", achtergrond: "paper",
          eyebrow: "", kop: "Nog niet klaar? Dat begrijp ik. 💙",
          tekst: EH_TEKST, knopText: "Begin gratis met Even Houvast →",
          knopUrl: `/even-houvast/${EH_TYPE[slug]}`,
        });
      }

      // Garantie op het aanbod-blok (7 dagen geld terug), zonder dubbel te zetten.
      let garantieGezet = false;
      let volgende = blocks.map((b) => {
        if (b?.type === "offer" && !String(b.micro ?? "").includes("7 dagen")) {
          garantieGezet = true;
          return { ...b, micro: `${b.micro ? b.micro + " " : ""}${GARANTIE}` };
        }
        return b;
      });

      // FAQ + EH vóór het slot-blok (final) invoegen; anders achteraan.
      if (nieuweBlokken.length > 0) {
        const finalIdx = volgende.findIndex((b) => b?.type === "final");
        if (finalIdx >= 0) volgende = [...volgende.slice(0, finalIdx), ...nieuweBlokken, ...volgende.slice(finalIdx)];
        else volgende = [...volgende, ...nieuweBlokken];
      }

      await ctx.db.patch(pagina._id, { blocksJson: JSON.stringify(volgende), updatedAt: Date.now() });
      res.push({ slug, faqToegevoegd: !heeftFaq && vragen.length > 0, faqAantal: vragen.length, ehToegevoegd: !heeftEh, garantieGezet });
    }
    return res;
  },
});

// EH als zwevende pop-up i.p.v. inline blok: verwijder ehmagnet-blokken en zet
// de per-pagina pop-up aan met de standaardtekst + per-type link.
const POPUP_TEKST =
  "Nog niet klaar? Dat begrijp ik. 💙\n" + EH_TEKST;

export const zetNAEhPopup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const res: any[] = [];
    for (const [slug, ehType] of Object.entries(EH_TYPE)) {
      const pagina = await ctx.db
        .query("blokPaginas")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!pagina) { res.push({ slug, actie: "niet gevonden" }); continue; }
      let blocks: any[] = [];
      try { blocks = JSON.parse(pagina.blocksJson); } catch { blocks = []; }
      const zonderEh = blocks.filter((b) => b?.type !== "ehmagnet");
      await ctx.db.patch(pagina._id, {
        blocksJson: JSON.stringify(zonderEh),
        ehPopupAan: true,
        ehPopupTekst: POPUP_TEKST,
        ehPopupKnopTekst: "Begin gratis met Even Houvast →",
        ehPopupKnopUrl: `/even-houvast/${ehType}`,
        updatedAt: Date.now(),
      });
      res.push({ slug, inlineVerwijderd: blocks.length - zonderEh.length, popupAan: true, link: `/even-houvast/${ehType}` });
    }
    return res;
  },
});

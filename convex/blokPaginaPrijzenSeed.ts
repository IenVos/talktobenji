/**
 * Prijzen-/vergelijkpagina in blok-opmaak: Benji, Niet Alleen en Zij aan Zij
 * naast elkaar. Bewerkbaar in de admin bij de blok-pagina's (Producten ->
 * Landingspagina (blok)) via het nieuwe bloktype "prijzen": kolommen toevoegen,
 * teksten en prijzen wijzigen, per kolom een eigen kleur.
 *
 * Blijft concept (gepubliceerd wordt niet aangeraakt). Re-runbaar.
 */
import { internalMutation } from "./_generated/server";

const ACCENT = "#4a7c59"; // rustig groen, zelfde als het basisontwerp

const BLOCKS = [
  { key: "header", type: "header", logo: "/images/benji-logo-2.png", merk: "Talk To Benji", sub: "Wat past bij jou?" },
  {
    key: "prijzen", type: "prijzen",
    eyebrow: "Drie manieren, één plek",
    titel: "Wat past bij jou?",
    lead: "Van gewoon even je hart luchten tot acht weken persoonlijk met Ien. Je kiest zelf hoe dichtbij je de begeleiding wilt.",
    kolommen: [
      {
        naam: "Benji",
        prijs: "€7",
        prijsSub: "eerste maand",
        who: "Voor als je gewoon een plek wilt om je hart te luchten, dag en nacht.",
        bullets: [
          "Onbeperkt praten met Benji, ook om 3 uur 's nachts",
          "Je eigen plek om alles terug te lezen",
          "Direct beginnen, geen wachttijd",
          "**Geen abonnement.** Wil je verder na de eerste maand? Dan is het €20 per maand, en je kunt altijd stoppen.",
        ],
        ctaText: "Maak kennis met Benji",
        ctaUrl: "/betalen/maand-proef",
        uitgelicht: "",
        badge: "",
        kleur: "",
      },
      {
        naam: "Niet Alleen",
        prijs: "€49",
        prijsSub: "eenmalig · 8 weken",
        who: "Een programma dat je zelf doorloopt, met Benji naast je.",
        bullets: [
          "Acht weken lang, om de dag een bericht",
          "Kleine stappen, op je eigen tempo",
          "Benji erbij, dag en nacht",
          "Je eigen plek die je houdt, ook na de acht weken",
        ],
        ctaText: "Bekijk Niet Alleen",
        ctaUrl: "/lp/niet-alleen-kiezen",
        uitgelicht: "",
        badge: "",
        kleur: "",
      },
      {
        naam: "Zij aan Zij",
        prijs: "€425",
        prijsSub: "eenmalig · 8 weken samen",
        who: "Acht weken persoonlijk, met Ien die echt naast je blijft.",
        bullets: [
          "Eens in de twee weken een persoonlijk gesprek met Ien, vier keer in acht weken",
          "Het complete Niet Alleen-programma erbij",
          "Je eigen woorden terug na elk gesprek, plus je werkboek om te houden",
          "Een maand Benji inbegrepen, voor de momenten tussendoor",
        ],
        ctaText: "Plan een kennismaking",
        ctaUrl: "/lp/zij-aan-zij/kennismaken",
        uitgelicht: "ja",
        badge: "Meest persoonlijk",
        kleur: "",
      },
    ],
    slot: "Twijfel je wat past? Begin gewoon bij Benji. Je kunt altijd een stap dichterbij kiezen.",
  },
];

export const seedPrijzen = internalMutation({
  args: {},
  handler: async (ctx) => {
    const slug = "prijzen";
    const data = {
      slug,
      naam: "Prijzen — wat past bij jou",
      pageTitle: "Wat past bij jou? — Benji, Niet Alleen en Zij aan Zij",
      metaDescription:
        "Van gewoon even praten met Benji tot acht weken persoonlijk met Ien. Vergelijk rustig wat bij jou past.",
      verliestype: "",
      categorie: "product",
      accentKleur: ACCENT,
      blocksJson: JSON.stringify(BLOCKS),
      updatedAt: Date.now(),
    };
    const bestaand = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (bestaand) {
      await ctx.db.patch(bestaand._id, data);
      return { slug, actie: "bijgewerkt" };
    }
    await ctx.db.insert("blokPaginas", { ...data, gepubliceerd: false });
    return { slug, actie: "aangemaakt" };
  },
});

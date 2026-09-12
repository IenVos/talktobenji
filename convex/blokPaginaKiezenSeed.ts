/**
 * Korte keuzepagina in blok-opmaak: iemand kiest hier zijn verliestype en
 * gaat door naar de bijbehorende Niet Alleen-LP. Bewerkbaar in de admin bij
 * de blok-pagina's (Producten -> Landingspagina (blok)).
 *
 * Blijft concept (gepubliceerd wordt niet aangeraakt) zodat Ien hem eerst
 * nakijkt. Re-runbaar.
 */
import { internalMutation } from "./_generated/server";

const ACCENT = "#39455e"; // zelfde blauw als de NA-LP's

const BLOCKS = [
  { key: "header", type: "header", logo: "/images/benji-logo-2.png", merk: "Talk To Benji", sub: "Niet Alleen" },
  {
    key: "keuze", type: "keuze",
    eyebrow: "Niet Alleen",
    titel: "Wat draag jij met je mee?",
    lead: "Kies wat het dichtst bij jou ligt. Dan laat ik je zien hoe Niet Alleen jou daarin kan bijstaan.",
    opties: [
      { titel: "Ik mis iemand",          sub: "Je verloor iemand die je lief was.",                          url: "/lp/verlies-persoon",     icoon: "hart",   type: "persoon" },
      { titel: "Ik verloor mijn dier",   sub: "Een maatje dat zoveel meer was dan “maar een dier”.", url: "/lp/verlies-huisdier",    icoon: "poot",   type: "huisdier" },
      { titel: "Mijn relatie is voorbij", sub: "Je hoofd is er nog niet klaar mee.",                          url: "/lp/relatie-voorbij",     icoon: "mensen", type: "relatie" },
      { titel: "Ik voel me eenzaam",     sub: "Omringd door mensen, en toch alleen.",                         url: "/lp/ik-voel-me-eenzaam",  icoon: "praat",  type: "eenzaamheid" },
      { titel: "Ongewenst kinderloos",   sub: "Een verdriet dat mensen niet kunnen zien.",                    url: "/lp/ongewenst-kinderloos", icoon: "blad",  type: "kinderloos" },
    ],
    slot: "Herken je je niet helemaal in een van deze? Kies dan wat er het dichtst bij komt.",
  },
];

export const seedKiezen = internalMutation({
  args: {},
  handler: async (ctx) => {
    const slug = "niet-alleen-kiezen";
    const data = {
      slug,
      naam: "Niet Alleen — keuze verliestype",
      pageTitle: "Niet Alleen — wat past bij jou?",
      metaDescription:
        "Kies wat het dichtst bij jou ligt en ontdek hoe Niet Alleen je acht weken lang bijstaat.",
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

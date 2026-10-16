/**
 * Seed voor de Er Zijn-productpagina als blok-pagina.
 * Draai via:  npx convex run blokPaginaErZijnSeed:seedErZijn
 *
 * Maakt/overschrijft blok-pagina met slug "er-zijn" (categorie "product").
 * Staat op CONCEPT (gepubliceerd=false): Ien kijkt eerst na, zie
 * feedback_blokpaginas_concept_eerst_controleren. Zolang dit concept is, blijft
 * de oude /lp/er-zijn (landingPages) de ads-LP serveren; pas bij publiceren
 * neemt deze blok-pagina de URL over.
 *
 * Volledig opgebouwd met de NATIVE blok-pagina-blokken (zelfde opmaak als de
 * andere blok-pagina's): het boekje wordt getoond via de "account"-carousel en
 * het aanbod via het "offer"-blok. Toon = steuner-hoek (er zijn voor iemand die
 * verdriet heeft), geschikt voor menu + SEO. De mail "het gaat eigenlijk over
 * jou" houdt zijn eigen hoek en linkt hiernaartoe.
 */
import { internalMutation } from "./_generated/server";

const IMG = {
  logo: "/images/benji-logo-2.png",
  ien: "/images/ien-founder.png",
};

const erZijnBlocks = () => [
  { key: "header", type: "header", logo: IMG.logo, merk: "Talk To Benji", sub: "Er Zijn" },

  {
    key: "hero", type: "hero",
    eyebrow: "Digitaal boekje · 68 pagina's",
    titel1: "Je wilt er zijn.",
    titel2: "Maar je weet niet hoe.",
    body: [
      { soort: "lead", tekst: "Iemand van wie je houdt heeft verdriet. Je wilt iets zeggen, iets doen, dichtbij blijven." },
      { soort: "lead", tekst: "Maar ineens weet je niet meer wat." },
      { soort: "whisper", tekst: "Je typt iets. Je leest het terug. En je stuurt toch maar niets." },
    ],
    ctaText: "Download het boekje",
    ctaUrl: "/betalen/er-zijn",
    micro: "Eenmalig €17 · direct in je inbox",
  },

  {
    key: "herkenning", type: "herkenning", achtergrond: "paper",
    eyebrow: "Misschien herken je dit",
    titel: "Je wilt helpen, maar weet niet hoe",
    lead: "Je krijgt een bericht waarvan je weet: hier gaat het echt niet goed. En dan begint het twijfelen.",
    voices: [
      "Je wilt niet iets zeggen wat pijn doet.",
      "Je wilt niet bagatelliseren.",
      "Je wilt niet opdringerig zijn.",
      "Je wilt niet doen alsof je precies weet hoe iemand zich voelt.",
    ],
    pull: "Niet omdat je niet om iemand geeft. Maar omdat je niet weet hoe je dichtbij kunt blijven.",
  },

  {
    key: "band", type: "band",
    eyebrow: "En dat hoeft ook niet",
    titel: "Je hoeft de perfecte woorden\nniet te hebben",
    lead: "Je hoeft iemands verdriet niet op te lossen. Je hoeft niet precies te weten hoe iemand zich voelt. Je hoeft niet altijd het juiste te zeggen.",
    stack: [
      "Je hoeft alleen te weten hoe je kunt blijven.",
      "Hoe je kunt luisteren.",
      "Hoe je iets kleins kunt doen.",
    ],
    kicker: "**\"Ik ben er. Ook als ik niet weet wat ik moet zeggen.\"**",
    sub: "Een overlijden, een scheiding, een miskraam, het verlies van een huisdier, een toekomst die anders liep. Steeds dezelfde vraag: hoe ben ik er voor deze persoon?",
  },

  {
    key: "nietis", type: "nietis", achtergrond: "paper",
    eyebrow: "Het verschil zit in kleine dingen",
    titel: "Wat vaak niet helpt, en wat wél",
    pairs: [
      { geen: "Oplossen wat niet op te lossen is", wel: "Blijven, ook in de stilte" },
      { geen: "Wachten tot zij iets vragen", wel: "Zelf iets kleins aanbieden" },
      { geen: "De naam liever vermijden", wel: "De naam blijven noemen" },
      { geen: "\"Laat het me weten als...\"", wel: "\"Ik kom donderdag soep brengen.\"" },
    ],
  },

  {
    key: "boekje", type: "account", achtergrond: "paper",
    eyebrow: "Een kijkje in het boekje",
    titel: "68 pagina's, rustig vormgegeven",
    lead: "Geen theorie, maar dingen die je meteen kunt gebruiken. Met een spiekbriefje voor het moment dat je er even niet uitkomt.",
    shots: [
      { img: "/images/er-zijn-spread-0-cover.png", label: "Er Zijn" },
      { img: "/images/er-zijn-spread-1-binnen.png", label: "Wat er van binnen gebeurt" },
      { img: "/images/er-zijn-spread-2-nietzeggen.png", label: "Wat je beter niet zegt" },
      { img: "/images/er-zijn-spread-3-aanwezig.png", label: "Wat wél helpt" },
      { img: "/images/er-zijn-spread-4-zinnen.png", label: "Zinnen die je kunt gebruiken" },
      { img: "/images/er-zijn-spread-5-verlies.png", label: "Ook dit is verlies" },
      { img: "/images/er-zijn-spread-6-spiekbriefje.png", label: "Het spiekbriefje" },
    ],
  },

  {
    key: "aanbod", type: "offer",
    introLabel: "Het boekje",
    prijs: "€17",
    prijsSub: "eenmalig",
    bullets: [
      "Woorden die wél troosten bij verdriet, verlies of eenzaamheid",
      "Wat je beter niet zegt, en wat je in plaats daarvan kunt doen",
      "Een spiekbriefje met zinnen om te sturen of te zeggen",
      "68 pagina's, direct in je inbox",
    ],
    ctaText: "Download het boekje",
    ctaUrl: "/betalen/er-zijn",
    micro: "Geen abonnement, geen kleine lettertjes. Direct te downloaden.",
    anchor: "boekje",
  },

  {
    key: "ien", type: "ien",
    eyebrow: "Over de maker",
    titel: "Geschreven door Ien",
    foto: IMG.ien,
    paras: [
      "Er Zijn is geschreven door Ien, oprichter van Talk To Benji. Ze zag steeds opnieuw dat mensen zich terugtrokken wanneer iemand in hun omgeving verdriet had. Niet omdat ze er niet wilden zijn, maar omdat ze niet wisten wat ze moesten zeggen of doen.",
      "Dit boekje is haar antwoord daarop: een praktische en warme gids voor iedereen die er voor een ander wil zijn, juist op de momenten waarop woorden soms tekortschieten.",
    ],
  },

  {
    key: "faq", type: "faq",
    eyebrow: "Misschien vraag je je af",
    titel: "Veelgestelde vragen",
    items: [
      { vraag: "Wat als ik het verkeerde zeg?", antwoord: "Dat is misschien wel de meest voorkomende angst. Het gaat niet om perfecte woorden, maar om verbinding. Je leert beter begrijpen wat iemand nodig heeft, je krijgt zinnen voor als je die zelf even niet kunt vinden, en je ontdekt kleine manieren waarop je er echt kunt zijn." },
      { vraag: "Wat krijg ik precies?", antwoord: "Een digitaal boekje van 68 pagina's, warm vormgegeven en rustig om te lezen. Inclusief een spiekbriefje: één pagina met de kern, die je op je telefoon kunt bewaren of kunt printen." },
      { vraag: "Wat kost het?", antwoord: "Eenmalig €17. Geen abonnement, geen kleine lettertjes." },
      { vraag: "Hoe krijg ik het na aankoop?", antwoord: "Direct na je aankoop staat het in je inbox. Je leest het meteen op je telefoon, tablet of laptop, en je bewaart het voor wanneer je het nodig hebt." },
      { vraag: "Voor welk soort verlies is dit?", antwoord: "Voor iemand naast wie jij staat die iets moeilijks meemaakt. Een overlijden, een scheiding, een miskraam, het verlies van een huisdier, of een toekomst die anders liep dan gehoopt. Het gaat over hoe je er kunt zijn, niet over één specifiek verlies." },
    ],
  },

  {
    key: "final", type: "final",
    eyebrow: "Tot slot",
    titel: "De persoon die jou nodig heeft,\nheeft geluk met jou",
    lead: "Misschien gaat het nu met iedereen om je heen goed. Maar vroeg of laat kennen we allemaal iemand die door iets heen gaat. En op dat moment wil je niet voor het eerst nadenken over wat je zou kunnen zeggen.",
    ctaText: "Download het boekje",
    ctaUrl: "/betalen/er-zijn",
    micro: "Digitaal boekje · 68 pagina's · eenmalig €17 · direct te downloaden",
  },
];

export const seedErZijn = internalMutation({
  args: {},
  handler: async (ctx) => {
    const slug = "er-zijn";
    const data = {
      slug,
      naam: "Er Zijn (boekje)",
      pageTitle: "Er Zijn · het boekje over wat je zegt bij verdriet",
      verliestype: "",
      categorie: "product",
      accentKleur: "#6d84a8",
      gepubliceerd: false, // concept: Ien kijkt eerst na vóór livegang
      metaDescription:
        "Iemand om je heen heeft verdriet en je wilt er zijn, maar je weet niet wat je moet zeggen. Er Zijn is een digitaal boekje van 68 pagina's met woorden die wél troosten. Eenmalig €17.",
      blocksJson: JSON.stringify(erZijnBlocks()),
      updatedAt: Date.now(),
    };
    const bestaand = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (bestaand) {
      await ctx.db.patch(bestaand._id, data);
      return { slug, actie: "bijgewerkt", id: bestaand._id };
    }
    const id = await ctx.db.insert("blokPaginas", data);
    return { slug, actie: "aangemaakt", id };
  },
});

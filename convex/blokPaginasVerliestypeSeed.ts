/**
 * Verliestype-pagina's in blok-opmaak, toegespitst op het product Niet Alleen.
 *
 * Eén pagina = één doel: Niet Alleen (€49). Geen Zij aan Zij of Benji als
 * concurrerende CTA op de pagina; de Even Houvast-popup is de zachte vangnet-stap.
 * Pagina's blijven concept (gepubliceerd wordt niet aangeraakt) zodat Ien ze
 * eerst nakijkt. Re-runbaar.
 */
import { internalMutation } from "./_generated/server";

async function zetPagina(
  ctx: any,
  opts: { slug: string; pageTitle: string; metaDescription: string; blocks: any[] }
) {
  const doel = await ctx.db
    .query("blokPaginas")
    .withIndex("by_slug", (q: any) => q.eq("slug", opts.slug))
    .first();
  if (!doel) throw new Error(`Doelpagina "${opts.slug}" niet gevonden.`);
  await ctx.db.patch(doel._id, {
    blocksJson: JSON.stringify(opts.blocks),
    pageTitle: opts.pageTitle,
    metaDescription: opts.metaDescription,
    verliestype: doel.verliestype,
    updatedAt: Date.now(),
  });
  return { slug: opts.slug, blokken: opts.blocks.length };
}

const CTA = "Start met Niet Alleen";

// ── Verlies van een huisdier (Niet Alleen, €49) ─────────────────────────
export const seedHuisdier = internalMutation({
  args: {},
  handler: async (ctx) => {
    const url = "/betalen/niet-alleen-huisdier";
    const micro = "€49 eenmalig. Je begint direct, in je eigen tempo.";
    return zetPagina(ctx, {
      slug: "verlies-huisdier",
      pageTitle: "Niet Alleen — 8 weken bij het verlies van je dier",
      metaDescription:
        "Acht weken lang elke dag een klein moment bij het verlies van je huisdier. In je eigen tempo, met Benji erbij.",
      blocks: [
        { key: "header", type: "header", logo: "/images/benji-logo-2.png", merk: "Talk To Benji", sub: "Niet Alleen" },
        {
          key: "hero", type: "hero",
          eyebrow: "Voor wie een dier verloor dat familie was",
          titel1: "De wereld draait door,",
          titel2: "maar in jouw huis is de leegte nog net zo groot.",
          body: [
            { soort: "lead", tekst: "Een maatje. Routine. Stilte die nu anders voelt." },
            { soort: "lead", tekst: "Je mist de kleine dingen. De vanzelfsprekendheid. De aanwezigheid." },
            { soort: "whisper", tekst: "En misschien voelt het alsof je dit niet \"groot genoeg\" mag maken." },
            { soort: "lead", tekst: "Dus je zegt er minder over dan je eigenlijk zou willen." },
            { soort: "thought", tekst: "Maar jouw verdriet is echt." },
          ],
          facts: "Acht weken lang, **om de dag** een bericht dat je op je eigen tempo doorloopt. Met Benji erbij, dag en nacht.",
          ctaText: CTA, ctaUrl: url, micro,
        },
        {
          key: "herkenning", type: "herkenning",
          eyebrow: "Misschien herken je dit",
          titel: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
          lead: "Je functioneert prima. En toch loopt er iets mee dat niemand ziet. Misschien herken je dit:",
          voices: [
            "Je hoofd blijft maar doorgaan.",
            "Je weet niet goed wat je voelt.",
            "Je probeert sterk te blijven.",
            "Je bent moe van alles alleen dragen.",
            "Iedereen zegt dat het maar een dier was.",
          ],
          pull: "Je verdriet mag er zijn. **Precies zoals het is.**",
        },
        {
          key: "band", type: "band", achtergrond: "band",
          eyebrow: "Wat Niet Alleen is",
          titel: "Elke dag een klein moment,\nalleen voor jou.",
          kicker: "Misschien voelt dit klein. **Maar juist dat ene moment om stil te staan kan het verschil maken tussen alles alleen dragen en even kunnen ademen.**",
          stack: [
            "Waar je niets hoeft uit te leggen.",
            "Waar je vandaag meer mag zijn dan gisteren.",
            "Waar je verdriet niet klein hoeft.",
          ],
        },
        {
          key: "kern", type: "kern",
          eyebrow: "Waar sta je bij stil",
          titel: "Niets moet. Alles mag.",
          naastLabel: "Zachte vragen die je op weg helpen, bijvoorbeeld:",
          naast: [
            "Waar denk je aan als het stil is in huis?",
            "Wanneer voelde jullie band het sterkst?",
            "Wat zou je nog tegen hem of haar willen zeggen?",
          ],
          slot: "Geen druk, geen huiswerk. Zacht, maar het brengt je wel ergens.",
        },
        {
          key: "ditkrijgje", type: "ditkrijgje",
          eyebrow: "Dit krijg je",
          titel: "Acht weken lang loop je het niet alleen.",
          items: [
            { kop: "Om de dag een bericht", tekst: "Acht weken lang, om de dag een klein bericht met een gedachte of vraag. Niks moet, je doet het op je eigen tempo." },
            { kop: "Erkenning zonder je te verdedigen", tekst: "Ruimte voor herinneringen én gemis, zonder dat je hoeft uit te leggen waarom dit zo groot is." },
            { kop: "Benji, dag en nacht", tekst: "Voor de momenten waarop het gemis ineens opkomt en je even iets kwijt wilt. Ook 's nachts." },
            { kop: "Je eigen plek om te houden", tekst: "Alles wat je opschrijft blijft van jou, ook na de acht weken." },
          ],
        },
        {
          key: "ervaringen", type: "ervaringen",
          eyebrow: "Wat anderen ervaren",
          titel: "Gewoon iemand die het begrijpt.",
          quotes: [
            { bron: "Sandra", tekst: "Ik dacht dat ik het wel alleen kon. Maar elke ochtend gaf dat ene moment me het gevoel dat er iemand aan me dacht, en dat was genoeg." },
            { bron: "Mariëlle", tekst: "Hier kon ik zeggen wat ik nergens anders kwijt kon, zonder dat iemand het probeerde op te lossen. Voor het eerst voelde mijn verdriet niet als iets om me voor te verontschuldigen." },
            { bron: "Annelies", tekst: "Iedereen zei dat het maar een hond was, maar hier voelde ik me eindelijk begrepen." },
          ],
        },
        {
          key: "aanbod", type: "offer", anchor: "aanbod",
          introLabel: "Wat als je het niet stil hoeft te dragen?",
          prijs: "€49", prijsSub: "eenmalig · 8 weken",
          bullets: [
            "Acht weken lang, om de dag een bericht",
            "Ruimte voor herinneringen en gemis, op je eigen tempo",
            "Benji erbij, dag en nacht",
            "Je eigen plek die je houdt",
          ],
          ctaText: CTA, ctaUrl: url,
          micro: "Je begint direct. Geen wachttijd, geen intake.",
        },
        {
          key: "final", type: "final", achtergrond: "band",
          eyebrow: "Tot slot",
          titel: "Je verdriet om je dier is echt.\nEn je hoeft het niet stil te dragen.",
          sub: "8 weken Niet Alleen.",
          ctaText: CTA, ctaUrl: url, micro,
        },
      ],
    });
  },
});

// ── Overige verliestypes (Niet Alleen, blauw, zelfde opzet als huisdier) ──
const ACCENT = "#39455e"; // blauw, gelijk aan huisdier
const NA_MICRO = "€49 eenmalig. Je begint direct, in je eigen tempo.";

type NAConfig = {
  slug: string;
  verliestype: string;
  checkoutSlug: string;
  pageTitle: string;
  meta: string;
  eyebrow: string;
  titel1: string;
  titel2: string;
  body: { soort: string; tekst: string }[];
  kernNaast: string[];
  finalTitel: string;
};

function bouwNABlocks(cfg: NAConfig): any[] {
  const url = `/betalen/${cfg.checkoutSlug}`;
  return [
    { key: "header", type: "header", logo: "/images/benji-logo-2.png", merk: "Talk To Benji", sub: "Niet Alleen" },
    {
      key: "hero", type: "hero",
      eyebrow: cfg.eyebrow,
      titel1: cfg.titel1,
      titel2: cfg.titel2,
      body: cfg.body,
      facts: "Acht weken lang, **om de dag** een bericht dat je op je eigen tempo doorloopt. Met Benji erbij, dag en nacht.",
      ctaText: CTA, ctaUrl: url, micro: NA_MICRO,
    },
    {
      key: "herkenning", type: "herkenning", achtergrond: "paper",
      eyebrow: "Misschien herken je dit",
      titel: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
      lead: "Je functioneert prima. En toch loopt er iets mee dat niemand ziet. Misschien herken je dit:",
      voices: [
        "Je hoofd blijft maar doorgaan.",
        "Je weet niet goed wat je voelt.",
        "Je probeert sterk te blijven.",
        "Je bent moe van alles alleen dragen.",
        "Je wil niet steeds het hele verhaal vertellen.",
      ],
      pull: "Je verdriet mag er zijn. **Precies zoals het is.**",
    },
    {
      key: "band", type: "band", achtergrond: "band",
      eyebrow: "Wat Niet Alleen is",
      titel: "Elke dag een klein moment,\nalleen voor jou.",
      kicker: "Misschien voelt dit klein. **Maar juist dat ene moment om stil te staan kan het verschil maken tussen alles alleen dragen en even kunnen ademen.**",
      stack: [
        "Waar je niets hoeft uit te leggen.",
        "Waar je vandaag meer mag zijn dan gisteren.",
        "Waar je verdriet niet klein hoeft.",
      ],
    },
    {
      key: "kern", type: "kern",
      eyebrow: "Waar sta je bij stil",
      titel: "Niets moet. Alles mag.",
      naastLabel: "Zachte vragen die je op weg helpen, bijvoorbeeld:",
      naast: cfg.kernNaast,
      slot: "Geen druk, geen huiswerk. Zacht, maar het brengt je wel ergens.",
    },
    {
      key: "ditkrijgje", type: "ditkrijgje",
      eyebrow: "Dit krijg je",
      titel: "Acht weken lang loop je het niet alleen.",
      items: [
        { kop: "Om de dag een bericht", tekst: "Acht weken lang, om de dag een klein bericht met een gedachte of vraag. Niks moet, je doet het op je eigen tempo." },
        { kop: "Erkenning zonder je te verdedigen", tekst: "Ruimte voor wat je draagt, zonder dat je hoeft uit te leggen waarom dit zo groot is." },
        { kop: "Benji, dag en nacht", tekst: "Voor de momenten waarop het ineens opkomt en je even iets kwijt wilt. Ook 's nachts." },
        { kop: "Je eigen plek om te houden", tekst: "Alles wat je opschrijft blijft van jou, ook na de acht weken." },
      ],
    },
    {
      key: "ervaringen", type: "ervaringen", achtergrond: "paper",
      eyebrow: "Wat anderen ervaren",
      titel: "Gewoon iemand die het begrijpt.",
      quotes: [
        { bron: "Voorbeeld, vervangen voor livegang", tekst: "Voor het eerst hoefde ik niet uit te leggen waarom het na een tijd nog steeds pijn deed." },
        { bron: "Voorbeeld, vervangen voor livegang", tekst: "Elke dag dat ene moment gaf me het gevoel dat er iemand aan me dacht." },
        { bron: "Voorbeeld, vervangen voor livegang", tekst: "Geen adviezen, geen 'geef het tijd'. Gewoon ruimte voor wat er was." },
      ],
    },
    {
      key: "aanbod", type: "offer", anchor: "aanbod",
      introLabel: "Wat als je het niet stil hoeft te dragen?",
      prijs: "€49", prijsSub: "eenmalig · 8 weken",
      bullets: [
        "Acht weken lang, om de dag een bericht",
        "Ruimte voor wat je draagt, op je eigen tempo",
        "Benji erbij, dag en nacht",
        "Je eigen plek die je houdt",
      ],
      ctaText: CTA, ctaUrl: url,
      micro: "Je begint direct. Geen wachttijd, geen intake.",
    },
    {
      key: "final", type: "final", achtergrond: "band",
      eyebrow: "Tot slot",
      titel: cfg.finalTitel,
      sub: "8 weken Niet Alleen.",
      ctaText: CTA, ctaUrl: url, micro: NA_MICRO,
    },
  ];
}

async function upsertNA(ctx: any, cfg: NAConfig) {
  const blocks = bouwNABlocks(cfg);
  const bestaand = await ctx.db
    .query("blokPaginas")
    .withIndex("by_slug", (q: any) => q.eq("slug", cfg.slug))
    .first();
  const data = {
    slug: cfg.slug,
    naam: cfg.pageTitle.replace("Niet Alleen — ", ""),
    pageTitle: cfg.pageTitle,
    metaDescription: cfg.meta,
    verliestype: cfg.verliestype,
    categorie: "product",
    accentKleur: ACCENT,
    blocksJson: JSON.stringify(blocks),
    updatedAt: Date.now(),
  };
  if (bestaand) {
    await ctx.db.patch(bestaand._id, data);
    return { slug: cfg.slug, actie: "bijgewerkt" };
  }
  await ctx.db.insert("blokPaginas", { ...data, gepubliceerd: false });
  return { slug: cfg.slug, actie: "aangemaakt" };
}

const OVERIGE: NAConfig[] = [
  {
    slug: "ik-voel-me-eenzaam", verliestype: "eenzaamheid", checkoutSlug: "niet-alleen-eenzaamheid",
    pageTitle: "Niet Alleen — 8 weken als je je alleen voelt",
    meta: "Acht weken lang elke dag een klein moment als je je alleen voelt. In je eigen tempo, met Benji erbij.",
    eyebrow: "Voor wie zich alleen voelt",
    titel1: "Je voelt je alleen.", titel2: "Maar er is zoveel meer in jou.",
    body: [
      { soort: "lead", tekst: "Je bent omringd door mensen. Maar niemand ziet echt wie je bent." },
      { soort: "lead", tekst: "Je lacht mee. Je doet mee. Maar van binnen is er iets wat niet gezien wordt." },
      { soort: "whisper", tekst: "Niet omdat je het niet wil delen. Maar omdat je niet weet hoe. Of bij wie." },
      { soort: "thought", tekst: "Dus je draagt het stil." },
    ],
    kernNaast: ["Wat zou je willen dat iemand van je wist?", "Wanneer voelde je je het meest jezelf?", "Wat heb je vandaag nodig?"],
    finalTitel: "Je mag gezien worden.\nEn je hoeft het niet alleen te dragen.",
  },
  {
    slug: "verlies-persoon", verliestype: "persoon", checkoutSlug: "niet-alleen-verlies-persoon",
    pageTitle: "Niet Alleen — 8 weken bij het verlies van iemand",
    meta: "Acht weken lang elke dag een klein moment bij het gemis van iemand die er niet meer is. In je eigen tempo, met Benji erbij.",
    eyebrow: "Voor wie iemand mist die er niet meer is",
    titel1: "Je mist iemand.", titel2: "En niemand kan dat echt opvangen.",
    body: [
      { soort: "lead", tekst: "Mensen vragen hoe het gaat. En je zegt: \"gaat wel.\"" },
      { soort: "lead", tekst: "Maar wat moet je anders zeggen? Dat je soms nog automatisch aan ze denkt? Dat je midden op de dag ineens stilvalt?" },
      { soort: "whisper", tekst: "'s Nachts komt het het hardst binnen." },
      { soort: "lead", tekst: "Je wil het delen. Maar niet elke keer het hele verhaal opnieuw vertellen." },
      { soort: "thought", tekst: "Dus je houdt het maar bij jezelf." },
    ],
    kernNaast: ["Wat mis je het meest op een gewone dag?", "Welk moment met hem of haar wil je vasthouden?", "Wat zou je nog willen zeggen?"],
    finalTitel: "Je verdriet mag er zijn.\nEn je hoeft het niet alleen te dragen.",
  },
  {
    slug: "relatie-voorbij", verliestype: "relatie", checkoutSlug: "niet-alleen-relatie",
    pageTitle: "Niet Alleen — 8 weken als je relatie voorbij is",
    meta: "Acht weken lang elke dag een klein moment na het einde van je relatie. In je eigen tempo, met Benji erbij.",
    eyebrow: "Voor wie een relatie moest loslaten",
    titel1: "Je relatie is voorbij.", titel2: "Maar je hoofd is dat nog niet.",
    body: [
      { soort: "lead", tekst: "Je denkt terug. Analyseert. Twijfelt." },
      { soort: "lead", tekst: "Was het de juiste keuze? Had je iets anders kunnen doen? Waarom voelt het nog zo aanwezig?" },
      { soort: "whisper", tekst: "Overdag red je je wel. Maar 's avonds begint het weer." },
      { soort: "thought", tekst: "En je wil er niet steeds over praten met anderen." },
    ],
    kernNaast: ["Wat blijft er 's avonds door je hoofd gaan?", "Wat wil je loslaten?", "Wat heb je nodig om rust te vinden?"],
    finalTitel: "Je hoofd mag tot rust komen.\nEn je hoeft het niet alleen te doen.",
  },
  {
    slug: "ongewenst-kinderloos", verliestype: "kinderloos", checkoutSlug: "niet-alleen-kinderloos",
    pageTitle: "Niet Alleen — 8 weken bij ongewenst kinderloos zijn",
    meta: "Acht weken lang elke dag een klein moment bij een kinderwens die niet uitkwam. In je eigen tempo, met Benji erbij.",
    eyebrow: "Voor wie ongewenst kinderloos is",
    titel1: "Ongewenst kinderloos.", titel2: "Iets wat mensen niet kunnen zien.",
    body: [
      { soort: "lead", tekst: "Een verlies waarvoor niemand de juiste woorden heeft." },
      { soort: "lead", tekst: "Want het is niet zichtbaar. Niet tastbaar. Maar het is er. Altijd." },
      { soort: "whisper", tekst: "In momenten. In gesprekken. In wat er niet is." },
      { soort: "lead", tekst: "En misschien voel je je alleen in hoe groot het is." },
      { soort: "thought", tekst: "Alsof je het niet helemaal mag voelen." },
    ],
    kernNaast: ["Waar loop je het vaakst tegenaan?", "Wat zou je willen dat mensen begrepen?", "Wat heb je vandaag nodig?"],
    finalTitel: "Jouw verdriet is echt.\nEn je hoeft het niet alleen te dragen.",
  },
];

export const seedOverigeNA = internalMutation({
  args: {},
  handler: async (ctx) => {
    const res = [];
    for (const cfg of OVERIGE) res.push(await upsertNA(ctx, cfg));
    return res;
  },
});

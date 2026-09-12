/**
 * Zij aan Zij-blok-pagina's per verliestype (relatie, eenzaamheid, huisdier).
 *
 * Sjabloon = de ongewenst-kinderloos-pagina (convex/blokPaginasSeed.ts,
 * kinderloosBlocks): opmaak en opbouw exact hetzelfde, alleen de tekst is per
 * verliestype toegespitst. De generieke blokken over het programma zelf
 * (cadans, stappen, dit-krijg-je, account, document, geen/wel, aanbod, slot)
 * blijven woord voor woord gelijk.
 *
 * Pagina's blijven concept (gepubliceerd=false) zodat Ien ze eerst nakijkt.
 * Draai: npx convex run blokPaginasZazVerliestypeSeed:seedZazVerliestypes
 * Re-runbaar (idempotent per slug).
 */
import { internalMutation } from "./_generated/server";

const IMG = {
  logo: "/images/benji-logo-2.png",
  ien: "/images/ien-founder.png",
  ipad: "/images/zij-aan-zij/ipad-document.png",
  mijnPlek: "/images/screenshots/mijn-plek.png",
  persoonlijkeDoelen: "/images/screenshots/persoonlijke-doelen.png",
  checkin: "/images/screenshots/check-in.png",
  inspiratie: "/images/screenshots/inspiratie.png",
  handreikingen: "/images/screenshots/handreikingen.png",
  memories: "/images/screenshots/memories.png",
  gesprek: "/images/zij-aan-zij/gesprek.jpg",
};

const INTAKE = "intake"; // sentinel → renderer maakt hier /lp/<slug>/kennismaken van

type Cfg = {
  slug: string;
  verliestype: string;
  naam: string;
  pageTitle: string;
  meta: string;
  // hero
  heroEyebrow: string;
  titel1: string;
  titel2: string;
  heroBody: { soort: string; tekst: string }[];
  // herkenning
  herkTitel: string;
  herkLead: string;
  herkVoices: string[];
  // band
  bandTitel: string;
  bandStack: string[];
  // kern
  kernNaast: string[];
  // ien
  ienParas: string[];
  // ervaringen
  ervaringen: string[];
};

// Exact dezelfde opbouw als kinderloosBlocks; alleen de type-specifieke velden
// komen uit cfg. De rest is bewust woord voor woord gelijk.
const bouwBlocks = (cfg: Cfg): any[] => [
  { key: "header", type: "header", logo: IMG.logo, merk: "Talk To Benji", sub: "Zij aan Zij" },

  {
    key: "hero", type: "hero",
    eyebrow: cfg.heroEyebrow,
    titel1: cfg.titel1,
    titel2: cfg.titel2,
    body: cfg.heroBody,
    ctaText: "Ik wil kennismaken met Zij aan Zij",
    ctaUrl: "#aanbod",
    micro: "Eerst kennismaken met Ien. Je hoeft nog niets te beslissen.",
    facts: "Acht weken samen: **eens in de twee weken** een persoonlijk gesprek met Ien, het complete Niet Alleen-programma en een maand Benji.",
  },

  {
    key: "herkenning", type: "herkenning",
    eyebrow: "Misschien herken je dit",
    titel: cfg.herkTitel,
    lead: cfg.herkLead,
    voices: cfg.herkVoices,
    pull: "Je weet één ding zeker: **ik wil hier niet alleen mee zitten.**",
  },

  {
    key: "band", type: "band", achtergrond: "band",
    eyebrow: "De reden dat Zij aan Zij bestaat",
    titel: cfg.bandTitel,
    stack: cfg.bandStack,
    kicker: "Je mag gewoon iemand naast je hebben. **En dat is Zij aan Zij.**",
  },

  {
    key: "kern", type: "kern",
    eyebrow: "Wat Zij aan Zij is",
    titel: "Je hoeft geen antwoorden te hebben.\nJe hebt iemand nodig die naast je blijft en luistert.",
    naastLabel: "Wat betekent \"naast je blijven\"?",
    naast: cfg.kernNaast,
    slot: "Je hoeft niet met een hulpvraag te komen. Je mag gewoon komen met hoe het vandaag is.",
  },

  {
    key: "cadence", type: "cadence",
    eyebrow: "Waarom dit ritme",
    titel: "Niet één gesprek, en dan weer alleen verder.",
    para1: "Verdriet komt niet in één keer voorbij, dus laat ik je ook niet één keer alleen. **Eens in de twee weken hebben we een persoonlijk gesprek, vier keer in acht weken.** Vaak genoeg om echt iemand naast je te hebben, met genoeg ruimte ertussen om alles te laten bezinken.",
    para2: "En tussen de gesprekken door sta je er ook niet alleen voor.",
    layersHead: "Zo ziet het eruit",
    layers: [
      { badge: "Kennismaking", kleur: "ring", lh: "Eerst maken we kennis", lb: "Rustig, zodat je kunt voelen of het klikt. Pas daarna begint de begeleiding." },
      { badge: "1× per 2 weken", kleur: "accent", lh: "Een persoonlijk gesprek met Ien", lb: "Vier gesprekken in acht weken, 1-op-1, op jouw tempo." },
      { badge: "Om de dag", kleur: "amber", lh: "Het complete Niet Alleen-programma", lb: "Om de dag een e-mail met een kleine vraag of opdracht. Niks moet, je reageert wanneer jij wilt." },
      { badge: "Dag & nacht", kleur: "accent", lh: "Benji", lb: "Voor de momenten die niet kunnen wachten tot het volgende gesprek, ook 's nachts." },
    ],
    foot: "En het komt allemaal samen op **je eigen plek**, waar je op elk moment terechtkunt.",
    timelineWeken: 8,
    timelineStart: [1],
    timelineGesprek: [2, 4, 6, 8],
    legend: [
      { soort: "ring", label: "Kennismaking" },
      { soort: "dot", label: "Gesprek met Ien" },
      { soort: "bar", label: "Niet Alleen" },
    ],
  },

  {
    key: "stappen", type: "stappen",
    eyebrow: "Zo werkt het",
    titel: "In jouw tempo, van begin tot eind.",
    steps: [
      { kop: "We maken eerst kennis", tekst: "Rustig, zodat je kunt voelen of het klikt. Pas daarna gaat de begeleiding aan." },
      { kop: "Acht weken lopen we samen op", tekst: "Eens in de twee weken een persoonlijk gesprek, op de momenten dat jij iemand naast je nodig hebt. Geen wachtkamer, geen haast." },
      { kop: "Je houdt alles bij je", tekst: "Na elk gesprek krijg je je eigen woorden terug op je eigen plek. En je eigen werkboek houd je, ook als de acht weken voorbij zijn." },
    ],
  },

  {
    key: "ditkrijgje", type: "ditkrijgje",
    eyebrow: "Dit krijg je",
    titel: "Acht weken lang weet je: ik heb iemand bij wie ik terechtkan.",
    items: [
      { kop: "Eens in de twee weken een persoonlijk gesprek met Ien", tekst: "Geen eenmalig gesprek waarna je weer alleen verder moet. Vier keer in acht weken zit er iemand naast je die je verhaal al kent, bij wie je niet steeds opnieuw hoeft te beginnen." },
      { kop: "Het complete Niet Alleen-programma", tekst: "Acht weken lang, om de dag een e-mail met een kleine vraag of opdracht. Niks moet, je reageert wanneer jij wilt. Alles komt samen op je eigen plek, waar je altijd terechtkunt." },
      { kop: "Een samenvatting van elk gesprek", tekst: "Je hoeft niet alles te onthouden wat er tijdens een gesprek door je heen ging. Na elk gesprek staat de kern in jouw woorden klaar op je eigen plek." },
      { kop: "Een persoonlijk document na afloop", tekst: "Aan het einde van de acht weken breng ik alles samen in één document, in jouw woorden. Iets tastbaars om te houden: wat er was, en waar je nu staat." },
      { kop: "Je eigen werkboek", tekst: "Een plek voor gedachten en herinneringen die je nergens anders kwijt kunt. En die je mag houden, ook na de acht weken." },
      { kop: "Een maand Benji", tekst: "Dag en nacht bereikbaar, juist op de momenten waarop het gemis ineens opkomt en je even iets kwijt wilt." },
      { kop: "Je eigen rustige plek", tekst: "Geen druk, geen oordeel. Alles op één plek, alleen voor jou." },
    ],
  },

  {
    key: "account", type: "account",
    eyebrow: "Een blik op je eigen plek",
    titel: "Hier komt alles samen.",
    lead: "Je gesprekken, je check-ins, je herinneringen en de handreikingen van Benji: alles staat bij elkaar op één plek, ook na de acht weken.",
    shots: [
      { img: IMG.mijnPlek, label: "Mijn plek" },
      { img: IMG.persoonlijkeDoelen, label: "Persoonlijke doelen" },
      { img: IMG.checkin, label: "Dagelijkse check-ins" },
      { img: IMG.memories, label: "Memories" },
      { img: IMG.inspiratie, label: "Inspiratie & troost" },
      { img: IMG.gesprek, label: "Gesprek met Benji" },
    ],
  },

  {
    key: "document", type: "document",
    eyebrow: "Wat je overhoudt",
    titel: "Je eigen woorden, om te houden.",
    lead: "De acht weken zijn niet zomaar voorbij en dan weg. Wat je deelt, blijft van jou.",
    cards: [
      { tag: "Tijdens de acht weken", kop: "Een samenvatting van elk gesprek in je account", tekst: "Na ieder gesprek zet ik de kern voor je op je eigen plek, in jouw woorden. Zo hoef je niets vast te houden in je hoofd en kun je alles rustig teruglezen wanneer jij daar behoefte aan hebt.", img: "" },
      { tag: "Na afloop", kop: "Een persoonlijk document, in jouw woorden", tekst: "Aan het einde breng ik alles samen in één document: je gesprekken, je herinneringen, je eigen woorden. Iets tastbaars om te houden: wat er was, en waar je nu staat. Ook als de acht weken voorbij zijn, blijft dit bij jou.", img: IMG.ipad },
    ],
  },

  {
    key: "nietis", type: "nietis",
    eyebrow: "Eerlijk erbij",
    titel: "Wat Zij aan Zij níét is",
    pairs: [
      { geen: "Geen therapie.", wel: "Wel persoonlijke begeleiding. Loop je vast op een manier waar meer bij nodig is, dan denk ik met je mee over de juiste plek." },
      { geen: "Geen stappenplan.", wel: "Wel ruimte om te kijken wat jij nodig hebt." },
      { geen: "Geen deadline om verder te zijn.", wel: "Wel iemand die naast je blijft zolang jij daar behoefte aan hebt." },
      { geen: "Geen oplossing voor je verdriet.", wel: "Wel een plek waar je het niet alleen hoeft te dragen." },
    ],
  },

  {
    key: "ien", type: "ien",
    eyebrow: "Wie naast je zit",
    titel: "Hoi, ik ben Ien.",
    foto: IMG.ien,
    paras: cfg.ienParas,
  },

  {
    key: "ervaringen", type: "ervaringen",
    eyebrow: "Wat anderen ervaren",
    titel: "Gewoon iemand die bleef.",
    quotes: cfg.ervaringen.map((tekst) => ({ tekst, bron: "Voorbeeld, vervangen voor livegang" })),
  },

  {
    key: "aanbod", type: "offer", anchor: "aanbod",
    introLabel: "Wat als je het acht weken lang niet in je eentje hoeft te doen?",
    prijs: "€425",
    prijsSub: "eenmalig · 8 weken samen",
    bullets: [
      "Eens in de twee weken een persoonlijk gesprek met Ien, vier gesprekken in 8 weken",
      "Het complete Niet Alleen-programma: 8 weken om de dag een bericht",
      "Je eigen woorden terug na ieder gesprek, op je eigen plek",
      "Je eigen werkboek om te houden",
      "Een maand Benji, voor de momenten tussendoor",
      "Je eigen rustige plek voor jouw proces",
    ],
    ctaText: "Ik wil kennismaken met Zij aan Zij",
    ctaUrl: INTAKE,
    micro: "Eerst kennismaken met Ien. Je hoeft nog niets te beslissen.",
  },

  {
    key: "final", type: "final", achtergrond: "band",
    eyebrow: "Tot slot",
    titel: "Je hoeft niet te weten hoe je verder moet.\nJe hoeft het alleen niet meer alleen te doen.",
    sub: "8 weken Zij aan Zij met Ien.",
    ctaText: "Ik wil kennismaken",
    ctaUrl: INTAKE,
    micro: "Kijk rustig of Zij aan Zij bij je past. Een eerste kennismaking verplicht je tot niets.",
  },
];

const CONFIGS: Cfg[] = [
  // ── Relatiebreuk / scheiding ──────────────────────────────────────────
  {
    slug: "zij-aan-zij-relatie",
    verliestype: "relatie",
    naam: "Zij aan Zij — na een relatiebreuk",
    pageTitle: "Zij aan Zij — 8 weken persoonlijke begeleiding na een relatiebreuk",
    meta: "Persoonlijke begeleiding na een relatiebreuk of scheiding. Acht weken lang iemand die naast je blijft, met Ien en Benji.",
    heroEyebrow: "8 weken persoonlijke begeleiding na een relatiebreuk",
    titel1: "Iedereen zegt dat het beter zo is.",
    titel2: "Maar jouw hoofd is er nog niet klaar mee.",
    heroBody: [
      { soort: "lead", tekst: "Je gaat naar je werk. Je regelt de praktische dingen. Je doet wat er moet gebeuren." },
      { soort: "lead", tekst: "Maar soms word je ineens weer teruggeslingerd naar wat er was." },
      { soort: "whisper", tekst: "Een plek waar jullie samen kwamen. Een liedje. Een leeg weekend." },
      { soort: "lead", tekst: "Of gewoon: wakker worden en opnieuw beseffen dat het leven dat je kende er niet meer is." },
      { soort: "lead", tekst: "En misschien denk je dan:" },
      { soort: "thought", tekst: "Met wie moet ik hier nu over praten?" },
    ],
    herkTitel: "Je rouwt om iemand die er nog is, en toch is het gemis echt.",
    herkLead: "Je functioneert prima. En toch voelt het soms alsof iedereen doorgaat, terwijl jij ergens bent blijven staan. Misschien denk je weleens:",
    herkVoices: [
      "Ik wil erover praten, maar ik wil mijn omgeving ook niet steeds belasten.",
      "Waarom mis ik iemand van wie ik weet dat het niet meer kon?",
      "Iedereen om me heen lijkt zijn leven op orde te hebben. Waarom lukt mij dat nu niet?",
      "Ik weet niet eens goed wat ik nodig heb. Ik weet alleen dat ik dit niet alleen wil dragen.",
      "Soms wil ik gewoon vertellen wat ik vandaag mis, zonder uitleg.",
    ],
    bandTitel: "De wereld gaat verder.\nMaar jij hoeft dat niet alleen te doen.",
    bandStack: [
      "Je hoeft niet te weten hoe je verder moet.",
      "Je hoeft niet te weten wanneer je er \"overheen\" zou moeten zijn.",
      "Je hoeft niet meteen te \"loslaten\" wat lang je leven was.",
    ],
    kernNaast: [
      "Voor de dagen waarop je vooral wilt praten.",
      "Voor de dagen waarop je niets weet te zeggen.",
      "Voor de momenten waarop je ineens terugvalt, bij een herinnering of een goedbedoelde vraag.",
      "Voor de twijfels en de boosheid die je opnieuw wilt vertellen.",
      "Voor alles wat je liever niet zegt tegen iemand die jullie allebei kent.",
    ],
    ienParas: [
      "Ik ga je niet vertellen hoe je moet rouwen om een relatie die voorbij is. Ik weet hoe eenzaam het kan zijn als iedereen zegt dat het beter zo is, terwijl jij een gemis draagt dat niet zomaar weggaat.",
      "Ik ken verlies van dichtbij, in verschillende gedaantes: een bedrijf waar ik alles in had gelegd, en dieren die voor mij familie waren. Ik heb naast mensen gestaan die het zwaarste meemaakten wat er is.",
      "Daarom heb ik Zij aan Zij gemaakt. Geen methode die je moet volgen. Geen vinkjes die je moet zetten. Gewoon iemand die naast je blijft.",
    ],
    ervaringen: [
      "Voor het eerst hoefde ik niet uit te leggen waarom het na al die tijd nog steeds pijn deed.",
      "Ik dacht dat ik vooral iemand nodig had die luisterde. Pas onderweg merkte ik hoeveel ik al die tijd alleen had gedragen.",
      "Geen adviezen, geen 'je vindt vast weer iemand'. Gewoon iemand die bleef. Dat was precies wat ik nodig had.",
    ],
  },

  // ── Eenzaamheid ───────────────────────────────────────────────────────
  {
    slug: "zij-aan-zij-eenzaamheid",
    verliestype: "eenzaamheid",
    naam: "Zij aan Zij — als je je alleen voelt",
    pageTitle: "Zij aan Zij — 8 weken persoonlijke begeleiding als je je eenzaam voelt",
    meta: "Persoonlijke begeleiding als je je eenzaam voelt. Acht weken lang iemand die naast je blijft, met Ien en Benji.",
    heroEyebrow: "8 weken persoonlijke begeleiding bij eenzaamheid",
    titel1: "Je bent omringd door mensen.",
    titel2: "En toch voelt niemand echt dichtbij.",
    heroBody: [
      { soort: "lead", tekst: "Je gaat naar je werk. Je lacht mee. Je doet wat er moet gebeuren." },
      { soort: "lead", tekst: "Maar soms voel je ineens weer hoe alleen je je vanbinnen voelt." },
      { soort: "whisper", tekst: "Een verjaardag. Een druk gesprek waar je toch buiten staat. Een stille avond." },
      { soort: "lead", tekst: "Of gewoon: wakker worden en opnieuw voelen dat er niemand is bij wie je echt jezelf kunt zijn." },
      { soort: "lead", tekst: "En misschien denk je dan:" },
      { soort: "thought", tekst: "Met wie moet ik hier nu over praten?" },
    ],
    herkTitel: "Je voelt je alleen tussen de mensen, en toch is dat gemis echt.",
    herkLead: "Je functioneert prima. En toch voelt het soms alsof iedereen zijn plek heeft, terwijl jij er een beetje buiten valt. Misschien denk je weleens:",
    herkVoices: [
      "Ik wil erover praten, maar ik wil niemand tot last zijn.",
      "Waarom voel ik me juist tussen andere mensen soms het meest alleen?",
      "Iedereen om me heen lijkt zijn mensen te hebben. Waarom lukt dat mij niet?",
      "Ik weet niet eens goed wat ik nodig heb. Ik weet alleen dat ik dit niet alleen wil dragen.",
      "Soms wil ik gewoon vertellen hoe mijn dag was, zonder me groot te houden.",
    ],
    bandTitel: "De wereld gaat verder.\nMaar jij hoeft dat niet alleen te doen.",
    bandStack: [
      "Je hoeft niet te weten hoe je verder moet.",
      "Je hoeft je niet groter voor te doen dan je je voelt.",
      "Je hoeft niet eerst \"gezelliger\" of \"socialer\" te worden.",
    ],
    kernNaast: [
      "Voor de dagen waarop je vooral wilt praten.",
      "Voor de dagen waarop je niets weet te zeggen.",
      "Voor de momenten waarop het je ineens overvalt, midden tussen de mensen of juist in de stilte.",
      "Voor de gedachten die je nergens anders kwijt kunt.",
      "Voor alles wat je liever niet zegt tegen iemand die je kent.",
    ],
    ienParas: [
      "Ik ga je niet vertellen dat je 'gewoon meer onder de mensen moet'. Ik weet hoe eenzaam het kan zijn om je juist tussen anderen alleen te voelen, zonder dat iemand het ziet.",
      "Ik ken verlies van dichtbij, in verschillende gedaantes: een bedrijf waar ik alles in had gelegd, en dieren die voor mij familie waren. Ik heb naast mensen gestaan die het zwaarste meemaakten wat er is.",
      "Daarom heb ik Zij aan Zij gemaakt. Geen methode die je moet volgen. Geen vinkjes die je moet zetten. Gewoon iemand die naast je blijft.",
    ],
    ervaringen: [
      "Voor het eerst hoefde ik me niet groot te houden. Ik mocht gewoon zeggen hoe alleen ik me voelde.",
      "Ik dacht dat ik vooral iemand nodig had die luisterde. Pas onderweg merkte ik hoeveel ik al die tijd alleen had gedragen.",
      "Geen adviezen, geen 'zoek eens een clubje'. Gewoon iemand die bleef. Dat was precies wat ik nodig had.",
    ],
  },

  // ── Verlies van een huisdier ──────────────────────────────────────────
  {
    slug: "zij-aan-zij-huisdier",
    verliestype: "huisdier",
    naam: "Zij aan Zij — bij verlies van je dier",
    pageTitle: "Zij aan Zij — 8 weken persoonlijke begeleiding bij verlies van je huisdier",
    meta: "Persoonlijke begeleiding bij het verlies van je huisdier. Acht weken lang iemand die naast je blijft, met Ien en Benji.",
    heroEyebrow: "8 weken persoonlijke begeleiding bij verlies van je dier",
    titel1: "Voor de wereld was het \"maar een dier\".",
    titel2: "Voor jou was het familie.",
    heroBody: [
      { soort: "lead", tekst: "Je gaat naar je werk. Je doet je boodschappen. Je doet wat er moet gebeuren." },
      { soort: "lead", tekst: "Maar soms word je ineens weer teruggeslingerd naar het gemis." },
      { soort: "whisper", tekst: "De lege mand. Het uur van de wandeling. De stilte in huis." },
      { soort: "lead", tekst: "Of gewoon: wakker worden en opnieuw beseffen dat je maatje er niet meer is." },
      { soort: "lead", tekst: "En misschien denk je dan:" },
      { soort: "thought", tekst: "Met wie moet ik hier nu over praten?" },
    ],
    herkTitel: "Je verloor een maatje, en toch lijkt niet iedereen te snappen hoe groot dat is.",
    herkLead: "Je functioneert prima. En toch voelt het soms alsof je leven gewoon doorgaat, terwijl jij ergens bent blijven staan. Misschien denk je weleens:",
    herkVoices: [
      "Ik wil erover praten, maar ik ben bang dat mensen het overdreven vinden.",
      "Waarom doet die lege plek in huis vandaag ineens weer zo veel pijn?",
      "Mensen zeggen dat ik gewoon een nieuw dier moet nemen. Maar zo simpel is het niet.",
      "Ik weet niet eens goed wat ik nodig heb. Ik weet alleen dat ik dit niet alleen wil dragen.",
      "Soms wil ik gewoon vertellen wat ik vandaag mis, zonder uitleg.",
    ],
    bandTitel: "De wereld gaat verder.\nMaar jij hoeft dat niet alleen te doen.",
    bandStack: [
      "Je hoeft niet te weten hoe je verder moet.",
      "Je hoeft je verdriet niet klein te maken omdat het \"maar\" een dier was.",
      "Je hoeft niet meteen aan iets nieuws te denken.",
    ],
    kernNaast: [
      "Voor de dagen waarop je vooral wilt praten.",
      "Voor de dagen waarop je niets weet te zeggen.",
      "Voor de momenten waarop het je ineens overvalt, bij de lege mand of een goedbedoelde opmerking.",
      "Voor de herinneringen die je opnieuw wilt vertellen.",
      "Voor alles wat je liever niet zegt tegen iemand die het \"maar een dier\" vindt.",
    ],
    ienParas: [
      "Ik ga je niet vertellen dat het \"maar een dier\" was. Ik weet hoe groot het gemis is als je een maatje verliest dat voor jou echt familie was.",
      "Ik ken verlies van dichtbij, in verschillende gedaantes: een bedrijf waar ik alles in had gelegd, en dieren die voor mij familie waren. Ik heb naast mensen gestaan die het zwaarste meemaakten wat er is.",
      "Daarom heb ik Zij aan Zij gemaakt. Geen methode die je moet volgen. Geen vinkjes die je moet zetten. Gewoon iemand die naast je blijft.",
    ],
    ervaringen: [
      "Voor het eerst hoefde ik niet uit te leggen waarom het verlies van mijn dier zo veel met me deed.",
      "Ik dacht dat ik vooral iemand nodig had die luisterde. Pas onderweg merkte ik hoeveel ik al die tijd alleen had gedragen.",
      "Geen adviezen, geen 'neem gewoon een nieuwe'. Gewoon iemand die bleef. Dat was precies wat ik nodig had.",
    ],
  },
];

export const seedZazVerliestypes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const resultaat: { slug: string; actie: string }[] = [];
    for (const cfg of CONFIGS) {
      const data = {
        slug: cfg.slug,
        naam: cfg.naam,
        pageTitle: cfg.pageTitle,
        verliestype: cfg.verliestype,
        metaDescription: cfg.meta,
        blocksJson: JSON.stringify(bouwBlocks(cfg)),
        updatedAt: Date.now(),
      };
      const bestaand = await ctx.db
        .query("blokPaginas")
        .withIndex("by_slug", (q) => q.eq("slug", cfg.slug))
        .first();
      if (bestaand) {
        await ctx.db.patch(bestaand._id, data);
        resultaat.push({ slug: cfg.slug, actie: "bijgewerkt" });
      } else {
        await ctx.db.insert("blokPaginas", { ...data, gepubliceerd: false });
        resultaat.push({ slug: cfg.slug, actie: "aangemaakt" });
      }
    }
    return resultaat;
  },
});

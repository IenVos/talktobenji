/**
 * Seed voor de eerste blok-pagina: Zij aan Zij (verlies van iemand).
 * Draai via:  npx convex run blokPaginasSeed:seedZijAanZij
 * Overschrijft de blokken van slug "zij-aan-zij" (idempotent).
 */
import { internalMutation } from "./_generated/server";

const IMG = {
  logo: "/images/benji-logo-2.png",
  ien: "/images/ien-founder.png",
  ipad: "/images/zij-aan-zij/ipad-document.png",
  mijnPlek: "/images/screenshots/mijn-plek.png",
  checkin: "/images/screenshots/check-in.png",
  inspiratie: "/images/screenshots/inspiratie.png",
  handreikingen: "/images/screenshots/handreikingen.png",
  memories: "/images/screenshots/memories.png",
  gesprek: "/images/zij-aan-zij/gesprek.jpg",
};

const INTAKE = "intake"; // sentinel: renderer maakt hier /lp/<slug>/kennismaken van

export const zijAanZijBlocks = () => [
  { key: "header", type: "header", logo: IMG.logo, merk: "Talk To Benji", sub: "Zij aan Zij" },

  {
    key: "hero", type: "hero",
    eyebrow: "8 weken persoonlijke begeleiding bij verlies",
    titel1: "Iedereen gaat weer verder.",
    titel2: "Jij nog niet.",
    body: [
      { soort: "lead", tekst: "Je gaat naar je werk. Je praat met mensen. Je doet wat er moet gebeuren." },
      { soort: "lead", tekst: "Maar soms word je ineens weer teruggeslingerd naar het gemis." },
      { soort: "whisper", tekst: "Een liedje. Een foto. Een plek." },
      { soort: "lead", tekst: "Of gewoon: wakker worden en opnieuw beseffen dat hij of zij er echt niet meer is." },
      { soort: "lead", tekst: "En misschien denk je dan:" },
      { soort: "thought", tekst: "Met wie moet ik hier nu mee praten?" },
    ],
    ctaText: "Ik wil kennismaken met Zij aan Zij",
    ctaUrl: "#aanbod",
    micro: "Eerst kennismaken met Ien. Je hoeft nog niets te beslissen.",
    facts: "Acht weken samen: **eens in de twee weken** een persoonlijk gesprek met Ien, het complete Niet Alleen-programma en een maand Benji.",
  },

  {
    key: "herkenning", type: "herkenning",
    eyebrow: "Misschien herken je dit",
    titel: "Je mist iemand op momenten waarop niemand het ziet.",
    lead: "Je functioneert prima. En toch voelt het soms alsof je leven gewoon doorgaat, terwijl jij ergens bent blijven staan. Misschien denk je weleens:",
    voices: [
      "Ik wil erover praten, maar ik wil mijn omgeving ook niet steeds belasten.",
      "Waarom doet dit vandaag ineens weer zo veel pijn?",
      "Iedereen lijkt verder te gaan. Waarom lukt mij dat niet?",
      "Ik weet niet eens wat ik nodig heb. Ik weet alleen dat ik dit niet alleen wil dragen.",
      "Soms wil ik gewoon vertellen wat ik vandaag mis.",
    ],
    pull: "Je weet één ding zeker: **ik wil hier niet alleen mee zitten.**",
  },

  {
    key: "band", type: "band", achtergrond: "band",
    eyebrow: "De reden dat Zij aan Zij bestaat",
    titel: "De wereld gaat verder.\nMaar jij hoeft dat niet alleen te doen.",
    stack: [
      "Je hoeft niet te weten hoe je verder moet.",
      "Je hoeft niet te weten wanneer je er \"overheen\" zou moeten zijn.",
      "Je hoeft niet \"een plek te geven\" aan iets wat je misschien helemaal geen plek wilt geven.",
    ],
    kicker: "Je mag gewoon iemand naast je hebben. **En dat is Zij aan Zij.**",
  },

  {
    key: "kern", type: "kern",
    eyebrow: "Wat Zij aan Zij is",
    titel: "Je hoeft geen antwoorden te hebben.\nJe hebt iemand nodig die naast je blijft en luistert.",
    naastLabel: "Wat betekent \"naast je blijven\"?",
    naast: [
      "Voor de dagen waarop je vooral wilt praten.",
      "Voor de dagen waarop je niets weet te zeggen.",
      "Voor de momenten waarop je ineens terugvalt.",
      "Voor de herinneringen die je opnieuw wilt vertellen.",
      "Voor alles wat je liever niet zegt tegen iemand die je kent.",
    ],
    slot: "Je hoeft niet met een hulpvraag te komen. Je mag gewoon komen met hoe het vandaag is.",
  },

  {
    key: "cadence", type: "cadence",
    eyebrow: "Waarom dit ritme",
    titel: "Niet één gesprek, en dan weer alleen verder.",
    para1: "Rouw komt niet in één keer voorbij, dus laat ik je ook niet één keer alleen. **Eens in de twee weken hebben we een persoonlijk gesprek, vier keer in acht weken.** Vaak genoeg om echt iemand naast je te hebben, met genoeg ruimte ertussen om alles te laten bezinken.",
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
      { kop: "Een maand Benji", tekst: "Dag en nacht bereikbaar, juist op de momenten waarop het verdriet ineens opkomt en je even iets kwijt wilt." },
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
      { img: IMG.checkin, label: "Dagelijkse check-ins" },
      { img: IMG.inspiratie, label: "Inspiratie & troost" },
      { img: IMG.handreikingen, label: "Handreikingen" },
      { img: IMG.memories, label: "Memories" },
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
    paras: [
      "Ik ga je niet vertellen hoe je moet rouwen. Ik weet hoe eenzaam het kan zijn als iedereen om je heen alweer doorgaat, terwijl jij nog elke dag iemand mist die er niet meer is.",
      "Ik ken verlies in veel gedaantes: een kinderwens die niet uitkwam, een bedrijf waar ik alles in had gelegd, en dieren die voor mij familie waren. Ik heb naast mensen gestaan die het zwaarste meemaakten wat er is: mensen die hun partner verloren, ouders die hun kind moesten loslaten.",
      "Daarom heb ik Zij aan Zij gemaakt. Geen methode die je moet volgen. Geen vinkjes die je moet zetten. Gewoon iemand die naast je blijft.",
    ],
  },

  {
    key: "ervaringen", type: "ervaringen",
    eyebrow: "Wat anderen ervaren",
    titel: "Gewoon iemand die bleef.",
    quotes: [
      { tekst: "Voor het eerst hoefde ik niet uit te leggen waarom ik na drie maanden nog steeds verdrietig was.", bron: "Voorbeeld, vervangen voor livegang" },
      { tekst: "Ik dacht dat ik vooral iemand nodig had die luisterde. Pas onderweg merkte ik hoeveel ik al die tijd alleen had gedragen.", bron: "Voorbeeld, vervangen voor livegang" },
      { tekst: "Geen adviezen, geen 'geef het tijd'. Gewoon iemand die bleef. Dat was precies wat ik nodig had.", bron: "Voorbeeld, vervangen voor livegang" },
    ],
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

export const seedZijAanZij = internalMutation({
  args: {},
  handler: async (ctx) => {
    const slug = "zij-aan-zij";
    const blocksJson = JSON.stringify(zijAanZijBlocks());
    const bestaand = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    const data = {
      slug,
      naam: "Zij aan Zij — verlies van iemand",
      pageTitle: "Zij aan Zij — 8 weken persoonlijke begeleiding bij verlies",
      verliestype: "persoon",
      gepubliceerd: true,
      metaDescription:
        "Persoonlijke begeleiding bij verlies. Acht weken lang iemand die naast je blijft, met Ien en Benji.",
      blocksJson,
      updatedAt: Date.now(),
    };
    if (bestaand) {
      await ctx.db.patch(bestaand._id, data);
      return { patched: bestaand._id };
    }
    return { inserted: await ctx.db.insert("blokPaginas", data) };
  },
});

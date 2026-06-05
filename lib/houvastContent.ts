/**
 * Even Houvast — content & types.
 * De content is beheerbaar via de admin (Pagina's → Even Houvast, pageKey "houvast").
 * Deze defaults zijn de fallback wanneer er nog niets is opgeslagen.
 */

export type HouvastMoment = {
  id: string;
  nav: string;            // korte navigatielabel, bv. "1"
  titel: string;
  intro: string;          // alinea's gescheiden door een lege regel
  oefeningTitel: string;
  oefeningTekst: string;  // alinea's gescheiden door een lege regel
  vraag: string;
  metFoto: boolean;
};

export type HouvastContent = {
  welkomTitel: string;
  welkomTekst: string;    // alinea's gescheiden door een lege regel
  momenten: HouvastMoment[];
  slotTitel: string;
  slotTekst: string;      // alinea's gescheiden door een lege regel
  briefInstructie: string;          // system prompt voor Claude (Benji-toon)
  nietAlleenLinks: Record<string, string>; // verliestype-code → doel-URL
};

/** Splitst een tekstveld in alinea's (lege regel = nieuwe alinea). */
export function alineas(tekst: string | undefined): string[] {
  if (!tekst) return [];
  return tekst
    .split(/\n\s*\n/)
    .map((a) => a.trim())
    .filter(Boolean);
}

export const HOUVAST_BRIEF_INSTRUCTIE_DEFAULT = `Je bent Benji — een warme, rustige metgezel bij verdriet en verlies. Iemand heeft net de gratis mini-gids "Even Houvast" doorlopen en bij een paar momenten iets opgeschreven. Schrijf op basis van hun antwoorden een korte, persoonlijke brief terug — een "brief aan zichzelf", alsof er iemand echt geluisterd heeft.

Toon en stijl:
- Nederlands, warm, zacht, dichtbij. Geen therapeuten-taal, geen clichés, geen oplossingen of advies.
- Begin niet met hun woorden letterlijk te herhalen. Weef hun antwoorden tot één geheel.
- Een korte opening, hun woorden verweven in een lopende tekst, en een slotzin die dit moment afsluit.
- Kort: 150 tot 220 woorden. Geen kopjes, geen opsommingen, geen aanhef als "Beste". Schrijf in de tweede persoon ("je").
- Gebruik GEEN streepjes of gedachtestreepjes (— of –) in de tekst. Schrijf gewone zinnen met komma's en punten.
- Verzin geen feiten, namen of relaties die ze niet zelf hebben benoemd.
- Eindig met iets wat rust en nabijheid geeft, zonder te beloven dat het overgaat.

Geef alleen de brieftekst terug, niets anders.`;

export const DEFAULT_HOUVAST: HouvastContent = {
  welkomTitel: "Welkom",
  welkomTekst: [
    "Je bent hier omdat je iets draagt wat zwaar is.",
    "Misschien weet je precies wat het is. Misschien ook niet. Misschien is het verdriet om iemand die er niet meer is, om iets wat anders liep dan je had gehoopt, om een leven dat er nu anders uitziet dan je had verwacht.",
    "Het maakt niet uit hoe je het noemt. Het telt.",
    "Houvast is er niet om je verdriet op te lossen. Dat kan niemand. Maar voor elk moment dat het extra zwaar voelt, vind je hier iets wat je nu meteen kunt doen. Klein. Eerlijk. Zonder dat je er iets voor hoeft te weten of te begrijpen.",
    "Je hoeft dit niet alleen te dragen.",
  ].join("\n\n"),
  momenten: [
    {
      id: "m1",
      nav: "1",
      titel: "Als je 's nachts wakker ligt",
      intro: [
        "Het is 3 uur. De rest van de wereld slaapt. Jij niet.",
        "De stilte voelt te groot. Je hoofd maakt overuren over dingen die je overdag probeert weg te duwen. Dit is niet gek. 's Nachts is er geen afleiding meer, dan komt het verdriet gewoon langs.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Leg je hand op je borst. Voel je hartslag. Zeg zachtjes, hardop of in gedachten: \"Ik ben hier. Dit mag er zijn.\"",
        "Niet om het weg te maken, maar om jezelf even gezelschap te houden.",
      ].join("\n\n"),
      vraag: "Wat houdt je nu het meest bezig?",
      metFoto: false,
    },
    {
      id: "m2",
      nav: "2",
      titel: "Als je niet weet wat je voelt",
      intro: [
        "Verdoofd. Leeg. Of juist alles tegelijk, en je weet niet eens hoe je dat moet noemen.",
        "Verdriet ziet er niet altijd uit zoals in films. Soms is het een waas. Soms voel je gewoon niks. En dat voelt dan ook weer verkeerd. Maar verdoofdheid is ook een manier waarop je lichaam je beschermt. Het klopt.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Pak een vel papier en schrijf drie woorden op die ook maar een beetje in de buurt komen van wat je voelt.",
        "Geen zinnen. Geen uitleg. Gewoon drie woorden. Je hoeft het niet te begrijpen.",
      ].join("\n\n"),
      vraag: "Als je gevoel vandaag een kleur had, welke zou dat zijn?",
      metFoto: false,
    },
    {
      id: "m3",
      nav: "3",
      titel: "Als iemand vraagt \"hoe gaat het\" en je het antwoord niet weet",
      intro: [
        "Je zegt \"gaat wel\" of \"beetje moe.\" En terwijl je het zegt, voel je hoe eenzaam dat is.",
        "Want het echte antwoord is te groot voor een praatje tussendoor. Dus je verpakt het. Elke dag weer. Dat kost meer energie dan mensen denken. Steeds doen alsof je er bent terwijl je er eigenlijk niet helemaal bent.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Je hoeft het niemand uit te leggen. Maar schrijf voor jezelf, nu, het antwoord op zoals je het écht zou willen geven.",
        "Niemand leest het. Het is alleen voor jou.",
      ].join("\n\n"),
      vraag: "Aan wie zou je het echte antwoord wel durven geven?",
      metFoto: false,
    },
    {
      id: "m4",
      nav: "4",
      titel: "Als een foto, een geur of een liedje je overspoelt",
      intro: [
        "Zonder waarschuwing. Midden op de dag. En ineens ben je er helemaal in.",
        "Een nummer op de radio. De geur van een jas. Een foto die je niet zocht maar toch tegenkwam. Het overspoelt je en je weet even niet meer waar je bent.",
        "Dit zijn geen zwakke momenten. Dit zijn momenten waarop je liefde voelt. Rouw en liefde zijn hetzelfde.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Laat het even komen. Zet geen wekker, leg je telefoon weg, en geef het twee minuten.",
        "Huil als het komt. Adem als het zakt. Je hoeft het niet weg te duwen.",
      ].join("\n\n"),
      vraag: "Waar denk je aan als dit gebeurt?",
      metFoto: true,
    },
    {
      id: "m5",
      nav: "5",
      titel: "Als je je schuldig voelt dat je even gelachen hebt",
      intro: [
        "Even niet aan het verdriet gedacht. En dan meteen dat steekje: hoe kan ik lachen terwijl...",
        "Dit is een van de zwaarste dingen aan verdriet, dat je je schuldig voelt over de momenten dat het even lichter is. Alsof lachen verraad is. Maar dat is het niet.",
        "Lachen betekent niet dat je het loslaat. Het betekent dat je nog leeft. En dat is precies wat degene van wie je houdt voor je zou willen.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Schrijf één herinnering op die je blij maakt. Niet om het verdriet te vergeten, maar om het naast elkaar te laten bestaan.",
        "Blij en verdrietig tegelijk. Dat mag.",
      ].join("\n\n"),
      vraag: "Waar lachte jij om, en waarom voelt dat goed én moeilijk tegelijk?",
      metFoto: false,
    },
  ],
  slotTitel: "En nu?",
  slotTekst: [
    "'Houvast' is er voor de eerste stap. Voor de langere weg is er Niet Alleen — een programma dat je dag voor dag begeleidt.",
  ].join("\n\n"),
  briefInstructie: HOUVAST_BRIEF_INSTRUCTIE_DEFAULT,
  nietAlleenLinks: {
    persoon: "/lp/je-hoeft-het-niet-alleen-te-doen",
    huisdier: "/lp/je-hoeft-het-niet-alleen-te-doen",
    scheiding: "/lp/je-hoeft-het-niet-alleen-te-doen",
    eenzaamheid: "/lp/je-hoeft-het-niet-alleen-te-doen",
  },
};

/** Voegt opgeslagen (admin) content samen met de defaults. */
export function mergeHouvast(saved: Partial<HouvastContent> | null | undefined): HouvastContent {
  if (!saved) return DEFAULT_HOUVAST;
  return {
    welkomTitel: saved.welkomTitel || DEFAULT_HOUVAST.welkomTitel,
    welkomTekst: saved.welkomTekst || DEFAULT_HOUVAST.welkomTekst,
    momenten:
      Array.isArray(saved.momenten) && saved.momenten.length > 0
        ? saved.momenten
        : DEFAULT_HOUVAST.momenten,
    slotTitel: saved.slotTitel || DEFAULT_HOUVAST.slotTitel,
    slotTekst: saved.slotTekst || DEFAULT_HOUVAST.slotTekst,
    briefInstructie: saved.briefInstructie || DEFAULT_HOUVAST.briefInstructie,
    nietAlleenLinks: { ...DEFAULT_HOUVAST.nietAlleenLinks, ...(saved.nietAlleenLinks || {}) },
  };
}

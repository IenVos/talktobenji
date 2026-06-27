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

// Per verliestype overschrijfbare velden. Alles optioneel: leeg = val terug op de
// basis-versie (de globale velden hieronder).
export type HouvastPerType = {
  welkomTitel?: string;
  welkomTekst?: string;
  momenten?: HouvastMoment[];
  slotTitel?: string;
  slotTekst?: string;
  slotPrijsRegel?: string;   // kleine prijs-/verwachtingsregel onder de knop
  briefInstructie?: string;
  fotoGedicht?: string;      // 4-regelig gedichtje onder de foto's in de brief-mail
};

export type HouvastContent = {
  welkomTitel: string;
  welkomTekst: string;    // alinea's gescheiden door een lege regel
  momenten: HouvastMoment[];
  slotTitel: string;
  slotTekst: string;      // alinea's gescheiden door een lege regel
  slotPrijsRegel?: string;          // optionele prijsregel onder de "Ontdek Niet Alleen"-knop (basis)
  briefInstructie: string;          // system prompt voor Claude (Benji-toon)
  fotoGedicht?: string;             // basis 4-regelig gedichtje onder de foto's (terugval)
  nietAlleenLinks: Record<string, string>; // verliestype-code → doel-URL
  perType?: Record<string, HouvastPerType>; // verliestype-code → eigen teksten
};

/** Effectieve content voor een bezoeker: per-type velden vallen terug op de basis. */
export function resolveHouvast(c: HouvastContent, typeCode: string | undefined) {
  const o: HouvastPerType = (typeCode && c.perType?.[typeCode]) || {};
  return {
    welkomTitel: (o.welkomTitel ?? "").trim() || c.welkomTitel,
    welkomTekst: (o.welkomTekst ?? "").trim() || c.welkomTekst,
    momenten: o.momenten && o.momenten.length > 0 ? o.momenten : c.momenten,
    slotTitel: (o.slotTitel ?? "").trim() || c.slotTitel,
    slotTekst: (o.slotTekst ?? "").trim() || c.slotTekst,
    slotPrijsRegel: ((o.slotPrijsRegel ?? c.slotPrijsRegel) ?? "").trim(),
    briefInstructie: (o.briefInstructie ?? "").trim() || c.briefInstructie,
    fotoGedicht: (o.fotoGedicht ?? "").trim() || (c.fotoGedicht ?? "").trim(),
  };
}

/**
 * Normaliseert een Niet Alleen-doellink naar een geldige LP-URL.
 * Accepteert een volledige URL, "/lp/slug", "/slug" of "slug" → altijd "/lp/slug".
 */
export function naarLpUrl(raw: string | undefined): string {
  const v = (raw || "").trim();
  if (!v) return "/lp/je-hoeft-het-niet-alleen-te-doen";
  if (v.startsWith("http")) return v;
  if (v.startsWith("/lp/")) return v;
  const slug = v.replace(/^\/+/, "").replace(/^lp\//, "");
  return `/lp/${slug}`;
}

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

// Vast, unisex gedichtje (4 regels) onder de foto's in de brief-mail, per verliestype.
// Spiegelbeeld van GEDICHT_PER_TYPE in convex/houvast.ts (houd beide gelijk).
export const HOUVAST_FOTO_GEDICHT_DEFAULT: Record<string, string> = {
  persoon: `Wat jullie hadden,
neemt niemand ooit weg.
Het leeft in deze beelden,
en in jou, voorgoed.`,
  huisdier: `Trouw tot het einde,
dichtbij zonder woorden.
Wat jullie samen waren,
draag je voor altijd mee.`,
  scheiding: `Niet alles wat eindigt,
ging verloren.
Wat echt was, blijft echt,
en jij komt hier doorheen.`,
  eenzaamheid: `Ook in de stilte
ben je meer dan dit moment.
Je bent niet vergeten,
en je staat er niet alleen voor.`,
  kinderloos: `Een liefde zo groot,
voor wie er nooit kwam.
Dit gemis is echt,
en het mag er zijn.`,
};

export const DEFAULT_HOUVAST: HouvastContent = {
  welkomTitel: "Wat goed dat je hier bent",
  welkomTekst: [
    "Je bent hier omdat je iets draagt wat zwaar is.",
    "Je hoeft hier niets uit te leggen. In de komende vijf momenten krijg je de ruimte om stil te staan bij wat er in je leeft.",
    "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
  ].join("\n\n"),
  momenten: [
    {
      id: "m1", nav: "1",
      titel: "Als je 's nachts wakker ligt",
      intro: [
        "Het is 3 uur. De rest van de wereld slaapt. Jij niet.",
        "De stilte voelt te groot, en juist nu mis je hem of haar het meest. Dit is niet gek. 's Nachts is er geen afleiding, dan komt het gemis gewoon langs.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Leg je hand op je borst. Voel je hartslag. Zeg zachtjes: \"Ik ben hier. Dit mag er zijn.\"",
        "Niet om het weg te maken, maar om jezelf even gezelschap te houden.",
      ].join("\n\n"),
      vraag: "Wat mis je op dit moment het meest?",
      metFoto: false,
    },
    {
      id: "m2", nav: "2",
      titel: "Als je niet weet wat je voelt",
      intro: [
        "Verdoofd. Leeg. Of juist alles tegelijk.",
        "Verdriet om iemand ziet er niet altijd uit zoals je denkt. Soms voel je niks, en dat voelt ook weer verkeerd. Maar verdoofdheid is hoe je lichaam je even beschermt. Het klopt.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Schrijf drie woorden op die ook maar een beetje in de buurt komen van wat je voelt.",
        "Geen zinnen, geen uitleg. Je hoeft het niet te begrijpen.",
      ].join("\n\n"),
      vraag: "Als je gevoel vandaag een kleur had, welke zou dat zijn?",
      metFoto: false,
    },
    {
      id: "m3", nav: "3",
      titel: "Als iemand vraagt hoe het gaat en je het antwoord niet weet",
      intro: [
        "Je zegt \"gaat wel.\" En terwijl je het zegt, voel je hoe eenzaam dat is.",
        "Het echte antwoord, dat je iemand mist die er niet meer is, is te groot voor een praatje tussendoor. Dus je verpakt het. Elke dag weer.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Schrijf voor jezelf het antwoord op zoals je het écht zou willen geven.",
        "Niemand leest het. Het is alleen voor jou.",
      ].join("\n\n"),
      vraag: "Aan wie zou je het echte antwoord wel durven geven?",
      metFoto: false,
    },
    {
      id: "m4", nav: "4",
      titel: "Als een foto, een geur of een liedje je overspoelt",
      intro: [
        "Zonder waarschuwing. Midden op de dag.",
        "Een nummer, de geur van een jas, een foto die je niet zocht. Ineens is hij of zij er weer helemaal. Dit zijn geen zwakke momenten. Dit is liefde die je voelt.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Laat het even komen. Leg je telefoon weg en geef het twee minuten.",
        "Huil als het komt, adem als het zakt.",
      ].join("\n\n"),
      vraag: "Welke herinnering komt nu naar boven?",
      metFoto: true,
    },
    {
      id: "m5", nav: "5",
      titel: "Als je je schuldig voelt dat je even gelachen hebt",
      intro: [
        "Even niet aan het gemis gedacht. En dan dat steekje: hoe kan ik lachen terwijl...",
        "Lachen betekent niet dat je hem of haar loslaat. Het betekent dat je nog leeft. En dat is precies wat diegene voor je zou willen.",
      ].join("\n\n"),
      oefeningTitel: "Wat je nu kunt doen",
      oefeningTekst: [
        "Schrijf één herinnering op die je blij maakt. Niet om het verdriet te vergeten, maar om het ernaast te laten bestaan.",
        "Blij en verdrietig tegelijk. Dat mag.",
      ].join("\n\n"),
      vraag: "Waar moest je om lachen, en waarom voelt dat goed én moeilijk tegelijk?",
      metFoto: false,
    },
  ],
  slotTitel: "En nu?",
  slotTekst: [
    "'Even Houvast' is er voor dit moment. Maar verdriet stopt niet na een paar dagen, en ook daarna hoef je het niet alleen te dragen.",
    "Niet Alleen loopt dertig dagen met je mee. Elke dag een klein, persoonlijk bericht dat past bij jouw verlies: iets om bij stil te staan, ruimte om te schrijven of in te spreken, en een plek voor de herinneringen die je wil bewaren.",
    "Geen grote stappen, geen druk, alles in jouw eigen tempo. Gewoon iemand die naast je staat, dag voor dag, zodat de zwaarste momenten net iets lichter worden. En aan het eind houd je een blijvend document over dat helemaal van jou is.",
  ].join("\n\n"),
  briefInstructie: HOUVAST_BRIEF_INSTRUCTIE_DEFAULT,
  fotoGedicht: HOUVAST_FOTO_GEDICHT_DEFAULT.persoon,
  nietAlleenLinks: {
    persoon: "/lp/je-mist-iemand",
    huisdier: "/lp/niet-alleen-voor-hulp-bij-verlies-van-huisdier",
    scheiding: "/lp/mijn-relatie-is-voorbij",
    eenzaamheid: "/lp/ik-voel-me-eenzaam",
    kinderloos: "/lp/ongewenst-kinderloos-die-pijn-gaat-nooit-weg",
  },
  // Per verliestype: welkomtekst (openingszin + overgang + vaste briefbelofte) en de
  // "En nu?"-tekst zijn afgestemd. Momenten en brief-instructie blijven leeg, dus die
  // vallen terug op de basis tot ze in de admin per type worden ingevuld.
  // Opbouw welkomtekst: 1e alinea = openingszin (groot), laatste = briefbelofte (vet).
  perType: {
    persoon: {
      welkomTekst: [
        "Je mist iemand. Dat is een van de zwaarste dingen die er zijn.",
        "Je hoeft hier niets uit te leggen. In de komende vijf momenten krijg je de ruimte om stil te staan bij wat er in je leeft.",
        "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
      ].join("\n\n"),
      slotTekst: [
        "Overdag hou je het vol. Maar er zijn momenten dat het ineens te groot is.",
        "Niet Alleen is er voor die momenten. Dertig dagen, een bericht per dag. Geen grote stappen, alleen iemand die er is.",
      ].join("\n\n"),
    },
    huisdier: {
      welkomTekst: [
        "Je mist je huisdier. En je weet hoe verkeerd mensen het soms begrijpen. Het telt.",
        "Je hoeft je hier niet te rechtvaardigen. In de komende vijf momenten krijg je de ruimte om stil te staan bij wat er in je leeft.",
        "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
      ].join("\n\n"),
      slotTekst: [
        "Mensen zeggen: het was maar een dier. Jij weet hoe fout dat is.",
        "Rouw om een huisdier is echte rouw. Niet Alleen begrijpt dat. Dertig dagen lang een bericht per dag, zonder oordeel, zonder dat je het hoeft uit te leggen.",
      ].join("\n\n"),
      momenten: [
        {
          id: "huisdier-1", nav: "1",
          titel: "Als je 's nachts wakker ligt",
          intro: [
            "Het is stil in huis. Geen getrippel, geen ademhaling naast je, geen warm lijf dat tegen je aan kruipt.",
            "Juist 's nachts valt die lege plek het meest op. Dat je dit voelt om een dier, zegt alleen maar hoeveel hij of zij voor je betekende.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Leg je hand op je borst en voel je hartslag. Zeg zachtjes: \"Ik mis je. Dit mag er zijn.\"",
          ].join("\n\n"),
          vraag: "Wat mis je nu het meest aan hem of haar?",
          metFoto: false,
        },
        {
          id: "huisdier-2", nav: "2",
          titel: "Als je niet weet wat je voelt",
          intro: [
            "Verdoofd, leeg, of alles tegelijk. En misschien ook twijfel: mag ik hier zo kapot van zijn?",
            "Ja. Je verloor een maatje dat er elke dag was, zonder oordeel. Dat je niet weet wat je voelt, is normaal.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf drie woorden op die in de buurt komen van wat je voelt. Geen uitleg nodig.",
          ].join("\n\n"),
          vraag: "Als je gevoel vandaag een kleur had, welke zou dat zijn?",
          metFoto: false,
        },
        {
          id: "huisdier-3", nav: "3",
          titel: "Als iemand zegt dat het maar een dier was",
          intro: [
            "Misschien zei iemand het hardop. Misschien voel je het in hoe ze reageren: alsof het minder telt.",
            "Maar jij weet hoe groot dit is. Je hoeft je verdriet bij niemand te verdedigen.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf voor jezelf op wat hij of zij voor je betekende, zonder het klein te maken. Dit is alleen voor jou.",
          ].join("\n\n"),
          vraag: "Wat zou je willen dat anderen begrepen?",
          metFoto: false,
        },
        {
          id: "huisdier-4", nav: "4",
          titel: "Als een leeg plekje of een geluid je overspoelt",
          intro: [
            "De lege mand. Het riempje aan de haak. Het plekje op de bank waar hij altijd lag.",
            "Ineens ben je er helemaal in. Dit zijn geen zwakke momenten. Dit is de liefde die je voelt voor wat je samen had.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Laat het even komen. Geef het twee minuten. Huil als het komt, adem als het zakt.",
          ].join("\n\n"),
          vraag: "Welk moment met hem of haar komt nu naar boven?",
          metFoto: true,
        },
        {
          id: "huisdier-5", nav: "5",
          titel: "Als je je schuldig voelt dat je even gelachen hebt",
          intro: [
            "Even niet aan het gemis gedacht. En dan dat steekje.",
            "Maar lachen betekent niet dat je hem of haar vergeet. De fijnste herinneringen aan een dier zijn juist de vrolijke. Die mogen er zijn.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf één herinnering op waar je blij van wordt. Een gekke gewoonte, een spelletje, een blik.",
          ].join("\n\n"),
          vraag: "Waar moest je om lachen als je aan hem of haar denkt?",
          metFoto: false,
        },
      ],
    },
    scheiding: {
      welkomTekst: [
        "Je relatie is voorbij. Je rouwt om iemand die nog leeft, en dat doet evenveel pijn.",
        "Er is geen afscheid voor dit verdriet, maar het is er. In de komende vijf momenten krijg je de ruimte om het een plek te geven.",
        "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
      ].join("\n\n"),
      slotTekst: [
        "Je rouwt om iemand die nog leeft. Dat is verwarrend, en het doet evenveel pijn.",
        "Verdriet om een relatie heeft geen begrafenis, geen kaarten, geen erkend moment van afscheid. Niet Alleen is er voor dit stille verlies. Dertig dagen, op jouw tempo.",
      ].join("\n\n"),
      momenten: [
        {
          id: "scheiding-1", nav: "1",
          titel: "Als je 's nachts wakker ligt",
          intro: [
            "De andere kant van het bed is leeg, of juist te vol van wat er was.",
            "'s Nachts komen de gedachten: wat als, waarom, had ik maar. Dat je hierom wakker ligt is geen zwakte. Je rouwt om iemand die er nog is, en dat is verwarrend en zwaar.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Leg je hand op je borst. Zeg zachtjes: \"Ik ben hier. Dit mag er zijn.\"",
          ].join("\n\n"),
          vraag: "Wat houdt je vannacht het meest bezig?",
          metFoto: false,
        },
        {
          id: "scheiding-2", nav: "2",
          titel: "Als je niet weet wat je voelt",
          intro: [
            "Verdriet, opluchting, woede, gemis, soms allemaal binnen een uur.",
            "Bij het einde van een relatie lopen gevoelens door elkaar. Dat maakt je niet verward of ondankbaar. Het laat zien hoeveel er speelde.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf drie woorden op die in de buurt komen van wat je nu voelt. Ze mogen elkaar tegenspreken.",
          ].join("\n\n"),
          vraag: "Welke twee gevoelens botsen op dit moment het meest?",
          metFoto: false,
        },
        {
          id: "scheiding-3", nav: "3",
          titel: "Als iemand vraagt hoe het gaat",
          intro: [
            "Je zegt \"gaat wel.\" Maar er is geen begrafenis, geen kaart, geen erkend moment, en toch ben je iemand kwijt.",
            "Dat stille verlies uitleggen in een praatje tussendoor lukt niet. Dus je verpakt het.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf voor jezelf op wat je écht zou willen zeggen als iemand het echt zou vragen.",
          ].join("\n\n"),
          vraag: "Wat zou je willen dat mensen begrepen over dit afscheid?",
          metFoto: false,
        },
        {
          id: "scheiding-4", nav: "4",
          titel: "Als een plek of een liedje je overspoelt",
          intro: [
            "Een café waar jullie kwamen. Een nummer dat van jullie was. Een foto die ineens voorbijkomt.",
            "Het overspoelt je, ook al wil je verder. Dat je dit voelt betekent niet dat je een fout maakt. Het betekent dat het echt was.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Laat het even komen. Geef het twee minuten zonder jezelf te veroordelen.",
          ].join("\n\n"),
          vraag: "Wat raakt je nu, en wat zegt dat over wat je mist?",
          metFoto: true,
        },
        {
          id: "scheiding-5", nav: "5",
          titel: "Als je je schuldig voelt over een goed moment",
          intro: [
            "Een avond gelachen, je even vrij gevoeld. En dan de twijfel: mag dat al?",
            "Ja. Een licht moment betekent niet dat het niet telde. Het betekent dat er ook weer ruimte komt voor jou.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf één moment van de afgelopen tijd op waarin je je even goed voelde. Laat het er gewoon zijn.",
          ].join("\n\n"),
          vraag: "Wanneer voelde je je voor het laatst even vrij, en hoe was dat?",
          metFoto: false,
        },
      ],
    },
    eenzaamheid: {
      welkomTekst: [
        "Je voelt je eenzaam. Misschien met mensen om je heen, en toch ongezien.",
        "Je hoeft het hier niet uit te leggen. In de komende vijf momenten krijg je de ruimte om stil te staan bij wat je draagt.",
        "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
      ].join("\n\n"),
      slotTekst: [
        "Er zijn van die avonden dat je denkt: niemand zou het merken als ik er niet was.",
        "Dat gevoel is zwaarder dan het lijkt. Niet Alleen is er juist op die momenten. Elke dag een klein bericht, als een hand op je schouder.",
      ].join("\n\n"),
      momenten: [
        {
          id: "eenzaamheid-1", nav: "1",
          titel: "Als je 's nachts wakker ligt",
          intro: [
            "Het is 3 uur. De wereld slaapt en jij voelt je alleen, ook als er mensen in huis zijn.",
            "'s Nachts wordt dat gevoel groter, omdat er niets is om het te overstemmen. Dat je dit voelt, betekent niet dat er iets mis is met jou.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Leg je hand op je borst en voel je hartslag. Zeg zachtjes: \"Ik ben hier. Ik ben er voor mezelf.\"",
          ].join("\n\n"),
          vraag: "Wat mis je op dit moment het meest?",
          metFoto: false,
        },
        {
          id: "eenzaamheid-2", nav: "2",
          titel: "Als je niet weet wat je voelt",
          intro: [
            "Leeg, grijs, of gewoon niks. En tegelijk een gemis dat je niet goed kunt benoemen.",
            "Eenzaamheid is moeilijk te vatten in woorden. Dat je het niet scherp krijgt, betekent niet dat het er niet is.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf drie woorden op die in de buurt komen van wat je voelt. Niet uitleggen, gewoon opschrijven.",
          ].join("\n\n"),
          vraag: "Als dit gevoel een kleur had, welke zou dat zijn?",
          metFoto: false,
        },
        {
          id: "eenzaamheid-3", nav: "3",
          titel: "Als iemand vraagt hoe het gaat",
          intro: [
            "Je zegt \"gaat wel.\" Want zeggen dat je je eenzaam voelt, voelt bijna als iets opbiechten.",
            "Maar je hoeft je hier niet voor te schamen. Eenzaamheid zegt niets over je waarde, alleen iets over wat je mist.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf voor jezelf op hoe je je echt voelt, zonder het mooier te maken.",
          ].join("\n\n"),
          vraag: "Tegen wie zou je het wél durven zeggen?",
          metFoto: false,
        },
        {
          id: "eenzaamheid-4", nav: "4",
          titel: "Als een herinnering aan vroeger je overspoelt",
          intro: [
            "Een tijd waarin je je wél verbonden voelde. Mensen om je heen, een plek waar je hoorde.",
            "Die herinnering kan ineens groot worden en pijn doen. Maar hij laat ook zien dat je weet hoe verbondenheid voelt, en dat je het opnieuw kunt vinden.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Laat de herinnering even komen. Geef het twee minuten.",
          ].join("\n\n"),
          vraag: "Wanneer voelde je je voor het laatst echt gezien?",
          metFoto: true,
        },
        {
          id: "eenzaamheid-5", nav: "5",
          titel: "Als je je schuldig voelt over een goed moment",
          intro: [
            "Even een fijn gesprek, een lach, een moment van contact. En daarna weer die leegte, bijna alsof het niet mocht.",
            "Dat goede moment telt. Het laat zien dat verbinding er nog steeds kan zijn, ook voor jou.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf één klein moment op waarop je je even minder alleen voelde.",
          ].join("\n\n"),
          vraag: "Wat gaf je dat moment, en hoe zou je er meer van kunnen vinden?",
          metFoto: false,
        },
      ],
    },
    kinderloos: {
      welkomTekst: [
        "Je kinderwens kwam niet uit. Je rouwt om een toekomst die nooit is geweest.",
        "Veel mensen weten dit niet te benoemen. Jij hoeft dat hier niet. In de komende vijf momenten krijg je de ruimte om stil te staan bij wat je draagt.",
        "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
      ].join("\n\n"),
      slotTekst: [
        "Je rouwt om een toekomst die nooit is geweest. Dat is een van de zwaarste vormen van verlies, en een van de meest onzichtbare.",
        "Niet Alleen is er voor wat anderen niet altijd kunnen benoemen. Dertig dagen, een bericht per dag, voor het verdriet dat geen datum heeft.",
      ].join("\n\n"),
      momenten: [
        {
          id: "kinderloos-1", nav: "1",
          titel: "Als je 's nachts wakker ligt",
          intro: [
            "Het is stil, en in die stilte komt de toekomst langs die er niet kwam.",
            "'s Nachts is er geen afleiding voor het gemis van iets wat er nooit was. Dat dit zo zwaar weegt, is geen aanstellerij. Het is echt verlies.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Leg je hand op je borst en voel je hartslag. Zeg zachtjes: \"Dit verdriet mag er zijn.\"",
          ].join("\n\n"),
          vraag: "Wat houdt je vannacht het meest bezig?",
          metFoto: false,
        },
        {
          id: "kinderloos-2", nav: "2",
          titel: "Als je niet weet wat je voelt",
          intro: [
            "Verdriet, jaloezie, leegte, schaamte, soms tegelijk.",
            "Rouwen om een kind dat er nooit kwam heeft geen vaste vorm. Dat je je gevoel niet kunt benoemen, betekent niet dat het er niet mag zijn.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf drie woorden op die in de buurt komen van wat je voelt. Ze mogen rauw zijn.",
          ].join("\n\n"),
          vraag: "Als dit gevoel een kleur had, welke zou dat zijn?",
          metFoto: false,
        },
        {
          id: "kinderloos-3", nav: "3",
          titel: "Als iemand vraagt wanneer jullie kinderen krijgen",
          intro: [
            "Een vraag die bedoeld is als interesse, maar binnenkomt als een mes.",
            "Je lacht het weg of zegt \"we zien wel.\" En niemand ziet wat het met je doet. Dit verdriet is onzichtbaar, en juist daarom zo eenzaam.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf voor jezelf op wat je écht zou willen antwoorden op die vraag.",
          ].join("\n\n"),
          vraag: "Wat zou je willen dat mensen begrepen?",
          metFoto: false,
        },
        {
          id: "kinderloos-4", nav: "4",
          titel: "Als een zwangerschap of een kinderwagen je overspoelt",
          intro: [
            "Een aankondiging, een buik, een kinderwagen in de winkel. Zonder waarschuwing.",
            "Het overspoelt je, en daarna komt vaak schaamte over je eigen reactie. Maar je gunt anderen hun geluk. Dit is gewoon je eigen verdriet dat even naar boven komt.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Laat het even komen. Geef het twee minuten en wees zacht voor jezelf.",
          ].join("\n\n"),
          vraag: "Wat raakt je hierin het meest?",
          metFoto: true,
        },
        {
          id: "kinderloos-5", nav: "5",
          titel: "Als je je schuldig voelt over een goed moment",
          intro: [
            "Even onbezorgd gelachen, even niet gedacht aan wat je mist. En dan dat steekje.",
            "Een licht moment betekent niet dat je het verdriet wegduwt. Het betekent dat er naast het gemis ook nog leven is dat van jou is.",
          ].join("\n\n"),
          oefeningTitel: "Wat je nu kunt doen",
          oefeningTekst: [
            "Schrijf één ding op waar je de afgelopen tijd van genoot. Laat het er zonder schuld zijn.",
          ].join("\n\n"),
          vraag: "Waar werd je laatst even blij van?",
          metFoto: false,
        },
      ],
    },
  },
};

/** Voegt opgeslagen (admin) content samen met de defaults.
 *  Lege link-velden vallen terug op de default-LP van dat verliestype. */
export function mergeHouvast(saved: Partial<HouvastContent> | null | undefined): HouvastContent {
  if (!saved) return DEFAULT_HOUVAST;
  const savedLinks = saved.nietAlleenLinks || {};
  const nietAlleenLinks: Record<string, string> = { ...DEFAULT_HOUVAST.nietAlleenLinks };
  for (const [code, url] of Object.entries(savedLinks)) {
    if (url && url.trim()) nietAlleenLinks[code] = url; // lege waarde = default behouden
  }
  // Per-type teksten samenvoegen: default-seeds (bv. de "En nu?"-teksten) blijven
  // staan tot ze in de admin worden overschreven. Per veld wint de opgeslagen waarde
  // als die bestaat (ook een lege string telt als bewuste keuze: val dan terug op basis).
  const defaultPerType = DEFAULT_HOUVAST.perType ?? {};
  const savedPerType = saved.perType ?? {};
  const perType: Record<string, HouvastPerType> = {};
  for (const code of new Set([...Object.keys(defaultPerType), ...Object.keys(savedPerType)])) {
    const d = defaultPerType[code] ?? {};
    const s = savedPerType[code] ?? {};
    perType[code] = {
      welkomTitel: s.welkomTitel ?? d.welkomTitel,
      welkomTekst: s.welkomTekst ?? d.welkomTekst,
      momenten: s.momenten && s.momenten.length > 0 ? s.momenten : d.momenten,
      slotTitel: s.slotTitel ?? d.slotTitel,
      slotTekst: s.slotTekst ?? d.slotTekst,
      slotPrijsRegel: s.slotPrijsRegel ?? d.slotPrijsRegel,
      briefInstructie: s.briefInstructie ?? d.briefInstructie,
      fotoGedicht: s.fotoGedicht ?? d.fotoGedicht ?? HOUVAST_FOTO_GEDICHT_DEFAULT[code],
    };
  }

  return {
    welkomTitel: saved.welkomTitel || DEFAULT_HOUVAST.welkomTitel,
    welkomTekst: saved.welkomTekst || DEFAULT_HOUVAST.welkomTekst,
    momenten:
      Array.isArray(saved.momenten) && saved.momenten.length > 0
        ? saved.momenten
        : DEFAULT_HOUVAST.momenten,
    slotTitel: saved.slotTitel || DEFAULT_HOUVAST.slotTitel,
    slotTekst: saved.slotTekst || DEFAULT_HOUVAST.slotTekst,
    slotPrijsRegel: saved.slotPrijsRegel ?? DEFAULT_HOUVAST.slotPrijsRegel,
    briefInstructie: saved.briefInstructie || DEFAULT_HOUVAST.briefInstructie,
    fotoGedicht: saved.fotoGedicht || DEFAULT_HOUVAST.fotoGedicht,
    nietAlleenLinks,
    perType,
  };
}

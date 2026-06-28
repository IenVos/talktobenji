/**
 * Type-varianten genereren op basis van de geoptimaliseerde HUISDIER-versie.
 *
 * Doel: alle verliestype-LP's en -checkouts dezelfde opbouw/uitstraling geven als
 * de huisdier-pagina, met alleen de teksten aangepast aan het verliestype. De
 * structuur (layout, afbeeldingen-opzet, "zo werkt het", FAQ, reviews-blok,
 * toggles) is 1:1 overgenomen; alleen de huisdier-specifieke zinnen zijn
 * herschreven.
 *
 * Veilig: schrijft naar CONCEPT-slugs ("…-concept"), zichtbaar maar nergens
 * gelinkt en zonder ads-tracking. De live pagina's blijven onaangeroerd. Na
 * akkoord promoten we de concepten naar de echte slug.
 *
 * LET OP: deze seed OVERSCHRIJFT het concept bij elke run (zodat we kunnen
 * itereren vóór review). Bewerk je het concept zelf in de admin, draai 'm dan
 * niet opnieuw, anders gaan die wijzigingen verloren.
 */
import { mutation } from "./_generated/server";

// Gedeelde (type-onafhankelijke) afbeeldingen uit de huisdier-pagina, zodat de
// layout intact blijft. Sommige hiervan kunnen huisdier-getint zijn → in de
// review checken/vervangen voor persoon-passende beelden.
const HUISDIER_BG_STORAGE_ID = "kg21esjqgt5zf0ffh82z9qx5cd888ahf";
const HUISDIER_HERO_IMG = "https://hardy-turtle-320.convex.cloud/api/storage/b41c8e1a-990e-47ee-8238-94d171ba9c24";
const HUISDIER_SECTION2_IMG = "https://hardy-turtle-320.convex.cloud/api/storage/317369dc-c59e-4ed4-ba60-fd0e62c47665";
const HUISDIER_DAGMOMENT_IMG = "https://hardy-turtle-320.convex.cloud/api/storage/874fde40-4e38-435b-9629-a6d1ac161af7";
// De zelf-opgenomen video is huisdier-gericht en hoort dus NIET op de andere
// verliestype-pagina's (bewust weggelaten in alle varianten hieronder).
const HUISDIER_CONTENT_IMG = "https://hardy-turtle-320.convex.cloud/api/storage/38bf207f-764b-489e-b2b5-59c00943e469";
const IEN_VERHAAL_IMG_STORAGE_ID = "kg22ezdetn5jwk4jddxk92hb99892626";

// ── Landingspagina: persoon (concept) ────────────────────────────────────────
export const seedPersoonLpConcept = mutation({
  args: {},
  handler: async (ctx) => {
    const slug = "je-mist-iemand-concept";
    const now = Date.now();

    const contentBlocksJson = JSON.stringify([
      {
        titel: "Soms ben je niet verdrietig.",
        tekst:
          "Soms ben je gewoon moe van alles dragen.\n\n**Misschien herken je dit:**\n\n✓ Je hoofd blijft maar doorgaan.\n\n✓ Je weet niet goed wat je voelt.\n\n✓ Je probeert sterk te blijven.\n\n✓ Je bent moe van alles alleen dragen.",
        accent: true,
      },
      { titel: "Zo ziet een dagelijks moment eruit.", tekst: "", afbeelding: HUISDIER_DAGMOMENT_IMG },
      {
        titel: "Waarom ik dit maakte",
        tekst:
          "Ik maakte Niet Alleen vanuit mijn eigen ervaring, omdat ik zag hoe alleen mensen zich kunnen voelen wanneer hun verdriet door anderen niet helemaal wordt begrepen.",
      },
      { titel: "", tekst: "", afbeelding: HUISDIER_CONTENT_IMG },
      {
        titel: "",
        tekst:
          "[midden]**Misschien voelt dit klein. \nMaar juist dat kleine moment per dag \nkan het verschil maken tussen \nalles alleen dragen of even kunnen ademen.**",
        accent: true,
      },
    ]);

    const ervaringenJson = JSON.stringify([
      {
        naam: "Sandra",
        context: "",
        tekst:
          "Ik dacht dat ik het wel alleen kon. Maar elke ochtend gaf dat ene moment me het gevoel dat er iemand aan me dacht, en dat was genoeg.",
      },
      {
        naam: "Mariëlle",
        context: "",
        tekst:
          "Hier kon ik zeggen wat ik nergens anders kwijt kon, zonder dat iemand het probeerde op te lossen. Voor het eerst voelde mijn verdriet niet als iets om me voor te verontschuldigen. Het mocht er gewoon zijn.",
      },
      {
        naam: "Annelies",
        context: "",
        tekst:
          "Iedereen dacht dat ik het na een paar maanden wel verwerkt zou hebben. Hier hoefde dat niet, en mocht ik gewoon missen wie ik kwijt ben.",
      },
    ]);

    const vragenJson = JSON.stringify([
      {
        vraag: "Moet ik elke dag meedoen?",
        antwoord:
          "Nee, je doet alleen mee als je er klaar voor bent. Er is geen goed of fout tempo en niets dat moet. Sla je een dag over, dan pak je het later gewoon weer op, precies waar jij wilt.",
      },
      {
        vraag: "Is dit niet gewoon een serie automatische mailtjes?",
        antwoord:
          "Nee. Elk moment is met zorg gemaakt vanuit echt verlies, en samen vormen ze een opbouw van dertig dagen die meebeweegt met waar jij in je rouw zit. Het is geen rij losse berichten, maar een reis die je dag voor dag een beetje minder alleen laat voelen.",
      },
      {
        vraag: "Is dit therapie?",
        antwoord:
          "Niet Alleen is geen vervanging voor professionele hulp. Het is een zachte, persoonlijke plek om stil te staan bij wat je voelt en het een plek te geven, op jouw manier. Merk je dat je meer nodig hebt, dan moedigen we je juist aan om die hulp te zoeken.",
      },
      {
        vraag: "Wie leest wat ik schrijf?",
        antwoord: "Niemand behalve jij. Wat je schrijft is helemaal van jou en voor niemand anders zichtbaar.",
      },
      {
        vraag: "Wat als ik na 30 dagen wil stoppen?",
        antwoord:
          "Dan stop je gewoon, je zit nergens aan vast. Je kunt alles wat je hebt geschreven downloaden en bewaren. Wil je daarna niet verder met Benji, dan kun je je account verwijderen. Geen automatische verlengingen, geen verborgen kosten. Jij bepaalt alles zelf.",
      },
    ]);

    const velden = {
      pageTitle: "Niet Alleen, voor wie iemand mist",
      isLive: true, // zichtbaar voor preview; niet gelinkt en trackAds=false
      categorie: "Niet Alleen",
      trackAds: false,
      houvastType: "persoon",

      heroLabel: "Voor wie iemand verloor die altijd dichtbij was",
      heroTitle: "De wereld draait door, maar het gemis is nog net zo groot.",
      heroSubtitle:
        "Misschien ben je moe van sterk zijn.\n\nEn verlang je gewoon naar een klein moment waarop je niet alles alleen hoeft te dragen.\n\nDaarom maakte ik Niet Alleen. Dertig dagen lang sta je er niet alleen voor met je verdriet, met iets dat elke dag naar je toe komt, juist op de momenten dat het zwaar is.\n\n✓ Elke dag een moment dat alleen van jou is\n✓ Geschreven vanuit echt verlies, niet automatisch\n✓ Je verdriet krijgt eindelijk een plek.\n✓ Direct toegang, helemaal op jouw tempo\n\n**Een klein cadeau aan jezelf.**",
      heroImageUrl: HUISDIER_HERO_IMG,
      bgImageStorageId: HUISDIER_BG_STORAGE_ID as any,

      section1Title: "Niets moet. Alles mag.",
      section1Text:
        'Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo. \nZacht, maar het brengt je wel ergens.\n\n**Dag 4 **\n*"Verdriet zit niet alleen in je hoofd"*\n\n**Dag 11 **\n *"Wanneer voelde jullie band het sterkst?"*\n\n**Dag 18 **\n*"Boosheid hoort bij rouw"*',
      section2Title: "Daarom is er Niet Alleen speciaal voor jou gemaakt.",
      section2Text:
        "[midden] ✓ Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een vraag die je verdriet eindelijk woorden geeft\n✓ Momenten die je helpen stilstaan zonder erin te verdrinken\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt",
      section2ImageUrl: HUISDIER_SECTION2_IMG,

      contentBlocksJson,
      ervaringenJson,
      vragenJson,
      faqTitel: "Veelgestelde vragen",

      ctaText: "Ja, ik gun mezelf dit",
      ctaColor: "#6d84a8",
      ctaPrijsTekst: "€ 37,- eenmalig · 30 dagen",
      ctaMicroCopy: "Dat is iets meer dan een euro per dag.",
      ctaUrl: "https://www.talktobenji.com/betalen/niet-alleen-verlies-persoon-concept",

      finalCtaTitle: "Je hoeft het niet alleen te dragen.",
      finalCtaBody:
        "✓ 💙 Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een vraag die je verdriet eindelijk woorden geeft\n✓ Momenten die je helpen stilstaan zonder erin te verdrinken\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt\n\n**Een klein cadeau aan jezelf.**",

      footerText: "Eerst even voelen hoe Niet Alleen werkt \nstart met de 5 momenten van Even Houvast",
      footerCtaUrl: "https://www.talktobenji.com/even-houvast",

      wieIsTitle: "Wie is Ien?",
      wieIsText:
        'Hi, Ik ben Ien de oprichter van TalkToBenji, het platform waar "Niet Alleen" onderdeel van is. Ik weet hoe zwaar het is als verdriet geen plek krijgt. "Niet Alleen" is wat ik zelf had willen hebben.',

      hideHeader: true,
      hideStickyBar: true,
      hideWatJeKrijgt: true,
      hideMidCta: false,
      hideErvaringen: false,
      hideVragen: false,
      hideWieIsIen: false,
      stickyCtaEnabled: false,
      stickyCtaText: "Ja, ik gun mezelf dit >>",
      stickyCtaColor: "#4a7c59",
      productImagePosition: "after_hero",
    };

    const bestaand = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (bestaand) {
      await ctx.db.patch(bestaand._id, { ...velden, updatedAt: now } as any);
      return { actie: "overschreven", id: bestaand._id, slug };
    }
    const id = await ctx.db.insert("landingPages", { slug, ...velden, createdAt: now, updatedAt: now } as any);
    return { actie: "aangemaakt", id, slug };
  },
});

// ── Checkout: persoon (concept) ──────────────────────────────────────────────
export const seedPersoonCheckoutConcept = mutation({
  args: {},
  handler: async (ctx) => {
    const slug = "niet-alleen-verlies-persoon-concept";
    const now = Date.now();

    const rustigeContent = {
      hero: {
        titel: "De wereld draait door, maar het gemis is nog net zo groot.",
        subtitel:
          "Dertig dagen lang sta je er niet alleen voor met je verdriet, met iets dat elke dag naar je toe komt, juist op de momenten dat het zwaar is.",
        intro: "💙 Een klein dagelijks ankerpunt voor mensen die iemand missen.",
        prijsLabel: "Een klein cadeau aan jezelf.",
        buttonText: "Ja, ik gun mezelf dit moment",
        bullets: [
          "Elke dag een moment dat alleen van jou is",
          "Geschreven vanuit echt verlies, niet automatisch",
          "Je verdriet krijgt eindelijk een plek",
          "Direct toegang, helemaal op jouw tempo",
          "30 dagen ondersteuning voor €37, eenmalig",
        ],
      },
      watJeKrijgt: {
        titel: "Niets moet. Alles mag.",
        tekst:
          "Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo.\n\nZacht, maar het brengt je wel ergens.",
        bullets: [
          "Dertig dagen waarin je er niet alleen voor staat",
          "Elke dag een vraag die je verdriet eindelijk woorden geeft",
          "Momenten die je helpen stilstaan zonder erin te verdrinken",
          "Langzaam meer rust, en het gevoel dat je gezien wordt",
        ],
        prompts: [
          { dag: "Dag 3", vraag: "Welk geluid of welke gewoonte van diegene hoor je nog steeds?" },
          { dag: "Dag 7", vraag: "Welke herinnering aan diegene blijft steeds terugkomen?" },
          { dag: "Dag 14", vraag: "Wat zou je tegen jezelf zeggen als je je beste vriend was?" },
        ],
      },
      herkenning: {
        quote: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
        intro: "Misschien herken je dit:",
        bullets: [
          "Je hoofd blijft maar doorgaan",
          "Je weet niet goed wat je voelt",
          "Je probeert sterk te blijven",
          "Je bent moe van alles alleen dragen",
        ],
        slot: "Dan is Niet Alleen voor jou gemaakt.",
      },
      reviewsTitel: "Hoe anderen dit hebben ervaren",
      benjiVerhaal: {
        titel: "Waarom ik dit maakte",
        tekst:
          "Ik maakte Niet Alleen vanuit mijn eigen ervaring, omdat ik zag hoe alleen mensen zich kunnen voelen wanneer hun verdriet door anderen niet helemaal wordt begrepen.\n\nDaarom ontvang je elke dag een klein moment van steun. Geen druk. Geen verwachtingen.\n\nLieve groet,\n\nIen & Benji",
        imageStorageId: IEN_VERHAAL_IMG_STORAGE_ID as any,
      },
      veiligheid: {
        bullets: [
          "Direct toegang na betaling",
          "Eenmalig, geen abonnement",
          "Geen druk of verwachtingen",
          "Niet tevreden? Laat het weten binnen 7 dagen en krijg je geld terug, zelfs als je al begonnen bent!",
        ],
        buttonText: "Ja, ik gun mezelf dit moment",
      },
    };

    const velden = {
      name: "Je hoeft het niet alleen te dragen.",
      kortNaam: "N.A. persoon (concept)",
      verliesType: "persoon",
      priceInCents: 3700,
      subscriptionType: "niet_alleen",
      buttonText: "Ja, dit is voor mij >>",
      trustText: "Niet tevreden binnen 7 dagen? Je krijgt gewoon je geld terug, ook al ben je al begonnen.",
      quoteText: "Je hoeft het niet allemaal alleen te dragen.",
      isLive: true, // zichtbaar voor preview; niet gelinkt
      checkoutLayout: "rustig",
      giftEnabled: false,
      b2bEnabled: false,
      addOnEnabled: false,
      extraTextBlocks: [],
      reviews: [
        {
          author: "Inge",
          role: "Verlies van mijn moeder 🤍",
          text: "In 30 dagen vond ik met dit programma stukje bij beetje rust en troost in het gemis.",
        },
      ],
      rustigeContent,
    };

    const bestaand = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (bestaand) {
      await ctx.db.patch(bestaand._id, { ...velden, updatedAt: now } as any);
      return { actie: "overschreven", id: bestaand._id, slug };
    }
    const id = await ctx.db.insert("checkoutProducts", { slug, ...velden, createdAt: now, updatedAt: now } as any);
    return { actie: "aangemaakt", id, slug };
  },
});

// ── Overige verliestypes (scheiding, eenzaamheid, kinderloos) ────────────────
// Zelfde opbouw/uitstraling als de persoon-variant hierboven, alleen de teksten
// per type aangepast. Data-gedreven via één helper zodat de structuur 1:1 gelijk
// blijft. Geen video (huisdier-gericht), geen ads-tracking, concept-slugs.

// Gedeelde, type-onafhankelijke onderdelen.
const GEDEELDE_VRAGEN = [
  {
    vraag: "Moet ik elke dag meedoen?",
    antwoord:
      "Nee, je doet alleen mee als je er klaar voor bent. Er is geen goed of fout tempo en niets dat moet. Sla je een dag over, dan pak je het later gewoon weer op, precies waar jij wilt.",
  },
  {
    vraag: "Is dit niet gewoon een serie automatische mailtjes?",
    antwoord:
      "Nee. Elk moment is met zorg gemaakt vanuit echt verlies, en samen vormen ze een opbouw van dertig dagen die meebeweegt met waar jij in je rouw zit. Het is geen rij losse berichten, maar een reis die je dag voor dag een beetje minder alleen laat voelen.",
  },
  {
    vraag: "Is dit therapie?",
    antwoord:
      "Niet Alleen is geen vervanging voor professionele hulp. Het is een zachte, persoonlijke plek om stil te staan bij wat je voelt en het een plek te geven, op jouw manier. Merk je dat je meer nodig hebt, dan moedigen we je juist aan om die hulp te zoeken.",
  },
  {
    vraag: "Wie leest wat ik schrijf?",
    antwoord: "Niemand behalve jij. Wat je schrijft is helemaal van jou en voor niemand anders zichtbaar.",
  },
  {
    vraag: "Wat als ik na 30 dagen wil stoppen?",
    antwoord:
      "Dan stop je gewoon, je zit nergens aan vast. Je kunt alles wat je hebt geschreven downloaden en bewaren. Wil je daarna niet verder met Benji, dan kun je je account verwijderen. Geen automatische verlengingen, geen verborgen kosten. Jij bepaalt alles zelf.",
  },
];

const GEDEELD_MIDDEN_BLOK =
  "[midden]**Misschien voelt dit klein. \nMaar juist dat kleine moment per dag \nkan het verschil maken tussen \nalles alleen dragen of even kunnen ademen.**";

const GEDEELD_WAAROM_TEKST =
  "Ik maakte Niet Alleen vanuit mijn eigen ervaring, omdat ik zag hoe alleen mensen zich kunnen voelen wanneer hun verdriet door anderen niet helemaal wordt begrepen.";

type VariantCopy = {
  type: string; // houvastType / verliesType
  lpSlug: string;
  checkoutSlug: string;
  kortNaam: string;
  pageTitle: string;
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  section1Text: string;
  section2Title: string;
  section2Text: string;
  herkenningTitel: string;
  herkenningTekst: string;
  lpReviews: { naam: string; tekst: string }[];
  finalCtaBody: string;
  // checkout
  checkoutName: string;
  checkoutIntro: string;
  checkoutHeroBullets: string[];
  watJeKrijgtTekst: string;
  watJeKrijgtBullets: string[];
  prompts: { dag: string; vraag: string }[];
  herkenningQuote: string;
  herkenningBullets: string[];
  herkenningSlot: string;
  benjiVerhaalTekst: string;
  checkoutReview: { author: string; role: string; text: string };
};

async function schrijfVariant(ctx: any, c: VariantCopy) {
  const now = Date.now();
  const checkoutUrl = `https://www.talktobenji.com/betalen/${c.checkoutSlug}`;

  // ── Landingspagina ──
  const contentBlocksJson = JSON.stringify([
    { titel: c.herkenningTitel, tekst: c.herkenningTekst, accent: true },
    { titel: "Zo ziet een dagelijks moment eruit.", tekst: "", afbeelding: HUISDIER_DAGMOMENT_IMG },
    { titel: "Waarom ik dit maakte", tekst: GEDEELD_WAAROM_TEKST },
    { titel: "", tekst: "", afbeelding: HUISDIER_CONTENT_IMG },
    { titel: "", tekst: GEDEELD_MIDDEN_BLOK, accent: true },
  ]);
  const ervaringenJson = JSON.stringify(
    c.lpReviews.map((r) => ({ naam: r.naam, context: "", tekst: r.tekst })),
  );
  const vragenJson = JSON.stringify(GEDEELDE_VRAGEN);

  const lpVelden = {
    pageTitle: c.pageTitle,
    isLive: true, // zichtbaar voor preview; niet gelinkt en trackAds=false
    categorie: "Niet Alleen",
    trackAds: false,
    houvastType: c.type,

    heroLabel: c.heroLabel,
    heroTitle: c.heroTitle,
    heroSubtitle: c.heroSubtitle,
    heroImageUrl: HUISDIER_HERO_IMG,
    bgImageStorageId: HUISDIER_BG_STORAGE_ID as any,

    section1Title: "Niets moet. Alles mag.",
    section1Text: c.section1Text,
    section2Title: c.section2Title,
    section2Text: c.section2Text,
    section2ImageUrl: HUISDIER_SECTION2_IMG,

    contentBlocksJson,
    ervaringenJson,
    vragenJson,
    faqTitel: "Veelgestelde vragen",

    ctaText: "Ja, ik gun mezelf dit",
    ctaColor: "#6d84a8",
    ctaPrijsTekst: "€ 37,- eenmalig · 30 dagen",
    ctaMicroCopy: "Dat is iets meer dan een euro per dag.",
    ctaUrl: checkoutUrl,

    finalCtaTitle: "Je hoeft het niet alleen te dragen.",
    finalCtaBody: c.finalCtaBody,

    footerText: "Eerst even voelen hoe Niet Alleen werkt \nstart met de 5 momenten van Even Houvast",
    footerCtaUrl: "https://www.talktobenji.com/even-houvast",

    wieIsTitle: "Wie is Ien?",
    wieIsText:
      'Hi, Ik ben Ien de oprichter van TalkToBenji, het platform waar "Niet Alleen" onderdeel van is. Ik weet hoe zwaar het is als verdriet geen plek krijgt. "Niet Alleen" is wat ik zelf had willen hebben.',

    hideHeader: true,
    hideStickyBar: true,
    hideWatJeKrijgt: true,
    hideMidCta: false,
    hideErvaringen: false,
    hideVragen: false,
    hideWieIsIen: false,
    stickyCtaEnabled: false,
    stickyCtaText: "Ja, ik gun mezelf dit >>",
    stickyCtaColor: "#4a7c59",
    productImagePosition: "after_hero",
  };

  const bestaandeLp = await ctx.db
    .query("landingPages")
    .withIndex("by_slug", (q: any) => q.eq("slug", c.lpSlug))
    .first();
  if (bestaandeLp) {
    await ctx.db.patch(bestaandeLp._id, { ...lpVelden, updatedAt: now } as any);
  } else {
    await ctx.db.insert("landingPages", { slug: c.lpSlug, ...lpVelden, createdAt: now, updatedAt: now } as any);
  }

  // ── Checkout ──
  const rustigeContent = {
    hero: {
      titel: c.heroTitle,
      subtitel:
        "Dertig dagen lang sta je er niet alleen voor met je verdriet, met iets dat elke dag naar je toe komt, juist op de momenten dat het zwaar is.",
      intro: c.checkoutIntro,
      prijsLabel: "Een klein cadeau aan jezelf.",
      buttonText: "Ja, ik gun mezelf dit moment",
      bullets: c.checkoutHeroBullets,
    },
    watJeKrijgt: {
      titel: "Niets moet. Alles mag.",
      tekst: c.watJeKrijgtTekst,
      bullets: c.watJeKrijgtBullets,
      prompts: c.prompts,
    },
    herkenning: {
      quote: c.herkenningQuote,
      intro: "Misschien herken je dit:",
      bullets: c.herkenningBullets,
      slot: c.herkenningSlot,
    },
    reviewsTitel: "Hoe anderen dit hebben ervaren",
    benjiVerhaal: {
      titel: "Waarom ik dit maakte",
      tekst: c.benjiVerhaalTekst,
      imageStorageId: IEN_VERHAAL_IMG_STORAGE_ID as any,
    },
    veiligheid: {
      bullets: [
        "Direct toegang na betaling",
        "Eenmalig, geen abonnement",
        "Geen druk of verwachtingen",
        "Niet tevreden? Laat het weten binnen 7 dagen en krijg je geld terug, zelfs als je al begonnen bent!",
      ],
      buttonText: "Ja, ik gun mezelf dit moment",
    },
  };

  const checkoutVelden = {
    name: c.checkoutName,
    kortNaam: c.kortNaam,
    verliesType: c.type,
    priceInCents: 3700,
    subscriptionType: "niet_alleen",
    buttonText: "Ja, dit is voor mij >>",
    trustText: "Niet tevreden binnen 7 dagen? Je krijgt gewoon je geld terug, ook al ben je al begonnen.",
    quoteText: "Je hoeft het niet allemaal alleen te dragen.",
    isLive: true, // zichtbaar voor preview; niet gelinkt
    checkoutLayout: "rustig",
    giftEnabled: false,
    b2bEnabled: false,
    addOnEnabled: false,
    extraTextBlocks: [],
    reviews: [c.checkoutReview],
    rustigeContent,
  };

  const bestaandeCheckout = await ctx.db
    .query("checkoutProducts")
    .withIndex("by_slug", (q: any) => q.eq("slug", c.checkoutSlug))
    .first();
  if (bestaandeCheckout) {
    await ctx.db.patch(bestaandeCheckout._id, { ...checkoutVelden, updatedAt: now } as any);
  } else {
    await ctx.db.insert("checkoutProducts", { slug: c.checkoutSlug, ...checkoutVelden, createdAt: now, updatedAt: now } as any);
  }

  return { lpSlug: c.lpSlug, checkoutSlug: c.checkoutSlug };
}

const SCHEIDING: VariantCopy = {
  type: "scheiding",
  lpSlug: "mijn-relatie-is-voorbij-concept",
  checkoutSlug: "niet-alleen-relatie-concept",
  kortNaam: "N.A. relatie (concept)",
  pageTitle: "Niet Alleen, voor wie een relatie verloor",
  heroLabel: "Voor wie rouwt om een relatie die voorbij is",
  heroTitle: "De relatie is voorbij, maar het gemis is er nog elke dag.",
  heroSubtitle:
    "Misschien hou je je groot voor de buitenwereld.\n\nEn verlang je gewoon naar een klein moment waarop je niet alles alleen hoeft te dragen.\n\nDaarom maakte ik Niet Alleen. Dertig dagen lang sta je er niet alleen voor met je verdriet, met iets dat elke dag naar je toe komt, juist op de momenten dat het zwaar is.\n\n✓ Elke dag een moment dat alleen van jou is\n✓ Geschreven vanuit echt verlies, niet automatisch\n✓ Rouwen om iemand die nog leeft mag er zijn\n✓ Direct toegang, helemaal op jouw tempo\n\n**Een klein cadeau aan jezelf.**",
  section1Text:
    'Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo. \nZacht, maar het brengt je wel ergens.\n\n**Dag 4 **\n*"Rouwen om iemand die nog leeft"*\n\n**Dag 11 **\n *"Wanneer voelde jullie band het sterkst?"*\n\n**Dag 18 **\n*"Boosheid hoort bij afscheid"*',
  section2Title: "Daarom is er Niet Alleen speciaal voor jou gemaakt.",
  section2Text:
    "[midden] ✓ Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een vraag die je verdriet eindelijk woorden geeft\n✓ Momenten die je helpen stilstaan zonder erin te verdrinken\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt",
  herkenningTitel: "Soms ben je niet verdrietig.",
  herkenningTekst:
    "Soms ben je gewoon moe van alles dragen.\n\n**Misschien herken je dit:**\n\n✓ Je hoofd blijft maar doorgaan.\n\n✓ Het ene moment opluchting, het volgende gemis.\n\n✓ Je probeert sterk te blijven.\n\n✓ Je bent moe van alles alleen dragen.",
  lpReviews: [
    { naam: "Linda", tekst: "Iedereen vond dat ik blij moest zijn dat het voorbij was. Hier mocht ik gewoon missen wat we hadden." },
    { naam: "Joost", tekst: "Ik schaamde me dat ik na een scheiding zo kapot was. Dit gaf me elke dag even het gevoel dat het mocht." },
    { naam: "Wendy", tekst: "Het ene moment opluchting, het volgende gemis. Hier hoefde ik dat aan niemand uit te leggen." },
  ],
  finalCtaBody:
    "✓ 💙 Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een vraag die je verdriet eindelijk woorden geeft\n✓ Momenten die je helpen stilstaan zonder erin te verdrinken\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt\n\n**Een klein cadeau aan jezelf.**",
  checkoutName: "Je hoeft het niet alleen te dragen.",
  checkoutIntro: "💙 Een klein dagelijks ankerpunt voor wie een relatie verloor.",
  checkoutHeroBullets: [
    "Elke dag een moment dat alleen van jou is",
    "Geschreven vanuit echt verlies, niet automatisch",
    "Rouwen om iemand die nog leeft mag er zijn",
    "Direct toegang, helemaal op jouw tempo",
    "30 dagen ondersteuning voor €37, eenmalig",
  ],
  watJeKrijgtTekst:
    "Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo.\n\nZacht, maar het brengt je wel ergens.",
  watJeKrijgtBullets: [
    "Dertig dagen waarin je er niet alleen voor staat",
    "Elke dag een vraag die je verdriet eindelijk woorden geeft",
    "Momenten die je helpen stilstaan zonder erin te verdrinken",
    "Langzaam meer rust, en het gevoel dat je gezien wordt",
  ],
  prompts: [
    { dag: "Dag 3", vraag: "Wat mis je het meest aan het samen-zijn?" },
    { dag: "Dag 7", vraag: "Welke herinnering blijft steeds terugkomen?" },
    { dag: "Dag 14", vraag: "Wat zou je tegen jezelf zeggen als je je beste vriend was?" },
  ],
  herkenningQuote: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
  herkenningBullets: [
    "Je hoofd blijft maar doorgaan",
    "Het ene moment opluchting, het volgende gemis",
    "Je probeert sterk te blijven",
    "Je bent moe van alles alleen dragen",
  ],
  herkenningSlot: "Dan is Niet Alleen voor jou gemaakt.",
  benjiVerhaalTekst:
    "Ik maakte Niet Alleen vanuit mijn eigen ervaring, omdat ik zag hoe alleen mensen zich kunnen voelen wanneer hun verdriet door anderen niet helemaal wordt begrepen.\n\nDaarom ontvang je elke dag een klein moment van steun. Geen druk. Geen verwachtingen.\n\nLieve groet,\n\nIen & Benji",
  checkoutReview: { author: "Linda", role: "Einde van mijn huwelijk 🤍", text: "In 30 dagen vond ik met dit programma stukje bij beetje rust in het gemis." },
};

const EENZAAMHEID: VariantCopy = {
  type: "eenzaamheid",
  lpSlug: "ik-voel-me-eenzaam-concept",
  checkoutSlug: "niet-alleen-eenzaamheid-concept",
  kortNaam: "N.A. eenzaamheid (concept)",
  pageTitle: "Niet Alleen, voor wie zich eenzaam voelt",
  heroLabel: "Voor wie zich alleen voelt, ook tussen anderen",
  heroTitle: "Je bent omringd door mensen, en toch voel je je alleen.",
  heroSubtitle:
    "Misschien hou je je groot en zegt niemand iets.\n\nEn verlang je gewoon naar een klein moment waarop iemand even aan je denkt.\n\nDaarom maakte ik Niet Alleen. Dertig dagen lang sta je er niet alleen voor, met iets dat elke dag naar je toe komt, juist op de stille momenten.\n\n✓ Elke dag een moment dat alleen van jou is\n✓ Geschreven vanuit echt verlies, niet automatisch\n✓ Je eenzaamheid mag er zijn, zonder schaamte\n✓ Direct toegang, helemaal op jouw tempo\n\n**Een klein cadeau aan jezelf.**",
  section1Text:
    'Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo. \nZacht, maar het brengt je wel ergens.\n\n**Dag 4 **\n*"Eenzaamheid zegt niets over je waarde"*\n\n**Dag 11 **\n *"Wanneer voelde je je voor het laatst echt gezien?"*\n\n**Dag 18 **\n*"Je hoeft je niet te schamen"*',
  section2Title: "Daarom is er Niet Alleen speciaal voor jou gemaakt.",
  section2Text:
    "[midden] ✓ Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een moment dat je het gevoel geeft dat er aan je gedacht wordt\n✓ Iets vasts op de stille momenten\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt",
  herkenningTitel: "Soms ben je niet verdrietig.",
  herkenningTekst:
    "Soms voel je je gewoon leeg, midden tussen anderen.\n\n**Misschien herken je dit:**\n\n✓ Je hoofd blijft maar doorgaan.\n\n✓ Je voelt je ongezien, ook met mensen om je heen.\n\n✓ Je houdt je groot voor de buitenwereld.\n\n✓ Je bent moe van alles alleen dragen.",
  lpReviews: [
    { naam: "Greet", tekst: "Ik voelde me leeg, midden tussen anderen. Elke ochtend gaf dit me het gevoel dat er aan me gedacht werd." },
    { naam: "Hassan", tekst: "Ik durfde tegen niemand te zeggen hoe alleen ik me voelde. Hier mocht het er gewoon zijn." },
    { naam: "Tineke", tekst: "Niet dat de eenzaamheid ineens weg was. Maar ik voelde me weer een beetje gezien." },
  ],
  finalCtaBody:
    "✓ 💙 Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een moment dat je het gevoel geeft dat er aan je gedacht wordt\n✓ Iets vasts op de stille momenten\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt\n\n**Een klein cadeau aan jezelf.**",
  checkoutName: "Je hoeft het niet alleen te dragen.",
  checkoutIntro: "💙 Een klein dagelijks ankerpunt voor wie zich eenzaam voelt.",
  checkoutHeroBullets: [
    "Elke dag een moment dat alleen van jou is",
    "Geschreven vanuit echt verlies, niet automatisch",
    "Je eenzaamheid mag er zijn, zonder schaamte",
    "Direct toegang, helemaal op jouw tempo",
    "30 dagen ondersteuning voor €37, eenmalig",
  ],
  watJeKrijgtTekst:
    "Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo.\n\nZacht, maar het brengt je wel ergens.",
  watJeKrijgtBullets: [
    "Dertig dagen waarin je er niet alleen voor staat",
    "Elke dag een moment dat je het gevoel geeft dat er aan je gedacht wordt",
    "Iets vasts op de stille momenten",
    "Langzaam meer rust, en het gevoel dat je gezien wordt",
  ],
  prompts: [
    { dag: "Dag 3", vraag: "Wanneer voelde je je voor het laatst echt gezien?" },
    { dag: "Dag 7", vraag: "Welk klein moment van vandaag wil je vasthouden?" },
    { dag: "Dag 14", vraag: "Wat zou je tegen jezelf zeggen als je je beste vriend was?" },
  ],
  herkenningQuote: "Soms ben je niet verdrietig.\nSoms voel je je gewoon leeg, midden tussen anderen.",
  herkenningBullets: [
    "Je hoofd blijft maar doorgaan",
    "Je voelt je ongezien, ook met mensen om je heen",
    "Je houdt je groot voor de buitenwereld",
    "Je bent moe van alles alleen dragen",
  ],
  herkenningSlot: "Dan is Niet Alleen voor jou gemaakt.",
  benjiVerhaalTekst:
    "Ik maakte Niet Alleen vanuit mijn eigen ervaring, omdat ik zag hoe alleen mensen zich kunnen voelen, ook midden tussen anderen.\n\nDaarom ontvang je elke dag een klein moment van steun. Geen druk. Geen verwachtingen.\n\nLieve groet,\n\nIen & Benji",
  checkoutReview: { author: "Greet", role: "Een eenzame periode 🤍", text: "In 30 dagen voelde ik me elke dag een beetje minder alleen." },
};

const KINDERLOOS: VariantCopy = {
  type: "kinderloos",
  lpSlug: "ongewenst-kinderloos-concept",
  checkoutSlug: "niet-alleen-kinderloos-concept",
  kortNaam: "N.A. kinderloos (concept)",
  pageTitle: "Niet Alleen, voor wie een kinderwens verloor",
  heroLabel: "Voor wie rouwt om een kind dat er nooit kwam",
  heroTitle: "Het verdriet om wat er nooit kwam, draag je vaak in stilte.",
  heroSubtitle:
    "Misschien lach je de vragen weg en draag je het gemis alleen.\n\nEn verlang je gewoon naar een klein moment waarop je verdriet er mag zijn.\n\nDaarom maakte ik Niet Alleen. Dertig dagen lang sta je er niet alleen voor met je verdriet, met iets dat elke dag naar je toe komt, juist op de momenten dat het zwaar is.\n\n✓ Elke dag een moment dat alleen van jou is\n✓ Geschreven vanuit echt verlies, niet automatisch\n✓ Een verlies zonder afscheid telt volledig mee\n✓ Direct toegang, helemaal op jouw tempo\n\n**Een klein cadeau aan jezelf.**",
  section1Text:
    'Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo. \nZacht, maar het brengt je wel ergens.\n\n**Dag 4 **\n*"Verdriet om wat er nooit kwam is echt"*\n\n**Dag 11 **\n *"Wat had je willen meegeven?"*\n\n**Dag 18 **\n*"Je hoeft het niet kleiner te maken"*',
  section2Title: "Daarom is er Niet Alleen speciaal voor jou gemaakt.",
  section2Text:
    "[midden] ✓ Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een vraag die je verdriet eindelijk woorden geeft\n✓ Een plek voor een gemis dat anderen vaak niet zien\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt",
  herkenningTitel: "Soms ben je niet verdrietig.",
  herkenningTekst:
    "Soms ben je gewoon moe van een gemis dat niemand ziet.\n\n**Misschien herken je dit:**\n\n✓ Je hoofd blijft maar doorgaan.\n\n✓ Een vraag of een zwangere buik komt binnen als een mes.\n\n✓ Je lacht het weg en houdt je groot.\n\n✓ Je bent moe van alles alleen dragen.",
  lpReviews: [
    { naam: "Marit", tekst: "Niemand begon erover, alsof het er niet was. Hier mocht mijn verdriet eindelijk bestaan." },
    { naam: "Esther", tekst: "Elke zwangere buik deed pijn. Dit gaf me elke dag even een plek voor dat gemis." },
    { naam: "Karin", tekst: "Een verlies zonder afscheid, zonder kaart. Hier voelde ik me eindelijk gezien." },
  ],
  finalCtaBody:
    "✓ 💙 Dertig dagen waarin je er niet alleen voor staat\n✓ Elke dag een vraag die je verdriet eindelijk woorden geeft\n✓ Een plek voor een gemis dat anderen vaak niet zien\n✓ Langzaam meer rust, en het gevoel dat je gezien wordt\n\n**Een klein cadeau aan jezelf.**",
  checkoutName: "Je hoeft het niet alleen te dragen.",
  checkoutIntro: "💙 Een klein dagelijks ankerpunt voor wie een kinderwens verloor.",
  checkoutHeroBullets: [
    "Elke dag een moment dat alleen van jou is",
    "Geschreven vanuit echt verlies, niet automatisch",
    "Een verlies zonder afscheid telt volledig mee",
    "Direct toegang, helemaal op jouw tempo",
    "30 dagen ondersteuning voor €37, eenmalig",
  ],
  watJeKrijgtTekst:
    "Geen druk, geen huiswerk. Elke dag één klein moment dat je helpt stilstaan bij wat er in je omgaat, op jouw tempo.\n\nZacht, maar het brengt je wel ergens.",
  watJeKrijgtBullets: [
    "Dertig dagen waarin je er niet alleen voor staat",
    "Elke dag een vraag die je verdriet eindelijk woorden geeft",
    "Een plek voor een gemis dat anderen vaak niet zien",
    "Langzaam meer rust, en het gevoel dat je gezien wordt",
  ],
  prompts: [
    { dag: "Dag 3", vraag: "Wat had je willen meegeven aan een kind?" },
    { dag: "Dag 7", vraag: "Welke droom mis je het meest?" },
    { dag: "Dag 14", vraag: "Wat zou je tegen jezelf zeggen als je je beste vriend was?" },
  ],
  herkenningQuote: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van een gemis dat niemand ziet.",
  herkenningBullets: [
    "Je hoofd blijft maar doorgaan",
    "Een vraag of een zwangere buik komt binnen als een mes",
    "Je lacht het weg en houdt je groot",
    "Je bent moe van alles alleen dragen",
  ],
  herkenningSlot: "Dan is Niet Alleen voor jou gemaakt.",
  benjiVerhaalTekst:
    "Ik maakte Niet Alleen vanuit mijn eigen ervaring, omdat ik zag hoe alleen mensen zich kunnen voelen met een verdriet dat anderen niet zien.\n\nDaarom ontvang je elke dag een klein moment van steun. Geen druk. Geen verwachtingen.\n\nLieve groet,\n\nIen & Benji",
  checkoutReview: { author: "Marit", role: "Onvervulde kinderwens 🤍", text: "In 30 dagen kreeg mijn onzichtbare verdriet eindelijk een plek." },
};

// Eén mutatie die alle drie de overige varianten (her)schrijft.
export const seedOverigeTypeVarianten = mutation({
  args: {},
  handler: async (ctx) => {
    const resultaten = [];
    for (const c of [SCHEIDING, EENZAAMHEID, KINDERLOOS]) {
      resultaten.push(await schrijfVariant(ctx, c));
    }
    return { aantal: resultaten.length, varianten: resultaten };
  },
});

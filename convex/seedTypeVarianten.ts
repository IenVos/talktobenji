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
const HUISDIER_VIDEO = "https://hardy-turtle-320.convex.cloud/api/storage/98adb2d6-43e6-48c1-b031-401eaed33020";
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
        video: HUISDIER_VIDEO,
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

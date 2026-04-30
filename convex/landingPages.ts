/**
 * Landingspagina's — admin beheert, publiek zichtbaar via /lp/[slug].
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Admin: lijst alle pagina's, nieuwste eerst */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const pages = await ctx.db.query("landingPages").collect();
    return pages.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Publiek: haal pagina op via slug, alleen als isLive=true */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!page || !page.isLive) return null;
    let productImageUrl: string | null = null;
    let bgImageUrl: string | null = null;
    try {
      if (page.productImageStorageId) productImageUrl = await ctx.storage.getUrl(page.productImageStorageId);
    } catch { /* negeer */ }
    try {
      if (page.bgImageStorageId) bgImageUrl = await ctx.storage.getUrl(page.bgImageStorageId);
    } catch { /* negeer */ }
    return { ...page, productImageUrl, bgImageUrl };
  },
});

/** Admin: genereer upload URL voor afbeeldingen/video */
export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

/** Admin: haal publieke URL op na upload */
export const getImageUrl = mutation({
  args: { adminToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.getUrl(args.storageId);
  },
});

/** Admin: maak nieuwe pagina aan */
export const create = mutation({
  args: {
    adminToken: v.string(),
    slug: v.string(),
    pageTitle: v.string(),
    isLive: v.boolean(),
    heroLabel: v.optional(v.string()),
    heroTitle: v.string(),
    heroSubtitle: v.optional(v.string()),
    heroBody: v.optional(v.string()),
    heroVideoUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    ctaColor: v.optional(v.string()),
    section1Title: v.optional(v.string()),
    section1Text: v.optional(v.string()),
    section2Title: v.optional(v.string()),
    section2Text: v.optional(v.string()),
    productImageStorageId: v.optional(v.id("_storage")),
    productImagePath: v.optional(v.string()),
    bgImageStorageId: v.optional(v.id("_storage")),
    voorWieBullets: v.optional(v.string()),
    ervaringenJson: v.optional(v.string()),
    vragenJson: v.optional(v.string()),
    wieIsTitle: v.optional(v.string()),
    wieIsText: v.optional(v.string()),
    finalCtaTitle: v.optional(v.string()),
    finalCtaBody: v.optional(v.string()),
    hideErvaringen: v.optional(v.boolean()),
    hideVragen: v.optional(v.boolean()),
    hideWieIsIen: v.optional(v.boolean()),
    hideMidCta: v.optional(v.boolean()),
    hideWatJeKrijgt: v.optional(v.boolean()),
    hideStickyBar: v.optional(v.boolean()),
    footerText: v.optional(v.string()),
    footerCtaUrl: v.optional(v.string()),
    trackAds: v.optional(v.boolean()),
    pricingBlocksJson: v.optional(v.string()),
    pricingTitel: v.optional(v.string()),
    pricingSubtitel: v.optional(v.string()),
    featureSlidesJson: v.optional(v.string()),
    featureSliderLabel: v.optional(v.string()),
    featureSliderTitel: v.optional(v.string()),
    ervaringenTitel: v.optional(v.string()),
    ervaringenSubtitel: v.optional(v.string()),
    faqTitel: v.optional(v.string()),
    faqSubtitel: v.optional(v.string()),
    voorWieSubtitel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    const { adminToken: _token, ...fields } = args;
    return await ctx.db.insert("landingPages", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: werk bestaande pagina bij */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("landingPages"),
    slug: v.optional(v.string()),
    pageTitle: v.optional(v.string()),
    isLive: v.optional(v.boolean()),
    heroLabel: v.optional(v.string()),
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroBody: v.optional(v.string()),
    heroVideoUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    ctaColor: v.optional(v.string()),
    section1Title: v.optional(v.string()),
    section1Text: v.optional(v.string()),
    section2Title: v.optional(v.string()),
    section2Text: v.optional(v.string()),
    productImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    productImagePath: v.optional(v.string()),
    bgImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    voorWieBullets: v.optional(v.string()),
    voorWieTitle: v.optional(v.string()),
    ervaringenJson: v.optional(v.string()),
    vragenJson: v.optional(v.string()),
    wieIsTitle: v.optional(v.string()),
    wieIsText: v.optional(v.string()),
    finalCtaTitle: v.optional(v.string()),
    finalCtaBody: v.optional(v.string()),
    hideErvaringen: v.optional(v.boolean()),
    hideVragen: v.optional(v.boolean()),
    hideWieIsIen: v.optional(v.boolean()),
    hideMidCta: v.optional(v.boolean()),
    hideWatJeKrijgt: v.optional(v.boolean()),
    hideStickyBar: v.optional(v.boolean()),
    footerText: v.optional(v.string()),
    footerCtaUrl: v.optional(v.string()),
    trackAds: v.optional(v.boolean()),
    pricingBlocksJson: v.optional(v.string()),
    pricingTitel: v.optional(v.string()),
    pricingSubtitel: v.optional(v.string()),
    featureSlidesJson: v.optional(v.string()),
    featureSliderLabel: v.optional(v.string()),
    featureSliderTitel: v.optional(v.string()),
    ervaringenTitel: v.optional(v.string()),
    ervaringenSubtitel: v.optional(v.string()),
    faqTitel: v.optional(v.string()),
    faqSubtitel: v.optional(v.string()),
    voorWieSubtitel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { id, adminToken: _token, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Pagina niet gevonden");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) patch[key] = val === "" ? undefined : val;
    }
    await ctx.db.patch(id, patch);
    return id;
  },
});

/** Admin: dupliceer een pagina met slug = origineel + "-kopie" */
export const duplicate = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("landingPages"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("Pagina niet gevonden");
    const now = Date.now();
    const { _id, _creationTime, ...rest } = original;
    return await ctx.db.insert("landingPages", {
      ...rest,
      slug: original.slug + "-kopie",
      isLive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: zet isLive aan of uit */
export const toggleLive = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("landingPages"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Pagina niet gevonden");
    await ctx.db.patch(args.id, { isLive: !page.isLive, updatedAt: Date.now() });
    return args.id;
  },
});

/** Admin: verwijder een pagina */
export const remove = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("landingPages"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/** Admin: seed niet-alleen-a en niet-alleen-b als ze nog niet bestaan */
export const seed = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();

    const existingA = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", "niet-alleen-a"))
      .first();

    if (!existingA) {
      await ctx.db.insert("landingPages", {
        slug: "niet-alleen-a",
        pageTitle: "Niet Alleen — 30 dagen begeleiding bij verlies",
        isLive: true,
        heroLabel: "30 dagen begeleiding bij verlies en gemis",
        heroTitle: "Je hoeft dit niet alleen te dragen.",
        heroSubtitle: "Elke dag een kleine vraag. Een plek om te schrijven. Iemand die er is.",
        heroBody: "Voor €37 ontvang je 30 dagen lang elke ochtend een persoonlijk bericht in je inbox. Eenmalig, geen abonnement, geen verplichtingen.",
        ctaText: "Start mijn reis",
        ctaUrl: "https://talktobenji.kennis.shop/pay/niet-alleen",
        productImagePath: "/images/niet-alleen-product.png",
        section1Title: "Verdriet heeft niet altijd een naam.",
        section1Text: "Het hoeft geen overlijden te zijn. Verdriet kan er zijn na een scheiding, een miskraam, het verlies van een huisdier, een vriendschap die verdween, een gezondheid die veranderde, een leven dat je dacht te gaan leiden.\n\nElk verlies is echt. Ook als de wereld om je heen gewoon doorgaat.\n\nEn toch sta je er soms alleen voor. Mensen weten niet wat te zeggen. Je wilt anderen niet belasten. Je weet zelf soms niet eens wat je voelt.\n\n\"Niet Alleen\" is er voor iedereen die iemand of iets mist en wil dat het gemis een plek krijgt.",
        section2Title: "Hoe het werkt.",
        section2Text: "Elke ochtend ontvang je een bericht in je inbox. Niet een nieuwsbrief, niet een cursus. Gewoon een kleine vraag voor die dag, over wie je mist, over wat je draagt, over wie je bent nu.\n\nJe klikt door naar jouw persoonlijke plek. Daar schrijf je, in je eigen tempo. Je kunt ook inspreken, of een foto toevoegen.\n\nAlles wordt bewaard. Na 30 dagen heb je jouw eigen woorden bewaard, opgebouwd in jouw tempo.\n\nOp sommige dagen is er iets extra's. Een korte oefening om even te landen. Een stille verrassing halverwege. Een moment om terug te kijken.\n\nOp dag 30 schrijf je een brief aan jezelf. Van nu, voor later.",
        voorWieBullets: "je iemand hebt verloren en niet weet hoe je verder moet\nje rouwt om een relatie, een huisdier, een miskraam of een gezondheid en het gevoel hebt dat niemand het begrijpt\nje een plek wilt om te schrijven en te voelen\nje 's nachts wakker ligt met gedachten die nergens heen kunnen\nje merkt dat je verdriet wegstopt omdat het leven doorgaat, maar het er wel is\nje gewoon iemand nodig hebt die er is, zonder oordeel, op het moment dat jij er klaar voor bent",
        ervaringenJson: '[{"tekst":"Ik dacht dat ik het wel alleen kon. Maar elke ochtend dat bericht gaf me het gevoel dat iemand aan me dacht. Dat was genoeg.","naam":"Sandra","context":"verloor haar moeder"},{"tekst":"Na de scheiding had ik niemand aan wie ik alles kon vertellen. Hier kon dat wel. Zonder oordeel.","naam":"Mariëlle","context":"scheiding na 12 jaar"},{"tekst":"Iedereen zei dat het maar een hond was. Hier voelde ik me eindelijk begrepen.","naam":"Annelies","context":"verloor haar hond Boris"}]',
        vragenJson: '[{"vraag":"Moet ik elke dag meedoen?","antwoord":"Nee. Je schrijft alleen als je er klaar voor bent. Er is geen goed of fout tempo. Als je een dag overslaat kun je altijd terugkomen."},{"vraag":"Is dit therapie?","antwoord":"\"Niet Alleen\" is geen vervanging voor professionele hulp. Het is een persoonlijke plek om te schrijven en te voelen, op jouw manier. Als je merkt dat je meer nodig hebt, moedigen we je aan dat te zoeken."},{"vraag":"Wie leest wat ik schrijf?","antwoord":"Niemand. Wat je schrijft is van jou en alleen voor jou zichtbaar."},{"vraag":"Wat als ik na 30 dagen wil stoppen?","antwoord":"Dan stop je gewoon. Je kunt alles downloaden. Je account wordt gesloten. Geen automatische verleningen, geen verborgen kosten."}]',
        wieIsTitle: "Wie is Ien?",
        wieIsText: "Ien is de oprichter van TalkToBenji, het platform waar \"Niet Alleen\" onderdeel van is. Ze weet hoe zwaar het is als verdriet geen plek krijgt. \"Niet Alleen\" is wat ze zelf had willen hebben.",
        finalCtaTitle: "Je hoeft het niet alleen te dragen.",
        finalCtaBody: "30 dagen. Elke dag één kleine stap. Een plek die van jou is. Voor €37 eenmalig, zonder abonnement of verdere verplichtingen.",
        footerText: "\"Niet Alleen\" is onderdeel van Talk To Benji. Als je na 30 dagen verder wilt, kun je een abonnement afsluiten. Alles wat je hebt opgebouwd blijft dan bewaard.",
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingB = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", "niet-alleen-b"))
      .first();

    if (!existingB) {
      await ctx.db.insert("landingPages", {
        slug: "niet-alleen-b",
        pageTitle: "Niet Alleen — voor wie iemand of iets mist",
        isLive: true,
        heroLabel: "Voor wie iemand of iets mist",
        heroTitle: "Niet alleen.",
        heroSubtitle: "30 dagen. Elke dag één vraag. Een plek die van jou is.",
        heroBody: "Voor €37 ontvang je 30 dagen lang elke ochtend een persoonlijk bericht. Eenmalig, geen abonnement.",
        ctaText: "Start mijn reis",
        ctaUrl: "https://talktobenji.kennis.shop/pay/niet-alleen",
        productImagePath: "/images/niet-alleen-product.png",
        section1Title: undefined,
        section1Text: "Er is een soort verdriet dat geen naam heeft in de buitenwereld. Geen rouwkaarten, geen bloemen, geen moment waarop iedereen even stil staat.\n\nMaar het is er wel. En jij draagt het.\n\nMisschien heb je iemand verloren. Misschien een relatie, een huisdier, een gezondheid, een toekomst die je voor je zag. Elk verlies is echt. Ook als de mensen om je heen niet weten wat te zeggen.\n\n\"Niet Alleen\" is een plek voor de komende 30 dagen. Elke ochtend een klein bericht, een vraag, een gedachte, een moment van stilte. Je schrijft wat je wilt schrijven. Zoveel of zo weinig als je kunt.\n\nAlles wordt bewaard. Op dag 30 heb je jouw eigen verhaal, in jouw woorden, op jouw tempo. En als je wilt, schrijf je een brief aan jezelf.\n\nBenji is er. Elke dag. Zonder oordeel. Zonder haast.",
        section2Title: undefined,
        section2Text: undefined,
        voorWieBullets: "Je hoeft niet elke dag mee te doen. Je schrijft als je er klaar voor bent.\nWat je schrijft is alleen voor jou. Niemand leest het.\nDit is geen therapie. Het is een plek. Als je meer nodig hebt, moedigen we je aan dat te zoeken.\nNa 30 dagen kun je alles downloaden of gewoon laten staan. Geen automatische verleningen.",
        ervaringenJson: '[{"tekst":"Ik dacht dat ik het wel alleen kon. Maar elke ochtend dat bericht gaf me het gevoel dat iemand aan me dacht. Dat was genoeg.","naam":"Sandra","context":""},{"tekst":"Hier kon ik zeggen wat ik nergens anders kwijt kon. Zonder dat iemand iets terug hoefde te zeggen.","naam":"Mariëlle","context":""},{"tekst":"Iedereen zei dat het maar een hond was. Hier voelde ik me eindelijk begrepen.","naam":"Annelies","context":""}]',
        vragenJson: undefined,
        wieIsTitle: "Wie is Ien?",
        wieIsText: "Ien is de oprichter van TalkToBenji, het platform waar \"Niet Alleen\" onderdeel van is. Ze weet hoe zwaar het is als verdriet geen plek krijgt. \"Niet Alleen\" is wat ze zelf had willen hebben.",
        finalCtaTitle: undefined,
        finalCtaBody: "Je hoeft het niet alleen te dragen.\n\nVoor €37 eenmalig. Geen abonnement, geen verplichtingen. Na aankoop ontvang je direct een bericht van Ien. Je eerste dag begint de volgende ochtend.",
        footerText: "\"Niet Alleen\" is onderdeel van Talk To Benji. Als je na 30 dagen verder wilt, kun je een abonnement afsluiten. Alles wat je hebt opgebouwd blijft dan bewaard.",
        createdAt: now + 1,
        updatedAt: now + 1,
      });
    }

    const existingErZijn = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", "er-zijn"))
      .first();

    if (!existingErZijn) {
      await ctx.db.insert("landingPages", {
        slug: "er-zijn",
        pageTitle: "Er Zijn · Talk To Benji",
        isLive: true,
        heroLabel: "een digitaal boekje",
        heroTitle: "Je wilt er zijn. Maar je weet niet hoe.",
        heroSubtitle: "Je kent iemand die verdriet heeft. Je denkt aan ze. Je wilt iets doen, iets zeggen, maar de woorden komen niet. Of je zegt iets en het voelt meteen niet goed.",
        heroBody: "Dat maakt je niet tot een slechte vriend. Het maakt je menselijk.",
        ctaText: "Ik wil dit — €17",
        ctaUrl: "https://talktobenji.kennis.shop/pay/er-zijn",
        productImagePath: "/images/er-zijn-cover.png",
        section1Title: "Voor wie is dit",
        section1Text: "Voor de vriend die niet weet wat te zeggen bij een begrafenis.\n\nVoor de partner die naast iemand staat die rouwt om een ouder, een kind, een huisdier.\n\nVoor de collega die merkt dat iemand het zwaar heeft maar niet weet hoe ze dat moeten aankaarten.\n\nVoor de moeder die haar kind ziet rouwen en niet weet hoe ze dichterbij kan komen.\n\nVoor iedereen die iemand verliest aan verdriet. Niet aan de dood, maar aan de afstand die ontstaat omdat niemand weet wat te zeggen.",
        section2Title: "Wat verdriet is, en wat het niet is",
        section2Text: "Verdriet is niet alleen iets wat mensen voelen als iemand sterft. Het is alles wat je draagt als je iets verliest wat er echt toe deed. Een relatie. Een huisdier. Een toekomst die er anders uitziet dan gehoopt. Een gezondheid. Een rol.\n\nAl die vormen van verlies zijn echt. En al die mensen hebben iemand nodig die niet wegloopt.\n\nDat ben jij.",
        voorWieTitle: "Wat je erin vindt",
        voorWieBullets: "Wat er écht in iemand omgaat als ze rouwen, zodat je begrijpt waarom ze doen wat ze doen.\nWelke goedbedoelde zinnen averechts werken en waarom. Zonder schuldgevoel, met uitleg.\nWat wél helpt. Concreet. Klein. Haalbaar. Dingen die je vandaag al kunt doen.\nZinnen die je letterlijk kunt gebruiken. Voor het eerste moment, de weken daarna, de moeilijke dagen.\nHoe je omgaat met bijzondere vormen van verlies: een huisdier, een scheiding, een miskraam, anticiperende rouw.\nHoe je voor jezelf zorgt als het ook zwaar wordt voor jou.\nEen spiekbriefje dat je kunt bewaren, voor als je er even niet uitkomt.",
        wieIsTitle: "Over de maker",
        wieIsText: "Er Zijn is geschreven door Ien, oprichter van Talk to Benji. Ze zag steeds opnieuw hoe mensen zich terugtrokken — niet omdat ze het niet wilden, maar omdat ze niet wisten hoe. Dit boekje is haar antwoord daarop.",
        finalCtaTitle: "Je hoeft de perfecte woorden niet te hebben. Dat is het goede nieuws.",
        finalCtaBody: "De persoon die jou nodig heeft, heeft geluk met jou.\n\nEen digitaal boekje van 69 pagina's, direct te downloaden na aankoop. Warm vormgegeven, rustig om te lezen. Inclusief spiekbriefje: één pagina met de kern, los te bewaren op je telefoon of te printen.",
        footerText: "Gemaakt met zorg, voor mensen die er willen zijn.",
        createdAt: now + 2,
        updatedAt: now + 2,
      });
    }

    return { seeded: true };
  },
});

/** Admin: seed jaar-toegang pagina als die nog niet bestaat */
export const seedJaarToegang = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", "jaar-toegang"))
      .first();
    if (existing) return { seeded: false, id: existing._id };

    const now = Date.now();
    const id = await ctx.db.insert("landingPages", {
      slug: "jaar-toegang",
      pageTitle: "1 jaar Benji · Talk To Benji",
      isLive: true,
      heroLabel: "1 jaar toegang · Alles inbegrepen",
      heroTitle: "Een heel jaar lang Benji, voor als je er niet alleen mee wil zijn",
      heroSubtitle: "Voor de momenten dat het te veel wordt — 's nachts, midden op de dag, zonder afspraak of wachttijd. Benji luistert, stelt een vraag, is er gewoon. Het hele jaar door, voor één prijs, zonder gedoe.",
      heroBody: "€ 97 · Eenmalig · Direct toegang · Geen abonnement",
      ctaText: "Begin nu · € 97",
      ctaUrl: "https://talktobenji.kennis.shop/pay/je-hoeft-het-niet-alleen-te-dragen",
      section1Title: "Wat zit er allemaal in?",
      section1Text: "Praten met Benji — Altijd iemand om je verhaal kwijt te kunnen. Benji luistert, stelt een vraag, laat je niet alleen met je gedachten. Dag en nacht beschikbaar.\n\nDagelijkse check-ins — Korte dagelijkse momenten om bij jezelf te landen. Hoe gaat het echt, op dit moment? Drie vragen, eerlijk antwoorden.\n\nReflecties — Schrijf op wat er in je leeft. Met emotietracking kun je zien hoe je je door de tijd heen hebt gevoeld.\n\nMemories — Een persoonlijke plek om herinneringen te bewaren aan wie of wat je mist. Met foto's, woorden en de datum die ertoe doet.\n\nHandreikingen — Kleine, concrete oefeningen voor zware momenten. Afgestemd op wat jij nodig hebt.\n\nInspiratie & troost — Gedichten, citaten en teksten die kunnen helpen als woorden van jezelf even niet komen.\n\nSchrijven zonder te hoeven uitleggen — Een leeg vel, geen vragen, geen structuur. Schrijf wat er is.\n\nTerugkijken wanneer je er klaar voor bent — Alles wat je hebt geschreven en gedeeld blijft staan.\n\nJouw kleur, jouw sfeer — Kies een accentkleur en achtergrond die bij jou passen.",
      voorWieTitle: "Voor wie is dit?",
      voorWieBullets: "Je ligt wakker en het is te laat om iemand te bellen. Niet omdat er niemand is, maar omdat je hen niet wakker wilt maken met iets wat je zelf ook niet precies kunt uitleggen.\nJe zegt 'gaat wel' als mensen vragen hoe het is. Niet omdat het waar is, maar omdat het echte antwoord te groot is voor tussendoor.\nJe bent er misschien nog niet klaar voor om alles op te rakelen bij een therapeut. Maar volledig alleen laten gaan lukt ook niet.\nJe wil niet vergeten. Wie iemand was, hoe iets voelde, wat er was. Je zoekt een plek waar herinneringen mogen bestaan.",
      wieIsTitle: "Over Benji",
      wieIsText: "Benji is gemaakt omdat verdriet geen kantooruren kent. Omdat iemand die mist niet tot maandag kan wachten.\n\n\"Dit is wat ik toen had willen hebben.\" — Ien, founder van Talk To Benji",
      ervaringenJson: JSON.stringify([
        { tekst: "Ik had niemand om mee te praten op het moment dat ik het het hardst nodig had. Benji was er gewoon. Geen oordeel, geen haast. Precies wat ik nodig had.", naam: "Annemiek, 47" },
        { tekst: "Ik had niet verwacht dat het zoveel zou doen. Die stille uren zijn het moeilijkst, en fijn dat er dan iets is waar je je verhaal kwijt kunt.", naam: "Peter, 61" },
        { tekst: "Het voelde gek om tegen een app te typen. Totdat ik merkte dat het echt hielp. Ik schreef dingen op die ik nog nooit hardop had gezegd.", naam: "Roos, 39" },
        { tekst: "Ik wilde eigenlijk niks. Geen therapie, geen praatgroep. Gewoon iets waarvoor ik niet hoefde uit te leggen wie ik ben. Benji is dat.", naam: "Anoniem" },
      ]),
      vragenJson: JSON.stringify([
        { vraag: "Is dit een abonnement?", antwoord: "Nee. Je betaalt eenmalig € 97 voor een vol jaar toegang. Geen automatische verlenging, geen verrassingen." },
        { vraag: "Hoe snel heb ik toegang?", antwoord: "Direct na betaling. Je ontvangt een e-mail met een link om in te loggen of je account aan te maken." },
        { vraag: "Ik weet niet of het iets voor mij is.", antwoord: "Je kunt Benji altijd eerst gratis proberen via de chat op de homepage, zonder account en zonder betaling. Kijk of het bij je past." },
        { vraag: "Is mijn verhaal veilig?", antwoord: "Alles wat je schrijft is alleen voor jou. Je gesprekken en reflecties zijn privé en worden niet gedeeld." },
        { vraag: "Wat gebeurt er na een jaar?", antwoord: "Je account blijft bestaan en alles wat je hebt opgeschreven blijft bewaard. Alleen de toegang tot de betaalde functies stopt. Je kunt dan kiezen of je wilt verlengen." },
        { vraag: "Ik heb al een gratis account.", antwoord: "Geen probleem. Na betaling wordt je bestaande account direct geüpgraded. Je hoeft niks opnieuw in te stellen." },
      ]),
      finalCtaTitle: "Een jaar lang niet alleen",
      finalCtaBody: "Voor één prijs, één jaar lang alles beschikbaar.\n\nVeilig betalen · direct toegang · geen automatische verlenging",
      createdAt: now,
      updatedAt: now,
    });
    return { seeded: true, id };
  },
});

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

/** Admin: genereer upload URL voor afbeeldingen */
export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
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
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
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
    footerText: v.optional(v.string()),
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
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    section1Title: v.optional(v.string()),
    section1Text: v.optional(v.string()),
    section2Title: v.optional(v.string()),
    section2Text: v.optional(v.string()),
    productImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    productImagePath: v.optional(v.string()),
    bgImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    voorWieBullets: v.optional(v.string()),
    ervaringenJson: v.optional(v.string()),
    vragenJson: v.optional(v.string()),
    wieIsTitle: v.optional(v.string()),
    wieIsText: v.optional(v.string()),
    finalCtaTitle: v.optional(v.string()),
    finalCtaBody: v.optional(v.string()),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { id, adminToken: _token, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Pagina niet gevonden");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) patch[key] = val;
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

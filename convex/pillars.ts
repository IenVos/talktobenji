import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";

/** Eenmalig: verwijder featuredSlugs die niet naar een live artikel van die pillar wijzen. */
export const _pruneFeaturedSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pillars = await ctx.db.query("pillars").collect();
    const report: Record<string, { before: string[]; after: string[]; removed: string[] }> = {};
    for (const pillar of pillars) {
      if (!pillar.featuredSlugs?.length) continue;
      const posts = await ctx.db.query("blogPosts").withIndex("by_pillar", (q) => q.eq("pillarSlug", pillar.slug)).collect();
      const liveSlugs = new Set(posts.filter((p) => p.isLive && (!p.publishedAt || p.publishedAt <= now)).map((p) => p.slug));
      const after = pillar.featuredSlugs.filter((s) => liveSlugs.has(s));
      const removed = pillar.featuredSlugs.filter((s) => !liveSlugs.has(s));
      if (removed.length) {
        await ctx.db.patch(pillar._id, { featuredSlugs: after, updatedAt: Date.now() });
        report[pillar.slug] = { before: pillar.featuredSlugs, after, removed };
      }
    }
    return report;
  },
});

/** Eenmalig: inline links in de lopende tekst van de twee pillars (idempotent). */
export const _addInlineLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    type Pair = { find: string; replace: string; guard: string };
    const perPillar: Record<string, Pair[]> = {
      "verlies-van-een-huisdier": [
        { guard: "niemand-begrijpt-mijn-verdriet-om-mijn-huisdier", find: "de stilte eromheen", replace: "[de stilte eromheen](/blog/niemand-begrijpt-mijn-verdriet-om-mijn-huisdier)" },
        { guard: "kinderen-en-het-verlies-van-een-huisdier-hoe-leg-je-het-uit", find: "hoe is het voor een kind om een huisdier te verliezen", replace: "[hoe is het voor een kind om een huisdier te verliezen](/blog/kinderen-en-het-verlies-van-een-huisdier-hoe-leg-je-het-uit)" },
        { guard: "leegte-na-overlijden-hond", find: "het voelen van een aanwezigheid in een lege kamer", replace: "[het voelen van een aanwezigheid in een lege kamer](/blog/leegte-na-overlijden-hond)" },
        { guard: "opeens-weer-verdriet-hond-rouw-golven", find: "Soms voel je beide op één dag", replace: "[Soms voel je beide op één dag](/blog/opeens-weer-verdriet-hond-rouw-golven)" },
        { guard: "herinnering-hond-levend-houden-aandenken", find: "een foto of een object dat hen aan hun dier herinnert", replace: "[een foto of een object dat hen aan hun dier herinnert](/blog/herinnering-hond-levend-houden-aandenken)" },
        { guard: "wanneer-hulp-zoeken-verlies-huisdier", find: "of professionele ondersteuning iets voor jou kan zijn", replace: "of [professionele ondersteuning](/blog/wanneer-hulp-zoeken-verlies-huisdier) iets voor jou kan zijn" },
        { guard: "ik-mis-mijn-hond-zo-erg-gemis", find: "midden in een gewone dinsdag", replace: "[midden in een gewone dinsdag](/blog/ik-mis-mijn-hond-zo-erg-gemis)" },
      ],
      "rouw-en-verdriet": [
        { guard: "niemand-begrijpt-mijn-verdriet-meer-eenzaamheid-na-verlies", find: "kun je je onbegrepen voelen", replace: "[kun je je onbegrepen voelen](/blog/niemand-begrijpt-mijn-verdriet-meer-eenzaamheid-na-verlies)" },
        { guard: "waarom-komt-het-verdriet-steeds-terug-golven", find: "Je slingert voortdurend heen en weer tussen deze twee werelden", replace: "[Je slingert voortdurend heen en weer tussen deze twee werelden](/blog/waarom-komt-het-verdriet-steeds-terug-golven)" },
        { guard: "eerste-jaar-na-verlies-wat-is-normaal", find: "Er is geen stopwatch die bepaalt wanneer je ergens over heen moet zijn", replace: "[Er is geen stopwatch die bepaalt wanneer je ergens over heen moet zijn](/blog/eerste-jaar-na-verlies-wat-is-normaal)" },
        { guard: "weer-aan-het-werk-terwijl-je-rouwt", find: "nieuwe rollen op te pakken en soms zelfs weer te lachen", replace: "[nieuwe rollen op te pakken](/blog/weer-aan-het-werk-terwijl-je-rouwt) en soms zelfs weer te lachen" },
      ],
    };
    const report: Record<string, { applied: string[]; skipped: string[] }> = {};
    for (const [slug, pairs] of Object.entries(perPillar)) {
      const pillar = await ctx.db.query("pillars").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      const r = { applied: [] as string[], skipped: [] as string[] };
      if (pillar?.content) {
        let content = pillar.content;
        for (const p of pairs) {
          if (content.includes("/blog/" + p.guard) || content.includes("/thema/" + p.guard)) { r.skipped.push(p.guard + " (al gelinkt)"); continue; }
          if (!content.includes(p.find)) { r.skipped.push(p.guard + " (anker niet gevonden)"); continue; }
          content = content.replace(p.find, p.replace);
          r.applied.push(p.guard);
        }
        if (r.applied.length) await ctx.db.patch(pillar._id, { content, updatedAt: Date.now() });
      }
      report[slug] = r;
    }
    return report;
  },
});

/** Eenmalig: "Lees ook"-blok (internalLinks) zetten voor de twee pillars. */
export const _setLeesookLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sets: Record<string, { label: string; slug: string }[]> = {
      "rouw-en-verdriet": [
        { label: "Het eerste jaar na een verlies: wat je kunt verwachten en wat normaal is", slug: "eerste-jaar-na-verlies-wat-is-normaal" },
        { label: "Waarom komt het verdriet steeds terug? Over de golven die je blijven overvallen", slug: "waarom-komt-het-verdriet-steeds-terug-golven" },
        { label: "Iemand helpen die rouwt: wat je wel en niet moet zeggen", slug: "iemand-helpen-die-rouwt-wat-zeggen" },
        { label: "Schuldgevoel na verlies: waarom je het voelt en wat je ermee kunt doen", slug: "schuldgevoel-na-verlies-waarom-je-het-voelt" },
        { label: "Niet weten hoe verder na verlies: het gevoel van verloren zijn", slug: "niet-weten-hoe-verder-na-verlies-het-gevoel-van-verloren-zijn" },
      ],
      "verlies-van-een-huisdier": [
        { label: "Ik mis mijn hond zo erg: wat doe je als het gemis niet minder wordt", slug: "ik-mis-mijn-hond-zo-erg-gemis" },
        { label: "De herinnering aan je hond levend houden: wat helpt en wat troost geeft", slug: "herinnering-hond-levend-houden-aandenken" },
        { label: "Wanneer neem je een nieuwe hond? Over twijfel, schuldgevoel en klaarheid", slug: "wanneer-nieuwe-hond-na-overlijden" },
        { label: "Je huisdier verliezen als je alleen woont", slug: "je-huisdier-verliezen-alleen-wonen" },
        { label: "Wanneer is het verdriet om je huisdier te veel? Over hulp zoeken na een verlies", slug: "wanneer-hulp-zoeken-verlies-huisdier" },
      ],
    };
    const updated: string[] = [];
    for (const [slug, links] of Object.entries(sets)) {
      const pillar = await ctx.db.query("pillars").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      if (pillar) {
        await ctx.db.patch(pillar._id, { internalLinks: links, updatedAt: Date.now() });
        updated.push(slug);
      }
    }
    return { updated };
  },
});

/** Admin: alle pillars */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const pillars = await ctx.db.query("pillars").collect();
    return await Promise.all(pillars.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
  },
});

/** Publiek: alle live pillars */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("pillars")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
  },
});

/** Publiek: één pillar via slug */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const pillar = await ctx.db.query("pillars")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!pillar) return null;
    const coverImageUrl = pillar.coverImageStorageId
      ? await ctx.storage.getUrl(pillar.coverImageStorageId).catch(() => null)
      : null;
    return { ...pillar, coverImageUrl };
  },
});

/** Publiek: artikelen gekoppeld aan een pillar — respecteert featuredSlugs indien ingesteld */
export const getArticles = query({
  args: { pillarSlug: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const [pillar, posts] = await Promise.all([
      ctx.db.query("pillars").withIndex("by_slug", (q) => q.eq("slug", args.pillarSlug)).first(),
      ctx.db.query("blogPosts").withIndex("by_pillar", (q) => q.eq("pillarSlug", args.pillarSlug)).collect(),
    ]);
    const live = posts.filter((p) => p.isLive && (!p.publishedAt || p.publishedAt <= now));
    const withCovers = await Promise.all(live.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
    if (pillar?.featuredSlugs?.length) {
      const map = new Map(withCovers.map((p) => [p.slug, p]));
      return pillar.featuredSlugs.map((s) => map.get(s)).filter(Boolean) as typeof withCovers;
    }
    return withCovers.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
  },
});

/** Publiek: alle gepubliceerde artikelen voor een pillar (negeert featuredSlugs) */
export const getAllArticles = query({
  args: { pillarSlug: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const posts = await ctx.db.query("blogPosts")
      .withIndex("by_pillar", (q) => q.eq("pillarSlug", args.pillarSlug))
      .collect();
    const live = posts.filter((p) => p.isLive && (!p.publishedAt || p.publishedAt <= now));
    const withCovers = await Promise.all(live.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
    return withCovers.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
  },
});

/** Admin: upload URL genereren */
export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

/** Admin: afbeelding URL ophalen */
export const getImageUrl = mutation({
  args: { adminToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.getUrl(args.storageId);
  },
});

/** Publiek: alle live pillar slugs — voor kleurcodering op overzichtspagina */
export const listSlugs = query({
  args: {},
  handler: async (ctx) => {
    const pillars = await ctx.db.query("pillars")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
    // Sorteer op _creationTime (onveranderlijke insert-tijd), NIET op createdAt.
    // createdAt is bewerkbaar (bijv. publicatiedatum aanpassen); dat mag de
    // kleurtoewijzing per pillar op /blog niet verschuiven. Zo houdt elke pillar
    // stabiel zijn eigen kleur.
    return pillars
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((p) => p.slug);
  },
});

/** Publiek: per live pillar het laatst gepubliceerde artikel (voor de homepage-artikelenstrip). */
export const latestArticlePerPillar = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pillars = await ctx.db.query("pillars").filter((q) => q.eq(q.field("isLive"), true)).collect();
    const rows = [];
    for (const p of pillars) {
      const posts = await ctx.db.query("blogPosts").withIndex("by_pillar", (q) => q.eq("pillarSlug", p.slug)).collect();
      const live = posts.filter((x) => x.isLive && !x.archived && (!x.publishedAt || x.publishedAt <= now));
      if (!live.length) continue;
      live.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
      const a = live[0];
      const coverImageUrl = a.coverImageStorageId
        ? await ctx.storage.getUrl(a.coverImageStorageId).catch(() => null)
        : null;
      rows.push({
        pillarSlug: p.slug,
        pillarTitle: p.title,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt ?? null,
        coverImageUrl,
        publishedAt: a.publishedAt ?? a.createdAt,
      });
    }
    rows.sort((x, y) => y.publishedAt - x.publishedAt);
    return rows.slice(0, 3);
  },
});

/** Publiek: lichte dataset voor auto-linking (slug, title, anchorPhrases) — linkt naar /thema/ */
export const listAnchorData = query({
  args: {},
  handler: async (ctx) => {
    const pillars = await ctx.db.query("pillars")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
    return pillars
      .filter((p) => p.anchorPhrases && p.anchorPhrases.length > 0)
      .map((p) => ({ slug: p.slug, title: p.title, anchorPhrases: p.anchorPhrases!, isPillar: true }));
  },
});

/** Admin: pillar aanmaken */
export const create = mutation({
  args: {
    adminToken: v.string(),
    slug: v.string(),
    title: v.string(),
    seoTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
    isLive: v.boolean(),
    sources: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    ctaKey: v.optional(v.string()),
    excerptCtaKey: v.optional(v.string()),
    anchorPhrases: v.optional(v.array(v.string())),
    featuredSlugs: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return ctx.db.insert("pillars", {
      slug: args.slug,
      title: args.title,
      seoTitle: args.seoTitle,
      metaDescription: args.metaDescription,
      excerpt: args.excerpt,
      content: args.content,
      coverImageStorageId: args.coverImageStorageId,
      faqItems: args.faqItems,
      internalLinks: args.internalLinks,
      isLive: args.isLive,
      sources: args.sources,
      focusKeyword: args.focusKeyword,
      ctaKey: args.ctaKey,
      excerptCtaKey: args.excerptCtaKey,
      anchorPhrases: args.anchorPhrases,
      featuredSlugs: args.featuredSlugs,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: pillar bijwerken */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("pillars"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
    isLive: v.optional(v.boolean()),
    sources: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    ctaKey: v.optional(v.string()),
    excerptCtaKey: v.optional(v.string()),
    anchorPhrases: v.optional(v.array(v.string())),
    featuredSlugs: v.optional(v.array(v.string())),
    kbSynced: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val === "" ? undefined : val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Admin: alle ankerzinnen van alle pillar-pagina's verwijderen */
export const clearAllAnchorPhrases = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const pillars = await ctx.db.query("pillars").collect();
    await Promise.all(pillars.map((p) => ctx.db.patch(p._id, { anchorPhrases: undefined })));
    return pillars.length;
  },
});

/** Admin: pillar verwijderen */
export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("pillars") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

/** Admin: samenvatting + FAQ synchroniseren naar kennisbank */
export const syncToKnowledgeBase = mutation({
  args: { adminToken: v.string(), id: v.id("pillars") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const pillar = await ctx.db.get(args.id);
    if (!pillar) throw new Error("Pillar niet gevonden");

    const now = Date.now();
    const tags = [pillar.slug, "pillar", "thema", ...pillar.title.toLowerCase().split(" ").filter((w) => w.length > 3)];

    // Mapping: pillar-titel (publiek/SEO) → KB-categorienaam (admin)
    const PILLAR_NAAR_KB: Record<string, string> = {
      "Verdriet dat niet zichtbaar is": "Onzichtbaar verdriet",
    };
    const category = PILLAR_NAAR_KB[pillar.title] ?? pillar.title;

    const existing = await ctx.db.query("knowledgeBase").collect();
    const existingQuestions = new Set(existing.map((e) => e.question.trim().toLowerCase()));

    const insertIfNew = async (question: string, answer: string, priority: number) => {
      if (!question.trim() || !answer.trim()) return;
      if (existingQuestions.has(question.trim().toLowerCase())) return;
      await ctx.db.insert("knowledgeBase", {
        question, answer,
        category,
        tags, isActive: true, usageCount: 0, priority,
        createdBy: "pillar-sync",
        createdAt: now, updatedAt: now,
      });
      existingQuestions.add(question.trim().toLowerCase());
    };

    if (pillar.excerpt) await insertIfNew(pillar.title, pillar.excerpt, 5);
    if (pillar.faqItems) {
      for (const faq of pillar.faqItems) {
        await insertIfNew(faq.question, faq.answer, 6);
      }
    }

    await ctx.db.patch(args.id, { kbSynced: true, updatedAt: now });

    // Plan embedding-berekening in voor nieuwe Q&A's
    await ctx.scheduler.runAfter(5000, api.embeddings.embedAllKbItems, { batchSize: 50 });

    return true;
  },
});

/** Admin: de 3 standaard pillars aanmaken */
export const seedPillars = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    const defaults = [
      {
        slug: "rouw-en-verdriet",
        title: "Rouw & Verdriet",
        metaDescription: "Alles over rouw en verdriet — wat het is, hoe het voelt en hoe je ermee om kunt gaan.",
      },
      {
        slug: "onzichtbaar-verlies",
        title: "Onzichtbaar Verlies",
        metaDescription: "Over verlies dat anderen niet zien of begrijpen — en hoe je toch ruimte kunt maken voor je verdriet.",
      },
      {
        slug: "verlies-van-een-huisdier",
        title: "Verlies van een Huisdier",
        metaDescription: "Het verdriet om een huisdier is echt. Alles over rouwen om een dier en hoe je daarmee omgaat.",
      },
    ];
    for (const d of defaults) {
      const existing = await ctx.db.query("pillars")
        .withIndex("by_slug", (q) => q.eq("slug", d.slug))
        .first();
      if (!existing) {
        await ctx.db.insert("pillars", { ...d, content: undefined, isLive: false, createdAt: now, updatedAt: now });
      }
    }
    return true;
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Admin: alle blogposts */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const posts = await ctx.db.query("blogPosts").order("desc").collect();
    return await Promise.all(posts.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
  },
});

/** Publiek: gepubliceerde posts (publishedAt <= nu, isLive = true) */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db.query("blogPosts")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
    const published = posts.filter((p) => !p.publishedAt || p.publishedAt <= now);
    published.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
    return await Promise.all(published.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
  },
});

/** Publiek: één post via slug */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db.query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post || !post.isLive) return null;
    if (post.publishedAt && post.publishedAt > Date.now()) return null;
    return {
      ...post,
      coverImageUrl: post.coverImageStorageId
        ? await ctx.storage.getUrl(post.coverImageStorageId).catch(() => null)
        : null,
    };
  },
});

/** Admin: URL ophalen na upload */
export const getImageUrl = mutation({
  args: { adminToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.getUrl(args.storageId);
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

/** Admin: nieuw artikel aanmaken */
export const create = mutation({
  args: {
    adminToken: v.string(),
    slug: v.string(),
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    publishedAt: v.optional(v.number()),
    isLive: v.boolean(),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    const id = await ctx.db.insert("blogPosts", {
      slug: args.slug,
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      metaDescription: args.metaDescription,
      coverImageStorageId: args.coverImageStorageId,
      publishedAt: args.publishedAt,
      isLive: args.isLive,
      faqItems: args.faqItems,
      internalLinks: args.internalLinks,
      kbSynced: false,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/** Admin: artikel bijwerken */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    publishedAt: v.optional(v.number()),
    isLive: v.optional(v.boolean()),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
    kbSynced: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Admin: artikel verwijderen */
export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

/** Admin: FAQ + samenvatting synchroniseren naar kennisbank */
export const syncToKnowledgeBase = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post niet gevonden");

    const now = Date.now();
    const tags = [post.slug, "blog", ...post.title.toLowerCase().split(" ").filter((w) => w.length > 3)];

    // Samenvatting als kennisbank-item
    if (post.excerpt) {
      await ctx.db.insert("knowledgeBase", {
        question: post.title,
        answer: post.excerpt,
        category: "Blog",
        tags,
        isActive: true,
        usageCount: 0,
        priority: 5,
        createdBy: "blog-sync",
        createdAt: now,
        updatedAt: now,
      });
    }

    // FAQ-items als kennisbank-items
    if (post.faqItems && post.faqItems.length > 0) {
      for (const faq of post.faqItems) {
        if (!faq.question.trim() || !faq.answer.trim()) continue;
        await ctx.db.insert("knowledgeBase", {
          question: faq.question,
          answer: faq.answer,
          category: "Blog",
          tags,
          isActive: true,
          usageCount: 0,
          priority: 6,
          createdBy: "blog-sync",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.id, { kbSynced: true, updatedAt: now });
    return true;
  },
});

/** Admin: voorbeeldartikel aanmaken */
export const seedExample = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db.query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", "hoe-er-zijn-voor-iemand-die-rouwt"))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("blogPosts", {
      slug: "hoe-er-zijn-voor-iemand-die-rouwt",
      title: "Hoe er zijn voor iemand die rouwt — zonder de verkeerde dingen te zeggen",
      content: `Wanneer iemand verlies ervaart, willen we helpen. Maar we weten niet altijd hoe. We zijn bang de verkeerde woorden te kiezen, of juist bang om te zwijgen.

Toch is aanwezig zijn — echt aanwezig — het krachtigste wat je kunt doen.

**Wat werkt niet**

De meest gemaakte fout is proberen het verdriet weg te praten. Zinnen als "hij is nu op een betere plek" of "de tijd heelt alle wonden" zijn goedbedoeld, maar voelen voor de rouwende vaak aan als een afsluiting van hun gevoel.

Rouw heeft geen oplossing. Het vraagt om ruimte.

**Wat wél werkt**

Kleine, concrete gebaren doen meer dan grote woorden. Stuur een bericht zonder dat je een antwoord verwacht. Breng eten langs. Zeg: "Ik denk aan je." Meer is soms niet nodig.

Vraag ook gewoon: "Hoe gaat het vandaag?" — niet als beleefdheid, maar als echte vraag. En luister dan echt naar het antwoord.

**Het gaat om aanwezigheid, niet om perfectie**

Je hoeft niet de perfecte woorden te hebben. Je mag onzeker zijn. Wat telt is dat je er bent — niet weggaat omdat het ongemakkelijk voelt.

Rouwenden herinneren zich niet altijd wat je zei. Maar ze herinneren zich wel wie bleef.`,
      excerpt: "Aanwezig zijn voor iemand die rouwt hoeft niet perfect te zijn. Dit artikel legt uit waarom kleine gebaren meer doen dan grote woorden, en hoe je er echt kunt zijn voor iemand in verdriet.",
      metaDescription: "Hoe kun je er zijn voor iemand die rouwt? Praktisch en eerlijk advies over aanwezig zijn, zonder de verkeerde dingen te zeggen.",
      publishedAt: now,
      isLive: false,
      faqItems: [
        {
          question: "Wat zeg je tegen iemand die net iemand verloren heeft?",
          answer: "Je hoeft geen perfecte woorden te hebben. 'Ik denk aan je' of 'Ik ben er als je wil praten' is genoeg. Het gaat om aanwezigheid, niet om de juiste zin.",
        },
        {
          question: "Hoe help je iemand die rouwt zonder opdringerig te zijn?",
          answer: "Stuur een bericht zonder een antwoord te verwachten. Breng eten langs. Vraag concreet wat je kunt doen. Kleine, herhaalde gebaren zijn krachtiger dan één grote daad.",
        },
        {
          question: "Wat moet je niet zeggen tegen iemand die rouwt?",
          answer: "Vermijd zinnen als 'alles komt goed', 'hij is op een betere plek' of 'ik weet hoe je je voelt'. Ze sluiten het gevoel van de ander af. Luister liever dan dat je troost aandraagt.",
        },
      ],
      internalLinks: [
        { label: "Wat is rouw en wat mag je verwachten?", slug: "wat-is-rouw" },
        { label: "Praktische steun geven in de eerste weken", slug: "praktische-steun-na-verlies" },
      ],
      kbSynced: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

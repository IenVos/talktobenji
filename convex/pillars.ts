import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

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

/** Publiek: artikelen gekoppeld aan een pillar */
export const getArticles = query({
  args: { pillarSlug: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const posts = await ctx.db.query("blogPosts")
      .withIndex("by_pillar", (q) => q.eq("pillarSlug", args.pillarSlug))
      .collect();
    return posts
      .filter((p) => p.isLive && (!p.publishedAt || p.publishedAt <= now))
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
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

    const existing = await ctx.db.query("knowledgeBase").collect();
    const existingQuestions = new Set(existing.map((e) => e.question.trim().toLowerCase()));

    const insertIfNew = async (question: string, answer: string, priority: number) => {
      if (!question.trim() || !answer.trim()) return;
      if (existingQuestions.has(question.trim().toLowerCase())) return;
      await ctx.db.insert("knowledgeBase", {
        question, answer,
        category: "Thema",
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

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Admin: alle pillars */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.db.query("pillars").collect();
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
    return ctx.db.query("pillars")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
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

/** Admin: pillar aanmaken */
export const create = mutation({
  args: {
    adminToken: v.string(),
    slug: v.string(),
    title: v.string(),
    metaDescription: v.optional(v.string()),
    content: v.optional(v.string()),
    isLive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return ctx.db.insert("pillars", {
      slug: args.slug,
      title: args.title,
      metaDescription: args.metaDescription,
      content: args.content,
      isLive: args.isLive,
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
    metaDescription: v.optional(v.string()),
    content: v.optional(v.string()),
    isLive: v.optional(v.boolean()),
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

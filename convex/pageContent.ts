import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const getPageContent = query({
  args: { pageKey: v.string(), adminToken: v.string() },
  handler: async (ctx, { pageKey, adminToken }) => {
    await checkAdmin(ctx, adminToken);
    const row = await ctx.db
      .query("pageContent")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", pageKey))
      .unique();
    if (!row) return null;
    try {
      return JSON.parse(row.content) as Record<string, string>;
    } catch {
      return null;
    }
  },
});

export const setPageContent = mutation({
  args: { pageKey: v.string(), content: v.string(), adminToken: v.string() },
  handler: async (ctx, { pageKey, content, adminToken }) => {
    await checkAdmin(ctx, adminToken);
    const existing = await ctx.db
      .query("pageContent")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", pageKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { content, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("pageContent", { pageKey, content, updatedAt: Date.now() });
    }
  },
});

// Publieke query voor de homepage (geen adminToken nodig)
export const getPublicPageContent = query({
  args: { pageKey: v.string() },
  handler: async (ctx, { pageKey }) => {
    const row = await ctx.db
      .query("pageContent")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", pageKey))
      .unique();
    if (!row) return null;
    try {
      return JSON.parse(row.content) as Record<string, string>;
    } catch {
      return null;
    }
  },
});

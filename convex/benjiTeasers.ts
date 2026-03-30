import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.db.query("benjiTeasers").collect();
  },
});

export const getByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("benjiTeasers")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    adminToken: v.string(),
    type: v.string(),
    label: v.string(),
    intro: v.string(),
    themeKey: v.string(),
    downloadTitel: v.string(),
    bestandsnaam: v.string(),
    vragen: v.array(v.object({ vraag: v.string(), placeholder: v.string() })),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken: _, ...data } = args;
    const existing = await ctx.db
      .query("benjiTeasers")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...data, updatedAt: now });
    } else {
      await ctx.db.insert("benjiTeasers", { ...data, updatedAt: now });
    }
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db
      .query("benjiTeasers")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

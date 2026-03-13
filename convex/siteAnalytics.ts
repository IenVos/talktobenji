/**
 * Website analytics – paginabezoeken bijhouden en statistieken ophalen.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Sla een paginabezoek op (publiek, geen auth vereist). */
export const trackPageView = mutation({
  args: {
    path: v.string(),
    sessionId: v.string(),
    device: v.string(),
  },
  handler: async (ctx, args) => {
    // Skip admin- en API-paden
    if (args.path.startsWith("/admin") || args.path.startsWith("/api")) {
      return null;
    }
    return await ctx.db.insert("pageViews", {
      path: args.path,
      sessionId: args.sessionId,
      timestamp: Date.now(),
      device: args.device,
    });
  },
});

/** Werk de verblijfsduur bij voor het meest recente bezoek van deze sessie+pad. */
export const updateDuration = mutation({
  args: {
    sessionId: v.string(),
    path: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("pageViews")
      .withIndex("by_session_timestamp", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .collect();

    // Meest recente bezoek met dit pad
    const matching = views
      .filter((v) => v.path === args.path)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (matching.length === 0) return null;
    const record = matching[0];
    await ctx.db.patch(record._id, { duration: args.duration });
    return record._id;
  },
});

/** Haal statistieken op voor het opgegeven tijdsbereik (admin only). */
export const getStats = query({
  args: {
    adminToken: v.string(),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    // Haal alle paginabezoeken op in het bereik
    const allViews = await ctx.db
      .query("pageViews")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", args.from).lte("timestamp", args.to)
      )
      .collect();

    // -- Dagelijkse bezoeken --
    const dayMap: Record<string, { sessions: Set<string>; count: number }> = {};
    for (const view of allViews) {
      const date = new Date(view.timestamp).toISOString().slice(0, 10);
      if (!dayMap[date]) dayMap[date] = { sessions: new Set(), count: 0 };
      dayMap[date].count++;
      dayMap[date].sessions.add(view.sessionId);
    }

    const dailyViews = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { count, sessions }]) => ({
        date,
        views: count,
        unique: sessions.size,
      }));

    // -- Populairste pagina's (top 10) --
    const pathCounts: Record<string, number> = {};
    for (const view of allViews) {
      pathCounts[view.path] = (pathCounts[view.path] ?? 0) + 1;
    }
    const topPages = Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // -- Apparaten --
    let mobile = 0;
    let desktop = 0;
    for (const view of allViews) {
      if (view.device === "mobile") mobile++;
      else desktop++;
    }

    // -- Totalen --
    const allSessionIds = new Set(allViews.map((v) => v.sessionId));
    const durations = allViews
      .map((v) => v.duration)
      .filter((d): d is number => d !== undefined && d > 0 && d < 3600);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    const totals = {
      views: allViews.length,
      unique: allSessionIds.size,
      avgDuration,
    };

    // -- Dagelijkse conversies (userSubscriptions) --
    const allSubs = await ctx.db.query("userSubscriptions").collect();
    const subsInRange = allSubs.filter(
      (s) => s.startedAt >= args.from && s.startedAt <= args.to
    );

    const convMap: Record<
      string,
      { freeAccounts: number; paid: number; nietAlleen: number }
    > = {};
    for (const sub of subsInRange) {
      const date = new Date(sub.startedAt).toISOString().slice(0, 10);
      if (!convMap[date])
        convMap[date] = { freeAccounts: 0, paid: 0, nietAlleen: 0 };
      if (sub.subscriptionType === "free") {
        convMap[date].freeAccounts++;
      } else if (
        sub.subscriptionType === "uitgebreid" ||
        sub.subscriptionType === "alles_in_1"
      ) {
        convMap[date].paid++;
      } else if (sub.subscriptionType === "niet_alleen") {
        convMap[date].nietAlleen++;
      }
    }

    const dailyConversions = Object.entries(convMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return {
      dailyViews,
      dailyConversions,
      topPages,
      devices: { mobile, desktop },
      totals,
    };
  },
});

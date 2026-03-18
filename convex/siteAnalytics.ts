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
    ip: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Skip admin- en API-paden
    if (args.path.startsWith("/admin") || args.path.startsWith("/api")) {
      return null;
    }
    // Skip uitgesloten IP-adressen
    if (args.ip) {
      const excluded = await ctx.db
        .query("analyticsExcludedIps")
        .collect();
      if (excluded.some((e) => e.ip === args.ip)) return null;
    }
    return await ctx.db.insert("pageViews", {
      path: args.path,
      sessionId: args.sessionId,
      timestamp: Date.now(),
      device: args.device,
      ip: args.ip,
      referrer: args.referrer,
    });
  },
});

/** IP-adressen beheren voor analytics uitsluiting (admin only). */
export const listExcludedIps = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.query("analyticsExcludedIps").collect();
  },
});

export const addExcludedIp = mutation({
  args: { adminToken: v.string(), ip: v.string(), label: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db.query("analyticsExcludedIps").collect();
    if (existing.some((e) => e.ip === args.ip)) return null;
    return await ctx.db.insert("analyticsExcludedIps", {
      ip: args.ip,
      label: args.label,
      createdAt: Date.now(),
    });
  },
});

export const removeExcludedIp = mutation({
  args: { adminToken: v.string(), id: v.id("analyticsExcludedIps") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

/** Email-adressen beheren voor uitsluiting van conversies (admin only). */
export const listExcludedEmails = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.query("analyticsExcludedEmails").collect();
  },
});

export const addExcludedEmail = mutation({
  args: { adminToken: v.string(), email: v.string(), label: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db.query("analyticsExcludedEmails").collect();
    if (existing.some((e) => e.email === args.email.toLowerCase())) return null;
    return await ctx.db.insert("analyticsExcludedEmails", {
      email: args.email.toLowerCase(),
      label: args.label,
      createdAt: Date.now(),
    });
  },
});

export const removeExcludedEmail = mutation({
  args: { adminToken: v.string(), id: v.id("analyticsExcludedEmails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

/** Verwijder paginabezoeken vóór een bepaalde datum (admin only). */
export const deleteOldViews = mutation({
  args: { adminToken: v.string(), before: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const old = await ctx.db
      .query("pageViews")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", args.before))
      .collect();
    for (const view of old) {
      await ctx.db.delete(view._id);
    }
    return old.length;
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
    const [rawViews, excludedIps] = await Promise.all([
      ctx.db
        .query("pageViews")
        .withIndex("by_timestamp", (q) =>
          q.gte("timestamp", args.from).lte("timestamp", args.to)
        )
        .collect(),
      ctx.db.query("analyticsExcludedIps").collect(),
    ]);
    const excludedSet = new Set(excludedIps.map((e) => e.ip));
    const allViews = rawViews.filter((v) => !v.ip || !excludedSet.has(v.ip));

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
      .map(([path, count]) => ({ path, count }));

    // -- Apparaten --
    let mobile = 0;
    let tablet = 0;
    let desktop = 0;
    for (const view of allViews) {
      if (view.device === "mobile") mobile++;
      else if (view.device === "tablet") tablet++;
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

    // -- Terugkerende bezoekers (sessies die op meer dan 1 dag bezochten) --
    const sessionDays: Record<string, Set<string>> = {};
    for (const view of allViews) {
      const date = new Date(view.timestamp).toISOString().slice(0, 10);
      if (!sessionDays[view.sessionId]) sessionDays[view.sessionId] = new Set();
      sessionDays[view.sessionId].add(date);
    }
    const returningVisitors = Object.values(sessionDays).filter((days) => days.size > 1).length;

    // -- Verblijfsduur per pagina --
    const pageDurations: Record<string, number[]> = {};
    for (const view of allViews) {
      if (view.duration && view.duration > 0 && view.duration < 3600) {
        if (!pageDurations[view.path]) pageDurations[view.path] = [];
        pageDurations[view.path].push(view.duration);
      }
    }
    const topPageDurations = Object.entries(pageDurations)
      .map(([path, durs]) => ({
        path,
        avgDuration: Math.round(durs.reduce((a, b) => a + b, 0) / durs.length),
        visits: (pathCounts[path] ?? 0),
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    const totals = {
      views: allViews.length,
      unique: allSessionIds.size,
      avgDuration,
      returningVisitors,
    };

    // -- Dagelijkse conversies (userSubscriptions) --
    const [allSubs, excludedEmails] = await Promise.all([
      ctx.db.query("userSubscriptions").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
    ]);
    const excludedEmailSet = new Set(excludedEmails.map((e) => e.email.toLowerCase()));
    const subsInRange = allSubs.filter(
      (s) =>
        s.startedAt >= args.from &&
        s.startedAt <= args.to &&
        (!s.email || !excludedEmailSet.has(s.email.toLowerCase()))
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

    // -- Dag × uur heatmap (7 dagen × 24 uur) --
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const view of allViews) {
      const d = new Date(view.timestamp);
      const dow = (d.getDay() + 6) % 7; // 0=Ma, 6=Zo
      const hour = d.getHours();
      heatmap[dow][hour]++;
    }
    const hourlyViews = heatmap.map((hours, dow) => ({ dow, hours }));

    // -- Bron (referrer) aggregatie --
    function parseSource(referrer?: string): string {
      if (!referrer) return "Direct";
      try {
        const url = new URL(referrer);
        const host = url.hostname.replace("www.", "");
        if (host.includes("google")) return "Google";
        if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
        if (host.includes("instagram")) return "Instagram";
        if (host.includes("bing")) return "Bing";
        if (host.includes("pinterest")) return "Pinterest";
        if (host.includes("talktobenji")) return "Direct";
        return host;
      } catch {
        return "Direct";
      }
    }

    const sourceMap: Record<string, number> = {};
    for (const view of allViews) {
      const source = parseSource(view.referrer);
      sourceMap[source] = (sourceMap[source] ?? 0) + 1;
    }
    const totalViewsForSource = allViews.length || 1;
    const bronnen = Object.entries(sourceMap)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({ source, count, pct: Math.round((count / totalViewsForSource) * 100) }));

    // -- Conversie ratio (alleen bekende types, zelfde als dailyConversions) --
    const geteldConversies = subsInRange.filter((s) =>
      s.subscriptionType === "free" ||
      s.subscriptionType === "uitgebreid" ||
      s.subscriptionType === "alles_in_1" ||
      s.subscriptionType === "niet_alleen"
    ).length;
    const conversieRatio = allSessionIds.size > 0 ? Math.round((geteldConversies / allSessionIds.size) * 1000) / 10 : 0;
    // Debug: alle unieke subscription types die voorkomen
    const allSubTypes = [...new Set(subsInRange.map((s) => s.subscriptionType))];

    // -- Omzet berekening --
    // Gebruik pricePaid als beschikbaar, anders schatting op basis van type + periode
    const PRIJS_SCHATTING: Record<string, Record<string, number>> = {
      alles_in_1:  { monthly: 0, yearly: 97 }, // Actief: €97 eenmalig per jaar
      uitgebreid:  { monthly: 0, yearly: 0 },  // Niet actief verkocht
      niet_alleen: { monthly: 0, yearly: 0 },  // Niet actief verkocht
      free:        { monthly: 0, yearly: 0 },
      trial:       { monthly: 0, yearly: 0 },
    };

    const betaaldeSubs = subsInRange.filter((s) =>
      s.subscriptionType !== "free" && s.subscriptionType !== "trial"
    );

    let omzet = 0;
    let omzetGeschat = false;
    for (const s of betaaldeSubs) {
      if ((s as any).pricePaid !== undefined) {
        omzet += (s as any).pricePaid;
      } else {
        const periode = (s as any).billingPeriod ?? "monthly";
        const typeMap = PRIJS_SCHATTING[s.subscriptionType] ?? { monthly: 0 };
        omzet += typeMap[periode] ?? 0;
        omzetGeschat = true;
      }
    }
    omzet = Math.round(omzet * 100) / 100;

    return {
      dailyViews,
      dailyConversions,
      topPages,
      devices: { mobile, tablet, desktop },
      totals,
      hourlyViews,
      bronnen,
      conversieRatio,
      allSubTypes,
      omzet,
      omzetGeschat,
      topPageDurations,
    };
  },
});

/** Feature-gebruik statistieken (admin only). */
export const getFeatureStats = query({
  args: { adminToken: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const inRange = (ts: number) => ts >= args.from && ts <= args.to;

    const [notes, emotions, checkIns, goals, memories, houvasteProfielen, users, preferences, excludedEmailRecords] = await Promise.all([
      ctx.db.query("notes").collect(),
      ctx.db.query("emotionEntries").collect(),
      ctx.db.query("checkInEntries").collect(),
      ctx.db.query("goals").collect(),
      ctx.db.query("memories").collect(),
      ctx.db.query("houvasteProfielen").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("userPreferences").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
    ]);

    const excludedEmailSet = new Set(excludedEmailRecords.map((e: any) => e.email.toLowerCase()));

    // Gebruikers wiens email is uitgesloten
    const excludedUserIds = new Set(
      users.filter((u: any) => u.email && excludedEmailSet.has(u.email.toLowerCase())).map((u: any) => u._id)
    );

    const userEmails = new Set(users.map((u: any) => u.email));

    // Houvast funnel — uitgesloten emails eruit filteren
    const houvasteNietUitgesloten = houvasteProfielen.filter(
      (h: any) => !excludedEmailSet.has(h.email.toLowerCase())
    );
    const houvasteInPeriod = houvasteNietUitgesloten.filter((h: any) => inRange(h.createdAt));
    const houvasteConverted = houvasteInPeriod.filter((h: any) => userEmails.has(h.email));

    // Feature gebruik in periode — gebruik _creationTime als fallback als createdAt ontbreekt
    const ts = (item: any) => item.createdAt ?? item._creationTime ?? 0;

    const convertedEmails = new Set(houvasteConverted.map((h: any) => h.email));

    return {
      houvast: {
        total: houvasteInPeriod.length,
        converted: houvasteConverted.length,
        allTime: houvasteNietUitgesloten.length,
        list: houvasteNietUitgesloten
          .sort((a: any, b: any) => b.createdAt - a.createdAt)
          .map((h: any) => ({
            email: h.email,
            name: h.name ?? null,
            createdAt: h.createdAt,
            heeftAccount: convertedEmails.has(h.email),
          })),
      },
      features: [
        { label: "Reflecties", count: notes.filter((n: any) => inRange(ts(n)) && !excludedUserIds.has(n.userId)).length, allTime: notes.filter((n: any) => !excludedUserIds.has(n.userId)).length },
        { label: "Check-ins", count: checkIns.filter((c: any) => inRange(ts(c)) && !excludedUserIds.has(c.userId)).length, allTime: checkIns.filter((c: any) => !excludedUserIds.has(c.userId)).length },
        { label: "Doelen", count: goals.filter((g: any) => inRange(ts(g)) && !excludedUserIds.has(g.userId)).length, allTime: goals.filter((g: any) => !excludedUserIds.has(g.userId)).length },
        { label: "Memories", count: memories.filter((m: any) => inRange(ts(m)) && !excludedUserIds.has(m.userId)).length, allTime: memories.filter((m: any) => !excludedUserIds.has(m.userId)).length },
        { label: "Emoties gelogd", count: emotions.filter((e: any) => inRange(ts(e)) && !excludedUserIds.has(e.userId)).length, allTime: emotions.filter((e: any) => !excludedUserIds.has(e.userId)).length },
        { label: "Kleur gewijzigd", count: preferences.filter((p: any) => p.accentColorChangedAt && inRange(p.accentColorChangedAt) && !excludedUserIds.has(p.userId)).length, allTime: preferences.filter((p: any) => p.accentColor && !excludedUserIds.has(p.userId)).length },
        { label: "Achtergrond gewijzigd", count: preferences.filter((p: any) => p.backgroundImageChangedAt && inRange(p.backgroundImageChangedAt) && !excludedUserIds.has(p.userId)).length, allTime: preferences.filter((p: any) => p.backgroundImageStorageId && !excludedUserIds.has(p.userId)).length },
      ],
    };
  },
});

/** Toon alle doelen met het emailadres van de eigenaar (admin only). */
export const listGoalsWithOwner = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [goals, users] = await Promise.all([
      ctx.db.query("goals").collect(),
      ctx.db.query("users").collect(),
    ]);
    const userById = new Map(users.map((u: any) => [u._id, u.email]));
    return goals
      .sort((a: any, b: any) => (b.createdAt ?? b._creationTime ?? 0) - (a.createdAt ?? a._creationTime ?? 0))
      .map((g: any) => ({
        id: g._id,
        title: g.title ?? g.goal ?? "(geen titel)",
        email: userById.get(g.userId) ?? g.userId,
        createdAt: g.createdAt ?? g._creationTime ?? 0,
      }));
  },
});

/** Aantal live bezoekers (sessies actief in laatste 5 minuten, admin only). */
export const getLiveVisitors = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const since = Date.now() - 5 * 60 * 1000;
    const [recentViews, excludedIps] = await Promise.all([
      ctx.db
        .query("pageViews")
        .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
        .collect(),
      ctx.db.query("analyticsExcludedIps").collect(),
    ]);
    const excludedSet = new Set(excludedIps.map((e) => e.ip));
    const filtered = recentViews.filter((v) => !v.ip || !excludedSet.has(v.ip));
    const sessions = new Set(filtered.map((v) => v.sessionId));
    return sessions.size;
  },
});

/** Haal recente inschrijvingen op (admin only). */
export const getRecentRegistrations = query({
  args: { adminToken: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const daysBack = args.days ?? 7;
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    const recent = users.filter((u: any) => u._creationTime >= since);

    return {
      total: recent.length,
      today: recent.filter((u: any) => u._creationTime >= todayStart.getTime()).length,
      users: recent.slice(0, 20).map((u: any) => ({
        name: u.name,
        email: u.email,
        createdAt: u._creationTime,
      })),
    };
  },
});

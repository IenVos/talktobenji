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
    os: v.optional(v.string()),
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
      os: args.os,
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

/** Verwijder koopknop-kliks van vóór een bepaald tijdstip (admin only).
 *  Gebruikt om onbetrouwbare oude klikdata op te schonen na de sendBeacon-fix. */
export const deleteButtonClicksBefore = mutation({
  args: { adminToken: v.string(), before: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const old = await ctx.db
      .query("buttonClicks")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", args.before))
      .collect();
    for (const click of old) {
      await ctx.db.delete(click._id);
    }
    return old.length;
  },
});

/** Sla een koopknop-klik op (publiek, geen auth vereist). */
export const trackButtonClick = mutation({
  args: {
    path: v.string(),
    buttonLabel: v.string(),
    sessionId: v.string(),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.ip) {
      const excluded = await ctx.db.query("analyticsExcludedIps").collect();
      if (excluded.some((e) => e.ip === args.ip)) return null;
    }
    return await ctx.db.insert("buttonClicks", {
      path: args.path,
      buttonLabel: args.buttonLabel,
      sessionId: args.sessionId,
      timestamp: Date.now(),
      ip: args.ip,
    });
  },
});

/**
 * Registreer "checkout bereikt" — server-side aangeroepen vanuit de payment-intent route,
 * zodat dit niet door een (mobiele) browser geblokkeerd kan worden. Geen IP.
 * Ontdubbelt per sessie + bron + product, zodat herladen/meerdere betaalsessies niet dubbel tellen.
 */
export const trackCheckoutReach = mutation({
  args: {
    source: v.string(),
    slug: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.sessionId) {
      const existing = await ctx.db
        .query("checkoutReaches")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();
      if (existing.some((e) => e.source === args.source && e.slug === args.slug)) {
        return null;
      }
    }
    return await ctx.db.insert("checkoutReaches", {
      source: args.source,
      slug: args.slug,
      sessionId: args.sessionId,
      timestamp: Date.now(),
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

/**
 * Sla een funnel-stap op (publiek, geen auth vereist).
 * Gebruikt voor de afhaak-funnel op checkout en landingspagina's.
 * Ontdubbelt per sessie + categorie + pad + stap, zodat herladen/scrollen niet dubbel telt.
 */
export const trackFunnelStep = mutation({
  args: {
    category: v.string(), // "checkout" | "lp"
    step: v.string(),
    path: v.string(),
    sessionId: v.string(),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Skip uitgesloten IP-adressen
    if (args.ip) {
      const excluded = await ctx.db.query("analyticsExcludedIps").collect();
      if (excluded.some((e) => e.ip === args.ip)) return null;
    }
    // Ontdubbel: zelfde sessie + categorie + pad + stap telt maar één keer
    if (args.sessionId) {
      const existing = await ctx.db
        .query("funnelEvents")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();
      if (
        existing.some(
          (e) =>
            e.category === args.category &&
            e.path === args.path &&
            e.step === args.step
        )
      ) {
        return null;
      }
    }
    return await ctx.db.insert("funnelEvents", {
      category: args.category,
      step: args.step,
      path: args.path,
      sessionId: args.sessionId,
      timestamp: Date.now(),
      ip: args.ip,
    });
  },
});

/** Verwijder funnel-events van vóór een bepaald tijdstip (admin only). */
export const deleteFunnelEventsBefore = mutation({
  args: { adminToken: v.string(), before: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const old = await ctx.db
      .query("funnelEvents")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", args.before))
      .collect();
    for (const ev of old) {
      await ctx.db.delete(ev._id);
    }
    return old.length;
  },
});

/**
 * Haal de afhaak-funnel op voor het opgegeven tijdsbereik (admin only).
 * Telt unieke sessies per stap, per checkout-product en per landingspagina.
 */
export const getFunnelStats = query({
  args: {
    adminToken: v.string(),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const [rawEvents, excludedIps] = await Promise.all([
      ctx.db
        .query("funnelEvents")
        .withIndex("by_timestamp", (q) =>
          q.gte("timestamp", args.from).lte("timestamp", args.to)
        )
        .collect(),
      ctx.db.query("analyticsExcludedIps").collect(),
    ]);
    const excludedSet = new Set(excludedIps.map((e) => e.ip));
    const events = rawEvents.filter((e) => !e.ip || !excludedSet.has(e.ip));

    // Unieke sessies per (category|path|step)
    const sessionsByKey: Record<string, Set<string>> = {};
    for (const e of events) {
      const key = `${e.category}|${e.path}|${e.step}`;
      if (!sessionsByKey[key]) sessionsByKey[key] = new Set();
      sessionsByKey[key].add(e.sessionId);
    }
    const count = (category: string, path: string, step: string) =>
      sessionsByKey[`${category}|${path}|${step}`]?.size ?? 0;

    // Verzamel unieke paden per categorie
    const checkoutPaths = new Set<string>();
    const lpPaths = new Set<string>();
    for (const e of events) {
      if (e.category === "checkout") checkoutPaths.add(e.path);
      else if (e.category === "lp") lpPaths.add(e.path);
    }

    const checkout = [...checkoutPaths]
      .map((slug) => ({
        slug,
        reached: count("checkout", slug, "reached"),
        details: count("checkout", slug, "details"),
        termsClick: count("checkout", slug, "terms_click"),
        payClick: count("checkout", slug, "pay_click"),
        purchased: count("checkout", slug, "purchased"),
        // Scroll-diepte op de checkout (zelfde pad, category "checkout")
        scroll25: count("checkout", slug, "scroll_25"),
        scroll50: count("checkout", slug, "scroll_50"),
        scroll75: count("checkout", slug, "scroll_75"),
        scroll100: count("checkout", slug, "scroll_100"),
      }))
      .sort((a, b) => b.reached - a.reached);

    // Blok-diepte: hoe ver kwamen bezoekers, gemeten op de blokken van de pagina
    // (device-onafhankelijk). Elke pagina nummert zijn eigen blokken 1..N; het totaal
    // komt uit de `blokken_<N>`-events. Blok 1 is de noemer (iedereen die begon).
    const lp = [...lpPaths]
      .map((path) => {
        const prefix = `lp|${path}|blokken_`;
        let totaalBlokken = 0;
        for (const key of Object.keys(sessionsByKey)) {
          if (!key.startsWith(prefix)) continue;
          const n = parseInt(key.slice(prefix.length), 10);
          if (Number.isFinite(n)) totaalBlokken = Math.max(totaalBlokken, n);
        }
        const blokken = Array.from({ length: totaalBlokken }, (_, i) => ({
          index: i + 1,
          value: count("lp", path, `block_${i + 1}`),
        }));
        return { path, load: count("lp", path, "load"), totaalBlokken, blokken };
      })
      .sort((a, b) => (b.blokken[0]?.value ?? 0) - (a.blokken[0]?.value ?? 0));

    return { checkout, lp };
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
    // -- Besturingssystemen (iOS / Android / Windows / macOS / Linux / Overig) --
    const osCounts: Record<string, number> = {};
    for (const view of allViews) {
      if (view.device === "mobile") mobile++;
      else if (view.device === "tablet") tablet++;
      else desktop++;
      const os = view.os || "Onbekend";
      osCounts[os] = (osCounts[os] ?? 0) + 1;
    }
    const besturingssystemen = Object.entries(osCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([os, count]) => ({ os, count }));

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

    // -- Bounce: sessies die maar 1 pagina bekeken (landen en direct weg) --
    const sessionViewCounts: Record<string, number> = {};
    for (const view of allViews) {
      sessionViewCounts[view.sessionId] = (sessionViewCounts[view.sessionId] ?? 0) + 1;
    }
    const singlePageSessions = Object.values(sessionViewCounts).filter((c) => c === 1).length;
    const bounceRate = allSessionIds.size > 0 ? Math.round((singlePageSessions / allSessionIds.size) * 100) : 0;

    const totals = {
      views: allViews.length,
      unique: allSessionIds.size,
      avgDuration,
      returningVisitors,
      singlePageSessions,
      bounceRate,
    };

    // -- Dagelijkse conversies (userSubscriptions + nietAlleenProfiles) --
    const [allSubs, excludedEmails, allNAProfiles] = await Promise.all([
      ctx.db.query("userSubscriptions").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
    ]);
    const excludedEmailSet = new Set(excludedEmails.map((e) => e.email.toLowerCase()));
    const subsInRange = allSubs.filter(
      (s) =>
        s.startedAt >= args.from &&
        s.startedAt <= args.to &&
        (!s.email || !excludedEmailSet.has(s.email.toLowerCase()))
    );
    // Niet Alleen: gebruik profiles als gezaghebbende bron (zoals revenue-pagina)
    const naInRange = allNAProfiles.filter(
      (p) =>
        p.createdAt >= args.from &&
        p.createdAt <= args.to &&
        !excludedEmailSet.has(p.email.toLowerCase())
    );
    // Dedupliceer: emails die al via naInRange geteld worden, niet nogmaals als paid tellen
    const naEmails = new Set(naInRange.map((p) => p.email.toLowerCase()));

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
        // Niet tellen als het een Niet Alleen aankoop is (die loopt via naInRange)
        if (!sub.email || !naEmails.has(sub.email.toLowerCase())) {
          convMap[date].paid++;
        }
      }
    }
    // Niet Alleen conversies via profiles (authoritative)
    for (const na of naInRange) {
      const date = new Date(na.createdAt).toISOString().slice(0, 10);
      if (!convMap[date])
        convMap[date] = { freeAccounts: 0, paid: 0, nietAlleen: 0 };
      convMap[date].nietAlleen++;
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
        if (host.includes("google") || host.includes("syndicatedsearch")) return "Google";
        if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
        if (host.includes("instagram")) return "Instagram";
        if (host.includes("bing")) return "Bing";
        if (host.includes("pinterest")) return "Pinterest";
        if (host.includes("youtube")) return "YouTube";
        if (host.includes("talktobenji") || host.includes("vercel.app")) return "Direct";
        if (host.includes("niet-alleen")) return "niet-alleen.nl";
        // Alles wat niet herkend wordt negeren (spambots, scrapers)
        return "__overig__";
      } catch {
        return "Direct";
      }
    }

    const sourceMap: Record<string, number> = {};
    for (const view of allViews) {
      const source = parseSource(view.referrer);
      if (source === "__overig__") continue;
      sourceMap[source] = (sourceMap[source] ?? 0) + 1;
    }
    const totalViewsForSource = Object.values(sourceMap).reduce((a, b) => a + b, 0) || 1;
    const bronnen = Object.entries(sourceMap)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({ source, count, pct: Math.round((count / totalViewsForSource) * 100) }));

    // -- Conversie ratio: alleen echte aankopen (betaald) + Niet Alleen profiles.
    // Gratis accounts tellen NIET als conversie (dat zijn aanmeldingen/leads). --
    const geteldConversies =
      subsInRange.filter((s) =>
        (s.subscriptionType === "uitgebreid" ||
          s.subscriptionType === "alles_in_1") &&
        (!s.email || !naEmails.has(s.email.toLowerCase()))
      ).length + naInRange.length;
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
    // Niet Alleen omzet: voeg toe voor profielen zonder bijbehorende userSubscription
    for (const na of naInRange) {
      const heeftSub = betaaldeSubs.some(
        (s) => s.email?.toLowerCase() === na.email.toLowerCase()
      );
      if (!heeftSub) {
        // Zoek pricePaid in allSubs (ook buiten datumbereik)
        const sub = allSubs.find(
          (s) => s.email?.toLowerCase() === na.email.toLowerCase() && (s as any).pricePaid
        );
        if (sub) omzet += (sub as any).pricePaid;
      }
    }
    omzet = Math.round(omzet * 100) / 100;

    // -- Koopknop klikken --
    const allClicks = await ctx.db
      .query("buttonClicks")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", args.from).lte("timestamp", args.to))
      .collect();
    const filteredClicks = allClicks.filter((c) => !c.ip || !excludedSet.has(c.ip));
    const clicksByPage: Record<string, number> = {};
    for (const click of filteredClicks) {
      clicksByPage[click.path] = (clicksByPage[click.path] ?? 0) + 1;
    }
    const koopknopKlikken = {
      total: filteredClicks.length,
      byPage: Object.entries(clicksByPage)
        .sort(([, a], [, b]) => b - a)
        .map(([path, count]) => ({ path, count })),
    };

    return {
      dailyViews,
      dailyConversions,
      topPages,
      devices: { mobile, tablet, desktop },
      besturingssystemen,
      totals,
      hourlyViews,
      bronnen,
      conversieRatio,
      allSubTypes,
      omzet,
      omzetGeschat,
      topPageDurations,
      koopknopKlikken,
    };
  },
});

/** Ad LP statistieken: bezoeken, verblijfsduur en klikken per landingspagina met trackAds=true (admin only). */
export const getAdLpStats = query({
  args: { adminToken: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    // Haal alle landingspagina's op die als Ad LP zijn gemarkeerd
    const allPages = await ctx.db.query("landingPages").collect();
    const adPages = allPages.filter((p) => (p as any).trackAds === true);

    const [excludedIps, rawViews, rawClicks, reaches] = await Promise.all([
      ctx.db.query("analyticsExcludedIps").collect(),
      ctx.db
        .query("pageViews")
        .withIndex("by_timestamp", (q) => q.gte("timestamp", args.from).lte("timestamp", args.to))
        .collect(),
      ctx.db
        .query("buttonClicks")
        .withIndex("by_timestamp", (q) => q.gte("timestamp", args.from).lte("timestamp", args.to))
        .collect(),
      ctx.db
        .query("checkoutReaches")
        .withIndex("by_timestamp", (q) => q.gte("timestamp", args.from).lte("timestamp", args.to))
        .collect(),
    ]);

    const excludedSet = new Set(excludedIps.map((e) => e.ip));
    const views = rawViews.filter((v) => !v.ip || !excludedSet.has(v.ip));
    const clicks = rawClicks.filter((c) => !c.ip || !excludedSet.has(c.ip));

    // Bouw lijst van te volgen pagina's: altijd homepagina + alle Ad LPs
    const trackedPages: { slug: string; path: string; title: string }[] = [
      { slug: "home", path: "/", title: "Homepagina" },
      ...adPages.map((page) => ({
        slug: page.slug,
        path: `/lp/${page.slug}`,
        title: (page as any).pageTitle ?? page.slug,
      })),
    ];

    // Ontdubbel op pad: duplicaat-records met dezelfde slug zouden anders
    // meerdere identieke rijen geven (zelfde pad = zelfde aantallen).
    const uniquePages = trackedPages.filter(
      (p, i, arr) => arr.findIndex((x) => x.path === p.path) === i
    );

    return uniquePages.map(({ slug, path, title }) => {
      const pageViews = views.filter((v) => v.path === path);
      const pageClicks = clicks.filter((c) => c.path === path);
      const pageReaches = reaches.filter((r) => r.source === path);

      const sessions = new Set(pageViews.map((v) => v.sessionId));
      const durations = pageViews
        .map((v) => v.duration)
        .filter((d): d is number => d !== undefined && d > 0 && d < 3600);
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

      return {
        slug,
        path,
        title,
        visits: pageViews.length,
        unique: sessions.size,
        avgDuration,
        clicks: pageClicks.length,
        checkoutReaches: pageReaches.length,
      };
    });
  },
});

/**
 * Verliestype-verdeling (admin only): welk type verlies wordt het meest gekozen,
 * op basis van Niet Alleen-aankopen (nietAlleenProfiles) in de gekozen periode.
 */
export const getVerliesTypeStats = query({
  args: { adminToken: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const [allNAProfiles, excludedEmails, verliesTypen] = await Promise.all([
      ctx.db.query("nietAlleenProfiles").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("verliesTypen").collect(),
    ]);
    const excludedEmailSet = new Set(excludedEmails.map((e) => e.email.toLowerCase()));

    // Zelfde filter als de conversie-telling: profielen in periode, test-emails uitgesloten.
    const naInRange = allNAProfiles.filter(
      (p) =>
        p.createdAt >= args.from &&
        p.createdAt <= args.to &&
        !excludedEmailSet.has(p.email.toLowerCase())
    );

    const infoByCode = new Map(
      verliesTypen.map((t) => [t.code, { naam: t.naam, emoji: (t as any).keuzePaginaEmoji as string | undefined }])
    );

    const counts: Record<string, number> = {};
    for (const p of naInRange) {
      const code = p.verliesType && p.verliesType.trim() ? p.verliesType.trim() : "onbekend";
      counts[code] = (counts[code] ?? 0) + 1;
    }

    const total = naInRange.length;
    const rows = Object.entries(counts)
      .map(([code, count]) => {
        const info = infoByCode.get(code);
        return {
          code,
          label: info?.naam ?? (code === "onbekend" ? "Type nog niet gekozen" : code),
          emoji: info?.emoji ?? "",
          count,
          pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  },
});

/** Feature-gebruik statistieken (admin only). */
export const getFeatureStats = query({
  args: { adminToken: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const inRange = (ts: number) => ts >= args.from && ts <= args.to;

    const [notes, emotions, checkIns, goals, memories, houvasteProfielen, houvastBrieven, users, preferences, excludedEmailRecords] = await Promise.all([
      ctx.db.query("notes").collect(),
      ctx.db.query("emotionEntries").collect(),
      ctx.db.query("checkInEntries").collect(),
      ctx.db.query("goals").collect(),
      ctx.db.query("memories").collect(),
      ctx.db.query("houvasteProfielen").collect(),
      ctx.db.query("houvastBrieven").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("userPreferences").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
    ]);

    const excludedEmailSet = new Set(excludedEmailRecords.map((e: any) => e.email.toLowerCase()));

    // Gebruikers wiens email is uitgesloten
    const excludedUserIds = new Set(
      users.filter((u: any) => u.email && excludedEmailSet.has(u.email.toLowerCase())).map((u: any) => u._id)
    );

    const userEmailsLc = new Set(users.map((u: any) => (u.email ?? "").toLowerCase()));

    // Houvast funnel — combineert de oude aanmeldflow (houvasteProfielen) en de
    // nieuwe Even Houvast-flow (houvastBrieven: e-mail aan het eind). Uniek per e-mail.
    const houvastAanvraagMap = new Map<string, { email: string; name: string | null; createdAt: number }>();
    for (const h of houvasteProfielen) {
      const lc = (h.email ?? "").toLowerCase();
      if (!lc || excludedEmailSet.has(lc)) continue;
      const prev = houvastAanvraagMap.get(lc);
      if (!prev || h.createdAt < prev.createdAt) houvastAanvraagMap.set(lc, { email: h.email, name: h.name ?? null, createdAt: h.createdAt });
    }
    for (const b of houvastBrieven) {
      const lc = (b.email ?? "").toLowerCase();
      if (!lc || excludedEmailSet.has(lc)) continue;
      const prev = houvastAanvraagMap.get(lc);
      if (!prev) houvastAanvraagMap.set(lc, { email: b.email, name: null, createdAt: b.sentAt });
      else if (b.sentAt < prev.createdAt) prev.createdAt = b.sentAt;
    }
    const houvasteNietUitgesloten = Array.from(houvastAanvraagMap.values());
    const houvasteInPeriod = houvasteNietUitgesloten.filter((h: any) => inRange(h.createdAt));
    const houvasteConverted = houvasteInPeriod.filter((h: any) => userEmailsLc.has(h.email.toLowerCase()));

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
export const getRecentHouvasteSignups = query({
  args: { adminToken: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const daysBack = args.days ?? 7;
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [profielen, brieven] = await Promise.all([
      ctx.db.query("houvasteProfielen").collect(),
      ctx.db.query("houvastBrieven").collect(),
    ]);
    // Combineer oude aanmeldflow + nieuwe Even Houvast-flow, uniek per e-mail.
    const map = new Map<string, { name: string | null; email: string; createdAt: number }>();
    for (const p of profielen) {
      const lc = (p.email ?? "").toLowerCase();
      if (!lc) continue;
      const prev = map.get(lc);
      if (!prev || p.createdAt > prev.createdAt) map.set(lc, { name: p.name ?? null, email: p.email, createdAt: p.createdAt });
    }
    for (const b of brieven) {
      const lc = (b.email ?? "").toLowerCase();
      if (!lc) continue;
      const prev = map.get(lc);
      if (!prev || b.sentAt > prev.createdAt) map.set(lc, { name: prev?.name ?? null, email: b.email, createdAt: b.sentAt });
    }
    const recent = Array.from(map.values())
      .filter((p) => p.createdAt >= since)
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      total: recent.length,
      today: recent.filter((p) => p.createdAt >= todayStart.getTime()).length,
      profielen: recent.slice(0, 20).map((p) => ({
        name: p.name ?? null,
        email: p.email,
        createdAt: p.createdAt,
      })),
    };
  },
});

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

/** Omzet en aankopen overzicht — gekoppeld aan checkoutProducts */
export const getRevenueOverview = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const [products, allSubs, excludedEmails, naProfiles] = await Promise.all([
      ctx.db.query("checkoutProducts").collect(),
      ctx.db.query("userSubscriptions").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
    ]);

    const excludedSet = new Set(excludedEmails.map((e) => e.email.toLowerCase()));

    // Alleen echte Stripe-betalingen (pricePaid > 0), geen handmatig ingestelde
    const echteAankopen = allSubs.filter(
      (s) => (s.pricePaid ?? 0) > 0 && (!s.email || !excludedSet.has(s.email.toLowerCase()))
    );
    const echteNA = naProfiles.filter(
      (p) => !excludedSet.has(p.email.toLowerCase())
    );

    // Bouw per product een lookup: subscriptionType → { prijs, verkopen[] }
    // niet_alleen loopt via naProfiles, de rest via userSubscriptions
    const maandNamen = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const now = new Date();
    const jaarStart = new Date(now.getFullYear(), 0, 1).getTime();
    const maandStart0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Verzamel alle individuele verkopen (voor totalen)
    type Verkoop = { timestamp: number; prijs: number; productSlug: string };
    const alleVerkopen: Verkoop[] = [];

    // Niet Alleen kan meerdere producten hebben (bijv. algemeen + huisdier). Koppel
    // elk profiel aan ÉÉN product op basis van verliesType, anders telt elk profiel
    // dubbel mee voor elk niet_alleen-product.
    const naProducts = products.filter((p) => p.subscriptionType === "niet_alleen");
    const naByType = new Map<string, typeof naProducts[number]>();
    for (const p of naProducts) if (p.verliesType) naByType.set(p.verliesType, p);
    const naFallback = naProducts.find((p) => !p.verliesType) ?? naProducts[0];

    for (const na of echteNA) {
      const p = (na.verliesType && naByType.get(na.verliesType)) || naFallback;
      if (!p) continue;
      alleVerkopen.push({ timestamp: na.createdAt, prijs: p.priceInCents / 100, productSlug: p.slug });
    }

    for (const p of products) {
      if (p.subscriptionType === "niet_alleen") continue;
      const prijs = p.priceInCents / 100;
      for (const s of echteAankopen) {
        if (s.subscriptionType === p.subscriptionType) {
          alleVerkopen.push({
            timestamp: s.startedAt ?? s._creationTime,
            prijs: s.pricePaid ?? prijs,
            productSlug: p.slug,
          });
        }
      }
    }

    // Maand-aggregatie: vast startpunt maart 2026 t/m huidige maand
    const START_JAAR = 2026;
    const START_MAAND = 2; // 0-indexed = maart
    const maanden = [];
    const startD = new Date(START_JAAR, START_MAAND, 1);
    const aantalMaanden = (now.getFullYear() - START_JAAR) * 12 + (now.getMonth() - START_MAAND) + 1;
    for (let i = 0; i < aantalMaanden; i++) {
      const d = new Date(startD.getFullYear(), startD.getMonth() + i, 1);
      const maandKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const maandStart = d.getTime();
      const maandEind = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

      const maandVerkopen = alleVerkopen.filter(
        (v) => v.timestamp >= maandStart && v.timestamp < maandEind
      );

      // Per product: aantal in deze maand
      const perProduct: Record<string, number> = {};
      for (const p of products) {
        perProduct[p.slug] = maandVerkopen.filter((v) => v.productSlug === p.slug).length;
      }

      maanden.push({
        maand: maandKey,
        label: `${maandNamen[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
        aankopen: maandVerkopen.length,
        omzet: Math.round(maandVerkopen.reduce((s, v) => s + v.prijs, 0) * 100) / 100,
        perProduct,
      });
    }

    const programmaStart = startD.getTime();
    const ytd = alleVerkopen.filter((v) => v.timestamp >= jaarStart);
    const mtd = alleVerkopen.filter((v) => v.timestamp >= maandStart0);
    const totaalAlles = alleVerkopen.filter((v) => v.timestamp >= programmaStart).reduce((s, v) => s + v.prijs, 0);

    return {
      products: products.map((p) => ({
        slug: p.slug,
        name: p.kortNaam ?? p.name, // Gebruik korte naam als die ingesteld is
        subscriptionType: p.subscriptionType,
        priceInCents: p.priceInCents,
      })),
      maanden,
      totaalYTD: Math.round(ytd.reduce((s, v) => s + v.prijs, 0) * 100) / 100,
      aankopenYTD: ytd.length,
      totaalMTD: Math.round(mtd.reduce((s, v) => s + v.prijs, 0) * 100) / 100,
      aankopenMTD: mtd.length,
      gemiddeldeOrderwaarde: alleVerkopen.length > 0
        ? Math.round((totaalAlles / alleVerkopen.length) * 100) / 100
        : 0,
      totaalAllesTijd: Math.round(totaalAlles * 100) / 100,
    };
  },
});

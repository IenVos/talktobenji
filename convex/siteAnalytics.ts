/**
 * Website analytics – paginabezoeken bijhouden en statistieken ophalen.
 */
import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
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
    // Waar de bezoeker vandaan komt, bv. "eh-mail" (link uit de opvolgreeks).
    // Ontbreekt = koud verkeer (advertentie, zoekmachine, direct).
    bron: v.optional(v.string()),
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
      bron: args.bron,
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
 * Verwijder funnel-events van bepaalde stappen (admin only). Bedoeld om eigen
 * testinvullingen op te schonen, bv. checkout "details"/"pay_click". Optioneel te
 * beperken tot één path. Geeft het aantal verwijderde events terug.
 */
export const deleteFunnelEventsByStep = mutation({
  args: {
    adminToken: v.string(),
    category: v.string(),
    steps: v.array(v.string()),
    path: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const all = await ctx.db.query("funnelEvents").collect();
    const stepSet = new Set(args.steps);
    const toDelete = all.filter(
      (e) =>
        e.category === args.category &&
        stepSet.has(e.step) &&
        (args.path === undefined || e.path === args.path)
    );
    for (const e of toDelete) await ctx.db.delete(e._id);
    return { deleted: toDelete.length };
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

    // Warm of koud, want die twee groepen gedragen zich totaal anders.
    //   koud = kent ons pas net: kwam vandaag binnen (bv. via Meta naar Even
    //          Houvast) en klikte in datzelfde bezoek door naar de checkout.
    //   warm = kende ons al: komt terug uit een mail (bron=eh-mail), of was hier
    //          eerder al eens (eerste bezoek meer dan 2 uur geleden).
    // De terugkeer-check kijkt naar het eerste pageview van die sessie, dus hij
    // werkt ook voor bezoekers van vóór we het bron-label meestuurden.
    const checkoutSessies = new Set<string>();
    for (const e of events) {
      if (e.category === "checkout" && e.step === "reached") checkoutSessies.add(e.sessionId);
    }

    const warmeSessies = new Set<string>();
    for (const e of events) {
      if (e.bron && e.bron.startsWith("eh")) warmeSessies.add(e.sessionId);
    }
    for (const sessionId of checkoutSessies) {
      if (warmeSessies.has(sessionId)) continue;
      const eersteBezoek = await ctx.db
        .query("pageViews")
        .withIndex("by_session_timestamp", (q) => q.eq("sessionId", sessionId))
        .first();
      const checkoutMoment = events.find(
        (e) => e.sessionId === sessionId && e.category === "checkout" && e.step === "reached"
      )!.timestamp;
      if (eersteBezoek && checkoutMoment - eersteBezoek.timestamp > 2 * 60 * 60 * 1000) {
        warmeSessies.add(sessionId);
      }
    }
    const countPerBron = (path: string, step: string, warm: boolean) => {
      const sessies = sessionsByKey[`checkout|${path}|${step}`];
      if (!sessies) return 0;
      let n = 0;
      for (const s of sessies) if (warmeSessies.has(s) === warm) n++;
      return n;
    };
    const funnelVoorBron = (slug: string, warm: boolean) => ({
      reached: countPerBron(slug, "reached", warm),
      details: countPerBron(slug, "details", warm),
      payClick: countPerBron(slug, "pay_click", warm),
      purchased: countPerBron(slug, "purchased", warm),
    });

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
        // Zelfde funnel, maar gesplitst naar herkomst.
        warm: funnelVoorBron(slug, true),
        koud: funnelVoorBron(slug, false),
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

/**
 * De warme Even Houvast-reis, los van het koude verkeer: brief/mail -> carrousel
 * (tour) -> brugpagina -> EH-checkout. Telt unieke sessies per stap, en laat per
 * pagina zien hoeveel bezoekers uit een mail kwamen (bron begint met "eh").
 */
export const getEhFunnelStats = query({
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

    // Unieke sessies per (category|path|step), plus de sessies die uit een mail
    // kwamen (bron begint met "eh"): dat is het warme verkeer.
    const sessionsByKey: Record<string, Set<string>> = {};
    const mailSessies = new Set<string>();
    for (const e of events) {
      const key = `${e.category}|${e.path}|${e.step}`;
      (sessionsByKey[key] ??= new Set()).add(e.sessionId);
      if (e.bron && e.bron.startsWith("eh")) mailSessies.add(e.sessionId);
    }
    const setOf = (category: string, path: string, step: string) =>
      sessionsByKey[`${category}|${path}|${step}`] ?? new Set<string>();
    const count = (category: string, path: string, step: string) =>
      setOf(category, path, step).size;
    // Hoeveel van de sessies die deze stap haalden, kwamen uit een mail.
    const uitMail = (category: string, path: string, step: string) => {
      let n = 0;
      for (const s of setOf(category, path, step)) if (mailSessies.has(s)) n++;
      return n;
    };

    // Carrousel: verzamel alle "stap_<n>"-schermen en tel per scherm.
    const tourPath = "/niet-alleen/tour";
    const tourPrefix = `tour|${tourPath}|stap_`;
    let maxStap = 0;
    for (const key of Object.keys(sessionsByKey)) {
      if (!key.startsWith(tourPrefix)) continue;
      const n = parseInt(key.slice(tourPrefix.length), 10);
      if (Number.isFinite(n)) maxStap = Math.max(maxStap, n);
    }
    const tourStappen = Array.from({ length: maxStap + 1 }, (_, i) => ({
      i,
      count: count("tour", tourPath, `stap_${i}`),
    }));

    // EH-checkout: alleen de even-houvast-betaalpagina's.
    const proefPath = "/niet-alleen/proef";
    const brugPath = "/niet-alleen/waarom";
    const checkoutSlugs = new Set<string>();
    for (const e of events) {
      if (e.category === "checkout" && e.path.startsWith("even-houvast")) checkoutSlugs.add(e.path);
    }
    const ehCheckout = [...checkoutSlugs]
      .map((slug) => ({
        slug,
        reached: count("checkout", slug, "reached"),
        details: count("checkout", slug, "details"),
        payClick: count("checkout", slug, "pay_click"),
        purchased: count("checkout", slug, "purchased"),
        reachedFromMail: uitMail("checkout", slug, "reached"),
      }))
      .sort((a, b) => b.reached - a.reached);

    return {
      taster: {
        reached: count("taster", proefPath, "reached"),
        reachedFromMail: uitMail("taster", proefPath, "reached"),
        dag1: count("taster", proefPath, "dag_1"),
        dag12: count("taster", proefPath, "dag_12"),
        dag13: count("taster", proefPath, "dag_13"),
        brugClick: count("taster", proefPath, "brug_click"),
      },
      tour: {
        stappen: tourStappen,
        slot: count("tour", tourPath, "slot"),
        brugClick: count("tour", tourPath, "brug_click"),
      },
      brug: {
        reached: count("brug", brugPath, "reached"),
        reachedFromMail: uitMail("brug", brugPath, "reached"),
        checkoutClick: count("brug", brugPath, "checkout_click"),
      },
      ehCheckout,
    };
  },
});

/**
 * Benji-proef (Even Houvast): hoeveel één-klik-links zijn verstuurd, hoeveel mensen
 * hebben geklikt (proef geactiveerd), hoeveel gebruiken Benji, en hoeveel kochten
 * daarna Niet Alleen (met 30 dagen Benji). Bron: benjiStartTokens + userSubscriptions
 * (bron "eh") + chatSessions.
 */
export const getBenjiProefStats = query({
  args: { adminToken: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const nu = Date.now();

    // Testadressen (bijv. eigen testmails/klikken) tellen we niet mee, anders
    // blazen ze de proef-cijfers op.
    const excluded = await ctx.db.query("analyticsExcludedEmails").collect();
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const isTest = (email?: string | null) => !!email && testSet.has(email.toLowerCase());

    // Tokens = Benji-mails met een persoonlijke link. usedAt = geklikt/geactiveerd.
    const tokens = await ctx.db.query("benjiStartTokens").collect();
    const inPeriode = tokens.filter(
      (t) => t.createdAt >= args.from && t.createdAt <= args.to && !isTest(t.email)
    );
    const verstuurd = inPeriode.length;
    const geactiveerd = inPeriode.filter((t) => t.usedAt).length;
    // Ontdubbeld op e-mail: een token verloopt na 7 dagen, dus dezelfde persoon kan
    // over meerdere golven meerdere token-rijen hebben. Voor "hoeveel mensen" en een
    // eerlijke activatieratio tellen we per uniek adres.
    const persUniek = new Set<string>();
    const persGeactiveerd = new Set<string>();
    const klikTijd = new Map<string, number>(); // e-mail -> eerste kliktijd
    for (const t of inPeriode) {
      const e = (t.email || "").toLowerCase();
      if (!e) continue;
      persUniek.add(e);
      if (t.usedAt) {
        persGeactiveerd.add(e);
        const prev = klikTijd.get(e);
        if (prev === undefined || t.usedAt < prev) klikTijd.set(e, t.usedAt);
      }
    }
    const verstuurdUniek = persUniek.size;
    const geactiveerdUniek = persGeactiveerd.size;

    // Klik-funnel: de hoeveelste mail lokte de klik uit? Per klikker tellen we het
    // aantal Benji-verzendingen naar dat adres vóór de kliktijd (uit benjiLinkVerzonden,
    // dat vanaf 31 juli 2026 loggt). Klikkers zonder gelogde verzending (van vóór die
    // datum) vallen in "onbekend" en zeggen dus niets over de tik.
    const verzendingen = await ctx.db.query("benjiLinkVerzonden").collect();
    const verzendPerEmail = new Map<string, number[]>();
    for (const v of verzendingen) {
      const e = (v.email || "").toLowerCase();
      if (!e || isTest(e)) continue;
      const lijst = verzendPerEmail.get(e) ?? [];
      lijst.push(v.verstuurdOp);
      verzendPerEmail.set(e, lijst);
    }
    let klikNa1 = 0, klikNa2 = 0, klikNa3plus = 0, klikOnbekend = 0, somTikken = 0, metTik = 0;
    for (const e of persGeactiveerd) {
      const kt = klikTijd.get(e);
      const tikken = (verzendPerEmail.get(e) ?? []).filter((op) => kt === undefined || op <= kt).length;
      if (tikken <= 0) { klikOnbekend++; continue; }
      somTikken += tikken;
      metTik++;
      if (tikken === 1) klikNa1++;
      else if (tikken === 2) klikNa2++;
      else klikNa3plus++;
    }
    const klikFunnel = {
      na1: klikNa1,
      na2: klikNa2,
      na3plus: klikNa3plus,
      onbekend: klikOnbekend,
      gemMails: metTik > 0 ? Math.round((somTikken / metTik) * 10) / 10 : null,
    };

    // EH-proeven = toegang met bron "eh" (zonder testadressen).
    const alleSubs = await ctx.db.query("userSubscriptions").collect();
    const ehSubs = alleSubs.filter((s) => s.bron === "eh" && !isTest(s.email));
    const kochtNA = ehSubs.filter(
      (s) => s.subscriptionType === "niet_alleen" || !!s.benjiExpiresAt
    ).length;
    const actieveProef = ehSubs.filter(
      (s) => s.subscriptionType === "trial" && s.expiresAt && s.expiresAt > nu
    ).length;

    // Gebruik: gesprekken van de geactiveerde leads.
    let totaalGesprekken = 0;
    let metGesprek = 0;
    let kwamenTerug = 0; // proeven met 2 of meer gesprekken
    for (const s of ehSubs) {
      const sessies = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", s.userId))
        .collect();
      if (sessies.length > 0) metGesprek++;
      if (sessies.length >= 2) kwamenTerug++;
      totaalGesprekken += sessies.length;
    }

    return {
      verstuurd,
      verstuurdUniek,
      geactiveerd,
      geactiveerdUniek,
      klikFunnel,
      // Ratio op unieke mensen (eerlijker dan op token-rijen).
      activatieRatio: verstuurdUniek > 0 ? Math.round((geactiveerdUniek / verstuurdUniek) * 1000) / 10 : 0,
      ehProeven: ehSubs.length,
      actieveProef,
      metGesprek,
      kwamenTerug,
      totaalGesprekken,
      gemGesprekken: ehSubs.length > 0 ? Math.round((totaalGesprekken / ehSubs.length) * 10) / 10 : 0,
      kochtNA,
    };
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
    const [allSubs, excludedEmails, allNAProfiles, giftCodes] = await Promise.all([
      ctx.db.query("userSubscriptions").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
      ctx.db.query("giftCodes").collect(),
    ]);
    const excludedEmailSet = new Set(excludedEmails.map((e) => e.email.toLowerCase()));
    // Een verzilverde cadeaubon is geen nieuwe conversie: het profiel van de ontvanger
    // hoort niet als verkoop te tellen (de omzet zit al bij de aanschaf van de bon).
    const verzilverdeGiftEmails = new Set(
      giftCodes
        .filter((g) => g.status === "redeemed" && g.redeemedByEmail)
        .map((g) => g.redeemedByEmail!.toLowerCase())
    );
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
        !excludedEmailSet.has(p.email.toLowerCase()) &&
        !verzilverdeGiftEmails.has(p.email.toLowerCase())
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
    // Cadeaubonnen: omzet bij aanschaf (pricePaid > 0), binnen de periode. Verzilveren
    // telt niet mee (dat profiel is hierboven al uit naInRange gehouden).
    for (const g of giftCodes) {
      if ((g.pricePaid ?? 0) <= 0) continue;
      if (g.createdAt < args.from || g.createdAt > args.to) continue;
      if (g.giverEmail && excludedEmailSet.has(g.giverEmail.toLowerCase())) continue;
      omzet += g.pricePaid!;
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

    const [notes, emotions, checkIns, goals, memories, houvasteProfielen, houvastBrieven, users, preferences, excludedEmailRecords, nietAlleenProfielen] = await Promise.all([
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
      ctx.db.query("nietAlleenProfiles").collect(),
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

    // Niet Alleen-aankoop = een nietAlleenProfiles-record op dat e-mailadres.
    // Dit is de echte eindconversie van de Even Houvast-trechter.
    const nietAlleenEmailsLc = new Set(
      nietAlleenProfielen
        .map((p: any) => (p.email ?? "").toLowerCase())
        .filter((e: string) => e && !excludedEmailSet.has(e))
    );
    const houvasteNaarNietAlleen = houvasteInPeriod.filter((h: any) => nietAlleenEmailsLc.has(h.email.toLowerCase()));

    // Feature gebruik in periode — gebruik _creationTime als fallback als createdAt ontbreekt
    const ts = (item: any) => item.createdAt ?? item._creationTime ?? 0;

    const convertedEmails = new Set(houvasteConverted.map((h: any) => h.email));
    const nietAlleenEmailsExact = new Set(houvasteNaarNietAlleen.map((h: any) => h.email));

    return {
      houvast: {
        total: houvasteInPeriod.length,
        converted: houvasteConverted.length,
        nietAlleen: houvasteNaarNietAlleen.length,
        allTime: houvasteNietUitgesloten.length,
        list: houvasteNietUitgesloten
          .sort((a: any, b: any) => b.createdAt - a.createdAt)
          .map((h: any) => ({
            email: h.email,
            name: h.name ?? null,
            createdAt: h.createdAt,
            heeftAccount: convertedEmails.has(h.email),
            heeftNietAlleen: nietAlleenEmailsExact.has(h.email),
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
  args: { adminToken: v.string(), days: v.optional(v.number()), from: v.optional(v.number()), to: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Periode: gebruik from/to als die meekomen (volgt de datumkiezer), anders
    // een terugval op de laatste `days` dagen. `to` standaard "nu".
    const since = args.from ?? (Date.now() - (args.days ?? 7) * 24 * 60 * 60 * 1000);
    const until = args.to ?? Date.now();
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
      .filter((p) => p.createdAt >= since && p.createdAt <= until)
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

/**
 * Totale lijst in één oogopslag. Alle unieke e-mailadressen die we hebben, over alle
 * bronnen heen ontdubbeld, plus de afmeldingen (nu vooral relevant door de ML-import).
 * De bronnen overlappen; "mailbaar" = de unieke unie minus afgemelde en testadressen.
 */
async function berekenLijstOverzicht(ctx: any, from?: number, to?: number) {
    const [profielen, brieven, funnelLeads, naProfielen, optins, groepLeden, afmeldingen, excluded] =
      await Promise.all([
        ctx.db.query("houvasteProfielen").collect(),
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("funnelLeads").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("nieuwsbriefOptins").collect(),
        ctx.db.query("mailGroepLeden").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
      ]);
    const norm = (e?: string | null) => (e || "").trim().toLowerCase();
    const setVan = (rows: any[]) => {
      const s = new Set<string>();
      for (const r of rows) { const e = norm(r.email); if (e) s.add(e); }
      return s;
    };
    const ehLeads = setVan(profielen);
    for (const e of setVan(brieven)) ehLeads.add(e); // oude + nieuwe EH-flow samen
    const evergreen = setVan(funnelLeads);
    const na = setVan(naProfielen);
    const nieuwsbrief = setVan(optins);
    const groepen = setVan(groepLeden);
    const afgemeld = setVan(afmeldingen);
    const test = setVan(excluded);

    // Evergreen-instroom uitsplitsen per bron.
    let evML = 0, evEH = 0, evOverig = 0;
    for (const l of funnelLeads) {
      if (l.bron === "losse-mail") evML++;
      else if (l.bron === "even-houvast") evEH++;
      else evOverig++;
    }

    const unie = new Set<string>();
    for (const s of [ehLeads, evergreen, na, nieuwsbrief, groepen]) for (const e of s) unie.add(e);
    let mailbaar = 0;
    for (const e of unie) if (!afgemeld.has(e) && !test.has(e)) mailbaar++;

    const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const afgemeldLaatste7 = afmeldingen.filter((a: any) => (a.createdAt ?? 0) >= week).length;

    // Groei in de gekozen periode: nieuwe acquisitie-leads (Even Houvast-aanvragen +
    // nieuwsbrief), ontdubbeld op eerste keer gezien, uitgesplitst naar herkomst.
    // Ads = Meta/Facebook/Instagram in de bron-regel; de rest met een bron = website;
    // zonder bron = onbekend. De ML-leads hebben geen acquisitie-bron en tellen dus
    // niet mee: de groei toont puur de echte instroom via ads/website.
    // Ad-herkenning zit in de landings-URL (Meta stript de referrer): utm_medium=paid,
    // utm_source=facebook/instagram, of fbclid/gclid. De bron-tekst bevat de campagne-
    // naam, geen kanaal, dus die is als fallback minder betrouwbaar.
    const isAds = (bron?: string, bronUrl?: string) => {
      const u = (bronUrl || "").toLowerCase();
      if (/fbclid|gclid/.test(u)) return true;
      if (/utm_medium=(paid|cpc|ppc|ads|paid_social)/.test(u)) return true;
      if (/utm_source=(facebook|instagram|meta|\bfb\b|\big\b|adwords|google)/.test(u)) return true;
      return !!bron && /meta|facebook|instagram/i.test(bron);
    };
    const eersteZien = new Map<string, { at: number; bron?: string; bronUrl?: string }>();
    const zetEerste = (email?: string | null, at?: number, bron?: string, bronUrl?: string) => {
      const e = norm(email);
      if (!e || typeof at !== "number") return;
      const prev = eersteZien.get(e);
      if (!prev || at < prev.at) eersteZien.set(e, { at, bron: bron ?? prev?.bron, bronUrl: bronUrl ?? prev?.bronUrl });
    };
    for (const p of profielen) zetEerste(p.email, p.createdAt, p.bron, p.bronUrl);
    for (const b of brieven) zetEerste(b.email, b.sentAt, b.bron, b.bronUrl);
    for (const o of optins) zetEerste(o.email, o.createdAt, o.bron, undefined);

    let groeiAds = 0, groeiWebsite = 0, groeiOnbekend = 0;
    const heeftPeriode = typeof from === "number" && typeof to === "number";
    for (const { at, bron, bronUrl } of eersteZien.values()) {
      if (heeftPeriode && (at < (from as number) || at > (to as number))) continue;
      if (isAds(bron, bronUrl)) groeiAds++;
      else if ((bron && bron.trim()) || (bronUrl && bronUrl.trim())) groeiWebsite++;
      else groeiOnbekend++;
    }

    return {
      mailbaar,
      totaalUniek: unie.size,
      afgemeldTotaal: afgemeld.size,
      afgemeldLaatste7,
      segmenten: [
        { naam: "Even Houvast leads", aantal: ehLeads.size },
        { naam: "Evergreen funnel", aantal: evergreen.size },
        { naam: "Mailgroepen (incl. ML)", aantal: groepen.size },
        { naam: "Niet Alleen klanten", aantal: na.size },
        { naam: "Nieuwsbrief opt-ins", aantal: nieuwsbrief.size },
      ],
      evergreenSplit: { ml: evML, ehDoorlopers: evEH, overig: evOverig },
      groei: {
        ads: groeiAds,
        website: groeiWebsite,
        onbekend: groeiOnbekend,
        totaal: groeiAds + groeiWebsite + groeiOnbekend,
      },
    };
}

export const lijstOverzicht = query({
  args: { adminToken: v.string(), from: v.optional(v.number()), to: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await berekenLijstOverzicht(ctx, args.from, args.to);
  },
});

export const _lijstOverzichtDiagnose = internalQuery({
  args: { from: v.optional(v.number()), to: v.optional(v.number()) },
  handler: async (ctx, args) => await berekenLijstOverzicht(ctx, args.from, args.to),
});


/** Diagnose (CLI): afmeldingen van de afgelopen X dagen, gesplitst ML vs. rest. */
export const _afmeldersWeek = internalQuery({
  args: { dagen: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const dagen = args.dagen ?? 7;
    const sinds = Date.now() - dagen * 24 * 60 * 60 * 1000;
    const [afmeldingen, groepLeden, groepen] = await Promise.all([
      ctx.db.query("ehAfmeldingen").collect(),
      ctx.db.query("mailGroepLeden").collect(),
      ctx.db.query("mailGroepen").collect(),
    ]);
    const mlSet = new Set(groepLeden.map((l: any) => (l.email || "").toLowerCase()));
    const week = afmeldingen.filter((a: any) => (a.createdAt ?? 0) >= sinds);
    let uitMLgroep = 0, nietML = 0;
    const perMailContext: Record<string, number> = {};
    for (const a of week) {
      const e = (a.email || "").toLowerCase();
      if (mlSet.has(e)) uitMLgroep++; else nietML++;
      const m = a.mail ?? "onbekend";
      perMailContext[m] = (perMailContext[m] ?? 0) + 1;
    }
    return {
      dagen,
      totaalWeek: week.length,
      uitMLgroep,
      nietML,
      perMailContext,
      mailgroepen: groepen.map((g: any) => ({ naam: g.naam, leden: groepLeden.filter((l: any) => l.groepId === g._id).length })),
    };
  },
});

export const getRecentRegistrations = query({
  args: { adminToken: v.string(), days: v.optional(v.number()), from: v.optional(v.number()), to: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Periode: from/to volgt de datumkiezer; anders terugval op laatste `days` dagen.
    const since = args.from ?? (Date.now() - (args.days ?? 7) * 24 * 60 * 60 * 1000);
    const until = args.to ?? Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    const recent = users.filter((u: any) => u._creationTime >= since && u._creationTime <= until);

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

    const [products, allSubs, excludedEmails, naProfiles, giftCodes] = await Promise.all([
      ctx.db.query("checkoutProducts").collect(),
      ctx.db.query("userSubscriptions").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
      ctx.db.query("giftCodes").collect(),
    ]);

    const excludedSet = new Set(excludedEmails.map((e) => e.email.toLowerCase()));

    // Een cadeaubon telt als omzet op het moment van AANSCHAF, niet bij verzilveren.
    // Bij verzilveren wordt voor de ontvanger een Niet Alleen-profiel (en soms een
    // gift-subscription met pricePaid 0) aangemaakt; dat is geen nieuwe verkoop, het
    // geld kwam al binnen toen de bon gekocht werd. We sluiten die verzilver-profielen
    // dus uit en tellen in plaats daarvan de aankoop van de bon zelf.
    const verzilverdeGiftEmails = new Set(
      giftCodes
        .filter((g) => g.status === "redeemed" && g.redeemedByEmail)
        .map((g) => g.redeemedByEmail!.toLowerCase())
    );

    // Alleen echte Stripe-betalingen (pricePaid > 0), geen handmatig ingestelde
    const echteAankopen = allSubs.filter(
      (s) => (s.pricePaid ?? 0) > 0 && (!s.email || !excludedSet.has(s.email.toLowerCase()))
    );
    const echteNA = naProfiles.filter(
      (p) => !excludedSet.has(p.email.toLowerCase()) && !verzilverdeGiftEmails.has(p.email.toLowerCase())
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

    // Cadeaubonnen tellen op moment van aanschaf (pricePaid > 0 = echte betaling;
    // handmatig aangemaakte toegangs-/testcodes hebben pricePaid 0). Zo verschijnt de
    // omzet bij aankoop en niet nogmaals bij verzilveren.
    for (const g of giftCodes) {
      if ((g.pricePaid ?? 0) <= 0) continue;
      if (g.giverEmail && excludedSet.has(g.giverEmail.toLowerCase())) continue;
      alleVerkopen.push({ timestamp: g.createdAt, prijs: g.pricePaid!, productSlug: g.slug });
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

/**
 * Analytics specifiek voor de Benji-link VANUIT DE BRIEF (mail 0) en de kom-terug-mail.
 * Alles per UNIEK e-mailadres, zodat niets dubbel wordt geteld. Testadressen eruit.
 * Privacyveilig: telt alleen berichten en sessies, leest nooit gespreksinhoud.
 *
 * Bronnen:
 * - benjiLinkVerzonden.mail === "brief"          → wie kreeg de brief mét Benji-link
 * - benjiLinkVerzonden.mail === "brief-komterug" → wie kreeg de kom-terug-mail
 * - benjiStartTokens.usedAt                       → wie klikte (1x per adres)
 * - chatMessages (role "user")                    → hoeveel berichten uitgewisseld
 * - meerdere sessies / activiteit ná de kom-terug-mail → teruggekomen
 */
async function berekenBriefBenjiStats(ctx: QueryCtx) {
    const excluded = await ctx.db.query("analyticsExcludedEmails").collect();
    const testSet = new Set(excluded.map((e: any) => (e.email || "").toLowerCase()));
    const isTest = (e?: string | null) => !!e && testSet.has(e.toLowerCase());

    // Verzendingen: wie kreeg een brief-link, wie kreeg de kom-terug-mail (+ wanneer).
    const verzendingen = await ctx.db.query("benjiLinkVerzonden").collect();
    const briefEmails = new Set<string>();
    const komTerugEmails = new Set<string>();
    const komTerugTijd = new Map<string, number>();
    for (const v of verzendingen) {
      const e = (v.email || "").toLowerCase();
      if (!e || isTest(e)) continue;
      if (v.mail === "brief") briefEmails.add(e);
      // Beide dag-3-opvolgmails (kom-terug én vervolg) tellen als de follow-up.
      if (v.mail === "brief-komterug" || v.mail === "brief-vervolg") {
        komTerugEmails.add(e);
        const prev = komTerugTijd.get(e);
        if (prev === undefined || v.verstuurdOp < prev) komTerugTijd.set(e, v.verstuurdOp);
      }
    }

    // Klik (eerste usedAt) per adres.
    const tokens = await ctx.db.query("benjiStartTokens").collect();
    const klikTijd = new Map<string, number>();
    for (const t of tokens) {
      const e = (t.email || "").toLowerCase();
      if (!e || isTest(e) || !t.usedAt) continue;
      const prev = klikTijd.get(e);
      if (prev === undefined || t.usedAt < prev) klikTijd.set(e, t.usedAt);
    }

    let geklikt = 0;
    let praters = 0; // klikkers met >=1 eigen bericht
    let somBerichten = 0; // totaal eigen berichten van de praters
    let teruggekomen = 0; // >=2 sessies met bericht, of activiteit op >=2 dagen
    let komTerugActiefNa = 0; // kom-terug-ontvangers met een eigen bericht ná die mail

    for (const email of briefEmails) {
      if (!klikTijd.has(email)) continue; // niet geklikt
      geklikt++;
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .unique();
      if (!user) continue;
      const sessies = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
        .collect();

      let userBerichten = 0;
      let sessiesMetBericht = 0;
      const dagen = new Set<string>();
      const ktTijd = komTerugTijd.get(email);
      let berichtNaKomTerug = false;
      for (const s of sessies) {
        const msgs = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", s._id))
          .collect();
        const eigen = msgs.filter((m) => m.role === "user");
        if (eigen.length > 0) {
          sessiesMetBericht++;
          userBerichten += eigen.length;
          for (const m of eigen) {
            dagen.add(new Date(m.createdAt).toISOString().slice(0, 10));
            if (ktTijd !== undefined && m.createdAt > ktTijd) berichtNaKomTerug = true;
          }
        }
      }
      if (userBerichten > 0) {
        praters++;
        somBerichten += userBerichten;
      }
      if (sessiesMetBericht >= 2 || dagen.size >= 2) teruggekomen++;
      if (berichtNaKomTerug) komTerugActiefNa++;
    }

    return {
      briefVerstuurd: briefEmails.size,
      geklikt,
      klikRatio: briefEmails.size > 0 ? Math.round((geklikt / briefEmails.size) * 1000) / 10 : 0,
      praters,
      gemBerichten: praters > 0 ? Math.round((somBerichten / praters) * 10) / 10 : 0,
      totaalBerichten: somBerichten,
      teruggekomen,
      komTerugVerstuurd: komTerugEmails.size,
      komTerugActiefNa,
    };
}

export const getBriefBenjiStats = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await berekenBriefBenjiStats(ctx);
  },
});

// Interne test-variant (geen auth) om de berekening los te verifiëren via convex run.
export const _briefBenjiStatsTest = internalQuery({
  args: {},
  handler: async (ctx) => await berekenBriefBenjiStats(ctx),
});

/**
 * Klantbeheer: zoeken, subscription wijzigen, data resetten.
 * Alleen bruikbaar vanuit het admin panel (adminToken check via context).
 */
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { berekenLevering, berekenDagNummer } from "./nietAlleenLevering";
import { decryptContent } from "./chatCrypto";

/** Lijst van alle klant-e-mailadressen in het bestand (voor autocomplete bij zoeken).
 *  Combineert TTB-accounts (credentials) en Niet Alleen-klanten (nietAlleenProfiles). */
export const listCustomerEmails = query({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    const [creds, profielen] = await Promise.all([
      ctx.db.query("credentials").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
    ]);
    const byEmail = new Map<string, string>(); // email -> naam (leeg indien onbekend)
    for (const c of creds) {
      const email = c.email.toLowerCase().trim();
      if (email && !byEmail.has(email)) byEmail.set(email, "");
    }
    for (const p of profielen) {
      const email = p.email.toLowerCase().trim();
      if (!email) continue;
      // Naam uit het Niet Alleen-profiel vult een eventueel leeg label aan.
      if (!byEmail.get(email)) byEmail.set(email, p.naam ?? "");
    }
    return Array.from(byEmail, ([email, naam]) => ({ email, naam }))
      .sort((a, b) => a.email.localeCompare(b.email));
  },
});

/**
 * Volledig contactoverzicht: iedereen die we kennen, met wie het is, in welke
 * groep/status en wat gekocht is. Bron voor het overzicht in Klantbeheer én voor
 * de CSV-export (backup + zicht op alle adressen). Uniek per e-mailadres.
 */
export const alleContacten = query({
  args: { adminToken: v.string() },
  handler: async (ctx) => {
    const [creds, users, naProfielen, subs, brieven, optins, funnelLeads, afmeldingen, groepen, groepLeden] =
      await Promise.all([
        ctx.db.query("credentials").collect(),
        ctx.db.query("users").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("nieuwsbriefOptins").collect(),
        ctx.db.query("funnelLeads").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("mailGroepen").collect(),
        ctx.db.query("mailGroepLeden").collect(),
      ]);

    const groepNaam = new Map(groepen.map((g: any) => [g._id, g.naam]));
    const usersByEmail = new Map<string, any>();
    for (const u of users) if (u.email) usersByEmail.set(u.email.toLowerCase(), u);

    type Rec = {
      email: string;
      naam: string;
      account: boolean;
      klant: boolean;
      trial: boolean;
      ehLead: boolean;
      nieuwsbrief: boolean;
      afgemeld: boolean;
      evergreen: string | null;
      groepen: string[];
      gekocht: string[];
    };
    const map = new Map<string, Rec>();
    const rec = (email: string): Rec => {
      const e = email.toLowerCase().trim();
      let r = map.get(e);
      if (!r) {
        r = {
          email: e, naam: "", account: false, klant: false, trial: false, ehLead: false,
          nieuwsbrief: false, afgemeld: false, evergreen: null, groepen: [], gekocht: [],
        };
        map.set(e, r);
      }
      return r;
    };
    const zetNaam = (r: Rec, naam?: string | null) => {
      if (!r.naam && naam && naam.trim()) r.naam = naam.trim();
    };

    for (const c of creds) if (c.email) rec(c.email).account = true;
    for (const p of naProfielen) {
      if (!p.email) continue;
      const r = rec(p.email);
      r.klant = true;
      zetNaam(r, p.naam);
      if (!r.gekocht.includes("Niet Alleen")) r.gekocht.push("Niet Alleen");
    }
    for (const s of subs) {
      if (!s.email) continue;
      const r = rec(s.email);
      if (s.subscriptionType === "trial" && s.expiresAt && s.expiresAt > Date.now()) r.trial = true;
      if ((s.pricePaid ?? 0) > 0) {
        r.klant = true;
        const label = s.subscriptionType === "niet_alleen" ? "Niet Alleen" : (s.subscriptionType ?? "aankoop");
        if (!r.gekocht.includes(label)) r.gekocht.push(label);
      }
    }
    for (const b of brieven) {
      if (!b.email) continue;
      const r = rec(b.email);
      r.ehLead = true;
      zetNaam(r, b.naam);
    }
    for (const o of optins) {
      if (!o.email) continue;
      const r = rec(o.email);
      r.nieuwsbrief = true;
      zetNaam(r, o.naam);
    }
    for (const l of funnelLeads) {
      if (!l.email) continue;
      const r = rec(l.email);
      r.evergreen = l.status;
      zetNaam(r, l.naam);
    }
    for (const a of afmeldingen) if (a.email) rec(a.email).afgemeld = true;
    for (const gl of groepLeden) {
      if (!gl.email) continue;
      const r = rec(gl.email);
      const naam = groepNaam.get(gl.groepId);
      if (naam && !r.groepen.includes(naam)) r.groepen.push(naam);
    }
    // Namen aanvullen uit accounts waar nog geen naam bekend is.
    for (const r of map.values()) {
      if (!r.naam) zetNaam(r, usersByEmail.get(r.email)?.name);
    }

    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  },
});

/** Zoek klantinfo op basis van e-mailadres */
export const getCustomerByEmail = query({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!email) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    // Geen TTB-account? Kijk dan of er een Niet Alleen profiel is
    if (!user) {
      const naProfile = await ctx.db
        .query("nietAlleenProfiles")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (!naProfile) return null;

      const dagNummer = Math.min(berekenDagNummer(naProfile.startDatum, Date.now()), 30);
      const vt = (naProfile.verliesType ?? "").trim().toLowerCase();
      return {
        userId: null,
        name: naProfile.naam,
        email: naProfile.email,
        subscription: null,
        nietAlleen: {
          profileId: naProfile._id.toString(),
          naam: naProfile.naam,
          verliesType: naProfile.verliesType ?? "onbekend",
          startDatum: naProfile.startDatum,
          dagNummer: Math.max(1, dagNummer),
          dagenIngevuld: (naProfile.dagPrompts ?? []).length,
          actief: !naProfile.accountGesloten,
          dag28Verzonden: !!naProfile.dag28MailVerzonden,
          dag30Verzonden: !!naProfile.dag30MailVerzonden,
          nogNietGestart: (!vt || vt === "onbekend") && ((naProfile.verzondenDagen?.length ?? 0) === 0),
          levering: berekenLevering(naProfile, Date.now()),
        },
        producten: [
          { naam: "Niet Alleen (30 dagen)", type: "programma", since: naProfile.createdAt },
        ],
        preferences: { hasAccentColor: false, hasBackground: false, hasUserContext: false },
        counts: { notes: 0, goals: 0, memories: 0, checkIns: 0, conversationsThisMonth: 0 },
      };
    }

    const userId = user._id.toString();

    const [subscription, preferences, notes, goals, memories, checkIns, nietAlleenProfile] =
      await Promise.all([
        ctx.db
          .query("userSubscriptions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first(),
        ctx.db
          .query("userPreferences")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique(),
        ctx.db
          .query("notes")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("goals")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("memories")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("checkInEntries")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        // Probeer eerst op email, daarna op userId (voor klanten die kochten met TTB-account)
        ctx.db
          .query("nietAlleenProfiles")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first()
          .then(async (byEmail) => {
            if (byEmail) return byEmail;
            return ctx.db
              .query("nietAlleenProfiles")
              .withIndex("by_user", (q) => q.eq("userId", userId))
              .first();
          }),
      ]);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usage = await ctx.db
      .query("conversationUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", userId).eq("month", month)
      )
      .first();

    // Bereken Niet Alleen voortgang
    let nietAlleen: {
      profileId: string;
      naam: string;
      verliesType: string;
      startDatum: number;
      dagNummer: number;
      dagenIngevuld: number;
      actief: boolean;
      dag28Verzonden: boolean;
      dag30Verzonden: boolean;
      nogNietGestart: boolean;
      levering: ReturnType<typeof berekenLevering>;
    } | null = null;
    if (nietAlleenProfile) {
      const dagNummer = Math.min(berekenDagNummer(nietAlleenProfile.startDatum, Date.now()), 30);
      const vt = (nietAlleenProfile.verliesType ?? "").trim().toLowerCase();
      nietAlleen = {
        profileId: nietAlleenProfile._id.toString(),
        naam: nietAlleenProfile.naam,
        verliesType: nietAlleenProfile.verliesType ?? "onbekend",
        startDatum: nietAlleenProfile.startDatum,
        dagNummer: Math.max(1, dagNummer),
        dagenIngevuld: (nietAlleenProfile.dagPrompts ?? []).length,
        actief: !nietAlleenProfile.accountGesloten,
        dag28Verzonden: !!nietAlleenProfile.dag28MailVerzonden,
        dag30Verzonden: !!nietAlleenProfile.dag30MailVerzonden,
        nogNietGestart: (!vt || vt === "onbekend") && ((nietAlleenProfile.verzondenDagen?.length ?? 0) === 0),
        levering: berekenLevering(nietAlleenProfile, Date.now()),
      };
    }

    // Productenlijst
    const producten: { naam: string; type: string; since: number }[] = [];
    const PRODUCT_NAMEN: Record<string, string> = {
      alles_in_1: "Alles-in-1",
      uitgebreid: "Uitgebreid",
      er_zijn: "Er Zijn",
      niet_alleen: "Niet Alleen (30 dagen)",
    };
    if (subscription && subscription.subscriptionType !== "free" && subscription.subscriptionType !== "trial") {
      producten.push({
        naam: PRODUCT_NAMEN[subscription.subscriptionType] ?? subscription.subscriptionType,
        type: subscription.subscriptionType === "uitgebreid" || subscription.subscriptionType === "alles_in_1" ? "abonnement" : "eenmalig",
        since: subscription.startedAt ?? subscription._creationTime,
      });
    }
    if (nietAlleenProfile) {
      producten.push({
        naam: "Niet Alleen (30 dagen)",
        type: "programma",
        since: nietAlleenProfile.createdAt,
      });
    }

    return {
      userId,
      name: user.name,
      email: user.email,
      subscription: subscription ?? null,
      nietAlleen,
      producten,
      preferences: {
        hasAccentColor: !!preferences?.accentColor,
        hasBackground: !!preferences?.backgroundImageStorageId,
        hasUserContext: !!preferences?.userContext,
      },
      counts: {
        notes: notes.length,
        goals: goals.length,
        memories: memories.length,
        checkIns: checkIns.length,
        conversationsThisMonth: usage?.conversationCount ?? 0,
      },
    };
  },
});

/** Wijzig abonnement van een klant */
export const setCustomerSubscription = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
    subscriptionType: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const now = Date.now();

    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!sub) throw new Error("Geen subscription gevonden voor dit e-mailadres");

    if (args.subscriptionType === "trial") {
      await ctx.db.patch(sub._id, {
        subscriptionType: "trial",
        status: "active",
        expiresAt: now + 7 * 24 * 60 * 60 * 1000,
        reminderDay5Sent: false,
        reminderDay7Sent: false,
        updatedAt: now,
      });
    } else {
      const { expiresAt: _exp, reminderDay5Sent: _r5, reminderDay7Sent: _r7, ...rest } = sub;
      await ctx.db.replace(sub._id, {
        ...rest,
        subscriptionType: args.subscriptionType,
        status: "active",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/** Reset gesprekslimiet van de huidige maand */
export const resetConversationUsage = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Gebruiker niet gevonden");

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const usage = await ctx.db
      .query("conversationUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", user._id.toString()).eq("month", month)
      )
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, { conversationCount: 0 });
    }

    return { success: true };
  },
});

/** Reset accentkleur en achtergrondafbeelding (behoudt 'Jouw verhaal') */
export const resetCustomerPreferences = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Gebruiker niet gevonden");

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
      .unique();

    if (!prefs) return { success: true, changed: false };

    const { accentColor: _ac, backgroundImageStorageId: _bg, ...rest } = prefs;
    await ctx.db.replace(prefs._id, { ...rest, updatedAt: Date.now() });

    return { success: true, changed: true };
  },
});

/** Wijzig e-mailadres van een klant (users + credentials + userSubscriptions) */
export const changeCustomerEmail = mutation({
  args: {
    adminToken: v.optional(v.string()),
    currentEmail: v.string(),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const current = args.currentEmail.toLowerCase().trim();
    const next = args.newEmail.toLowerCase().trim();

    if (!next || !next.includes("@")) throw new Error("Ongeldig e-mailadres");
    if (current === next) throw new Error("Nieuw e-mailadres is hetzelfde als het huidige");

    // Check of nieuw e-mailadres al in gebruik is
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", next))
      .unique();
    if (existing) throw new Error("Dit e-mailadres is al in gebruik");

    // Update users
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", current))
      .unique();
    if (!user) throw new Error("Gebruiker niet gevonden");
    await ctx.db.patch(user._id, { email: next });

    // Update credentials
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", current))
      .unique();
    if (cred) await ctx.db.patch(cred._id, { email: next });

    // Update userSubscriptions
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", current))
      .first();
    if (sub) await ctx.db.patch(sub._id, { email: next });

    return { success: true };
  },
});

/** Wis 'Jouw verhaal' (userContext) */
export const clearCustomerContext = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Gebruiker niet gevonden");

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
      .unique();

    if (!prefs || !prefs.userContext) return { success: true, changed: false };

    const { userContext: _uc, ...rest } = prefs;
    await ctx.db.replace(prefs._id, { ...rest, updatedAt: Date.now() });

    return { success: true, changed: true };
  },
});

/** Hervat Niet Alleen programma vanaf een specifieke dag */
export const resetNietAlleenDag = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
    hervatVanafDag: v.number(), // 1-30
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!profiel) throw new Error("Geen Niet Alleen profiel gevonden voor dit e-mailadres");
    const dag = Math.max(1, Math.min(30, args.hervatVanafDag));
    const nieuweStartDatum = Date.now() - (dag - 1) * 86400000;
    await ctx.db.patch(profiel._id, { startDatum: nieuweStartDatum, updatedAt: Date.now() });
    return { dag };
  },
});

/** Zet de Niet Alleen-mails voor deze klant stop (bijv. bij refund) of hervat ze.
 *  De drip-cron slaat profielen met accountGesloten=true over. */
export const setNietAlleenMailsGestopt = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
    gestopt: v.boolean(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!profiel) throw new Error("Geen Niet Alleen profiel gevonden voor dit e-mailadres");
    await ctx.db.patch(profiel._id, { accountGesloten: args.gestopt, updatedAt: Date.now() });
    return { gestopt: args.gestopt };
  },
});

/** Stuur een specifieke dagmail nu naar de klant */
export const stuurDagNuAdmin = action({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
    dag: v.number(),
  },
  handler: async (ctx, args) => {
    const profiel = await ctx.runQuery(internal.klantbeheer.getNietAlleenProfielIntern, {
      email: args.email.toLowerCase().trim(),
    });
    if (!profiel) throw new Error("Geen Niet Alleen profiel gevonden");
    await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
      email: profiel.email,
      naam: profiel.naam,
      dagNummer: args.dag,
      verliesType: profiel.verliesType ?? "persoon",
      verliesNaam: profiel.verliesNaam,
    });
    return { verstuurd: true };
  },
});

/**
 * Intern: zet het verliestype en start het programma vandaag opnieuw (dag 1 = vandaag).
 * StartDatum op het begin van vandaag (UTC), zodat het dagnummer meteen 1 is en er
 * geen "gemiste" dagen vóór vandaag meer staan.
 */
export const _zetVerliesEnStartVandaag = internalMutation({
  args: { profileId: v.id("nietAlleenProfiles"), verliesType: v.string() },
  handler: async (ctx, args) => {
    const d = new Date();
    const startVandaag = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0);
    await ctx.db.patch(args.profileId, {
      verliesType: args.verliesType,
      startDatum: startVandaag,
      verzondenDagen: [],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Zet een vastgelopen klant (verliestype nog niet gekozen) in één keer aan de gang:
 * verliestype instellen, dag 1 = vandaag, dag 1 nu versturen en loggen. Door dag 1 te
 * loggen slaat de cron hem daarna over, dus geen dubbele mail. Alleen voor een
 * programma dat nog niet gestart is (nog geen dagmail verstuurd).
 */
export const startNietAlleenMetDag1 = action({
  args: { adminToken: v.optional(v.string()), email: v.string(), verliesType: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const profiel = await ctx.runQuery(internal.klantbeheer.getNietAlleenProfielIntern, {
      email: args.email.toLowerCase().trim(),
    });
    if (!profiel) throw new Error("Geen Niet Alleen profiel gevonden voor dit e-mailadres");
    if ((profiel.verzondenDagen?.length ?? 0) > 0) {
      throw new Error("Dit programma is al gestart. Gebruik 'Hervat vanaf dag' of 'Stuur dag nu'.");
    }
    await ctx.runMutation(internal.klantbeheer._zetVerliesEnStartVandaag, {
      profileId: profiel._id,
      verliesType: args.verliesType,
    });
    await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
      email: profiel.email,
      naam: profiel.naam,
      dagNummer: 1,
      verliesType: args.verliesType,
      verliesNaam: profiel.verliesNaam,
    });
    await ctx.runMutation(internal.nietAlleen.recordDagMailVerzonden, { profileId: profiel._id, dag: 1 });
    return { ok: true };
  },
});

/** Intern: haal Niet Alleen profiel op (gebruikt door stuurDagNuAdmin) */
export const getNietAlleenProfielIntern = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Analyse: welke chatsessies zijn er de afgelopen ~30 uur gestart, kwamen die via
 * de brief of via een opvolgmail, en typte de bezoeker iets? Privacyveilig: leest
 * alleen de systeem-opener (eerste bot-bericht) en TELT bezoekersberichten; geeft
 * nooit de inhoud van wat de bezoeker schreef terug. Voor een snelle "kwam die van
 * vandaag uit de brief?"-check.
 */
export const sessiesVandaag = internalQuery({
  args: { sindsMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const since = args.sindsMs ?? Date.now() - 30 * 60 * 60 * 1000;
    const sessies = (await ctx.db.query("chatSessions").collect()).filter(
      (s) => (s.startedAt ?? 0) >= since
    );
    const result: any[] = [];
    for (const s of sessies) {
      const berichten = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .collect();
      const eersteBot = berichten
        .filter((m) => m.role === "bot")
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      const aantalUser = berichten.filter((m) => m.role === "user").length;
      const opener = eersteBot ? await decryptContent(eersteBot.content) : "";
      const email = (s.userEmail ?? "").toLowerCase().trim();
      let briefLinkGelogd = false;
      if (email) {
        const logs = await ctx.db
          .query("benjiLinkVerzonden")
          .withIndex("by_email", (q) => q.eq("email", email))
          .collect();
        briefLinkGelogd = logs.some((l) => l.mail === "brief");
      }
      result.push({
        startedAt: s.startedAt,
        topic: s.topic,
        email,
        aantalUserBerichten: aantalUser,
        openerSnippet: opener.slice(0, 80),
        vermoedelijkBrief: opener.includes("Blijf nog even, dan praten we samen verder"),
        briefLinkGelogd,
      });
    }
    return result.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  },
});

/**
 * Verwijder een compleet account op basis van e-mailadres (admin/maintenance).
 * Spiegelt convex/deleteAccount.ts (die self-serve is), maar zoekt op e-mail i.p.v.
 * de ingelogde gebruiker, en ruimt óók de Even Houvast / Benji-sporen op:
 * benjiStartTokens, benjiLinkVerzonden en houvastBrieven. Internal, dus alleen
 * aanroepbaar vanaf de server / CLI met de deploy key. Geeft terug wat er is gewist.
 */
export const verwijderGebruikerPerEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const gewist: Record<string, number> = {};
    const del = async (id: any, key: string) => {
      await ctx.db.delete(id);
      gewist[key] = (gewist[key] ?? 0) + 1;
    };

    const userRecord = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    const userId = userRecord?._id.toString();

    // Data gekoppeld aan userId (chat, voorkeuren, herinneringen, doelen, abo, enz.)
    if (userId) {
      const chatSessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const session of chatSessions) {
        const messages = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();
        for (const msg of messages) await del(msg._id, "chatMessages");
        await del(session._id, "chatSessions");
      }

      const prefs = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (prefs) {
        if (prefs.backgroundImageStorageId) {
          try { await ctx.storage.delete(prefs.backgroundImageStorageId); } catch {}
        }
        await del(prefs._id, "userPreferences");
      }

      const memories = await ctx.db
        .query("memories")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const memory of memories) {
        if (memory.imageStorageId) {
          try { await ctx.storage.delete(memory.imageStorageId); } catch {}
        }
        await del(memory._id, "memories");
      }

      const [notes, goals, emotions, checkInAnswers, checkInEntries] = await Promise.all([
        ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("emotionEntries").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("checkInAnswers").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("checkInEntries").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);
      for (const r of notes) await del(r._id, "notes");
      for (const r of goals) await del(r._id, "goals");
      for (const r of emotions) await del(r._id, "emotionEntries");
      for (const r of checkInAnswers) await del(r._id, "checkInAnswers");
      for (const r of checkInEntries) await del(r._id, "checkInEntries");

      const [subs, usage, pushSubs] = await Promise.all([
        ctx.db.query("userSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("conversationUsage").filter((q) => q.eq(q.field("userId"), userId)).collect(),
        ctx.db.query("pushSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);
      for (const r of subs) await del(r._id, "userSubscriptions");
      for (const r of usage) await del(r._id, "conversationUsage");
      for (const r of pushSubs) await del(r._id, "pushSubscriptions");
    }

    // Niet Alleen-profiel(en): match op userId én email.
    const naProfiles = [
      ...(userId ? await ctx.db.query("nietAlleenProfiles").withIndex("by_user", (q) => q.eq("userId", userId)).collect() : []),
      ...(await ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", email)).collect()),
    ];
    const seen = new Set<string>();
    for (const profiel of naProfiles) {
      if (seen.has(profiel._id)) continue;
      seen.add(profiel._id);
      if (profiel.profielFoto) { try { await ctx.storage.delete(profiel.profielFoto); } catch {} }
      for (const foto of profiel.dagFotos ?? []) { try { await ctx.storage.delete(foto.storageId); } catch {} }
      await del(profiel._id, "nietAlleenProfiles");
    }

    // Credentials + reset-tokens + NextAuth-sessies + de gebruiker zelf.
    const creds = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", email))
      .collect();
    for (const c of creds) await del(c._id, "credentials");

    if (userRecord) {
      const resetTokens = await ctx.db
        .query("passwordResetTokens")
        .filter((q) => q.eq(q.field("userId"), userRecord._id))
        .collect();
      for (const r of resetTokens) await del(r._id, "passwordResetTokens");
      const authSessions = await ctx.db
        .query("sessions")
        .withIndex("userId", (q) => q.eq("userId", userRecord._id))
        .collect();
      for (const s of authSessions) await del(s._id, "sessions");
      await del(userRecord._id, "users");
    }

    // Even Houvast / Benji-sporen.
    const tokens = await ctx.db
      .query("benjiStartTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const t of tokens) await del(t._id, "benjiStartTokens");

    const linkLogs = await ctx.db
      .query("benjiLinkVerzonden")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const l of linkLogs) await del(l._id, "benjiLinkVerzonden");

    const brieven = await ctx.db
      .query("houvastBrieven")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const b of brieven) await del(b._id, "houvastBrieven");

    return { email, userGevonden: !!userRecord, gewist };
  },
});

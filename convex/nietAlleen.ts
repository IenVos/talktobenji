/**
 * Niet Alleen — 30-daagse begeleidingscursus
 * Queries, mutations en de dagelijkse cron-verwerker.
 */
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { checkAdmin, logAdminAction } from "./adminAuth";
import { berekenLevering } from "./nietAlleenLevering";

// ─────────────────────────────────────────
// PUBLIC — gebruikt door de /niet-alleen pagina
// ─────────────────────────────────────────

/** Haal het Niet Alleen profiel op voor de ingelogde gebruiker. */
export const getProfile = query({
  args: { userId: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Zoek op userId
    const byUserId = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (byUserId) return byUserId;
    // Fallback: zoek op e-mail
    const lookupEmail = args.email ?? (args.userId.includes("@") ? args.userId : null);
    if (lookupEmail) {
      return await ctx.db
        .query("nietAlleenProfiles")
        .withIndex("by_email", (q) => q.eq("email", lookupEmail))
        .first() ?? null;
    }
    return null;
  },
});

/** Sla de naam op van wie/wat er gemist wordt. */
export const setVerliesNaam = mutation({
  args: { userId: v.string(), verliesNaam: v.string() },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) throw new Error("Profiel niet gevonden");
    await ctx.db.patch(profiel._id, { verliesNaam: args.verliesNaam, updatedAt: Date.now() });
  },
});

/** Genereer een upload-URL voor een dagfoto. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

/** Sla de storageId op voor een foto van een specifieke dag. */
export const saveDagFoto = mutation({
  args: { userId: v.string(), dag: v.number(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) throw new Error("Profiel niet gevonden");
    const andereFotos = (profiel.dagFotos ?? []).filter((f) => f.dag !== args.dag);
    await ctx.db.patch(profiel._id, {
      dagFotos: [...andereFotos, { dag: args.dag, storageId: args.storageId, uploadedAt: Date.now() }],
      updatedAt: Date.now(),
    });
  },
});

/** Sla de profielfoto op. */
export const saveProfielFoto = mutation({
  args: { userId: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) throw new Error("Profiel niet gevonden");
    await ctx.db.patch(profiel._id, { profielFoto: args.storageId, updatedAt: Date.now() });
  },
});

/** Haal de URL op van een opgeslagen foto. */
export const getDagFotoUrl = query({
  args: { storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});

/** Sla het verliestype op bij de eerste bezoek (onboarding). */
export const setVerliesType = mutation({
  args: {
    userId: v.string(),
    verliesType: v.string(),
  },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profiel) throw new Error("Profiel niet gevonden");

    await ctx.db.patch(profiel._id, {
      verliesType: args.verliesType,
      updatedAt: Date.now(),
    });
  },
});

/** Sla de tekst op voor een specifieke dag. Overschrijft indien al ingevuld. */
export const saveDagPrompt = mutation({
  args: {
    userId: v.string(),
    dag: v.number(),
    tekst: v.string(),
  },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profiel) throw new Error("Profiel niet gevonden");

    const overigePrompts = profiel.dagPrompts.filter((p) => p.dag !== args.dag);
    await ctx.db.patch(profiel._id, {
      dagPrompts: [
        ...overigePrompts,
        { dag: args.dag, tekst: args.tekst, ingevuldOp: Date.now() },
      ],
      updatedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────
// PUBLIC ACTIONS
// ─────────────────────────────────────────

/**
 * Stuur alle Niet Alleen emails naar een testadres — alleen voor admin testing.
 * Verstuurt: welkomst + dag 1 t/m 30 + dag28 voorbereiding + dag30 afsluiting.
 */
export const stuurTestEmails = action({
  args: {
    email: v.string(),
    naam: v.string(),
    verliesType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.nietAlleenEmails.stuurAlleEmailsTest, {
      email: args.email,
      naam: args.naam,
      verliesType: args.verliesType ?? "persoon",
    });
  },
});

/** Stuur één losse test-mail naar je eigen inbox (admin testpaneel). */
export const stuurTestEmailEnkel = action({
  args: {
    email: v.string(),
    naam: v.string(),
    verliesType: v.optional(v.string()),
    mail: v.union(
      v.literal("welkom"),
      v.literal("dag"),
      v.literal("dag15"),
      v.literal("dag28"),
      v.literal("dag30"),
    ),
    dagNummer: v.optional(v.number()), // alleen bij mail === "dag"
  },
  handler: async (ctx, args) => {
    const email = args.email;
    const naam = args.naam;
    switch (args.mail) {
      case "welkom":
        await ctx.runAction(internal.nietAlleenEmails.sendWelkomstMail, { email, naam });
        break;
      case "dag15":
        await ctx.runAction(internal.nietAlleenEmails.sendHalverwegeMail, { email, naam });
        break;
      case "dag28":
        await ctx.runAction(internal.nietAlleenEmails.sendVoorbereidingsMail, { email, naam });
        break;
      case "dag30":
        await ctx.runAction(internal.nietAlleenEmails.sendAfsluitMail, { email, naam, aantalDagenIngevuld: 25 });
        break;
      case "dag":
        await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
          email,
          naam,
          dagNummer: args.dagNummer ?? 1,
          verliesType: args.verliesType ?? "persoon",
        });
        break;
    }
  },
});

/** Activeer Niet Alleen account + stuur welkomstmail. Wordt aangeroepen vanuit /api/niet-alleen/activate. */
export const activeerEnStuurWelkom = action({
  args: { userId: v.string(), email: v.string(), naam: v.string() },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(internal.nietAlleen.activateNietAlleen, args);
    // Stuur welkomstmail alleen als dit een nieuw profiel is (voorkomt dubbele mails)
    if (result?.isNieuw) {
      await ctx.runAction(internal.nietAlleenEmails.sendWelkomstMail, {
        email: args.email,
        naam: args.naam,
      });
    }
  },
});

/** Stuur alleen de welkomstmail — geen account vereist (bijv. na Stripe betaling). */
export const stuurWelkomstMailZonderAccount = action({
  args: { email: v.string(), naam: v.string() },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.nietAlleenEmails.sendWelkomstMail, {
      email: args.email,
      naam: args.naam,
    });
  },
});

// ─────────────────────────────────────────
// ─────────────────────────────────────────
// Testprofiel aanmaken (admin)
// ─────────────────────────────────────────

/** Maak een testprofiel voor een bestaand account — alleen voor testing. */
export const maakTestProfiel = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    naam: v.string(),
    verliesType: v.string(),
    dagOffset: v.number(), // 0 = vandaag dag 1, 5 = 5 dagen geleden gestart (dag 6 nu)
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDatum = now - args.dagOffset * 86400000;
    // "scheiding" is een oud label — normaliseer naar "relatie"
    const verliesType = (args.verliesType === "scheiding" ? "relatie" : args.verliesType) as any;

    const bestaand = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (bestaand) {
      // Volledig resetten — ook dagPrompts, anker, terugblik, etc.
      await ctx.db.patch(bestaand._id, {
        userId: args.userId,
        naam: args.naam,
        verliesType,
        startDatum,
        accountGesloten: false,
        dagPrompts: [],
        dagFotos: [],
        verliesNaam: undefined,
        nietAlleenAnker: undefined,
        nietAlleenTerugblik: undefined,
        nietAlleenOefeningGesloten: undefined,
        verzondenDagen: [],
        inhaalWachtrij: undefined,
        inhaalExcuusPending: undefined,
        dag15MailVerzonden: undefined,
        dag28MailVerzonden: undefined,
        dag30MailVerzonden: undefined,
        updatedAt: now,
      });
      return "bijgewerkt";
    }

    await ctx.db.insert("nietAlleenProfiles", {
      userId: args.userId,
      email: args.email,
      naam: args.naam,
      verliesType,
      startDatum,
      dagPrompts: [],
      verzondenDagen: [],
      createdAt: now,
      updatedAt: now,
    });
    return "aangemaakt";
  },
});

// INTERNAL — voor webhook en cron
// ─────────────────────────────────────────

/**
 * Activeer een Niet Alleen account na aankoop via KennisShop webhook.
 * Wordt aangeroepen vanuit pages/api/webhooks/kennisshop.ts
 */
export const activateNietAlleen = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    naam: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Abonnement record aanmaken of bijwerken
    const bestaandAbo = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (bestaandAbo) {
      await ctx.db.patch(bestaandAbo._id, {
        subscriptionType: "niet_alleen",
        status: "active",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userSubscriptions", {
        userId: args.userId,
        email: args.email,
        subscriptionType: "niet_alleen",
        status: "active",
        startedAt: now,
        updatedAt: now,
      });
    }

    // Niet Alleen profiel aanmaken (alleen als het er nog niet is)
    const bestaandProfiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!bestaandProfiel) {
      await ctx.db.insert("nietAlleenProfiles", {
        userId: args.userId,
        email: args.email,
        naam: args.naam,
        startDatum: now,
        dagPrompts: [],
        verzondenDagen: [],
        createdAt: now,
        updatedAt: now,
      });
      return { isNieuw: true };
    }

    return { isNieuw: false };
  },
});

/**
 * Maak een Niet Alleen profiel aan voor kopers zonder TTB-account (bijv. via niet-alleen.nl).
 * Gebruikt email als userId zodat dagelijkse mails werken.
 */
export const activateNietAlleenDirect = mutation({
  args: {
    email: v.string(),
    naam: v.string(),
    verliesType: v.optional(v.string()), // "persoon" | "huisdier" | "scheiding" — bepaalt welke mailreeks start
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.email.toLowerCase().trim();

    // Al een profiel? Dan niets doen
    const bestaand = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (bestaand) return { isNieuw: false };

    await ctx.db.insert("nietAlleenProfiles", {
      userId: email, // email als userId zodat lookup by_email werkt
      email,
      naam: args.naam,
      startDatum: now,
      verliesType: args.verliesType,
      dagPrompts: [],
      verzondenDagen: [],
      createdAt: now,
      updatedAt: now,
    });

    return { isNieuw: true };
  },
});

/** Sla een pending addon op voor activatie bij registratie (als er nog geen account is). */
export const setPendingAddon = mutation({
  args: {
    email: v.string(),
    addonType: v.string(),
    accessDays: v.number(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!profiel) return;
    await ctx.db.patch(profiel._id, {
      pendingAddonType: args.addonType,
      pendingAddonAccessDays: args.accessDays,
      updatedAt: Date.now(),
    });
  },
});

/** Upgrade naar volledig abonnement (bij aankoop abo met zelfde e-mail). */
export const upgradeNaarVolledig = internalMutation({
  args: {
    email: v.string(),
    subscriptionType: v.union(v.literal("uitgebreid"), v.literal("alles_in_1")),
  },
  handler: async (ctx, args) => {
    const abo = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (abo) {
      await ctx.db.patch(abo._id, {
        subscriptionType: args.subscriptionType,
        updatedAt: Date.now(),
      });
    }
  },
});

/** Haal alle actieve Niet Alleen profielen op (voor de dagelijkse cron). */
export const getAllActieveProfielen = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("nietAlleenProfiles")
      .filter((q) => q.neq(q.field("accountGesloten"), true))
      .collect();
  },
});

/**
 * Leg vast dat de dagmail van een bepaald dagnummer is verstuurd.
 * Voegt toe aan verzondenDagen (uniek) en haalt het dagnummer uit de inhaalwachtrij.
 * Wist optioneel de excuus-vlag (na het versturen van de eerste inhaalmail).
 */
export const recordDagMailVerzonden = internalMutation({
  args: {
    profileId: v.id("nietAlleenProfiles"),
    dag: v.number(),
    excuusGebruikt: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.profileId);
    if (!p) return;
    const verzonden = Array.from(new Set([...(p.verzondenDagen ?? []), args.dag])).sort((a, b) => a - b);
    const wachtrij = (p.inhaalWachtrij ?? []).filter((d) => d !== args.dag);
    await ctx.db.patch(args.profileId, {
      verzondenDagen: verzonden,
      laatsteDagMail: verzonden[verzonden.length - 1],
      inhaalWachtrij: wachtrij,
      ...(args.excuusGebruikt ? { inhaalExcuusPending: false } : {}),
      updatedAt: Date.now(),
    });
  },
});

/** Zet dagen in de inhaalwachtrij (gespreid nasturen, 1 per dag). Admin. */
export const queueInhaalDagen = mutation({
  args: {
    adminToken: v.string(),
    profileId: v.id("nietAlleenProfiles"),
    dagen: v.array(v.number()),
    metExcuus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const p = await ctx.db.get(args.profileId);
    if (!p) throw new Error("Profiel niet gevonden");
    const wachtrij = Array.from(new Set([...(p.inhaalWachtrij ?? []), ...args.dagen])).sort((a, b) => a - b);
    await ctx.db.patch(args.profileId, {
      inhaalWachtrij: wachtrij,
      ...(args.metExcuus ? { inhaalExcuusPending: true } : {}),
      updatedAt: Date.now(),
    });
    await logAdminAction(ctx, `Niet Alleen inhaalwachtrij gezet voor ${p.email}: dag ${args.dagen.join(", ")}`);
    return { wachtrij };
  },
});

/**
 * Haal één dag uit de inhaalwachtrij (wordt dus niet meer nagestuurd). Standaard
 * wordt die dag ook als ontvangen gemarkeerd (verschijnt groen), omdat de reden om
 * 'm uit de wachtrij te halen meestal is dat de klant 'm al heeft. Zet
 * `markeerOntvangen: false` om de dag enkel te annuleren (blijft dan gemist). Admin.
 */
export const verwijderUitWachtrij = mutation({
  args: {
    adminToken: v.string(),
    profileId: v.id("nietAlleenProfiles"),
    dag: v.number(),
    markeerOntvangen: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const p = await ctx.db.get(args.profileId);
    if (!p) throw new Error("Profiel niet gevonden");
    const wachtrij = (p.inhaalWachtrij ?? []).filter((d) => d !== args.dag);
    const markeer = args.markeerOntvangen !== false; // standaard true
    const verzonden = markeer
      ? Array.from(new Set([...(p.verzondenDagen ?? []), args.dag])).sort((a, b) => a - b)
      : (p.verzondenDagen ?? []);
    await ctx.db.patch(args.profileId, {
      inhaalWachtrij: wachtrij,
      ...(markeer ? { verzondenDagen: verzonden, laatsteDagMail: verzonden[verzonden.length - 1] } : {}),
      // Excuus-vlag uit zodra de wachtrij leeg is (geen losse excuus-mail meer nodig)
      ...(wachtrij.length === 0 ? { inhaalExcuusPending: false } : {}),
      updatedAt: Date.now(),
    });
    await logAdminAction(
      ctx,
      `Niet Alleen: dag ${args.dag} uit wachtrij gehaald voor ${p.email}${markeer ? " (gemarkeerd als ontvangen)" : " (geannuleerd, blijft gemist)"}.`
    );
    return { wachtrij };
  },
});

/**
 * Markeer dat een klant alle tot nu toe verschenen dagmails (en afsluitmails)
 * écht heeft ontvangen. Vult het logboek met dag 1 t/m de huidige dag en zet de
 * speciale-mail-vlaggen. Gebruik dit voor klanten van vóór het logboek waarvan je
 * zeker weet dat alles is aangekomen. Admin.
 */
export const markeerAllesOntvangen = mutation({
  args: {
    adminToken: v.string(),
    profileId: v.id("nietAlleenProfiles"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const p = await ctx.db.get(args.profileId);
    if (!p) throw new Error("Profiel niet gevonden");
    const dagNummer = Math.floor((Date.now() - p.startDatum) / 86400000) + 1;
    const tot = Math.min(30, Math.max(0, dagNummer));
    const verzonden = Array.from({ length: tot }, (_, i) => i + 1);
    await ctx.db.patch(args.profileId, {
      verzondenDagen: verzonden,
      laatsteDagMail: tot,
      inhaalWachtrij: [],
      inhaalExcuusPending: false,
      ...(dagNummer >= 15 ? { dag15MailVerzonden: true } : {}),
      ...(dagNummer >= 28 ? { dag28MailVerzonden: true } : {}),
      ...(dagNummer >= 30 ? { dag30MailVerzonden: true } : {}),
      updatedAt: Date.now(),
    });
    await logAdminAction(ctx, `Niet Alleen: ${p.email} gemarkeerd als 'alles ontvangen' (dag 1 t/m ${tot}).`);
    return { verzonden };
  },
});

/** Leveringsstatus per klant: welke dagmails zijn (niet) verstuurd. Admin. */
export const getLeveringsStatus = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const profielen = await ctx.db.query("nietAlleenProfiles").collect();
    const now = Date.now();
    return profielen
      .map((p) => {
        const l = berekenLevering(p, now);
        return {
          profileId: p._id,
          email: p.email,
          naam: p.naam,
          verliesType: p.verliesType ?? "persoon",
          dagNummer: l.dagNummer,
          accountGesloten: p.accountGesloten === true,
          verzondenDagen: l.verzonden,
          gemist: l.gemist,
          onbekend: l.onbekend,
          wachtrij: l.wachtrij,
          excuusPending: l.excuusPending,
          specials: l.specials,
        };
      })
      .sort((a, b) => (a.gemist.length === b.gemist.length ? a.naam.localeCompare(b.naam) : b.gemist.length - a.gemist.length));
  },
});

/**
 * Intern: zet verzondenDagen + speciale-mail-vlaggen op basis van de werkelijke
 * verzendgeschiedenis (bijv. uit Resend). Voor eenmalige correctie/sync.
 */
export const syncVerzondenDagen = internalMutation({
  args: {
    email: v.string(),
    verzondenDagen: v.array(v.number()),
    inhaalWachtrij: v.optional(v.array(v.number())),
    inhaalExcuusPending: v.optional(v.boolean()),
    dag15: v.optional(v.boolean()),
    dag28: v.optional(v.boolean()),
    dag30: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!p) throw new Error("Profiel niet gevonden: " + args.email);
    const verzonden = Array.from(new Set(args.verzondenDagen)).sort((a, b) => a - b);
    await ctx.db.patch(p._id, {
      verzondenDagen: verzonden,
      laatsteDagMail: verzonden[verzonden.length - 1],
      ...(args.inhaalWachtrij !== undefined ? { inhaalWachtrij: args.inhaalWachtrij.sort((a, b) => a - b) } : {}),
      ...(args.inhaalExcuusPending !== undefined ? { inhaalExcuusPending: args.inhaalExcuusPending } : {}),
      ...(args.dag15 !== undefined ? { dag15MailVerzonden: args.dag15 } : {}),
      ...(args.dag28 !== undefined ? { dag28MailVerzonden: args.dag28 } : {}),
      ...(args.dag30 !== undefined ? { dag30MailVerzonden: args.dag30 } : {}),
      updatedAt: Date.now(),
    });
    return { email: args.email, verzonden, wachtrij: args.inhaalWachtrij ?? p.inhaalWachtrij ?? [] };
  },
});

/** Intern: haal één profiel op (voor admin-action). */
export const getProfielByIdInternal = internalQuery({
  args: { profileId: v.id("nietAlleenProfiles") },
  handler: async (ctx, args) => ctx.db.get(args.profileId),
});

/**
 * Stuur gemiste dagmails en/of speciale mails NU direct (gebundeld) na. Admin.
 * Voor de gespreide variant: gebruik queueInhaalDagen.
 */
export const stuurInhaalNu = action({
  args: {
    adminToken: v.string(),
    profileId: v.id("nietAlleenProfiles"),
    dagen: v.optional(v.array(v.number())),
    specials: v.optional(v.array(v.union(v.literal(15), v.literal(28), v.literal(30)))),
    metExcuus: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ verstuurd: number }> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const p = await ctx.runQuery(internal.nietAlleen.getProfielByIdInternal, { profileId: args.profileId });
    if (!p) throw new Error("Profiel niet gevonden");

    const wacht = () => new Promise((r) => setTimeout(r, 1200));
    let verstuurd = 0;
    let excuusGedaan = false;

    for (const dag of (args.dagen ?? []).slice().sort((a, b) => a - b)) {
      const metExcuus: boolean = args.metExcuus === true && !excuusGedaan;
      await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
        email: p.email,
        naam: p.naam,
        dagNummer: dag,
        verliesType: p.verliesType ?? "anders",
        verliesNaam: p.verliesNaam,
        metExcuus,
      });
      await ctx.runMutation(internal.nietAlleen.recordDagMailVerzonden, {
        profileId: args.profileId,
        dag,
        excuusGebruikt: metExcuus,
      });
      excuusGedaan = excuusGedaan || metExcuus;
      verstuurd++;
      await wacht();
    }

    for (const special of args.specials ?? []) {
      if (special === 15) {
        await ctx.runAction(internal.nietAlleenEmails.sendHalverwegeMail, { email: p.email, naam: p.naam });
      } else if (special === 28) {
        await ctx.runAction(internal.nietAlleenEmails.sendVoorbereidingsMail, { email: p.email, naam: p.naam });
      } else {
        const metExcuus: boolean = args.metExcuus === true && !excuusGedaan;
        await ctx.runAction(internal.nietAlleenEmails.sendAfsluitMail, {
          email: p.email,
          naam: p.naam,
          aantalDagenIngevuld: p.dagPrompts.length,
          metExcuus,
        });
        excuusGedaan = excuusGedaan || metExcuus;
      }
      await ctx.runMutation(internal.nietAlleen.markMailVerzonden, { profileId: args.profileId, dag: special });
      verstuurd++;
      await wacht();
    }

    return { verstuurd };
  },
});

/** Markeer een speciale mail als verzonden. */
export const markMailVerzonden = internalMutation({
  args: {
    profileId: v.id("nietAlleenProfiles"),
    dag: v.union(v.literal(15), v.literal(28), v.literal(30)),
  },
  handler: async (ctx, args) => {
    const patch =
      args.dag === 15
        ? { dag15MailVerzonden: true }
        : args.dag === 28
        ? { dag28MailVerzonden: true }
        : { dag30MailVerzonden: true };
    await ctx.db.patch(args.profileId, { ...patch, updatedAt: Date.now() });
  },
});

/** Sla een anker op voor de gebruiker (overschrijft vorig anker). */
export const saveAnker = mutation({
  args: { userId: v.string(), tekst: v.string(), dag: v.number() },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) throw new Error("Profiel niet gevonden");
    await ctx.db.patch(profiel._id, {
      nietAlleenAnker: {
        tekst: args.tekst,
        opgeslagenOpDag: args.dag,
        opgeslagenOp: Date.now(),
      },
      updatedAt: Date.now(),
    });
  },
});

/** Sla een terugblik op voor een specifieke dag (append of replace voor die dag). */
export const saveTerugblik = mutation({
  args: { userId: v.string(), dag: v.number(), tekst: v.string() },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) throw new Error("Profiel niet gevonden");
    const andereTerugblikken = (profiel.nietAlleenTerugblik ?? []).filter(
      (t) => t.dag !== args.dag
    );
    await ctx.db.patch(profiel._id, {
      nietAlleenTerugblik: [
        ...andereTerugblikken,
        { dag: args.dag, tekst: args.tekst, opgeslagenOp: Date.now() },
      ],
      updatedAt: Date.now(),
    });
  },
});

/** Voeg een dagnummer toe aan de gesloten oefeningen array. */
export const sluitOefening = mutation({
  args: { userId: v.string(), dag: v.number() },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) throw new Error("Profiel niet gevonden");
    const huidig = profiel.nietAlleenOefeningGesloten ?? [];
    if (huidig.includes(args.dag)) return;
    await ctx.db.patch(profiel._id, {
      nietAlleenOefeningGesloten: [...huidig, args.dag],
      updatedAt: Date.now(),
    });
  },
});

/** Geeft alle dag-foto-URL's terug voor een gebruiker (voor de dagboek-pagina). */
export const getAllDagFotoUrls = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("nietAlleenProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profiel) return [];
    const result: { dag: number; url: string | null }[] = [];
    for (const foto of profiel.dagFotos ?? []) {
      const url = await ctx.storage.getUrl(foto.storageId);
      result.push({ dag: foto.dag, url });
    }
    return result;
  },
});

/** Sluit een account na dag 37. */
export const sluitAccount = internalMutation({
  args: { profileId: v.id("nietAlleenProfiles") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      accountGesloten: true,
      dag37Verwerkt: true,
      updatedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────
// CRON HANDLER — dagelijkse verwerking
// ─────────────────────────────────────────

/**
 * Wordt dagelijks om 08:00 UTC aangeroepen vanuit crons.ts.
 * Stuurt dagelijkse e-mails en verwerkt dag 28 / 30 / 37 acties.
 */
// Ochtend (09:00 NL): dagelijkse herinneringsmails + account sluiten
export const processNietAlleenUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    const profielen = await ctx.runQuery(internal.nietAlleen.getAllActieveProfielen, {});
    const AUTO_INHAAL = 2; // automatisch hooguit vandaag + 1 recent gemiste dag (rest via admin-wachtrij)

    for (const profiel of profielen) {
      // Per profiel afschermen: een fout bij één klant mag de rest niet blokkeren.
      try {
        const dagNummer = Math.floor((Date.now() - profiel.startDatum) / (1000 * 60 * 60 * 24)) + 1;
        const verzonden = new Set(profiel.verzondenDagen ?? []);
        const eersteKeer = profiel.verzondenDagen === undefined;

        // Dagelijkse herinneringsmail (dag 1 t/m 30).
        if (dagNummer >= 1 && dagNummer <= 30) {
          const tot = Math.min(30, dagNummer);
          // Eerste keer zonder logboek: alleen vandaag (geen historische backfill).
          // Daarna: vandaag + hooguit AUTO_INHAAL-1 recent gemiste dagen automatisch inhalen.
          const van = eersteKeer ? tot : Math.max(1, tot - AUTO_INHAAL + 1);
          for (let dag = van; dag <= tot; dag++) {
            if (verzonden.has(dag)) continue;
            await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
              email: profiel.email,
              naam: profiel.naam,
              dagNummer: dag,
              verliesType: profiel.verliesType ?? "anders",
              verliesNaam: profiel.verliesNaam,
            });
            await ctx.runMutation(internal.nietAlleen.recordDagMailVerzonden, { profileId: profiel._id, dag });
          }

          // Inhaalwachtrij (admin-gevuld): 1 gemiste dag per run, gespreid, met excuus op de eerste.
          const wachtrij = (profiel.inhaalWachtrij ?? []).filter((d) => !verzonden.has(d)).sort((a, b) => a - b);
          if (wachtrij.length > 0) {
            const dag = wachtrij[0];
            const metExcuus = profiel.inhaalExcuusPending === true;
            await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
              email: profiel.email,
              naam: profiel.naam,
              dagNummer: dag,
              verliesType: profiel.verliesType ?? "anders",
              verliesNaam: profiel.verliesNaam,
              metExcuus,
            });
            await ctx.runMutation(internal.nietAlleen.recordDagMailVerzonden, {
              profileId: profiel._id,
              dag,
              excuusGebruikt: metExcuus,
            });
          }
        }

        // Dag 37: account sluiten (7 dagen na einde, zonder upgrade)
        if (dagNummer >= 37 && !profiel.dag37Verwerkt) {
          await ctx.runMutation(internal.nietAlleen.sluitAccount, { profileId: profiel._id });
        }
      } catch (err) {
        console.error(`Niet Alleen ochtend-mail mislukt voor ${profiel.email}:`, err);
        await ctx.runAction(internal.nietAlleenEmails.meldVerzendFout, {
          context: `Ochtend-dagmail voor ${profiel.email}`,
          detail: String(err),
        });
      }
    }
  },
});

// Avond (19:00 NL): speciale mails op dag 15, 28 en 30
export const processNietAlleenAvondMails = internalAction({
  args: {},
  handler: async (ctx) => {
    const profielen = await ctx.runQuery(internal.nietAlleen.getAllActieveProfielen, {});

    for (const profiel of profielen) {
      // Per profiel afschermen: een fout bij één klant mag de rest niet blokkeren.
      try {
        const dagNummer = Math.floor((Date.now() - profiel.startDatum) / (1000 * 60 * 60 * 24)) + 1;

        // Dag 15: halverwege check-in (eenmalig) — ook nog versturen als de dag net gemist is.
        if (dagNummer >= 15 && dagNummer < 28 && !profiel.dag15MailVerzonden) {
          await ctx.runAction(internal.nietAlleenEmails.sendHalverwegeMail, {
            email: profiel.email,
            naam: profiel.naam,
          });
          await ctx.runMutation(internal.nietAlleen.markMailVerzonden, { profileId: profiel._id, dag: 15 });
        }

        // Dag 28: voorbereidingsmail (eenmalig)
        if (dagNummer >= 28 && dagNummer < 30 && !profiel.dag28MailVerzonden) {
          await ctx.runAction(internal.nietAlleenEmails.sendVoorbereidingsMail, {
            email: profiel.email,
            naam: profiel.naam,
          });
          await ctx.runMutation(internal.nietAlleen.markMailVerzonden, { profileId: profiel._id, dag: 28 });
        }

        // Dag 30: afsluitmail met download (eenmalig)
        if (dagNummer >= 30 && !profiel.dag30MailVerzonden) {
          await ctx.runAction(internal.nietAlleenEmails.sendAfsluitMail, {
            email: profiel.email,
            naam: profiel.naam,
            aantalDagenIngevuld: profiel.dagPrompts.length,
          });
          await ctx.runMutation(internal.nietAlleen.markMailVerzonden, { profileId: profiel._id, dag: 30 });
        }
      } catch (err) {
        console.error(`Niet Alleen avond-mail mislukt voor ${profiel.email}:`, err);
        await ctx.runAction(internal.nietAlleenEmails.meldVerzendFout, {
          context: `Avond-mail (dag 15/28/30) voor ${profiel.email}`,
          detail: String(err),
        });
      }
    }
  },
});

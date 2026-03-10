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
import { internal } from "./_generated/api";
import { v } from "convex/values";

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
    verliesType: v.union(
      v.literal("persoon"),
      v.literal("huisdier"),
      v.literal("relatie"),
      v.literal("gezondheid"),
      v.literal("anders")
    ),
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

/** Activeer Niet Alleen account + stuur welkomstmail. Wordt aangeroepen vanuit /api/niet-alleen/activate. */
export const activeerEnStuurWelkom = action({
  args: { userId: v.string(), email: v.string(), naam: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.nietAlleen.activateNietAlleen, args);
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
      await ctx.db.patch(bestaand._id, {
        userId: args.userId,
        naam: args.naam,
        verliesType,
        startDatum,
        accountGesloten: false,
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
        createdAt: now,
        updatedAt: now,
      });
    }
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
export const processNietAlleenUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    const profielen = await ctx.runQuery(
      internal.nietAlleen.getAllActieveProfielen,
      {}
    );

    for (const profiel of profielen) {
      const dagNummer =
        Math.floor((Date.now() - profiel.startDatum) / (1000 * 60 * 60 * 24)) + 1;

      // Dagelijkse herinneringsmail (dag 1 t/m 30)
      if (dagNummer >= 1 && dagNummer <= 30) {
        await ctx.runAction(internal.nietAlleenEmails.sendDagMail, {
          email: profiel.email,
          naam: profiel.naam,
          dagNummer,
          verliesType: profiel.verliesType ?? "anders",
          verliesNaam: profiel.verliesNaam,
        });
      }

      // Dag 15: halverwege check-in (eenmalig)
      if (dagNummer === 15 && !profiel.dag15MailVerzonden) {
        await ctx.runAction(internal.nietAlleenEmails.sendHalverwegeMail, {
          email: profiel.email,
          naam: profiel.naam,
        });
        await ctx.runMutation(internal.nietAlleen.markMailVerzonden, {
          profileId: profiel._id,
          dag: 15,
        });
      }

      // Dag 28: voorbereidingsmail (eenmalig)
      if (dagNummer === 28 && !profiel.dag28MailVerzonden) {
        await ctx.runAction(internal.nietAlleenEmails.sendVoorbereidingsMail, {
          email: profiel.email,
          naam: profiel.naam,
        });
        await ctx.runMutation(internal.nietAlleen.markMailVerzonden, {
          profileId: profiel._id,
          dag: 28,
        });
      }

      // Dag 30: afsluitmail met download (eenmalig)
      if (dagNummer === 30 && !profiel.dag30MailVerzonden) {
        await ctx.runAction(internal.nietAlleenEmails.sendAfsluitMail, {
          email: profiel.email,
          naam: profiel.naam,
          aantalDagenIngevuld: profiel.dagPrompts.length,
        });
        await ctx.runMutation(internal.nietAlleen.markMailVerzonden, {
          profileId: profiel._id,
          dag: 30,
        });
      }

      // Dag 37: account sluiten (7 dagen na einde, zonder upgrade)
      if (dagNummer >= 37 && !profiel.dag37Verwerkt) {
        await ctx.runMutation(internal.nietAlleen.sluitAccount, {
          profileId: profiel._id,
        });
      }
    }
  },
});

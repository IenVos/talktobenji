/**
 * Verliestypen — beheerbare lijst voor Niet Alleen mailreeksen.
 * Bepaalt welke opties beschikbaar zijn in de checkout admin dropdown
 * en welke tabs zichtbaar zijn in de email admin.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
import { NIET_ALLEEN_CONTENT, type NietAlleenVerliesType } from "./nietAlleenContent";

const INGEBOUWDE_TYPEN = [
  { code: "persoon", naam: "Persoon — verlies van iemand" },
  { code: "huisdier", naam: "Huisdier — verlies van een dier" },
  { code: "scheiding", naam: "Scheiding — einde van een relatie" },
];

/** Alle verliestypen ophalen (publiek — voor onboarding in de app) */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const opgeslagen = await ctx.db.query("verliesTypen").order("asc").collect();
    if (opgeslagen.length === 0) return INGEBOUWDE_TYPEN.map(t => ({ ...t, keuzePaginaLabel: undefined, keuzePaginaEmoji: undefined, keuzePaginaLpSlug: undefined }));
    return opgeslagen.map(t => ({
      code: t.code,
      naam: t.naam,
      keuzePaginaLabel: t.keuzePaginaLabel,
      keuzePaginaEmoji: t.keuzePaginaEmoji,
      keuzePaginaLpSlug: t.keuzePaginaLpSlug,
    }));
  },
});

/** Alle verliestypen ophalen (admin) */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const opgeslagen = await ctx.db.query("verliesTypen").order("asc").collect();

    // Als de tabel nog leeg is, geef ingebouwde typen terug als fallback
    if (opgeslagen.length === 0) return INGEBOUWDE_TYPEN.map(t => ({ ...t, _id: null, createdAt: 0 }));
    return opgeslagen;
  },
});

/** Nieuw verliestype aanmaken (admin) */
export const create = mutation({
  args: {
    adminToken: v.string(),
    code: v.string(),
    naam: v.string(),
    keuzePaginaLabel: v.optional(v.string()),
    keuzePaginaEmoji: v.optional(v.string()),
    keuzePaginaLpSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    // Dubbele code voorkomen
    const bestaand = await ctx.db
      .query("verliesTypen")
      .withIndex("by_code", q => q.eq("code", args.code))
      .first();
    if (bestaand) throw new Error(`Verliestype "${args.code}" bestaat al`);

    return await ctx.db.insert("verliesTypen", {
      code: args.code.toLowerCase().trim().replace(/\s+/g, "_"),
      naam: args.naam.trim(),
      createdAt: Date.now(),
      ...(args.keuzePaginaLabel ? { keuzePaginaLabel: args.keuzePaginaLabel } : {}),
      ...(args.keuzePaginaEmoji ? { keuzePaginaEmoji: args.keuzePaginaEmoji } : {}),
      ...(args.keuzePaginaLpSlug ? { keuzePaginaLpSlug: args.keuzePaginaLpSlug } : {}),
    });
  },
});

/** Keuzepagina-velden updaten voor bestaand type (admin) */
export const updateKeuzePagina = mutation({
  args: {
    adminToken: v.string(),
    code: v.string(),
    keuzePaginaLabel: v.optional(v.string()),
    keuzePaginaEmoji: v.optional(v.string()),
    keuzePaginaLpSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const item = await ctx.db.query("verliesTypen").withIndex("by_code", q => q.eq("code", args.code)).first();
    if (!item) throw new Error(`Verliestype "${args.code}" niet gevonden`);
    await ctx.db.patch(item._id, {
      keuzePaginaLabel: args.keuzePaginaLabel || undefined,
      keuzePaginaEmoji: args.keuzePaginaEmoji || undefined,
      keuzePaginaLpSlug: args.keuzePaginaLpSlug || undefined,
    });
  },
});

/** Verliestype verwijderen (admin) */
export const remove = mutation({
  args: { adminToken: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const item = await ctx.db
      .query("verliesTypen")
      .withIndex("by_code", q => q.eq("code", args.code))
      .first();
    if (item) await ctx.db.delete(item._id);
  },
});

/**
 * Dupliceer de emailreeks van een bestaand verliestype naar een nieuw type.
 * Gebruikt opgeslagen overrides als die er zijn, anders de ingebouwde standaardtekst.
 */
export const dupliceerReeks = mutation({
  args: {
    adminToken: v.string(),
    bronCode: v.string(),   // verliestype om van te kopiëren, bijv. "persoon"
    nieuwCode: v.string(),  // code voor het nieuwe type, bijv. "werkloosheid"
    nieuwNaam: v.string(),  // weergavenaam, bijv. "Werkloosheid — verlies van werk"
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const nieuwCode = args.nieuwCode.toLowerCase().trim().replace(/\s+/g, "_");

    // Maak het nieuwe verliestype aan (gooit fout als het al bestaat)
    const bestaand = await ctx.db
      .query("verliesTypen")
      .withIndex("by_code", q => q.eq("code", nieuwCode))
      .first();
    if (bestaand) throw new Error(`Verliestype "${nieuwCode}" bestaat al`);

    await ctx.db.insert("verliesTypen", {
      code: nieuwCode,
      naam: args.nieuwNaam.trim(),
      createdAt: Date.now(),
    });

    // Haal bestaande overrides op voor de bron
    const bronOverrides = await ctx.db.query("nietAlleenDagTemplates").collect();
    const bronMap = new Map(
      bronOverrides
        .filter(t => t.verliesType === args.bronCode)
        .map(t => [t.dag, { subject: t.subject, mailTekst: t.mailTekst }])
    );

    // Kopieer alle 30 dagen
    const bronNiche = (
      args.bronCode === "huisdier" ? "huisdier" :
      args.bronCode === "scheiding" || args.bronCode === "relatie" ? "scheiding" :
      "persoon"
    ) as NietAlleenVerliesType;

    const now = Date.now();
    for (const dagInhoud of NIET_ALLEEN_CONTENT) {
      const dag = dagInhoud.dag;
      const override = bronMap.get(dag);
      const subject = override?.subject ?? dagInhoud.subject;
      const mailTekst = override?.mailTekst ?? dagInhoud.mail[bronNiche];

      // Sla op als override voor het nieuwe type
      const bestaandNieuw = await ctx.db
        .query("nietAlleenDagTemplates")
        .withIndex("by_dag_type", q => q.eq("dag", dag).eq("verliesType", nieuwCode))
        .unique();

      if (bestaandNieuw) {
        await ctx.db.patch(bestaandNieuw._id, { subject, mailTekst, updatedAt: now });
      } else {
        await ctx.db.insert("nietAlleenDagTemplates", {
          dag,
          verliesType: nieuwCode,
          subject,
          mailTekst,
          updatedAt: now,
        });
      }
    }

    return nieuwCode;
  },
});

/** Seed de tabel met de drie ingebouwde typen — voegt alleen ontbrekende toe */
export const seed = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    let toegevoegd = 0;
    for (const t of INGEBOUWDE_TYPEN) {
      const bestaand = await ctx.db
        .query("verliesTypen")
        .withIndex("by_code", q => q.eq("code", t.code))
        .first();
      if (!bestaand) {
        await ctx.db.insert("verliesTypen", { ...t, createdAt: Date.now() });
        toegevoegd++;
      }
    }
    return toegevoegd === 0 ? "Al gevuld" : `${toegevoegd} type(n) toegevoegd`;
  },
});

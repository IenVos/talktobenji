/**
 * Mensen om je heen — paginateksten, categorieën en initiatieven
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

// ─── Paginateksten (singleton) ───────────────────────────────────────────────

/** Haal de paginateksten op (publiek). */
export const getPaginaTeksten = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("mensenopmjeheen_pagina").collect();
    return docs[0] ?? null;
  },
});

/** Sla paginateksten op — insert als nog niet bestaat, vervang als al bestaat. */
export const upsertPaginaTeksten = mutation({
  args: {
    adminToken: v.string(),
    hero_titel: v.string(),
    hero_subtitel: v.string(),
    slot_tekst: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, ...data } = args;
    const docs = await ctx.db.query("mensenopmjeheen_pagina").collect();
    if (docs.length > 0) {
      await ctx.db.replace(docs[0]._id, data);
    } else {
      await ctx.db.insert("mensenopmjeheen_pagina", data);
    }
  },
});

// ─── Categorieën ─────────────────────────────────────────────────────────────

/** Haal alle categorieën op, gesorteerd op volgorde (publiek). */
export const listCategorieen = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("mensenopmjeheen_categorieen").collect();
    return items.sort((a, b) => a.volgorde - b.volgorde);
  },
});

/** Maak een categorie aan of pas een bestaande aan. */
export const upsertCategorie = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("mensenopmjeheen_categorieen")),
    naam: v.string(),
    volgorde: v.number(),
    zichtbaar: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    } else {
      return ctx.db.insert("mensenopmjeheen_categorieen", data);
    }
  },
});

/** Verwijder een categorie én alle bijbehorende initiatieven. */
export const deleteCategorie = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("mensenopmjeheen_categorieen"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const initiatieven = await ctx.db.query("mensenopmjeheen_initiatieven").collect();
    for (const init of initiatieven) {
      if (init.categorie_id === args.id) {
        await ctx.db.delete(init._id);
      }
    }
    await ctx.db.delete(args.id);
  },
});

// ─── Initiatieven ─────────────────────────────────────────────────────────────

/** Haal alle initiatieven op, optioneel gefilterd op categorie_id (publiek). */
export const listInitiatieven = query({
  args: {
    categorie_id: v.optional(v.id("mensenopmjeheen_categorieen")),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("mensenopmjeheen_initiatieven").collect();
    const filtered = args.categorie_id
      ? items.filter((i) => i.categorie_id === args.categorie_id)
      : items;
    return filtered.sort((a, b) => a.volgorde - b.volgorde);
  },
});

/** Maak een initiatief aan of pas een bestaand aan. */
export const upsertInitiatief = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("mensenopmjeheen_initiatieven")),
    categorie_id: v.id("mensenopmjeheen_categorieen"),
    naam: v.string(),
    beschrijving: v.string(),
    url: v.string(),
    volgorde: v.number(),
    zichtbaar: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    } else {
      return ctx.db.insert("mensenopmjeheen_initiatieven", data);
    }
  },
});

/** Verwijder één initiatief. */
export const deleteInitiatief = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("mensenopmjeheen_initiatieven"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

// ─── Seed data ────────────────────────────────────────────────────────────────

/** Voeg begindata in — alleen als er nog geen categorieën zijn. */
export const seedData = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaand = await ctx.db.query("mensenopmjeheen_categorieen").collect();
    if (bestaand.length > 0) return { skipped: true };

    const cat1 = await ctx.db.insert("mensenopmjeheen_categorieen", {
      naam: "Na het overlijden van iemand",
      volgorde: 1,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat1,
      naam: "Rouwcafé",
      beschrijving: "Laagdrempelige bijeenkomsten door heel Nederland en België, zonder aanmelding of intake",
      url: "https://rouwcafe.nl",
      volgorde: 1,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat1,
      naam: "SteunPunt Rouw",
      beschrijving: "Voor wie professionele begeleiding zoekt maar niet weet waar te beginnen",
      url: "https://steunpuntrouw.nl",
      volgorde: 2,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat1,
      naam: "In de Wolken",
      beschrijving: "Online community voor nabestaanden, ook voor wie moeite heeft de deur uit te gaan",
      url: "https://indewolken.nl",
      volgorde: 3,
      zichtbaar: true,
    });

    const cat2 = await ctx.db.insert("mensenopmjeheen_categorieen", {
      naam: "Na het verlies van een dier",
      volgorde: 2,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat2,
      naam: "Petloss Nederland",
      beschrijving: "Forum en steungroep specifiek voor mensen die een dier verloren",
      url: "https://petloss.nl",
      volgorde: 1,
      zichtbaar: true,
    });

    const cat3 = await ctx.db.insert("mensenopmjeheen_categorieen", {
      naam: "Na zwangerschapsverlies of ongewenste kinderloosheid",
      volgorde: 3,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat3,
      naam: "Freya",
      beschrijving: "Vereniging voor mensen met vruchtbaarheidsproblemen en ongewenste kinderloosheid",
      url: "https://freya.nl",
      volgorde: 1,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat3,
      naam: "FIOM",
      beschrijving: "Begeleiding en lotgenotencontact rond zwangerschapsverlies en adoptie",
      url: "https://fiom.nl",
      volgorde: 2,
      zichtbaar: true,
    });

    const cat4 = await ctx.db.insert("mensenopmjeheen_categorieen", {
      naam: "Na een scheiding of relatiebreuk",
      volgorde: 4,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat4,
      naam: "Steun & Vooruit",
      beschrijving: "Voor jongvolwassenen na verlies, inclusief relatieverlies",
      url: "https://steunvooruit.nl",
      volgorde: 1,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat4,
      naam: "Villa Pinedo",
      beschrijving: "Voor kinderen en jongeren van gescheiden ouders",
      url: "https://villapinedo.nl",
      volgorde: 2,
      zichtbaar: true,
    });

    const cat5 = await ctx.db.insert("mensenopmjeheen_categorieen", {
      naam: "Na verlies van werk, gezondheid of identiteit",
      volgorde: 5,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat5,
      naam: "Kanker.nl community",
      beschrijving: "Voor wie met ziekte te maken heeft",
      url: "https://kanker.nl",
      volgorde: 1,
      zichtbaar: true,
    });
    await ctx.db.insert("mensenopmjeheen_initiatieven", {
      categorie_id: cat5,
      naam: "Mind Korrelatie",
      beschrijving: "Laagdrempelige online hulp bij levensvragen en identiteitsverlies",
      url: "https://mindkorrelatie.nl",
      volgorde: 2,
      zichtbaar: true,
    });

    return { skipped: false };
  },
});

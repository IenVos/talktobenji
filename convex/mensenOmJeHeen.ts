/**
 * Mensen om je heen — paginateksten, categorieën en initiatieven
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

// ─── T2P Filterbuttons ────────────────────────────────────────────────────────

export const listFilterButtons = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("t2p_filterbuttons").collect();
  },
});

export const upsertFilterButton = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("t2p_filterbuttons")),
    tagId: v.string(),
    tekst: v.string(),
    iconNaam: v.string(),
    volgorde: v.number(),
    zichtbaar: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return ctx.db.insert("t2p_filterbuttons", data);
  },
});

export const deleteFilterButton = mutation({
  args: { adminToken: v.string(), id: v.id("t2p_filterbuttons") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

export const seedFilterButtons = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaand = await ctx.db.query("t2p_filterbuttons").collect();
    if (bestaand.length > 0) return;
    const defaults = [
      { tagId: "lezen",  tekst: "Ik wil anoniem lezen wat anderen meemaken", iconNaam: "blog",  volgorde: 1, zichtbaar: true },
      { tagId: "praten", tekst: "Ik wil met iemand praten maar weet niet hoe ik moet beginnen", iconNaam: "chat",  volgorde: 2, zichtbaar: true },
      { tagId: "groep",  tekst: "Ik ben op zoek naar iets om te doen waarmee ik weer contact kan maken met anderen.", iconNaam: "users", volgorde: 3, zichtbaar: true },
      { tagId: "ander",  tekst: "Ik wil graag weten hoe ik iemand anders kan helpen.", iconNaam: "heart", volgorde: 4, zichtbaar: true },
    ];
    for (const d of defaults) await ctx.db.insert("t2p_filterbuttons", d);
  },
});

// ─── Paginateksten (singleton) ───────────────────────────────────────────────

export const getPaginaTeksten = query({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    const docs = await ctx.db.query("mensenopmjeheen_pagina").collect();
    return docs[0] ?? null;
  },
});

export const upsertPaginaTeksten = mutation({
  args: {
    adminToken: v.string(),
    hero_titel: v.string(),
    hero_subtitel: v.string(),
    filter_lezen: v.optional(v.string()),
    filter_praten: v.optional(v.string()),
    filter_groep: v.optional(v.string()),
    filter_ander: v.optional(v.string()),
    filter_ander_blok_titel: v.optional(v.string()),
    filter_ander_blok_tekst: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, ...data } = args;
    const docs = await ctx.db.query("mensenopmjeheen_pagina").collect();
    if (docs.length > 0) {
      await ctx.db.patch(docs[0]._id, data);
    } else {
      await ctx.db.insert("mensenopmjeheen_pagina", data);
    }
  },
});

// ─── Categorieën ─────────────────────────────────────────────────────────────

export const listCategorieen = query({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    const items = await ctx.db.query("mensenopmjeheen_categorieen").collect();
    const sorted = items.sort((a, b) => a.volgorde - b.volgorde);
    const withUrls = await Promise.all(
      sorted.map(async (item) => ({
        ...item,
        imageUrl: item.imageStorageId
          ? await ctx.storage.getUrl(item.imageStorageId)
          : null,
      }))
    );
    return withUrls;
  },
});

export const upsertCategorie = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("mensenopmjeheen_categorieen")),
    naam: v.string(),
    volgorde: v.number(),
    zichtbaar: v.boolean(),
    imageStorageId: v.optional(v.id("_storage")),
    filterTags: v.optional(v.array(v.string())),
    emoji: v.optional(v.string()),
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

export const removeCategoriAfbeelding = mutation({
  args: { adminToken: v.string(), id: v.id("mensenopmjeheen_categorieen") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, { imageStorageId: undefined });
  },
});

export const removeInitiatiefAfbeelding = mutation({
  args: { adminToken: v.string(), id: v.id("mensenopmjeheen_initiatieven") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, { imageStorageId: undefined });
  },
});

// ─── Upload URL ───────────────────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── Initiatieven ─────────────────────────────────────────────────────────────

export const listInitiatieven = query({
  args: {
    adminToken: v.optional(v.string()),
    categorie_id: v.optional(v.id("mensenopmjeheen_categorieen")),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("mensenopmjeheen_initiatieven").collect();
    const filtered = args.categorie_id
      ? items.filter((i) => i.categorie_id === args.categorie_id)
      : items;
    const sorted = filtered.sort((a, b) => a.volgorde - b.volgorde);
    return await Promise.all(
      sorted.map(async (item) => ({
        ...item,
        imageUrl: item.imageStorageId
          ? await ctx.storage.getUrl(item.imageStorageId)
          : null,
      }))
    );
  },
});

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
    imageStorageId: v.optional(v.id("_storage")),
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

export const seedData = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaand = await ctx.db.query("mensenopmjeheen_categorieen").collect();
    if (bestaand.length > 0) return { skipped: true };

    const cat1 = await ctx.db.insert("mensenopmjeheen_categorieen", { naam: "Na het overlijden van iemand", volgorde: 1, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat1, naam: "Rouwcafé", beschrijving: "Laagdrempelige bijeenkomsten door heel Nederland en België, zonder aanmelding of intake", url: "https://rouwcafe.nl", volgorde: 1, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat1, naam: "SteunPunt Rouw", beschrijving: "Voor wie professionele begeleiding zoekt maar niet weet waar te beginnen", url: "https://steunpuntrouw.nl", volgorde: 2, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat1, naam: "In de Wolken", beschrijving: "Online community voor nabestaanden, ook voor wie moeite heeft de deur uit te gaan", url: "https://indewolken.nl", volgorde: 3, zichtbaar: true });

    const cat2 = await ctx.db.insert("mensenopmjeheen_categorieen", { naam: "Na het verlies van een dier", volgorde: 2, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat2, naam: "Petloss Nederland", beschrijving: "Forum en steungroep specifiek voor mensen die een dier verloren", url: "https://petloss.nl", volgorde: 1, zichtbaar: true });

    const cat3 = await ctx.db.insert("mensenopmjeheen_categorieen", { naam: "Na zwangerschapsverlies of ongewenste kinderloosheid", volgorde: 3, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat3, naam: "Freya", beschrijving: "Vereniging voor mensen met vruchtbaarheidsproblemen en ongewenste kinderloosheid", url: "https://freya.nl", volgorde: 1, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat3, naam: "FIOM", beschrijving: "Begeleiding en lotgenotencontact rond zwangerschapsverlies en adoptie", url: "https://fiom.nl", volgorde: 2, zichtbaar: true });

    const cat4 = await ctx.db.insert("mensenopmjeheen_categorieen", { naam: "Na een scheiding of relatiebreuk", volgorde: 4, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat4, naam: "Steun & Vooruit", beschrijving: "Voor jongvolwassenen na verlies, inclusief relatieverlies", url: "https://steunvooruit.nl", volgorde: 1, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat4, naam: "Villa Pinedo", beschrijving: "Voor kinderen en jongeren van gescheiden ouders", url: "https://villapinedo.nl", volgorde: 2, zichtbaar: true });

    const cat5 = await ctx.db.insert("mensenopmjeheen_categorieen", { naam: "Na verlies van werk, gezondheid of identiteit", volgorde: 5, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat5, naam: "Kanker.nl community", beschrijving: "Voor wie met ziekte te maken heeft", url: "https://kanker.nl", volgorde: 1, zichtbaar: true });
    await ctx.db.insert("mensenopmjeheen_initiatieven", { categorie_id: cat5, naam: "Mind Korrelatie", beschrijving: "Laagdrempelige online hulp bij levensvragen en identiteitsverlies", url: "https://mindkorrelatie.nl", volgorde: 2, zichtbaar: true });

    return { skipped: false };
  },
});

/**
 * Blok-gebaseerde landingspagina's.
 *
 * Eén pagina bestaat uit een geordende lijst blokken (blocksJson). Elk blok:
 *   { key: string, type: string, verborgen?: boolean, achtergrond?: string, ...velden }
 *
 * Afbeeldingen in blokken zijn strings:
 *   - een publiek pad, bv. "/images/ien-founder.png"
 *   - of "storage:<id>" bij een upload via de admin
 * In getBySlug/getForAdmin worden "storage:<id>"-strings omgezet naar een URL.
 *
 * Rich tekst: sommige velden ondersteunen **vet** (mini-markdown), dat de
 * renderer omzet naar een accent-gemarkeerd stuk.
 *
 * Achtergrond-namen per blok: "" (standaard grond) | "paper" | "wit" | "band"
 * (donkergroene volle band).
 */
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { checkAdmin } from "./adminAuth";

// ── Afbeeldingen resolven ──────────────────────────────────────────────
const STORAGE_PREFIX = "storage:";

function collectRefs(value: any, out: Set<string>) {
  if (typeof value === "string") {
    if (value.startsWith(STORAGE_PREFIX)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v2 of value) collectRefs(v2, out);
  } else if (value && typeof value === "object") {
    for (const k of Object.keys(value)) collectRefs(value[k], out);
  }
}

function replaceRefs(value: any, map: Record<string, string | null>): any {
  if (typeof value === "string") {
    if (value.startsWith(STORAGE_PREFIX)) return map[value] ?? "";
    return value;
  }
  if (Array.isArray(value)) return value.map((v2) => replaceRefs(v2, map));
  if (value && typeof value === "object") {
    const o: any = {};
    for (const k of Object.keys(value)) o[k] = replaceRefs(value[k], map);
    return o;
  }
  return value;
}

async function buildRefMap(ctx: any, blocks: any): Promise<Record<string, string | null>> {
  const refs = new Set<string>();
  collectRefs(blocks, refs);
  const map: Record<string, string | null> = {};
  for (const ref of refs) {
    const id = ref.slice(STORAGE_PREFIX.length);
    map[ref] = await ctx.storage.getUrl(id).catch(() => null);
  }
  return map;
}

// ── Publieke query (alleen gepubliceerd) ───────────────────────────────
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!page || !page.gepubliceerd) return null;
    let blocks: any[] = [];
    try { blocks = JSON.parse(page.blocksJson); } catch { blocks = []; }
    blocks = blocks.filter((b) => b && !b.verborgen);
    const map = await buildRefMap(ctx, blocks);
    return {
      slug: page.slug,
      pageTitle: page.pageTitle,
      metaDescription: page.metaDescription ?? null,
      blocks: replaceRefs(blocks, map),
    };
  },
});

// ── Admin-query (ook concept + ruwe blokken voor de editor) ────────────
export const getForAdmin = query({
  args: { adminToken: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const page = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!page) return null;
    let blocks: any[] = [];
    try { blocks = JSON.parse(page.blocksJson); } catch { blocks = []; }
    const map = await buildRefMap(ctx, blocks);
    return {
      _id: page._id,
      slug: page.slug,
      naam: page.naam,
      pageTitle: page.pageTitle,
      verliestype: page.verliestype ?? "",
      gepubliceerd: page.gepubliceerd,
      metaDescription: page.metaDescription ?? "",
      blocks,            // ruw (met "storage:<id>")
      imageUrls: map,    // "storage:<id>" -> url, voor previews
    };
  },
});

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const pages = await ctx.db.query("blokPaginas").collect();
    return pages
      .map((p) => ({
        _id: p._id,
        slug: p.slug,
        naam: p.naam,
        pageTitle: p.pageTitle,
        verliestype: p.verliestype ?? "",
        gepubliceerd: p.gepubliceerd,
        updatedAt: p.updatedAt,
      }))
      .sort((a, b) => a.naam.localeCompare(b.naam));
  },
});

// Lichte publieke meta (verliestype) voor het intake-formulier, ook bij concept.
export const intakeMeta = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!p) return null;
    return { naam: p.naam, verliestype: p.verliestype ?? "" };
  },
});

// ── Opslaan ────────────────────────────────────────────────────────────
export const save = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("blokPaginas")),
    slug: v.string(),
    naam: v.string(),
    pageTitle: v.string(),
    verliestype: v.optional(v.string()),
    gepubliceerd: v.boolean(),
    metaDescription: v.optional(v.string()),
    blocksJson: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Slug-uniekheid bewaken (behalve voor de pagina zelf).
    const bestaand = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (bestaand && bestaand._id !== args.id) {
      throw new Error(`Slug "${args.slug}" is al in gebruik.`);
    }
    const data = {
      slug: args.slug,
      naam: args.naam,
      pageTitle: args.pageTitle,
      verliestype: args.verliestype,
      gepubliceerd: args.gepubliceerd,
      metaDescription: args.metaDescription,
      blocksJson: args.blocksJson,
      updatedAt: Date.now(),
    };
    if (args.id) {
      await ctx.db.patch(args.id, data);
      return args.id;
    }
    return ctx.db.insert("blokPaginas", data);
  },
});

// ── Dupliceren (voor een nieuw verliestype) ────────────────────────────
export const dupliceer = mutation({
  args: {
    adminToken: v.string(),
    bronId: v.id("blokPaginas"),
    nieuweSlug: v.string(),
    nieuweNaam: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bron = await ctx.db.get(args.bronId);
    if (!bron) throw new Error("Bronpagina niet gevonden.");
    const bestaand = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", args.nieuweSlug))
      .first();
    if (bestaand) throw new Error(`Slug "${args.nieuweSlug}" is al in gebruik.`);
    return ctx.db.insert("blokPaginas", {
      slug: args.nieuweSlug,
      naam: args.nieuweNaam,
      pageTitle: bron.pageTitle,
      verliestype: bron.verliestype,
      gepubliceerd: false, // nieuwe kopie staat op concept
      metaDescription: bron.metaDescription,
      blocksJson: bron.blocksJson,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("blokPaginas") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = mutation({
  args: { adminToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.getUrl(args.storageId);
  },
});

// ── Intake-inzendingen ─────────────────────────────────────────────────
export const intakes = query({
  args: { adminToken: v.string(), slug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    let rows;
    if (args.slug) {
      rows = await ctx.db
        .query("blokIntakes")
        .withIndex("by_slug", (q) => q.eq("paginaSlug", args.slug as string))
        .collect();
    } else {
      rows = await ctx.db.query("blokIntakes").collect();
    }
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        _id: r._id,
        paginaSlug: r.paginaSlug,
        naam: r.naam,
        email: r.email,
        status: r.status ?? "nieuw",
        createdAt: r.createdAt,
        velden: (() => { try { return JSON.parse(r.veldenJson); } catch { return {}; } })(),
      }));
  },
});

export const verstuurIntake = mutation({
  args: {
    paginaSlug: v.string(),
    naam: v.string(),
    email: v.string(),
    veldenJson: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("blokIntakes", {
      paginaSlug: args.paginaSlug,
      naam: args.naam.trim(),
      email: args.email.trim(),
      veldenJson: args.veldenJson,
      status: "nieuw",
      createdAt: Date.now(),
    });
    // Naam van de pagina erbij zoeken voor een nette mail.
    const pagina = await ctx.db
      .query("blokPaginas")
      .withIndex("by_slug", (q) => q.eq("slug", args.paginaSlug))
      .first();
    await ctx.scheduler.runAfter(0, internal.blokPaginas.mailIntake, {
      paginaNaam: pagina?.naam ?? args.paginaSlug,
      naam: args.naam.trim(),
      email: args.email.trim(),
      veldenJson: args.veldenJson,
    });
    return id;
  },
});

// ── Intake-mails (seintje Ien + bevestiging aanmelder) ─────────────────
const INTAKE_FROM = "Talk To Benji <noreply@talktobenji.com>";
const INTAKE_IEN = process.env.BOOKING_ADMIN_EMAIL || "contactmetien@talktobenji.com";

function intakeWrap(inner: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212b24;background:#f4f6f1;padding:32px 24px;border-radius:14px">${inner}<p style="font-size:12px;color:#7c8a7f;margin-top:24px">Talk To Benji &middot; Zij aan Zij</p></div>`;
}
async function intakeVerstuur(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from: INTAKE_FROM, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Mail mislukt: ${await res.text()}`);
}

export const mailIntake = internalAction({
  args: {
    paginaNaam: v.string(),
    naam: v.string(),
    email: v.string(),
    veldenJson: v.string(),
  },
  handler: async (_ctx, args) => {
    let velden: Record<string, any> = {};
    try { velden = JSON.parse(args.veldenJson); } catch {}
    const rijen = Object.keys(velden)
      .filter((k) => velden[k] !== "" && velden[k] != null)
      .map((k) => `<tr><td style="padding:4px 10px 4px 0;color:#7c8a7f;vertical-align:top;font-size:13px">${k}</td><td style="padding:4px 0;color:#212b24;font-size:14px">${String(velden[k]).replace(/\n/g, "<br>")}</td></tr>`)
      .join("");
    // Seintje aan Ien
    await intakeVerstuur(
      INTAKE_IEN,
      `Nieuwe aanmelding: ${args.naam} (${args.paginaNaam})`,
      intakeWrap(`
        <p style="font-size:15px;color:#212b24"><b>Nieuwe kennismaking-aanvraag</b> via ${args.paginaNaam}</p>
        <p style="font-size:14px;color:#485349">${args.naam} &middot; <a href="mailto:${args.email}" style="color:#3b6448">${args.email}</a></p>
        <table style="border-collapse:collapse;margin-top:10px">${rijen}</table>`)
    );
    // Bevestiging aan de aanmelder
    await intakeVerstuur(
      args.email,
      "Je bericht is bij Ien binnen",
      intakeWrap(`
        <p style="font-size:17px;color:#212b24"><b>Dank je wel. Het is bij me binnen.</b></p>
        <p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${args.naam}, ik lees je bericht zelf, rustig, en neem binnen twee werkdagen contact met je op.</p>
        <p style="font-size:15px;line-height:1.7;color:#485349">Mocht het tot die tijd zwaar worden: Benji is er dag en nacht.</p>
        <p style="font-size:15px;line-height:1.7;color:#485349">Warme groet,<br>Ien</p>`)
    );
  },
});

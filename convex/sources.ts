/**
 * Bronnen (RAG): PDF's, URL's, handleidingen
 * De bot gebruikt deze als extra context wanneer het antwoord niet in de vaste Q&A staat.
 */
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
import { api } from "./_generated/api";

/** Haal alle actieve bronnen op (voor de AI) */
export const getActiveSources = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("sources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

/** Haal alle bronnen op (voor admin) */
export const getAllSources = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("sources").order("desc").collect();
  },
});

/** Genereer upload-URL voor PDF */
export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Voeg bron toe na PDF-upload */
export const addPdfSource = mutation({
  args: {
    adminToken: v.string(),
    title: v.string(),
    storageId: v.id("_storage"),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("sources", {
      title: args.title.trim(),
      type: "pdf",
      storageId: args.storageId,
      extractedText: args.extractedText,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Voeg URL-bron toe (tekst komt van action) */
export const addUrlSource = mutation({
  args: {
    adminToken: v.string(),
    title: v.string(),
    url: v.string(),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("sources", {
      title: args.title.trim(),
      type: "url",
      url: args.url.trim(),
      extractedText: args.extractedText,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Verwijder bron */
export const deleteSource = mutation({
  args: { adminToken: v.string(), id: v.id("sources") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const doc = await ctx.db.get(args.id);
    if (doc?.storageId) {
      try { await ctx.storage.delete(doc.storageId); } catch {}
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/** Activeer/deactiveer bron */
export const setSourceActive = mutation({
  args: { adminToken: v.string(), id: v.id("sources"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

/** Haal tekst uit URL (action - heeft netwerktoegang) */
export const fetchAndExtractUrl = action({
  args: { adminToken: v.string(), url: v.string() },
  handler: async (ctx, args): Promise<{ text: string; title: string }> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const urlStr = args.url.trim();
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      throw new Error("Ongeldige URL. Gebruik http:// of https://");
    }

    const res = await fetch(urlStr, {
      headers: {
        "User-Agent": "TalkToBenji-Bot/1.0 (knowledge extraction)",
      },
    });

    if (!res.ok) {
      throw new Error(`Kon URL niet ophalen: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const text = stripHtml(html);
    const title = extractTitle(html) || new URL(urlStr).hostname;

    if (text.length < 50) {
      throw new Error("Te weinig tekst gevonden op deze pagina. Controleer of de URL correct is.");
    }

    return { text: text.slice(0, 100000), title };
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim().slice(0, 200) : null;
}

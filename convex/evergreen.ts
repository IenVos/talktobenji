/**
 * Evergreen funnel-bouwer — Convex-kant (stap 3).
 *
 * Blokken (thema's) met daarin mails op een dagoffset. Elke lead heeft een eigen
 * dag 1 (zie funnelLeads); de reeks staat stil, de mensen bewegen erdoorheen.
 * Dit bestand beheert alleen de opbouw. Er verstuurt nog niets: de dagelijkse
 * cron en de verzending komen in stap 4. Zie PLAN_EVERGREEN_FUNNEL.md.
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./adminAuth";

// ── Lezen ────────────────────────────────────────────────────────────────────

/** Alle blokken op volgorde, elk met hun mails (op dagoffset). Voor de admin. */
export const blokkenMetMails = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [blokken, mails] = await Promise.all([
      ctx.db.query("funnelBlokken").withIndex("by_volgorde").collect(),
      ctx.db.query("funnelMails").collect(),
    ]);
    blokken.sort((a, b) => a.volgorde - b.volgorde);
    return blokken.map((b) => ({
      ...b,
      mails: mails
        .filter((m) => m.blokId === b._id)
        .sort((x, y) => x.dagOffset - y.dagOffset),
    }));
  },
});

/**
 * Tijdlijn: alle actieve mails (in actieve blokken) op dagvolgorde, zodat je ziet
 * wat een lead in welke volgorde krijgt. Varianten per verliestype worden samen
 * op hun dag getoond.
 */
export const tijdlijn = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [blokken, mails] = await Promise.all([
      ctx.db.query("funnelBlokken").collect(),
      ctx.db.query("funnelMails").collect(),
    ]);
    const blokById = new Map(blokken.map((b) => [b._id, b]));
    return mails
      .filter((m) => {
        const b = blokById.get(m.blokId);
        return m.actief && b && b.actief;
      })
      .map((m) => {
        const b = blokById.get(m.blokId)!;
        return {
          dagOffset: m.dagOffset,
          subject: m.subject,
          blokNaam: b.naam,
          verliesType: m.verliesType ?? null,
        };
      })
      .sort((a, b) => a.dagOffset - b.dagOffset || a.blokNaam.localeCompare(b.blokNaam));
  },
});

// ── Blokken ──────────────────────────────────────────────────────────────────

export const blokToevoegen = mutation({
  args: {
    adminToken: v.string(),
    naam: v.string(),
    fase: v.optional(v.string()),
    vanDag: v.number(),
    totDag: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaande = await ctx.db.query("funnelBlokken").collect();
    const volgorde = bestaande.reduce((m, b) => Math.max(m, b.volgorde), -1) + 1;
    await ctx.db.insert("funnelBlokken", {
      naam: args.naam.trim() || "Naamloos blok",
      fase: args.fase?.trim() || undefined,
      volgorde,
      vanDag: args.vanDag,
      totDag: args.totDag,
      actief: true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const blokBijwerken = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("funnelBlokken"),
    naam: v.string(),
    fase: v.optional(v.string()),
    vanDag: v.number(),
    totDag: v.number(),
    actief: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      naam: args.naam.trim() || "Naamloos blok",
      fase: args.fase?.trim() || undefined,
      vanDag: args.vanDag,
      totDag: args.totDag,
      actief: args.actief,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Verwijder een blok én de mails erin. */
export const blokVerwijderen = mutation({
  args: { adminToken: v.string(), id: v.id("funnelBlokken") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const mails = await ctx.db
      .query("funnelMails")
      .withIndex("by_blok", (q) => q.eq("blokId", args.id))
      .collect();
    for (const m of mails) await ctx.db.delete(m._id);
    await ctx.db.delete(args.id);
    return { ok: true, verwijderdeMails: mails.length };
  },
});

/** Verplaats een blok omhoog of omlaag (wissel volgnummer met de buur). */
export const blokVerplaatsen = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("funnelBlokken"),
    richting: v.union(v.literal("omhoog"), v.literal("omlaag")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const blokken = (await ctx.db.query("funnelBlokken").collect()).sort(
      (a, b) => a.volgorde - b.volgorde
    );
    const i = blokken.findIndex((b) => b._id === args.id);
    if (i === -1) return { ok: false };
    const j = args.richting === "omhoog" ? i - 1 : i + 1;
    if (j < 0 || j >= blokken.length) return { ok: false };
    const a = blokken[i];
    const b = blokken[j];
    await ctx.db.patch(a._id, { volgorde: b.volgorde, updatedAt: Date.now() });
    await ctx.db.patch(b._id, { volgorde: a.volgorde, updatedAt: Date.now() });
    return { ok: true };
  },
});

// ── Mails ────────────────────────────────────────────────────────────────────

export const mailToevoegen = mutation({
  args: {
    adminToken: v.string(),
    blokId: v.id("funnelBlokken"),
    dagOffset: v.number(),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    verliesType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.insert("funnelMails", {
      blokId: args.blokId,
      dagOffset: args.dagOffset,
      subject: args.subject,
      bodyText: args.bodyText,
      buttonText: args.buttonText?.trim() || undefined,
      buttonUrl: args.buttonUrl?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageCaption: args.imageCaption?.trim() || undefined,
      verliesType: args.verliesType?.trim() || undefined,
      actief: true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const mailBijwerken = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("funnelMails"),
    dagOffset: v.number(),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    actief: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      dagOffset: args.dagOffset,
      subject: args.subject,
      bodyText: args.bodyText,
      buttonText: args.buttonText?.trim() || undefined,
      buttonUrl: args.buttonUrl?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageCaption: args.imageCaption?.trim() || undefined,
      verliesType: args.verliesType?.trim() || undefined,
      actief: args.actief,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const mailVerwijderen = mutation({
  args: { adminToken: v.string(), id: v.id("funnelMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

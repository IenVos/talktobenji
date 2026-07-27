/**
 * Eigen doelgroepen voor de losse mails.
 *
 * Een groep is een naam met een lijst e-mailadressen die Ien zelf beheert. Handig
 * voor bijv. een geïmporteerde groep uit MailerLite. Bij het toevoegen schonen we
 * op: ongeldige adressen, dubbelen, afgemelde adressen en (optioneel) adressen die
 * we al in ons eigen systeem hebben, vallen af. Zo zie je meteen hoeveel er echt
 * nieuw zijn.
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./adminAuth";

/** Alle groepen met hun aantal leden. */
export const lijst = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [groepen, leden] = await Promise.all([
      ctx.db.query("mailGroepen").collect(),
      ctx.db.query("mailGroepLeden").collect(),
    ]);
    const perGroep = new Map<string, number>();
    for (const l of leden) perGroep.set(l.groepId, (perGroep.get(l.groepId) ?? 0) + 1);
    return groepen
      .map((g) => ({ _id: g._id, naam: g.naam, aantal: perGroep.get(g._id) ?? 0, createdAt: g.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const maak = mutation({
  args: { adminToken: v.string(), naam: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const id = await ctx.db.insert("mailGroepen", {
      naam: args.naam.trim() || "Naamloze groep",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true, id };
  },
});

export const hernoem = mutation({
  args: { adminToken: v.string(), id: v.id("mailGroepen"), naam: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, { naam: args.naam.trim() || "Naamloze groep", updatedAt: Date.now() });
    return { ok: true };
  },
});

export const verwijder = mutation({
  args: { adminToken: v.string(), id: v.id("mailGroepen") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const leden = await ctx.db
      .query("mailGroepLeden")
      .withIndex("by_groep", (q) => q.eq("groepId", args.id))
      .collect();
    for (const l of leden) await ctx.db.delete(l._id);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Voeg adressen toe aan een groep, met opschoning. `alleenNieuwe` (standaard aan)
 * slaat adressen over die we al in ons eigen systeem hebben (evergreen-leads, Even
 * Houvast-leads, klanten, nieuwsbrief-opt-ins). Geeft een samenvatting terug.
 */
export const ledenToevoegen = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("mailGroepen"),
    leden: v.array(v.object({ email: v.string(), naam: v.optional(v.string()) })),
    alleenNieuwe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const alleenNieuwe = args.alleenNieuwe ?? true;

    const [afmeldingen, excluded, bestaandeLeden, funnelLeads, brieven, subs, optins] =
      await Promise.all([
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
        ctx.db.query("mailGroepLeden").withIndex("by_groep", (q) => q.eq("groepId", args.id)).collect(),
        ctx.db.query("funnelLeads").collect(),
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("nieuwsbriefOptins").collect(),
      ]);

    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const inGroep = new Set(bestaandeLeden.map((l: any) => l.email.toLowerCase()));
    const inSysteem = new Set<string>();
    for (const l of funnelLeads) inSysteem.add(l.email.toLowerCase());
    for (const b of brieven) inSysteem.add(b.email.toLowerCase());
    for (const s of subs) if (s.email) inSysteem.add(s.email.toLowerCase());
    for (const o of optins) inSysteem.add(o.email.toLowerCase());

    let toegevoegd = 0,
      ongeldig = 0,
      dubbel = 0,
      afgemeld = 0,
      alInSysteem = 0;
    const gezienInBatch = new Set<string>();

    for (const rij of args.leden) {
      const email = (rij.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        ongeldig++;
        continue;
      }
      if (gezienInBatch.has(email) || inGroep.has(email)) {
        dubbel++;
        continue;
      }
      gezienInBatch.add(email);
      if (afgemeldSet.has(email) || testSet.has(email)) {
        afgemeld++;
        continue;
      }
      if (alleenNieuwe && inSysteem.has(email)) {
        alInSysteem++;
        continue;
      }
      await ctx.db.insert("mailGroepLeden", {
        groepId: args.id,
        email,
        naam: rij.naam?.trim() || undefined,
      });
      toegevoegd++;
    }
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return { toegevoegd, ongeldig, dubbel, afgemeld, alInSysteem };
  },
});

export const lidVerwijderen = mutation({
  args: { adminToken: v.string(), id: v.id("mailGroepen"), email: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const email = args.email.toLowerCase();
    const rij = await ctx.db
      .query("mailGroepLeden")
      .withIndex("by_groep_email", (q) => q.eq("groepId", args.id).eq("email", email))
      .first();
    if (rij) await ctx.db.delete(rij._id);
    return { ok: true };
  },
});

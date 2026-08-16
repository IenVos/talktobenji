/**
 * Evergreen funnel-bouwer — Convex-kant (stap 3).
 *
 * Blokken (thema's) met daarin mails op een dagoffset. Elke lead heeft een eigen
 * dag 1 (zie funnelLeads); de reeks staat stil, de mensen bewegen erdoorheen.
 * Dit bestand beheert alleen de opbouw. Er verstuurt nog niets: de dagelijkse
 * cron en de verzending komen in stap 4. Zie PLAN_EVERGREEN_FUNNEL.md.
 */
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";
import {
  appBase,
  mailAlinea,
  mailLinks,
  mailKnop,
  mailWrapper,
  mailHandtekeningIen,
  ehAfmeldUrl,
  ehAfmeldToken,
  nietAlleenUrlVoorType,
  persoonlijkOnderwerp,
  persoonlijkeBody,
} from "./ehMailFooter";
import { BENJI_BLOK_MARKER, BENJI_KNOP_MARKER } from "./ehConcepten";
import { DEFAULT_TEMPLATES } from "./emailTemplatesDefaults";

const DAG_MS = 24 * 60 * 60 * 1000;

// Sporen: één motor, meerdere funnels. Een blok/lead zonder spoor telt als de
// bestaande evergreen, zodat alles wat er nu is ongewijzigd blijft draaien. Een
// lead krijgt uitsluitend de blokken van zijn eigen spoor.
const DEFAULT_SPOOR = "evergreen";
const spoorVan = (x?: string | null): string => (x && x.trim()) || DEFAULT_SPOOR;

// ── Lezen ────────────────────────────────────────────────────────────────────

/** Diagnose (CLI): actieve mails per dagOffset + leads-instroomspreiding. Read-only. */
export const _evergreenOverzicht = internalQuery({
  args: {},
  handler: async (ctx) => {
    const nu = Date.now();
    const [blokken, mails, leads] = await Promise.all([
      ctx.db.query("funnelBlokken").collect(),
      ctx.db.query("funnelMails").collect(),
      ctx.db.query("funnelLeads").collect(),
    ]);
    const blokActief = new Map(blokken.map((b: any) => [b._id, b.actief !== false]));
    const actieveMails = mails
      .filter((m: any) => m.actief && blokActief.get(m.blokId))
      .map((m: any) => ({ dagOffset: m.dagOffset, subject: m.subject, type: m.verliesType ?? "algemeen" }))
      .sort((a: any, b: any) => a.dagOffset - b.dagOffset);
    const laagsteDagOffset = actieveMails.length ? actieveMails[0].dagOffset : null;
    // Leads-instroom per bron + hoe ver ze nu zijn (dag = floor(dagen)+1).
    const perBron: Record<string, number> = {};
    const dagVerdeling: Record<number, number> = {};
    for (const l of leads) {
      const bron = l.bron ?? "onbekend";
      perBron[bron] = (perBron[bron] ?? 0) + 1;
      const dag = Math.floor((nu - l.ingestroomdOp) / DAG_MS) + 1;
      dagVerdeling[dag] = (dagVerdeling[dag] ?? 0) + 1;
    }
    return {
      laagsteActieveDagOffset: laagsteDagOffset,
      actieveMails,
      aantalActieveMails: actieveMails.length,
      blokken: blokken.map((b: any) => ({ naam: b.naam, actief: b.actief !== false })),
      leadsPerBron: perBron,
      leadsDagVerdeling: dagVerdeling,
      totaalLeads: leads.length,
    };
  },
});

/** Alle blokken op volgorde, elk met hun mails (op dagoffset). Voor de admin.
 * Met `spoor` filter je op één funnel (default toont het alle sporen). */
export const blokkenMetMails = query({
  args: { adminToken: v.string(), spoor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [alleBlokken, mails] = await Promise.all([
      ctx.db.query("funnelBlokken").withIndex("by_volgorde").collect(),
      ctx.db.query("funnelMails").collect(),
    ]);
    const blokken = args.spoor
      ? alleBlokken.filter((b) => spoorVan(b.spoor) === args.spoor)
      : alleBlokken;
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
  args: { adminToken: v.string(), spoor: v.optional(v.string()) },
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
        if (!m.actief || !b || !b.actief) return false;
        return !args.spoor || spoorVan(b.spoor) === args.spoor;
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

/**
 * Bezetting per funnel-spoor: hoeveel leads zitten er nu in, en op welke dag/mail.
 * Voor de e-mailstatistieken-pagina, zodat je ziet waar mensen "vastzitten". De
 * dag-verdeling geldt alleen voor leads die actief de reeks doorlopen (in-backend);
 * gepauzeerd (alleen-maandmail), kopers en afgemelden staan apart in de status. De
 * buckets volgen het actieve mailschema van het spoor, dus ze kloppen ook als je het
 * schema aanpast.
 */
export const funnelBezetting = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [blokken, mails, leads] = await Promise.all([
      ctx.db.query("funnelBlokken").collect(),
      ctx.db.query("funnelMails").collect(),
      ctx.db.query("funnelLeads").collect(),
    ]);
    const spoorPerBlok = new Map(blokken.map((b) => [String(b._id), spoorVan(b.spoor)]));

    // Actief mailschema per spoor, op dagvolgorde (dagOffset). Alleen actieve mails in
    // actieve blokken tellen mee, want inactieve worden overgeslagen.
    const blokActief = new Map(blokken.map((b) => [String(b._id), b.actief !== false]));
    const schemaPerSpoor = new Map<string, { dagOffset: number; subject: string }[]>();
    for (const m of mails) {
      if (!m.actief || !blokActief.get(String(m.blokId))) continue;
      const sp = spoorPerBlok.get(String(m.blokId)) ?? DEFAULT_SPOOR;
      if (!schemaPerSpoor.has(sp)) schemaPerSpoor.set(sp, []);
      schemaPerSpoor.get(sp)!.push({ dagOffset: m.dagOffset, subject: m.subject });
    }
    for (const arr of schemaPerSpoor.values()) arr.sort((a, b) => a.dagOffset - b.dagOffset);

    const now = Date.now();
    const DAG = 86_400_000;
    const titelVan = (sp: string) =>
      sp === "benji" ? "Benji funnel" : sp === "evergreen" ? "Evergreen funnel" : sp;

    // Leads groeperen per spoor: totaal, status-verdeling, en dag-buckets (in-backend).
    const spoors = new Set<string>([...schemaPerSpoor.keys()]);
    for (const l of leads) spoors.add(spoorVan(l.spoor));

    const result = [...spoors].map((sp) => {
      const schema = schemaPerSpoor.get(sp) ?? [];
      const status: Record<string, number> = {};
      const bucketCounts = new Array(schema.length + 1).fill(0);
      let totaal = 0;
      let actiefInReeks = 0;
      for (const l of leads) {
        if (spoorVan(l.spoor) !== sp) continue;
        totaal++;
        status[l.status] = (status[l.status] || 0) + 1;
        if (l.status !== "in-backend") continue;
        actiefInReeks++;
        const dagen = (now - l.ingestroomdOp) / DAG;
        let gepasseerd = 0;
        for (const m of schema) if (dagen >= m.dagOffset) gepasseerd++;
        bucketCounts[gepasseerd]++;
      }
      const buckets = bucketCounts.map((aantal, i) => {
        if (schema.length === 0) return { label: "Nog geen mailschema", aantal };
        if (i === 0) {
          return { label: `Nog voor mail 1 (dag 0–${schema[0].dagOffset})`, aantal };
        }
        if (i === schema.length) {
          return { label: `Reeks klaar (na dag ${schema[schema.length - 1].dagOffset})`, aantal };
        }
        const gehad = schema[i - 1];
        const volgende = schema[i];
        return {
          label: `Na mail ${i}, wacht op mail ${i + 1} (dag ${gehad.dagOffset}–${volgende.dagOffset})`,
          subject: gehad.subject,
          aantal,
        };
      });
      return { spoor: sp, titel: titelVan(sp), totaal, actiefInReeks, aantalMails: schema.length, status, buckets };
    });

    // Lege sporen (geen leads én geen schema) weglaten; evergreen + benji vooraan.
    const volgorde = ["evergreen", "benji"];
    return result
      .filter((r) => r.totaal > 0 || r.aantalMails > 0)
      .sort((a, b) => {
        const ia = volgorde.indexOf(a.spoor);
        const ib = volgorde.indexOf(b.spoor);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.titel.localeCompare(b.titel);
      });
  },
});

// ── Blokken ──────────────────────────────────────────────────────────────────

/**
 * Zet de bestaande brief-klikker-mails (kom-terug + vervolg) als eerste blok in het
 * Benji-spoor: kom-terug op dag 3, vervolg op dag 4. Neemt de OPGESLAGEN tekst over
 * (jouw aangepaste versie), of anders de standaardtekst. De één-klik-Benji-knop komt
 * automatisch via de [benji-blok]-marker in de tekst. Doet niets als er al een
 * Benji-blok staat (dus veilig één keer te klikken).
 */
export const seedBenjiOpening = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const OPENING_NAAM = "Opening (brief-klikkers)";
    const alleBlokken = await ctx.db.query("funnelBlokken").collect();
    // Alleen dit specifieke openingsblok mag niet dubbel; andere Benji-blokken (die je
    // zelf maakte) laten we met rust.
    if (alleBlokken.some((b: any) => spoorVan(b.spoor) === "benji" && b.naam === OPENING_NAAM)) {
      return { ok: false, reden: "Het openingsblok staat er al" };
    }

    const leesTemplate = async (key: string) => {
      const saved = await ctx.db
        .query("emailTemplates")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      const def = (DEFAULT_TEMPLATES as any)[key] ?? {};
      const rawBody: string = saved?.bodyText ?? def.bodyText ?? "";
      // Zorg dat de persoonlijke CTA-knop verschijnt (zoals in de EH-versie): niet het
      // koude [benji-blok]-kaartje, maar de nette "Verder praten met Benji"-knop, boven
      // de afsluitgroet.
      const bodyText = metBenjiKnop(rawBody);
      const buttonText: string = (saved?.buttonText ?? def.buttonText ?? "Verder praten met Benji").trim();
      return { subject: saved?.subject ?? def.subject ?? "", bodyText, buttonText };
    };
    const komTerug = await leesTemplate("eh_brief_kom_terug");
    const vervolg = await leesTemplate("eh_brief_vervolg");

    const now = Date.now();
    const volgorde = alleBlokken.reduce((m, b) => Math.max(m, b.volgorde), -1) + 1;
    const blokId = await ctx.db.insert("funnelBlokken", {
      naam: OPENING_NAAM,
      spoor: "benji",
      volgorde,
      vanDag: 3,
      totDag: 4,
      actief: true,
      updatedAt: now,
    });
    await ctx.db.insert("funnelMails", {
      blokId, dagOffset: 3, subject: komTerug.subject, bodyText: komTerug.bodyText,
      buttonText: komTerug.buttonText, actief: true, updatedAt: now,
    });
    await ctx.db.insert("funnelMails", {
      blokId, dagOffset: 4, subject: vervolg.subject, bodyText: vervolg.bodyText,
      buttonText: vervolg.buttonText, actief: true, updatedAt: now,
    });
    return { ok: true };
  },
});

/**
 * Eenmalige, idempotente reparatie: zet de al-bestaande brief-klikker-mails (die met
 * het koude [benji-blok]-kaartje geseed zijn) om naar de persoonlijke CTA-knop
 * [benji-knop] met knoptekst "Verder praten met Benji". Zo brengt de knop de lead
 * direct naar zijn eigen plek, net als in de EH-scherm-versie. Veilig meerdere keren
 * te draaien: doet niets als een mail al de knop-marker heeft.
 */
export const _migreerBenjiOpeningNaarKnop = internalMutation({
  args: {},
  handler: async (ctx) => {
    const OPENING_NAAM = "Opening (brief-klikkers)";
    const blokken = await ctx.db.query("funnelBlokken").collect();
    const openingBlokken = blokken.filter(
      (b: any) => spoorVan(b.spoor) === "benji" && b.naam === OPENING_NAAM
    );
    let aangepast = 0;
    for (const blok of openingBlokken) {
      const mails = await ctx.db
        .query("funnelMails")
        .withIndex("by_blok", (q) => q.eq("blokId", blok._id))
        .collect();
      for (const m of mails) {
        const bodyText = metBenjiKnop(m.bodyText);
        const patch: Record<string, unknown> = {};
        if (bodyText !== m.bodyText) patch.bodyText = bodyText;
        if (!(m.buttonText ?? "").trim()) patch.buttonText = "Verder praten met Benji";
        if (Object.keys(patch).length > 0) {
          patch.updatedAt = Date.now();
          await ctx.db.patch(m._id, patch);
          aangepast++;
        }
      }
    }
    return { ok: true, aangepast };
  },
});

/**
 * Eenmalige herschikking: verplaats de mails uit het "Opening (brief-klikkers)"-blok
 * naar het "Start"-blok (zodat de hele Benji-funnel in één blok staat), en ruim het
 * lege Opening-blok op. Idempotent: doet niets als Opening al weg is. Het Start-blok
 * rekt zo nodig mee in dag-bereik. De mails behouden hun eigen dagOffset (3 en 4).
 */
export const _verplaatsOpeningNaarStart = internalMutation({
  args: {},
  handler: async (ctx) => {
    const blokken = await ctx.db.query("funnelBlokken").collect();
    const benji = blokken.filter((b: any) => spoorVan(b.spoor) === "benji");
    const opening = benji.find((b: any) => b.naam === "Opening (brief-klikkers)");
    const start = benji.find((b: any) => b.naam === "Start");
    if (!opening) return { ok: true, reden: "geen Opening-blok (al verplaatst)", verplaatst: 0 };
    if (!start) return { ok: false, reden: "geen Start-blok gevonden", verplaatst: 0 };

    const mails = await ctx.db
      .query("funnelMails")
      .withIndex("by_blok", (q) => q.eq("blokId", opening._id))
      .collect();

    const now = Date.now();
    let vanDag = start.vanDag;
    let totDag = start.totDag;
    for (const m of mails) {
      await ctx.db.patch(m._id, { blokId: start._id, updatedAt: now });
      vanDag = Math.min(vanDag, m.dagOffset);
      totDag = Math.max(totDag, m.dagOffset);
    }
    if (vanDag !== start.vanDag || totDag !== start.totDag) {
      await ctx.db.patch(start._id, { vanDag, totDag, updatedAt: now });
    }
    await ctx.db.delete(opening._id);
    return { ok: true, verplaatst: mails.length };
  },
});

export const blokToevoegen = mutation({
  args: {
    adminToken: v.string(),
    naam: v.string(),
    spoor: v.optional(v.string()),
    fase: v.optional(v.string()),
    vanDag: v.number(),
    totDag: v.number(),
    actief: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaande = await ctx.db.query("funnelBlokken").collect();
    const volgorde = bestaande.reduce((m, b) => Math.max(m, b.volgorde), -1) + 1;
    await ctx.db.insert("funnelBlokken", {
      naam: args.naam.trim() || "Naamloos blok",
      // Leeg spoor bewaren we als undefined (= evergreen), anders de gekozen waarde.
      spoor: args.spoor && args.spoor !== DEFAULT_SPOOR ? args.spoor.trim() : undefined,
      fase: args.fase?.trim() || undefined,
      volgorde,
      vanDag: args.vanDag,
      totDag: args.totDag,
      actief: args.actief ?? true,
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
    actief: v.optional(v.boolean()),
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
      actief: args.actief ?? true,
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

// ── Verzending (stap 4): renderer + dagelijkse motor ─────────────────────────
// Elke lead heeft een eigen dag 1 (funnelLeads.ingestroomdOp). De cron kijkt per
// lead welke mail nu aan de beurt is, hoogstens één per dag, en plant die gespreid
// in. Draait alleen als env EVERGREEN_ACTIEF === "true". De evergreen mails hebben
// een EIGEN voettekst: de Niet Alleen-brug alleen in de laatste mail van een blok,
// plus een rustoptie ("liever alleen maandelijks").

const EH_TYPES = ["persoon", "huisdier", "scheiding", "eenzaamheid", "kinderloos"];
const ALGEMEEN = "algemeen";
function normType(t?: string | null): string {
  return t && EH_TYPES.includes(t) ? t : ALGEMEEN;
}

// Afsluitgroeten die de foto-handtekening eronder krijgen (zoals bij de EH-mails).
const AFSLUITINGEN = [
  "lieve groet", "lieve groetjes", "veel liefs", "liefs", "met liefs",
  "warme groet", "een warme groet", "met warme groet", "groetjes",
  "warme groetjes", "veel sterkte", "sterkte",
];
const isAfsluiting = (p: string) =>
  AFSLUITINGEN.includes(p.toLowerCase().replace(/[.,!\s]+$/g, "").trim());

const AFBEELDING_MARKER = /^\[afbeelding\]$/i;
const KNOP_MARKER = /^\[knop\]$/i;
// Elke marker met "benji" tussen haakjes is een Benji-CTA (bijv. [benji-knop] of
// "[Praat verder met Benji >>]"). [benji-blok] valt hier ook onder, maar wordt in de
// render éérst als kaartje afgevangen.
const BENJI_CTA_RE = /\[[^\]]*benji[^\]]*\]/i;

function inlineAfbeelding(url: string, caption?: string): string {
  const img = `<img src="${url}" alt="" style="width:100%;max-width:480px;height:auto;border-radius:12px;display:block;margin:0 auto;" />`;
  const cap = caption ? `<p style="font-size:13px;color:#6b6460;text-align:center;margin:10px 0 0 0;">${caption}</p>` : "";
  return `<div style="margin:24px 0;">${img}${cap}</div>`;
}
function coverBlok(url: string, linkUrl?: string, caption?: string): string {
  const img = `<img src="${url}" alt="" style="max-width:240px;width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;box-shadow:0 4px 18px rgba(0,0,0,0.12);" />`;
  const inner = linkUrl ? `<a href="${linkUrl}" style="text-decoration:none;display:inline-block;">${img}</a>` : img;
  const cap = caption ? `<p style="font-size:13px;color:#6b6460;margin:12px 0 0 0;">${caption}</p>` : "";
  return `<div style="margin:26px 0;text-align:center;">${inner}${cap}</div>`;
}
function benjiBlokHtml(benjiUrl: string): string {
  return `<div style="margin:26px 0 6px;background:#ffffff;border:1px solid #e7ded1;border-radius:16px;padding:24px 22px;text-align:center;"><p style="font-size:16px;font-weight:700;color:#3d3530;margin:0 0 8px;">7 dagen gratis met Benji</p><p style="font-size:14px;line-height:1.6;color:#6b6460;margin:0 0 18px;">Een plek om je verhaal kwijt te kunnen, wanneer jij wilt. Ook midden in de nacht.</p><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:11px 24px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Maak kennis met Benji &rarr;</a><p style="font-size:12px;line-height:1.5;color:#9a938c;margin:14px 0 0;">Geen formulier, geen wachtwoord.</p></div>`;
}

// De persoonlijke CTA-knop ("Verder praten met Benji"), links uitgelijnd. Zelfde stijl
// en link als de EH-scherm-versie (verstuurBriefKomTerug): brengt de lead direct naar
// zijn eigen plek/gesprek via de één-klik-link.
function benjiPersoonlijkeKnop(benjiUrl: string, label: string): string {
  return `<div style="text-align:left;margin:26px 0;"><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:12px 26px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">${label} &rarr;</a></div>`;
}

// Zet de [benji-knop]-marker op de juiste plek in de tekst: vlak vóór de afsluitgroet
// ("Liefs"), zodat de knop boven de handtekening staat (net als de EH-scherm-versie).
// Bestaande benji-markers worden eerst verwijderd, dan opnieuw goed geplaatst. Zonder
// herkende afsluitgroet komt de knop onderaan.
function metBenjiKnop(bodyText: string): string {
  const alineas = bodyText
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !p.includes(BENJI_KNOP_MARKER) && !p.includes(BENJI_BLOK_MARKER));
  let groetIndex = -1;
  alineas.forEach((p, i) => {
    if (isAfsluiting(p)) groetIndex = i;
  });
  if (groetIndex === -1) alineas.push(BENJI_KNOP_MARKER);
  else alineas.splice(groetIndex, 0, BENJI_KNOP_MARKER);
  return alineas.join("\n\n");
}

// Eigen evergreen-voettekst. Twee smaken, afhankelijk van het spoor:
//  • gewone evergreen: Niet Alleen-brug (alleen in de laatste mail van een blok).
//  • Benji-spoor: GEEN Niet Alleen (die funnel richt zich enkel op Benji), maar wél
//    een zacht linkje naar /wat-kost-benji. Zo is de footer voor élke Benji-mail gelijk.
// Altijd een rustoptie (alleen maandelijks) én een afmeldlink.
function evergreenFooter(
  naUrl: string | null,
  rustUrl: string,
  afmeldUrl: string,
  benjiKostUrl: string | null
): string {
  const brug = naUrl
    ? `<p style="font-size:14px;font-weight:600;color:#3d3530;margin:0 0 12px;"><a href="${naUrl}" style="color:#6d84a8;text-decoration:underline;">Niet Alleen voor jou</a></p>`
    : "";
  // Benji-spoor krijgt een eigen "vragen"-regel (verwijst naar Ien) plus de wat-kost-
  // regel met de link eronder. Gewone evergreen houdt de standaardregel.
  const vragenEnKost = benjiKostUrl
    ? `<p style="font-size:13px;line-height:1.6;color:#718096;margin:7px 0 0 0;">Heb je een vraag die ik niet kan beantwoorden?<br/>Antwoord op deze mail, dan komt hij bij Ien terecht.</p>`
    : `<p style="font-size:13px;color:#718096;margin:7px 0 0 0;">Heb je vragen? Beantwoord gewoon deze mail.</p>`;
  return `
    <div style="text-align:center;margin-top:44px;">
      <img src="https://www.talktobenji.com/images/benji-logo-2.png" alt="Talk To Benji" width="42" height="42" style="display:inline-block;width:42px;height:42px;margin:0 0 12px 0;" />
      ${brug}
      ${vragenEnKost}
      <p style="font-size:12px;line-height:1.7;color:#a0aec0;margin:26px 0 0 0;border-top:1px solid #ece5dc;padding-top:16px;">
        <a href="${rustUrl}" style="color:#a0aec0;text-decoration:underline;">Liever minder mail? Alleen nog maandelijks</a>
        <br/>
        <a href="${afmeldUrl}" style="color:#a0aec0;text-decoration:underline;">Helemaal geen mail meer ontvangen</a>
      </p>
    </div>`;
}

async function rustUrlVoor(email: string): Promise<string> {
  const token = await ehAfmeldToken(email);
  return `${appBase()}/api/rust?e=${encodeURIComponent(email)}&t=${token}`;
}

// Bouw de HTML van één evergreen-mail. Volgordegetrouw (markers op hun eigen plek),
// met de foto-handtekening onder de afsluitgroet. isLaatsteVanBlok bepaalt of de
// Niet Alleen-brug in de voettekst staat.
async function bouwEvergreenHtml(
  ctx: any,
  args: {
    email: string;
    naam?: string;
    type: string;
    subject: string;
    bodyText: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imageCaption?: string;
    isLaatsteVanBlok: boolean;
    spoor?: string;
  }
): Promise<string> {
  const body = persoonlijkeBody(args.bodyText, args.naam);
  const imageUrl = (args.imageUrl || "").trim() || undefined;
  const imageCaption = (args.imageCaption || "").trim() || undefined;

  // Opdracht-kader: alles tussen [opdracht] en [/opdracht] wordt een zacht blok
  // (zelfde als de EH-render). Zonder de markers: geen effect.
  let opdrachtCard = "";
  let bodyVoorSplit = body;
  const opdrachtMatch = body.match(/\[opdracht\]([\s\S]*?)\[\/opdracht\]/i);
  if (opdrachtMatch) {
    const innerHtml = opdrachtMatch[1]
      .trim()
      .split(/\n\n+/)
      .map((p) => `<p style="font-size:15px;line-height:1.7;color:#4a5568;margin:0 0 12px;">${p.trim().replace(/\n/g, "<br/>")}</p>`)
      .join("");
    opdrachtCard = `<div style="background:#fdf9f4;border:1px solid #e7ded1;border-radius:14px;padding:18px 22px 6px;margin:22px 0;">${innerHtml}</div>`;
    bodyVoorSplit = body.replace(opdrachtMatch[0], "\n\n[[OPDRACHT]]\n\n");
  }

  // Benji-CTA's delen dezelfde persoonlijke één-klik-link (per lead een eigen token).
  // [benji-blok] = het intro-kaartje; élke andere [...Benji...]-marker wordt de CTA-
  // knop naar de eigen plek. De knoptekst komt uit de marker zelf; bij de kale
  // [benji-knop] uit buttonText (of de standaardtekst).
  const heeftBlok = bodyVoorSplit.includes(BENJI_BLOK_MARKER);
  const heeftBenjiCta = BENJI_CTA_RE.test(bodyVoorSplit);
  // Losse naam "Benji" in een P.S.-regel wordt automatisch een klikbaar, bruin woord
  // (niet onderstreept) met dezelfde persoonlijke één-klik-link. Enkel de losse naam
  // in de P.S.; "Talk To Benji" (merknaam/handtekening) blijft ongemoeid. Verandert
  // verder niets aan de tekst: alleen kleur + link op dat ene woord.
  const heeftPsBenji = bodyVoorSplit
    .split(/\n\n+/)
    .some((p) => /^p\.?\s*s\.?/i.test(p.trim()) && /(?<!Talk To )(?<!Talk to )Benji/.test(p));
  // Losse naam "Benji" ergens in de brieftekst zelf (buiten "Talk To Benji"). De eerste
  // zo'n vermelding maken we één keer klikbaar, net als in de P.S. Ook zonder P.S. of
  // marker moet er dan een token/link zijn.
  const heeftBodyBenji = /(?<!Talk To )(?<!Talk to )Benji/.test(bodyVoorSplit);
  let blokHtml = "";
  let benjiUrl = "";
  if (heeftBlok || heeftBenjiCta || heeftPsBenji || heeftBodyBenji) {
    const token = await ctx.runMutation(internal.benjiStart.genereerTokenInternal, {
      email: args.email,
      naam: args.naam,
    });
    benjiUrl = `${appBase()}/benji-start?token=${token}`;
    if (heeftBlok) blokHtml = benjiBlokHtml(benjiUrl);
  }
  // De P.S.-Benji-link stuurt met "&o=direct" de klik meteen de juiste verliestype-chat
  // in met de vaste opener (i.p.v. via het account). Global, dus élke losse naam in de
  // P.S. wordt gelinkt; "Talk To Benji" wordt door de lookbehind overgeslagen.
  const PS_BENJI_RE = /(?<!Talk To )(?<!Talk to )Benji/g;
  const benjiInlineAnchor = benjiUrl
    ? `<a href="${benjiUrl}&o=direct" style="color:#9a8168;text-decoration:none;font-weight:600;">Benji</a>`
    : "";
  const benjiKnopVoor = (p: string): string => {
    const binnen = (p.match(/\[([^\]]*)\]/)?.[1] ?? "").replace(/[>»→\s]+$/g, "").trim();
    const kaal =
      binnen === "" ||
      binnen.toLowerCase() === "benji-knop" ||
      binnen.toLowerCase() === "benji-start-link";
    const label = kaal ? ((args.buttonText || "").trim() || "Verder praten met Benji") : binnen;
    return benjiPersoonlijkeKnop(benjiUrl, label);
  };

  const knopTekst = (args.buttonText || "").trim();
  const knopUrl = (args.buttonUrl || "").trim();
  const toonKnop = !!knopTekst && !!knopUrl;
  const knopHtml = toonKnop ? mailKnop(knopTekst, knopUrl) : "";
  const coverHtml = imageUrl ? coverBlok(imageUrl, knopUrl || undefined, imageCaption) : "";
  const psStijl = (p: string) => {
    let inner = mailLinks(p);
    if (benjiInlineAnchor) inner = inner.replace(PS_BENJI_RE, benjiInlineAnchor);
    return `<p style="font-size:14px;line-height:1.75;color:#718096;margin-top:20px;">${inner.replace(/\n/g, "<br/>")}</p>`;
  };
  // Eén losse "Benji" in de brieftekst zelf wordt (max één keer over de hele mail)
  // hetzelfde klikbare, bruine woord als in de P.S. "Talk To Benji" blijft ongemoeid,
  // en de handtekening raken we nooit aan (die loopt niet via deze renderer).
  let benjiInBodyGelinkt = false;
  const EERSTE_BODY_BENJI_RE = /(?<!Talk To )(?<!Talk to )Benji/;
  const bodyAlinea = (p: string): string => {
    if (benjiInlineAnchor && !benjiInBodyGelinkt && EERSTE_BODY_BENJI_RE.test(p)) {
      benjiInBodyGelinkt = true;
      return mailAlinea(p.replace(EERSTE_BODY_BENJI_RE, benjiInlineAnchor));
    }
    return mailAlinea(p);
  };

  const alineas = bodyVoorSplit.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
  const gebruiktAfbeelding = alineas.some((p: string) => AFBEELDING_MARKER.test(p));
  const gebruiktKnop = alineas.some((p: string) => KNOP_MARKER.test(p));
  const isPS = (p: string) => /^p\.?\s*s\.?/i.test(p);
  let groetIndex = -1;
  alineas.forEach((p: string, i: number) => {
    if (isAfsluiting(p)) groetIndex = i;
  });
  const autoVoorGroet = `${!gebruiktAfbeelding ? coverHtml : ""}${!gebruiktKnop ? knopHtml : ""}`;

  // P.S.-regels horen altijd onderaan, ná de handtekening. We renderen ze dus niet
  // op hun plek in de tekst, maar verzamelen ze en zetten ze als laatste. Zo staan
  // ze goed, óók als de mail geen herkende afsluitgroet heeft.
  const psStukken: string[] = [];
  const stukken: string[] = [];
  alineas.forEach((p: string, i: number) => {
    if (p === "[[OPDRACHT]]") stukken.push(opdrachtCard);
    else if (p.includes(BENJI_BLOK_MARKER)) stukken.push(blokHtml);
    else if (BENJI_CTA_RE.test(p)) stukken.push(benjiKnopVoor(p));
    else if (AFBEELDING_MARKER.test(p)) { if (imageUrl) stukken.push(inlineAfbeelding(imageUrl, imageCaption)); }
    else if (KNOP_MARKER.test(p)) { if (toonKnop) stukken.push(knopHtml); }
    else if (isPS(p)) psStukken.push(psStijl(p));
    else if (i === groetIndex) {
      stukken.push(autoVoorGroet);
      stukken.push(bodyAlinea(p));
      stukken.push(mailHandtekeningIen());
    } else stukken.push(bodyAlinea(p));
  });
  if (groetIndex === -1) {
    stukken.push(autoVoorGroet);
    stukken.push(mailHandtekeningIen());
  }
  stukken.push(...psStukken);

  // Benji-spoor: geen Niet Alleen-brug (die funnel gaat enkel over Benji), wél de
  // wat-kost-benji-link. Gewone evergreen: Niet Alleen-brug op de laatste mail, geen
  // Benji-kostlink. Zo krijgt élke Benji-mail dezelfde voettekst.
  const isBenjiSpoor = spoorVan(args.spoor) === "benji";
  const naUrl = args.isLaatsteVanBlok && !isBenjiSpoor ? nietAlleenUrlVoorType(args.type) : null;
  const benjiKostUrl = isBenjiSpoor ? `${appBase()}/wat-kost-benji` : null;
  const [rustUrl, afmeldUrl] = await Promise.all([
    rustUrlVoor(args.email),
    ehAfmeldUrl(args.email, "evergreen", args.type),
  ]);

  return mailWrapper(`
    ${stukken.join("\n")}
    ${evergreenFooter(naUrl, rustUrl, afmeldUrl, benjiKostUrl)}
  `);
}

async function verstuurEvergreenEmail(args: { to: string; subject: string; html: string; apiKey: string; mailId: string }) {
  const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
  for (let poging = 1; poging <= 4; poging++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        tags: [
          { name: "programma", value: "evergreen" },
          { name: "mail", value: args.mailId },
        ],
      }),
    });
    if (res.ok) return;
    const detail = await res.text();
    const tijdelijk = res.status === 429 || res.status >= 500;
    if (!tijdelijk || poging === 4) throw new Error(`Evergreen-mail mislukt (status ${res.status}): ${detail}`);
    await new Promise((r) => setTimeout(r, poging * 1500));
  }
}

// ── Interne data + veiligheids-helpers ───────────────────────────────────────

// Is deze lead teruggekomen in de chat ná `sinds`? (een eigen bericht getypt).
// Alleen tellen, nooit inhoud lezen. Gebruikt voor de terugkom-conditie op een mail.
async function leadIsTeruggekomen(ctx: any, email: string, sinds: number): Promise<boolean> {
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .first();
  if (!user) return false;
  const sessies = await ctx.db
    .query("chatSessions")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id.toString()))
    .collect();
  for (const s of sessies) {
    const msg = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", s._id))
      .filter((q: any) => q.eq(q.field("role"), "user"))
      .filter((q: any) => q.gt(q.field("createdAt"), sinds))
      .first();
    if (msg) return true;
  }
  return false;
}

// Bepaalt per lead welke mail nu aan de beurt is (hoogstens één), inclusief alle
// veiligheidschecks. Kopers worden apart teruggegeven om op "koper" te zetten.
export const _evergreenPlan = internalQuery({
  args: {},
  handler: async (ctx) => {
    const nu = Date.now();
    const [blokken, alleMails, leads, afmeldingen, naProfielen, subs, verzonden] =
      await Promise.all([
        ctx.db.query("funnelBlokken").collect(),
        ctx.db.query("funnelMails").collect(),
        ctx.db.query("funnelLeads").withIndex("by_status", (q) => q.eq("status", "in-backend")).collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("funnelVerzonden").collect(),
      ]);

    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const kochtSet = new Set<string>();
    for (const s of subs) {
      if (s.email && (s.pricePaid ?? 0) > 0) kochtSet.add(s.email.toLowerCase());
    }

    const blokById = new Map(blokken.map((b: any) => [b._id, b]));
    const mailById = new Map(alleMails.map((m: any) => [m._id, m]));
    // Actieve mails (in actieve blokken), gegroepeerd per dagOffset.
    const actieveMails = alleMails.filter((m: any) => {
      const b = blokById.get(m.blokId);
      return m.actief && b && b.actief;
    });
    // Hoogste dagOffset per blok (voor "laatste mail van een blok").
    const maxDagPerBlok = new Map<string, number>();
    for (const m of actieveMails) {
      const cur = maxDagPerBlok.get(m.blokId) ?? -1;
      if (m.dagOffset > cur) maxDagPerBlok.set(m.blokId, m.dagOffset);
    }

    // Verzonden per e-mail + spoor → set van dagOffsets (via de mail + z'n blok).
    // Sleutel is "email|spoor", zodat een lead die van spoor wisselt niet vastloopt
    // op dagnummers die hij in zijn vorige spoor al kreeg.
    const verzondenDagen = new Map<string, Set<number>>();
    for (const v of verzonden) {
      const m = mailById.get(v.mailId);
      if (!m) continue;
      const e = v.email.toLowerCase();
      const spoor = spoorVan(blokById.get(m.blokId)?.spoor);
      const key = `${e}|${spoor}`;
      const set = verzondenDagen.get(key) ?? new Set<number>();
      set.add(m.dagOffset);
      verzondenDagen.set(key, set);
    }

    const teVerzenden: {
      email: string;
      naam: string | null;
      type: string;
      mailId: any;
      isLaatsteVanBlok: boolean;
    }[] = [];
    const teMarkerenKoper: string[] = [];
    // Mails met een terugkom-conditie die NIET verstuurd worden (lead kwam terug):
    // wél als "gehad" wegschrijven zodat de lead netjes doorschuift.
    const teMarkerenOvergeslagen: { email: string; mailId: any }[] = [];

    for (const lead of leads) {
      const email = lead.email.toLowerCase();
      if (naSet.has(email) || kochtSet.has(email)) {
        teMarkerenKoper.push(email);
        continue;
      }
      if (afgemeldSet.has(email)) continue; // afmelding = geen mail (status blijft; cron slaat over)

      const type = normType(lead.verliesType);
      const leadSpoor = spoorVan(lead.spoor);
      const dag = Math.floor((nu - lead.ingestroomdOp) / DAG_MS) + 1; // eigen dag 1 = instroomdag
      const alGehad = verzondenDagen.get(`${email}|${leadSpoor}`) ?? new Set<number>();

      // Alleen de mails van blokken op het spoor van deze lead.
      const spoorMails = actieveMails.filter(
        (m: any) => spoorVan(blokById.get(m.blokId)?.spoor) === leadSpoor
      );

      // Kies per dagOffset de passende mail (variant voor dit type, anders algemeen).
      // Een dagOffset zonder passende mail is voor deze lead simpelweg geen stap.
      const kandidaten = spoorMails
        .filter((m: any) => m.dagOffset <= dag && !alGehad.has(m.dagOffset))
        .map((m: any) => m.dagOffset);
      const unieke = Array.from(new Set<number>(kandidaten)).sort((a, b) => a - b);

      let gekozen: any = null;
      for (const d of unieke) {
        const opDag = spoorMails.filter((m: any) => m.dagOffset === d);
        const variant = opDag.find((m: any) => normType(m.verliesType) === type && m.verliesType);
        const algemeen = opDag.find((m: any) => !m.verliesType);
        const mail = variant ?? algemeen ?? null;
        if (mail) {
          gekozen = mail;
          break;
        }
      }
      if (!gekozen) continue;

      // Terugkom-conditie: deze mail alleen sturen als de lead NIET is teruggekomen in
      // de chat sinds de vorige mail. Referentietijd = wanneer de vorige mail (lagere
      // dagOffset, zelfde spoor) naar deze lead ging; anders het instroommoment.
      if (gekozen.alleenAlsNietTeruggekomen) {
        let sinds = lead.ingestroomdOp;
        for (const v of verzonden) {
          if (v.email.toLowerCase() !== email) continue;
          const vm = mailById.get(v.mailId);
          if (!vm || spoorVan(blokById.get(vm.blokId)?.spoor) !== leadSpoor) continue;
          if (vm.dagOffset >= gekozen.dagOffset) continue;
          if (v.sentAt > sinds) sinds = v.sentAt;
        }
        if (await leadIsTeruggekomen(ctx, email, sinds)) {
          teMarkerenOvergeslagen.push({ email, mailId: gekozen._id });
          continue; // wél gehad-markeren (hieronder), niet versturen
        }
      }

      teVerzenden.push({
        email,
        naam: lead.naam ?? null,
        type,
        mailId: gekozen._id,
        isLaatsteVanBlok: (maxDagPerBlok.get(gekozen.blokId) ?? -1) === gekozen.dagOffset,
      });
    }

    return { teVerzenden, teMarkerenKoper, teMarkerenOvergeslagen };
  },
});

// Controle vlak vóór verzending (na de spreiding kan er van alles veranderd zijn).
export const _evergreenCheck = internalQuery({
  args: { email: v.string(), mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const [lead, afgemeld, naProfiel, subs, verzonden, mail] = await Promise.all([
      ctx.db.query("funnelLeads").withIndex("by_email", (q) => q.eq("email", email)).first(),
      ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", email)).first(),
      ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", email)).first(),
      ctx.db.query("userSubscriptions").withIndex("by_email", (q) => q.eq("email", email)).collect(),
      ctx.db.query("funnelVerzonden").withIndex("by_email", (q) => q.eq("email", email)).collect(),
      ctx.db.get(args.mailId),
    ]);
    if (!lead || lead.status !== "in-backend") return null;
    if (afgemeld) return null;
    if (naProfiel || subs.some((s: any) => (s.pricePaid ?? 0) > 0)) return null;
    if (!mail || !mail.actief) return null;
    if (verzonden.some((v: any) => v.mailId === args.mailId)) return null;

    // De mail moet op het spoor van de lead vallen (spoor zit op het blok).
    const [alleMails, alleBlokken] = await Promise.all([
      ctx.db.query("funnelMails").collect(),
      ctx.db.query("funnelBlokken").collect(),
    ]);
    const mailById = new Map(alleMails.map((m: any) => [m._id, m]));
    const blokById = new Map(alleBlokken.map((b: any) => [b._id, b]));
    const mailSpoor = spoorVan(blokById.get(mail.blokId)?.spoor);
    if (spoorVan(lead.spoor) !== mailSpoor) return null;

    // Ook niet als er al een mail op dezelfde dagOffset (binnen HETZELFDE spoor) ging.
    const alDieDag = verzonden.some((v: any) => {
      const sm = mailById.get(v.mailId);
      if (!sm || sm.dagOffset !== mail.dagOffset) return false;
      return spoorVan(blokById.get(sm.blokId)?.spoor) === mailSpoor;
    });
    if (alDieDag) return null;
    return { mail, spoor: mailSpoor };
  },
});

export const _logEvergreenVerzonden = internalMutation({
  args: { email: v.string(), mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    await ctx.db.insert("funnelVerzonden", {
      email: args.email.toLowerCase(),
      mailId: args.mailId,
      sentAt: Date.now(),
    });
  },
});

// Markeer een mail als bewust overgeslagen (terugkom-conditie niet gehaald): geen
// verzending, maar wel "gehad" zodat de lead doorschuift naar de volgende mail.
export const _logEvergreenOvergeslagen = internalMutation({
  args: { email: v.string(), mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const bestaand = await ctx.db
      .query("funnelVerzonden")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (bestaand.some((v: any) => v.mailId === args.mailId)) return; // niet dubbel
    await ctx.db.insert("funnelVerzonden", {
      email,
      mailId: args.mailId,
      sentAt: Date.now(),
      overgeslagen: true,
    });
  },
});

export const _markeerKoperInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (lead && lead.status !== "koper") {
      await ctx.db.patch(lead._id, { status: "koper", updatedAt: Date.now() });
    }
  },
});

// ── Automatische instroom: EH-funnel afgerond → evergreen ────────────────────
// Losgekoppeld van de reactivatie. Zodra iemand de hele Even Houvast-opvolgreeks
// heeft afgerond (alle 6 mails), stroomt hij vanzelf de evergreen in, mits schoon
// (niet gekocht, niet afgemeld, geen Niet Alleen-klant, geen testadres) en nog niet
// in de funnel. Idempotent: draait elke dag mee vóór de verzending.
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026, gelijk aan mailFunnel/evenHouvastOpvolg
const EH_ALLE_MAILNUMMERS = [1, 2, 3, 4, 5, 6];

export const _instroomEHAfgerond = internalMutation({
  args: {},
  handler: async (ctx) => {
    const [brieven, verzonden, afmeldingen, naProfielen, subs, leads, excluded] =
      await Promise.all([
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("ehOpvolgVerzonden").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("funnelLeads").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
      ]);
    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const inFunnel = new Set(leads.map((l: any) => l.email.toLowerCase()));
    const kochtSet = new Set<string>();
    for (const s of subs) if (s.email && (s.pricePaid ?? 0) > 0) kochtSet.add(s.email.toLowerCase());

    const gestuurd = new Map<string, Set<number>>();
    for (const v of verzonden) {
      const e = v.email.toLowerCase();
      (gestuurd.get(e) ?? gestuurd.set(e, new Set()).get(e)!).add(v.mailNummer);
    }
    // Nieuwste brief per adres = naam + verliestype.
    const info = new Map<string, { naam: string | null; type: string | undefined; at: number }>();
    for (const b of brieven) {
      if (b.sentAt < EH_OPVOLG_START || !b.email) continue;
      const e = b.email.toLowerCase();
      const best = info.get(e);
      if (!best || b.sentAt > best.at) info.set(e, { naam: b.naam ?? null, type: b.verliesType, at: b.sentAt });
    }

    let ingestroomd = 0;
    for (const [email, meta] of info.entries()) {
      const nums = gestuurd.get(email);
      const compleet = !!nums && EH_ALLE_MAILNUMMERS.every((n) => nums.has(n));
      if (!compleet) continue;
      if (testSet.has(email) || kochtSet.has(email) || naSet.has(email) || afgemeldSet.has(email)) continue;
      if (inFunnel.has(email)) continue;
      const type = normType(meta.type);
      await ctx.db.insert("funnelLeads", {
        email,
        naam: meta.naam?.trim() || undefined,
        verliesType: type !== ALGEMEEN ? type : undefined,
        ingestroomdOp: Date.now(),
        bron: "even-houvast",
        status: "in-backend",
        updatedAt: Date.now(),
      });
      inFunnel.add(email);
      ingestroomd++;
    }
    return { ingestroomd };
  },
});

/** Handmatig één adres in de evergreen zetten (bijv. Ien zelf, om mee te lezen). */
export const _evergreenLeadToevoegen = internalMutation({
  args: { email: v.string(), naam: v.optional(v.string()), bron: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const bestaand = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (bestaand) return { toegevoegd: false, reden: "zat er al in" };
    await ctx.db.insert("funnelLeads", {
      email,
      naam: args.naam?.trim() || undefined,
      ingestroomdOp: Date.now(),
      bron: args.bron?.trim() || "test-ien",
      status: "in-backend",
      updatedAt: Date.now(),
    });
    return { toegevoegd: true };
  },
});

// ── Instap Benji-spoor: EH-lead die de Benji-link gebruikt ───────────────────
// Zodra een Even Houvast-lead de Benji-link gebruikt (brief-klik → proef gestart /
// in de chat), verhuist die naar spoor "benji" (verse dag 1) en krijgt geen EH-mails
// meer (dat regelt evenHouvastOpvolg via de spoor-check). Aangeroepen bij het
// inwisselen van de link (benjiStart.consumeToken) én realtime vanuit
// chat.sendUserMessage. Gated door BENJI_SPOOR_ACTIEF. Idempotent (al benji → klaar).
export async function probeerBenjiSpoorInstap(ctx: any, emailRaw: string) {
  if (process.env.BENJI_SPOOR_ACTIEF !== "true") return { enrolled: false, reden: "uit" };
  const email = (emailRaw || "").toLowerCase().trim();
  if (!email) return { enrolled: false, reden: "geen adres" };

  // Al op het Benji-spoor? Klaar.
  const lead = await ctx.db
    .query("funnelLeads")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
  if (lead && spoorVan(lead.spoor) === "benji") return { enrolled: false, reden: "al benji" };

  // Alleen Even Houvast-leads (die kregen de brief + Benji-link).
  const brief = await ctx.db
    .query("houvastBrieven")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
  if (!brief) return { enrolled: false, reden: "geen EH-lead" };

  // Niet wie zich afmeldde of al betaalde (trial telt niet als betaald).
  const [afgemeld, subs] = await Promise.all([
    ctx.db.query("ehAfmeldingen").withIndex("by_email", (q: any) => q.eq("email", email)).first(),
    ctx.db.query("userSubscriptions").withIndex("by_email", (q: any) => q.eq("email", email)).collect(),
  ]);
  if (afgemeld) return { enrolled: false, reden: "afgemeld" };
  if (subs.some((s: any) => (s.pricePaid ?? 0) > 0)) return { enrolled: false, reden: "al klant" };

  // Overzetten naar spoor benji, verse dag 1. Bestaande (evergreen-)lead verhuist mee.
  const now = Date.now();
  const type = normType(brief.verliesType);
  if (lead) {
    await ctx.db.patch(lead._id, {
      spoor: "benji",
      ingestroomdOp: now,
      status: "in-backend",
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("funnelLeads", {
      email,
      naam: brief.naam?.trim() || undefined,
      verliesType: type !== ALGEMEEN ? type : undefined,
      spoor: "benji",
      ingestroomdOp: now,
      bron: "benji",
      status: "in-backend",
      updatedAt: now,
    });
  }
  return { enrolled: true };
}

export const _benjiSpoorInstroomCheck = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => probeerBenjiSpoorInstap(ctx, args.email),
});

// ── Handoff: na afloop van een spoor door naar het volgende ──────────────────
// Alleen sporen in deze map ketenen; de rest eindigt gewoon. Benji-doorlopers die
// niet kochten gaan naar de evergreen, zodat ze alsnog het Niet Alleen-aanbod
// krijgen (kopers vallen daar uit, dat regelt de evergreen zelf). Verse dag 1.
const SPOOR_VERVOLG: Record<string, string> = { benji: "evergreen" };
const HANDOFF_RUST_DAGEN = 3;

export const _spoorHandoff = internalMutation({
  args: {},
  handler: async (ctx) => {
    const nu = Date.now();
    const [leads, blokken, mails, verzonden] = await Promise.all([
      ctx.db.query("funnelLeads").withIndex("by_status", (q) => q.eq("status", "in-backend")).collect(),
      ctx.db.query("funnelBlokken").collect(),
      ctx.db.query("funnelMails").collect(),
      ctx.db.query("funnelVerzonden").collect(),
    ]);
    const blokById = new Map(blokken.map((b: any) => [b._id, b]));
    const mailById = new Map(mails.map((m: any) => [m._id, m]));

    // Hoogste dagOffset per spoor (alleen actieve mails in actieve blokken).
    const maxDagPerSpoor = new Map<string, number>();
    for (const m of mails) {
      const b = blokById.get(m.blokId);
      if (!m.actief || !b || !b.actief) continue;
      const sp = spoorVan(b.spoor);
      maxDagPerSpoor.set(sp, Math.max(maxDagPerSpoor.get(sp) ?? -1, m.dagOffset));
    }
    // Per e-mail: welke (spoor|dagOffset) heeft die al gehad.
    const gehad = new Map<string, Set<string>>();
    for (const v of verzonden) {
      const m = mailById.get(v.mailId);
      if (!m) continue;
      const sp = spoorVan(blokById.get(m.blokId)?.spoor);
      const e = v.email.toLowerCase();
      (gehad.get(e) ?? gehad.set(e, new Set()).get(e)!).add(`${sp}|${m.dagOffset}`);
    }

    let verhuisd = 0;
    for (const lead of leads) {
      const sp = spoorVan(lead.spoor);
      const vervolg = SPOOR_VERVOLG[sp];
      if (!vervolg) continue;
      const maxDag = maxDagPerSpoor.get(sp);
      if (maxDag === undefined) continue; // spoor nog leeg → niks te ketenen
      // Laatste mail van het spoor echt gehad?
      if (!gehad.get(lead.email.toLowerCase())?.has(`${sp}|${maxDag}`)) continue;
      const dag = Math.floor((nu - lead.ingestroomdOp) / DAG_MS) + 1;
      if (dag < maxDag + HANDOFF_RUST_DAGEN) continue; // nog even rust na de laatste mail
      await ctx.db.patch(lead._id, {
        spoor: vervolg === DEFAULT_SPOOR ? undefined : vervolg,
        ingestroomdOp: nu, // verse dag 1 in het nieuwe spoor
        updatedAt: nu,
      });
      verhuisd++;
    }
    return { verhuisd };
  },
});

// ── De dagelijkse motor ──────────────────────────────────────────────────────

export const processEvergreen = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    if (process.env.EVERGREEN_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    // Eerst nieuwe EH-doorlopers laten instromen (losgekoppeld van de reactivatie),
    // daarna pas de verzending plannen. Nieuw ingestroomde leads staan op dag 1, dus
    // ze krijgen vanavond nog niets (eerste mail op dag 7).
    await ctx.runMutation(internal.evergreen._instroomEHAfgerond, {});

    // Doorlopers van een spoor doorzetten naar hun vervolgspoor (bijv. benji → evergreen).
    await ctx.runMutation(internal.evergreen._spoorHandoff, {});

    const { teVerzenden, teMarkerenKoper, teMarkerenOvergeslagen } =
      await ctx.runQuery(internal.evergreen._evergreenPlan, {});

    for (const email of teMarkerenKoper) {
      await ctx.runMutation(internal.evergreen._markeerKoperInternal, { email });
    }

    // Terugkom-conditie niet gehaald (lead kwam terug): mail overslaan maar wél als
    // gehad wegschrijven, zodat de lead doorschuift naar de volgende mail.
    for (const { email, mailId } of teMarkerenOvergeslagen) {
      await ctx.runMutation(internal.evergreen._logEvergreenOvergeslagen, { email, mailId });
    }

    // Gespreid inplannen (kleine pieken, tegen Outlook/Hotmail-throttling).
    const intervalMs = Math.max(0, Number(process.env.EVERGREEN_SPREID_SECONDEN ?? "90")) * 1000;
    for (let i = 0; i < teVerzenden.length; i++) {
      await ctx.scheduler.runAfter(i * intervalMs, internal.evergreen._verstuurEvergreen, teVerzenden[i]);
    }
  },
});

export const _verstuurEvergreen = internalAction({
  args: {
    email: v.string(),
    naam: v.union(v.string(), v.null()),
    type: v.string(),
    mailId: v.id("funnelMails"),
    isLaatsteVanBlok: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    if (process.env.EVERGREEN_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const check = await ctx.runQuery(internal.evergreen._evergreenCheck, {
      email: args.email,
      mailId: args.mailId,
    });
    if (!check) return;
    const mail: any = check.mail;

    try {
      const html = await bouwEvergreenHtml(ctx, {
        email: args.email,
        naam: args.naam ?? undefined,
        type: args.type,
        subject: mail.subject,
        bodyText: mail.bodyText,
        buttonText: mail.buttonText,
        buttonUrl: mail.buttonUrl,
        imageUrl: mail.imageUrl,
        imageCaption: mail.imageCaption,
        isLaatsteVanBlok: args.isLaatsteVanBlok,
        spoor: check.spoor,
      });
      await verstuurEvergreenEmail({
        to: args.email,
        subject: persoonlijkOnderwerp(mail.subject, args.naam ?? undefined),
        html,
        apiKey,
        mailId: String(args.mailId),
      });
      await ctx.runMutation(internal.evergreen._logEvergreenVerzonden, {
        email: args.email,
        mailId: args.mailId,
      });
    } catch (e) {
      console.error(`Evergreen-mail mislukt voor ${args.email}:`, e);
    }
  },
});

// ── Uitstroom bij aankoop + rustoptie ────────────────────────────────────────

/** Zet een lead op "koper" (uit de funnel). Aangeroepen door de Stripe-webhook. */
export const markeerKoper = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (lead && lead.status !== "koper") {
      await ctx.db.patch(lead._id, { status: "koper", updatedAt: Date.now() });
    }
    return { ok: true };
  },
});

/** Rustoptie: alleen nog de maandmail. Aangeroepen door /api/rust na tokencheck. */
export const zetAlleenMaandmail = mutation({
  args: { email: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Niet geautoriseerd");
    }
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (lead && lead.status === "in-backend") {
      await ctx.db.patch(lead._id, { status: "alleen-maandmail", updatedAt: Date.now() });
    }
    return { ok: true };
  },
});

// ── Testmail naar jezelf (admin) ─────────────────────────────────────────────

export const _evergreenMailVoorTest = internalQuery({
  args: { mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    const mail = await ctx.db.get(args.mailId);
    if (!mail) return null;
    const alleMails = await ctx.db
      .query("funnelMails")
      .withIndex("by_blok", (q) => q.eq("blokId", mail.blokId))
      .collect();
    const maxDag = alleMails
      .filter((m: any) => m.actief)
      .reduce((mx: number, m: any) => Math.max(mx, m.dagOffset), -1);
    const blok = await ctx.db.get(mail.blokId);
    return { mail, isLaatsteVanBlok: mail.dagOffset === maxDag, spoor: spoorVan(blok?.spoor) };
  },
});

export const stuurTestEvergreen = action({
  args: {
    adminToken: v.string(),
    mailId: v.id("funnelMails"),
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");

    const res = await ctx.runQuery(internal.evergreen._evergreenMailVoorTest, { mailId: args.mailId });
    if (!res) throw new Error("Mail niet gevonden");
    const mail: any = res.mail;

    const html = await bouwEvergreenHtml(ctx, {
      email: args.email,
      naam: args.naam,
      type: normType(args.type),
      subject: mail.subject,
      bodyText: mail.bodyText,
      buttonText: mail.buttonText,
      buttonUrl: mail.buttonUrl,
      imageUrl: mail.imageUrl,
      imageCaption: mail.imageCaption,
      isLaatsteVanBlok: res.isLaatsteVanBlok,
      spoor: res.spoor,
    });
    await verstuurEvergreenEmail({
      to: args.email,
      subject: persoonlijkOnderwerp(mail.subject, args.naam),
      html,
      apiKey,
      mailId: String(args.mailId),
    });
    return { ok: true };
  },
});

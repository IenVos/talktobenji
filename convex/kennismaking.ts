/**
 * Kennismakingsgesprek (gratis, vóór aankoop).
 *
 * Ien stelt per persoon een paar concrete data+tijden voor; de genodigde kiest
 * er één via een eigen (mailbare / losse) link. Los van de betaalde 8-weken
 * reeks (zie booking.ts / /plan/[token]).
 */
import { v } from "convex/values";
import { query, mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkAdmin } from "./adminAuth";

const SITE = "https://www.talktobenji.com";
const IEN_EMAIL = process.env.BOOKING_ADMIN_EMAIL || "contactmetien@talktobenji.com";
const FROM = "Talk To Benji <noreply@talktobenji.com>";
const DEF_DUUR = 30;

const DAG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MND = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function todayNL(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return toISO(new Date(Date.now() + 2 * 3600 * 1000));
  }
}
function fmtNL(datum: string, tijd?: string): string {
  const d = new Date(datum + "T12:00:00Z");
  return `${DAG[d.getUTCDay()]} ${d.getUTCDate()} ${MND[d.getUTCMonth()]}${tijd ? ` om ${tijd}` : ""}`;
}
type Optie = { datum: string; tijd: string };
function parseOpties(json: string | undefined): Optie[] {
  try {
    const p = JSON.parse(json || "[]");
    if (Array.isArray(p)) return p.filter((o) => o && o.datum && o.tijd).map((o) => ({ datum: String(o.datum), tijd: String(o.tijd) }));
  } catch {}
  return [];
}
async function videoUrl(ctx: any): Promise<string> {
  const c = await ctx.db.query("bookingConfig").first();
  return c?.videoRoomUrl ?? "";
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    await checkAdmin(ctx, adminToken);
    const rows = await ctx.db.query("kennismakingen").collect();
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        _id: r._id,
        naam: r.naam,
        email: r.email,
        status: r.status,
        opties: parseOpties(r.optiesJson),
        gekozenDatum: r.gekozenDatum ?? null,
        gekozenTijd: r.gekozenTijd ?? null,
        duurMin: r.duurMin ?? DEF_DUUR,
        createdAt: r.createdAt,
        link: `${SITE}/kennismaking/${r.token}`,
      }));
  },
});

export const create = mutation({
  args: {
    adminToken: v.string(),
    naam: v.string(),
    email: v.string(),
    opties: v.array(v.object({ datum: v.string(), tijd: v.string() })),
    duurMin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const opties = args.opties.filter((o) => o.datum && o.tijd);
    if (opties.length === 0) throw new Error("Voeg minstens één datum + tijd toe.");
    const token = crypto.randomUUID().replace(/-/g, "");
    const id = await ctx.db.insert("kennismakingen", {
      naam: args.naam.trim(),
      email: args.email.trim(),
      token,
      optiesJson: JSON.stringify(opties),
      duurMin: args.duurMin ?? DEF_DUUR,
      status: "uitgenodigd",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { id, token, link: `${SITE}/kennismaking/${token}` };
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("kennismakingen") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

// Stuurt de uitnodiging (met de keuze-link) naar de genodigde.
export const sendInvite = mutation({
  args: { adminToken: v.string(), id: v.id("kennismakingen") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const k = await ctx.db.get(args.id);
    if (!k) throw new Error("Niet gevonden");
    await ctx.scheduler.runAfter(0, internal.kennismaking.mailUitnodiging, {
      naam: k.naam, email: k.email, token: k.token, opties: parseOpties(k.optiesJson),
    });
    return { ok: true };
  },
});

// Alle al bezette momenten ("datum|tijd"): andere geplande kennismakingen +
// reeks-afspraken (gepland/verzet). Zo kan één moment nooit dubbel geboekt worden.
async function bezetteMomenten(ctx: any, excludeKmId?: any): Promise<Set<string>> {
  const bezet = new Set<string>();
  const kms = await ctx.db.query("kennismakingen").collect();
  for (const km of kms) {
    if (excludeKmId && km._id === excludeKmId) continue;
    if (km.status === "gepland" && km.gekozenDatum && km.gekozenTijd) bezet.add(`${km.gekozenDatum}|${km.gekozenTijd}`);
  }
  const appts = await ctx.db.query("appointments").collect();
  for (const a of appts) {
    if (a.status === "gepland" || a.status === "verzet") bezet.add(`${a.datum}|${a.tijd}`);
  }
  return bezet;
}

// ─── PUBLIEK ──────────────────────────────────────────────────────────────────
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const k = await ctx.db.query("kennismakingen").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (!k) return null;
    const bezet = await bezetteMomenten(ctx, k._id);
    return {
      naam: k.naam,
      status: k.status,
      opties: parseOpties(k.optiesJson).map((o) => ({ ...o, bezet: bezet.has(`${o.datum}|${o.tijd}`) })),
      gekozenDatum: k.gekozenDatum ?? null,
      gekozenTijd: k.gekozenTijd ?? null,
      duurMin: k.duurMin ?? DEF_DUUR,
      videoRoomUrl: k.videoRoomUrl ?? "",
    };
  },
});

export const kies = mutation({
  args: { token: v.string(), datum: v.string(), tijd: v.string() },
  handler: async (ctx, args) => {
    const k = await ctx.db.query("kennismakingen").withIndex("by_token", (q) => q.eq("token", args.token)).first();
    if (!k) throw new Error("Onbekende link");
    if (k.status === "gepland") throw new Error("Je hebt al een moment gekozen.");
    const opties = parseOpties(k.optiesJson);
    if (!opties.some((o) => o.datum === args.datum && o.tijd === args.tijd)) {
      throw new Error("Kies een van de voorgestelde momenten.");
    }
    // Harde blokkade tegen dubbelboeken: is dit moment al bezet?
    const bezet = await bezetteMomenten(ctx, k._id);
    if (bezet.has(`${args.datum}|${args.tijd}`)) {
      throw new Error("Dat moment is net bezet, kies een ander.");
    }
    const video = await videoUrl(ctx);
    await ctx.db.patch(k._id, {
      gekozenDatum: args.datum, gekozenTijd: args.tijd, status: "gepland",
      videoRoomUrl: video, updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.kennismaking.mailBevestiging, {
      naam: k.naam, email: k.email, datum: args.datum, tijd: args.tijd,
      duurMin: k.duurMin ?? DEF_DUUR, videoRoomUrl: video,
    });
    return { ok: true };
  },
});

// ─── E-MAILS ────────────────────────────────────────────────────────────────
function wrapMail(inner: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212b24;background:#f4f6f1;padding:32px 24px;border-radius:14px">${inner}<p style="font-size:12px;color:#7c8a7f;margin-top:24px">Talk To Benji &middot; Zij aan Zij</p></div>`;
}
function knop(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4a7c59;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px">${label}</a>`;
}
function icsFor(datum: string, tijd: string, duurMin: number, videoRoomUrl: string): string {
  const dt = (dd: string, tt: string) => `${dd.replace(/-/g, "")}T${tt.replace(":", "")}00`;
  const d = new Date(`${datum}T${tijd}:00Z`); d.setUTCMinutes(d.getUTCMinutes() + duurMin);
  const eind = `${toISO(d).replace(/-/g, "")}T${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}00`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Talk To Benji//Kennismaking//NL", "BEGIN:VEVENT",
    `UID:zaz-km-${datum}-${tijd}-${Math.random().toString(36).slice(2)}@talktobenji.com`,
    `DTSTAMP:${dt(todayNL(), "12:00")}`,
    `DTSTART;TZID=Europe/Amsterdam:${dt(datum, tijd)}`,
    `DTEND;TZID=Europe/Amsterdam:${eind}`,
    "SUMMARY:Kennismaking met Ien (Zij aan Zij)",
    videoRoomUrl ? `LOCATION:${videoRoomUrl}` : "",
    videoRoomUrl ? `DESCRIPTION:Videogesprek: ${videoRoomUrl}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
async function verstuur(args: { to: string; subject: string; html: string; ics?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const body: any = { from: FROM, to: [args.to], subject: args.subject, html: args.html };
  if (args.ics) body.attachments = [{ filename: "kennismaking.ics", content: btoa(unescape(encodeURIComponent(args.ics))) }];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Mail mislukt: ${await res.text()}`);
}

export const mailUitnodiging = internalAction({
  args: {
    naam: v.string(), email: v.string(), token: v.string(),
    opties: v.array(v.object({ datum: v.string(), tijd: v.string() })),
  },
  handler: async (_ctx, args) => {
    const rijen = args.opties.map((o) => `<li style="margin-bottom:4px">${fmtNL(o.datum, o.tijd)}</li>`).join("");
    const inner = `
      <p style="font-size:17px;color:#212b24"><b>Zullen we kennismaken?</b></p>
      <p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${args.naam}, fijn dat je er bent. Ik stel een paar momenten voor, kies er eentje die jou het beste schikt:</p>
      <ul style="font-size:15px;line-height:1.7;color:#212b24;padding-left:18px">${rijen}</ul>
      <p style="font-size:15px;line-height:1.7;color:#485349">${knop(`${SITE}/kennismaking/${args.token}`, "Kies een moment")}</p>
      <p style="font-size:15px;line-height:1.7;color:#485349">Warme groet,<br>Ien</p>`;
    await verstuur({ to: args.email, subject: "Zullen we kennismaken? Kies een moment", html: wrapMail(inner) });
  },
});

export const mailBevestiging = internalAction({
  args: {
    naam: v.string(), email: v.string(), datum: v.string(), tijd: v.string(),
    duurMin: v.number(), videoRoomUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const video = args.videoRoomUrl ? `<p style="font-size:15px;line-height:1.7;color:#485349">We spreken elkaar op deze videolink (met wachtkamer):<br><a href="${args.videoRoomUrl}" style="color:#3b6448">${args.videoRoomUrl}</a></p>` : "";
    const inner = `
      <p style="font-size:17px;color:#212b24"><b>Onze kennismaking staat gepland</b></p>
      <p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${args.naam}, ik kijk ernaar uit. We spreken elkaar op <b>${fmtNL(args.datum, args.tijd)}</b> (${args.duurMin} min). In de bijlage zit een agenda-bestand.</p>
      ${video}
      <p style="font-size:15px;line-height:1.7;color:#485349">Warme groet,<br>Ien</p>`;
    const ics = icsFor(args.datum, args.tijd, args.duurMin, args.videoRoomUrl);
    await verstuur({ to: args.email, subject: `Onze kennismaking: ${fmtNL(args.datum, args.tijd)}`, html: wrapMail(inner), ics });
    await verstuur({ to: IEN_EMAIL, subject: `Kennismaking gepland: ${args.naam}`, html: wrapMail(`<p style="font-size:15px;color:#212b24">${args.naam} (${args.email}) heeft de kennismaking gekozen: <b>${fmtNL(args.datum, args.tijd)}</b>.</p>`) });
  },
});

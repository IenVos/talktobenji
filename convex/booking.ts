import { v } from "convex/values";
import { query, mutation, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkAdmin } from "./adminAuth";

// ─── Constanten ──────────────────────────────────────────────────────────────
const SITE = "https://www.talktobenji.com";
const IEN_EMAIL = process.env.BOOKING_ADMIN_EMAIL || "contactmetien@talktobenji.com";
const FROM = "Talk To Benji <noreply@talktobenji.com>";
const DEF_AANTAL = 4;
const DEF_INTERVAL = 14;
const DEF_DUREN = [60, 45, 45, 60];
const DEF_WEKEN = 8;

const DAG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const DAG_KORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MND = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

// ─── Datum-helpers (kalenderdatums, Nederlandse tijd) ────────────────────────
function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function addDays(datum: string, n: number): string {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}
function weekdayOf(datum: string): number {
  return new Date(datum + "T12:00:00Z").getUTCDay();
}
function todayNL(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    // Terugval: benader NL-tijd met +2 uur t.o.v. UTC.
    const d = new Date(Date.now() + 2 * 3600 * 1000);
    return toISO(d);
  }
}
function fmtNL(datum: string, tijd: string): string {
  const d = new Date(datum + "T12:00:00Z");
  return `${DAG[d.getUTCDay()]} ${d.getUTCDate()} ${MND[d.getUTCMonth()]}${tijd ? ` om ${tijd}` : ""}`;
}
function parseDuren(json: string | undefined, aantal: number): number[] {
  let arr: number[] = [];
  try { const p = JSON.parse(json || "[]"); if (Array.isArray(p)) arr = p.map((x) => Number(x) || 45); } catch {}
  if (arr.length === 0) arr = [...DEF_DUREN];
  while (arr.length < aantal) arr.push(arr[arr.length - 1] || 45);
  return arr.slice(0, aantal);
}

type ConfigT = { videoRoomUrl: string; aantalGesprekken: number; intervalDagen: number; duren: number[]; weken: number };
async function getConfig(ctx: any): Promise<ConfigT> {
  const c = await ctx.db.query("bookingConfig").first();
  const aantal = c?.aantalGesprekken ?? DEF_AANTAL;
  return {
    videoRoomUrl: c?.videoRoomUrl ?? "",
    aantalGesprekken: aantal,
    intervalDagen: c?.intervalDagen ?? DEF_INTERVAL,
    duren: parseDuren(c?.durenJson, aantal),
    weken: c?.weken ?? DEF_WEKEN,
  };
}

// Vrije concrete momenten (datum + tijd) vanaf een datum, voor N dagen vooruit.
async function computeOpenSlots(
  ctx: any,
  opts: { vanaf: string; dagen: number; excludeApptId?: string }
): Promise<{ datum: string; tijd: string; weekday: number }[]> {
  const slots = await ctx.db.query("bookingSlots").collect();
  const perDag: Record<number, string[]> = {};
  for (const s of slots) if (s.actief) (perDag[s.weekday] ||= []).push(s.tijd);
  for (const k of Object.keys(perDag)) perDag[+k].sort();

  const blocks = new Set((await ctx.db.query("bookingBlocks").collect()).map((b: any) => b.datum));

  const taken = new Set<string>();
  const appts = await ctx.db.query("appointments").collect();
  for (const a of appts) {
    if (opts.excludeApptId && a._id === opts.excludeApptId) continue;
    if (a.status === "gepland" || a.status === "verzet") taken.add(`${a.datum}|${a.tijd}`);
  }

  const out: { datum: string; tijd: string; weekday: number }[] = [];
  for (let i = 0; i < opts.dagen; i++) {
    const datum = addDays(opts.vanaf, i);
    if (blocks.has(datum)) continue;
    const wd = weekdayOf(datum);
    for (const tijd of perDag[wd] || []) {
      if (taken.has(`${datum}|${tijd}`)) continue;
      out.push({ datum, tijd, weekday: wd });
    }
  }
  return out;
}

// ─── ADMIN: configuratie ─────────────────────────────────────────────────────
export const getConfigAdmin = query({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    await checkAdmin(ctx, adminToken);
    return await getConfig(ctx);
  },
});

export const setConfig = mutation({
  args: {
    adminToken: v.string(),
    videoRoomUrl: v.string(),
    aantalGesprekken: v.number(),
    intervalDagen: v.number(),
    durenJson: v.string(),
    weken: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaand = await ctx.db.query("bookingConfig").first();
    const data = {
      videoRoomUrl: args.videoRoomUrl,
      aantalGesprekken: args.aantalGesprekken,
      intervalDagen: args.intervalDagen,
      durenJson: args.durenJson,
      weken: args.weken,
      updatedAt: Date.now(),
    };
    if (bestaand) await ctx.db.patch(bestaand._id, data);
    else await ctx.db.insert("bookingConfig", data);
  },
});

// ─── ADMIN: beschikbaarheid (weekdag + tijd) ─────────────────────────────────
export const listSlots = query({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    await checkAdmin(ctx, adminToken);
    const slots = await ctx.db.query("bookingSlots").collect();
    return slots.sort((a, b) => a.weekday - b.weekday || a.tijd.localeCompare(b.tijd));
  },
});

export const addSlot = mutation({
  args: { adminToken: v.string(), weekday: v.number(), tijd: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaand = (await ctx.db.query("bookingSlots").collect()).find((s) => s.weekday === args.weekday && s.tijd === args.tijd);
    if (bestaand) { await ctx.db.patch(bestaand._id, { actief: true, updatedAt: Date.now() }); return bestaand._id; }
    return await ctx.db.insert("bookingSlots", { weekday: args.weekday, tijd: args.tijd, actief: true, updatedAt: Date.now() });
  },
});

export const toggleSlot = mutation({
  args: { adminToken: v.string(), id: v.id("bookingSlots"), actief: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, { actief: args.actief, updatedAt: Date.now() });
  },
});

export const removeSlot = mutation({
  args: { adminToken: v.string(), id: v.id("bookingSlots") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

// ─── ADMIN: geblokkeerde dagen ───────────────────────────────────────────────
export const listBlocks = query({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    await checkAdmin(ctx, adminToken);
    return (await ctx.db.query("bookingBlocks").collect()).sort((a, b) => a.datum.localeCompare(b.datum));
  },
});

export const addBlock = mutation({
  args: { adminToken: v.string(), datum: v.string(), reden: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.insert("bookingBlocks", { datum: args.datum, reden: args.reden });
  },
});

export const removeBlock = mutation({
  args: { adminToken: v.string(), id: v.id("bookingBlocks") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

// ─── ADMIN: deelnemers + boeklinks ───────────────────────────────────────────
export const listClients = query({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    await checkAdmin(ctx, adminToken);
    const clients = await ctx.db.query("bookingClients").collect();
    return clients.sort((a, b) => b.createdAt - a.createdAt).map((c) => ({ ...c, link: `${SITE}/plan/${c.token}` }));
  },
});

export const createClient = mutation({
  args: { adminToken: v.string(), naam: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const token = crypto.randomUUID().replace(/-/g, "");
    const id = await ctx.db.insert("bookingClients", {
      naam: args.naam.trim(),
      email: args.email.trim(),
      token,
      status: "nieuw",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { id, token, link: `${SITE}/plan/${token}` };
  },
});

export const deleteClient = mutation({
  args: { adminToken: v.string(), id: v.id("bookingClients") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const appts = await ctx.db.query("appointments").withIndex("by_client", (q) => q.eq("clientId", args.id)).collect();
    for (const a of appts) await ctx.db.delete(a._id);
    await ctx.db.delete(args.id);
  },
});

// ─── ADMIN: afspraken-overzicht + beheer ─────────────────────────────────────
export const adminListAppointments = query({
  args: { adminToken: v.string(), alles: v.optional(v.boolean()) },
  handler: async (ctx, { adminToken, alles }) => {
    await checkAdmin(ctx, adminToken);
    const vandaag = todayNL();
    let appts = await ctx.db.query("appointments").collect();
    if (!alles) appts = appts.filter((a) => a.datum >= vandaag && a.status !== "afgemeld");
    return appts.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
  },
});

export const adminOpenSlots = query({
  args: { adminToken: v.string(), vanaf: v.optional(v.string()), dagen: v.optional(v.number()), excludeApptId: v.optional(v.id("appointments")) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await computeOpenSlots(ctx, { vanaf: args.vanaf || todayNL(), dagen: args.dagen || 56, excludeApptId: args.excludeApptId });
  },
});

export const adminReschedule = mutation({
  args: { adminToken: v.string(), id: v.id("appointments"), datum: v.string(), tijd: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const a = await ctx.db.get(args.id);
    if (!a) return;
    await ctx.db.patch(args.id, {
      origineelDatum: a.origineelDatum ?? a.datum,
      origineelTijd: a.origineelTijd ?? a.tijd,
      datum: args.datum, tijd: args.tijd, status: "verzet",
      reminderSentAt: undefined, updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.booking.mailVerzet, {
      clientNaam: a.clientNaam, clientEmail: a.clientEmail, index: a.index,
      oudDatum: a.datum, oudTijd: a.tijd, datum: args.datum, tijd: args.tijd, doorIen: true,
    });
  },
});

export const adminCancel = mutation({
  args: { adminToken: v.string(), id: v.id("appointments") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const a = await ctx.db.get(args.id);
    if (!a) return;
    await ctx.db.patch(args.id, { status: "afgemeld", updatedAt: Date.now() });
  },
});

// ─── PUBLIEK: boeken via token ───────────────────────────────────────────────
export const getBookingByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const client = await ctx.db.query("bookingClients").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (!client) return null;
    const config = await getConfig(ctx);
    const appts = await ctx.db.query("appointments").withIndex("by_client", (q) => q.eq("clientId", client._id)).collect();
    const geboekt = appts.filter((a) => a.status !== "afgemeld").sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
    const openSlots = geboekt.length ? [] : await computeOpenSlots(ctx, { vanaf: addDays(todayNL(), 1), dagen: 28 });
    return {
      naam: client.naam,
      status: client.status,
      aantal: config.aantalGesprekken,
      interval: config.intervalDagen,
      duren: config.duren,
      videoRoomUrl: geboekt.length ? (client.videoRoomUrl || config.videoRoomUrl) : config.videoRoomUrl,
      alGeboekt: geboekt.map((a) => ({ index: a.index, datum: a.datum, tijd: a.tijd, duurMin: a.duurMin, status: a.status, token: a.token })),
      openSlots,
    };
  },
});

export const bookSeries = mutation({
  args: { token: v.string(), datum: v.string(), tijd: v.string() },
  handler: async (ctx, args) => {
    const client = await ctx.db.query("bookingClients").withIndex("by_token", (q) => q.eq("token", args.token)).first();
    if (!client) throw new Error("Onbekende link");
    const bestaand = await ctx.db.query("appointments").withIndex("by_client", (q) => q.eq("clientId", client._id)).collect();
    if (bestaand.some((a) => a.status !== "afgemeld")) throw new Error("Je gesprekken staan al gepland.");

    const config = await getConfig(ctx);
    const blocks = new Set((await ctx.db.query("bookingBlocks").collect()).map((b) => b.datum));
    const alleAppts = await ctx.db.query("appointments").collect();
    const taken = new Set(alleAppts.filter((a) => a.status === "gepland" || a.status === "verzet").map((a) => `${a.datum}|${a.tijd}`));

    const gemaakt: { index: number; datum: string; tijd: string; duurMin: number }[] = [];
    for (let i = 0; i < config.aantalGesprekken; i++) {
      let datum = addDays(args.datum, i * config.intervalDagen);
      // valt een moment op een geblokkeerde/bezette dag? schuif per week door.
      let tries = 0;
      while ((blocks.has(datum) || taken.has(`${datum}|${args.tijd}`)) && tries < 8) { datum = addDays(datum, 7); tries++; }
      taken.add(`${datum}|${args.tijd}`);
      const duurMin = config.duren[i] ?? 45;
      await ctx.db.insert("appointments", {
        clientId: client._id, clientNaam: client.naam, clientEmail: client.email,
        index: i + 1, datum, tijd: args.tijd, duurMin, status: "gepland",
        token: crypto.randomUUID().replace(/-/g, ""), createdAt: Date.now(), updatedAt: Date.now(),
      });
      gemaakt.push({ index: i + 1, datum, tijd: args.tijd, duurMin });
    }
    await ctx.db.patch(client._id, { status: "gepland", startDatum: gemaakt[0].datum, videoRoomUrl: config.videoRoomUrl, updatedAt: Date.now() });

    await ctx.scheduler.runAfter(0, internal.booking.mailBevestiging, {
      clientNaam: client.naam, clientEmail: client.email,
      afspraken: gemaakt, videoRoomUrl: config.videoRoomUrl,
    });
    return { ok: true };
  },
});

// ─── PUBLIEK: één afspraak verzetten / afmelden ──────────────────────────────
export const getAppointmentByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const a = await ctx.db.query("appointments").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (!a) return null;
    const openSlots = await computeOpenSlots(ctx, { vanaf: addDays(todayNL(), 1), dagen: 56, excludeApptId: a._id });
    return {
      naam: a.clientNaam, index: a.index, datum: a.datum, tijd: a.tijd, duurMin: a.duurMin, status: a.status, openSlots,
    };
  },
});

export const reschedulePublic = mutation({
  args: { token: v.string(), datum: v.string(), tijd: v.string() },
  handler: async (ctx, args) => {
    const a = await ctx.db.query("appointments").withIndex("by_token", (q) => q.eq("token", args.token)).first();
    if (!a) throw new Error("Onbekende link");
    // is het gekozen moment nog vrij?
    const taken = (await ctx.db.query("appointments").collect()).some(
      (x) => x._id !== a._id && (x.status === "gepland" || x.status === "verzet") && x.datum === args.datum && x.tijd === args.tijd
    );
    if (taken) throw new Error("Dat moment is net bezet, kies een ander.");
    await ctx.db.patch(a._id, {
      origineelDatum: a.origineelDatum ?? a.datum,
      origineelTijd: a.origineelTijd ?? a.tijd,
      datum: args.datum, tijd: args.tijd, status: "verzet", reminderSentAt: undefined, updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.booking.mailVerzet, {
      clientNaam: a.clientNaam, clientEmail: a.clientEmail, index: a.index,
      oudDatum: a.datum, oudTijd: a.tijd, datum: args.datum, tijd: args.tijd, doorIen: false,
    });
    return { ok: true };
  },
});

export const cancelPublic = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const a = await ctx.db.query("appointments").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (!a) throw new Error("Onbekende link");
    await ctx.db.patch(a._id, { status: "afgemeld", updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.booking.mailAfmelding, {
      clientNaam: a.clientNaam, clientEmail: a.clientEmail, index: a.index, datum: a.datum, tijd: a.tijd,
    });
    return { ok: true };
  },
});

// ─── E-MAILS (Resend) ────────────────────────────────────────────────────────
function wrapMail(inner: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212b24;background:#f4f6f1;padding:32px 24px;border-radius:14px">${inner}<p style="font-size:12px;color:#7c8a7f;margin-top:24px">Talk To Benji &middot; Zij aan Zij</p></div>`;
}
function knop(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4a7c59;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px">${label}</a>`;
}
function icsFor(afspraken: { index: number; datum: string; tijd: string; duurMin: number }[], naam: string, videoRoomUrl: string): string {
  const dt = (datum: string, tijd: string) => `${datum.replace(/-/g, "")}T${tijd.replace(":", "")}00`;
  const einde = (datum: string, tijd: string, dur: number) => {
    const d = new Date(`${datum}T${tijd}:00Z`); d.setUTCMinutes(d.getUTCMinutes() + dur);
    return `${toISO(d).replace(/-/g, "")}T${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}00`;
  };
  const ev = afspraken.map((a) => [
    "BEGIN:VEVENT",
    `UID:zaz-${a.datum}-${a.tijd}-${Math.random().toString(36).slice(2)}@talktobenji.com`,
    `DTSTAMP:${dt(todayNL(), "12:00")}`,
    `DTSTART;TZID=Europe/Amsterdam:${dt(a.datum, a.tijd)}`,
    `DTEND;TZID=Europe/Amsterdam:${einde(a.datum, a.tijd, a.duurMin)}`,
    `SUMMARY:Zij aan Zij, gesprek ${a.index} met Ien`,
    videoRoomUrl ? `LOCATION:${videoRoomUrl}` : "",
    videoRoomUrl ? `DESCRIPTION:Videogesprek: ${videoRoomUrl}` : "",
    "END:VEVENT",
  ].filter(Boolean).join("\r\n"));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Talk To Benji//Zij aan Zij//NL", ...ev, "END:VCALENDAR"].join("\r\n");
}
async function verstuur(args: { to: string; subject: string; html: string; ics?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const body: any = { from: FROM, to: [args.to], subject: args.subject, html: args.html };
  if (args.ics) body.attachments = [{ filename: "zij-aan-zij.ics", content: btoa(unescape(encodeURIComponent(args.ics))) }];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Mail mislukt: ${await res.text()}`);
}

export const mailBevestiging = internalAction({
  args: {
    clientNaam: v.string(), clientEmail: v.string(),
    afspraken: v.array(v.object({ index: v.number(), datum: v.string(), tijd: v.string(), duurMin: v.number() })),
    videoRoomUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const rijen = args.afspraken.map((a) => `<li style="margin-bottom:6px"><b>Gesprek ${a.index}</b> &middot; ${fmtNL(a.datum, a.tijd)} (${a.duurMin} min)</li>`).join("");
    const video = args.videoRoomUrl ? `<p style="font-size:15px;line-height:1.7;color:#485349">We spreken elkaar op deze vaste videolink (met wachtkamer, dus je komt binnen zodra ik je toelaat):<br><a href="${args.videoRoomUrl}" style="color:#3b6448">${args.videoRoomUrl}</a></p>` : "";
    const inner = `
      <p style="font-size:17px;color:#212b24"><b>Je gesprekken staan gepland</b></p>
      <p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${args.clientNaam}, fijn dat je er bent. Dit zijn je vier momenten, verspreid over de acht weken:</p>
      <ul style="font-size:15px;line-height:1.7;color:#212b24;padding-left:18px">${rijen}</ul>
      <p style="font-size:15px;line-height:1.7;color:#485349">In de bijlage zit een agenda-bestand, zo staan alle gesprekken in één tik in je eigen agenda. Een dag van tevoren stuur ik je nog een herinnering.</p>
      ${video}
      <p style="font-size:15px;line-height:1.7;color:#485349">Warme groet,<br>Ien</p>`;
    const ics = icsFor(args.afspraken, args.clientNaam, args.videoRoomUrl);
    await verstuur({ to: args.clientEmail, subject: "Je gesprekken bij Zij aan Zij staan gepland", html: wrapMail(inner), ics });
    // seintje aan Ien
    await verstuur({ to: IEN_EMAIL, subject: `Nieuwe planning: ${args.clientNaam}`, html: wrapMail(`<p style="font-size:15px;color:#212b24">${args.clientNaam} (${args.clientEmail}) heeft de gesprekken vastgezet:</p><ul style="font-size:14px;color:#485349">${rijen}</ul>`) });
  },
});

export const mailVerzet = internalAction({
  args: {
    clientNaam: v.string(), clientEmail: v.string(), index: v.number(),
    oudDatum: v.string(), oudTijd: v.string(), datum: v.string(), tijd: v.string(), doorIen: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const inner = `
      <p style="font-size:17px;color:#212b24"><b>Gesprek ${args.index} is verzet</b></p>
      <p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${args.clientNaam}, je gesprek staat nu op <b>${fmtNL(args.datum, args.tijd)}</b> (was ${fmtNL(args.oudDatum, args.oudTijd)}). De rest van je gesprekken blijft staan zoals ze stonden.</p>
      <p style="font-size:15px;line-height:1.7;color:#485349">Warme groet,<br>Ien</p>`;
    await verstuur({ to: args.clientEmail, subject: `Je gesprek is verzet naar ${fmtNL(args.datum, args.tijd)}`, html: wrapMail(inner) });
    if (!args.doorIen) {
      await verstuur({ to: IEN_EMAIL, subject: `Afspraak verzet: ${args.clientNaam}`, html: wrapMail(`<p style="font-size:15px;color:#212b24">${args.clientNaam} heeft gesprek ${args.index} verzet van ${fmtNL(args.oudDatum, args.oudTijd)} naar <b>${fmtNL(args.datum, args.tijd)}</b>.</p>`) });
    }
  },
});

export const mailAfmelding = internalAction({
  args: { clientNaam: v.string(), clientEmail: v.string(), index: v.number(), datum: v.string(), tijd: v.string() },
  handler: async (_ctx, args) => {
    await verstuur({ to: IEN_EMAIL, subject: `Afmelding: ${args.clientNaam}`, html: wrapMail(`<p style="font-size:15px;color:#212b24">${args.clientNaam} (${args.clientEmail}) heeft gesprek ${args.index} van ${fmtNL(args.datum, args.tijd)} afgemeld.</p>`) });
    await verstuur({ to: args.clientEmail, subject: "Je afmelding is ontvangen", html: wrapMail(`<p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${args.clientNaam}, ik heb je afmelding voor het gesprek van ${fmtNL(args.datum, args.tijd)} ontvangen. Wil je een nieuw moment, stuur me gerust een bericht.<br><br>Warme groet,<br>Ien</p>`) });
  },
});

// ─── HERINNERINGEN (dagelijkse cron) ─────────────────────────────────────────
export const getDueReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const morgen = addDays(todayNL(), 1);
    const appts = await ctx.db.query("appointments").withIndex("by_datum", (q) => q.eq("datum", morgen)).collect();
    const config = await getConfig(ctx);
    return appts
      .filter((a) => (a.status === "gepland" || a.status === "verzet") && !a.reminderSentAt)
      .map((a) => ({ id: a._id, clientNaam: a.clientNaam, clientEmail: a.clientEmail, index: a.index, datum: a.datum, tijd: a.tijd, token: a.token, videoRoomUrl: config.videoRoomUrl }));
  },
});

export const markReminderSent = internalMutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, { id }) => { await ctx.db.patch(id, { reminderSentAt: Date.now() }); },
});

export const runReminders = internalAction({
  args: {},
  handler: async (ctx): Promise<{ verzonden: number }> => {
    const due = (await ctx.runQuery(internal.booking.getDueReminders, {})) as Array<{
      id: any; clientNaam: string; clientEmail: string; index: number; datum: string; tijd: string; token: string; videoRoomUrl: string;
    }>;
    for (const a of due) {
      const video = a.videoRoomUrl ? `<p style="font-size:15px;line-height:1.7;color:#485349">Videolink: <a href="${a.videoRoomUrl}" style="color:#3b6448">${a.videoRoomUrl}</a></p>` : "";
      const inner = `
        <p style="font-size:17px;color:#212b24"><b>Morgen je gesprek</b></p>
        <p style="font-size:15px;line-height:1.7;color:#485349">Lieve ${a.clientNaam}, een klein seintje: morgen (${fmtNL(a.datum, a.tijd)}) hebben we gesprek ${a.index}.</p>
        ${video}
        <p style="font-size:15px;line-height:1.7;color:#485349">Komt het toch niet uit? ${knop(`${SITE}/afspraak/${a.token}`, "Verzet je afspraak")}</p>
        <p style="font-size:15px;line-height:1.7;color:#485349">Tot morgen,<br>Ien</p>`;
      try {
        await verstuur({ to: a.clientEmail, subject: `Morgen je gesprek bij Zij aan Zij (${a.tijd})`, html: wrapMail(inner) });
        await ctx.runMutation(internal.booking.markReminderSent, { id: a.id });
      } catch (_e) { /* volgende run opnieuw */ }
    }
    return { verzonden: due.length };
  },
});

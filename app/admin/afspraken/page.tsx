"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { CalendarDays, Plus, Trash2, Copy, Check, Power } from "lucide-react";

const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function fmt(datum: string, tijd?: string) {
  const d = new Date(datum + "T12:00:00Z");
  return `${DAGEN[d.getUTCDay()].slice(0, 2)} ${d.getUTCDate()} ${MND[d.getUTCMonth()]}${tijd ? " " + tijd : ""}`;
}

function Kaart({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{titel}</h2>
      {children}
    </section>
  );
}

const STATUS_KLEUR: Record<string, string> = {
  gepland: "bg-emerald-50 text-emerald-700 border-emerald-200",
  verzet: "bg-amber-50 text-amber-700 border-amber-200",
  afgemeld: "bg-rose-50 text-rose-700 border-rose-200",
  afgerond: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AfsprakenAdmin() {
  const config = useAdminQuery(api.booking.getConfigAdmin, {});
  const slots = useAdminQuery(api.booking.listSlots, {}) as any[] | undefined;
  const blocks = useAdminQuery(api.booking.listBlocks, {}) as any[] | undefined;
  const clients = useAdminQuery(api.booking.listClients, {}) as any[] | undefined;
  const appts = useAdminQuery(api.booking.adminListAppointments, {}) as any[] | undefined;
  const openSlots = useAdminQuery(api.booking.adminOpenSlots, {}) as any[] | undefined;

  const setConfig = useAdminMutation(api.booking.setConfig);
  const addSlot = useAdminMutation(api.booking.addSlot);
  const toggleSlot = useAdminMutation(api.booking.toggleSlot);
  const removeSlot = useAdminMutation(api.booking.removeSlot);
  const addBlock = useAdminMutation(api.booking.addBlock);
  const removeBlock = useAdminMutation(api.booking.removeBlock);
  const createClient = useAdminMutation(api.booking.createClient);
  const deleteClient = useAdminMutation(api.booking.deleteClient);
  const adminReschedule = useAdminMutation(api.booking.adminReschedule);
  const adminCancel = useAdminMutation(api.booking.adminCancel);
  const previewLink = useAdminMutation(api.booking.previewLink);

  // config form
  const [cfg, setCfg] = useState<any>(null);
  const c = cfg ?? config;

  // nieuwe slot
  const [nwWeekday, setNwWeekday] = useState(2);
  const [nwTijd, setNwTijd] = useState("10:00");
  // block
  const [blokDatum, setBlokDatum] = useState("");
  // client
  const [clNaam, setClNaam] = useState("");
  const [clEmail, setClEmail] = useState("");
  const [gekopieerd, setGekopieerd] = useState<string | null>(null);
  // verzetten
  const [verzetId, setVerzetId] = useState<string | null>(null);
  const [verzetSlot, setVerzetSlot] = useState("");
  // ingesloten boekpagina (voorbeeld)
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formBezig, setFormBezig] = useState(false);

  async function toonFormulier() {
    setFormBezig(true);
    try {
      await previewLink(); // maakt/reset de voorbeeld-deelnemer
      setFormOpen(true);
      setFormKey((k) => k + 1);
    } finally {
      setFormBezig(false);
    }
  }

  async function bewaarConfig() {
    await setConfig({
      videoRoomUrl: c?.videoRoomUrl ?? "",
      aantalGesprekken: Number(c?.aantalGesprekken ?? 4),
      intervalDagen: Number(c?.intervalDagen ?? 14),
      durenJson: JSON.stringify((c?.duren ?? [60, 45, 45, 60]).map((n: any) => Number(n) || 45)),
      weken: Number(c?.weken ?? 8),
    });
  }

  function kopieer(link: string) {
    navigator.clipboard?.writeText(link);
    setGekopieerd(link);
    setTimeout(() => setGekopieerd(null), 1500);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><CalendarDays size={20} /></div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Zij aan Zij afspraken</h1>
          <p className="text-sm text-gray-500">Beheer je tijden, deelnemers en gesprekken.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toonFormulier}
            disabled={formBezig}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-1.5 disabled:opacity-50">
            <CalendarDays size={15} /> {formBezig ? "Bezig..." : formOpen ? "Ververs formulier" : "Bekijk boekformulier"}
          </button>
          <button
            onClick={async () => { const r: any = await previewLink(); window.open(r.link, "_blank"); }}
            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
            Nieuw tabblad
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-2">Het boekformulier zoals een deelnemer het ziet, met jouw huidige tijden. Je kunt er zelf een testafspraak in maken; die telt niet mee in je overzicht.</p>

      {/* INGESLOTEN BOEKFORMULIER */}
      {formOpen && (
        <Kaart titel="Boekformulier (voorbeeld)">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Dit is precies wat een deelnemer ziet. Ververs om opnieuw als lege planning te starten.</p>
            <button onClick={() => setFormOpen(false)} className="text-xs font-semibold text-gray-500 border border-gray-300 rounded-md px-2 py-1">Sluiten</button>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              key={formKey}
              src="/plan/voorbeeld-test"
              title="Boekformulier voorbeeld"
              className="w-full"
              style={{ height: 780, border: "none", background: "#ecefe9" }}
            />
          </div>
        </Kaart>
      )}

      {/* INSTELLINGEN */}
      <Kaart titel="Instellingen">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Vaste videolink (met wachtkamer)</span>
            <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://meet.google.com/..."
              value={c?.videoRoomUrl ?? ""} onChange={(e) => setCfg({ ...c, videoRoomUrl: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Aantal gesprekken</span>
            <input type="number" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={c?.aantalGesprekken ?? 4} onChange={(e) => setCfg({ ...c, aantalGesprekken: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Interval (dagen tussen gesprekken)</span>
            <input type="number" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={c?.intervalDagen ?? 14} onChange={(e) => setCfg({ ...c, intervalDagen: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Duur per gesprek (minuten, komma-gescheiden)</span>
            <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="60, 45, 45, 60"
              value={(c?.duren ?? [60, 45, 45, 60]).join(", ")}
              onChange={(e) => setCfg({ ...c, duren: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
          </label>
        </div>
        <button onClick={bewaarConfig} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700">Opslaan</button>
      </Kaart>

      {/* BESCHIKBAARHEID */}
      <Kaart titel="Mijn beschikbare tijden">
        <p className="text-sm text-gray-500 mb-3">Zet dagen en tijden aan of uit. Alleen actieve tijden kunnen geboekt worden.</p>
        <div className="space-y-2">
          {(slots ?? []).map((s) => (
            <div key={s._id} className={`flex items-center gap-3 border rounded-lg px-3 py-2 ${s.actief ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50 opacity-70"}`}>
              <span className="text-sm font-semibold text-gray-800 w-28">{DAGEN[s.weekday]}</span>
              <span className="text-sm text-gray-700 tabular-nums">{s.tijd}</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => toggleSlot({ id: s._id, actief: !s.actief })}
                  className={`text-xs font-semibold px-2 py-1 rounded-md border flex items-center gap-1 ${s.actief ? "text-emerald-700 border-emerald-300" : "text-gray-500 border-gray-300"}`}>
                  <Power size={13} /> {s.actief ? "Aan" : "Uit"}
                </button>
                <button onClick={() => removeSlot({ id: s._id })} className="text-gray-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {slots && slots.length === 0 && <p className="text-sm text-gray-400">Nog geen tijden. Voeg er hieronder een toe.</p>}
        </div>
        <div className="flex flex-wrap items-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Dag</span>
            <select className="mt-1 border border-gray-300 rounded-lg px-2 py-2 text-sm" value={nwWeekday} onChange={(e) => setNwWeekday(Number(e.target.value))}>
              {DAGEN.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Tijd</span>
            <input type="time" className="mt-1 border border-gray-300 rounded-lg px-2 py-2 text-sm" value={nwTijd} onChange={(e) => setNwTijd(e.target.value)} />
          </label>
          <button onClick={() => addSlot({ weekday: nwWeekday, tijd: nwTijd })} className="px-3 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg flex items-center gap-1"><Plus size={15} /> Toevoegen</button>
        </div>
      </Kaart>

      {/* GEBLOKKEERDE DAGEN */}
      <Kaart titel="Geblokkeerde dagen">
        <div className="flex flex-wrap gap-2 mb-3">
          {(blocks ?? []).map((b) => (
            <span key={b._id} className="inline-flex items-center gap-2 text-sm bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5">
              {fmt(b.datum)}
              <button onClick={() => removeBlock({ id: b._id })} className="text-gray-400 hover:text-rose-600"><Trash2 size={14} /></button>
            </span>
          ))}
          {blocks && blocks.length === 0 && <p className="text-sm text-gray-400">Geen geblokkeerde dagen.</p>}
        </div>
        <div className="flex items-end gap-2">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Datum blokkeren</span>
            <input type="date" className="mt-1 border border-gray-300 rounded-lg px-2 py-2 text-sm" value={blokDatum} onChange={(e) => setBlokDatum(e.target.value)} />
          </label>
          <button disabled={!blokDatum} onClick={() => { addBlock({ datum: blokDatum }); setBlokDatum(""); }} className="px-3 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40">Blokkeren</button>
        </div>
      </Kaart>

      {/* DEELNEMERS */}
      <Kaart titel="Deelnemers & boeklinks">
        <p className="text-sm text-gray-500 mb-3">Maak een deelnemer aan zodra je iemand hebt goedgekeurd. Kopieer de link en stuur die naar hen, zodat zij hun gesprekken kunnen plannen.</p>
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <label className="block flex-1 min-w-[8rem]"><span className="text-xs font-semibold text-gray-600">Naam</span>
            <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={clNaam} onChange={(e) => setClNaam(e.target.value)} /></label>
          <label className="block flex-1 min-w-[10rem]"><span className="text-xs font-semibold text-gray-600">E-mail</span>
            <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={clEmail} onChange={(e) => setClEmail(e.target.value)} /></label>
          <button disabled={!clNaam || !clEmail} onClick={async () => { await createClient({ naam: clNaam, email: clEmail }); setClNaam(""); setClEmail(""); }}
            className="px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 flex items-center gap-1"><Plus size={15} /> Aanmaken</button>
        </div>
        <div className="space-y-2">
          {(clients ?? []).map((cl) => (
            <div key={cl._id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{cl.naam} <span className={`ml-1 text-xs font-medium px-1.5 py-0.5 rounded border ${cl.status === "gepland" ? "text-emerald-700 border-emerald-200" : "text-gray-500 border-gray-200"}`}>{cl.status}</span></p>
                <p className="text-xs text-gray-500 truncate">{cl.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => kopieer(cl.link)} className="text-xs font-semibold text-emerald-700 border border-emerald-300 rounded-md px-2 py-1 flex items-center gap-1">
                  {gekopieerd === cl.link ? <><Check size={13} /> Gekopieerd</> : <><Copy size={13} /> Boeklink</>}
                </button>
                <button onClick={() => { if (confirm(`${cl.naam} en al hun afspraken verwijderen?`)) deleteClient({ id: cl._id }); }} className="text-gray-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {clients && clients.length === 0 && <p className="text-sm text-gray-400">Nog geen deelnemers.</p>}
        </div>
      </Kaart>

      {/* AFSPRAKEN */}
      <Kaart titel="Komende gesprekken">
        <div className="space-y-1">
          {(appts ?? []).map((a) => (
            <div key={a._id} className="border-t border-gray-100 first:border-t-0 py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{a.clientNaam} <span className="text-gray-400 font-normal">&middot; gesprek {a.index}</span></p>
                  <p className="text-xs text-gray-500">{fmt(a.datum, a.tijd)} &middot; {a.duurMin} min{a.origineelDatum ? ` (was ${fmt(a.origineelDatum, a.origineelTijd)})` : ""}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_KLEUR[a.status] ?? "border-gray-200 text-gray-500"}`}>{a.status}</span>
                <button onClick={() => { setVerzetId(verzetId === a._id ? null : a._id); setVerzetSlot(""); }} className="text-xs font-semibold text-gray-700 border border-gray-300 rounded-md px-2 py-1">Verzetten</button>
                <button onClick={() => { if (confirm("Deze afspraak afmelden?")) adminCancel({ id: a._id }); }} className="text-xs font-semibold text-rose-600 border border-rose-200 rounded-md px-2 py-1">Afmelden</button>
              </div>
              {verzetId === a._id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={verzetSlot} onChange={(e) => setVerzetSlot(e.target.value)}>
                    <option value="">Kies nieuw moment...</option>
                    {(openSlots ?? []).map((s, i) => <option key={i} value={`${s.datum}|${s.tijd}`}>{fmt(s.datum, s.tijd)}</option>)}
                  </select>
                  <button disabled={!verzetSlot} onClick={async () => { const [d, t] = verzetSlot.split("|"); await adminReschedule({ id: a._id, datum: d, tijd: t }); setVerzetId(null); }}
                    className="px-3 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40">Verzetten</button>
                </div>
              )}
            </div>
          ))}
          {appts && appts.length === 0 && <p className="text-sm text-gray-400">Nog geen geplande gesprekken.</p>}
        </div>
      </Kaart>
    </div>
  );
}

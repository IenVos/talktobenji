"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

const DAG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MND = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
function fmt(datum: string, tijd?: string) {
  const d = new Date(datum + "T12:00:00Z");
  return `${DAG[d.getUTCDay()]} ${d.getUTCDate()} ${MND[d.getUTCMonth()]}${tijd ? " om " + tijd : ""}`;
}
const GROEN = "#4a7c59";

export default function AfspraakPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token as string) ?? "";
  const data = useQuery(api.booking.getAppointmentByToken, token ? { token } : "skip");
  const reschedule = useMutation(api.booking.reschedulePublic);
  const cancel = useMutation(api.booking.cancelPublic);
  const [slot, setSlot] = useState("");
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState<"" | "verzet" | "afgemeld">("");
  const [fout, setFout] = useState("");

  if (data === undefined) return <Schil><p className="text-gray-500">Even laden...</p></Schil>;
  if (data === null) return <Schil><h1 className="text-2xl font-semibold text-gray-900">Deze link is niet geldig</h1><p className="mt-3 text-gray-600">Controleer de link uit je mail.</p></Schil>;

  if (klaar === "verzet") return <Schil><h1 className="text-3xl text-gray-900" style={{ fontFamily: "'Spectral', Georgia, serif" }}>Je afspraak is verzet</h1><p className="mt-3 text-gray-600">Je krijgt een bevestiging in je mail. De rest van je gesprekken blijft staan.</p></Schil>;
  if (klaar === "afgemeld") return <Schil><h1 className="text-3xl text-gray-900" style={{ fontFamily: "'Spectral', Georgia, serif" }}>Je afmelding is doorgegeven</h1><p className="mt-3 text-gray-600">Ien heeft een seintje gekregen. Wil je een nieuw moment, stuur haar gerust een bericht.</p></Schil>;

  const perDag: Record<string, string[]> = {};
  for (const s of data.openSlots ?? []) (perDag[s.datum] ||= []).push(s.tijd);
  const dagen = Object.keys(perDag).sort();

  async function doeVerzet() {
    if (!slot) return;
    setBezig(true); setFout("");
    const [d, t] = slot.split("|");
    try { await reschedule({ token, datum: d, tijd: t }); setKlaar("verzet"); }
    catch (e: any) { setFout(e?.message || "Er ging iets mis."); }
    finally { setBezig(false); }
  }
  async function doeAfmelden() {
    if (!confirm("Weet je zeker dat je dit gesprek wilt afmelden?")) return;
    setBezig(true); setFout("");
    try { await cancel({ token }); setKlaar("afgemeld"); }
    catch (e: any) { setFout(e?.message || "Er ging iets mis."); }
    finally { setBezig(false); }
  }

  return (
    <Schil>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GROEN }}>Je afspraak</p>
      <h1 className="text-3xl text-gray-900" style={{ fontFamily: "'Spectral', Georgia, serif" }}>Gesprek {data.index} verzetten</h1>
      <p className="mt-3 text-gray-600">Je gesprek staat nu op <b>{fmt(data.datum, data.tijd)}</b>. Kies hieronder een nieuw moment, of meld je af.</p>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nieuw moment</label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white" value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="">Kies een moment...</option>
          {dagen.map((datum) => perDag[datum].map((t) => (
            <option key={datum + t} value={`${datum}|${t}`}>{fmt(datum, t)}</option>
          )))}
        </select>
        {dagen.length === 0 && <p className="mt-2 text-sm text-gray-500">Er zijn nu geen vrije momenten. Neem even contact op met Ien.</p>}
      </div>

      {fout && <p className="mt-3 text-sm text-rose-600">{fout}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={doeVerzet} disabled={!slot || bezig} className="px-6 py-3 rounded-full text-white font-bold disabled:opacity-50" style={{ background: GROEN }}>
          {bezig ? "Bezig..." : "Verzet mijn afspraak"}
        </button>
        <button onClick={doeAfmelden} disabled={bezig} className="px-6 py-3 rounded-full font-bold text-rose-600 border border-rose-200 disabled:opacity-50">
          Ik wil dit gesprek afmelden
        </button>
      </div>
    </Schil>
  );
}

function Schil({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#ecefe9" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&display=swap" />
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/images/benji-logo-2.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-sm text-gray-900">Talk To Benji</span>
          <span className="text-xs text-gray-400 font-semibold">· Zij aan Zij</span>
        </div>
        {children}
      </div>
    </div>
  );
}

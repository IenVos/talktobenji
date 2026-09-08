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
function addDays(datum: string, n: number) {
  const d = new Date(datum + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const GROEN = "#4a7c59";

export default function PlanPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token as string) ?? "";
  const data = useQuery(api.booking.getBookingByToken, token ? { token } : "skip");
  const bookSeries = useMutation(api.booking.bookSeries);
  const [gekozen, setGekozen] = useState<{ datum: string; tijd: string } | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  if (data === undefined) return <Schil><p className="text-gray-500">Even laden...</p></Schil>;
  if (data === null) return <Schil><h1 className="text-2xl font-semibold text-gray-900">Deze link is niet geldig</h1><p className="mt-3 text-gray-600">Controleer de link uit je mail, of neem contact op met Ien.</p></Schil>;

  const alGeboekt = data.alGeboekt ?? [];

  if (alGeboekt.length > 0) {
    return (
      <Schil>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GROEN }}>Je gesprekken</p>
        <h1 className="font-serif text-3xl text-gray-900" style={{ fontFamily: "Georgia, serif" }}>Alles staat gepland</h1>
        <p className="mt-3 text-gray-600">Fijn dat je er bent, {data.naam}. Dit zijn je momenten. Je hebt ze ook per mail gekregen, met een agendabestand.</p>
        <ul className="mt-6 space-y-2">
          {alGeboekt.map((a: any) => (
            <li key={a.index} className="flex items-baseline gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-white">
              <span className="font-semibold text-gray-900 w-24">Gesprek {a.index}</span>
              <span className="text-gray-700">{fmt(a.datum, a.tijd)}</span>
              <span className="ml-auto text-sm text-gray-400">{a.duurMin} min</span>
            </li>
          ))}
        </ul>
        {data.videoRoomUrl && (
          <p className="mt-5 text-sm text-gray-600">We spreken elkaar op deze vaste videolink: <a href={data.videoRoomUrl} className="font-semibold" style={{ color: GROEN }}>{data.videoRoomUrl}</a></p>
        )}
        <p className="mt-6 text-sm text-gray-500">Komt een moment toch niet uit? De verzet-link staat in je bevestigings- en herinneringsmail.</p>
      </Schil>
    );
  }

  // groepeer open slots per dag
  const perDag: Record<string, { datum: string; tijd: string }[]> = {};
  for (const s of data.openSlots ?? []) (perDag[s.datum] ||= []).push({ datum: s.datum, tijd: s.tijd });
  const dagen = Object.keys(perDag).sort();

  const preview = gekozen
    ? Array.from({ length: data.aantal }, (_, i) => ({
        index: i + 1,
        datum: addDays(gekozen.datum, i * data.interval),
        tijd: gekozen.tijd,
        duurMin: data.duren[i] ?? 45,
      }))
    : [];

  async function bevestig() {
    if (!gekozen) return;
    setBezig(true); setFout("");
    try { await bookSeries({ token, datum: gekozen.datum, tijd: gekozen.tijd }); }
    catch (e: any) { setFout(e?.message || "Er ging iets mis, probeer opnieuw."); }
    finally { setBezig(false); }
  }

  return (
    <Schil>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GROEN }}>Plan je gesprekken</p>
      <h1 className="text-3xl text-gray-900" style={{ fontFamily: "Georgia, serif" }}>Kies één vast moment</h1>
      <p className="mt-3 text-gray-600">Fijn dat je er bent, {data.naam}. Kies je vaste tijd, dan plan ik in één keer al je gesprekken, verspreid over de acht weken. Verzetten kan later altijd.</p>

      <div className="mt-6 space-y-5">
        {dagen.length === 0 && <p className="text-gray-500">Er zijn nu geen vrije tijden. Neem even contact op met Ien.</p>}
        {dagen.map((datum) => (
          <div key={datum}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{fmt(datum)}</p>
            <div className="flex flex-wrap gap-2">
              {perDag[datum].map((s) => {
                const actief = gekozen?.datum === s.datum && gekozen?.tijd === s.tijd;
                return (
                  <button key={s.tijd} onClick={() => setGekozen(s)}
                    className="rounded-lg px-4 py-2 text-sm font-bold border transition-colors"
                    style={actief ? { background: GROEN, borderColor: GROEN, color: "#fff" } : { background: "#fff", borderColor: "#d6ddd3", color: "#485349" }}>
                    {s.tijd}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {gekozen && (
        <div className="mt-8">
          <h2 className="font-bold text-gray-900 mb-3">Zo komen je gesprekken te staan</h2>
          <ul className="space-y-2">
            {preview.map((p) => (
              <li key={p.index} className="flex items-baseline gap-3 border border-gray-200 rounded-xl px-4 py-2.5 bg-white">
                <span className="font-semibold text-gray-900 w-24">Gesprek {p.index}</span>
                <span className="text-gray-700">{fmt(p.datum, p.tijd)}</span>
                <span className="ml-auto text-sm text-gray-400">{p.duurMin} min</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-500">Elke {data.interval} dagen, op jouw vaste tijd, allemaal binnen je acht weken.</p>
          {fout && <p className="mt-3 text-sm text-rose-600">{fout}</p>}
          <button onClick={bevestig} disabled={bezig}
            className="mt-5 px-7 py-3 rounded-full text-white font-bold disabled:opacity-50" style={{ background: GROEN }}>
            {bezig ? "Bezig..." : "Zet deze gesprekken vast"}
          </button>
          <p className="mt-2 text-sm text-gray-400">Je kunt elk gesprek later los verzetten.</p>
        </div>
      )}
    </Schil>
  );
}

function Schil({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#ecefe9" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
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

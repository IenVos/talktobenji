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
const SERIF = "'Spectral', Georgia, serif";

export default function KennismakingPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token as string) ?? "";
  const data = useQuery(api.kennismaking.getByToken, token ? { token } : "skip");
  const kies = useMutation(api.kennismaking.kies);
  const [gekozen, setGekozen] = useState<{ datum: string; tijd: string } | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  if (data === undefined) return <Schil><p className="text-gray-500">Even laden...</p></Schil>;
  if (data === null) return <Schil><h1 className="text-2xl" style={{ fontFamily: SERIF }}>Deze link is niet geldig</h1><p className="mt-3 text-gray-600">Controleer de link uit je mail, of neem contact op met Ien.</p></Schil>;

  if (data.status === "gepland" && data.gekozenDatum) {
    return (
      <Schil>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GROEN }}>Kennismaking</p>
        <h1 className="text-3xl text-gray-900" style={{ fontFamily: SERIF }}>Je moment staat gepland</h1>
        <p className="mt-3 text-gray-600">Fijn dat je er bent, {data.naam}. We spreken elkaar op <b>{fmt(data.gekozenDatum, data.gekozenTijd || undefined)}</b>. Je hebt hiervan ook een mail gekregen, met een agendabestand.</p>
        {data.videoRoomUrl && (
          <p className="mt-5 text-sm text-gray-600">We spreken elkaar op deze videolink: <a href={data.videoRoomUrl} className="font-semibold" style={{ color: GROEN }}>{data.videoRoomUrl}</a></p>
        )}
        <p className="mt-6 text-sm text-gray-500">Komt het toch niet uit? Laat het Ien weten, dan zoeken jullie samen een nieuwe tijd.</p>
      </Schil>
    );
  }

  async function bevestig() {
    if (!gekozen) return;
    setBezig(true); setFout("");
    try { await kies({ token, datum: gekozen.datum, tijd: gekozen.tijd }); }
    catch (e: any) { setFout(e?.message || "Er ging iets mis, probeer opnieuw."); }
    finally { setBezig(false); }
  }

  return (
    <Schil>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GROEN }}>Kennismaking</p>
      <h1 className="text-3xl sm:text-4xl text-gray-900" style={{ fontFamily: SERIF }}>Kies een moment</h1>
      <p className="mt-3 text-gray-600 max-w-xl">Fijn dat je er bent, {data.naam}. Ik stel een paar momenten voor. Kies er eentje die jou het beste schikt, dan maken we rustig kennis{data.duurMin ? ` (ongeveer ${data.duurMin} minuten)` : ""}.</p>

      <div className="mt-7 bg-white border rounded-2xl p-6 sm:p-7" style={{ borderColor: "#d6ddd3" }}>
        {data.opties.length === 0 && <p className="text-gray-500">Er staan nog geen momenten klaar. Neem even contact op met Ien.</p>}
        <div className="space-y-2">
          {data.opties.map((o: any, i: number) => {
            const actief = gekozen?.datum === o.datum && gekozen?.tijd === o.tijd;
            return (
              <button key={i} onClick={() => setGekozen({ datum: o.datum, tijd: o.tijd })}
                className="w-full text-left rounded-xl px-4 py-3 border font-semibold transition-colors"
                style={actief
                  ? { background: GROEN, borderColor: GROEN, color: "#fff" }
                  : { background: "#fff", borderColor: "#d6ddd3", color: "#212b24" }}>
                {fmt(o.datum, o.tijd)}
              </button>
            );
          })}
        </div>

        {fout && <p className="mt-3 text-sm text-rose-600">{fout}</p>}

        {data.opties.length > 0 && (
          <button onClick={bevestig} disabled={!gekozen || bezig}
            className="mt-5 px-7 py-3 rounded-full text-white font-bold disabled:opacity-50" style={{ background: GROEN }}>
            {bezig ? "Bezig..." : "Kies dit moment"}
          </button>
        )}
      </div>
    </Schil>
  );
}

function Schil({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#ecefe9" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&display=swap" />
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

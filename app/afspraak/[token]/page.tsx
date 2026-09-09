"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

const DAG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MND = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
function fmt(datum: string, tijd?: string) {
  const d = new Date(datum + "T12:00:00Z");
  return `${DAG[d.getUTCDay()]} ${d.getUTCDate()} ${MND[d.getUTCMonth()]}${tijd ? " om " + tijd : ""}`;
}
const GROEN = "#4a7c59";
const IEN_MAIL = "contactmetien@talktobenji.com";

export default function AfspraakPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token as string) ?? "";
  const data = useQuery(api.booking.getAppointmentByToken, token ? { token } : "skip");

  if (data === undefined) return <Schil><p className="text-gray-500">Even laden...</p></Schil>;
  if (data === null) return <Schil><h1 className="text-2xl font-semibold text-gray-900">Deze link is niet geldig</h1><p className="mt-3 text-gray-600">Controleer de link uit je mail.</p></Schil>;

  return (
    <Schil>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GROEN }}>Je afspraak</p>
      <h1 className="text-3xl text-gray-900" style={{ fontFamily: "'Spectral', Georgia, serif" }}>Gesprek {data.index}</h1>
      <p className="mt-3 text-gray-600">Je gesprek staat op <b>{fmt(data.datum, data.tijd)}</b>{data.duurMin ? ` (${data.duurMin} min)` : ""}.</p>

      <div className="mt-6 bg-white border rounded-2xl p-5 sm:p-6" style={{ borderColor: "#d6ddd3" }}>
        <p className="text-gray-700">Komt dit moment toch niet uit? Laat het Ien even weten, dan zoeken jullie samen een nieuwe tijd.</p>
        <a
          href={`mailto:${IEN_MAIL}?subject=${encodeURIComponent(`Gesprek ${data.index} verzetten`)}`}
          className="inline-block mt-4 px-6 py-3 rounded-full text-white font-bold"
          style={{ background: GROEN }}
        >
          Mail Ien
        </a>
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

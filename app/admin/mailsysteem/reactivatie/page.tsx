"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery } from "../../AdminAuthContext";

const TYPE_LABEL: Record<string, string> = {
  persoon: "Verlies van een persoon",
  huisdier: "Verlies van een huisdier",
  scheiding: "Relatie voorbij",
  eenzaamheid: "Eenzaamheid",
  kinderloos: "Kinderwens",
  algemeen: "Algemeen (geen type)",
};

export default function ReactivatiePage() {
  const data = useAdminQuery(api.mailFunnel.reactivatieDoelgroep, {}) as
    | {
        totaal: number;
        perType: { type: string; aantal: number }[];
        redenen: { afgemeld: number; gekocht: number; alBenji: number; testadres: number };
        nogInReeks: number;
        teKortGeleden: number;
        voorStart: number;
        uniekeLeadsNaStart: number;
        lijst: { email: string; naam: string | null; type: string; dagenSindsLaatste: number }[];
      }
    | undefined;
  const bounce = useAdminQuery(api.mailFunnel.reactivatieBounceCheck, {}) as
    | { aantal: number; adressen: string[] }
    | undefined;

  const [toonLijst, setToonLijst] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reactivatie: eenmalige Benji-mail</h1>
        <p className="text-sm text-gray-500 mt-1">
          De leads die de Even Houvast-reeks helemaal doorliepen, niet kochten, zich niet afmeldden en
          Benji nog nooit zagen. Dit is alleen een overzicht. Er verstuurt hier nog niets: eerst
          controleer je of de aantallen kloppen.
        </p>
      </div>

      {/* Hoofdgetal */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-gray-900">{data?.totaal ?? "…"}</span>
          <span className="text-sm text-gray-500">mensen krijgen de reactivatiemail</span>
        </div>

        {data && data.perType.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.perType.map((r) => (
              <div
                key={r.type}
                className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2"
              >
                <span className="text-sm text-gray-700">{TYPE_LABEL[r.type] ?? r.type}</span>
                <span className="text-sm font-semibold text-gray-900">{r.aantal}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wie valt af en waarom */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Wie valt af, en waarom</h2>
        <p className="text-xs text-gray-500">
          Van alle mensen die de reeks helemaal doorliepen. Zo zie je dat we niemand mailen die dat niet
          zou moeten krijgen.
        </p>
        <ul className="text-sm text-gray-700 divide-y divide-gray-100">
          <Rij label="Heeft zich afgemeld (nooit aanschrijven)" waarde={data?.redenen.afgemeld} />
          <Rij label="Heeft Niet Alleen gekocht" waarde={data?.redenen.gekocht} />
          <Rij label="Kende Benji al, of heeft al toegang" waarde={data?.redenen.alBenji} />
          <Rij label="Testadres van jou" waarde={data?.redenen.testadres} />
          <Rij label="Laatste mail nog geen 3 dagen geleden" waarde={data?.teKortGeleden} />
        </ul>
      </div>

      {/* Context: wie zit hier bewust niet in */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Bewust niet meegenomen</h2>
        <ul className="text-sm text-gray-700 divide-y divide-gray-100">
          <Rij
            label="Zit nog midden in de reeks (krijgt Benji vanzelf)"
            waarde={data?.nogInReeks}
          />
          <Rij
            label="Oude leads van vóór 25 juni (alleen de brief gehad)"
            waarde={data?.voorStart}
          />
        </ul>
        <p className="text-xs text-gray-500">
          De oude leads van vóór 25 juni pakken we later apart op, met een eigen tekst, als we zien hoe
          deze eerste zending loopt.
        </p>
      </div>

      {/* Bounce-waarschuwing */}
      {bounce && bounce.aantal > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-amber-900">
            Let op: {bounce.aantal} {bounce.aantal === 1 ? "adres" : "adressen"} bouncede eerder
          </h2>
          <p className="text-sm text-amber-800 mt-1">
            Deze zitten nu nog in de doelgroep. Ze gaven eerder een harde bounce of klacht, dus de mail
            komt mogelijk niet aan. We filteren ze nog niet automatisch weg. Bij het versturen (volgende
            stap) beslissen we of we ze overslaan.
          </p>
        </div>
      )}

      {/* De lijst zelf */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <button
          onClick={() => setToonLijst((v) => !v)}
          className="text-sm font-medium text-primary-700 hover:underline"
        >
          {toonLijst ? "Verberg de lijst" : `Toon de lijst (${data?.totaal ?? 0} mensen)`}
        </button>
        {toonLijst && data && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">E-mail</th>
                  <th className="py-2 pr-4 font-medium">Naam</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 font-medium">Laatste mail</th>
                </tr>
              </thead>
              <tbody>
                {data.lijst.map((r) => (
                  <tr key={r.email} className="border-b border-gray-50">
                    <td className="py-2 pr-4 text-gray-800">{r.email}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.naam ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{TYPE_LABEL[r.type] ?? r.type}</td>
                    <td className="py-2 text-gray-600">{r.dagenSindsLaatste} dagen geleden</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Rij({ label, waarde }: { label: string; waarde?: number }) {
  return (
    <li className="flex items-center justify-between py-2">
      <span>{label}</span>
      <span className="font-semibold text-gray-900">{waarde ?? "…"}</span>
    </li>
  );
}

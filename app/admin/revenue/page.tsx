"use client";

import { useState } from "react";
import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Euro, ShoppingBag, TrendingUp, BarChart3, Clock } from "lucide-react";

// ─── Bar chart (SVG, geen externe lib) ───────────────────────────────────────

function BarChart({ data, height = 160 }: {
  data: { label: string; benji: number; nietAlleen: number; omzet: number }[];
  height?: number;
}) {
  const maxOmzet = Math.max(...data.map((d) => d.omzet), 1);
  const barW = 100 / data.length;

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} className="overflow-visible">
        {data.map((d, i) => {
          const benjiFrac = (d.benji / (d.benji + d.nietAlleen || 1)) * (d.omzet / maxOmzet);
          const naFrac = (d.omzet / maxOmzet) - benjiFrac;
          const totalH = (d.omzet / maxOmzet) * (height - 30);
          const benjH = benjiFrac * (height - 30);
          const naH = naFrac * (height - 30);
          const x = i * barW + barW * 0.15;
          const w = barW * 0.7;

          return (
            <g key={d.label}>
              {/* Benji deel */}
              <rect
                x={`${x}%`} y={height - 30 - totalH}
                width={`${w}%`} height={benjH || 0}
                fill="#6d84a8" rx={2}
              />
              {/* Niet Alleen deel */}
              <rect
                x={`${x}%`} y={height - 30 - naH}
                width={`${w}%`} height={naH || 0}
                fill="#a78bfa" rx={2}
              />
              {/* Label */}
              <text
                x={`${i * barW + barW / 2}%`} y={height - 8}
                textAnchor="middle" fontSize={9} fill="#9ca3af"
              >
                {d.label}
              </text>
              {/* Bedrag tooltip */}
              {d.omzet > 0 && (
                <text
                  x={`${i * barW + barW / 2}%`} y={height - 34 - totalH}
                  textAnchor="middle" fontSize={8} fill="#6b7280"
                >
                  €{d.omzet}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

// ─── Tabbladen ────────────────────────────────────────────────────────────────

type Tab = "aankopen" | "abonnementen";

export default function RevenuePage() {
  const [tab, setTab] = useState<Tab>("aankopen");
  const data = useAdminQuery(api.siteAnalytics.getRevenueOverview, {});

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Euro size={22} className="text-primary-600" />
          Omzet & verkopen
        </h1>
        <p className="text-sm text-gray-500 mt-1">Overzicht van alle aankopen en inkomsten</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: "aankopen", label: "Eenmalige aankopen" },
          { key: "abonnementen", label: "Abonnementen" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Aankopen ── */}
      {tab === "aankopen" && (
        <>
          {!data ? (
            <p className="text-sm text-gray-400">Laden…</p>
          ) : (
            <>
              {/* KPI kaarten */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Omzet dit jaar"
                  value={`€\u00a0${data.totaalYTD.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub={`${data.aankopenYTD} aankopen`}
                  icon={TrendingUp}
                  color="bg-green-100 text-green-600"
                />
                <StatCard
                  label="Omzet deze maand"
                  value={`€\u00a0${data.totaalMTD.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub={`${data.aankopenMTD} aankopen`}
                  icon={BarChart3}
                  color="bg-blue-100 text-blue-600"
                />
                <StatCard
                  label="Gem. orderwaarde"
                  value={`€\u00a0${data.gemiddeldeOrderwaarde.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={ShoppingBag}
                  color="bg-violet-100 text-violet-600"
                />
                <StatCard
                  label="Totaal ooit"
                  value={`€\u00a0${data.totaalAllesTijd.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={Euro}
                  color="bg-amber-100 text-amber-600"
                />
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">Omzet per maand — laatste 12 maanden</h2>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#6d84a8] inline-block" /> Benji
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#a78bfa] inline-block" /> Niet Alleen
                    </span>
                  </div>
                </div>
                <BarChart data={data.maanden} height={180} />
              </div>

              {/* Tabel per maand */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Maand</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Benji</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Niet Alleen</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Totaal</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...data.maanden].reverse().map((m) => (
                      <tr key={m.maand} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{m.label}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{m.benji || "—"}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{m.nietAlleen || "—"}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-800">{m.aankopen || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {m.omzet > 0
                            ? `€\u00a0${m.omzet.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Tab: Abonnementen (placeholder) ── */}
      {tab === "abonnementen" && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">Abonnementen — binnenkort</p>
          <p className="text-sm text-gray-400 max-w-sm">
            Zodra er terugkerende abonnementen zijn ingericht, verschijnt hier een overzicht van actieve abonnees, verlengingen en opzeggingen.
          </p>
        </div>
      )}
    </div>
  );
}

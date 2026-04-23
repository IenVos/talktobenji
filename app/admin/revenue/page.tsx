"use client";

import { useState } from "react";
import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Clock } from "lucide-react";

const PRODUCT_COLORS = ["#6d84a8", "#818cf8", "#34d399", "#fb923c", "#f472b6"];

type Product = { slug: string; name: string; subscriptionType: string; priceInCents: number };
type Maand = { maand: string; label: string; aankopen: number; omzet: number; perProduct: Record<string, number> };

function fmt(n: number) {
  return `€\u00a0${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── KPI strip ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────────────
function BarChart({ data, products }: { data: Maand[]; products: Product[] }) {
  const maxOmzet = Math.max(...data.map(d => d.omzet), 1);
  const chartH = 180;
  const padTop = 24;
  const padBottom = 28;
  const plotH = chartH - padTop - padBottom;
  const n = data.length;
  // Max bar width: 36px, min: 8px
  const barW = Math.min(36, Math.max(8, Math.floor(560 / n) * 0.55));
  const colW = 100 / n;

  // Gridlines at 25%, 50%, 75%, 100%
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => ({
    y: padTop + plotH * (1 - f),
    label: `€${Math.round(maxOmzet * f)}`,
  }));

  return (
    <div className="w-full" style={{ height: chartH }}>
      <svg width="100%" height={chartH} className="overflow-visible">
        {/* Gridlines */}
        {gridLines.map(g => (
          <g key={g.y}>
            <line x1="0" y1={g.y} x2="100%" y2={g.y} stroke="#f3f4f6" strokeWidth={1} />
            <text x={2} y={g.y - 3} fontSize={8} fill="#d1d5db">{g.label}</text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const centerX = (i + 0.5) * colW;
          const totalH = (d.omzet / maxOmzet) * plotH;
          let stackY = padTop + plotH; // start van onderaf

          return (
            <g key={d.maand}>
              {products.map((p, pi) => {
                const count = d.perProduct[p.slug] ?? 0;
                const frac = d.omzet > 0 ? (count * (p.priceInCents / 100)) / d.omzet : 0;
                const segH = frac * totalH;
                if (segH < 0.5) return null;
                stackY -= segH;
                return (
                  <rect
                    key={p.slug}
                    x={`${centerX}%`}
                    y={stackY}
                    width={barW}
                    height={segH}
                    fill={PRODUCT_COLORS[pi % PRODUCT_COLORS.length]}
                    rx={3}
                    transform={`translate(-${barW / 2}, 0)`}
                  />
                );
              })}
              {/* Bedrag boven bar */}
              {d.omzet > 0 && (
                <text
                  x={`${centerX}%`}
                  y={padTop + plotH - totalH - 5}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={500}
                  fill="#6b7280"
                >
                  €{d.omzet}
                </text>
              )}
              {/* Maandlabel */}
              <text
                x={`${centerX}%`}
                y={chartH - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────
type Tab = "aankopen" | "abonnementen";

export default function RevenuePage() {
  const [tab, setTab] = useState<Tab>("aankopen");
  const data = useAdminQuery(api.siteAnalytics.getRevenueOverview, {});

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header + tabs in één balk */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Omzet & verkopen</h1>
          <p className="text-sm text-gray-400 mt-0.5">Eenmalige aankopen vanaf maart 2026</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: "aankopen", label: "Aankopen" },
            { key: "abonnementen", label: "Abonnementen" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "aankopen" && (
        <>
          {!data ? (
            <p className="text-sm text-gray-400">Laden…</p>
          ) : (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Dit jaar" value={fmt(data.totaalYTD)} sub={`${data.aankopenYTD} aankopen`} />
                <KpiCard label="Deze maand" value={fmt(data.totaalMTD)} sub={`${data.aankopenMTD} aankopen`} />
                <KpiCard label="Gem. orderwaarde" value={fmt(data.gemiddeldeOrderwaarde)} />
                <KpiCard label="Totaal" value={fmt(data.totaalAllesTijd)} />
              </div>

              {/* Chart + tabel in één kaart */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Chart */}
                <div className="px-6 pt-5 pb-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-800">Omzet per maand</p>
                    <div className="flex items-center gap-3">
                      {data.products.map((p: Product, i: number) => (
                        <span key={p.slug} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                            style={{ background: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }} />
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <BarChart data={data.maanden} products={data.products} />
                </div>

                {/* Tabel */}
                <div className="border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Maand</th>
                        {data.products.map((p: Product) => (
                          <th key={p.slug} className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{p.name}</th>
                        ))}
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Totaal</th>
                        <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...data.maanden].reverse().map((m, ri) => (
                        <tr key={m.maand} className={ri === 0 ? "bg-blue-50/40" : "hover:bg-gray-50/60"}>
                          <td className="px-5 py-3 font-medium text-gray-800 text-sm">{m.label}</td>
                          {data.products.map((p: Product) => (
                            <td key={p.slug} className="px-4 py-3 text-center text-gray-500 tabular-nums text-sm">
                              {m.perProduct[p.slug] || <span className="text-gray-200">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center font-semibold text-gray-700 tabular-nums text-sm">
                            {m.aankopen || <span className="text-gray-200">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-sm">
                            {m.omzet > 0
                              ? <span className="font-semibold text-gray-900">{fmt(m.omzet)}</span>
                              : <span className="text-gray-200">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "abonnementen" && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">Abonnementen — binnenkort</p>
          <p className="text-sm text-gray-400 max-w-sm">
            Zodra terugkerende abonnementen zijn ingericht, verschijnt hier een overzicht van actieve abonnees, verlengingen en opzeggingen.
          </p>
        </div>
      )}
    </div>
  );
}

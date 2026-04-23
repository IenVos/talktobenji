"use client";

import { useState } from "react";
import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Euro, ShoppingBag, TrendingUp, BarChart3, Clock } from "lucide-react";

// Kleuren per positie (voor chart-legenda)
const PRODUCT_COLORS = ["#6d84a8", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];

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

type Product = { slug: string; name: string; subscriptionType: string; priceInCents: number };
type Maand = {
  maand: string; label: string; aankopen: number; omzet: number;
  perProduct: Record<string, number>;
};

function BarChart({ data, products, height = 160 }: {
  data: Maand[];
  products: Product[];
  height?: number;
}) {
  const maxOmzet = Math.max(...data.map((d) => d.omzet), 1);
  const barW = 100 / data.length;

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} className="overflow-visible">
        {data.map((d, i) => {
          const totalH = (d.omzet / maxOmzet) * (height - 30);
          const x = i * barW + barW * 0.15;
          const w = barW * 0.7;

          // Stapel per product
          let yOffset = 0;
          const segmenten = products.map((p, pi) => {
            const count = d.perProduct[p.slug] ?? 0;
            const prijs = count * (p.priceInCents / 100);
            const segH = d.omzet > 0 ? (prijs / d.omzet) * totalH : 0;
            const seg = { p, pi, segH, yOffset };
            yOffset += segH;
            return seg;
          });

          return (
            <g key={d.label}>
              {segmenten.map(({ p, pi, segH, yOffset: yo }) =>
                segH > 0 ? (
                  <rect
                    key={p.slug}
                    x={`${x}%`}
                    y={height - 30 - totalH + yo}
                    width={`${w}%`}
                    height={segH}
                    fill={PRODUCT_COLORS[pi % PRODUCT_COLORS.length]}
                    rx={2}
                  />
                ) : null
              )}
              <text
                x={`${i * barW + barW / 2}%`} y={height - 8}
                textAnchor="middle" fontSize={9} fill="#9ca3af"
              >
                {d.label}
              </text>
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

type Tab = "aankopen" | "abonnementen";

export default function RevenuePage() {
  const [tab, setTab] = useState<Tab>("aankopen");
  const data = useAdminQuery(api.siteAnalytics.getRevenueOverview, {});

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Euro size={22} className="text-primary-600" />
          Omzet & verkopen
        </h1>
        <p className="text-sm text-gray-500 mt-1">Overzicht van alle aankopen en inkomsten</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: "aankopen", label: "Eenmalige aankopen" },
          { key: "abonnementen", label: "Abonnementen" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "aankopen" && (
        <>
          {!data ? (
            <p className="text-sm text-gray-400">Laden…</p>
          ) : (
            <>
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
                    {data.products.map((p: Product, i: number) => (
                      <span key={p.slug} className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-sm inline-block"
                          style={{ background: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }}
                        />
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
                <BarChart data={data.maanden} products={data.products} height={180} />
              </div>

              {/* Tabel per maand */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Maand</th>
                      {data.products.map((p: Product) => (
                        <th key={p.slug} className="text-center px-4 py-3 font-medium text-gray-600">{p.name}</th>
                      ))}
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Totaal</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...data.maanden].reverse().map((m) => (
                      <tr key={m.maand} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{m.label}</td>
                        {data.products.map((p: Product) => (
                          <td key={p.slug} className="px-4 py-3 text-center text-gray-600">
                            {m.perProduct[p.slug] || "—"}
                          </td>
                        ))}
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

"use client";

import { useState, useMemo } from "react";
import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Calendar,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LineData = { date: string; value: number }[];

type LineConfig = {
  data: LineData;
  color: string;
  label: string;
  active: boolean;
};

// ---------------------------------------------------------------------------
// SimpleLine – SVG lijngrafiek zonder externe libraries
// ---------------------------------------------------------------------------

function SimpleLine({
  lines,
  height = 180,
}: {
  lines: LineConfig[];
  height?: number;
}) {
  const WIDTH = 800;
  const PADDING = { top: 16, right: 20, bottom: 40, left: 44 };
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  // Verzamel alle actieve datapunten voor schaling
  const activeLines = lines.filter((l) => l.active && l.data.length > 0);

  if (activeLines.length === 0 || lines.every((l) => l.data.length === 0)) {
    return (
      <div
        className="flex items-center justify-center text-primary-400 text-sm"
        style={{ height }}
      >
        Geen data
      </div>
    );
  }

  // Alle datums uit alle actieve lijnen samenvoegen en dedupliceren
  const allDates = Array.from(
    new Set(activeLines.flatMap((l) => l.data.map((d) => d.date)))
  ).sort();

  const allValues = activeLines.flatMap((l) => l.data.map((d) => d.value));
  const maxVal = Math.max(...allValues, 1);

  // Toon elke N-de label om overloop te voorkomen
  const labelEvery = Math.max(1, Math.ceil(allDates.length / 8));

  function xPos(index: number) {
    if (allDates.length <= 1) return PADDING.left + chartW / 2;
    return PADDING.left + (index / (allDates.length - 1)) * chartW;
  }

  function yPos(value: number) {
    return PADDING.top + chartH - (value / maxVal) * chartH;
  }

  // Gridlijnen
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PADDING.top + chartH * (1 - f),
    label: Math.round(maxVal * f),
  }));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Gridlijnen */}
      {gridLines.map(({ y, label }) => (
        <g key={y}>
          <line
            x1={PADDING.left}
            x2={PADDING.left + chartW}
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <text
            x={PADDING.left - 6}
            y={y + 4}
            textAnchor="end"
            fontSize={10}
            fill="#94a3b8"
          >
            {label}
          </text>
        </g>
      ))}

      {/* X-as labels */}
      {allDates.map((date, i) => {
        if (i % labelEvery !== 0) return null;
        const label = date.slice(5); // MM-DD
        return (
          <text
            key={date}
            x={xPos(i)}
            y={PADDING.top + chartH + 16}
            textAnchor="middle"
            fontSize={10}
            fill="#94a3b8"
          >
            {label}
          </text>
        );
      })}

      {/* Lijnen per dataserie */}
      {activeLines.map((line) => {
        // Bouw de punten op basis van gedeelde datumvolgorde
        const dateIndexMap = new Map(allDates.map((d, i) => [d, i]));
        const points = line.data
          .filter((d) => dateIndexMap.has(d.date))
          .map((d) => {
            const idx = dateIndexMap.get(d.date)!;
            return `${xPos(idx)},${yPos(d.value)}`;
          })
          .join(" ");

        if (!points) return null;

        return (
          <g key={line.label}>
            <polyline
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Punten */}
            {line.data
              .filter((d) => dateIndexMap.has(d.date))
              .map((d) => {
                const idx = dateIndexMap.get(d.date)!;
                return (
                  <circle
                    key={d.date}
                    cx={xPos(idx)}
                    cy={yPos(d.value)}
                    r={3}
                    fill={line.color}
                  />
                );
              })}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Legenda met toggle
// ---------------------------------------------------------------------------

function ChartLegend({
  lines,
  onToggle,
}: {
  lines: LineConfig[];
  onToggle: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4 mt-2">
      {lines.map((line) => (
        <button
          key={line.label}
          onClick={() => onToggle(line.label)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${
            line.active ? "opacity-100" : "opacity-40"
          }`}
        >
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: line.color }}
          />
          {line.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Samenvattingskaart
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-primary-200 p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + "22" }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-primary-600 font-medium">{label}</p>
        <p className="text-2xl font-bold text-primary-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 sec";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec} sec`;
  return `${min} min ${sec} sec`;
}

// ---------------------------------------------------------------------------
// Hoofd analytics dashboard
// ---------------------------------------------------------------------------

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);

  const from = Date.now() - days * 86_400_000;
  const to = Date.now();

  const stats = useAdminQuery(api.siteAnalytics.getStats, { from, to });

  // Lijn-toggle states
  const [viewsActive, setViewsActive] = useState(true);
  const [uniqueActive, setUniqueActive] = useState(true);
  const [freeActive, setFreeActive] = useState(true);
  const [paidActive, setPaidActive] = useState(true);
  const [naActive, setNaActive] = useState(true);

  // Bereken totale conversies
  const totalConversions = useMemo(() => {
    if (!stats) return 0;
    return stats.dailyConversions.reduce(
      (sum, d) => sum + d.freeAccounts + d.paid + d.nietAlleen,
      0
    );
  }, [stats]);

  // Lijngegevens voor bezoekengrafiek
  const visitLines: LineConfig[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Bezoeken",
        color: "#6d84a8",
        active: viewsActive,
        data: stats.dailyViews.map((d) => ({ date: d.date, value: d.views })),
      },
      {
        label: "Uniek",
        color: "#68a87a",
        active: uniqueActive,
        data: stats.dailyViews.map((d) => ({ date: d.date, value: d.unique })),
      },
    ];
  }, [stats, viewsActive, uniqueActive]);

  // Lijngegevens voor conversiegrafiek
  const conversionLines: LineConfig[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Gratis accounts",
        color: "#6d84a8",
        active: freeActive,
        data: stats.dailyConversions.map((d) => ({
          date: d.date,
          value: d.freeAccounts,
        })),
      },
      {
        label: "Betaald abo",
        color: "#68a87a",
        active: paidActive,
        data: stats.dailyConversions.map((d) => ({
          date: d.date,
          value: d.paid,
        })),
      },
      {
        label: "Niet Alleen",
        color: "#e8934a",
        active: naActive,
        data: stats.dailyConversions.map((d) => ({
          date: d.date,
          value: d.nietAlleen,
        })),
      },
    ];
  }, [stats, freeActive, paidActive, naActive]);

  function toggleVisitLine(label: string) {
    if (label === "Bezoeken") setViewsActive((v) => !v);
    if (label === "Uniek") setUniqueActive((v) => !v);
  }

  function toggleConversionLine(label: string) {
    if (label === "Gratis accounts") setFreeActive((v) => !v);
    if (label === "Betaald abo") setPaidActive((v) => !v);
    if (label === "Niet Alleen") setNaActive((v) => !v);
  }

  // Donut-grafiek berekening
  const donutData = useMemo(() => {
    if (!stats) return { mobile: 0, desktop: 0, mobileAngle: 0 };
    const total = stats.devices.mobile + stats.devices.desktop;
    const mobileAngle = total > 0 ? (stats.devices.mobile / total) * 360 : 0;
    return { ...stats.devices, mobileAngle, total };
  }, [stats]);

  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Laadscherm
  if (stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const maxPageCount = stats.topPages[0]?.count ?? 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-primary-600" />
            Analytics
          </h1>
          <p className="text-sm text-primary-600 mt-1">Website bezoeken &amp; conversies</p>
        </div>

        {/* Tijdbereik knoppen */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          {[
            { label: "30 dagen", value: 30 },
            { label: "90 dagen", value: 90 },
            { label: "Jaar", value: 365 },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === value
                  ? "bg-primary-800 text-white"
                  : "bg-white border border-primary-200 text-primary-700 hover:bg-primary-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sectie 1: Samenvattingskaarten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Totaal bezoeken"
          value={stats.totals.views.toLocaleString("nl-NL")}
          icon={Eye}
          color="#6d84a8"
        />
        <StatCard
          label="Unieke bezoekers"
          value={stats.totals.unique.toLocaleString("nl-NL")}
          icon={Users}
          color="#68a87a"
        />
        <StatCard
          label="Gem. tijd op site"
          value={formatDuration(stats.totals.avgDuration)}
          icon={TrendingUp}
          color="#9c6da8"
        />
        <StatCard
          label="Conversies totaal"
          value={totalConversions.toLocaleString("nl-NL")}
          icon={BarChart3}
          color="#e8934a"
        />
      </div>

      {/* Sectie 2: Bezoeken lijngrafiek */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="text-base font-semibold text-primary-900 mb-4">Bezoeken</h2>
        <SimpleLine lines={visitLines} height={200} />
        <ChartLegend lines={visitLines} onToggle={toggleVisitLine} />
      </div>

      {/* Sectie 3: Conversies + Populairste pagina's */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Conversies grafiek */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Conversies</h2>
          <SimpleLine lines={conversionLines} height={200} />
          <ChartLegend lines={conversionLines} onToggle={toggleConversionLine} />
        </div>

        {/* Populairste pagina's */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">
            Populairste pagina&apos;s
          </h2>
          {stats.topPages.length === 0 ? (
            <p className="text-primary-400 text-sm">Geen data</p>
          ) : (
            <div className="space-y-2">
              {stats.topPages.slice(0, 8).map(({ path, count }) => (
                <div key={path}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-primary-700 truncate max-w-[70%]">{path}</span>
                    <span className="text-primary-500 font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-primary-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((count / maxPageCount) * 100)}%`,
                        backgroundColor: "rgba(109,132,168,0.7)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sectie 4: Apparaten + Totalen tabel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Donut-grafiek apparaten */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Apparaten</h2>
          {donutData.total === 0 ? (
            <p className="text-primary-400 text-sm">Geen data</p>
          ) : (
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0" aria-hidden="true">
                {/* Desktop-segment */}
                {donutData.mobileAngle < 360 && (
                  <path
                    d={describeArc(
                      50,
                      50,
                      38,
                      donutData.mobileAngle,
                      360
                    )}
                    fill="none"
                    stroke="#6d84a8"
                    strokeWidth={18}
                  />
                )}
                {/* Mobiel-segment */}
                {donutData.mobileAngle > 0 && (
                  <path
                    d={describeArc(50, 50, 38, 0, donutData.mobileAngle)}
                    fill="none"
                    stroke="#68a87a"
                    strokeWidth={18}
                  />
                )}
                {/* Volledig gevuld als 100% */}
                {donutData.mobileAngle === 360 && (
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#68a87a" strokeWidth={18} />
                )}
                {donutData.mobileAngle === 0 && (
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#6d84a8" strokeWidth={18} />
                )}
              </svg>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} style={{ color: "#68a87a" }} />
                  <div>
                    <p className="text-xs text-primary-600">Mobiel</p>
                    <p className="font-semibold text-primary-900">
                      {stats.devices.mobile.toLocaleString("nl-NL")}{" "}
                      <span className="text-xs font-normal text-primary-500">
                        (
                        {donutData.total > 0
                          ? Math.round((stats.devices.mobile / donutData.total) * 100)
                          : 0}
                        %)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor size={16} style={{ color: "#6d84a8" }} />
                  <div>
                    <p className="text-xs text-primary-600">Desktop</p>
                    <p className="font-semibold text-primary-900">
                      {stats.devices.desktop.toLocaleString("nl-NL")}{" "}
                      <span className="text-xs font-normal text-primary-500">
                        (
                        {donutData.total > 0
                          ? Math.round((stats.devices.desktop / donutData.total) * 100)
                          : 0}
                        %)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Totalen tabel */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Samenvatting</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-primary-100">
              <tr>
                <td className="py-2 text-primary-600">Totaal bezoeken</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.totals.views.toLocaleString("nl-NL")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">Unieke bezoekers</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.totals.unique.toLocaleString("nl-NL")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">Gem. verblijfsduur</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {formatDuration(stats.totals.avgDuration)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">Gratis accounts</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.dailyConversions
                    .reduce((s, d) => s + d.freeAccounts, 0)
                    .toLocaleString("nl-NL")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">Betaald abonnement</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.dailyConversions
                    .reduce((s, d) => s + d.paid, 0)
                    .toLocaleString("nl-NL")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">Niet Alleen</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.dailyConversions
                    .reduce((s, d) => s + d.nietAlleen, 0)
                    .toLocaleString("nl-NL")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

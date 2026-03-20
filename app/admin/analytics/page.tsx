"use client";

import { useState, useMemo, useEffect } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Euro,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Trash2,
  Shield,
  Plus,
  X,
  PencilLine,
  CalendarCheck,
  Target,
  Gem,
  Heart,
  Leaf,
  ArrowRight,
  ChevronDown,
  Palette,
  ShoppingCart,
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

type DailyView = { date: string; views: number; unique: number };
type DailyConversion = { date: string; freeAccounts: number; paid: number; nietAlleen: number };
type TopPage = { path: string; count: number };

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

function sourceColor(source: string): string {
  const map: Record<string, string> = {
    Direct: "#6d84a8", Google: "#e8934a", Facebook: "#9c6da8",
    Instagram: "#e84a8a", Bing: "#4a8ae8", Pinterest: "#e84a4a",
  };
  return map[source] ?? "#94a3b8";
}

// ---------------------------------------------------------------------------
// Tracking toggle (localStorage vlag)
// ---------------------------------------------------------------------------

function TrackingToggle() {
  const [skipping, setSkipping] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("ttb_skip_tracking") === "1"
  );

  const toggle = () => {
    const next = !skipping;
    if (next) localStorage.setItem("ttb_skip_tracking", "1");
    else localStorage.removeItem("ttb_skip_tracking");
    setSkipping(next);
  };

  return (
    <div className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2.5 mb-4">
      <div>
        <p className="text-xs font-medium text-primary-800">Mijn bezoeken overslaan</p>
        <p className="text-[11px] text-primary-500 mt-0.5">
          {skipping ? "Actief op dit apparaat — jouw bezoeken worden niet geteld." : "Niet actief — jouw bezoeken worden meegeteld."}
        </p>
      </div>
      <button
        onClick={toggle}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${skipping ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${skipping ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inklapbare IP-lijst
// ---------------------------------------------------------------------------

function IpExclusionList({ myIp, excludedIps, onAdd, onRemove }: {
  myIp: string | null;
  excludedIps: any[];
  onAdd: (ip: string) => void;
  onRemove: (id: any) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-800 transition-colors"
      >
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        IP-adressen beheren ({excludedIps.length} uitgesloten)
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {myIp && (
            <div className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2 text-xs">
              <span className="text-primary-600">Huidig IP: <span className="font-mono font-semibold text-primary-800">{myIp}</span></span>
              {!excludedIps.some((e) => e.ip === myIp) && (
                <button onClick={() => onAdd(myIp)} className="flex items-center gap-1 text-primary-600 hover:text-primary-900">
                  <Plus size={12} /> Uitsluiten
                </button>
              )}
            </div>
          )}
          {excludedIps.map((entry: any) => (
            <div key={entry._id} className="flex items-center justify-between text-xs bg-primary-50 rounded-lg px-3 py-2">
              <div>
                <span className="font-mono text-primary-800">{entry.ip}</span>
                {entry.label && <span className="text-primary-500 ml-2">({entry.label})</span>}
              </div>
              <button onClick={() => onRemove(entry._id)} className="text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          ))}
          {excludedIps.length === 0 && <p className="text-xs text-primary-400">Nog geen IPs uitgesloten.</p>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alle pagina's met uitklap
// ---------------------------------------------------------------------------

function AllPagesList({ pages, maxCount }: { pages: TopPage[]; maxCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 10;
  const visible = expanded ? pages : pages.slice(0, LIMIT);
  return (
    <div className="space-y-2">
      {visible.map(({ path, count }) => (
        <div key={path}>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-primary-700 truncate max-w-[70%]">{path}</span>
            <span className="text-primary-500 font-medium">{count}</span>
          </div>
          <div className="h-2 bg-primary-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((count / maxCount) * 100)}%`, backgroundColor: "rgba(109,132,168,0.7)" }}
            />
          </div>
        </div>
      ))}
      {pages.length > LIMIT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-800 transition-colors mt-1"
        >
          <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Minder tonen" : `Toon alle ${pages.length} pagina's`}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hoofd analytics dashboard
// ---------------------------------------------------------------------------

export default function AdminAnalytics() {
  const [preset, setPreset] = useState("laatste30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showList, setShowList] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const PRESETS = [
    { key: "vandaag", label: "Vandaag" },
    { key: "week", label: "Week tot nu toe" },
    { key: "maand", label: "Maand tot nu toe" },
    { key: "jaar", label: "Jaar tot nu toe" },
    { key: "laatste7", label: "Laatste 7 dagen" },
    { key: "laatste14", label: "Laatste 14 dagen" },
    { key: "laatste28", label: "Laatste 28 dagen" },
    { key: "laatste30", label: "Laatste 30 dagen" },
    { key: "laatste90", label: "Laatste 90 dagen" },
    { key: "vorigeMaand", label: "Vorige maand" },
    { key: "custom", label: "Aangepast bereik" },
  ];

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return {
        from: new Date(customFrom).getTime(),
        to: new Date(customTo + "T23:59:59").getTime(),
      };
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === "vandaag") return { from: today.getTime(), to: Date.now() };
    if (preset === "week") {
      const day = today.getDay() === 0 ? 6 : today.getDay() - 1;
      return { from: new Date(today.getTime() - day * 86_400_000).getTime(), to: Date.now() };
    }
    if (preset === "maand") return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: Date.now() };
    if (preset === "jaar") return { from: new Date(now.getFullYear(), 0, 1).getTime(), to: Date.now() };
    if (preset === "laatste7") return { from: Date.now() - 7 * 86_400_000, to: Date.now() };
    if (preset === "laatste14") return { from: Date.now() - 14 * 86_400_000, to: Date.now() };
    if (preset === "laatste28") return { from: Date.now() - 28 * 86_400_000, to: Date.now() };
    if (preset === "laatste30") return { from: Date.now() - 30 * 86_400_000, to: Date.now() };
    if (preset === "laatste90") return { from: Date.now() - 90 * 86_400_000, to: Date.now() };
    if (preset === "vorigeMaand") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from: first.getTime(), to: last.getTime() };
    }
    return { from: Date.now() - 30 * 86_400_000, to: Date.now() };
  }, [preset, customFrom, customTo]);

  const stats = useAdminQuery(api.siteAnalytics.getStats, { from, to });
  const featureStats = useAdminQuery(api.siteAnalytics.getFeatureStats, { from, to });
  const allGoals = useAdminQuery(api.siteAnalytics.listGoalsWithOwner, {});
  const liveVisitors = useAdminQuery(api.siteAnalytics.getLiveVisitors, {});
  const recentRegs = useAdminQuery(api.siteAnalytics.getRecentRegistrations, { days: 7 });
  const recentHouvast = useAdminQuery(api.siteAnalytics.getRecentHouvasteSignups, { days: 7 });
  const excludedIps = useAdminQuery(api.siteAnalytics.listExcludedIps, {});
  const addExcludedIp = useAdminMutation(api.siteAnalytics.addExcludedIp);
  const removeExcludedIp = useAdminMutation(api.siteAnalytics.removeExcludedIp);
  const excludedEmails = useAdminQuery(api.siteAnalytics.listExcludedEmails, {});
  const addExcludedEmail = useAdminMutation(api.siteAnalytics.addExcludedEmail);
  const removeExcludedEmail = useAdminMutation(api.siteAnalytics.removeExcludedEmail);
  const deleteOldViews = useAdminMutation(api.siteAnalytics.deleteOldViews);

  const [loadTimeout, setLoadTimeout] = useState(false);
  const [myIp, setMyIp] = useState<string | null>(null);
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);
  const [newExcludedEmail, setNewExcludedEmail] = useState("");

  // Inklapbare secties
  const [openBezoeken, setOpenBezoeken] = useState(true);
  const [openConversies, setOpenConversies] = useState(true);
  const [openApparaten, setOpenApparaten] = useState(true);
  const [openFeatureGebruik, setOpenFeatureGebruik] = useState(true);
  const [openDoelen, setOpenDoelen] = useState(false);
  const [openBeheer, setOpenBeheer] = useState(true);

  useEffect(() => {
    fetch("/api/my-ip").then(r => r.json()).then(d => setMyIp(d.ip ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadTimeout(false);
    const t = setTimeout(() => setLoadTimeout(true), 20000);
    return () => clearTimeout(t);
  }, [preset, from, to]);

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
      (sum: number, d: DailyConversion) => sum + d.freeAccounts + d.paid + d.nietAlleen,
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
        data: stats.dailyViews.map((d: DailyView) => ({ date: d.date, value: d.views })),
      },
      {
        label: "Uniek",
        color: "#68a87a",
        active: uniqueActive,
        data: stats.dailyViews.map((d: DailyView) => ({ date: d.date, value: d.unique })),
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
        data: stats.dailyConversions.map((d: DailyConversion) => ({
          date: d.date,
          value: d.freeAccounts,
        })),
      },
      {
        label: "Betaald abo",
        color: "#68a87a",
        active: paidActive,
        data: stats.dailyConversions.map((d: DailyConversion) => ({
          date: d.date,
          value: d.paid,
        })),
      },
      {
        label: "Niet Alleen",
        color: "#e8934a",
        active: naActive,
        data: stats.dailyConversions.map((d: DailyConversion) => ({
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
    if (!stats) return { mobile: 0, tablet: 0, desktop: 0, mobileAngle: 0, tabletAngle: 0 };
    const total = stats.devices.mobile + (stats.devices.tablet ?? 0) + stats.devices.desktop;
    const mobileAngle = total > 0 ? (stats.devices.mobile / total) * 360 : 0;
    const tabletAngle = total > 0 ? ((stats.devices.tablet ?? 0) / total) * 360 : 0;
    return { ...stats.devices, tablet: stats.devices.tablet ?? 0, mobileAngle, tabletAngle, total };
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
    if (loadTimeout) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
          <BarChart3 size={32} className="text-primary-300" />
          <p className="text-primary-700 font-medium">Analytics konden niet worden geladen</p>
          <p className="text-sm text-primary-500 max-w-sm">
            Kon geen verbinding maken met de database. Ververs de pagina of log opnieuw in.
          </p>
          <button
            onClick={() => { setLoadTimeout(false); window.location.reload(); }}
            className="px-4 py-2 bg-primary-800 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      );
    }
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

        {/* Tijdbereik dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-primary-200 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
            >
              <Calendar size={14} className="text-primary-400" />
              {PRESETS.find((p) => p.key === preset)?.label ?? "Periode"}
              <ChevronDown size={14} className={`text-primary-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-primary-200 rounded-xl shadow-lg z-20 py-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => { setPreset(p.key); setDropdownOpen(false); if (p.key !== "custom") { setCustomFrom(""); setCustomTo(""); } }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${preset === p.key ? "bg-primary-50 text-primary-900 font-medium" : "text-primary-700 hover:bg-primary-50"} ${p.key === "custom" ? "border-t border-primary-100 mt-1 pt-2" : ""}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border border-primary-200 text-primary-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400" />
              <span className="text-primary-400 text-xs">–</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border border-primary-200 text-primary-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400" />
            </div>
          )}
        </div>
      </div>

      {/* Nieuwe inschrijvingen banner */}
      {recentRegs && recentRegs.today > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Users size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              {recentRegs.today} nieuwe inschrijving{recentRegs.today !== 1 ? "en" : ""} vandaag
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {recentRegs.users
                .filter((u: { createdAt: number; name: string; email: string }) => u.createdAt >= new Date().setHours(0, 0, 0, 0))
                .map((u: { createdAt: number; name: string; email: string }, i: number) => (
                  <span key={i} className="text-xs text-green-700">
                    {u.name || u.email}
                    <span className="text-green-400 ml-1">
                      {new Date(u.createdAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                ))}
            </div>
          </div>
          <span className="text-xs text-green-500 flex-shrink-0">{recentRegs.total} deze week</span>
        </div>
      )}

      {recentHouvast && recentHouvast.today > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Leaf size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              {recentHouvast.today} nieuwe Houvast aanvra{recentHouvast.today !== 1 ? "gen" : "ag"} vandaag
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {recentHouvast.profielen
                .filter((p: { createdAt: number }) => p.createdAt >= new Date().setHours(0, 0, 0, 0))
                .map((p: { createdAt: number; name: string | null; email: string }, i: number) => (
                  <span key={i} className="text-xs text-green-700">
                    {p.name || p.email}
                    <span className="text-green-400 ml-1">
                      {new Date(p.createdAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                ))}
            </div>
          </div>
          <span className="text-xs text-green-500 flex-shrink-0">{recentHouvast.total} deze week</span>
        </div>
      )}

      {/* Sectie 1: Samenvattingskaarten */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
          label="Conversies"
          value={totalConversions.toLocaleString("nl-NL")}
          icon={Target}
          color="#e8934a"
        />
        <StatCard
          label="Conversie ratio"
          value={(stats as any).conversieRatio !== undefined ? (stats as any).conversieRatio + "%" : "–"}
          icon={TrendingUp}
          color="#4a8ae8"
        />
        <StatCard
          label={(stats as any).omzetGeschat ? "Omzet (geschat)" : "Omzet"}
          value={(stats as any).omzet !== undefined ? "€\u00a0" + (stats as any).omzet.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "–"}
          icon={Euro}
          color="#4aab6e"
        />
      </div>

      {/* Bezoeken lijngrafiek */}
      <div className="bg-white rounded-xl border border-primary-200">
        <button onClick={() => setOpenBezoeken(v => !v)} className="w-full flex items-center justify-between p-6 text-left">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-primary-900">Bezoeken</h2>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary-100 text-primary-800 text-xs font-bold tabular-nums">
                {liveVisitors ?? 0}
              </span>
              <span className="text-xs text-primary-400">Live</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            </div>
          </div>
          <ChevronDown size={16} className={`text-primary-400 transition-transform ${openBezoeken ? "rotate-180" : ""}`} />
        </button>
        {openBezoeken && <div className="px-6 pb-6 space-y-6">
          <div>
            <SimpleLine lines={visitLines} height={200} />
            <ChartLegend lines={visitLines} onToggle={toggleVisitLine} />
          </div>
        </div>}
      </div>

      {/* ROW A: Betrokkenheid | Koopknop klikken | Houvast trechter (3-col, not collapsible) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Betrokkenheid */}
        <div className="bg-white rounded-xl border border-primary-200 p-5">
          <h3 className="text-sm font-semibold text-primary-800 mb-4">Betrokkenheid</h3>
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-primary-100">
            <div>
              <p className="text-[10px] text-primary-400 mb-0.5">Terugkerend</p>
              <p className="text-lg font-bold text-primary-900">{stats.totals.returningVisitors ?? 0}</p>
              <p className="text-[10px] text-primary-400 mt-0.5">
                {stats.totals.unique > 0
                  ? `${Math.round(((stats.totals.returningVisitors ?? 0) / stats.totals.unique) * 100)}% van uniek`
                  : "–"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary-400 mb-0.5">Gem. verblijf</p>
              <p className="text-lg font-bold text-primary-900">{formatDuration(stats.totals.avgDuration)}</p>
              <p className="text-[10px] text-primary-400 mt-0.5">per bezoek</p>
            </div>
          </div>
          {(stats as any).topPageDurations?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-primary-500 mb-2">Gem. tijd per pagina</p>
              {(stats as any).topPageDurations.map((p: { path: string; avgDuration: number }) => (
                <div key={p.path} className="flex items-center justify-between text-xs">
                  <span className="text-primary-600 truncate max-w-[140px]">{p.path}</span>
                  <span className="text-primary-800 font-medium flex-shrink-0 ml-2">{formatDuration(p.avgDuration)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Koopknop klikken */}
        <div className="bg-white rounded-xl border border-primary-200 p-5">
          <h3 className="text-sm font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={15} className="text-primary-400" />
            Koopknop klikken
          </h3>
          {(stats as any).koopknopKlikken ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-primary-100">
                <span className="text-[10px] text-primary-400">Totaal klikken</span>
                <span className="text-lg font-bold text-primary-900">{(stats as any).koopknopKlikken.total}</span>
              </div>
              {(stats as any).koopknopKlikken.byPage.length === 0 ? (
                <p className="text-xs text-primary-400">Nog geen klikken in deze periode</p>
              ) : (
                <div className="space-y-1.5">
                  {(stats as any).koopknopKlikken.byPage.map((p: { path: string; count: number }) => (
                    <div key={p.path} className="flex items-center justify-between text-xs">
                      <span className="text-primary-600 truncate max-w-[140px]">{p.path}</span>
                      <span className="text-primary-800 font-medium flex-shrink-0 ml-2">{p.count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-primary-400">Laden…</p>
          )}
        </div>

        {/* Houvast trechter */}
        <div className="bg-white rounded-xl border border-primary-200 p-5">
          <h2 className="text-sm font-semibold text-primary-800 mb-1 flex items-center gap-2">
            <Leaf size={15} className="text-green-600" />
            Houvast trechter
          </h2>
          <p className="text-xs text-primary-500 mb-5">Van aanvraag tot account in geselecteerde periode.</p>
          {featureStats ? (
            <div className="space-y-4">
              {/* Stap 1 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-primary-600">Houvast aangevraagd</span>
                  <span className="text-sm font-bold text-primary-900">{featureStats.houvast.total}</span>
                </div>
                <div className="h-2.5 bg-primary-50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-green-400" style={{ width: "100%" }} />
                </div>
              </div>
              {/* Stap 2 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs text-primary-600">
                    <ArrowRight size={10} className="text-primary-400" />
                    Account aangemaakt
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary-900">{featureStats.houvast.converted}</span>
                    {featureStats.houvast.total > 0 && (
                      <span className="text-xs text-primary-400">
                        {Math.round((featureStats.houvast.converted / featureStats.houvast.total) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 bg-primary-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{
                      width: featureStats.houvast.total > 0
                        ? `${Math.round((featureStats.houvast.converted / featureStats.houvast.total) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-primary-400 pt-1">
                Totaal ooit aangevraagd: <span className="font-semibold text-primary-600">{featureStats.houvast.allTime}</span>
              </p>

              {/* Lijst aanvragers */}
              {featureStats.houvast.list.length > 0 && (
                <div className="mt-4 pt-3 border-t border-primary-100">
                  <button
                    onClick={() => setShowList((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-800 transition-colors mb-2"
                  >
                    <ArrowRight size={11} className={`transition-transform ${showList ? "rotate-90" : ""}`} />
                    {showList ? "Verberg" : "Toon"} {featureStats.houvast.list.length} aanvragers
                  </button>
                  {showList && (
                    <div className="space-y-0">
                      {featureStats.houvast.list.map((h: { email: string; name: string | null; createdAt: number; heeftAccount: boolean }, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-primary-50 last:border-0">
                          <div>
                            {h.name && <span className="font-medium text-primary-800 mr-1.5">{h.name}</span>}
                            <span className="text-primary-500">{h.email}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-primary-400">
                              {new Date(h.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                            </span>
                            {h.heeftAccount ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">account</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-400">geen account</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-primary-400">Laden…</div>
          )}
        </div>
      </div>

      {/* ROW B: Conversies & Pagina's (collapsible) — 3-col: Heatmap | Conversies | Pagina's */}
      <div className="bg-white rounded-xl border border-primary-200">
        <button onClick={() => setOpenConversies(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-left">
          <h2 className="text-base font-semibold text-primary-900">Conversies & Pagina's</h2>
          <ChevronDown size={16} className={`text-primary-400 transition-transform ${openConversies ? "rotate-180" : ""}`} />
        </button>
      </div>
      {openConversies && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Bezoeken per dag &amp; uur</h2>
          {stats.hourlyViews && stats.hourlyViews.some((d: any) => d.hours.some((c: number) => c > 0)) ? (() => {
            const heatDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
            const heatMax = Math.max(...stats.hourlyViews.flatMap((d: any) => d.hours), 1);
            return (
              <div className="overflow-x-auto">
                <div style={{ minWidth: 280 }}>
                  <div className="flex mb-1 ml-8">
                    {heatDays.map((d) => (
                      <div key={d} className="flex-1 text-center text-[10px] font-medium text-primary-600">{d}</div>
                    ))}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} className="flex items-center gap-0 mb-0.5">
                      <div className="w-7 text-right pr-1.5 text-[9px] text-primary-400 flex-shrink-0">
                        {hour % 2 === 0 ? `${hour}:00` : ""}
                      </div>
                      {stats.hourlyViews.map((d: any) => {
                        const count = d.hours[hour];
                        const intensity = count / heatMax;
                        return (
                          <div
                            key={d.dow}
                            className="flex-1 mx-0.5 rounded-sm h-4 group relative cursor-default"
                            style={{
                              backgroundColor: count === 0
                                ? "rgba(109,132,168,0.07)"
                                : `rgba(59,100,170,${0.15 + intensity * 0.85})`,
                            }}
                          >
                            {count > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                                <div className="bg-primary-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap shadow">
                                  {heatDays[d.dow]} {hour}:00 — {count}×
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 mt-2 ml-8">
                    <span className="text-[9px] text-primary-400">Minder</span>
                    {[0, 0.2, 0.4, 0.7, 1].map((v) => (
                      <div key={v} className="w-4 h-2.5 rounded-sm" style={{ backgroundColor: v === 0 ? "rgba(109,132,168,0.07)" : `rgba(59,100,170,${0.15 + v * 0.85})` }} />
                    ))}
                    <span className="text-[9px] text-primary-400">Meer</span>
                  </div>
                </div>
              </div>
            );
          })() : (
            <p className="text-xs text-primary-400">Geen data</p>
          )}
        </div>

        {/* Conversies grafiek */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Conversies</h2>
          <SimpleLine lines={conversionLines} height={200} />
          <ChartLegend lines={conversionLines} onToggle={toggleConversionLine} />
          {(stats as any).allSubTypes && (stats as any).allSubTypes.length > 0 && (
            <p className="text-[10px] text-primary-400 mt-3">
              Abonnementstypes in periode: {(stats as any).allSubTypes.join(", ")}
            </p>
          )}
        </div>

        {/* Populairste pagina's */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">
            Populairste pagina&apos;s
          </h2>
          {stats.topPages.length === 0 ? (
            <p className="text-primary-400 text-sm">Geen data</p>
          ) : (
            <AllPagesList pages={stats.topPages} maxCount={maxPageCount} />
          )}
        </div>
      </div>}

      {/* ROW C: Apparaten & Samenvatting (collapsible) — 3-col: Apparaten | Samenvatting | Bron */}
      <div className="bg-white rounded-xl border border-primary-200">
        <button onClick={() => setOpenApparaten(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-left">
          <h2 className="text-base font-semibold text-primary-900">Apparaten & Samenvatting</h2>
          <ChevronDown size={16} className={`text-primary-400 transition-transform ${openApparaten ? "rotate-180" : ""}`} />
        </button>
      </div>
      {openApparaten && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Apparaten */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Apparaten</h2>
          {donutData.total === 0 ? (
            <p className="text-primary-400 text-sm">Geen data</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Monitor size={15} style={{ color: "#6d84a8" }} />
                  <span className="text-primary-700">Desktop</span>
                </div>
                <span className="text-primary-500 font-medium">
                  {Math.round((stats.devices.desktop / donutData.total) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone size={15} style={{ color: "#68a87a" }} />
                  <span className="text-primary-700">Mobiel</span>
                </div>
                <span className="text-primary-500 font-medium">
                  {Math.round((stats.devices.mobile / donutData.total) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tablet size={15} style={{ color: "#e8934a" }} />
                  <span className="text-primary-700">Tablet</span>
                </div>
                <span className="text-primary-500 font-medium">
                  {Math.round((donutData.tablet / donutData.total) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Samenvatting tabel */}
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
                    .reduce((s: number, d: DailyConversion) => s + d.freeAccounts, 0)
                    .toLocaleString("nl-NL")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">1 jaar toegang</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.dailyConversions
                    .reduce((s: number, d: DailyConversion) => s + d.paid, 0)
                    .toLocaleString("nl-NL")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-primary-600">Niet Alleen</td>
                <td className="py-2 text-right font-semibold text-primary-900">
                  {stats.dailyConversions
                    .reduce((s: number, d: DailyConversion) => s + d.nietAlleen, 0)
                    .toLocaleString("nl-NL")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bron */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-4">Bron</h2>
          {!(stats as any).bronnen || (stats as any).bronnen.length === 0 ? (
            <p className="text-xs text-primary-400">Geen data</p>
          ) : (() => {
            const bronnen: { source: string; count: number; pct: number }[] = (stats as any).bronnen;
            const top5 = bronnen.slice(0, 5);
            const totalPct = top5.reduce((s, b) => s + b.count, 0) || 1;
            // Build donut segments
            let angle = 0;
            const segments = top5.map((b) => {
              const sweep = (b.count / totalPct) * 360;
              const seg = { source: b.source, startAngle: angle, endAngle: angle + sweep };
              angle += sweep;
              return seg;
            });
            return (
              <div className="space-y-3">
                <div className="flex justify-center mb-2">
                  <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden="true">
                    {segments.map((seg) => (
                      seg.endAngle - seg.startAngle > 0 && (
                        <path
                          key={seg.source}
                          d={describeArc(50, 50, 38, seg.startAngle, seg.endAngle >= 360 ? 359.99 : seg.endAngle)}
                          fill="none"
                          stroke={sourceColor(seg.source)}
                          strokeWidth={18}
                        />
                      )
                    ))}
                    {top5.length === 0 && (
                      <circle cx={50} cy={50} r={38} fill="none" stroke="#e2e8f0" strokeWidth={18} />
                    )}
                  </svg>
                </div>
                <div className="space-y-0">
                  {bronnen.map((b) => (
                    <div key={b.source} className="flex items-center justify-between text-sm py-1.5 border-b border-primary-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sourceColor(b.source) }} />
                        <span className="text-primary-700">{b.source}</span>
                      </div>
                      <span className="text-primary-500 font-medium">{b.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>}

      {/* Feature gebruik (standalone collapsible) */}
      <div className="bg-white rounded-xl border border-primary-200">
        <button onClick={() => setOpenFeatureGebruik(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-left">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary-500" />
            <span className="text-base font-semibold text-primary-900">Feature gebruik</span>
          </div>
          <ChevronDown size={16} className={`text-primary-400 transition-transform ${openFeatureGebruik ? "rotate-180" : ""}`} />
        </button>
        {openFeatureGebruik && <div className="px-6 pb-6">
        <p className="text-xs text-primary-500 mb-5">Nieuw aangemaakt in geselecteerde periode.</p>
        {featureStats ? (
          <>
          <div className="space-y-3">
            {featureStats.features.map((f: { label: string; count: number; allTime: number }) => {
              const maxCount = Math.max(...featureStats.features.map((x: { count: number }) => x.count), 1);
              const Icon = f.label === "Reflecties" ? PencilLine
                : f.label === "Check-ins" ? CalendarCheck
                : f.label === "Doelen" ? Target
                : f.label === "Memories" ? Gem
                : Heart;
              return (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs text-primary-700">
                      <Icon size={13} className="text-primary-400" />
                      {f.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary-900">{f.count}</span>
                      <span className="text-xs text-primary-400">/ {f.allTime} totaal</span>
                    </div>
                  </div>
                  <div className="h-2 bg-primary-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((f.count / maxCount) * 100)}%`,
                        backgroundColor: "rgba(109,132,168,0.65)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
            {allGoals && allGoals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-primary-100">
                <button onClick={() => setOpenDoelen(v => !v)} className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-800 transition-colors mb-2">
                  <ChevronDown size={13} className={`transition-transform ${openDoelen ? "rotate-180" : ""}`} />
                  Alle doelen in database ({allGoals.length})
                </button>
                {openDoelen && (
                  <div className="space-y-0 max-h-48 overflow-y-auto">
                    {allGoals.map((g: { id: string; title: string; email: string; createdAt: number }) => (
                      <div key={g.id} className="flex items-start justify-between text-xs py-1.5 border-b border-primary-50 last:border-0 gap-2">
                        <span className="text-primary-800 font-medium truncate flex-1">{g.title}</span>
                        <span className="text-primary-400 flex-shrink-0 truncate max-w-[140px]">{g.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-primary-400">Laden…</div>
        )}
        </div>}
      </div>

      {/* Sectie 6: Beheer */}
      <div className="bg-white rounded-xl border border-primary-200">
        <button onClick={() => setOpenBeheer(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-left">
          <h2 className="text-base font-semibold text-primary-900">Beheer</h2>
          <ChevronDown size={16} className={`text-primary-400 transition-transform ${openBeheer ? "rotate-180" : ""}`} />
        </button>
      </div>
      {openBeheer && <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* IP uitsluiting */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-1 flex items-center gap-2">
            <Shield size={16} className="text-primary-500" />
            Mijn bezoeken uitsluiten
          </h2>
          <p className="text-xs text-primary-500 mb-4">Zet de schakelaar aan op dit apparaat en je bezoeken worden nooit meer geteld, ongeacht IP.</p>

          {/* Apparaat-vlag */}
          <TrackingToggle />

          {/* IP-lijst inklapbaar */}
          <IpExclusionList
            myIp={myIp}
            excludedIps={excludedIps ?? []}
            onAdd={(ip) => addExcludedIp({ ip, label: "Mijn IP" }).catch(() => {})}
            onRemove={(id) => removeExcludedIp({ id }).catch(() => {})}
          />
        </div>

        {/* Email uitsluiting (testbetalingen) */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-1 flex items-center gap-2">
            <Shield size={16} className="text-primary-500" />
            Uitgesloten emails
          </h2>
          <p className="text-xs text-primary-500 mb-4">Betalingen van deze emails worden niet geteld als conversie.</p>

          {/* Nieuw email toevoegen */}
          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={newExcludedEmail}
              onChange={(e) => setNewExcludedEmail(e.target.value)}
              placeholder="email@voorbeeld.nl"
              className="flex-1 text-xs px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <button
              onClick={() => {
                if (!newExcludedEmail.trim()) return;
                addExcludedEmail({ email: newExcludedEmail.trim(), label: "Test" }).catch(() => {});
                setNewExcludedEmail("");
              }}
              className="flex items-center gap-1 text-xs px-3 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
            >
              <Plus size={12} /> Toevoegen
            </button>
          </div>

          {/* Lijst */}
          <div className="space-y-2">
            {(excludedEmails ?? []).map((entry: any) => (
              <div key={entry._id} className="flex items-center justify-between text-xs bg-primary-50 rounded-lg px-3 py-2">
                <div>
                  <span className="text-primary-800">{entry.email}</span>
                  {entry.label && <span className="text-primary-500 ml-2">({entry.label})</span>}
                </div>
                <button
                  onClick={() => removeExcludedEmail({ id: entry._id }).catch(() => {})}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {excludedEmails?.length === 0 && (
              <p className="text-xs text-primary-400">Nog geen emails uitgesloten.</p>
            )}
          </div>
        </div>

        {/* Data opruimen */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-base font-semibold text-primary-900 mb-1 flex items-center gap-2">
            <Trash2 size={16} className="text-primary-500" />
            Data opruimen
          </h2>
          <p className="text-xs text-primary-500 mb-4">Verwijder testbezoeken van vóór de advertentiestart.</p>

          <div className="space-y-3">
            {[
              { label: "Vóór 7 maart 2026 (advertentiestart)", before: new Date("2026-03-07").getTime() },
            ].map(({ label, before }) => (
              <div key={before} className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2.5">
                <span className="text-xs text-primary-700">{label}</span>
                <button
                  onClick={async () => {
                    if (!confirm(`Alle bezoeken vóór 7 maart verwijderen?`)) return;
                    const n = await deleteOldViews({ before }).catch(() => 0);
                    setCleanupMsg(`${n} bezoeken verwijderd.`);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Verwijderen
                </button>
              </div>
            ))}
            {cleanupMsg && (
              <p className="text-xs text-green-600 font-medium">{cleanupMsg}</p>
            )}
          </div>
        </div>

      </div>}
    </div>
  );
}

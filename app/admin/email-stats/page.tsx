"use client";

import { useState } from "react";
import { Mail, Eye, MousePointerClick, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery } from "../AdminAuthContext";

type Stroom = {
  onderwerp: string;
  verzonden: number;
  afgeleverd: number;
  geopend: number;
  geklikt: number;
  bounced: number;
  klachten: number;
};

type Stats = {
  dagen: number;
  heeftData: boolean;
  totaal: Stroom;
  stromen: Stroom[];
};

const PERIODES = [
  { label: "7 dagen", dagen: 7 },
  { label: "30 dagen", dagen: 30 },
  { label: "90 dagen", dagen: 90 },
  { label: "1 jaar", dagen: 365 },
];

function pct(deel: number, geheel: number): string {
  if (!geheel) return "–";
  return `${Math.round((deel / geheel) * 100)}%`;
}

function KpiKaart({
  icon: Icon,
  label,
  waarde,
  sub,
  kleur,
}: {
  icon: React.ElementType;
  label: string;
  waarde: string;
  sub?: string;
  kleur: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-500">
        <Icon size={16} style={{ color: kleur }} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{waarde}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function EmailStatsPage() {
  const [dagen, setDagen] = useState(30);
  const stats = useAdminQuery(api.emailStats.stats, { sinceDays: dagen }) as Stats | undefined;

  const t = stats?.totaal;
  // Open-rate en klik-ratio berekenen we t.o.v. het aantal afgeleverde mails
  // (industriestandaard). Valt terug op verzonden als er geen delivered-events zijn.
  const noemer = t ? (t.afgeleverd || t.verzonden) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Mail size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">E-mail statistieken</h1>
          <p className="text-sm text-gray-400">Open-rate en klik-ratio van de Resend-mails</p>
        </div>
      </div>

      {/* Periode-keuze */}
      <div className="flex flex-wrap gap-2">
        {PERIODES.map((p) => (
          <button
            key={p.dagen}
            onClick={() => setDagen(p.dagen)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              dagen === p.dagen
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {stats === undefined ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : !stats.heeftData ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <Mail size={28} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium mb-1">Nog geen e-mail-events</p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Zodra de Resend-webhook en open/click-tracking aanstaan, verschijnen hier
            de cijfers. Nieuwe mails worden dan vanzelf bijgehouden.
          </p>
        </div>
      ) : (
        <>
          {/* KPI's */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiKaart icon={Send} label="Verzonden" waarde={String(t!.verzonden)} kleur="#6d84a8" />
            <KpiKaart
              icon={CheckCircle2}
              label="Afgeleverd"
              waarde={String(t!.afgeleverd)}
              sub={`${pct(t!.afgeleverd, t!.verzonden)} van verzonden`}
              kleur="#16a34a"
            />
            <KpiKaart
              icon={Eye}
              label="Open-rate"
              waarde={pct(t!.geopend, noemer)}
              sub={`${t!.geopend} geopend`}
              kleur="#0ea5e9"
            />
            <KpiKaart
              icon={MousePointerClick}
              label="Klik-ratio"
              waarde={pct(t!.geklikt, noemer)}
              sub={`${t!.geklikt} geklikt`}
              kleur="#8b5cf6"
            />
            <KpiKaart
              icon={AlertTriangle}
              label="Bounces"
              waarde={String(t!.bounced)}
              sub={pct(t!.bounced, t!.verzonden)}
              kleur="#f59e0b"
            />
            <KpiKaart
              icon={AlertTriangle}
              label="Klachten"
              waarde={String(t!.klachten)}
              sub="spam-meldingen"
              kleur="#ef4444"
            />
          </div>

          {/* Per mailstroom */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Per mailstroom</h2>
              <p className="text-xs text-gray-400">Gegroepeerd op onderwerp</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-2.5 font-medium">Onderwerp</th>
                    <th className="px-3 py-2.5 font-medium text-right">Verz.</th>
                    <th className="px-3 py-2.5 font-medium text-right">Afgel.</th>
                    <th className="px-3 py-2.5 font-medium text-right">Open</th>
                    <th className="px-3 py-2.5 font-medium text-right">Klik</th>
                    <th className="px-5 py-2.5 font-medium text-right">Bounce</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.stromen.map((s) => {
                    const n = s.afgeleverd || s.verzonden;
                    return (
                      <tr key={s.onderwerp} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-2.5 text-gray-700 max-w-xs truncate" title={s.onderwerp}>
                          {s.onderwerp}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{s.verzonden}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{s.afgeleverd}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-gray-900 font-medium">{pct(s.geopend, n)}</span>
                          <span className="text-gray-300 text-xs ml-1">({s.geopend})</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-gray-900 font-medium">{pct(s.geklikt, n)}</span>
                          <span className="text-gray-300 text-xs ml-1">({s.geklikt})</span>
                        </td>
                        <td className="px-5 py-2.5 text-right text-gray-500">{s.bounced}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Open-rate en klik-ratio zijn berekend t.o.v. het aantal afgeleverde mails.
            Open-rate is een indicatie: sommige mailprogramma's laden de meet-pixel niet,
            waardoor het werkelijke aantal hoger kan liggen. Periode:{" "}
            laatste {stats.dagen} dagen.
          </p>
        </>
      )}
    </div>
  );
}

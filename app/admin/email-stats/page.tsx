"use client";

import { useState } from "react";
import { Mail, Eye, MousePointerClick, AlertTriangle, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery } from "../AdminAuthContext";

type Cijfers = {
  onderwerp: string;
  verzonden: number;
  afgeleverd: number;
  geopend: number;
  geklikt: number;
  bounced: number;
  klachten: number;
};

// Een variant is dezelfde mail onder een eerdere onderwerpregel.
type Variant = Cijfers & { huidig: boolean };

type Stroom = Cijfers & { varianten: Variant[] };

type Groep = {
  groep: "evenHouvast" | "nietAlleen" | "overig";
  titel: string;
  totaal: Cijfers;
  stromen: Stroom[];
};

type Stats = {
  dagen: number;
  heeftData: boolean;
  totaal: Cijfers;
  stromen: Stroom[];
  groepen: Groep[];
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
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-500">
        <Icon size={16} style={{ color: kleur }} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{waarde}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// Eén mail. Is de onderwerpregel ooit gewijzigd, dan tellen de oude en nieuwe
// titel samen op deze regel, en klap je uit om te zien hoe elke titel het deed.
function StroomRij({ stroom }: { stroom: Stroom }) {
  const [open, setOpen] = useState(false);
  const heeftVarianten = stroom.varianten.length > 1;
  const n = stroom.afgeleverd || stroom.verzonden;

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50 ${heeftVarianten ? "cursor-pointer" : ""}`}
        onClick={heeftVarianten ? () => setOpen((o) => !o) : undefined}
      >
        <td className="px-5 py-2.5 text-gray-700 max-w-xs" title={stroom.onderwerp}>
          <div className="flex items-center gap-1.5">
            {heeftVarianten && (
              <ChevronDown
                size={14}
                className={`text-gray-400 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
              />
            )}
            <span className="truncate">{stroom.onderwerp}</span>
            {heeftVarianten && (
              <span className="shrink-0 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                {stroom.varianten.length} titels
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right text-gray-500">{stroom.verzonden}</td>
        <td className="px-3 py-2.5 text-right text-gray-500">{stroom.afgeleverd}</td>
        <td className="px-3 py-2.5 text-right">
          <span className="text-gray-900 font-medium">{pct(stroom.geopend, n)}</span>
          <span className="text-gray-300 text-xs ml-1">({stroom.geopend})</span>
        </td>
        <td className="px-3 py-2.5 text-right">
          <span className="text-gray-900 font-medium">{pct(stroom.geklikt, n)}</span>
          <span className="text-gray-300 text-xs ml-1">({stroom.geklikt})</span>
        </td>
        <td className="px-5 py-2.5 text-right text-gray-500">{stroom.bounced}</td>
      </tr>

      {heeftVarianten &&
        open &&
        stroom.varianten.map((v) => {
          const vn = v.afgeleverd || v.verzonden;
          return (
            <tr key={v.onderwerp} className="border-b border-gray-50 bg-gray-50/60 text-xs">
              <td className="px-5 py-2 pl-11 text-gray-500 max-w-xs" title={v.onderwerp}>
                <span className="block truncate">{v.onderwerp}</span>
                <span className="text-[11px] text-gray-400">
                  {v.huidig ? "huidige titel" : "eerdere titel"}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-gray-500">{v.verzonden}</td>
              <td className="px-3 py-2 text-right text-gray-500">{v.afgeleverd}</td>
              <td className="px-3 py-2 text-right">
                <span className="text-gray-700 font-medium">{pct(v.geopend, vn)}</span>
                <span className="text-gray-300 ml-1">({v.geopend})</span>
              </td>
              <td className="px-3 py-2 text-right">
                <span className="text-gray-700 font-medium">{pct(v.geklikt, vn)}</span>
                <span className="text-gray-300 ml-1">({v.geklikt})</span>
              </td>
              <td className="px-5 py-2 text-right text-gray-500">{v.bounced}</td>
            </tr>
          );
        })}
    </>
  );
}

// Eén programma (Even Houvast / Niet Alleen / Overig): kopregel met de cijfers
// van de hele stroom, uitklapbaar naar de losse onderwerpen.
function GroepBlok({ groep, standaardOpen }: { groep: Groep; standaardOpen: boolean }) {
  const [open, setOpen] = useState(standaardOpen);
  const g = groep.totaal;
  const n = g.afgeleverd || g.verzonden;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900">{groep.titel}</h2>
          <p className="text-xs text-gray-400">
            {groep.stromen.length} {groep.stromen.length === 1 ? "onderwerp" : "onderwerpen"}
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm shrink-0">
          <div className="text-right">
            <p className="font-semibold text-gray-900">{g.verzonden}</p>
            <p className="text-xs text-gray-400">verzonden</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{pct(g.geopend, n)}</p>
            <p className="text-xs text-gray-400">open</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{pct(g.geklikt, n)}</p>
            <p className="text-xs text-gray-400">klik</p>
          </div>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-gray-100">
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
              {groep.stromen.map((s) => (
                <StroomRij key={s.onderwerp} stroom={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
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
          {/* KPI's — per thema gegroepeerd, twee onder elkaar per kolom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-3">
              <KpiKaart icon={Send} label="Verzonden" waarde={String(t!.verzonden)} kleur="#6d84a8" />
              <KpiKaart
                icon={CheckCircle2}
                label="Afgeleverd"
                waarde={String(t!.afgeleverd)}
                sub={`${pct(t!.afgeleverd, t!.verzonden)} van verzonden`}
                kleur="#16a34a"
              />
            </div>
            <div className="flex flex-col gap-3">
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
            </div>
            <div className="flex flex-col gap-3">
              <KpiKaart
                icon={AlertTriangle}
                label="Bounces"
                waarde={String(t!.bounced)}
                sub={pct(t!.bounced, t!.verzonden)}
                kleur="#f59e0b"
              />
              <KpiKaart
                icon={AlertTriangle}
                label="Spam"
                waarde={String(t!.klachten)}
                sub="spam-meldingen"
                kleur="#ef4444"
              />
            </div>
          </div>

          {/* Per programma, met de onderwerpen erin */}
          <div className="space-y-3">
            {stats.groepen.map((g) => (
              <GroepBlok key={g.groep} groep={g} standaardOpen={g.groep === "evenHouvast"} />
            ))}
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Heb je een onderwerpregel gewijzigd, dan staat de mail onder zijn huidige titel
            met het totaal van alle titels samen. Klap de regel uit om per titel de open-rate
            en klik-ratio te vergelijken.{" "}
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

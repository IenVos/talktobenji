"use client";

import { useState } from "react";
import { Mail, Eye, MousePointerClick, AlertTriangle, Send, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";
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

// Een variant is dezelfde mail voor een ander verliestype, of onder een eerdere
// onderwerpregel. Het verliestype is alleen bekend bij mails die verstuurd zijn
// nadat we dat label meesturen.
type Variant = Cijfers & { verliestype?: string };

type Stroom = Cijfers & {
  stroomId: string;
  varianten: Variant[];
  // Waar de ontvangers op klikten (bv. "Het boekje", "Checkout (niet-alleen)").
  links: { label: string; aantal: number }[];
};

type Groep = {
  groep: "evenHouvast" | "benji" | "nietAlleen" | "evergreen" | "losseMail" | "overig";
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

// Eén mail (bijv. opvolgmail 3). De uitklap toont per verliestype en per
// onderwerpregel hoe die het deed, zodat je titels en types kunt vergelijken.
function StroomRij({ stroom }: { stroom: Stroom }) {
  const [open, setOpen] = useState(false);
  const heeftVarianten = stroom.varianten.length > 1 || stroom.links.length > 0;
  const n = stroom.afgeleverd || stroom.verzonden;
  const aantalTitels = new Set(stroom.varianten.map((v) => v.onderwerp)).size;

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50 ${heeftVarianten ? "cursor-pointer" : ""}`}
        onClick={heeftVarianten ? () => setOpen((o) => !o) : undefined}
      >
        <td className="px-5 py-2.5 text-gray-700 max-w-sm" title={stroom.onderwerp}>
          <div className="flex items-center gap-1.5">
            {heeftVarianten && (
              <ChevronDown
                size={14}
                className={`text-gray-400 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
              />
            )}
            <span className="truncate">{stroom.onderwerp}</span>
            {aantalTitels > 1 && (
              <span className="shrink-0 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                {aantalTitels} titels
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{stroom.verzonden}</td>
        <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{stroom.afgeleverd}</td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
          <span className="text-gray-900 font-medium">{pct(stroom.geopend, n)}</span>
          <span className="inline-block w-12 text-right text-gray-300 text-xs">({stroom.geopend})</span>
        </td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
          <span className="text-gray-900 font-medium">{pct(stroom.geklikt, n)}</span>
          <span className="inline-block w-11 text-right text-gray-300 text-xs">({stroom.geklikt})</span>
        </td>
        <td className="px-5 py-2.5 text-right text-gray-500 tabular-nums">{stroom.bounced}</td>
      </tr>

      {/* Waar klikten ze op? Zo zie je of de link naar Niet Alleen leeft. */}
      {open && stroom.links.length > 0 && (
        <tr className="border-b border-gray-50 bg-gray-50/60 text-xs">
          <td colSpan={6} className="px-5 py-2 pl-11">
            <span className="text-[11px] text-gray-400 mr-2">Geklikt op:</span>
            {stroom.links.map((l) => (
              <span
                key={l.label}
                className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600"
              >
                {l.label} <span className="font-semibold text-gray-800">{l.aantal}×</span>
              </span>
            ))}
          </td>
        </tr>
      )}

      {open &&
        stroom.varianten.length > 1 &&
        stroom.varianten.map((v) => {
          const vn = v.afgeleverd || v.verzonden;
          return (
            <tr
              key={`${v.verliestype ?? ""}|${v.onderwerp}`}
              className="border-b border-gray-50 bg-gray-50/60 text-xs"
            >
              <td className="px-5 py-2 pl-11 text-gray-500 max-w-sm" title={v.onderwerp}>
                <span className="block truncate">{v.onderwerp}</span>
                <span className="text-[11px] text-gray-400">
                  {v.verliestype ? v.verliestype.replace(/_/g, " ") : "verliestype onbekend"}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{v.verzonden}</td>
              <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{v.afgeleverd}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                <span className="text-gray-700 font-medium">{pct(v.geopend, vn)}</span>
                <span className="inline-block w-12 text-right text-gray-300">({v.geopend})</span>
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                <span className="text-gray-700 font-medium">{pct(v.geklikt, vn)}</span>
                <span className="inline-block w-11 text-right text-gray-300">({v.geklikt})</span>
              </td>
              <td className="px-5 py-2 text-right text-gray-500 tabular-nums">{v.bounced}</td>
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

          {/* Cijfers per mail: één blok per funnel. Klap een funnel open voor de losse
              mails; klap een mail open voor per verliestype én waar er geklikt is. */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cijfers per mail</h2>
              <p className="text-sm text-gray-500">
                Per funnel. Klap een funnel open voor de losse mails, en een mail voor de
                uitsplitsing per verliestype en waar er geklikt is.
              </p>
            </div>
            {stats.groepen.map((g) => (
              <GroepBlok key={g.groep} groep={g} standaardOpen={false} />
            ))}
          </div>

          {/* Wie zit waar in de funnel: aantal actief + verdeling over de dagen. */}
          <FunnelBezetting />

          <p className="text-xs text-gray-400 leading-relaxed">
            Elke opvolgmail staat één keer in de lijst, met het totaal over alle verliestypen.
            Klap een regel uit om per verliestype en per onderwerpregel de open-rate en
            klik-ratio te vergelijken (zo zie je bijv. scheiding-leads los van huisdier).
            Het verliestype is alleen bekend van mails die vanaf 13 juli 2026 zijn verstuurd;
            oudere mails staan als "verliestype onbekend". Open-rate en klik-ratio zijn
            berekend t.o.v. het aantal afgeleverde mails. Open-rate is een indicatie: sommige
            mailprogramma's laden de meet-pixel niet, waardoor het werkelijke aantal hoger kan
            liggen. Periode: laatste {stats.dagen} dagen.
          </p>
        </>
      )}

      <Sluimerend />
    </div>
  );
}

type Contact = { email: string; naam: string | null; sent: number; laatsteOpen: number | null };
type SluimerData = {
  drempelDagen: number;
  totaalGemaild: number;
  nooit: { aantal: number; lijst: Contact[] };
  gestopt: { aantal: number; lijst: Contact[] };
};

function ContactLijst({ lijst }: { lijst: Contact[] }) {
  const laatsteOpenLabel = (ms: number | null) =>
    ms ? new Date(ms).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "nooit";
  if (lijst.length === 0) return <p className="text-sm text-gray-400 p-3">Niemand in deze lijst. Mooi.</p>;
  return (
    <div className="max-h-[320px] overflow-y-auto rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50">
          <tr className="text-left text-gray-500">
            <th className="py-2 px-3 font-medium">Naam / e-mail</th>
            <th className="py-2 px-3 font-medium">Gemaild</th>
            <th className="py-2 px-3 font-medium">Laatst geopend</th>
          </tr>
        </thead>
        <tbody>
          {lijst.map((c) => (
            <tr key={c.email} className="border-t border-gray-50">
              <td className="py-2 px-3">
                <p className="text-gray-900">{c.naam || "—"}</p>
                <p className="text-xs text-gray-400">{c.email}</p>
              </td>
              <td className="py-2 px-3 text-gray-600">{c.sent}x</td>
              <td className="py-2 px-3 text-gray-600">{laatsteOpenLabel(c.laatsteOpen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sluimerend() {
  const data = useAdminQuery(api.emailStats.sluimerendeContacten, {}) as SluimerData | undefined;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"nooit" | "gestopt">("nooit");

  const totaalNietOpen = data ? data.nooit.aantal + data.gestopt.aantal : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800">
        <span>Contacten die niet openen {data ? `(${totaalNietOpen})` : ""}</span>
        <span className="text-gray-400">{open ? "▾" : "▸"}</span>
      </button>
      {open && data && (
        <div className="border-t border-gray-100 p-5 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{data.totaalGemaild}</p><p className="text-xs text-gray-500">actief gemaild</p></div>
            <div className="rounded-lg bg-red-50 p-3"><p className="text-2xl font-bold text-red-700">{data.nooit.aantal}</p><p className="text-xs text-gray-500">nog nooit geopend</p></div>
            <div className="rounded-lg bg-amber-50 p-3"><p className="text-2xl font-bold text-amber-700">{data.gestopt.aantal}</p><p className="text-xs text-gray-500">opende eerder, nu {data.drempelDagen}+ dagen niet</p></div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
            <p className="font-medium">Twee verschillende groepen, twee aanpakken</p>
            <ul className="text-blue-800 mt-1 list-disc pl-5 space-y-1">
              <li><strong>Nog nooit geopend:</strong> kregen wel mails maar openden er nooit één. Kan wijzen op de spammap of adressen die nooit echt pasten. Stuur ze de her-activatiemail; reageert er niets, dan mag deze groep vrij snel eraf.</li>
              <li><strong>Opende eerder, nu lang niet:</strong> natuurlijk verloop. Hiervoor doe je rustig <strong>2x per jaar</strong> een check: één her-activatiemail, en wie niet reageert schrijf je uit.</li>
            </ul>
            <p className="text-blue-700 text-xs mt-2">
              Beide doe je via Losse mails: kies de bijpassende doelgroep, er staat een voorbeeldtekst klaar.
              Na versturen zie je bij die mail onder Reacties wie reageerde, met één knop om de rest uit te
              schrijven. Let op: open-meting is niet waterdicht; zie het als signaal, niet als bewijs.
            </p>
          </div>

          <Link href="/admin/mailsysteem/losse-mails" className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Naar Losse mails →
          </Link>

          {/* Twee lijsten */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setTab("nooit")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "nooit" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              Nog nooit geopend ({data.nooit.aantal})
            </button>
            <button onClick={() => setTab("gestopt")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "gestopt" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              Opende eerder, nu lang niet ({data.gestopt.aantal})
            </button>
          </div>
          <ContactLijst lijst={tab === "nooit" ? data.nooit.lijst : data.gestopt.lijst} />
        </div>
      )}
    </div>
  );
}

// ── Funnel-bezetting ─────────────────────────────────────────────────────────
// Hoeveel leads zitten er nu in elke funnel, en op welke dag/mail. Zo zie je waar
// mensen "vastzitten" en of een spoor leeg begint te lopen.
type Bucket = { label: string; subject?: string; aantal: number };
type BezettingFunnel = {
  spoor: string;
  titel: string;
  totaal: number;
  actiefInReeks: number;
  aantalMails: number;
  status: Record<string, number>;
  buckets: Bucket[];
};

const STATUS_LABEL: Record<string, string> = {
  "in-backend": "in de reeks",
  "alleen-maandmail": "alleen maandmail",
  koper: "koper",
  afgemeld: "afgemeld",
};

function FunnelBezetting() {
  const data = useAdminQuery(api.evergreen.funnelBezetting, {}) as BezettingFunnel[] | undefined;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Funnel-bezetting</h2>
        <p className="text-sm text-gray-500">
          Hoeveel mensen er nu in elke funnel zitten en op welke dag. De dag-verdeling
          geldt voor wie de reeks actief doorloopt.
        </p>
      </div>

      {data === undefined ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">Nog geen leads in een funnel.</p>
      ) : (
        data.map((f) => {
          const maxBucket = Math.max(1, ...f.buckets.map((b) => b.aantal));
          return (
            <div key={f.spoor} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{f.titel}</h3>
                  <p className="text-xs text-gray-400">
                    {f.actiefInReeks} actief in de reeks · {f.totaal} totaal
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {Object.entries(f.status)
                    .sort((a, b) => b[1] - a[1])
                    .map(([st, n]) => (
                      <span
                        key={st}
                        className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5"
                      >
                        {STATUS_LABEL[st] ?? st} <span className="font-semibold text-gray-800">{n}</span>
                      </span>
                    ))}
                </div>
              </div>

              {f.aantalMails === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-3">Deze funnel heeft nog geen actief mailschema.</p>
              ) : f.actiefInReeks === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-3">Niemand loopt op dit moment actief de reeks door.</p>
              ) : (
                <div className="p-3 space-y-1.5">
                  {f.buckets.map((b) => (
                    <div key={b.label} className="flex items-center gap-3 px-2 py-1">
                      <span className="text-sm text-gray-600 w-64 shrink-0">{b.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-400"
                          style={{ width: `${(b.aantal / maxBucket) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums w-8 text-right">{b.aantal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

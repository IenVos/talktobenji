"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Mail, FileHeart, CheckCircle2, XCircle, ShoppingBag, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";

type Lead = {
  email: string;
  naam: string | null;
  verliesType: string | null;
  bron: string | null;
  bronUrl: string | null;
  welkomstAt: number | null;
  briefAt: number | null;
  opvolgmails: { mailNummer: number; sentAt: number }[];
  afgemeld: boolean;
  gekocht: boolean;
  gekochtAt: number | null;
  dagenSindsBrief: number | null;
  laatsteActiviteit: number;
};

// Leesbare labels voor de verliestypen.
const TYPE_LABEL: Record<string, string> = {
  persoon: "Verlies van iemand",
  huisdier: "Verlies van een huisdier",
  scheiding: "Einde van een relatie",
  eenzaamheid: "Eenzaamheid",
  kinderloos: "Ongewenst kinderloos",
};

// Titels van de opvolgmails (zelfde reeks als op de e-mailpagina).
const OPVOLG_TITEL: Record<number, string> = {
  1: "Erkenning",
  2: "Normaliseren",
  3: "Niet Alleen introduceren",
  4: "Verhaal / ervaring",
  5: "Uitnodiging met prijs",
};

function datum(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}
function datumTijd(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Eén stap in de tijdlijn.
function Stap({
  klaar,
  titel,
  detail,
  kleur = "primary",
}: {
  klaar: boolean;
  titel: string;
  detail?: string;
  kleur?: "primary" | "green" | "gray";
}) {
  const dot =
    !klaar
      ? "bg-white border-gray-300"
      : kleur === "green"
        ? "bg-green-500 border-green-500"
        : kleur === "gray"
          ? "bg-gray-400 border-gray-400"
          : "bg-primary-500 border-primary-500";
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-3 h-3 rounded-full border-2 flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0 -mt-0.5">
        <p className={`text-sm ${klaar ? "text-gray-800 font-medium" : "text-gray-400"}`}>{titel}</p>
        {detail && <p className="text-xs text-gray-400 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function LeadCard({ lead, onVerwijder }: { lead: Lead; onVerwijder: (email: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);

  const verwijder = async () => {
    if (!window.confirm(`Lead ${lead.naam || lead.email} verwijderen uit het overzicht? Dit kan niet ongedaan worden gemaakt.`)) return;
    setVerwijderen(true);
    try {
      await onVerwijder(lead.email);
    } catch {
      setVerwijderen(false);
    }
  };

  const status: { label: string; cls: string } = lead.gekocht
    ? { label: "Kocht Niet Alleen", cls: "bg-green-50 text-green-700 border-green-200" }
    : lead.afgemeld
      ? { label: "Afgemeld", cls: "bg-gray-100 text-gray-500 border-gray-200" }
      : lead.briefAt
        ? { label: "In opvolgreeks", cls: "bg-primary-50 text-primary-600 border-primary-200" }
        : { label: "Nog niet voltooid", cls: "bg-amber-50 text-amber-700 border-amber-200" };

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {open ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {lead.naam || lead.email}
              {lead.naam && <span className="font-normal text-gray-400 ml-2">{lead.email}</span>}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {lead.verliesType ? TYPE_LABEL[lead.verliesType] || lead.verliesType : "Type onbekend"}
              {lead.briefAt && <> · brief op {datum(lead.briefAt)}</>}
              {lead.bron && <> · via {lead.bron}</>}
            </p>
          </div>
          <span className={`flex-shrink-0 text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${status.cls}`}>
            {status.label}
          </span>
        </button>
        <button
          type="button"
          onClick={verwijder}
          disabled={verwijderen}
          title="Lead verwijderen"
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          {/* Tijdlijn */}
          <div className="space-y-2.5 pt-3">
            <Stap
              klaar={!!lead.welkomstAt}
              titel="Aangemeld (welkomstmail verstuurd)"
              detail={
                lead.welkomstAt
                  ? `Via de e-maillink op ${datumTijd(lead.welkomstAt)}`
                  : "Binnengekomen via een landingspagina (geen aparte welkomstmail)"
              }
            />
            <Stap
              klaar={!!lead.briefAt}
              titel={lead.briefAt ? "Alle momenten ingevuld + brief verstuurd" : "Momenten nog niet afgerond"}
              detail={
                lead.briefAt
                  ? `Persoonlijke brief verstuurd op ${datumTijd(lead.briefAt)}`
                  : "Heeft nog geen brief aangevraagd; de momenten zijn nog niet allemaal ingevuld"
              }
            />

            {/* Opvolgmails 1..5 */}
            {[1, 2, 3, 4, 5].map((n) => {
              const m = lead.opvolgmails.find((o) => o.mailNummer === n);
              return (
                <Stap
                  key={n}
                  klaar={!!m}
                  titel={`Opvolgmail ${n} — ${OPVOLG_TITEL[n]}`}
                  detail={m ? `Verstuurd op ${datumTijd(m.sentAt)}` : undefined}
                />
              );
            })}

            {lead.afgemeld && (
              <Stap klaar titel="Afgemeld voor opvolgmails" kleur="gray" />
            )}
            {lead.gekocht && (
              <Stap
                klaar
                titel="Kocht Niet Alleen"
                kleur="green"
                detail={lead.gekochtAt ? `Gestart op ${datum(lead.gekochtAt)}` : undefined}
              />
            )}
          </div>

          {lead.bron && (
            <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2">
              <span className="font-medium text-gray-600">Herkomst:</span> {lead.bron}
              {lead.bronUrl && (
                <a
                  href={lead.bronUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-400 hover:text-primary-600 truncate"
                  title={lead.bronUrl}
                >
                  {lead.bronUrl}
                </a>
              )}
            </div>
          )}

          <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-2">
            De woorden die bij de momenten zijn opgeschreven worden niet bewaard (privacy). Een verstuurde brief
            betekent dat alle momenten waren ingevuld.
          </p>
        </div>
      )}
    </div>
  );
}

export default function EvenHouvastLeadsPage() {
  const leads = useAdminQuery(api.houvast.leadsVoortgang, {}) as Lead[] | undefined;
  const verwijderLead = useAdminMutation(api.houvast.verwijderLead);
  const [filter, setFilter] = useState<"alle" | "voltooid" | "onvoltooid" | "gekocht">("alle");

  const onVerwijder = async (email: string) => {
    await verwijderLead({ email });
  };

  const totaal = leads?.length ?? 0;
  const metBrief = leads?.filter((l) => l.briefAt).length ?? 0;
  const gekocht = leads?.filter((l) => l.gekocht).length ?? 0;
  const afgemeld = leads?.filter((l) => l.afgemeld && !l.gekocht).length ?? 0;

  const zichtbaar = (leads ?? []).filter((l) => {
    if (filter === "voltooid") return !!l.briefAt;
    if (filter === "onvoltooid") return !l.briefAt;
    if (filter === "gekocht") return l.gekocht;
    return true;
  });

  const filterKnop = (key: typeof filter, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
        filter === key ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Even Houvast leads</h1>
        <p className="text-sm text-gray-500 mt-1">
          De voortgang van iedereen die met Even Houvast bezig is. Klap een lead open voor de volledige tijdlijn:
          aangemeld, momenten ingevuld, brief verstuurd en de opvolgmails. Deze mensen hebben (nog) geen account.
        </p>
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white border border-gray-200 p-3 flex items-center gap-3">
          <Mail size={18} className="text-gray-400 flex-shrink-0" />
          <div><p className="text-xl font-bold text-gray-900">{totaal}</p><p className="text-xs text-gray-500">leads</p></div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-3 flex items-center gap-3">
          <FileHeart size={18} className="text-primary-400 flex-shrink-0" />
          <div><p className="text-xl font-bold text-gray-900">{metBrief}</p><p className="text-xs text-gray-500">brief verstuurd</p></div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-3 flex items-center gap-3">
          <ShoppingBag size={18} className="text-green-500 flex-shrink-0" />
          <div><p className="text-xl font-bold text-gray-900">{gekocht}</p><p className="text-xs text-gray-500">kocht Niet Alleen</p></div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-3 flex items-center gap-3">
          <XCircle size={18} className="text-gray-300 flex-shrink-0" />
          <div><p className="text-xl font-bold text-gray-900">{afgemeld}</p><p className="text-xs text-gray-500">afgemeld</p></div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filterKnop("alle", `Alle (${totaal})`)}
        {filterKnop("voltooid", `Brief verstuurd (${metBrief})`)}
        {filterKnop("onvoltooid", `Nog niet voltooid (${totaal - metBrief})`)}
        {filterKnop("gekocht", `Kocht Niet Alleen (${gekocht})`)}
      </div>

      {/* Lijst */}
      {leads === undefined ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600" />
        </div>
      ) : zichtbaar.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400 flex flex-col items-center gap-2">
          <CheckCircle2 size={26} className="text-gray-300" />
          {totaal === 0 ? "Nog geen Even Houvast leads." : "Geen leads in dit filter."}
        </div>
      ) : (
        <div className="space-y-2">
          {zichtbaar.map((lead) => (
            <LeadCard key={lead.email} lead={lead} onVerwijder={onVerwijder} />
          ))}
        </div>
      )}
    </div>
  );
}

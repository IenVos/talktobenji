"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import {
  Search, Users, CreditCard, KeyRound, MessageSquare,
  Palette, BookHeart, CheckCircle, AlertCircle, ChevronDown, AtSign, HelpCircle, ArrowRight,
  Mail, RotateCcw, Send, Package,
} from "lucide-react";
import { useAction } from "convex/react";
import Link from "next/link";

const SUB_LABELS: Record<string, string> = {
  free: "Gratis",
  trial: "Proefperiode (7 dagen)",
  uitgebreid: "Uitgebreid",
  alles_in_1: "Alles-in-1",
};

const SUB_OPTIONS = [
  { value: "free", label: "Gratis" },
  { value: "trial", label: "Proefperiode (reset naar 7 dagen)" },
  { value: "uitgebreid", label: "Uitgebreid" },
  { value: "alles_in_1", label: "Alles-in-1" },
] as const;

type ActionState = { type: "success" | "error"; message: string } | null;

function ActionRow({
  label,
  description,
  icon: Icon,
  buttonLabel,
  onAction,
  confirmText,
  danger,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  buttonLabel: string;
  onAction: () => Promise<void>;
  confirmText?: string;
  danger?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ActionState>(null);

  const handle = async () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setLoading(true);
    setState(null);
    try {
      await onAction();
      setState({ type: "success", message: "Gelukt" });
      setTimeout(() => setState(null), 4000);
    } catch (err: any) {
      setState({ type: "error", message: err.message || "Mislukt" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {state && (
          <span className={`flex items-center gap-1 text-xs font-medium ${state.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {state.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            {state.message}
          </span>
        )}
        <button
          onClick={handle}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            danger
              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              : "bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200"
          }`}
        >
          {loading ? "Bezig..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default function KlantbeheerPage() {
  const suggestions = useAdminQuery(api.supportFaq.listSuggestions, {}) as { _id: string; question: string; createdAt: number }[] | undefined;
  const [searchInput, setSearchInput] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [newSubType, setNewSubType] = useState<"free" | "trial" | "uitgebreid" | "alles_in_1">("uitgebreid");
  const [subSaving, setSubSaving] = useState(false);
  const [subState, setSubState] = useState<ActionState>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailState, setEmailState] = useState<ActionState>(null);

  const customer = useAdminQuery(
    api.klantbeheer.getCustomerByEmail,
    activeEmail ? { email: activeEmail } : "skip"
  );

  const changeEmail = useAdminMutation(api.klantbeheer.changeCustomerEmail);
  const setSubscription = useAdminMutation(api.klantbeheer.setCustomerSubscription);
  const resetUsage = useAdminMutation(api.klantbeheer.resetConversationUsage);
  const resetPrefs = useAdminMutation(api.klantbeheer.resetCustomerPreferences);
  const clearContext = useAdminMutation(api.klantbeheer.clearCustomerContext);
  const resetNietAlleenDag = useAdminMutation(api.klantbeheer.resetNietAlleenDag);
  const stuurDagNu = useAction(api.klantbeheer.stuurDagNuAdmin);

  const [hervatDag, setHervatDag] = useState(1);
  const [stuurDag, setStuurDag] = useState(1);
  const [naActie, setNaActie] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveEmail(searchInput.trim().toLowerCase());
    setSubState(null);
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailState(null);
    try {
      await changeEmail({ currentEmail: activeEmail, newEmail: newEmail.trim() });
      setEmailState({ type: "success", message: `E-mailadres gewijzigd naar ${newEmail.trim().toLowerCase()}` });
      setActiveEmail(newEmail.trim().toLowerCase());
      setSearchInput(newEmail.trim().toLowerCase());
      setNewEmail("");
    } catch (err: any) {
      setEmailState({ type: "error", message: err.message || "Mislukt" });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSetSubscription = async () => {
    setSubSaving(true);
    setSubState(null);
    try {
      await setSubscription({ email: activeEmail, subscriptionType: newSubType });
      setSubState({ type: "success", message: `Abonnement gewijzigd naar ${SUB_LABELS[newSubType]}` });
      setTimeout(() => setSubState(null), 5000);
    } catch (err: any) {
      setSubState({ type: "error", message: err.message || "Mislukt" });
    } finally {
      setSubSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: activeEmail }),
    });
    if (!res.ok) throw new Error("E-mail kon niet worden verstuurd");
  };

  const sub = customer?.subscription;
  const subType = sub?.subscriptionType ?? "free";
  const hasAccount = customer?.userId != null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={22} className="text-primary-600" />
          Klantbeheer
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Zoek een klant op e-mailadres en beheer hun account
        </p>
      </div>

      {/* Support FAQ kaartje */}
      <Link
        href="/admin/support-faq"
        className="flex items-center justify-between gap-4 bg-white rounded-xl border border-primary-200 shadow-sm px-5 py-4 hover:bg-primary-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Support FAQ</p>
            <p className="text-xs text-gray-500">Beheer veelgestelde vragen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {suggestions && suggestions.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
              {suggestions.length} nieuwe {suggestions.length === 1 ? "suggestie" : "suggesties"}
            </span>
          )}
          <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-600 transition-colors" />
        </div>
      </Link>

      {/* Zoekbalk */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="klant@email.com"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Search size={15} />
          Zoeken
        </button>
      </form>

      {/* Niet gevonden */}
      {activeEmail && customer === null && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Geen account gevonden voor <strong>{activeEmail}</strong>
        </div>
      )}

      {/* Klantinfo */}
      {customer && (
        <>
          {/* Info card */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className="bg-primary-50 px-5 py-4 border-b border-primary-100">
              <p className="font-semibold text-primary-900">{customer.name}</p>
              <p className="text-sm text-primary-600">{customer.email}</p>
              {!hasAccount && (
                <span className="inline-block mt-1 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                  Geen TalkToBenji account — alleen Niet Alleen klant
                </span>
              )}
            </div>
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
              {hasAccount && <div>
                <p className="text-xs text-gray-500 mb-0.5">Abonnement</p>
                <p className="font-medium text-gray-800">{SUB_LABELS[subType] ?? subType}</p>
              </div>}
              {sub?.expiresAt && subType === "trial" && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Trial verloopt</p>
                  <p className="font-medium text-gray-800">
                    {new Date(sub.expiresAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Gesprekken deze maand</p>
                <p className="font-medium text-gray-800">{customer.counts.conversationsThisMonth}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Notities</p>
                <p className="font-medium text-gray-800">{customer.counts.notes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Doelen</p>
                <p className="font-medium text-gray-800">{customer.counts.goals}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Herinneringen</p>
                <p className="font-medium text-gray-800">{customer.counts.memories}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Check-ins</p>
                <p className="font-medium text-gray-800">{customer.counts.checkIns}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Accentkleur</p>
                <p className="font-medium text-gray-800">{customer.preferences.hasAccentColor ? "Ingesteld" : "Standaard"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Achtergrond</p>
                <p className="font-medium text-gray-800">{customer.preferences.hasBackground ? "Ingesteld" : "Geen"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Jouw verhaal</p>
                <p className="font-medium text-gray-800">{customer.preferences.hasUserContext ? "Aanwezig" : "Leeg"}</p>
              </div>
            </div>
          </div>

          {/* Producten */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-800">Aangeschafte producten</h2>
            </div>
            {customer.producten.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Geen betaalde producten</p>
            ) : (
              <div className="space-y-2">
                {customer.producten.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.naam}</p>
                      <p className="text-xs text-gray-400">
                        {p.type === "abonnement" ? "Abonnement" : "Programma"} · sinds {new Date(p.since).toLocaleDateString("nl-NL")}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${p.type === "abonnement" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                      {p.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Niet Alleen voortgang */}
          {customer.nietAlleen && (
            <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary-600" />
                <h2 className="text-sm font-semibold text-gray-800">Niet Alleen — e-mailprogramma</h2>
                {!customer.nietAlleen.actief && (
                  <span className="text-[10px] font-semibold bg-red-100 text-red-600 rounded-full px-2 py-0.5">gesloten</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Huidige dag</p>
                  <p className="font-semibold text-gray-900">Dag {customer.nietAlleen.dagNummer} van 30</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Verliestype</p>
                  <p className="font-medium text-gray-800 capitalize">{customer.nietAlleen.verliesType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Gestart op</p>
                  <p className="font-medium text-gray-800">{new Date(customer.nietAlleen.startDatum).toLocaleDateString("nl-NL")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Dagen ingevuld</p>
                  <p className="font-medium text-gray-800">{customer.nietAlleen.dagenIngevuld} / 30</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Dag 28 mail</p>
                  <p className={`font-medium ${customer.nietAlleen.dag28Verzonden ? "text-green-600" : "text-gray-400"}`}>
                    {customer.nietAlleen.dag28Verzonden ? "✓ verstuurd" : "nog niet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Dag 30 mail</p>
                  <p className={`font-medium ${customer.nietAlleen.dag30Verzonden ? "text-green-600" : "text-gray-400"}`}>
                    {customer.nietAlleen.dag30Verzonden ? "✓ verstuurd" : "nog niet"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600">Bijsturen</p>

                {/* Hervat vanaf dag X */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 flex-shrink-0">Hervat vanaf dag</span>
                  <input
                    type="number"
                    min={1} max={30}
                    value={hervatDag}
                    onChange={e => setHervatDag(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <ActionRow
                    label=""
                    description=""
                    icon={RotateCcw}
                    buttonLabel="Instellen"
                    confirmText={`Startdatum aanpassen zodat dag ${hervatDag} vandaag is? De cron stuurt morgenochtend dag ${hervatDag + 1}.`}
                    onAction={async () => {
                      await resetNietAlleenDag({ email: activeEmail, hervatVanafDag: hervatDag });
                      setNaActie(`Programma hervat — dag ${hervatDag} is nu vandaag.`);
                      setTimeout(() => setNaActie(null), 5000);
                    }}
                  />
                </div>

                {/* Stuur dag X nu */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 flex-shrink-0">Stuur dag</span>
                  <input
                    type="number"
                    min={1} max={30}
                    value={stuurDag}
                    onChange={e => setStuurDag(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <span className="text-xs text-gray-600 flex-shrink-0">nu</span>
                  <ActionRow
                    label=""
                    description=""
                    icon={Send}
                    buttonLabel="Versturen"
                    confirmText={`Dag ${stuurDag} direct nu versturen naar ${activeEmail}?`}
                    onAction={async () => {
                      await stuurDagNu({ email: activeEmail, dag: stuurDag });
                      setNaActie(`Dag ${stuurDag} verstuurd naar ${activeEmail}.`);
                      setTimeout(() => setNaActie(null), 5000);
                    }}
                  />
                </div>

                {naActie && (
                  <p className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle size={13} /> {naActie}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* E-mailadres wijzigen — alleen voor klanten met TTB account */}
          {hasAccount && <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <AtSign size={16} className="text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-800">E-mailadres wijzigen</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nieuw@emailadres.nl"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleChangeEmail}
                disabled={emailSaving || !newEmail.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {emailSaving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
            {emailState && (
              <p className={`flex items-center gap-1 text-xs font-medium ${emailState.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {emailState.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                {emailState.message}
              </p>
            )}
          </div>}

          {/* Abonnement wijzigen — alleen voor klanten met TTB account */}
          {hasAccount && <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-800">Abonnement wijzigen</h2>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={newSubType}
                  onChange={(e) => setNewSubType(e.target.value as typeof newSubType)}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white pr-8"
                >
                  {SUB_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleSetSubscription}
                disabled={subSaving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {subSaving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
            {subState && (
              <p className={`flex items-center gap-1 text-xs font-medium ${subState.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {subState.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                {subState.message}
              </p>
            )}
          </div>}

          {/* Overige acties — alleen voor klanten met TTB account */}
          {hasAccount && <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Acties</h2>
            <p className="text-xs text-gray-500 mb-4">Gesprekken, doelen en notities worden nooit gewist</p>

            <ActionRow
              label="Wachtwoord reset sturen"
              description="Stuurt een e-mail waarmee de klant een nieuw wachtwoord kan instellen"
              icon={KeyRound}
              buttonLabel="Stuur e-mail"
              onAction={handlePasswordReset}
            />
            <ActionRow
              label="Gesprekslimiet resetten"
              description="Zet de gespreksteller van deze maand terug naar 0 (free tier)"
              icon={MessageSquare}
              buttonLabel="Reset"
              onAction={() => resetUsage({ email: activeEmail })}
            />
            <ActionRow
              label="Kleuren & achtergrond resetten"
              description="Verwijdert accentkleur en achtergrondafbeelding — 'Jouw verhaal' blijft staan"
              icon={Palette}
              buttonLabel="Reset"
              onAction={() => resetPrefs({ email: activeEmail })}
            />
            <ActionRow
              label="'Jouw verhaal' wissen"
              description="Verwijdert de persoonlijke achtergrondtekst die de klant heeft ingevuld"
              icon={BookHeart}
              buttonLabel="Wissen"
              danger
              confirmText={`Weet je zeker dat je 'Jouw verhaal' van ${activeEmail} wilt wissen? Dit kan niet ongedaan worden gemaakt.`}
              onAction={() => clearContext({ email: activeEmail })}
            />
          </div>}
        </>
      )}
    </div>
  );
}

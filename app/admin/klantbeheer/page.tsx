"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import {
  Search, Users, CreditCard, KeyRound, MessageSquare,
  Palette, BookHeart, CheckCircle, AlertCircle, ChevronDown, AtSign,
} from "lucide-react";

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
            </div>
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Abonnement</p>
                <p className="font-medium text-gray-800">{SUB_LABELS[subType] ?? subType}</p>
              </div>
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

          {/* E-mailadres wijzigen */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-4">
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
          </div>

          {/* Abonnement wijzigen */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-4">
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
          </div>

          {/* Overige acties */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5">
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
          </div>
        </>
      )}
    </div>
  );
}

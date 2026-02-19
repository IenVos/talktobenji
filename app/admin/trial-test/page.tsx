"use client";

import { useState } from "react";
import { useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { FlaskConical, Mail, Clock, AlertTriangle, CheckCircle, Play, Star, Sparkles } from "lucide-react";

const STATES = [
  {
    key: "fresh",
    label: "Nieuw (7 dagen)",
    description: "Zet trial terug naar dag 1 — banner toont 7 dagen",
    color: "bg-green-50 border-green-200 text-green-800",
    btnColor: "bg-green-600 hover:bg-green-700",
    icon: CheckCircle,
  },
  {
    key: "day5",
    label: "Dag 5 (2 dagen over)",
    description: "Triggert de eerste reminder-mail bij 'Verwerk'",
    color: "bg-amber-50 border-amber-200 text-amber-800",
    btnColor: "bg-amber-500 hover:bg-amber-600",
    icon: Mail,
  },
  {
    key: "day7",
    label: "Laatste dag (dag 7)",
    description: "Triggert de tweede reminder-mail bij 'Verwerk'",
    color: "bg-orange-50 border-orange-200 text-orange-800",
    btnColor: "bg-orange-500 hover:bg-orange-600",
    icon: Clock,
  },
  {
    key: "expired",
    label: "Verlopen",
    description: "Reset bij 'Verwerk' naar free — accentkleur weg, popup zichtbaar",
    color: "bg-red-50 border-red-200 text-red-800",
    btnColor: "bg-red-600 hover:bg-red-700",
    icon: AlertTriangle,
  },
] as const;

export default function TrialTestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const setTrialState = useAdminMutation(api.trials.setTrialStateForTesting);
  const processTrials = useAdminMutation(api.trials.checkAndProcessTrials);
  const upgradeSubscription = useAdminMutation(api.trials.upgradeSubscriptionForTesting);

  const handleSetState = async (state: typeof STATES[number]["key"]) => {
    if (!email.trim()) {
      setStatus({ type: "error", message: "Vul eerst een e-mailadres in" });
      return;
    }
    setLoading(state);
    setStatus(null);
    try {
      await setTrialState({ email: email.trim(), state });
      setStatus({ type: "success", message: `Trial ingesteld op "${STATES.find(s => s.key === state)?.label}"` });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Mislukt" });
    } finally {
      setLoading(null);
    }
  };

  const handleUpgrade = async (subscriptionType: "uitgebreid" | "alles_in_1") => {
    if (!email.trim()) {
      setStatus({ type: "error", message: "Vul eerst een e-mailadres in" });
      return;
    }
    setLoading(subscriptionType);
    setStatus(null);
    try {
      await upgradeSubscription({ email: email.trim(), subscriptionType });
      const label = subscriptionType === "alles_in_1" ? "Alles-in-1" : "Uitgebreid";
      setStatus({ type: "success", message: `Abonnement ingesteld op "${label}" — open nu de accountpagina om te controleren` });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Mislukt" });
    } finally {
      setLoading(null);
    }
  };

  const handleProcess = async () => {
    setLoading("process");
    setStatus(null);
    try {
      await processTrials({});
      setStatus({ type: "success", message: "Trials verwerkt — controleer je mailbox en het Convex dashboard" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Mislukt" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical size={24} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial testen</h1>
          <p className="text-sm text-gray-500">Stel een trial in op een teststate en verwerk hem direct</p>
        </div>
      </div>

      {/* E-mailadres invoer */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          E-mailadres van het testaccount
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jouw@email.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Stap 1: staat instellen */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Stap 1 — Kies een teststate</p>
        <p className="text-xs text-gray-500">Dit reset ook de reminder-vlaggen zodat mails opnieuw verstuurd worden</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STATES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className={`rounded-xl border p-4 ${s.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} />
                  <span className="font-semibold text-sm">{s.label}</span>
                </div>
                <p className="text-xs mb-3 opacity-80">{s.description}</p>
                <button
                  onClick={() => handleSetState(s.key)}
                  disabled={loading !== null}
                  className={`w-full py-2 rounded-lg text-white text-xs font-semibold transition-colors disabled:opacity-50 ${s.btnColor}`}
                >
                  {loading === s.key ? "Bezig..." : "Instellen"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stap 2: verwerken */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Stap 2 — Verwerk trials</p>
        <p className="text-xs text-gray-500">
          Voert de dagelijkse trial-check uit: stuurt mails en reset verlopen trials naar free
        </p>
        <button
          onClick={handleProcess}
          disabled={loading !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Play size={16} />
          {loading === "process" ? "Bezig..." : "Verwerk trials nu"}
        </button>
      </div>

      {/* Stap 3: upgrade simuleren */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Stap 3 — Simuleer betaald abonnement</p>
        <p className="text-xs text-gray-500">
          Zet het account direct op een betaald abo — trial-velden worden verwijderd. Controleer daarna of gesprekken, reflecties en doelen nog staan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleUpgrade("uitgebreid")}
            disabled={loading !== null}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Star size={16} />
            {loading === "uitgebreid" ? "Bezig..." : "Upgrade naar Uitgebreid"}
          </button>
          <button
            onClick={() => handleUpgrade("alles_in_1")}
            disabled={loading !== null}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} />
            {loading === "alles_in_1" ? "Bezig..." : "Upgrade naar Alles-in-1"}
          </button>
        </div>
      </div>

      {/* Statusmelding */}
      {status && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          status.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {status.message}
        </div>
      )}

      {/* Werkinstructies */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hoe te testen</p>
        <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
          <li>Vul het e-mailadres van je testaccount in</li>
          <li>Kies <strong>Dag 5</strong> → klik <strong>Verwerk</strong> → check mailbox voor eerste mail</li>
          <li>Kies <strong>Laatste dag</strong> → klik <strong>Verwerk</strong> → check mailbox voor tweede mail</li>
          <li>Kies <strong>Verlopen</strong> → klik <strong>Verwerk</strong> → herlaad account-pagina → popup zichtbaar</li>
          <li>Kies <strong>Nieuw</strong> om alles te resetten voor een nieuwe testronde</li>
        </ol>
      </div>
    </div>
  );
}

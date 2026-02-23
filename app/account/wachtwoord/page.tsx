"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KeyRound, Mail, Eye, EyeOff, CheckCircle, ChevronDown, User, CreditCard, Download, Bell, Trash2, AlertTriangle, Smartphone, X, Check, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getPermissionStatus } from "@/lib/pushNotifications";

// Herbruikbaar uitklap-rij component
function AccordionRow({
  icon,
  label,
  currentValue,
  children,
  isOpen,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  currentValue: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
      >
        <span className="text-primary-500 flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
          <p className="text-sm font-medium text-gray-800 truncate">{currentValue}</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-primary-100 bg-primary-50/30 p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function NaamWijzigen({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { data: session, update } = useSession();
  const currentName = session?.user?.name || "";
  const [name, setName] = useState(currentName);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const hasChanged = name.trim() !== currentName && name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanged) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/change-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "Er ging iets mis");
        setStatus("error");
        return;
      }
      await update({ name: name.trim() });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setErrorMsg("Er ging iets mis. Probeer het opnieuw.");
      setStatus("error");
    }
  };

  return (
    <AccordionRow icon={<User size={18} />} label="Naam" currentValue={currentName || "—"} isOpen={isOpen} onToggle={onToggle}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-1">
            Nieuwe naam
          </label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (status === "error") setStatus("idle"); }}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            placeholder="Je voornaam"
            maxLength={100}
            autoComplete="name"
          />
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        {status === "success" && (
          <p className="text-sm text-green-700 flex items-center gap-1.5">
            <CheckCircle size={15} /> Naam opgeslagen
          </p>
        )}
        <button
          type="submit"
          disabled={!hasChanged || status === "loading"}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "Bezig..." : "Opslaan"}
        </button>
      </form>
    </AccordionRow>
  );
}

function EmailWijzigen({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { data: session } = useSession();
  const currentEmail = session?.user?.email || "";
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = newEmail.trim().length > 0 && currentPassword.length > 0 && status !== "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "Er ging iets mis");
        setStatus("error");
        return;
      }
      setStatus("success");
      setNewEmail("");
      setCurrentPassword("");
    } catch {
      setErrorMsg("Er ging iets mis. Probeer het opnieuw.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <AccordionRow icon={<Mail size={18} />} label="E-mailadres" currentValue={currentEmail} isOpen={isOpen} onToggle={onToggle}>
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={18} />
          <span>E-mailadres gewijzigd. Log opnieuw in met je nieuwe adres.</span>
        </div>
      </AccordionRow>
    );
  }

  return (
    <AccordionRow icon={<Mail size={18} />} label="E-mailadres" currentValue={currentEmail} isOpen={isOpen} onToggle={onToggle}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1">
            Nieuw e-mailadres
          </label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); if (status === "error") setStatus("idle"); }}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            placeholder="nieuw@email.nl"
            required
            autoComplete="email"
            disabled={status === "loading"}
          />
        </div>
        <div>
          <label htmlFor="email-password" className="block text-sm font-medium text-gray-700 mb-1">
            Bevestig met je wachtwoord
          </label>
          <div className="relative">
            <input
              id="email-password"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); if (status === "error") setStatus("idle"); }}
              className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              required
              autoComplete="current-password"
              disabled={status === "loading"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "Bezig..." : "E-mailadres wijzigen"}
        </button>
      </form>
    </AccordionRow>
  );
}

function WachtwoordWijzigen({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    status !== "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "Er ging iets mis");
        setStatus("error");
        return;
      }
      setStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMsg("Er ging iets mis. Probeer het opnieuw.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <AccordionRow icon={<KeyRound size={18} />} label="Wachtwoord" currentValue="••••••••" isOpen={isOpen} onToggle={onToggle}>
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={18} />
          <span>Wachtwoord gewijzigd.</span>
        </div>
      </AccordionRow>
    );
  }

  return (
    <AccordionRow icon={<KeyRound size={18} />} label="Wachtwoord" currentValue="••••••••" isOpen={isOpen} onToggle={onToggle}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="current" className="block text-sm font-medium text-gray-700 mb-1">
            Huidig wachtwoord
          </label>
          <div className="relative">
            <input
              id="current"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              required
              autoComplete="current-password"
              disabled={status === "loading"}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="new" className="block text-sm font-medium text-gray-700 mb-1">
            Nieuw wachtwoord
          </label>
          <div className="relative">
            <input
              id="new"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={status === "loading"}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-amber-600 mt-1">Minimaal 8 tekens</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Bevestig nieuw wachtwoord
          </label>
          <input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            required
            autoComplete="new-password"
            disabled={status === "loading"}
          />
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-red-600 mt-1">Wachtwoorden komen niet overeen</p>
          )}
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "Bezig..." : "Wachtwoord wijzigen"}
        </button>
      </form>
    </AccordionRow>
  );
}

function DataExport({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/export-data");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `benji-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export mislukt. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
      >
        <span className="text-primary-500 flex-shrink-0"><Download size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Mijn data</p>
          <p className="text-sm font-medium text-gray-800">Download al mijn gegevens</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-primary-100 bg-primary-50/30 px-4 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Je kunt al je gegevens downloaden als een tekstbestand. Dit bevat je gesprekken, reflecties, doelen, check-ins, memories en persoonlijke instellingen. Handig als je een back-up wilt bewaren of je data wilt inzien.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Download size={16} />
            {loading ? "Bezig met exporteren..." : "Download mijn gegevens"}
          </button>
        </div>
      )}
    </div>
  );
}

function Hartverwarmers({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { data: session } = useSession();
  const userId = session?.userId;
  const isSubscribed = useQuery(api.pushSubscriptions.isSubscribed, userId ? { userId } : "skip");
  const subscribeMutation = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribeMutation = useMutation(api.pushSubscriptions.unsubscribe);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pushSupported = typeof window !== "undefined" && isPushSupported();

  const handleToggle = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        await unsubscribeMutation({ userId });
      } else {
        const subscription = await subscribeToPush();
        if (!subscription) {
          const perm = getPermissionStatus();
          setError(perm === "denied"
            ? "Je hebt notificaties geblokkeerd in je browser. Pas dit aan in je browserinstellingen."
            : "Notificaties konden niet worden ingeschakeld. Probeer het opnieuw."
          );
          return;
        }
        const json = subscription.toJSON();
        await subscribeMutation({ userId, endpoint: json.endpoint!, p256dh: json.keys!.p256dh, auth: json.keys!.auth });
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
      >
        <span className="text-primary-500 flex-shrink-0"><Bell size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Meldingen</p>
          <p className="text-sm font-medium text-gray-800">Hartverwarmers</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-primary-100 bg-primary-50/30 px-4 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Hartverwarmers zijn kleine berichtjes die je helpen je dag goed te beginnen of je herinneren aan doelen die je hebt gesteld. Ze zorgen ervoor dat je belangrijke dingen niet vergeet en houden je gefocust. Hartverwarmers worden spaarzaam verstuurd om je liefde en kracht te geven.
          </p>
          {!pushSupported ? (
            <p className="text-sm text-gray-500 italic">
              Hartverwarmers worden niet ondersteund in deze browser. Installeer de app op je telefoon om hartverwarmers te ontvangen.
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {isSubscribed ? "Hartverwarmers staan aan" : "Hartverwarmers staan uit"}
              </span>
              <button
                type="button"
                onClick={handleToggle}
                disabled={loading || isSubscribed === undefined}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isSubscribed ? "bg-primary-600" : "bg-gray-300"}`}
                role="switch"
                aria-checked={!!isSubscribed}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSubscribed ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

const CANCEL_QUESTIONS = [
  {
    key: "reason",
    vraag: "Waarom stop je?",
    opties: ["Ik gebruik het te weinig", "Het is te duur voor mij", "Het is niet wat ik zocht", "Mijn situatie is veranderd"],
  },
  {
    key: "valuable",
    vraag: "Wat vond je het meest waardevol?",
    opties: ["De gesprekken met Benji", "Reflecties en check-ins", "Inspiratie en handreikingen", "Heb het weinig gebruikt"],
  },
  {
    key: "wouldRecommend",
    vraag: "Zou je Benji aanraden aan iemand die het nodig heeft?",
    opties: ["Ja, zeker", "Misschien", "Nee"],
  },
];

function AbonnementAccordion({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { data: session } = useSession();
  const userId = session?.userId;
  const email = session?.user?.email || undefined;
  const [showCancel, setShowCancel] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cancelDone, setCancelDone] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const cancelOwnSubscription = useMutation(api.subscriptions.cancelOwnSubscription);
  const allAnswered = CANCEL_QUESTIONS.every((q) => answers[q.key]);

  async function handleCancel() {
    if (!userId || !allAnswered) return;
    setCancelling(true);
    try {
      const result = await cancelOwnSubscription({
        userId: userId as string,
        reason: answers.reason,
        valuable: answers.valuable,
        wouldRecommend: answers.wouldRecommend,
      });
      setExpiresAt(result.expiresAt);
      setCancelDone(true);
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    userId ? { userId, email } : "skip"
  );
  const usage = useQuery(
    api.subscriptions.getConversationCount,
    userId ? { userId, email } : "skip"
  );

  const planNames: Record<string, string> = {
    free: "Gratis account",
    trial: "Gratis proefperiode",
    uitgebreid: "Benji Uitgebreid",
    alles_in_1: "Benji Alles in 1",
  };

  const planColors: Record<string, string> = {
    free: "bg-green-50 text-green-700 border-green-200",
    trial: "bg-amber-50 text-amber-700 border-amber-200",
    uitgebreid: "bg-amber-50 text-amber-700 border-amber-200",
    alles_in_1: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const PlanIcon = subscription ? { free: Check, trial: Sparkles, uitgebreid: Sparkles, alles_in_1: Star }[subscription.subscriptionType] : null;

  const currentPlanName = subscription ? (planNames[subscription.subscriptionType] ?? "Onbekend") : "…";

  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
      >
        <span className="text-primary-500 flex-shrink-0"><CreditCard size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Abonnement</p>
          <p className="text-sm font-medium text-gray-800">{currentPlanName}</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && subscription && (
        <div className="border-t border-primary-100 bg-primary-50/30 px-4 py-4 space-y-4">
          {/* Huidig plan badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${planColors[subscription.subscriptionType]}`}>
            {PlanIcon && <PlanIcon size={16} />}
            {planNames[subscription.subscriptionType]}
          </div>

          {/* Gebruiksbalk voor gratis tier */}
          {subscription.subscriptionType === "free" && usage && !usage.hasUnlimited && (
            <div className="p-3 bg-white rounded-lg border border-primary-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Gesprekken deze maand</span>
                <span className="font-medium text-gray-900">{usage.count} / {usage.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usage.count / usage.limit!) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-1.5">
            {subscription.subscriptionType === "free" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={15} className="text-green-600 flex-shrink-0" />
                <span>10 gesprekken per maand</span>
              </div>
            )}
            {subscription.subscriptionType === "trial" && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-primary-600 flex-shrink-0" />
                  <span>Volledige toegang tot alles</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-primary-600 flex-shrink-0" />
                  <span>Nog {subscription.trialDaysLeft ?? 0} {(subscription.trialDaysLeft ?? 0) === 1 ? "dag" : "dagen"} resterend</span>
                </div>
              </>
            )}
            {subscription.subscriptionType === "uitgebreid" && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-primary-600 flex-shrink-0" />
                  <span>Onbeperkte gesprekken</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-primary-600 flex-shrink-0" />
                  <span>Dagelijkse check-ins en doelen</span>
                </div>
              </>
            )}
            {subscription.subscriptionType === "alles_in_1" && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-primary-600 flex-shrink-0" />
                  <span>Alles van Benji Uitgebreid</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-primary-600 flex-shrink-0" />
                  <span>Memories, inspiratie & handreikingen</span>
                </div>
              </>
            )}
          </div>

          {/* Upgrade knop */}
          {subscription.subscriptionType !== "alles_in_1" && (
            <Link
              href="/account/abonnement?upgrade=true"
              className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm font-medium"
            >
              Bekijk upgrade opties
            </Link>
          )}

          {/* Opzegging bevestigd */}
          {cancelDone && expiresAt && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
              <p className="font-medium text-gray-900">Je abonnement is opgezegd.</p>
              <p>Toegang tot en met {new Date(expiresAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}.</p>
            </div>
          )}

          {/* Opzeggen knop */}
          {subscription.subscriptionType !== "free" && subscription.status !== "cancelled" && !cancelDone && (
            <button
              onClick={() => setShowCancel(true)}
              className="block w-full text-center text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Abonnement opzeggen
            </button>
          )}

          {/* Popup */}
          {showCancel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Abonnement opzeggen</h2>
                    <p className="text-sm text-gray-500 mt-1">Help ons te begrijpen waarom.</p>
                  </div>
                  <button
                    onClick={() => { setShowCancel(false); setAnswers({}); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                {CANCEL_QUESTIONS.map((q) => (
                  <div key={q.key}>
                    <p className="text-sm font-medium text-gray-800 mb-2">{q.vraag}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.opties.map((optie) => (
                        <button
                          key={optie}
                          onClick={() => setAnswers((a) => ({ ...a, [q.key]: optie }))}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            answers[q.key] === optie
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary-400"
                          }`}
                        >
                          {optie}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCancel}
                    disabled={!allAnswered || cancelling}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cancelling ? "Bezig…" : "Abo opzeggen"}
                  </button>
                  <button
                    onClick={() => { setShowCancel(false); setAnswers({}); }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors"
                  >
                    Toch niet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppInstalleren({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <div className="border border-primary-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
        >
          <span className="text-primary-500 flex-shrink-0"><Smartphone size={18} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">App</p>
            <p className="text-sm font-medium text-gray-800">TalkToBenji op je telefoon</p>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="border-t border-primary-100 bg-primary-50/30 px-4 py-4 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Wist je dat je TalkToBenji als app op je telefoon kunt zetten? Het werkt net als een gewone app, zonder dat je iets hoeft te downloaden uit de App Store of Play Store. Zo heb je Benji altijd binnen handbereik — één tik en je bent er.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/benji-app-homescreen.png"
              alt="Benji app op je beginscherm"
              className="w-full max-w-sm rounded-xl mx-auto block"
            />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowPopup(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Smartphone size={18} />
                Hoe installeer ik de app?
              </button>
            </div>
          </div>
        )}
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowPopup(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-primary-900">Installeer TalkToBenji</h3>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Sluiten"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">🍎</span>
                  iPhone (Safari)
                </h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Open <strong>talktobenji.nl</strong> in <strong>Safari</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Tik op het <strong>deel-icoon</strong> (vierkantje met pijl omhoog) onderaan het scherm</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Scroll naar beneden en tik op <strong>&quot;Zet op beginscherm&quot;</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <span>Tik op <strong>&quot;Voeg toe&quot;</strong> — klaar!</span>
                  </li>
                </ol>
              </div>
              <hr className="border-gray-100" />
              <div>
                <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">🤖</span>
                  Android (Chrome)
                </h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Open <strong>talktobenji.nl</strong> in <strong>Chrome</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Tik op de <strong>drie puntjes</strong> (⋮) rechtsboven</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Tik op <strong>&quot;Toevoegen aan startscherm&quot;</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <span>Bevestig door op <strong>&quot;Toevoegen&quot;</strong> te tikken — klaar!</span>
                  </li>
                </ol>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Begrepen!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AccountVerwijderen({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { data: session } = useSession();
  const deleteAccountMutation = useMutation(api.deleteAccount.deleteAccount);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");

  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
      >
        <span className="text-primary-500 flex-shrink-0"><Trash2 size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Account</p>
          <p className="text-sm font-medium text-gray-800">Account verwijderen</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-primary-100 bg-primary-50/30 px-4 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Al je gegevens worden permanent gewist — gesprekken, notities, doelen, herinneringen en check-ins. Dit kan niet ongedaan worden gemaakt.
          </p>

          {deleteStep === "idle" && (
            <button
              type="button"
              onClick={() => setDeleteStep("confirm")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 border border-gray-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              Verwijder mijn account
            </button>
          )}

          {deleteStep === "confirm" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Weet je het zeker?</p>
                  <p>Na bevestiging worden de volgende gegevens <strong>definitief gewist</strong>:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                    <li>Alle gesprekken met Benji</li>
                    <li>Reflecties en notities</li>
                    <li>Persoonlijke doelen</li>
                    <li>Dagelijkse check-ins</li>
                    <li>Memories en herinneringen</li>
                    <li>Jouw verhaal en personalisatie</li>
                    <li>Je account en inloggegevens</li>
                  </ul>
                  <p className="text-xs text-gray-500 pt-1">
                    We bewaren geen enkel gegeven na verwijdering. Je e-mailadres wordt volledig verwijderd uit onze systemen.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!session?.userId || !session?.user?.email) return;
                    setDeleteStep("deleting");
                    try {
                      await deleteAccountMutation({
                        userId: session.userId as string,
                        email: session.user.email,
                      });
                      await signOut({ callbackUrl: "/?accountVerwijderd=1" });
                    } catch {
                      setDeleteStep("confirm");
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Ja, verwijder alles definitief
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep("idle")}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}

          {deleteStep === "deleting" && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Bezig met verwijderen...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function InloggegevensPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggle(section: string) {
    setOpenSection((cur) => (cur === section ? null : section));
  }

  return (
    <div className="space-y-3 max-w-md">
      <NaamWijzigen isOpen={openSection === "naam"} onToggle={() => toggle("naam")} />
      <EmailWijzigen isOpen={openSection === "email"} onToggle={() => toggle("email")} />
      <WachtwoordWijzigen isOpen={openSection === "wachtwoord"} onToggle={() => toggle("wachtwoord")} />
      <Hartverwarmers isOpen={openSection === "meldingen"} onToggle={() => toggle("meldingen")} />
      <AppInstalleren isOpen={openSection === "app"} onToggle={() => toggle("app")} />
      <AbonnementAccordion isOpen={openSection === "abonnement"} onToggle={() => toggle("abonnement")} />
      <DataExport isOpen={openSection === "data"} onToggle={() => toggle("data")} />
      <AccountVerwijderen isOpen={openSection === "account"} onToggle={() => toggle("account")} />
    </div>
  );
}

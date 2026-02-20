"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, Mail, Eye, EyeOff, CheckCircle, ChevronDown, ChevronRight, User, CreditCard, Download } from "lucide-react";
import Link from "next/link";

// Herbruikbaar uitklap-rij component
function AccordionRow({
  icon,
  label,
  currentValue,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  currentValue: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-primary-50/50 transition-colors text-left"
      >
        <span className="text-primary-500 flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
          <p className="text-sm font-medium text-gray-800 truncate">{currentValue}</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-primary-100 bg-primary-50/30 p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function NaamWijzigen() {
  const { data: session } = useSession();
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
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setErrorMsg("Er ging iets mis. Probeer het opnieuw.");
      setStatus("error");
    }
  };

  return (
    <AccordionRow icon={<User size={18} />} label="Naam" currentValue={currentName || "—"}>
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

function EmailWijzigen() {
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
      <AccordionRow icon={<Mail size={18} />} label="E-mailadres" currentValue={currentEmail}>
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={18} />
          <span>E-mailadres gewijzigd. Log opnieuw in met je nieuwe adres.</span>
        </div>
      </AccordionRow>
    );
  }

  return (
    <AccordionRow icon={<Mail size={18} />} label="E-mailadres" currentValue={currentEmail}>
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

function WachtwoordWijzigen() {
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
      <AccordionRow icon={<KeyRound size={18} />} label="Wachtwoord" currentValue="••••••••">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={18} />
          <span>Wachtwoord gewijzigd.</span>
        </div>
      </AccordionRow>
    );
  }

  return (
    <AccordionRow icon={<KeyRound size={18} />} label="Wachtwoord" currentValue="••••••••">
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

function DataExport() {
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
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-3 px-4 py-3 bg-white border border-primary-200 rounded-xl hover:bg-primary-50/50 transition-colors w-full text-left disabled:opacity-50"
    >
      <span className="text-primary-500 flex-shrink-0"><Download size={18} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Mijn data</p>
        <p className="text-sm font-medium text-gray-800">{loading ? "Bezig met exporteren..." : "Download al mijn gegevens"}</p>
      </div>
    </button>
  );
}

function AbonnementLink() {
  return (
    <Link
      href="/account/abonnement"
      className="flex items-center gap-3 px-4 py-3 bg-white border border-primary-200 rounded-xl hover:bg-primary-50/50 transition-colors"
    >
      <span className="text-primary-500 flex-shrink-0"><CreditCard size={18} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Abonnement</p>
        <p className="text-sm font-medium text-gray-800">Bekijk je abonnement</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
    </Link>
  );
}

export default function InloggegevensPage() {
  return (
    <div className="space-y-3 max-w-md">
      <NaamWijzigen />
      <EmailWijzigen />
      <WachtwoordWijzigen />
      <AbonnementLink />
      <DataExport />
    </div>
  );
}

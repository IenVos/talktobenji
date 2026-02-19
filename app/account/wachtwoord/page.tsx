"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, Mail, Eye, EyeOff, CheckCircle } from "lucide-react";

function EmailWijzigen() {
  const { data: session } = useSession();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit =
    newEmail.trim().length > 0 &&
    currentPassword.length > 0 &&
    status !== "loading";

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
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 text-center">
        <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
        <h3 className="text-base font-semibold text-primary-900 mb-1">E-mailadres gewijzigd</h3>
        <p className="text-sm text-gray-600 mb-4">
          Log opnieuw in met je nieuwe e-mailadres.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm text-primary-600 hover:underline"
        >
          Nog een keer wijzigen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <Mail size={18} className="text-primary-600" />
        <h3 className="text-base font-semibold text-primary-900">E-mailadres wijzigen</h3>
      </div>

      {session?.user?.email && (
        <p className="text-sm text-gray-500">
          Huidig e-mailadres: <span className="font-medium text-gray-700">{session.user.email}</span>
        </p>
      )}

      <div>
        <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1">
          Nieuw e-mailadres
        </label>
        <input
          id="new-email"
          type="email"
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
            className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
        className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
      >
        {status === "loading" ? "Bezig..." : "E-mailadres wijzigen"}
      </button>
    </form>
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
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 text-center">
        <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
        <h3 className="text-base font-semibold text-primary-900 mb-1">Wachtwoord gewijzigd</h3>
        <p className="text-sm text-gray-600 mb-4">
          Gebruik je nieuwe wachtwoord de volgende keer dat je inlogt.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm text-primary-600 hover:underline"
        >
          Nog een keer wijzigen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <KeyRound size={18} className="text-primary-600" />
        <h3 className="text-base font-semibold text-primary-900">Wachtwoord wijzigen</h3>
      </div>

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
            className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
            className="w-full px-3 py-2 pr-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
        className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
      >
        {status === "loading" ? "Bezig..." : "Wachtwoord wijzigen"}
      </button>
    </form>
  );
}

export default function InloggegevensPage() {
  return (
    <div className="max-w-md space-y-5">
      <EmailWijzigen />
      <WachtwoordWijzigen />
    </div>
  );
}

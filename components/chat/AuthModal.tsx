"use client";

import { useState } from "react";
import { X, LogIn, Loader2, Mail, Lock, User, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";

const MENU_ICON_COLOR = "#5a8a8a";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Na succesvol aanmaken: toon warme welkomst met naam, daarna Doorgaan. */
  const [successName, setSuccessName] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && !name.trim()) {
      setError("Naam is verplicht.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: name.trim(),
          }),
        });
        let data: { error?: string } = {};
        try {
          data = await res.json();
        } catch {
          setError(res.status >= 500 ? "Serverfout. Kijk in de terminal (npm run dev) voor details." : "Registreren mislukt.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(data.error ?? (res.status >= 500 ? "Serverfout. Zie terminal voor details." : "Registreren mislukt."));
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "register"
            ? "Account aangemaakt. Log in met je gegevens."
            : "Ongeldige e-mail of wachtwoord."
        );
        if (mode === "register") {
          setMode("login");
          setPassword("");
        }
        setLoading(false);
        return;
      }

      if (mode === "register" && name.trim()) {
        setSuccessName(name.trim());
        setLoading(false);
        return;
      }

      onClose();
      if (result?.url) window.location.href = result.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  };

  if (successName) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-[#e8eded] flex items-center justify-center mx-auto mb-4">
            <CheckCircle style={{ color: MENU_ICON_COLOR }} size={28} />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">
            Welkom, {successName}!
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Je account is aangemaakt en je gesprekken worden bewaard. Fijn dat je er bent.
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccessName(null);
              onClose();
              window.location.reload();
            }}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[#5a8a8a] text-white hover:bg-[#4a7a7a] transition-colors"
          >
            Doorgaan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Sluiten"
        >
          <X size={20} />
        </button>
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#e8eded] flex items-center justify-center flex-shrink-0">
            <LogIn style={{ color: MENU_ICON_COLOR }} size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {mode === "login" ? "Inloggen" : "Account aanmaken"}
            </h3>
            <p className="text-xs text-gray-500">
              {mode === "login"
                ? "Log in om je gesprekken te bewaren"
                : "Maak een account aan met e-mail en wachtwoord"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="sr-only">
              E-mail
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mailadres"
                required
                autoComplete="email"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5a8a8a] focus:border-[#5a8a8a] outline-none"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label htmlFor="auth-name" className="sr-only">
                Naam
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Je naam"
                  required
                  autoComplete="name"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5a8a8a] focus:border-[#5a8a8a] outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-password" className="sr-only">
              Wachtwoord
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimaal 8 tekens" : "Wachtwoord"}
                required
                minLength={mode === "register" ? 8 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5a8a8a] focus:border-[#5a8a8a] outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-[#5a8a8a] text-white hover:bg-[#4a7a7a] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === "login" ? (
              "Inloggen"
            ) : (
              "Account aanmaken"
            )}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-gray-500">
          {mode === "login" ? (
            <>
              Nog geen account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="text-[#5a8a8a] font-medium hover:underline"
              >
                Account aanmaken
              </button>
            </>
          ) : (
            <>
              Al een account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-[#5a8a8a] font-medium hover:underline"
              >
                Inloggen
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

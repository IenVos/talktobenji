"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function RegistrerenForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/account";

  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Registratie mislukt");
        setLoading(false);
        return;
      }

      // Onthoud naam voor begroeting op loginpagina
      const displayName = name.trim() || email.trim().split("@")[0];
      try { localStorage.setItem("benji_user_name", displayName); } catch {}

      // Sla userId op zodat verificatiepagina opnieuw kan versturen
      try { sessionStorage.setItem("benji_pending_userid", data.userId); } catch {}

      // Stuur verificatie-e-mail
      await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), userId: data.userId }),
      });

      setLoading(false);

      // Redirect naar verificatiepagina
      window.location.href = `/verificeer-email?email=${encodeURIComponent(email.trim().toLowerCase())}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <Image
              src="/images/benji-logo-2.png"
              alt="Benji"
              width={40}
              height={40}
              className="mx-auto object-contain"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          <h1 className="text-xl font-bold text-primary-900 mt-3">Account aanmaken</h1>
          <p className="text-sm text-gray-600 mt-1">
            Maak een account om je gesprekken terug te kijken
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mailadres
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="jouw@email.nl"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Naam <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Je voornaam"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Wachtwoord
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Minimaal 8 tekens"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
              Bevestig wachtwoord
            </label>
            <input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="input"
              placeholder="Herhaal je wachtwoord"
              required
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="h-4 w-4 flex-shrink-0 rounded border-gray-300 accent-green-600"
            />
            <span className="text-sm text-gray-600 leading-snug">
              Ik ga akkoord met de{" "}
              <a href="https://www.talktobenji.com/algemene-voorwaarden" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">Algemene Voorwaarden</a>
              {" "}en het{" "}
              <a href="https://www.talktobenji.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">Privacybeleid</a>.
            </span>
          </label>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full py-3 btn btn-primary rounded-lg disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Account aanmaken"}
          </button>
        </form>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">of</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-3 w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Doorgaan met Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-2.5 leading-relaxed max-w-xs mx-auto">
          Door verder te gaan ga je akkoord met de{" "}
          <a href="https://www.talktobenji.com/algemene-voorwaarden" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 whitespace-nowrap">Algemene Voorwaarden</a>
          {" "}en het{" "}
          <a href="https://www.talktobenji.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 whitespace-nowrap">Privacybeleid</a>.
        </p>

        <p className="text-center text-sm text-gray-600 mt-4">
          Heb je al een account?{" "}
          <Link href="/inloggen" className="text-primary-600 hover:underline font-medium">
            Inloggen
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            Terug naar Benji
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegistrerenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Laden...</div>
      </div>
    }>
      <RegistrerenForm />
    </Suspense>
  );
}

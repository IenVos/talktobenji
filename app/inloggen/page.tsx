"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function InloggenForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/account";
  const registered = searchParams?.get("registered") === "1";
  const verified = searchParams?.get("verified") === "1";
  const errorParam = searchParams?.get("error");
  const emailParam = searchParams?.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    // HTTP → HTTPS in productie
    if (typeof window !== "undefined" && window.location.protocol === "http:" && !window.location.hostname.includes("localhost")) {
      window.location.replace("https://" + window.location.host + window.location.pathname + window.location.search);
    }
    // Haal naam op uit localStorage (gezet bij registratie)
    try {
      const stored = localStorage.getItem("benji_user_name");
      if (stored) setUserName(stored);
    } catch {}
  }, []);

  const sessieVerlopen = searchParams?.get("sessieVerlopen") === "1";
  const sessionExpired = errorParam === "SessionRequired" || errorParam === "SessionExpired";
  const displayError = error || (!sessionExpired && errorParam ? decodeURIComponent(errorParam) : "");

  const handleEmailBlur = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      setEmailExists(data.exists);
    } catch {
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ongeldig e-mailadres of wachtwoord");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Force full page refresh zodat cookie meegestuurd wordt
        window.location.href = callbackUrl;
        return;
      }

      setError("Er ging iets mis. Probeer het opnieuw.");
    } catch (err) {
      console.error("Login error:", err);
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
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
          <h1 className="text-xl font-bold text-primary-900 mt-3">
            {userName ? `Fijn dat je er bent, ${userName}` : "Inloggen"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Log in om je gesprekken terug te kijken
          </p>
        </div>

        {sessionExpired && (
          <p className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4 text-center">
            Je was een tijdje weg. Log opnieuw in om verder te gaan.
          </p>
        )}

        {sessieVerlopen && (
          <p className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4 text-center">
            Je wachtwoord is gewijzigd. Log opnieuw in om door te gaan.
          </p>
        )}

        {registered && (
          <p className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4 text-center">
            Account aangemaakt. Log nu in.
          </p>
        )}

        {verified && (
          <p className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4 text-center">
            E-mail bevestigd. Je kunt nu inloggen.
          </p>
        )}

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
              onChange={(e) => { setEmail(e.target.value); setEmailExists(null); }}
              onBlur={handleEmailBlur}
              className="input"
              placeholder="jouw@email.nl"
              required
              autoComplete="email"
            />
            {checkingEmail && (
              <p className="text-xs text-gray-400 mt-1">Controleren...</p>
            )}
            {!checkingEmail && emailExists === false && email.includes("@") && (
              <p className="text-xs text-amber-600 mt-1">
                Dit e-mailadres kennen we niet — nog geen account?
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Wachtwoord
              </label>
              <Link href="/wachtwoord-vergeten" className="text-xs text-primary-600 hover:underline">
                Wachtwoord vergeten?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Je wachtwoord"
              required
              autoComplete="current-password"
            />
          </div>

          {displayError && (
            <p className="text-red-600 text-sm">{displayError}</p>
          )}

          {emailExists === false && !loading ? (
            <Link
              href={`/registreren?email=${encodeURIComponent(email.trim().toLowerCase())}`}
              className="w-full py-3 btn btn-primary rounded-lg text-center block"
            >
              Account aanmaken
            </Link>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn btn-primary rounded-lg disabled:opacity-50"
            >
              {loading ? "Bezig..." : "Inloggen"}
            </button>
          )}
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
          Inloggen met Google
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Nog geen account?{" "}
          <Link href="/registreren" className="text-primary-600 hover:underline font-medium">
            Account aanmaken
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

export default function InloggenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Laden...</div>
      </div>
    }>
      <InloggenForm />
    </Suspense>
  );
}

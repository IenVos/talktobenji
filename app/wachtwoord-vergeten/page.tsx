"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";

function WachtwoordVergetenForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || "Er ging iets mis");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Er ging iets mis. Probeer het opnieuw.");
      setStatus("error");
    }
  };

  if (status === "success") {
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
            <h1 className="text-xl font-bold text-primary-900 mt-3">E-mail verstuurd</h1>
            <p className="text-sm text-gray-600 mt-1">
              Als dit e-mailadres bij ons bekend is, ontvang je een e-mail met instructies om je wachtwoord te resetten.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6">
            <p className="text-sm text-gray-700 mb-4">
              Controleer je inbox (en eventueel je spam-map). De link in de e-mail is 1 uur geldig.
            </p>
            <Link
              href="/inloggen"
              className="block w-full py-3 btn btn-primary rounded-lg text-center text-sm font-medium"
            >
              Terug naar inloggen
            </Link>
          </div>

          <p className="text-center mt-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              Terug naar Benji
            </Link>
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-primary-900 mt-3">Wachtwoord vergeten</h1>
          <p className="text-sm text-gray-600 mt-1">
            Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten
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
              disabled={status === "loading"}
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 btn btn-primary rounded-lg disabled:opacity-50"
          >
            {status === "loading" ? "Bezig..." : "Verstuur resetlink"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Weet je je wachtwoord weer?{" "}
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

export default function WachtwoordVergetenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Laden...</div>
      </div>
    }>
      <WachtwoordVergetenForm />
    </Suspense>
  );
}

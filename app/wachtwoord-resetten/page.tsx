"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Wachtwoord moet minimaal 8 tekens zijn");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Wachtwoorden komen niet overeen");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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
              <Image src="/images/benji-logo-2.png" alt="Benji" width={40} height={40} className="mx-auto object-contain" style={{ width: "auto", height: "auto" }} />
            </Link>
            <h1 className="text-xl font-bold text-primary-900 mt-3">Wachtwoord gewijzigd</h1>
            <p className="text-sm text-gray-600 mt-1">Je kunt nu inloggen met je nieuwe wachtwoord.</p>
          </div>
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6">
            <Link href="/inloggen" className="block w-full py-3 btn btn-primary rounded-lg text-center text-sm font-medium">
              Inloggen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <p className="text-gray-600">Geen resettoken gevonden.</p>
          <Link href="/wachtwoord-vergeten" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Nieuwe resetlink aanvragen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <Image src="/images/benji-logo-2.png" alt="Benji" width={40} height={40} className="mx-auto object-contain" style={{ width: "auto", height: "auto" }} />
          </Link>
          <h1 className="text-xl font-bold text-primary-900 mt-3">Nieuw wachtwoord instellen</h1>
          <p className="text-sm text-gray-600 mt-1">Kies een nieuw wachtwoord voor je account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nieuw wachtwoord
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
              disabled={status === "loading"}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Herhaal wachtwoord
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Herhaal je wachtwoord"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={status === "loading"}
            />
          </div>

          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 btn btn-primary rounded-lg disabled:opacity-50"
          >
            {status === "loading" ? "Bezig..." : "Wachtwoord opslaan"}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            Terug naar Benji
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function WachtwoordResettenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
          <div className="animate-pulse text-gray-500">Laden...</div>
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
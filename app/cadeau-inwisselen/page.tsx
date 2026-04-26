"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";

export default function CadeauInwisselenPage() {
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null); // null = nog niet ingevoerd
  const [recipientEmail, setRecipientEmail] = useState("");
  const [step, setStep] = useState<"enter" | "confirm" | "redeem" | "done">("enter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const giftCode = useQuery(
    api.giftCodes.getByCode,
    code ? { code } : "skip"
  );
  const redeemAction = useAction(api.giftCodes.redeemGiftCode);

  // Verwerk resultaat van code-lookup
  useEffect(() => {
    if (code === null || giftCode === undefined) return; // nog laden of geen code
    if (giftCode === null) {
      setError("Deze code bestaat niet. Controleer de code en probeer het opnieuw.");
      setCode(null);
      setStep("enter");
      return;
    }
    if (giftCode.status === "redeemed") {
      setError("Deze cadeaucode is al gebruikt.");
      setCode(null);
      setStep("enter");
      return;
    }
    setStep("confirm");
  }, [code, giftCode]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = codeInput.trim().toUpperCase();
    if (!normalized) return;
    setCode(normalized);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !code) return;
    setSubmitting(true);
    setError(null);
    try {
      await redeemAction({ code, recipientEmail });
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white";

  const isLooking = code !== null && giftCode === undefined;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <Link href="/">
            <Image
              src="/images/benji-logo-2.png"
              alt="Talk To Benji"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
              style={{ width: "auto" }}
            />
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-10">

        {/* Stap 1 — code invoeren */}
        {step === "enter" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎁</div>
              <h1 className="text-2xl font-bold text-stone-800">Cadeau inwisselen</h1>
              <p className="text-sm text-stone-500 mt-2">
                Voer de cadeaucode in die je hebt ontvangen
              </p>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Cadeaucode
                </label>
                <input
                  type="text"
                  placeholder="BENJI-XXXX-XXXX"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  required
                  className={`${inputClass} font-mono tracking-widest text-center text-lg`}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLooking}
                className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 text-sm"
              >
                {isLooking ? "Controleren…" : "Code controleren"}
              </button>
            </form>
          </div>
        )}

        {/* Stap 2 — cadeau bevestigen */}
        {step === "confirm" && giftCode && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">🎁</div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Jouw cadeau</p>
                <h2 className="text-xl font-bold text-stone-800">{giftCode.productName}</h2>
                <p className="text-sm text-stone-500 mt-1">van <strong>{giftCode.giverName}</strong></p>
              </div>

              {giftCode.personalMessage && (
                <div className="border-l-4 border-primary-300 pl-4 py-2 mb-4 bg-primary-50 rounded-r-lg">
                  <p className="text-sm text-stone-600 italic">"{giftCode.personalMessage}"</p>
                </div>
              )}

              <button
                onClick={() => setStep("redeem")}
                className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                Dit cadeau inwisselen
              </button>
            </div>
          </div>
        )}

        {/* Stap 3 — email invoeren voor activatie */}
        {step === "redeem" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-stone-800">Jouw e-mailadres</h2>
              <p className="text-sm text-stone-500 mt-2">
                Vul het e-mailadres in voor jouw account
              </p>
            </div>

            <form onSubmit={handleRedeem} className="space-y-4">
              <input
                type="email"
                placeholder="jouw@email.nl"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
                className={inputClass}
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 text-sm"
              >
                {submitting ? "Bezig…" : "Cadeau activeren"}
              </button>
            </form>
          </div>
        )}

        {/* Stap 4 — klaar */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm text-center">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Cadeau geactiveerd!</h2>
            <p className="text-sm text-stone-500 mb-6">
              Maak nu je account aan met <strong>{recipientEmail}</strong> om te beginnen.
            </p>
            <Link
              href={`/registreren?email=${encodeURIComponent(recipientEmail)}`}
              className="block w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-sm text-center"
            >
              Account aanmaken
            </Link>
            <p className="text-xs text-stone-400 mt-4">
              Al een account?{" "}
              <Link href="/inloggen" className="text-primary-600 hover:underline">
                Inloggen
              </Link>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-6">
          Vragen? Mail naar{" "}
          <a href="mailto:contactmetien@talktobenji.com" className="hover:underline">
            contactmetien@talktobenji.com
          </a>
        </p>
      </main>
    </div>
  );
}

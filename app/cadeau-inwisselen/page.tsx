"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

function GiftRegisterForm({ recipientEmail, recipientName }: { recipientEmail: string; recipientName?: string }) {
  const [name, setName] = useState(recipientName ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Wachtwoord moet minimaal 8 tekens zijn"); return; }
    if (password !== passwordConfirm) { setError("Wachtwoorden komen niet overeen"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail, password, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Registratie mislukt"); setLoading(false); return; }
      const displayName = name.trim() || recipientEmail.split("@")[0];
      try { localStorage.setItem("benji_user_name", displayName); } catch {}
      try { sessionStorage.setItem("benji_pending_userid", data.userId); } catch {}
      await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail.toLowerCase(), userId: data.userId }),
      });
      setDone(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white";

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Account aangemaakt!</h2>
        <p className="text-sm text-stone-500 mb-2">
          We hebben een verificatiemail gestuurd naar <strong>{recipientEmail}</strong>.
        </p>
        <p className="text-sm text-stone-500">
          Bevestig je e-mailadres om in te loggen bij Benji.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-xl font-bold text-stone-800">
          {recipientName ? `Hoi ${recipientName}! Je cadeau is geactiveerd.` : "Cadeau geactiveerd!"}
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Maak je account aan met <strong>{recipientEmail}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Naam <span className="text-stone-400 font-normal">(optioneel)</span>
          </label>
          <input
            type="text"
            placeholder="Je voornaam"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Wachtwoord</label>
          <input
            type="password"
            placeholder="Minimaal 8 tekens"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Wachtwoord bevestigen</label>
          <input
            type="password"
            placeholder="Herhaal je wachtwoord"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="h-4 w-4 flex-shrink-0 rounded border-stone-300 accent-green-600 mt-0.5"
          />
          <span className="text-sm text-stone-600 leading-snug">
            Ik ga akkoord met de{" "}
            <a href="https://www.talktobenji.com/algemene-voorwaarden" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">Algemene Voorwaarden</a>
            {" "}en het{" "}
            <a href="https://www.talktobenji.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">Privacybeleid</a>.
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 text-sm"
        >
          {loading ? "Bezig…" : "Account aanmaken"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-stone-400">of</span></div>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/account" })}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Doorgaan met Google
      </button>

      <p className="text-center text-xs text-stone-400">
        Al een account?{" "}
        <Link href="/inloggen" className="text-primary-600 hover:underline">Inloggen</Link>
      </p>
    </div>
  );
}

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
  const redeemMutation = useMutation(api.giftActions.redeemGiftCode);

  // Verwerk resultaat van code-lookup.
  // Gebruik een ref om de "done" toestand bij te houden zodat de live query
  // niet opnieuw evalueert nadat de code is ingewisseld (zou anders terugspringen
  // naar "enter" met "al gebruikt").
  const redeemed = useRef(false);

  useEffect(() => {
    if (redeemed.current) return; // flow is al afgerond
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
    // Alleen doorgaan naar "confirm" als we nog op stap "enter" staan
    setStep((prev) => (prev === "enter" ? "confirm" : prev));
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
      await redeemMutation({ code, recipientEmail });
      redeemed.current = true; // blokkeer live query van terugspringen
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

        {/* Stap 2 — cadeau bevestigen (envelop-stijl) */}
        {step === "confirm" && giftCode && (
          <div className="space-y-3">
            {/* Kaart */}
            <div
              className="rounded-2xl shadow-md overflow-hidden"
              style={{ background: "linear-gradient(145deg, #fdf8f0 0%, #fef3e2 60%, #fde8c8 100%)" }}
            >
              {/* Decoratieve bovenkant */}
              <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706)" }} />

              <div className="px-7 pt-8 pb-7">
                {/* Icoon */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                    <span className="text-3xl">🎁</span>
                  </div>
                </div>

                {/* Aanhef */}
                <div className="text-center mb-6">
                  {giftCode.recipientName ? (
                    <p className="text-2xl font-bold mb-1" style={{ color: "#92400e" }}>
                      Hoi {giftCode.recipientName},
                    </p>
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#b45309" }}>
                      Jouw cadeau
                    </p>
                  )}
                  <p className="text-base text-stone-600 leading-snug">
                    {giftCode.giverName} heeft je{" "}
                    <span className="font-semibold text-stone-800">{giftCode.productName}</span>{" "}
                    cadeau gegeven.
                  </p>
                </div>

                {/* Persoonlijk bericht */}
                {giftCode.personalMessage && (
                  <div className="relative mb-6">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: "#f59e0b" }} />
                    <div className="pl-4">
                      <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "#b45309" }}>
                        Bericht van {giftCode.giverName}
                      </p>
                      <p className="text-sm text-stone-600 italic leading-relaxed">
                        "{giftCode.personalMessage}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Decoratieve lijn */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 border-t border-dashed" style={{ borderColor: "#f59e0b60" }} />
                  <span className="text-xs" style={{ color: "#d97706" }}>✦</span>
                  <div className="flex-1 border-t border-dashed" style={{ borderColor: "#f59e0b60" }} />
                </div>

                <button
                  onClick={() => setStep("redeem")}
                  className="w-full py-3.5 font-semibold rounded-xl transition-all text-sm text-white shadow-sm hover:shadow-md active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}
                >
                  Mijn cadeau inwisselen →
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-stone-400">
              Van harte! 🌿
            </p>
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

        {/* Stap 4 — account aanmaken */}
        {step === "done" && (
          <GiftRegisterForm
            recipientEmail={recipientEmail}
            recipientName={giftCode?.recipientName ?? ""}
          />
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

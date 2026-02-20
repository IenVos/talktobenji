"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

function VerifieerEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const callbackUrl = searchParams?.get("callbackUrl") || "/account";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Staat toe dat er meerdere cijfers tegelijk worden geplakt
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newDigits[index + i] = pasted[i];
      }
      setDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Vul alle 6 cijfers in");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Verificatie mislukt");
        setLoading(false);
        return;
      }

      // Redirect naar inloggen met verified=1
      const loginUrl = `/inloggen?verified=1&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      window.location.href = loginUrl;
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMessage("");
    setError("");

    try {
      // Haal userId op via een tijdelijk opgeslagen waarde (sessionStorage)
      const userId = sessionStorage.getItem("benji_pending_userid") || "";
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      });

      if (res.ok) {
        setResendMessage("Nieuwe code verstuurd. Controleer je e-mail.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Opnieuw versturen mislukt");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setResending(false);
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
          <h1 className="text-xl font-bold text-primary-900 mt-3">Bevestig je e-mailadres</h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            We hebben een 6-cijferige code gestuurd naar<br />
            <span className="font-medium text-gray-800">{email}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Voer je code in
            </label>
            <div className="flex justify-center gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-14 text-center text-xl font-bold border border-primary-200 rounded-lg bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          {resendMessage && (
            <p className="text-green-700 text-sm text-center">{resendMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading || digits.join("").length !== 6}
            className="w-full py-3 btn btn-primary rounded-lg disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Bevestigen"}
          </button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-600">
            Geen e-mail ontvangen?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary-600 hover:underline font-medium disabled:opacity-50"
            >
              {resending ? "Versturen..." : "Opnieuw versturen"}
            </button>
          </p>
          <p>
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              Terug naar Benji
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifieerEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Laden...</div>
      </div>
    }>
      <VerifieerEmailForm />
    </Suspense>
  );
}

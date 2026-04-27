"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  loadStripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialiseer Stripe buiten de component zodat het niet opnieuw geladen wordt
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer flex-shrink-0 ${
        checked ? "bg-primary-600 border-primary-600" : "bg-white border-stone-300 hover:border-primary-400"
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

// ——— Checkout Form ———
function CheckoutForm({
  slug,
  buttonText,
  clientSecret,
}: {
  slug: string;
  buttonText?: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cadeau-velden
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"direct" | "manual">("manual");
  const [scheduledDate, setScheduledDate] = useState(""); // YYYY-MM-DD

  // Minimum datum = morgen
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // Update bestaande PaymentIntent met e-mail en naam (+ cadeau-info)
    try {
      const paymentIntentId = clientSecret.split("_secret_")[0];
      await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, email, name: naam, paymentIntentId, optIn,
          ...(isGift && {
            isGift: true,
            recipientEmail: recipientEmail || undefined,
            personalMessage: personalMessage || undefined,
            deliveryMethod,
            scheduledSendDate: (deliveryMethod === "direct" && scheduledDate)
              ? new Date(scheduledDate).getTime()
              : undefined,
          }),
        }),
      });
    } catch {
      // Niet fataal
    }

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bedankt?item=${slug}${isGift ? "&cadeau=1" : ""}`,
        payment_method_data: {
          billing_details: { name: naam, email },
        },
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Er is een fout opgetreden.");
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Jouw naam</label>
        <input
          type="text"
          placeholder="Voornaam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Jouw e-mailadres</label>
        <input
          type="email"
          placeholder="jouw@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="pt-1">
        <label className={`${labelClass} mb-2`}>Betaalgegevens</label>
        <div className="border border-stone-200 rounded-xl p-4 bg-white">
          <PaymentElement />
        </div>
      </div>

      {/* Cadeau toggle */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-white hover:bg-stone-50 transition-colors">
          <Checkbox checked={isGift} onChange={setIsGift} />
          <div>
            <p className="text-sm font-medium text-stone-700">Dit is een cadeau 🎁</p>
            <p className="text-xs text-stone-400">Je ontvangt een unieke cadeaucode na betaling</p>
          </div>
        </label>

        {isGift && (
          <div className="border-t border-stone-100 bg-stone-50 px-4 py-4 space-y-4">
            {/* Stap 1: bezorgmethode */}
            <div>
              <p className={labelClass}>Hoe wil je de code bezorgen?</p>
              <div className="space-y-2">
                {(["direct", "manual"] as const).map((method) => (
                  <label key={method} className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => setDeliveryMethod(method)}
                      className={`mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        deliveryMethod === method
                          ? "border-primary-600 bg-primary-600"
                          : "border-stone-300 group-hover:border-primary-400"
                      }`}
                      style={{ width: 18, height: 18 }}
                    >
                      {deliveryMethod === method && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-stone-700">
                        {method === "direct"
                          ? "Wij sturen de cadeaucode naar de ontvanger"
                          : "Ik geef de code zelf (ik krijg de code per mail)"}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {method === "direct"
                          ? "Vul het e-mailadres in — wij verzenden de code"
                          : "Jij bepaalt wanneer je de code deelt"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Stap 2: ontvanger-details — alleen bij direct */}
            {deliveryMethod === "direct" && (
              <>
                <div>
                  <label className={labelClass}>E-mailadres van de ontvanger</label>
                  <input
                    type="email"
                    placeholder="ontvanger@email.nl"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Persoonlijk bericht <span className="font-normal text-stone-400">(optioneel)</span></label>
                  <textarea
                    placeholder="Bijv. 'Ik denk aan je. ❤️'"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="pt-1 border-t border-stone-200">
                  <label className={labelClass}>
                    Versturen op <span className="font-normal text-stone-400">(optioneel — leeg = direct na betaling)</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={minDate}
                    className={`${inputClass} cursor-pointer`}
                  />
                  {scheduledDate && (
                    <p className="text-xs text-stone-400 mt-1.5">
                      De ontvanger krijgt de mail op {new Date(scheduledDate).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}. Jij krijgt dan ook een bevestiging.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Persoonlijk bericht ook beschikbaar bij manual */}
            {deliveryMethod === "manual" && (
              <div>
                <label className={labelClass}>Persoonlijk bericht <span className="font-normal text-stone-400">(optioneel — voor jouw eigen gebruik)</span></label>
                <textarea
                  placeholder="Bijv. 'Ik denk aan je. ❤️'"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Opt-in nieuwsbrief */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="mt-0.5">
          <Checkbox checked={optIn} onChange={setOptIn} />
        </div>
        <div>
          <p className="text-sm text-stone-700 leading-snug">Ja, houd me op de hoogte</p>
          <p className="text-xs text-stone-400 mt-0.5">Geen spam, uitschrijven kan altijd.</p>
        </div>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {submitting ? "Bezig met betalen…" : (buttonText || "Betalen")}
      </button>

      <p className="text-center text-xs text-stone-400">
        🔒 Veilig betaald via Stripe
      </p>
    </form>
  );
}

// ——— Hoofd checkout pagina ———
export default function BetalenPage() {
  const params = useParams()!;
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const product = useQuery(api.checkoutProducts.getBySlug, slug ? { slug } : "skip");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);

  // Haal de client secret op zodra het product geladen is
  useEffect(() => {
    if (!product) return;
    if (clientSecret) return; // Niet opnieuw ophalen

    setLoadingSecret(true);
    setSecretError(null);

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setSecretError(data.error || "Kon betaalsessie niet starten.");
        }
      })
      .catch(() => setSecretError("Verbindingsfout. Probeer het opnieuw."))
      .finally(() => setLoadingSecret(false));
  }, [product, slug, clientSecret]);

  // Loading state van product
  if (product === undefined) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Product niet gevonden of niet live
  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-stone-800 mb-3">Pagina niet gevonden</h1>
          <p className="text-stone-500 mb-6">
            Deze betaalpagina bestaat niet of is niet beschikbaar.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  // Stripe niet geconfigureerd
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-stone-800 mb-3">Betalen tijdelijk niet beschikbaar</h1>
          <p className="text-stone-500 mb-6">
            De betaalomgeving is momenteel niet beschikbaar. Probeer het later opnieuw.
          </p>
          <Link href="/" className="text-primary-600 hover:underline text-sm">
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  const priceFormatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(product.priceInCents / 100);

  const elementsOptions: StripeElementsOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#6d84a8",
            colorBackground: "#ffffff",
            colorText: "#44403c",
            colorDanger: "#dc2626",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSizeBase: "16px",
            borderRadius: "10px",
            spacingUnit: "6px",
          },
        },
      }
    : {};

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
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

      <main className="max-w-md mx-auto px-4 py-8">
        {/* Product info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-1">{product.name}</h1>
          {product.description && (
            <div className="text-sm text-stone-500 mb-4 leading-relaxed space-y-3">
              {product.description.split("\n\n").map((para, i) => (
                <p key={i}>
                  {para.split("\n").map((line, j) =>
                    j === 0 ? line : <>{"\n"}<br />{line}</>
                  )}
                </p>
              ))}
            </div>
          )}
          {product.imageUrl && (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full rounded-xl"
              />
            </div>
          )}
          <div className="flex justify-center">
            <span className="text-3xl font-bold text-primary-700">{priceFormatted}</span>
          </div>
        </div>

        {/* Checkout sectie */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-800 mb-5">Jouw gegevens & betaling</h2>

          {secretError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {secretError}
            </div>
          )}

          {loadingSecret && (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <CheckoutForm
                slug={slug}
                buttonText={product.buttonText}
                clientSecret={clientSecret}
              />
            </Elements>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          {" · "}
          <Link href="/algemene-voorwaarden" className="hover:underline">Algemene voorwaarden</Link>
        </p>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const SLUG = "niet-alleen";

function CheckoutForm({ clientSecret, buttonText }: { clientSecret: string; buttonText?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    try {
      const paymentIntentId = clientSecret.split("_secret_")[0];
      await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: SLUG, email, name: naam, paymentIntentId }),
      });
    } catch { /* niet fataal */ }

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bedankt`,
        payment_method_data: { billing_details: { name: naam, email } },
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Er is een fout opgetreden.");
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Jouw naam</label>
        <input type="text" placeholder="Voornaam" value={naam} onChange={(e) => setNaam(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>E-mailadres</label>
        <input type="email" placeholder="jouw@email.nl" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
      </div>
      <div className="pt-1">
        <label className={`${labelClass} mb-2`}>Betaalgegevens</label>
        <div className="border border-stone-200 rounded-xl p-4 bg-white">
          <PaymentElement />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {submitting ? "Bezig met betalen…" : (buttonText || "Betalen")}
      </button>
      <p className="text-center text-xs text-stone-400">🔒 Veilig betaald via Stripe</p>
    </form>
  );
}

const BENJI_ADDON_PRICE = 10;

export default function NietAlleenBetalenPage() {
  const product = useQuery(api.checkoutProducts.getBySlug, { slug: SLUG });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [benjiAddon, setBenjiAddon] = useState(false);

  const fetchPaymentIntent = (addon: boolean) => {
    setClientSecret(null);
    setLoadingSecret(true);
    setSecretError(null);
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: SLUG, benjiAddon: addon }),
    })
      .then((r) => r.json())
      .then((d) => d.clientSecret ? setClientSecret(d.clientSecret) : setSecretError(d.error || "Kon betaalsessie niet starten."))
      .catch(() => setSecretError("Verbindingsfout. Probeer het opnieuw."))
      .finally(() => setLoadingSecret(false));
  };

  useEffect(() => {
    if (!product) return;
    fetchPaymentIntent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleToggleAddon = (checked: boolean) => {
    setBenjiAddon(checked);
    fetchPaymentIntent(checked);
  };

  if (product === undefined) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!product || !stripePromise) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-stone-800 mb-3">Betalen tijdelijk niet beschikbaar</h1>
        <Link href="/" className="text-primary-600 hover:underline text-sm">Terug naar home</Link>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions = clientSecret ? {
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
  } : {};

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <Link href="/" className="text-lg font-semibold" style={{ color: "#3d3530" }}>
            Niet Alleen
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-1">{product.name}</h1>
          {product.description && (
            <div className="text-sm text-stone-500 mb-4 leading-relaxed space-y-3">
              {product.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
            </div>
          )}
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full rounded-xl mb-4" />
          )}
          <div className="flex justify-center">
            <span className="text-3xl font-bold text-primary-700">
              {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format((product.priceInCents + (benjiAddon ? 1000 : 0)) / 100)}
            </span>
          </div>
        </div>

        {/* Kassakoopje: Benji addon */}
        <button
          type="button"
          onClick={() => handleToggleAddon(!benjiAddon)}
          className="w-full text-left bg-white rounded-2xl border-2 p-5 shadow-sm mb-6 transition-all"
          style={{ borderColor: benjiAddon ? "#6d84a8" : "#e7e0d8" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all"
              style={{
                borderColor: benjiAddon ? "#6d84a8" : "#c4bdb6",
                background: benjiAddon ? "#6d84a8" : "white",
              }}
            >
              {benjiAddon && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-stone-800">Voeg 30 dagen Benji toe</p>
                <span className="text-sm font-bold shrink-0" style={{ color: "#6d84a8" }}>+€{BENJI_ADDON_PRICE}</span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">
                Praat 30 dagen één-op-één met Benji. Hij luistert, stelt vragen en is er wanneer jij dat nodig hebt — dag én nacht.
              </p>
            </div>
          </div>
        </button>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-800 mb-5">Jouw gegevens & betaling</h2>
          {secretError && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{secretError}</div>}
          {loadingSecret && <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>}
          {clientSecret && (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <CheckoutForm clientSecret={clientSecret} buttonText={product.buttonText} />
            </Elements>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          <Link href="/privacy" className="hover:underline">Privacybeleid</Link>
        </p>
      </main>
    </div>
  );
}

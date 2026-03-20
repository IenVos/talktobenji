"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

// ——— Checkout Form ———
function CheckoutForm({
  slug,
  buttonText,
}: {
  slug: string;
  buttonText?: string;
}) {
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

    // Update payment intent met naam en e-mail
    try {
      await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, name: naam }),
      });
    } catch {
      // Niet fataal — metadata is al meegegeven bij aanmaken
    }

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bedankt?item=${slug}`,
        payment_method_data: {
          billing_details: {
            name: naam,
            email,
          },
        },
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Er is een fout opgetreden.");
      setSubmitting(false);
    }
    // Bij succes stuurt Stripe door naar return_url
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
        <label className={labelClass}>E-mailadres</label>
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
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary-700">{priceFormatted}</span>
            <span className="text-sm text-stone-400">eenmalig</span>
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

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
import { calculateVat, EU_COUNTRY_NAMES_NL } from "@/lib/vat";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// NL en BE vooraan, daarna Buiten EU, dan de rest alfabetisch
const EU_REST = Object.entries(EU_COUNTRY_NAMES_NL)
  .filter(([code]) => code !== "NL" && code !== "BE")
  .sort(([, a], [, b]) => a.localeCompare(b, "nl"));

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

type GiftVariant = {
  label: string;
  priceInCents: number;
  billingPeriod: "monthly" | "quarterly" | "half_yearly" | "yearly";
  accessDays: number;
};

function CheckoutForm({
  slug,
  buttonText,
  clientSecret,
  naam,
  email,
  giftEnabled,
  giftVariants,
  onPriceChange,
}: {
  slug: string;
  buttonText?: string;
  clientSecret: string;
  naam: string;
  email: string;
  giftEnabled?: boolean;
  giftVariants?: GiftVariant[];
  onPriceChange?: (cents: number | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [optIn, setOptIn] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isGift, setIsGift] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<GiftVariant | null>(
    giftVariants && giftVariants.length > 0 ? giftVariants[0] : null
  );
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"direct" | "manual">("manual");
  const [scheduledDate, setScheduledDate] = useState("");

  const hasVariants = giftEnabled && giftVariants && giftVariants.length > 0;

  const handleVariantSelect = (variant: GiftVariant) => {
    setSelectedVariant(variant);
    onPriceChange?.(variant.priceInCents);
  };
  const handleGiftToggle = (val: boolean) => {
    setIsGift(val);
    if (!val) {
      onPriceChange?.(null);
    } else if (hasVariants && selectedVariant) {
      onPriceChange?.(selectedVariant.priceInCents);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

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
        body: JSON.stringify({
          slug, email, name: naam, paymentIntentId, optIn,
          ...(isGift && {
            isGift: true,
            recipientEmail: recipientEmail || undefined,
            recipientName: recipientName || undefined,
            personalMessage: personalMessage || undefined,
            deliveryMethod,
            scheduledSendDate: (deliveryMethod === "direct" && scheduledDate)
              ? new Date(scheduledDate).getTime()
              : undefined,
            ...(hasVariants && selectedVariant && {
              giftVariantPriceInCents: selectedVariant.priceInCents,
              giftVariantBillingPeriod: selectedVariant.billingPeriod,
              giftVariantAccessDays: selectedVariant.accessDays,
              giftVariantLabel: selectedVariant.label,
            }),
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
      {giftEnabled && <div className="border border-stone-200 rounded-xl overflow-hidden">
        <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-white hover:bg-stone-50 transition-colors">
          <Checkbox checked={isGift} onChange={handleGiftToggle} />
          <div>
            <p className="text-sm font-medium text-stone-700">Dit is een cadeau 🎁</p>
            <p className="text-xs text-stone-400">Je ontvangt een unieke cadeaucode na betaling</p>
          </div>
        </label>

        {isGift && (
          <div className="border-t border-stone-100 bg-stone-50 px-4 py-4 space-y-4">
            <div>
              <label className={labelClass}>Naam van de ontvanger <span className="font-normal text-stone-400">(optioneel)</span></label>
              <input
                type="text"
                placeholder="Voornaam"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className={inputClass}
              />
            </div>

            {hasVariants && (
              <div>
                <p className={labelClass}>Kies een looptijd</p>
                <div className="space-y-2">
                  {giftVariants!.map((variant, vi) => {
                    const isSelected = selectedVariant === variant ||
                      (selectedVariant?.billingPeriod === variant.billingPeriod && selectedVariant?.priceInCents === variant.priceInCents);
                    const priceFormatted = new Intl.NumberFormat("nl-NL", {
                      style: "currency", currency: "EUR",
                    }).format(variant.priceInCents / 100);
                    return (
                      <div
                        key={vi}
                        onClick={() => handleVariantSelect(variant)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none ${
                          isSelected
                            ? "border-primary-400 bg-primary-50"
                            : "border-stone-200 bg-white hover:border-primary-300"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <div
                            className={`rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? "border-primary-600 bg-primary-600" : "border-stone-300"
                            }`}
                            style={{ width: 18, height: 18 }}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm font-medium text-stone-700">{variant.label}</span>
                        </span>
                        <span className="text-sm text-stone-400">{priceFormatted}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
      </div>}

      <div className="pt-1">
        <label className={`${labelClass} mb-2`}>Betaalgegevens</label>
        <div className="border border-stone-200 rounded-xl p-4 bg-white">
          <PaymentElement />
        </div>
      </div>

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

      <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTermsAccepted(v => !v)}>
        <Checkbox checked={termsAccepted} onChange={setTermsAccepted} />
        <span className="text-xs text-stone-600 leading-snug pt-0.5">
          Ik ga akkoord met de{" "}
          <a href="/algemene-voorwaarden" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">algemene voorwaarden</a>
          {" "}en het{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">privacybeleid</a>.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting || !stripe || !elements || !termsAccepted}
        className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {submitting ? "Bezig met betalen…" : (buttonText || "Betalen")}
      </button>

      <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 space-y-1 text-center">
        <p className="text-xs font-medium text-stone-500">Herroepingsrecht</p>
        <p className="text-xs text-stone-400 leading-relaxed">
          Het herroepingsrecht vervalt zodra de dienst na betaling start. Nog niet gebruikt en toch annuleren?
        </p>
        <p className="text-xs text-stone-400">
          <a href="mailto:contactmetien@talktobenji.com" className="underline hover:text-stone-600">Neem contact op</a> binnen 14 dagen.
        </p>
      </div>

      <p className="text-center text-xs text-stone-400">
        🔒 Veilig betaald via Stripe
      </p>
    </form>
  );
}

export default function BetalenPage() {
  const params = useParams()!;
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const product = useQuery(api.checkoutProducts.getBySlug, slug ? { slug } : "skip");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [overridePriceInCents, setOverridePriceInCents] = useState<number | null>(null);
  const [addOnSelected, setAddOnSelected] = useState(false);

  // Naam + email — hier zodat ze zichtbaar zijn voor landkeuze
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");

  // Land + BTW state
  const [countryCode, setCountryCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [vatNumberCommitted, setVatNumberCommitted] = useState("");
  const [b2bOpen, setB2bOpen] = useState(false);

  const liveIsBusiness = vatNumber.trim().length >= 4;
  const liveEffectiveCountry = liveIsBusiness ? "OTHER" : countryCode;
  const liveVatInfo = countryCode && product
    ? calculateVat(overridePriceInCents ?? product.priceInCents, liveEffectiveCountry)
    : null;

  useEffect(() => {
    if (!product || !countryCode) return;

    setLoadingSecret(true);
    setSecretError(null);
    setClientSecret(null);

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        countryCode,
        ...(vatNumberCommitted && { vatNumber: vatNumberCommitted }),
        ...(addOnSelected && product?.addOnPriceInCents && {
          addOnPriceInCents: product.addOnPriceInCents,
          addOnType: product.addOnType ?? "",
          addOnAccessDays: product.addOnAccessDays ?? 30,
        }),
      }),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, slug, countryCode, vatNumberCommitted, addOnSelected]);

  const handleVatNumberBlur = () => {
    const committed = vatNumber.trim().length >= 4 ? vatNumber.trim() : "";
    if (committed !== vatNumberCommitted) {
      setVatNumberCommitted(committed);
    }
  };

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

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

  const addonPrice = addOnSelected && product.addOnPriceInCents ? product.addOnPriceInCents : 0;
  const displayPrice = (overridePriceInCents ?? product.priceInCents) + addonPrice;
  const priceFormatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(displayPrice / 100);

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

  const inputClass =
    "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1.5";

  let vatLine: string | null = null;
  if (countryCode && liveVatInfo) {
    if (liveIsBusiness) {
      vatLine = "Geen btw — zakelijke aankoop (reverse charge)";
    } else if (countryCode === "OTHER" || liveVatInfo.vatRate === 0) {
      vatLine = "Geen btw (buiten EU)";
    } else {
      const countryName = EU_COUNTRY_NAMES_NL[countryCode] ?? countryCode;
      vatLine = `Inclusief ${Math.round(liveVatInfo.vatRate * 100)}% btw (${countryName})`;
    }
  }

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
              <img src={product.imageUrl} alt={product.name} className="w-full rounded-xl" />
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-primary-700">{priceFormatted}</span>
            {vatLine && (
              <p className="text-xs text-stone-400 mt-1">{vatLine}</p>
            )}
          </div>

          {/* Kassakoopje — in hetzelfde blok, onder de prijs */}
          {product.addOnLabel && product.addOnPriceInCents && (
            <button
              type="button"
              onClick={() => setAddOnSelected((v) => !v)}
              className="w-full text-left mt-5 rounded-xl p-4 transition-all border-2"
              style={{
                borderColor: addOnSelected ? "#6d84a8" : "#e2d9cf",
                background: addOnSelected ? "#f0f4f9" : "#fdf9f4",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    borderColor: addOnSelected ? "#6d84a8" : "#b0a8a0",
                    background: addOnSelected ? "#6d84a8" : "white",
                  }}
                >
                  {addOnSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>{product.addOnLabel}</p>
                    <span
                      className="text-sm font-bold shrink-0 px-2 py-0.5 rounded-full"
                      style={{ color: "#6d84a8", background: addOnSelected ? "white" : "#e8f0f8" }}
                    >
                      +{new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(product.addOnPriceInCents / 100)}
                    </span>
                  </div>
                  {product.addOnDescription && (
                    <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>{product.addOnDescription}</p>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Checkout kaart — naam, email, land, betaalgegevens */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-800 mb-5">Jouw gegevens &amp; betaling</h2>

          <div className="space-y-4">
            {/* Naam */}
            <div>
              <label className={labelClass}>Jouw naam</label>
              <input
                type="text"
                placeholder="Voornaam"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* E-mail */}
            <div>
              <label className={labelClass}>Jouw e-mailadres</label>
              <input
                type="email"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Land */}
            <div>
              <label className={labelClass}>Jouw land</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Kies je land</option>
                <option value="NL">Nederland</option>
                <option value="BE">België</option>
                <option value="OTHER">Buiten de EU / overig</option>
                {EU_REST.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              {vatLine && (
                <p className="text-xs text-stone-500 mt-2">{vatLine}</p>
              )}
            </div>

            {/* B2B toggle */}
            <div>
              <button
                type="button"
                onClick={() => setB2bOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${b2bOpen ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Zakelijke aankoop?
              </button>

              {b2bOpen && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className={labelClass}>Btw-nummer</label>
                    <input
                      type="text"
                      placeholder="NL123456789B01"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      onBlur={handleVatNumberBlur}
                      className={inputClass}
                    />
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Vul je btw-nummer in. Je bevestigt hiermee dat je als btw-plichtige ondernemer koopt (reverse charge). Jij bent verantwoordelijk voor correcte opgave.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scheidslijn voor betaalgegevens */}
          {countryCode && <div className="mt-6 pt-6 border-t border-stone-100">
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
                  naam={naam}
                  email={email}
                  giftEnabled={product.giftEnabled ?? false}
                  giftVariants={product.giftVariants ?? undefined}
                  onPriceChange={setOverridePriceInCents}
                />
              </Elements>
            )}
          </div>}

          {!countryCode && (
            <p className="text-sm text-stone-400 text-center mt-6 pt-6 border-t border-stone-100">
              Kies je land om door te gaan met betalen.
            </p>
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

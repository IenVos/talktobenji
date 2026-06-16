"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { ScrollDepthTracker } from "@/components/analytics/ScrollDepthTracker";
import { useFunnelTracker } from "@/components/analytics/useFunnelTracker";
import { RustigeCheckout } from "./RustigeCheckout";

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
  trustText,
  quoteText,
  clientSecret,
  naam,
  email,
  isGift,
  recipientEmail,
  recipientName,
  personalMessage,
  deliveryMethod,
  scheduledDate,
  selectedVariant,
  addOnType,
  productName,
  totalInCents,
  vatLine,
  vatAmountInCents,
  addOnLabel,
  addOnPriceInCents,
  addOnSelected,
  onPayClick,
}: {
  slug: string;
  buttonText?: string;
  trustText?: string;
  quoteText?: string;
  clientSecret: string;
  naam: string;
  email: string;
  isGift: boolean;
  recipientEmail: string;
  recipientName: string;
  personalMessage: string;
  deliveryMethod: "direct" | "manual";
  scheduledDate: string;
  selectedVariant: GiftVariant | null;
  addOnType?: string;
  productName: string;
  totalInCents: number;
  vatLine: string | null;
  vatAmountInCents?: number | null;
  addOnLabel?: string;
  addOnPriceInCents?: number;
  addOnSelected?: boolean;
  onPayClick?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const termsRef = useRef<HTMLLabelElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Funnel: bezoeker heeft op de betaalknop geklikt (vóór validatie, zodat ook
    // afhakers door ontbrekende gegevens/voorwaarden zichtbaar zijn).
    onPayClick?.();
    if (!stripe || !elements) return;

    if (!naam.trim()) {
      setError("Vul je naam in om door te gaan.");
      document.getElementById("jouw-gegevens")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Vul een geldig e-mailadres in om door te gaan.");
      document.getElementById("jouw-gegevens")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!termsAccepted) {
      setTermsError(true);
      termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const paymentIntentId = clientSecret.split("_secret_")[0];
      await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, email, name: naam, paymentIntentId,
          ...(isGift && {
            isGift: true,
            recipientEmail: recipientEmail || undefined,
            recipientName: recipientName || undefined,
            personalMessage: personalMessage || undefined,
            deliveryMethod,
            scheduledSendDate: (deliveryMethod === "direct" && scheduledDate)
              ? new Date(scheduledDate).getTime()
              : undefined,
            ...(selectedVariant && {
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
        return_url: `${window.location.origin}/bedankt?item=${slug}${isGift ? "&cadeau=1" : ""}${addOnType ? `&addon=${addOnType}` : ""}`,
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
      <div className="pt-1">
        <label className={`${labelClass} mb-2`}>Betaalgegevens</label>
        <div className="border border-stone-200 rounded-xl p-4 bg-white">
          <PaymentElement options={{ fields: { billingDetails: { name: "never" } } }} />
        </div>
      </div>

      {/* Prijssamenvatting */}
      <div className="rounded-xl border-2 border-primary-600 bg-primary-50 px-4 py-3 space-y-1.5 text-sm">
        {(() => {
          const hasAddOn = !!(addOnSelected && addOnLabel && addOnPriceInCents);
          const basePrice = hasAddOn ? totalInCents - addOnPriceInCents! : totalInCents;
          const fmt = (cents: number) =>
            new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
          return (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-600 truncate">{productName}</span>
                <span className="font-semibold text-stone-800 flex-shrink-0">{fmt(basePrice)}</span>
              </div>
              {hasAddOn && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-600 truncate">{addOnLabel}</span>
                  <span className="font-semibold text-stone-800 flex-shrink-0">{fmt(addOnPriceInCents!)}</span>
                </div>
              )}
            </>
          );
        })()}
        {vatLine && (
          <div className="flex items-center justify-between gap-2 text-xs text-stone-400">
            <span>{vatLine}</span>
            {vatAmountInCents != null && (
              <span className="flex-shrink-0">
                {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(vatAmountInCents / 100)}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-stone-200 pt-1.5 mt-1.5">
          <span className="font-semibold text-stone-800">Totaal</span>
          <span className="font-bold text-primary-700 text-base">
            {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(totalInCents / 100)}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <label
        ref={termsRef}
        className={`flex items-start gap-3 cursor-pointer rounded-lg ${termsError ? "ring-2 ring-red-400 bg-red-50 -m-2 p-2" : ""}`}
        onClick={() => { setTermsAccepted(v => !v); setTermsError(false); }}
      >
        {/* Checkbox is puur visueel: het label hierboven handelt de klik af (geen dubbele toggle). */}
        <Checkbox checked={termsAccepted} onChange={() => {}} />
        <span className="text-xs text-stone-600 leading-snug pt-0.5">
          Ik ga akkoord met de{" "}
          <a href="/algemene-voorwaarden" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary-600 underline">algemene voorwaarden</a>
          {" en het "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary-600 underline">privacybeleid</a>
          {"."}
        </span>
      </label>

      {termsError && (
        <p className="text-sm text-red-600 font-medium">
          Je moet akkoord gaan met de voorwaarden om door te gaan.
        </p>
      )}

      {/* Quote + betaalknop samen in één dun kader zodat ze bij elkaar horen */}
      <div className="rounded-2xl border border-stone-200 p-4 space-y-4">
        <p className="text-balance text-center text-base font-semibold italic text-primary-700 leading-snug px-2">
          &ldquo;{quoteText?.trim() || "Dit is geen grote beslissing. Het is gewoon dertig dagen een moment voor jezelf."}&rdquo;
        </p>

        <button
          type="submit"
          disabled={submitting || !stripe || !elements}
          className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
        >
          {submitting ? "Bezig met betalen…" : (buttonText || "Betalen")}
        </button>
      </div>

      <p className="text-center text-xs text-stone-500 font-medium">
        {trustText?.trim() || "🔒 Veilig betalen via Stripe · digitaal product · direct toegang"}
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

  // Afhaak-funnel: stappen door de checkout (path = product-slug)
  const fireFunnel = useFunnelTracker("checkout", slug);
  // Stap 1: checkout bereikt (zodra de slug bekend is)
  useEffect(() => {
    if (slug) fireFunnel("reached");
  }, [slug, fireFunnel]);
  // Stap 2: bezoeker heeft een geldig e-mailadres ingevuld (echt begonnen met afrekenen)
  useEffect(() => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) fireFunnel("details");
  }, [email, fireFunnel]);

  // Land + BTW state
  const [countryCode, setCountryCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [vatNumberCommitted, setVatNumberCommitted] = useState("");
  const [b2bOpen, setB2bOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [landOpen, setLandOpen] = useState(false);
  // Land/btw-keuze blijft volledig werken, maar is tijdelijk verborgen op de checkout.
  // Zet op true om het blok ("Inclusief … btw" + "Woon je buiten Nederland?") weer te tonen.
  const toonLandKeuze = false;
  const [isGift, setIsGift] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<GiftVariant | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"direct" | "manual">("manual");
  const [scheduledDate, setScheduledDate] = useState("");

  const liveIsBusiness = vatNumber.trim().length >= 4;
  const liveEffectiveCountry = liveIsBusiness ? "OTHER" : (countryCode || "NL");
  const liveVatInfo = product
    ? calculateVat(overridePriceInCents ?? product.priceInCents, liveEffectiveCountry)
    : null;

  // Gebruik "NL" als provisorisch land zodat de Stripe embed direct zichtbaar is.
  // Bij een echte landkeuze wordt het payment intent herrekend met het juiste btw-tarief.
  const effectiveCountry = countryCode || "NL";

  // Haal de betaalsessie (clientSecret) op. Probeer automatisch opnieuw bij een
  // mislukte/koude eerste poging, zodat de checkout altijd verschijnt zonder refresh.
  const createPaymentIntent = useCallback(async () => {
    if (!product) return;

    setLoadingSecret(true);
    setSecretError(null);
    setClientSecret(null);

    // Bron-LP (uit ?from= in de URL, anders de verwijzende pagina) + sessie meesturen,
    // zodat de server "checkout bereikt" betrouwbaar per LP kan loggen.
    const fromParam = new URLSearchParams(window.location.search).get("from");
    let referrerPath = "";
    try { if (document.referrer) referrerPath = new URL(document.referrer).pathname; } catch {}
    const source = fromParam || referrerPath || "";
    const sessionId = localStorage.getItem("ttb_sid") ?? "";

    const body = JSON.stringify({
      slug,
      countryCode: effectiveCountry,
      source,
      sessionId,
      ...(vatNumberCommitted && { vatNumber: vatNumberCommitted }),
      ...(addOnSelected && product?.addOnPriceInCents && {
        addOnPriceInCents: product.addOnPriceInCents,
        addOnType: product.addOnType ?? "",
        addOnAccessDays: product.addOnAccessDays ?? 30,
      }),
    });

    let lastError = "Kon betaalsessie niet starten.";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setLoadingSecret(false);
          return;
        }
        lastError = data.error || lastError;
      } catch {
        lastError = "Verbindingsfout. Probeer het opnieuw.";
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 700 * attempt));
    }
    setSecretError(lastError);
    setLoadingSecret(false);
  }, [product, slug, effectiveCountry, vatNumberCommitted, addOnSelected]);

  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  const handleGiftOpen = (open: boolean) => {
    setGiftOpen(open);
    if (!open) {
      setIsGift(false);
      setOverridePriceInCents(null);
    }
  };

  const handleGiftCheckboxToggle = (val: boolean) => {
    setIsGift(val);
    if (!val) {
      setOverridePriceInCents(null);
    } else if (selectedVariant) {
      setOverridePriceInCents(selectedVariant.priceInCents);
    }
  };

  const handleVariantSelect = (variant: GiftVariant) => {
    setSelectedVariant(variant);
    if (isGift) setOverridePriceInCents(variant.priceInCents);
  };

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

  const hasVariants = !!(product.giftEnabled && product.giftVariants && product.giftVariants.length > 0);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const addonPrice = addOnSelected && product.addOnPriceInCents ? product.addOnPriceInCents : 0;
  const displayPrice = (overridePriceInCents ?? product.priceInCents) + addonPrice;
  // Scheidingsstreep boven "Betaalgegevens" alleen tonen als er iets te scheiden valt
  // (cadeau- of zakelijk-knop, of een kassakoopje). Anders is het losse ruis.
  const hasExtraOptions = !!(
    product.giftEnabled ||
    product.b2bEnabled !== false ||
    (product.addOnLabel && product.addOnPriceInCents)
  );
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
  let vatAmountInCents: number | null = null;
  if (liveVatInfo) {
    const displayCountry = countryCode || "NL";
    if (liveIsBusiness) {
      vatLine = "Geen btw — zakelijke aankoop (reverse charge)";
    } else if (displayCountry === "OTHER" || liveVatInfo.vatRate === 0) {
      vatLine = "Geen btw (buiten EU)";
    } else {
      const countryName = EU_COUNTRY_NAMES_NL[displayCountry] ?? displayCountry;
      vatLine = `Inclusief ${Math.round(liveVatInfo.vatRate * 100)}% btw (${countryName})`;
      // Btw-bedrag op het volledige totaal (incl. eventueel kassakoopje)
      vatAmountInCents = calculateVat(displayPrice, liveEffectiveCountry).vatAmount;
    }
  }

  // Betaalblok (Stripe) — gedeeld tussen de standaard- en de rustige layout.
  const paymentNode = secretError ? (
    <div className="space-y-3">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        {secretError}
      </div>
      <button
        type="button"
        onClick={() => createPaymentIntent()}
        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-sm"
      >
        Opnieuw proberen
      </button>
    </div>
  ) : (loadingSecret || !clientSecret) ? (
    <div className="py-8 flex justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
    </div>
  ) : (
    <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
      <CheckoutForm
        slug={slug}
        buttonText={product.buttonText}
        trustText={(product as any).trustText}
        quoteText={(product as any).quoteText}
        clientSecret={clientSecret}
        naam={naam}
        email={email}
        isGift={isGift}
        recipientEmail={recipientEmail}
        recipientName={recipientName}
        personalMessage={personalMessage}
        deliveryMethod={deliveryMethod}
        scheduledDate={scheduledDate}
        selectedVariant={selectedVariant}
        addOnType={addOnSelected && product.addOnType ? product.addOnType : undefined}
        productName={product.name}
        totalInCents={displayPrice}
        vatLine={vatLine}
        vatAmountInCents={vatAmountInCents}
        addOnLabel={product.addOnLabel}
        addOnPriceInCents={product.addOnPriceInCents}
        addOnSelected={addOnSelected}
        onPayClick={() => fireFunnel("pay_click")}
      />
    </Elements>
  );

  // Rustige layout (variant voor verdriet/rouw) — zelfde betaal-plumbing, andere opbouw.
  if ((product as any).checkoutLayout === "rustig") {
    return (
      <>
        <ScrollDepthTracker category="checkout" path={slug} />
        <RustigeCheckout
          product={product as any}
          priceFormatted={priceFormatted}
          paymentNode={paymentNode}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Scroll-diepte op de checkout (gegroepeerd per product-slug) */}
      <ScrollDepthTracker category="checkout" path={slug} />
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Product samenvatting — Calm-stijl: naam · vinkjes · prijs */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <Image
              src="/images/benji-logo-2.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-auto object-contain flex-shrink-0"
              style={{ width: "auto" }}
            />
          </div>
          <h1 className="text-xl font-bold text-stone-800 text-center mb-4">{product.name}</h1>

          {/* Vinkjes (voordelen) — direct onder de naam; valt terug op de beschrijving */}
          {product.benefits && product.benefits.length > 0 ? (
            <>
              <div className="border-t border-stone-200 mb-4" />
              <ul className="space-y-2.5">
                {product.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                      <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#576b8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-stone-700 leading-snug">{benefit}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : product.description ? (
            <>
              <div className="border-t border-stone-200 mb-4" />
              <div className="text-sm text-primary-600 mb-4 leading-relaxed space-y-4">
                {product.description.split("\n\n").map((para, i) => (
                  <p key={i}>
                    {para.split("\n").map((line, j) =>
                      j === 0 ? line : <>{"\n"}<br />{line}</>
                    )}
                  </p>
                ))}
              </div>
            </>
          ) : null}

          {product.imageUrl && (
            <div className="mt-5 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className="w-full rounded-xl" />
            </div>
          )}

          {/* Prijs */}
          <div className="border-t border-stone-200 mt-4 pt-4 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-700">Eenmalig</span>
            <span className="text-2xl font-bold text-primary-700">{priceFormatted}</span>
          </div>
        </div>

        {/* Checkout kaart — naam, email, land, betaalgegevens */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 id="jouw-gegevens" className="text-base font-semibold text-stone-800 mb-5 scroll-mt-6">Jouw gegevens &amp; betaling</h2>

          <div className="space-y-4">
            {/* Naam */}
            <div>
              <label className={labelClass}>Jouw naam</label>
              <input
                id="checkout-naam"
                type="text"
                placeholder="Voor- en achternaam"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className={inputClass}
                required
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
                required
              />
            </div>

            {/* Land — ingeklapt; btw-regel altijd zichtbaar, dropdown alleen indien nodig.
                Tijdelijk verborgen via toonLandKeuze (logica blijft intact). */}
            {toonLandKeuze && (
            <div>
              {vatLine && (
                <p className="text-xs text-stone-500">{vatLine}</p>
              )}
              {!landOpen ? (
                <button
                  type="button"
                  onClick={() => setLandOpen(true)}
                  className="mt-1 text-xs text-stone-400 hover:text-stone-600 underline transition-colors"
                >
                  Woon je buiten Nederland?
                </button>
              ) : (
                <div className="mt-2">
                  <label className={labelClass}>
                    Jouw land{" "}
                    <span className="font-normal text-stone-400 text-xs">(voor btw-berekening)</span>
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Nederland</option>
                    <option value="NL">Nederland</option>
                    <option value="BE">België</option>
                    <option value="OTHER">Buiten de EU / overig</option>
                    {EU_REST.map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            )}

            {/* Cadeau + B2B toggles */}
            <div>
              <div className="flex items-center justify-between">
                {product.giftEnabled && (
                  <button
                    type="button"
                    onClick={() => handleGiftOpen(!giftOpen)}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${giftOpen ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Cadeau geven?
                  </button>
                )}
                {product.b2bEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => setB2bOpen(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors ml-auto"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${b2bOpen ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Zakelijke aankoop?
                  </button>
                )}
              </div>

              {/* Cadeau geven panel */}
              {giftOpen && (
                <div className="mt-3 border border-stone-200 rounded-xl overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-white hover:bg-stone-50 transition-colors">
                    <Checkbox checked={isGift} onChange={handleGiftCheckboxToggle} />
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
                            {product.giftVariants!.map((variant, vi) => {
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
                </div>
              )}

              {/* B2B panel */}
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

          {/* Kassakoopje — extra product, vlak bij de betaalknop */}
          {product.addOnLabel && product.addOnPriceInCents && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setAddOnSelected((v) => !v)}
                className="w-full text-left rounded-xl p-4 transition-all border-2"
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
                    <p className="text-sm font-semibold leading-snug" style={{ color: "#3d3530" }}>{product.addOnLabel}</p>
                    {product.addOnDescription && (
                      <p className="text-xs leading-relaxed mt-0.5" style={{ color: "#b0a8a0" }}>{product.addOnDescription}</p>
                    )}
                    <div className="flex justify-end mt-2">
                      <span
                        className="text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full"
                        style={{ color: "#6d84a8", background: addOnSelected ? "white" : "#e8f0f8" }}
                      >
                        +{new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(product.addOnPriceInCents / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Betaalgegevens — altijd zichtbaar, laadt direct met NL als provisorisch land */}
          <div className={hasExtraOptions ? "mt-6 pt-6 border-t border-stone-100" : "mt-4"}>
            {paymentNode}
          </div>
        </div>

        {(!!product.reviews?.length || !!product.extraTextBlocks?.length) && (
          <div className="mt-6 space-y-6">
            {/* "Dit helpt omdat…" — vrije tekstblokken onder de betaling */}
            {product.extraTextBlocks && product.extraTextBlocks.length > 0 && (
              <div className="space-y-4">
                {product.extraTextBlocks.map((block, i) => (
                  <div key={i} className="bg-primary-50 rounded-2xl border-2 border-primary-600 p-6">
                    {block.title && (
                      <h2 className="text-base font-semibold text-primary-800 mb-3">{block.title}</h2>
                    )}
                    {(block as any).imageUrl && (
                      <div className={block.content.trim() ? "mb-4" : ""}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={(block as any).imageUrl} alt={block.title ?? ""} loading="lazy" decoding="async" className="w-full rounded-xl" />
                      </div>
                    )}
                    {block.content.trim() && (
                      <div className="text-sm text-primary-700 leading-relaxed space-y-4">
                        {block.content.split("\n\n").map((para, j) => (
                          <p key={j}>
                            {para.split("\n").map((line, k) =>
                              k === 0 ? line : <>{"\n"}<br />{line}</>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reviews / testimonials (indien ingesteld via admin) */}
            {product.reviews && product.reviews.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-stone-800 mb-3">Hoe anderen dit hebben ervaren</h2>
                <div className="space-y-3">
                  {product.reviews.map((review, i) => (
                    <div key={i} className="bg-white rounded-2xl border-2 border-primary-200 p-5">
                      <p className="text-sm text-stone-600 leading-relaxed italic mb-3">
                        &ldquo;{review.text}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        {(review as any).imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(review as any).imageUrl} alt={review.author} loading="lazy" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-xs flex-shrink-0 text-primary-600">
                            {review.author.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-stone-700">{review.author}</p>
                          {review.role && (
                            <p className="text-xs text-stone-400">{review.role}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                document.getElementById("jouw-gegevens")?.scrollIntoView({ behavior: "smooth", block: "start" });
                setTimeout(() => document.getElementById("checkout-naam")?.focus({ preventScroll: true }), 450);
              }}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-base"
            >
              {product.buttonText || "Betalen"}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-6">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          {" · "}
          <Link href="/algemene-voorwaarden" className="hover:underline">Algemene voorwaarden</Link>
        </p>
      </main>
    </div>
  );
}

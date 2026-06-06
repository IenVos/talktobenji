"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  ShoppingBag,
  Star,
  ChevronRight,
  MessageSquare,
  UserPlus,
  LogIn,
  Mail,
} from "lucide-react";

function BedanktContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const itemName = searchParams?.get("item") ?? null;
  const addonParam = searchParams?.get("addon") ?? null;
  const boughtBenjiAddon = addonParam === "benji_access";
  const paymentIntentId = searchParams?.get("payment_intent") ?? null;

  // Nieuwsbrief-opt-in: bewust pas hier (na de aankoop) i.p.v. in de checkout,
  // zodat er rond de betaalknop geen extra drempel staat.
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const subscribeNewsletter = async () => {
    if (!paymentIntentId) return;
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });
      setNewsletterStatus(res.ok ? "done" : "error");
    } catch {
      setNewsletterStatus("error");
    }
  };

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    session?.userId
      ? { userId: session.userId as string, email: session.user?.email || undefined }
      : "skip"
  );

  const isLoading = status === "loading";
  const isLoggedIn = !!session?.userId;
  const subType = subscription?.subscriptionType ?? "free";
  const hasFullAccess = subType === "uitgebreid" || subType === "alles_in_1";

  // Facebook Pixel – Subscribe event bij aankoop
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Subscribe");
    }
  }, []);

  // Google Ads – conversie bijhouden bij aankoop
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-11471624930/Tc0WCKDwo5wcEOK1jN4q",
      });
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-12"
      style={{ backgroundColor: "#f0f4f8" }}
    >
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <Image
          src="/images/benji-logo-2.png"
          alt="Benji"
          width={28}
          height={28}
          className="object-contain"
          style={{ width: "auto", height: "auto" }}
        />
        <span className="text-sm font-medium text-primary-700">Talk to Benji</span>
      </Link>

      <div className="w-full max-w-md space-y-5">
        {/* Bedankt-kaart */}
        <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
            <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Bedankt voor je bestelling!
            </h1>
            {itemName ? (
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">{itemName}</span> is onderweg naar je toe.
                Je ontvangt een bevestiging per e-mail.
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Je bestelling is geplaatst. Je ontvangt een bevestiging per e-mail.
              </p>
            )}
          </div>

          {!isLoading && isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
              <Link
                href="/account/onderweg"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                <ShoppingBag size={16} />
                Naar de shop
              </Link>
              <Link
                href="/?welcome=1"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <MessageSquare size={16} />
                Gesprek met Benji
              </Link>
            </div>
          )}

          {!isLoading && !isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
              <Link
                href="/inloggen"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                <LogIn size={16} />
                Inloggen
              </Link>
              <Link
                href="/benji"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <MessageSquare size={16} />
                Praat met Benji
              </Link>
            </div>
          )}
        </div>

        {/* Nieuwsbrief-opt-in — pas ná de aankoop, belast de checkout niet */}
        {paymentIntentId && newsletterStatus !== "done" && (
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Af en toe iets van ons horen?</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Zo nu en dan een rustig bericht — verhalen, troost en kleine handvatten. Geen spam, uitschrijven kan altijd.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={subscribeNewsletter}
              disabled={newsletterStatus === "loading"}
              className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
            >
              {newsletterStatus === "loading" ? "Bezig…" : "Ja, houd me op de hoogte"}
            </button>
            {newsletterStatus === "error" && (
              <p className="text-xs text-red-600 text-center">Aanmelden lukte even niet. Probeer het zo nog eens.</p>
            )}
          </div>
        )}

        {paymentIntentId && newsletterStatus === "done" && (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <p className="text-sm text-gray-700">Gelukt — je staat op de lijst. Fijn dat je erbij bent.</p>
          </div>
        )}

        {/* Geen account — maak er een aan */}
        {!isLoading && !isLoggedIn && (
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${boughtBenjiAddon ? "border-2 border-primary-400" : "border border-primary-100"}`}>
            <div>
              {boughtBenjiAddon ? (
                <>
                  <p className="text-xs font-medium text-primary-500 uppercase tracking-wide mb-1">
                    Activeer je toegang
                  </p>
                  <h2 className="text-base font-semibold text-gray-900">
                    Maak een account aan om Benji te ontgrendelen
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Je hebt 30 dagen toegang tot Benji betaald. Maak een gratis account aan met hetzelfde e-mailadres — je toegang wordt automatisch geactiveerd.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-primary-500 uppercase tracking-wide mb-1">
                    Gratis account aanmaken
                  </p>
                  <h2 className="text-base font-semibold text-gray-900">
                    Haal meer uit Benji
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Met een account kun je gesprekken terugvinden, je voortgang bijhouden en Benji nog beter op jou laten aansluiten.
                  </p>
                </>
              )}
            </div>
            <Link
              href="/registreren"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={18} className="text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{boughtBenjiAddon ? "Account aanmaken & toegang activeren" : "Gratis account"}</p>
                  <p className="text-xs text-gray-600">{boughtBenjiAddon ? "Gebruik hetzelfde e-mailadres als bij je bestelling" : "Gesprekken · Voortgang · Persoonlijke ervaring"}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-primary-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Ingelogd maar free/trial — nudge naar Benji */}
        {!isLoading && isLoggedIn && !hasFullAccess && subscription && (
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wide mb-1">
                Jouw gratis account staat klaar
              </p>
              <h2 className="text-base font-semibold text-gray-900">
                Ga in gesprek met Benji
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Je kunt nu gratis met Benji praten. Deel wat er speelt — Benji luistert.
              </p>
            </div>

            <Link
              href="/?welcome=1"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Gesprek starten</p>
                  <p className="text-xs text-gray-600">Benji staat voor je klaar</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-primary-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Volledig abonnement — vriendelijke afsluiting */}
        {!isLoading && isLoggedIn && hasFullAccess && (
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-5 text-center">
            <p className="text-sm text-primary-800">
              Fijn dat je er bent. Benji staat voor je klaar als je wilt praten.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BedanktPage() {
  return (
    <Suspense>
      <BedanktContent />
    </Suspense>
  );
}

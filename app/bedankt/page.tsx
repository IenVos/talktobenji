"use client";

import { Suspense, useEffect } from "react";
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
} from "lucide-react";

function BedanktContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const itemName = searchParams?.get("item") ?? null;

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
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <MessageSquare size={16} />
                Praat met Benji
              </Link>
            </div>
          )}
        </div>

        {/* Geen account — maak er een aan */}
        {!isLoading && !isLoggedIn && (
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wide mb-1">
                Gratis account aanmaken
              </p>
              <h2 className="text-base font-semibold text-gray-900">
                Haal meer uit Benji
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Met een account kun je gesprekken terugvinden, je voortgang bijhouden en Benji nog beter op jou laten aansluiten.
              </p>
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
                  <p className="text-sm font-semibold text-gray-900">Gratis account</p>
                  <p className="text-xs text-gray-600">Gesprekken · Voortgang · Persoonlijke ervaring</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-primary-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Ingelogd maar free/trial — upgrade */}
        {!isLoading && isLoggedIn && !hasFullAccess && subscription && (
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wide mb-1">
                Ontdek meer van Benji
              </p>
              <h2 className="text-base font-semibold text-gray-900">
                Een heel jaar lang Benji
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Praten met Benji, dagelijkse check-ins, reflecties, memories, handreikingen en meer — alles inbegrepen voor één prijs.
              </p>
            </div>

            <Link
              href="/lp/jaar-toegang"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Star size={18} className="text-primary-600" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">1 jaar toegang · Alles inbegrepen</p>
                  <p className="text-xs text-gray-600">€&nbsp;97 eenmalig · Geen abonnement · Geen verplichtingen</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-primary-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <p className="text-xs text-center">
              <Link href="/lp/jaar-toegang" className="text-primary-500 hover:underline">
                Bekijk wat er allemaal in zit →
              </Link>
            </p>
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

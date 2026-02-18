"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";

const TRIAL_ENDED_KEY = "trialEndedSeen";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface TrialBannerProps {
  userId: string;
  email?: string;
}

export function TrialBanner({ userId, email }: TrialBannerProps) {
  const pathname = usePathname();
  const subscription = useQuery(api.subscriptions.getUserSubscription, {
    userId,
    email,
  });
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    if (!subscription) return;
    if (
      subscription.subscriptionType === "free" &&
      "expiresAt" in subscription &&
      subscription.expiresAt &&
      subscription.expiresAt < Date.now() &&
      subscription.expiresAt > Date.now() - SEVEN_DAYS_MS
    ) {
      try {
        const seen = localStorage.getItem(TRIAL_ENDED_KEY);
        if (!seen) {
          setPopupVisible(true);
        }
      } catch {
        // localStorage niet beschikbaar (SSR/privé-modus)
      }
    }
  }, [subscription]);

  const dismissPopup = () => {
    try {
      localStorage.setItem(TRIAL_ENDED_KEY, "1");
    } catch {}
    setPopupVisible(false);
  };

  if (!subscription) return null;

  // Op de abonnement-pagina geen banner tonen
  if (pathname?.startsWith("/account/abonnement")) return null;

  // Trial banner
  if (subscription.subscriptionType === "trial") {
    const daysLeft = subscription.trialDaysLeft ?? 0;
    const dayText = daysLeft === 1 ? "dag" : "dagen";

    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
        <Sparkles size={16} className="text-amber-500 flex-shrink-0" />
        <p className="flex-1 text-sm text-amber-800">
          Je proeft Benji gratis — nog{" "}
          <strong>
            {daysLeft} {dayText}
          </strong>
          . Upgrade om alles te blijven gebruiken.
        </p>
        <Link
          href="/account/abonnement?upgrade=true"
          className="flex-shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          Mijn abonnement
        </Link>
      </div>
    );
  }

  // Verlopen trial popup (éénmalig)
  if (popupVisible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/30"
          onClick={dismissPopup}
        />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
          <button
            type="button"
            onClick={dismissPopup}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">
              Je proefperiode is afgelopen
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Je gesprekken, reflecties en doelen staan nog steeds voor je klaar.
            Upgrade om er weer volop gebruik van te maken.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/account/abonnement?upgrade=true"
              onClick={dismissPopup}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-amber-600 transition-colors"
            >
              Mijn abonnement
            </Link>
            <button
              type="button"
              onClick={dismissPopup}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Misschien later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

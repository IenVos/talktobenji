"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Sparkles, Star } from "lucide-react";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { useState } from "react";

export default function AbonnementPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const showUpgrade = searchParams?.get("upgrade") === "true";

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    session?.userId ? { userId: session.userId as string, email: session.user?.email || undefined } : "skip"
  );

  const [openCard, setOpenCard] = useState<string | null>(null);

  // Upgrade view (niet tonen voor alles_in_1 — er is niets meer om naar te upgraden)
  if (showUpgrade && subscription && subscription.subscriptionType !== "alles_in_1") {
    const currentTier = subscription.subscriptionType;

    return (
      <div className="max-w-2xl space-y-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Terug naar Mijn plek
        </Link>

        {session?.userId && (
          <SubscriptionStatus
            userId={session.userId as string}
            email={session.user?.email || undefined}
          />
        )}

        <h2 className="text-xl font-semibold text-gray-900">
          Upgrade je abonnement
        </h2>

        <div className="space-y-3">
          {(currentTier === "free" || currentTier === "trial") && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-300 overflow-hidden">
              <button
                onClick={() => setOpenCard(openCard === "uitgebreid" ? null : "uitgebreid")}
                className="w-full flex items-center justify-between gap-2 p-5 text-left"
              >
                <span className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  Benji Uitgebreid — € 6,99 per maand
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${openCard === "uitgebreid" ? "rotate-180" : ""}`}
                />
              </button>
              {openCard === "uitgebreid" && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 pt-4">
                    Voor wie Benji regelmatig wil gebruiken. Je kunt zoveel gesprekken voeren als je wilt, zonder limiet. Daarnaast kun je dagelijkse check-ins doen, persoonlijke doelen bijhouden en reflecties opslaan om later terug te lezen.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    Benji wordt een plek waar je steeds weer naartoe kunt, op je eigen tempo.
                  </p>
                  <button className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm">
                    Kies Benji Uitgebreid
                  </button>
                </div>
              )}
            </div>
          )}

          {(currentTier === "free" || currentTier === "trial" || currentTier === "uitgebreid") && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-300 overflow-hidden">
              <button
                onClick={() => setOpenCard(openCard === "alles" ? null : "alles")}
                className="w-full flex items-center justify-between gap-2 p-5 text-left"
              >
                <span className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Star size={18} className="text-purple-600" fill="currentColor" />
                  Benji Alles in 1 — € 11,99 per maand
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${openCard === "alles" ? "rotate-180" : ""}`}
                />
              </button>
              {openCard === "alles" && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 pt-4">
                    Voor wie Benji als een vast steunpunt wil hebben. Je krijgt alles van Benji Uitgebreid, plus toegang tot memories (om mooie herinneringen vast te leggen), inspiratie en troost (teksten en gedichten die kunnen helpen), en handreikingen voor moeilijke momenten.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    Benji wordt een plek die volledig op jou is afgestemd, waar je altijd naartoe kunt.
                  </p>
                  <button className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm">
                    Kies Benji Alles in 1
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normale view
  return (
    <div className="max-w-2xl space-y-6">
      {session?.userId && (
        <SubscriptionStatus
          userId={session.userId as string}
          email={session.user?.email || undefined}
        />
      )}

      {subscription?.subscriptionType !== "alles_in_1" && (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Alle abonnementen
          </h3>
          <Link
            href="/account/abonnement?upgrade=true"
            className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm"
          >
            Bekijk alle opties
          </Link>
        </div>
      )}

      {subscription && subscription.subscriptionType !== "free" && (
        <div className="px-1">
          <p className="text-xs text-gray-400 mb-2">
            Wil je je abonnement stopzetten? Stuur ons een bericht en we regelen het voor je.
          </p>
          <a
            href={`mailto:contactmetien@talktobenji.com?subject=Abonnement stopzetten&body=Hallo,%0D%0A%0D%0AIk wil mijn abonnement stopzetten.%0D%0A%0D%0AMijn e-mailadres: ${encodeURIComponent(session?.user?.email || "")}`}
            className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-500 rounded-lg transition-colors text-xs"
          >
            Abonnement stopzetten
          </a>
        </div>
      )}
    </div>
  );
}

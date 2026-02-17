"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";

export default function AbonnementPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const showUpgrade = searchParams?.get("upgrade") === "true";

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    session?.userId ? { userId: session.userId as string, email: session.user?.email || undefined } : "skip"
  );

  // Upgrade view
  if (showUpgrade && subscription) {
    const currentTier = subscription.subscriptionType;

    return (
      <div className="max-w-2xl">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Terug naar Mijn plek
        </Link>

        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Upgrade je abonnement
        </h2>

        <div className="space-y-4">
          {currentTier === "free" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-300 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Benji Uitgebreid — € 6,99 per maand
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Per jaar betalen? Dan is het € 54 — dat zijn twee maanden gratis.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Onbeperkte gesprekken, dagelijkse check-ins, persoonlijke doelen en reflecties.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm">
                  Kies Benji Uitgebreid
                </button>
              </div>
            </div>
          )}

          {(currentTier === "free" || currentTier === "uitgebreid") && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-300 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star size={20} className="text-purple-600" fill="currentColor" />
                  Benji Alles in 1 — € 11,99 per maand
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Per jaar is het € 89.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Alles van Uitgebreid plus memories, inspiratie & troost, en handreikingen.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm">
                  Kies Benji Alles in 1
                </button>
              </div>
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

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Alle abonnementen
        </h3>
        <Link
          href="/prijzen"
          className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm"
        >
          Bekijk alle opties
        </Link>
      </div>
    </div>
  );
}

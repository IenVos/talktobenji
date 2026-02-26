"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Lock, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface ConversationLimitGateProps {
  userId?: string;
  email?: string;
  anonymousCount?: number;
  children: React.ReactNode;
}

export function ConversationLimitGate({
  userId,
  email,
  anonymousCount,
  children,
}: ConversationLimitGateProps) {
  const usage = useQuery(
    api.subscriptions.getConversationCount,
    userId ? { userId, email } : "skip"
  );

  const [testLimit, setTestLimit] = useState(false);
  useEffect(() => {
    setTestLimit(new URLSearchParams(window.location.search).get("testLimit") === "1");
  }, []);

  // Loading state
  if (userId && usage === undefined) {
    return <>{children}</>;
  }

  // Gast: limiet van 5 gesprekken
  const guestLimitReached = !userId && (anonymousCount ?? 0) >= 5;

  // Ingelogde gebruiker: maandlimiet
  const remaining = (usage?.limit ?? 0) - (usage?.count ?? 0);
  const userLimitReached = testLimit || (!!(userId && usage && !usage.hasUnlimited && remaining <= 0));

  const limitReached = guestLimitReached || userLimitReached;

  return (
    <>
      {children}
      {limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            {guestLimitReached ? (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                  <UserPlus size={22} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Je hebt 5 gratis gesprekken gehad
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Maak een gratis account aan en chat nog <strong>10 keer per maand</strong> met Benji.
                  De eerste 7 dagen heb je toegang tot alles.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/registreren"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Gratis account aanmaken
                  </Link>
                  <Link
                    href="/inloggen"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
                  >
                    Ik heb al een account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                  <Lock size={22} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Wil je verder praten?
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  Je hebt deze maand je gratis gesprekken al gebruikt. Bekijk de mogelijkheden.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href="/account/abonnement?upgrade=true"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Mijn abonnement
                  </Link>
                  <Link
                    href="/account"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
                  >
                    Mijn plek
                  </Link>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Je limiet wordt automatisch gereset aan het begin van volgende maand.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

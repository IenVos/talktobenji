"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Lock } from "lucide-react";

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

  // Nog aan het laden — gewoon tonen
  if (userId && usage === undefined) return <>{children}</>;

  const count = usage?.count ?? 0;
  const limit = usage?.limit ?? 3;
  const isLapsed = !!(usage?.isLapsed);
  const isFree = !!(usage as any)?.isFree;

  const limitReached = (isLapsed || isFree) && count >= limit;

  const title = isLapsed
    ? "Je toegang is verlopen"
    : "Je gratis gesprekken zijn op";

  const body = isLapsed
    ? "Je hebt je 3 gratis gesprekken na afloop gebruikt. Verleng je toegang om verder te gaan met Benji."
    : "Je hebt je 3 gratis gesprekken gebruikt. Neem een abonnement om verder te gaan met Benji.";

  return (
    <>
      {children}
      {limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
              <Lock size={22} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {body}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/betalen/benji-jaar"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isLapsed ? "Toegang verlengen" : "Abonnement nemen"}
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl text-sm transition-colors"
              >
                Naar mijn account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

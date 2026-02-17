"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Lock, MessageCircle } from "lucide-react";

interface ConversationLimitGateProps {
  userId?: string;
  email?: string;
  children: React.ReactNode;
}

export function ConversationLimitGate({
  userId,
  email,
  children,
}: ConversationLimitGateProps) {
  const usage = useQuery(
    api.subscriptions.getConversationCount,
    userId ? { userId, email } : "skip"
  );

  // Loading state
  if (userId && usage === undefined) {
    return <>{children}</>;
  }

  // No user or unlimited access
  if (!userId || !usage || usage.hasUnlimited) {
    return <>{children}</>;
  }

  // Check if limit reached
  const remaining = usage.limit! - usage.count;
  const limitReached = remaining <= 0;

  if (limitReached) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
            <Lock size={36} className="text-primary-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Je maandelijkse limiet is bereikt
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-2">
            Je hebt deze maand al {usage.count} gesprekken gevoerd. Met een gratis account kun je tot {usage.limit} gesprekken per maand voeren.
          </p>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            Wil je vaker met Benji praten? Upgrade naar <strong>Benji Uitgebreid</strong> voor onbeperkte gesprekken.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/prijzen"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <MessageCircle size={18} />
              Bekijk abonnementen
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-lg font-medium transition-colors"
            >
              Terug naar account
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Je limiet wordt automatisch gereset aan het begin van volgende maand.
          </p>
        </div>
      </div>
    );
  }

  // Has access
  return <>{children}</>;
}

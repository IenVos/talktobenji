"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface ConversationLimitBannerProps {
  userId: string;
  email?: string;
}

export function ConversationLimitBanner({ userId, email }: ConversationLimitBannerProps) {
  const usage = useQuery(api.subscriptions.getConversationCount, {
    userId,
    email,
  });

  if (!usage || usage.hasUnlimited) return null;

  const remaining = usage.limit! - usage.count;
  const isLow = remaining <= 3;
  const isOut = remaining <= 0;

  if (!isLow && !isOut) return null;

  return (
    <div
      className={`mb-4 p-4 rounded-lg border ${
        isOut
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          size={20}
          className={isOut ? "text-red-600 mt-0.5" : "text-amber-600 mt-0.5"}
        />
        <div className="flex-1">
          <p className={`text-sm font-medium ${isOut ? "text-red-900" : "text-amber-900"}`}>
            {isOut
              ? "Je hebt je maandelijkse gesprekken limiet bereikt"
              : `Je hebt nog ${remaining} gratis ${remaining === 1 ? "gesprek" : "gesprekken"} over deze maand`}
          </p>
          <p className={`text-sm mt-1 ${isOut ? "text-red-700" : "text-amber-700"}`}>
            {isOut
              ? "Upgrade naar Benji Uitgebreid voor onbeperkte gesprekken"
              : "Wil je vaker met Benji praten? Overweeg een upgrade."}
          </p>
          <Link
            href="/prijzen"
            className={`inline-block mt-2 text-sm font-medium underline ${
              isOut ? "text-red-800 hover:text-red-900" : "text-amber-800 hover:text-amber-900"
            }`}
          >
            Bekijk abonnementen
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Check, Sparkles, Star } from "lucide-react";

interface SubscriptionStatusProps {
  userId: string;
  email?: string;
}

export function SubscriptionStatus({ userId, email }: SubscriptionStatusProps) {
  const subscription = useQuery(api.subscriptions.getUserSubscription, {
    userId,
    email,
  });

  const usage = useQuery(api.subscriptions.getConversationCount, {
    userId,
    email,
  });

  if (!subscription) return null;

  const planNames = {
    free: "Gratis account",
    trial: "Gratis proefperiode",
    uitgebreid: "Benji Uitgebreid",
    alles_in_1: "Benji Alles in 1",
  };

  const planColors = {
    free: "bg-green-50 text-green-700 border-green-200",
    trial: "bg-amber-50 text-amber-700 border-amber-200",
    uitgebreid: "bg-amber-50 text-amber-700 border-amber-200",
    alles_in_1: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const iconColors = {
    free: "text-green-600",
    trial: "text-amber-500",
    uitgebreid: "text-amber-500",
    alles_in_1: "text-purple-600",
  };

  const planIcons = {
    free: Check,
    trial: Sparkles,
    uitgebreid: Sparkles,
    alles_in_1: Star,
  };

  const Icon = planIcons[subscription.subscriptionType];

  return (
    <div className="bg-white rounded-xl border border-primary-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Jouw abonnement
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
            planColors[subscription.subscriptionType]
          }`}
        >
          <Icon size={18} className={iconColors[subscription.subscriptionType]} />
          <span className="font-medium">{planNames[subscription.subscriptionType]}</span>
        </div>
        {subscription.isAdmin && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
            Admin
          </span>
        )}
      </div>

      {/* Conversation usage voor free tier */}
      {subscription.subscriptionType === "free" && usage && !usage.hasUnlimited && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Gesprekken deze maand</span>
            <span className="font-medium text-gray-900">
              {usage.count} / {usage.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((usage.count / usage.limit!) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Features */}
      <div className="space-y-2 mb-4">
        {subscription.subscriptionType === "free" && (
          <>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span>10 gesprekken per maand</span>
            </div>
          </>
        )}

        {subscription.subscriptionType === "trial" && (
          <>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>Volledige toegang tot alles</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>
                Nog{" "}
                {subscription.trialDaysLeft ?? 0}{" "}
                {(subscription.trialDaysLeft ?? 0) === 1 ? "dag" : "dagen"} resterend
              </span>
            </div>
          </>
        )}

        {subscription.subscriptionType === "uitgebreid" && (
          <>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>Onbeperkte gesprekken</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>Dagelijkse check-ins en doelen</span>
            </div>
          </>
        )}

        {subscription.subscriptionType === "alles_in_1" && (
          <>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>Alles van Benji Uitgebreid</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Check size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>Memories, inspiratie & handreikingen</span>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

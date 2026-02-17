"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Check, Sparkles, Star } from "lucide-react";

interface UpgradeBadgeProps {
  userId: string;
  email?: string;
}

export function UpgradeBadge({ userId, email }: UpgradeBadgeProps) {
  const subscription = useQuery(api.subscriptions.getUserSubscription, {
    userId,
    email,
  });

  if (!subscription) return null;

  const subType = subscription.subscriptionType;

  // Free tier: groen vinkje, klikbaar voor upgrade
  if (subType === "free") {
    return (
      <Link
        href="/account/abonnement?upgrade=true"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
        title="Upgrade je abonnement"
      >
        <Check size={14} className="text-green-600" strokeWidth={3} />
      </Link>
    );
  }

  // Uitgebreid tier: gouden sparkles, klikbaar voor upgrade
  if (subType === "uitgebreid") {
    return (
      <Link
        href="/account/abonnement?upgrade=true"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
        title="Upgrade naar Alles in 1"
      >
        <Sparkles size={14} className="text-amber-500" />
      </Link>
    );
  }

  // Alles in 1 tier: paarse star, niet klikbaar
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100">
      <Star size={14} className="text-purple-600" fill="currentColor" />
    </span>
  );
}

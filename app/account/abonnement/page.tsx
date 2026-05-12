"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { useState } from "react";

const CANCEL_QUESTIONS = [
  {
    key: "reason",
    vraag: "Waarom stop je?",
    opties: [
      "Ik gebruik het te weinig",
      "Het is te duur voor mij",
      "Het is niet wat ik zocht",
      "Mijn situatie is veranderd",
    ],
  },
  {
    key: "valuable",
    vraag: "Wat vond je het meest waardevol?",
    opties: [
      "De gesprekken met Benji",
      "Reflecties en check-ins",
      "Inspiratie en handreikingen",
      "Heb het weinig gebruikt",
    ],
  },
  {
    key: "wouldRecommend",
    vraag: "Zou je Benji aanraden aan iemand die het nodig heeft?",
    opties: ["Ja, zeker", "Misschien", "Nee"],
  },
];

export default function AbonnementPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const showUpgrade = searchParams?.get("upgrade") === "true";

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    session?.userId ? { userId: session.userId as string, email: session.user?.email || undefined } : "skip"
  );

  const [showCancel, setShowCancel] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cancelDone, setCancelDone] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const cancelOwnSubscription = useMutation(api.subscriptions.cancelOwnSubscription);

  const allAnswered = CANCEL_QUESTIONS.every((q) => answers[q.key]);

  async function handleCancel() {
    if (!session?.userId || !allAnswered) return;
    setCancelling(true);
    try {
      const result = await cancelOwnSubscription({
        userId: session.userId as string,
        reason: answers.reason,
        valuable: answers.valuable,
        wouldRecommend: answers.wouldRecommend,
      });
      setExpiresAt(result.expiresAt);
      setCancelDone(true);
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  // Upgrade view (niet tonen voor alles_in_1 — er is niets meer om naar te upgraden)
  if (showUpgrade && subscription && subscription.subscriptionType !== "alles_in_1") {
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

        <div className="bg-white rounded-xl border border-primary-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-primary-600" fill="currentColor" />
            <h2 className="text-base font-semibold text-gray-900">30 dagen onbeperkt met Benji</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Praat zo vaak als je wilt met Benji — dag en nacht. Inclusief reflecties, doelen, inspiratie en handreikingen.
          </p>
          <Link
            href="/benji"
            className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm font-medium"
          >
            Praat met Benji
          </Link>
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

      {(subscription?.subscriptionType === "free" || subscription?.subscriptionType === "trial") && (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-2">30 dagen onbeperkt met Benji</h3>
          <p className="text-sm text-gray-600 mb-4">Praat zo vaak als je wilt — inclusief reflecties, doelen, inspiratie en handreikingen.</p>
          <Link
            href="/benji"
            className="block w-full text-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm"
          >
            Meer weten
          </Link>
        </div>
      )}

      {/* Bevestiging na opzegging */}
      {cancelDone && expiresAt && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-700 space-y-1">
          <p className="font-medium text-gray-900">Je abonnement is opgezegd.</p>
          <p>
            Je hebt nog toegang tot en met{" "}
            <span className="font-medium">
              {new Date(expiresAt).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            .
          </p>
        </div>
      )}

      {/* Opzeg-flow — alleen voor legacy recurring abonnementen, niet voor eenmalige toegang */}
      {subscription &&
        subscription.subscriptionType !== "free" &&
        subscription.subscriptionType !== "alles_in_1" &&
        subscription.subscriptionType !== "niet_alleen" &&
        subscription.status !== "cancelled" &&
        !cancelDone && (
          <div className="px-1">
            {!showCancel ? (
              <button
                onClick={() => setShowCancel(true)}
                className="text-xs text-gray-400 hover:text-gray-500 underline underline-offset-2 transition-colors"
              >
                Abonnement opzeggen
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                <p className="text-sm text-gray-700">
                  Jammer dat je wilt stoppen. Help ons te begrijpen waarom, dan kunnen we Benji blijven verbeteren.
                </p>

                {CANCEL_QUESTIONS.map((q) => (
                  <div key={q.key}>
                    <p className="text-sm font-medium text-gray-800 mb-2">{q.vraag}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.opties.map((optie) => (
                        <button
                          key={optie}
                          onClick={() => setAnswers((a) => ({ ...a, [q.key]: optie }))}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            answers[q.key] === optie
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary-400"
                          }`}
                        >
                          {optie}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleCancel}
                    disabled={!allAnswered || cancelling}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cancelling ? "Bezig…" : "Abo opzeggen"}
                  </button>
                  <button
                    onClick={() => { setShowCancel(false); setAnswers({}); }}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Toch niet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

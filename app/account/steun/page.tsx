"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart, Euro, Compass, MessageCircleHeart } from "lucide-react";
import Link from "next/link";
import { FeedbackModal } from "@/components/chat/FeedbackModal";

const FIXED_AMOUNTS = [5, 10, 25];


export default function AccountSteunPage() {
  const { data: session } = useSession();

  // Load onderweg items for mini-carousel
  const onderwegItems = useQuery(api.onderweg.listActiveWithUrls, {});

  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Open feedback popup direct als ?feedback=open in de URL staat
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("feedback") === "open") {
      setFeedbackOpen(true);
    }
  }, []);

  const steunItems = onderwegItems;

  const handleDonate = (amount: number | null) => {
    if (amount !== null) {
      alert(`Bedankt voor je interesse! Donatie van €${amount} komt binnenkort.`);
    }
  };

  const handleCustomDonate = () => {
    const val = parseFloat(customAmount.replace(",", "."));
    if (!isNaN(val) && val >= 1) {
      handleDonate(val);
      setCustomAmount("");
      setShowCustomInput(false);
    } else {
      alert("Vul een bedrag in van minimaal €1.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback sectie – compact blokje */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <img src="/images/benji-logo-2.png" alt="Benji" width={28} height={28} className="flex-shrink-0 object-contain brightness-50" />
          <h2 className="text-lg font-semibold text-primary-900">Samen maken we Benji beter</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Benji is er 24/7 voor iedereen die behoefte heeft aan een luisterend oor. Jouw ervaring helpt ons om Benji nog warmer, slimmer en behulpzamer te maken. Vertel ons wat je fijn vindt, wat beter kan, of deel een idee.
        </p>
        <p className="text-xs mb-5" style={{ color: "var(--account-accent)" }}>
          Elk bericht wordt gelezen. Dankzij jouw feedback wordt Benji elke dag een stukje beter voor iedereen.
        </p>
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm text-white"
          style={{ backgroundColor: "var(--account-accent)" }}
        >
          <MessageCircleHeart size={18} />
          Feedback geven
        </button>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userId={session?.userId ?? undefined}
        userEmail={session?.user?.email ?? undefined}
      />

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-6">
          <Heart size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Waarom Benji steunen?</h2>
            <p className="text-sm text-gray-600 mt-1">Jouw bijdrage maakt het verschil</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            Talk To Benji is er voor iedereen die te maken heeft met rouw, verlies of verdriet. Of je nu een
            dierbare bent verloren, je huisdier mist, of gewoon even wil praten, Benji is er dag en nacht,
            zonder oordeel.
          </p>
          <p>
            Wil je Benji extra steunen? Een donatie helpt ons om de techniek te onderhouden, Benji verder te
            verbeteren, en meer mensen te bereiken die een luisterend oor nodig hebben. Jouw bijdrage maakt
            het verschil.
          </p>
        </div>
      </div>

      {/* Iets voor onderweg mini-carousel */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900 mb-4">
          <Compass size={20} className="text-primary-500" />
          Iets voor onderweg
        </h3>
        <p className="text-sm text-gray-700 mb-2">
          Kleine dingen met betekenis die je onderweg kunnen dragen, een kaart, boek of iets anders
          dat troost en herinnering biedt. De opbrengst gaat naar Benji.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Kijk gerust eens rond — misschien vind je iets dat jou of iemand anders een beetje troost of inspireert.{" "}
          <Link href="/account/onderweg" className="text-primary-600 hover:text-primary-700 underline">
            Bekijk het aanbod →
          </Link>
        </p>

        {onderwegItems === undefined ? (
          <div className="py-6 flex justify-center">
            <div className="animate-pulse rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : !steunItems || steunItems.length === 0 ? (
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-sm text-primary-800">Binnenkort beschikbaar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {steunItems.slice(0, 3).map((item) => (
              <Link
                key={item._id}
                href={`/account/onderweg?title=${encodeURIComponent(item.title || "")}`}
                className="group relative"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-primary-50">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass size={20} className="text-primary-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col bg-black/20 rounded-lg">
                    <div className="flex-1 flex items-center justify-center px-2">
                      {item.title && (
                        <p className="text-[11px] sm:text-xs font-semibold text-white text-center leading-snug drop-shadow-md text-balance">
                          {item.title}
                        </p>
                      )}
                    </div>
                    {(item.paymentUrl || (item.priceCents != null && item.priceCents > 0)) && (
                      <div className="flex flex-col items-center gap-0.5 px-2 pb-2">
                        {item.priceCents != null && item.priceCents > 0 && (
                          <span className="text-[10px] text-white/80 font-medium drop-shadow-sm">
                            €{(item.priceCents / 100).toFixed(2)}
                          </span>
                        )}
                        {item.paymentUrl && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-white/90 text-primary-800 rounded text-[9px] font-medium">
                            {(item as any).buttonLabel || "Bestellen"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

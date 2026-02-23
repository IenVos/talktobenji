"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, ArrowRight } from "lucide-react";
import { HeaderBar } from "@/components/chat/HeaderBar";

export default function BetaaldPage() {
  const { data: session } = useSession();
  const naam = session?.user?.name?.split(" ")[0] || null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <HeaderBar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-8">

          {/* Icoon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center">
              <Heart size={36} className="text-primary-600" fill="currentColor" />
            </div>
          </div>

          {/* Titel */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {naam ? `Fijn dat je er bent, ${naam}.` : "Fijn dat je er bent."}
            </h1>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
              Je abonnement is geactiveerd. Benji is er nu volledig voor jou —
              wanneer je wilt praten, reflecteren of gewoon even wilt stilstaan.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-200 p-6 text-left space-y-2">
            <p className="text-sm font-medium text-primary-700">Wat je nu kunt doen:</p>
            <ul className="text-sm text-gray-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">→</span>
                Ga verder waar je gebleven was
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">→</span>
                Verken alles wat er voor je klaarstaat in je account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">→</span>
                Begin een nieuw gesprek met Benji
              </li>
            </ul>
          </div>

          {/* Knoppen */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Naar mijn account
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-primary-300 text-primary-700 rounded-xl font-medium hover:border-primary-500 transition-colors"
                >
                  Gesprek starten
                </Link>
              </>
            ) : (
              <Link
                href="/inloggen"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Inloggen en verder gaan
                <ArrowRight size={18} />
              </Link>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Heb je vragen? Mail ons op{" "}
            <a
              href="mailto:contactmetien@talktobenji.com"
              className="text-primary-600 hover:underline"
            >
              contactmetien@talktobenji.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Wat kost Benji? · Talk To Benji",
  description: "Probeer Benji gratis of kies een abonnement dat bij je past. Vanaf €6,99 per maand.",
};

export default function PrijzenPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <ScrollToTop />
      <HeaderBar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Intro */}
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
            Wat kost Benji?
          </h1>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Je kunt Benji altijd even proberen, zonder account en zonder betaling. Gewoon beginnen, zien of het bij je past. Wil je Benji vaker gebruiken? Dan zijn er drie mogelijkheden.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="space-y-6 max-w-2xl mx-auto mb-12">
          {/* Gratis Account */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6 sm:p-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Gewoon proberen — Gratis
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Begin een gesprek, zonder dat je meteen iets hoeft aan te maken. Voel je vrij om te kijken of Benji iets voor jou is. Je eerste drie gesprekken zijn gratis, zonder account.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Maak je een account aan? Dan kun je tot 10 gesprekken per maand voeren, en je gesprekken worden bewaard. Geen kosten, geen verplichtingen.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/registreren"
                className="block w-full text-center px-6 py-2.5 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white rounded-lg font-medium transition-colors text-sm"
              >
                Account aanmaken
              </Link>
            </div>
          </div>

          {/* Benji Uitgebreid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-300 p-6 sm:p-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Benji Uitgebreid — € 6,99 per maand
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Per jaar betalen? Dan is het € 54 — dat zijn twee maanden gratis.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Voor wie Benji regelmatig wil gebruiken. Je kunt zoveel gesprekken voeren als je wilt, zonder limiet. Daarnaast kun je dagelijkse check-ins doen, persoonlijke doelen bijhouden en reflecties opslaan om later terug te lezen.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Benji wordt een plek waar je steeds weer naartoe kunt, op je eigen tempo.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="block w-full text-center px-6 py-2.5 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white rounded-lg font-medium transition-colors text-sm mb-2">
                Kies Benji Uitgebreid
              </button>
              {/* Plak hier je betaallink onder de button als <a> tag */}
            </div>
          </div>

          {/* Benji Alles in 1 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-300 p-6 sm:p-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Benji Alles in 1 — € 11,99 per maand
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Per jaar is het € 89.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Voor wie Benji als een vast steunpunt wil hebben. Je krijgt alles van Benji Uitgebreid, plus toegang tot memories (om mooie herinneringen vast te leggen), inspiratie en troost (teksten en gedichten die kunnen helpen), en handreikingen voor moeilijke momenten.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Benji wordt een plek die volledig op jou is afgestemd, waar je altijd naartoe kunt.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="block w-full text-center px-6 py-2.5 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white rounded-lg font-medium transition-colors text-sm mb-2">
                Kies Benji Alles in 1
              </button>
              {/* Plak hier je betaallink onder de button als <a> tag */}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Benji is geen therapie en vervangt geen professionele hulp. Heb je het gevoel dat je meer nodig hebt dan Benji kan bieden, zoek dan alsjeblieft iemand op die je daarbij kan helpen.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-6 sm:py-8 mt-auto">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-primary-200">
            <Link href="/faq" className="hover:text-white transition-colors">
              Veelgestelde vragen
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/algemene-voorwaarden" className="hover:text-white transition-colors">
              Algemene voorwaarden
            </Link>
            <a href="mailto:contactmetien@talktobenji.com" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

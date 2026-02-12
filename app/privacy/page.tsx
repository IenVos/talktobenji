import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsLink } from "@/components/chat/CookieSettingsLink";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const metadata: Metadata = {
  title: "Privacy - Talk To Benji",
  description: "Privacybeleid van Talk To Benji | hoe we met je gegevens omgaan",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeaderBar />
      <main className="max-w-2xl mx-auto px-4 py-8 text-gray-700 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Privacy</h1>

        <p>
          Talk To Benji neemt je privacy serieus. Hieronder leggen we uit wat we met je gegevens doen, en vooral: wat we er níét mee doen.
        </p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Je gesprekken</h2>

          <div>
            <h3 className="font-medium text-gray-800 mb-1">Wat we opslaan</h3>
            <p>
              Je gesprekken met Benji worden opgeslagen zodat je later kunt terugkomen en verder kunt praten. Dit werkt via een sessie-ID dat aan je browser is gekoppeld.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-1">Wat we ermee doen</h3>
            <p>
              We gebruiken geanonimiseerde gesprekken om Benji te verbeteren. Dat betekent: we halen alles wat naar jou kan leiden uit de data voordat we het gebruiken voor training. Geen namen, geen herkenbare details, alleen de essentie van het gesprek.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-1">Wat we er níét mee doen</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>We verkopen je gegevens niet</li>
              <li>We delen ze niet met derden</li>
              <li>We gebruiken ze niet voor advertenties</li>
              <li>Niemand leest je gesprekken mee</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Hoe lang bewaren we je gesprekken?</h2>
          <p>
            Je gesprekken blijven beschikbaar zolang je ze nodig hebt. Je kunt zelf bepalen wanneer je ze wilt verwijderen.
          </p>
          <p>
            Wanneer je een gesprek verwijdert, heb je twee opties:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Volledig verwijderen</strong>: dan is het weg, ook voor training</li>
            <li><strong>Anonimiseren</strong>: je gesprek wordt losgekoppeld van jou en kan (zonder persoonlijke details) worden gebruikt om Benji te verbeteren</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Benji en AI</h2>
          <p>
            Benji gebruikt AI om te reageren op wat je schrijft. Dit betekent:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Je berichten worden verwerkt door een AI-model</li>
            <li>De AI heeft geen toegang tot eerdere gesprekken van andere gebruikers</li>
            <li>Elk gesprek staat op zichzelf</li>
          </ul>
          <p>
            We werken continu aan het verbeteren van Benji&apos;s reacties. Geanonimiseerde gesprekken helpen ons om te begrijpen hoe mensen met verlies omgaan en hoe Benji beter kan luisteren.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
          <p>
            We gebruiken alleen noodzakelijke cookies:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Om je sessie te onthouden zodat je gesprek bewaard blijft</li>
            <li>Om anonieme statistieken te verzamelen (zoals bezoekersaantallen)</li>
          </ul>
          <p>
            We plaatsen geen advertentiecookies en volgen je niet op andere websites.
          </p>
          <p>
            <CookieSettingsLink />
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Je rechten</h2>
          <p>
            Je hebt het recht om:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Je gesprekken in te zien</li>
            <li>Je gesprekken te verwijderen</li>
            <li>Te weten wat we met je data doen (dat lees je hier)</li>
            <li>Bezwaar te maken tegen verwerking</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p>
            Vragen over je privacy? Neem contact op via{" "}
            <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
              contactmetien@talktobenji.com
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-gray-500 italic pt-4 border-t border-gray-200">
          Talk To Benji verwerkt gegevens volgens de AVG (Algemene Verordening Gegevensbescherming). We bewaren niet meer dan nodig en beschermen wat we bewaren.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Terug naar Benji
          </Link>
          <Link href="/algemene-voorwaarden" className="text-primary-600 hover:text-primary-700 font-medium">
            Algemene voorwaarden
          </Link>
        </div>
      </main>
    </div>
  );
}

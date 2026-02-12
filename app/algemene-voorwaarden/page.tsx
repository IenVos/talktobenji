import type { Metadata } from "next";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const metadata: Metadata = {
  title: "Algemene voorwaarden - Talk To Benji",
  description: "Algemene voorwaarden van Talk To Benji",
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeaderBar />
      <main className="max-w-2xl mx-auto px-4 py-8 text-gray-700 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Algemene voorwaarden</h1>

        <p>
          Door Talk To Benji te gebruiken ga je akkoord met deze voorwaarden.
        </p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Wat Benji is</h2>
          <p>
            Benji is een AI-chatbot die een luisterend oor biedt voor mensen die te maken hebben met verlies of verdriet. Benji is er om te luisteren, niet om te oordelen.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Wat Benji niet is</h2>
          <p>
            Benji is geen vervanging voor:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Professionele hulpverlening of therapie</li>
            <li>Contact met vrienden, familie of naasten</li>
            <li>Medisch of psychologisch advies</li>
          </ul>
          <p>
            Benji is bedoeld als aanvulling, een plek waar je terecht kunt wanneer je even wilt praten, zonder dat je iemand tot last bent.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Professionele hulp</h2>
          <p>
            Benji herkent wanneer je mogelijk professionele hulp nodig hebt en zal je doorverwijzen naar 113. Of chat via{" "}
            <a
              href="https://www.113.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              113.nl
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Je gesprekken</h2>
          <p>
            Je gesprekken worden opgeslagen zodat je later verder kunt praten. We gebruiken geanonimiseerde data om Benji te verbeteren. Lees ons{" "}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
              privacybeleid
            </Link>
            {" "}voor meer details over hoe we met je gegevens omgaan.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Geen garanties</h2>
          <p>
            We doen ons best om Benji zo behulpzaam mogelijk te maken, maar:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Benji kan fouten maken of iets verkeerd begrijpen</li>
            <li>Benji is niet altijd beschikbaar (bij technische storingen)</li>
            <li>Reacties van Benji zijn geen professioneel advies</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Gebruik</h2>
          <p>
            Je mag Benji gebruiken voor persoonlijke ondersteuning bij verdriet en verlies. Je mag Benji niet gebruiken om:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Anderen te schaden</li>
            <li>De dienst te misbruiken of te verstoren</li>
            <li>Illegale activiteiten te ondersteunen</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Wijzigingen</h2>
          <p>
            We kunnen deze voorwaarden aanpassen. Bij grote wijzigingen laten we dit weten op de website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p>
            Vragen over deze voorwaarden? Neem contact op via{" "}
            <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
              contactmetien@talktobenji.com
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-gray-500 italic pt-4 border-t border-gray-200">
          Talk To Benji is een initiatief om mensen te ondersteunen in moeilijke tijden. We geloven dat iedereen een luisterend oor verdient.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Terug naar Benji
          </Link>
          <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
            Privacy
          </Link>
        </div>
      </main>
    </div>
  );
}

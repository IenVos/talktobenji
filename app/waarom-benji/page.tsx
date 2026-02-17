import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const metadata: Metadata = {
  title: "Waarom ik Benji begon · Talk To Benji",
  description: "Het verhaal achter Talk To Benji - waarom Ien deze plek creëerde voor mensen die met verlies en verdriet omgaan",
};

export default function WaarομBenjiPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <HeaderBar />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-gray-700 text-sm sm:text-base leading-relaxed">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Waarom ik Talk To Benji ben gestart</h1>

        <div className="space-y-4">
          <p>
            Verlies is iets wat iedereen meemaakt. De een verliest een dierbare, de ander een kinderwens die nooit is ingevuld mogen worden, en daarmee een hele toekomst die stilletjes verdampt. Geen babykamer, geen eerste schooldag, geen kleinkinderen. Verdriet dat blijft, ook als de wereld om je heen alweer doorleeft.
          </p>

          <p>
            Weer een ander verliest de gezondheid die er opeens niet meer is, of een bedrijf waar alles in zat. Verdriet heeft geen vaste vorm. Het past niet altijd in een categorie, en het volgt zeker geen planning.
          </p>

          <p>
            Ik weet dat uit eigen ervaring. Ik zag het van dichtbij toen mijn schoonzus ziek werd en overleed. Het verdriet van haar man, haar kinderen, haar broers en zussen, iedereen op zijn eigen manier. En ik begreep toen nog beter: dit overkomt iedereen, vroeg of laat. De een wat vroeger dan de ander.
          </p>

          <p>
            Vanuit die ervaring begon ik vier jaar geleden Beterschap-cadeau.nl, een plek voor mensen die iemand willen steunen die iets moeilijks meemaakt. Dat werd meer gebruikt dan ik had verwacht. Er volgde een troostwoordenboekje, omdat mensen behoefte bleken te hebben aan woorden als die van henzelf niet komen. En langzaamaan groeide de vraag: hoe kan ik mensen nog beter bijstaan, juist in die eerste, moeilijkste laag?
          </p>

          <p>
            Want dat is precies waar het vaak mis gaat. Niet omdat er geen mensen zijn die om je geven. Maar iedereen heeft het druk. Je wil niemand belasten. Je voelt je misschien al te veel. En soms is het gewoon fijner om eerst je gedachten te ordenen voordat je ze deelt met iemand die je kent.
          </p>

          <p>
            Benji is voor die momenten. Door te schrijven of hardop te praten worden dingen vaak een stukje duidelijker. Niet opgelost, maar draaglijker.
          </p>

          <p>
            Verdriet verdient ruimte. Benji geeft die ruimte, altijd. Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet.
          </p>
        </div>

        <div className="pt-8 mt-8 space-y-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/images/ien-founder.png"
                alt="Ien, founder van Talk To Benji"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm sm:text-base text-gray-700 font-medium leading-snug">
                Ien<br />
                Founder, Talk To Benji
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
            <span className="italic">P.S.</span> Benji is niet gratis, omdat bouwen en onderhouden nu eenmaal iets kost. Maar toegankelijkheid vind ik belangrijk. Daarom houd ik de drempel zo laag mogelijk, zodat zoveel mogelijk mensen er gebruik van kunnen maken wanneer ze het nodig hebben.
          </p>

          {/* Start je eerste gesprek button */}
          <div className="flex justify-center pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-700 hover:bg-primary-600 rounded-xl transition-colors font-medium text-sm sm:text-base text-white"
            >
              Start je eerste gesprek
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

      </main>

      {/* Footer met blauwe achtergrond */}
      <footer className="bg-primary-900 text-white py-6 sm:py-8">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
          {/* Links */}
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

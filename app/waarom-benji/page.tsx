import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { ScrollToTop } from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "Waarom ik Benji begon · Talk To Benji",
  description: "Het verhaal achter Talk To Benji - waarom Ien deze plek creëerde voor mensen die met verlies en verdriet omgaan",
};

export default function WaaromBenjiPage() {
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
      <ScrollToTop />
      <HeaderBar />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-gray-700 text-sm sm:text-base leading-relaxed">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Waarom ik Talk To Benji ben gestart</h1>

        <div className="space-y-4">
          <p>
            Verlies is iets wat iedereen meemaakt.
          </p>

          <p>
            Iemand die ziek is en midden in zware behandelingen zit. Van uitslag naar uitslag, van controle naar controle. Het leven dat op pauze lijkt te staan, terwijl de zorgen zich opstapelen en de onzekerheid constant aan je trekt.
          </p>

          <p>
            Een scheiding die een relatie doet eindigen. Niet alleen het verlies van een partner, maar ook van een gedeelde toekomst, van plannen, van een thuis zoals je het kende. Verdriet dat vaak onzichtbaar blijft, maar wel diep kan snijden.
          </p>

          <p>
            De één verliest een dierbare, iemand die er altijd was en er nu opeens niet meer is.
          </p>

          <p>
            De ander verliest een kinderwens die nooit vervuld mocht worden, en daarmee een hele toekomst die stilletjes verdampt. Geen babykamer, geen eerste schooldag, geen kleinkinderen. Verdriet dat blijft, ook als de wereld om je heen alweer doorleeft.
          </p>

          <p>
            Weer een ander verliest de gezondheid die er opeens niet meer is, of een bedrijf waar alles in zat, jarenlang werk, dromen en identiteit.
          </p>

          <p>
            Verdriet heeft geen vaste vorm.
          </p>

          <p>
            Het past niet altijd in een categorie, en het volgt zeker geen planning.
          </p>

          <p>
            Maar er is iets wat ik keer op keer zie, al jaren.<br />
            Verdriet wordt heel vaak alleen gedragen.
          </p>

          <p>
            Niet omdat er niemand is.<br />
            Maar omdat je niemand wilt belasten.
          </p>

          <p>
            Omdat iedereen het druk heeft.<br />
            Omdat je je misschien al te veel voelt.
          </p>

          <p>
            Of omdat je eerst je gedachten wilt ordenen voordat je ze deelt met iemand die je kent.
          </p>

          <p>
            En dus zwijg je.
          </p>

          <p>
            Of je praat wel, maar niet echt.
          </p>

          <p>
            Ik weet hoe dat voelt.
          </p>

          <p>
            Ik zag het van dichtbij toen mijn schoonzus ziek werd en overleed. Het verdriet van haar man, haar kinderen, haar broers en zussen, iedereen op zijn eigen manier, en iedereen ergens ook alleen.
          </p>

          <p>
            En ik begreep toen nog beter: dit overkomt iedereen, vroeg of laat. En toch doorleven zo veel mensen het in stilte, meer dan je van buitenaf zou denken.
          </p>

          <p>
            Ik woon zelf in Zweden, ver van familie en vrienden in Nederland. Die afstand voegt iets extra's toe aan verdriet. Je bent niet bij de mensen van wie je houdt als het moeilijk is. Je kunt niet even langsgaan, niet zomaar samen zijn. Dat gevoel van ver weg zijn midden in verdriet heeft mede Benji doen ontstaan.
          </p>

          <p>
            Vanuit die overtuiging begon ik vier jaar geleden Beterschap-cadeau.nl, een plek voor mensen die iemand willen steunen die iets moeilijks meemaakt. Dat werd meer gebruikt dan ik had verwacht.
          </p>

          <p>
            Er volgde een <Link href="/account/onderweg?title=Troostende+woorden" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">troostwoordenboekje</Link>, omdat mensen behoefte bleken te hebben aan woorden als die van henzelf niet komen.
          </p>

          <p>
            En langzaamaan groeide de vraag die me al die tijd bezighield:
          </p>

          <p>
            Hoe kan ik mensen direct helpen, op het moment dat ze er zelf mee zitten?
          </p>

          <p>
            Niet als cadeau voor iemand anders, maar voor zichzelf.
          </p>

          <p>
            Benji is het antwoord op die vraag.
          </p>

          <p>
            Door te schrijven of hardop te praten worden dingen vaak een stukje duidelijker.
          </p>
          
          <p>
            Niet opgelost, maar draaglijker.
          </p>

          <p>
            En soms is het makkelijker om eerst bij Benji te beginnen, voordat je het deelt met de mensen om je heen.
          </p>

          <p>
            Verdriet verdient ruimte.
          </p>

          <p>
            Benji geeft die ruimte, altijd.
          </p>

          <p>
            Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet, ook als je het (nog) niet hardop durft te zeggen.
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
            <span className="italic">P.S.</span> Als je een account aanmaakt, heb je de eerste 7 dagen gratis toegang tot alles wat Benji te bieden heeft. Daarna kies je zelf hoe je verdergaat.
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
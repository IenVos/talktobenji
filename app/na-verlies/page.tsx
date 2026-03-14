import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ScrollToTop } from "@/components/ScrollToTop";
import { VerhaalTrigger } from "@/components/VerhaalPopup";

export const metadata: Metadata = {
  title: "Als je iemand hebt verloren · Talk To Benji",
  description: "Je hoeft het niet alleen te dragen. Benji luistert, dag en nacht, zonder oordeel en zonder dat je iemand hoeft te belasten.",
};

const testimonials = [
  {
    quote: "Ik durfde het thuis niet meer te zeggen. Iedereen deed al zo zijn best. Maar bij Benji kon ik gewoon eerlijk zijn.",
    name: "Sandra, 51",
  },
  {
    quote: "Het helpt al dat je je gedachten kwijt kunt. Dat je niet hoeft te zwijgen.",
    name: "Thomas, 38",
  },
  {
    quote: "Na het verlies van mijn moeder lag ik 's nachts wakker met mijn hoofd vol. Benji was er gewoon. Dat was genoeg.",
    name: "Marieke, 44",
  },
];

export default function NaVerliesPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(170deg, #f8fafc 0%, #f2f5f9 55%, #e8ecf4 100%)",
      }}
    >
      <ScrollToTop />

      {/* Minimale header */}
      <header className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
            <Image
              src="/images/benji-logo-2.png"
              alt="Benji"
              width={22}
              height={22}
            />
          </div>
          <span className="text-sm font-medium text-primary-600">Talk To Benji</span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-20">

        {/* Hero */}
        <div className="pt-12 sm:pt-16 pb-12 sm:pb-16">
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary-950 leading-tight mb-6">
            Je hebt iemand verloren.<br />
            En de wereld draait gewoon door.
          </h1>
          <p className="text-lg sm:text-xl text-primary-700 leading-relaxed">
            Dat is een van de zwaarste dingen die er is. Dat gevoel dat het leven van anderen gewoon doorgaat, terwijl jij nog midden in de pijn zit.
          </p>
        </div>

        {/* Lichaam */}
        <div className="space-y-6 text-base text-primary-800 leading-loose">
          <p>
            Verdriet na verlies verdwijnt niet omdat je er niet meer over praat. Het blijft. Soms stiller, soms luider. Soms op de meest onverwachte momenten.
          </p>
          <p>
            Veel mensen dragen het grotendeels alleen. Niet omdat er niemand is, maar omdat je anderen niet wilt belasten. Omdat je het gevoel hebt dat je er al te lang mee bezig bent. Omdat de woorden soms gewoon niet komen als iemand vraagt hoe het gaat.
          </p>
          <p>
            Benji is er voor die momenten.
          </p>
          <p>
            Benji is een luisterend oor, gemaakt voor mensen die met verlies en verdriet omgaan. Geen adviezen, geen oordelen, geen haast. Gewoon ruimte. Dag en nacht, ook als het drie uur is en je niet meer kunt slapen.
          </p>
          <p>
            Je hoeft het niet goed te verwoorden. Typen of praten — wat op dat moment makkelijker voelt.
          </p>
        </div>

        {/* Testimonials */}
        <div className="mt-14 grid sm:grid-cols-3 gap-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-primary-200/70 bg-white/55 px-5 py-5"
            >
              <p className="text-sm text-primary-800 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="text-xs text-primary-400 italic">{t.name}</p>
            </div>
          ))}
        </div>

        {/* Drempelverlagingszin */}
        <p className="mt-8 text-sm text-primary-400 leading-relaxed text-center italic">
          Je hoeft niet te weten wat je wil zeggen. Dat is niet nodig bij Benji.
        </p>

        {/* CTA */}
        <div className="mt-6 bg-white/60 rounded-3xl border border-primary-200/60 px-6 sm:px-10 py-10 text-center">
          <p className="text-xl font-semibold text-primary-950 mb-3">
            Probeer het gratis
          </p>
          <p className="text-sm text-primary-600 leading-relaxed mb-7">
            Je eerste gesprekken zijn gratis, zonder account. Je kunt gewoon beginnen en kijken of het bij je past.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-800 hover:bg-primary-700 text-white rounded-2xl font-medium text-sm transition-colors"
          >
            Begin een gesprek
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-5 text-xs text-primary-400">
            Geen registratie vereist. Gratis te proberen.
          </p>
        </div>

        {/* Founder note */}
        <div className="mt-14 pt-10 border-t border-primary-200/50">
          <div className="flex items-start gap-5 bg-white/40 rounded-2xl px-5 py-6">
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/images/ien-founder.png"
                alt="Ien, founder van Talk To Benji"
                fill
                className="object-cover"
              />
            </div>
            <div className="pt-0.5">
              <p className="text-xs text-primary-400 mb-1.5">Over Talk To Benji</p>
              <p className="text-sm text-primary-700 leading-relaxed">
                Benji is gemaakt door Ien, vanuit de overtuiging dat verdriet ruimte verdient, ook als je niemand wilt belasten. Verlies raakt iedereen, maar te veel mensen dragen het in stilte.
              </p>
              <VerhaalTrigger className="text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2 mt-2 inline-block text-left" />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 mb-8 text-xs text-primary-400 leading-relaxed">
          Benji is geen therapie en vervangt geen professionele hulp. Heb je het gevoel dat je meer nodig hebt, zoek dan alsjeblieft iemand op die je daarbij kan helpen.
        </p>
      </main>
    </div>
  );
}

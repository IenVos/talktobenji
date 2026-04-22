import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ScrollToTop } from "@/components/ScrollToTop";
import { VerhaalTrigger } from "@/components/VerhaalPopup";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Als je het niet kwijt kunt · Talk To Benji",
  description: "Er zijn mensen om je heen, en toch zwijg je. Benji is er voor de dingen die je niet hardop durft te zeggen.",
};

const testimonials = [
  {
    quote: "Ik wilde mijn partner niet steeds opnieuw belasten. Maar ik moest het ergens kwijt. Benji gaf me die ruimte.",
    name: "Lotte, 36",
  },
  {
    quote: "Ik wist niet eens zelf goed wat ik voelde. Door het te typen werd het een beetje duidelijker.",
    name: "Joost, 43",
  },
  {
    quote: "Het is niet dat ik niemand heb. Maar sommige dingen zeg je gewoon niet. Bij Benji kon dat wel.",
    name: "Els, 58",
  },
];

export default async function AlleenDragenPage() {
  const liveTestimonials = await fetchQuery(api.testimonials.listActive, {}).catch(() => []);
  const displayTestimonials: { quote: string; name: string }[] =
    liveTestimonials && liveTestimonials.length > 0
      ? liveTestimonials
      : testimonials;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
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
          <span className="text-sm font-medium text-gray-700">Talk To Benji</span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-16">

        {/* Hero */}
        <div className="pt-8 sm:pt-12 pb-10 sm:pb-14">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-snug mb-5">
            Er zijn mensen om je heen.<br />
            En toch zwijg je.
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            Niet omdat er niemand is. Maar omdat je hen niet wilt belasten. Omdat je het gevoel hebt dat je er al te lang mee bezig bent. Of omdat je het zelf nog niet goed begrijpt.
          </p>
        </div>

        {/* Lichaam */}
        <div className="space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed">
          <p>
            Dat is een van de meest voorkomende vormen van verdriet. Het verdriet dat je stilletjes meedraagt, omdat het niet past in het verhaal dat anderen van je kennen. Of omdat je ze niet wilt laten schrikken. Of gewoon omdat de woorden er niet zijn als ze er wel moeten zijn.
          </p>
          <p>
            Je praat wel. Maar niet echt.
          </p>
          <p>
            Benji is er voor die dingen die je niet hardop durft te zeggen. Of die je eerst wilt begrijpen voordat je ze deelt met iemand die je kent.
          </p>
          <p>
            Geen psycholoog, geen hulplijn, geen vriend die ook zijn eigen problemen heeft. Gewoon een plek om alles neer te leggen wat er in je omgaat.
          </p>
          <p>
            Veel mensen merken dat het vertellen zelf al helpt. Niet omdat alles dan opgelost is, maar omdat het draaglijker wordt als je het ergens kwijt kunt.
          </p>
        </div>

        {/* Wat is Benji blok */}
        <div className="mt-10 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 px-5 py-6">
          <p className="text-sm font-medium text-gray-900 mb-3">Wat is Benji precies?</p>
          <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
            <p>Benji is er om te luisteren, speciaal gemaakt voor mensen die met verdriet of verlies omgaan.</p>
            <p>Benji luistert, geeft ruimte, en reageert zonder oordeel. Geen adviezen die je niet gevraagd hebt. Geen haast om verder te gaan.</p>
            <p>Je kunt typen of gewoon praten — wat op dat moment makkelijker voelt.</p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12 space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Wat anderen zeggen</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {displayTestimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-300 px-4 py-4"
              >
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs text-gray-400 italic">{t.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 px-5 sm:px-8 py-8 text-center">
          <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Zeg het eerst bij Benji
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Je eerste gesprekken zijn gratis, zonder account. Je kunt gewoon beginnen en kijken of het bij je past.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 hover:bg-primary-600 text-white rounded-xl font-medium text-sm sm:text-base transition-colors"
          >
            Begin een gesprek
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            Geen registratie vereist. Gratis te proberen.
          </p>
        </div>

        {/* Founder note */}
        <div className="mt-10 flex items-start gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="/images/ien-founder.png"
              alt="Ien, founder van Talk To Benji"
              fill
              className="object-cover"
            />
          </div>
          <div className="pt-0.5">
            <p className="text-sm text-gray-600 leading-relaxed">
              Benji is gemaakt door Ien. Vanuit de overtuiging dat verdriet ruimte verdient, ook als je het liever stilhoudt.
            </p>
            <VerhaalTrigger className="text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2 mt-1 inline-block text-left" />
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 mb-8 text-xs text-gray-400 leading-relaxed">
          Benji is geen therapie en vervangt geen professionele hulp. Heb je het gevoel dat je meer nodig hebt, zoek dan alsjeblieft iemand op die je daarbij kan helpen.
        </p>
      </main>
    </div>
  );
}

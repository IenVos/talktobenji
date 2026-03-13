import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const metadata: Metadata = {
  title: "Troostende Woorden · Talk To Benji",
  description: "Een klein boekje met troostende woorden voor wie zelf niet de woorden kan vinden. Voor verlies, ziekte, verdriet — woorden die doen wat jij niet kunt zeggen.",
};

const ctaUrl = "https://talktobenji.kennis.shop/pay/troostende-woorden";

export default function TroostendeWoordenPage() {
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

      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-10 space-y-10">

        {/* HERO */}
        <section className="text-center pt-4">
          <p className="text-xs uppercase tracking-widest mb-4 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
            een klein boekje
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-snug" style={{ color: "#3d3530" }}>
            Troostende woorden
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#6b6460" }}>
            Voor wie zelf niet de woorden kan vinden — maar ze wel wil geven.
          </p>
          <a
            href={ctaUrl}
            className="inline-block w-full sm:w-auto sm:px-10 py-3.5 rounded-2xl font-medium text-white text-sm"
            style={{ background: "#6d84a8" }}
          >
            Bestel het boekje
          </a>
        </section>

        {/* PRODUCTAFBEELDING */}
        <div className="flex justify-center">
          <Image
            src="/images/troostende-woorden-cover.png"
            alt="Troostende woorden boekje"
            width={240}
            height={340}
            className="rounded-xl shadow-md"
          />
        </div>

        {/* WAT IS HET */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
              Wat zit er in dit boekje?
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <p>
                Soms wil je er voor iemand zijn, maar weet je niet wat je moet zeggen. De woorden schieten tekort, of komen gewoon niet.
              </p>
              <p>
                Dit boekje bevat zinnen die je kunt geven — bij verlies, bij ziekte, bij verdriet dat geen naam heeft. Geen vaste recepten, maar echte woorden die troost bieden zonder te veel te willen zeggen.
              </p>
              <p>
                Klein genoeg om mee te geven. Groot genoeg om iets te betekenen.
              </p>
            </div>
          </div>
        </section>

        {/* VOOR WIE */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
              Dit boekje is voor jou als...
            </h2>
            <ul className="space-y-3">
              {[
                "je iemand wil steunen maar niet weet hoe",
                "je zelf niet de woorden kan vinden op een moeilijk moment",
                "je een cadeau zoekt dat echt iets zegt",
                "je verdriet wil erkennen zonder het groter te maken dan het al is",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#b0a8a0", flexShrink: 0, marginTop: 2 }}>·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* QUOTE */}
        <section>
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
          >
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#3d3530" }}>
              "Ik gaf dit boekje aan mijn zus toen ze haar man verloor. Ze zei dat het voelde alsof iemand eindelijk de goede woorden had gevonden."
            </p>
            <p className="text-xs" style={{ color: "#8a8078" }}>Lotte, 38</p>
          </div>
        </section>

        {/* FINALE CTA */}
        <section className="pb-6">
          <div
            className="rounded-2xl px-6 sm:px-10 py-10 text-center"
            style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.09)" }}
          >
            <h2 className="text-2xl font-semibold mb-3 leading-snug" style={{ color: "#3d3530" }}>
              Geef troost een vorm
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: "#6b6460" }}>
              Het boekje wordt snel verzonden. Jij hoeft alleen maar te bestellen.
            </p>
            <a
              href={ctaUrl}
              className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
              style={{ background: "#6d84a8" }}
            >
              Bestel het boekje
            </a>
            <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
              Vragen? Stuur een mail naar{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-6 sm:py-8">
        <div className="w-full max-w-xl mx-auto px-5">
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-primary-200">
            <Link href="/waarom-benji" className="hover:text-white transition-colors">
              Over Talk To Benji
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
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

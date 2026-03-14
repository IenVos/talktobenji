import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { VerhaalTrigger } from "@/components/VerhaalPopup";

export const metadata: Metadata = {
  title: "Er Zijn · Een gids voor wie naast iemand staat in verdriet · Talk To Benji",
  description: "Je wilt er zijn voor iemand die rouwt, maar de woorden komen niet. Er Zijn is een digitaal boekje met concrete handvatten, zinnen die je kunt gebruiken, en inzicht in wat verdriet écht is.",
};

const KOOP_LINK = "#"; // TODO: vervang door betaallink

const WAT_ERIN_VINDT = [
  "Wat er écht in iemand omgaat als ze rouwen — zodat je begrijpt waarom ze doen wat ze doen.",
  "Welke goedbedoelde zinnen averechts werken, en waarom — zonder schuldgevoel, met uitleg.",
  "Wat wél helpt. Concreet. Klein. Haalbaar. Dingen die je vandaag al kunt doen.",
  "Zinnen die je letterlijk kunt gebruiken — voor het eerste moment, de weken daarna, de moeilijke dagen.",
  "Hoe je omgaat met bijzondere vormen van verlies: een huisdier, een scheiding, een miskraam, anticiperende rouw.",
  "Hoe je voor jezelf zorgt als het ook zwaar wordt voor jou.",
  "Een spiekbriefje dat je kunt bewaren — voor als je er even niet uitkomt.",
];

const VOOR_WIE = [
  "De vriend die niet weet wat te zeggen bij een begrafenis.",
  "De partner die naast iemand staat die rouwt om een ouder, een kind, een huisdier.",
  "De collega die merkt dat iemand het zwaar heeft maar niet weet hoe ze dat moeten aankaarten.",
  "De moeder die haar kind ziet rouwen en niet weet hoe ze dichterbij kan komen.",
  "Iedereen die iemand verliest aan verdriet — niet aan de dood, maar aan de afstand die ontstaat omdat niemand weet wat te zeggen.",
];

export default function ErZijnPage() {
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
            een digitaal boekje
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-5 leading-snug" style={{ color: "#3d3530" }}>
            Je wilt er zijn.<br />Maar je weet niet hoe.
          </h1>
          <p className="text-base leading-relaxed mb-3" style={{ color: "#6b6460" }}>
            Je kent iemand die verdriet heeft. Je denkt aan ze. Je wilt iets doen, iets zeggen — maar de woorden komen niet. Of je zegt iets en het voelt meteen niet goed.
          </p>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#6b6460" }}>
            Dat maakt je niet tot een slechte vriend. Het maakt je menselijk.
          </p>
          <a
            href={KOOP_LINK}
            className="inline-block w-full sm:w-auto sm:px-12 py-3.5 rounded-2xl font-medium text-white text-sm"
            style={{ background: "#6d84a8" }}
          >
            Ik wil dit — €27
          </a>
        </section>

        {/* INTRO */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <span className="font-semibold" style={{ color: "#3d3530" }}>Er Zijn</span> is een boekje voor mensen zoals jij. Voor wie naast iemand staat in verdriet en dat goed wil doen — zonder de perfecte woorden te hoeven hebben.
            </p>
          </div>
        </section>

        {/* WAT JE ERIN VINDT */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
              Wat je erin vindt
            </h2>
            <ul className="space-y-3">
              {WAT_ERIN_VINDT.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#b0a8a0", flexShrink: 0, marginTop: 2 }}>·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <a
                href={KOOP_LINK}
                className="inline-block w-full py-3 rounded-2xl font-medium text-white text-sm"
                style={{ background: "#6d84a8" }}
              >
                Ik wil dit — €27
              </a>
            </div>
          </div>
        </section>

        {/* VOOR WIE */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
              Voor wie is dit
            </h2>
            <ul className="space-y-3">
              {VOOR_WIE.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#b0a8a0", flexShrink: 0, marginTop: 2 }}>·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* WAT VERDRIET IS */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
              Wat verdriet is — en wat het niet is
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <p>
                Verdriet is niet alleen iets wat mensen voelen als iemand sterft. Het is alles wat je draagt als je iets verliest wat er echt toe deed. Een relatie. Een huisdier. Een toekomst die er anders uitziet dan gehoopt. Een gezondheid. Een rol.
              </p>
              <p>
                Al die vormen van verlies zijn echt. En al die mensen hebben iemand nodig die niet wegloopt.
              </p>
              <p className="font-medium" style={{ color: "#3d3530" }}>
                Dat ben jij.
              </p>
            </div>
          </div>
        </section>

        {/* QUOTE */}
        <section>
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
          >
            <p className="text-base leading-relaxed mb-3 italic" style={{ color: "#3d3530" }}>
              "Je hoeft de perfecte woorden niet te hebben. Dat is nieuws."
            </p>
            <p className="text-xs" style={{ color: "#8a8078" }}>— uit Er Zijn</p>
          </div>
        </section>

        {/* WAT JE KRIJGT */}
        <section>
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
              Wat je krijgt
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <p>
                Een digitaal boekje van 69 pagina's, direct te downloaden na aankoop. Warm vormgegeven, rustig om te lezen — niet als een cursus, maar als een gids die je pakt wanneer je het nodig hebt.
              </p>
              <p>
                Inclusief spiekbriefje — één pagina met de kern, los te bewaren op je telefoon of te printen.
              </p>
            </div>
          </div>
        </section>

        {/* FINALE CTA */}
        <section className="pb-4">
          <div
            className="rounded-2xl px-6 sm:px-10 py-10 text-center"
            style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.09)" }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 leading-snug" style={{ color: "#3d3530" }}>
              Dat jij dit zoekt, zegt al iets.
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: "#6b6460" }}>
              De persoon die jou nodig heeft, heeft geluk met jou.
            </p>
            <a
              href={KOOP_LINK}
              className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
              style={{ background: "#6d84a8" }}
            >
              Ik wil dit — €27
            </a>
            <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
              Direct te downloaden na aankoop. Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
          </div>
        </section>

        {/* OVER DE MAKER */}
        <section className="pb-4">
          <div className="flex items-start gap-4 rounded-2xl px-5 py-5" style={{ background: "rgba(255,255,255,0.6)" }}>
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/images/ien-founder.png" alt="Ien, founder van Talk To Benji" fill className="object-cover" />
            </div>
            <div className="pt-0.5">
              <p className="text-xs mb-1" style={{ color: "#8a8078" }}>Over de maker</p>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "#6b6460" }}>
                Er Zijn is gemaakt door Ien, oprichter van Talk To Benji. Vanuit de overtuiging dat je geen therapeut hoeft te zijn om er te zijn voor iemand.
              </p>
              <VerhaalTrigger className="text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2 text-left" />
            </div>
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

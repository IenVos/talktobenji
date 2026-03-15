"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";

// ─── Content ──────────────────────────────────────────────────────────────────

const SECTIES = [
  {
    id: "welkom",
    nav: "Welkom",
    titel: "Welkom",
    intro: [
      "Je bent hier omdat je iets draagt wat zwaar is.",
      "Misschien weet je precies wat het is. Misschien ook niet. Misschien is het verdriet om iemand die er niet meer is, om iets wat anders liep dan je had gehoopt, om een leven dat er nu anders uitziet dan je had verwacht.",
      "Het maakt niet uit hoe je het noemt. Het telt.",
      "Houvast is er niet om je verdriet op te lossen. Dat kan niemand. Maar voor elk moment dat het extra zwaar voelt, vind je hier iets wat je nu meteen kunt doen. Klein. Eerlijk. Zonder dat je er iets voor hoeft te weten of te begrijpen.",
      "Je hoeft dit niet alleen te dragen.",
    ],
    oefening: null,
    bvraag: null,
  },
  {
    id: "moment-1",
    nav: "1",
    titel: "Als je 's nachts wakker ligt",
    intro: [
      "Het is 3 uur. De rest van de wereld slaapt. Jij niet.",
      "De stilte voelt te groot. Je hoofd maakt overuren over dingen die je overdag probeert weg te duwen. Dit is niet gek. 's Nachts is er geen afleiding meer, dan komt het verdriet gewoon langs.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Leg je hand op je borst. Voel je hartslag. Zeg zachtjes, hardop of in gedachten: \"Ik ben hier. Dit mag er zijn.\"",
        "Niet om het weg te maken, maar om jezelf even gezelschap te houden.",
      ],
    },
    bvraag: "Wat houdt je vannacht het meest bezig?",
  },
  {
    id: "moment-2",
    nav: "2",
    titel: "Als je niet weet wat je voelt",
    intro: [
      "Verdoofd. Leeg. Of juist alles tegelijk, en je weet niet eens hoe je dat moet noemen.",
      "Verdriet ziet er niet altijd uit zoals in films. Soms is het een waas. Soms voel je gewoon niks. En dat voelt dan ook weer verkeerd. Maar verdoofdheid is ook een manier waarop je lichaam je beschermt. Het klopt.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Pak een vel papier en schrijf drie woorden op die ook maar een beetje in de buurt komen van wat je voelt.",
        "Geen zinnen. Geen uitleg. Gewoon drie woorden. Je hoeft het niet te begrijpen.",
      ],
    },
    bvraag: "Als je gevoel vandaag een kleur had, welke zou dat zijn?",
  },
  {
    id: "moment-3",
    nav: "3",
    titel: "Als iemand vraagt \"hoe gaat het\" en je het antwoord niet weet",
    intro: [
      "Je zegt \"gaat wel\" of \"beetje moe.\" En terwijl je het zegt, voel je hoe eenzaam dat is.",
      "Want het echte antwoord is te groot voor een gang of een kassagesprek. Dus je verpakt het. Elke dag weer. Dat kost meer energie dan mensen denken. Steeds doen alsof je er bent terwijl je er eigenlijk niet helemaal bent.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Je hoeft het niemand uit te leggen. Maar schrijf voor jezelf, nu, het antwoord op zoals je het écht zou willen geven.",
        "Niemand leest het. Het is alleen voor jou.",
      ],
    },
    bvraag: "Aan wie zou je het echte antwoord wel durven geven?",
  },
  {
    id: "moment-4",
    nav: "4",
    titel: "Als een foto, een geur of een liedje je overspoelt",
    intro: [
      "Zonder waarschuwing. Midden op de dag. En ineens ben je er helemaal in.",
      "Een nummer op de radio. De geur van een jas. Een foto die je niet zocht maar toch tegenkwam. Het overspoelt je en je weet even niet meer waar je bent.",
      "Dit zijn geen zwakke momenten. Dit zijn momenten waarop je liefde voelt. Rouw en liefde zijn hetzelfde.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Laat het even komen. Zet geen wekker, leg je telefoon weg, en geef het twee minuten.",
        "Huil als het komt. Adem als het zakt. Je hoeft het niet weg te duwen.",
      ],
    },
    bvraag: "Waar denk je aan als dit gebeurt?",
  },
  {
    id: "moment-5",
    nav: "5",
    titel: "Als je je schuldig voelt dat je even gelachen hebt",
    intro: [
      "Even ver. En dan meteen dat steekje: hoe kan ik lachen terwijl...",
      "Dit is een van de zwaarste dingen aan verdriet, dat je je schuldig voelt over de momenten dat het even lichter is. Alsof lachen verraad is. Maar dat is het niet.",
      "Lachen betekent niet dat je het loslaat. Het betekent dat je nog leeft. En dat is precies wat degene van wie je houdt voor je zou willen.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Schrijf één herinnering op die je blij maakt. Niet om het verdriet te vergeten, maar om het naast elkaar te laten bestaan.",
        "Blij en verdrietig tegelijk. Dat mag.",
      ],
    },
    bvraag: "Waar lachte jij om, en waarom voelt dat goed én moeilijk tegelijk?",
  },
  {
    id: "afsluiting",
    nav: "En dan",
    titel: "En dan?",
    intro: [
      "Je hoeft het hier niet bij te laten.",
      "Benji is er voor de momenten dat je meer nodig hebt dan een oefening. Voor als je wil praten, of gewoon niet alleen wil zijn met je gedachten. Hij luistert zonder oordeel, op elk moment van de dag.",
    ],
    oefening: null,
    bvraag: null,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HouvasteGidsPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const profiel = useQuery(api.houvast.getByToken, { token });
  const [stap, setStap] = useState(0);

  // Laadt nog
  if (profiel === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
        </div>
      </div>
    );
  }

  // Geen of ongeldig token
  if (!profiel) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
          <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="flex items-center justify-center px-5 pt-16 pb-20">
            <div className="w-full max-w-sm text-center">
              <p className="text-base font-medium mb-3" style={{ color: "#3d3530" }}>
                Deze link is niet meer geldig.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b6460" }}>
                Vul je e-mailadres opnieuw in en we sturen je een nieuwe link.
              </p>
              <Link
                href="/houvast"
                className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm"
                style={{ background: "#6d84a8" }}
              >
                Stuur mij de link opnieuw
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sectie = SECTIES[stap];
  const isEerste = stap === 0;
  const isLaatste = stap === SECTIES.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <HeaderBar />

        {/* Navigatie */}
        <nav className="px-5 pt-4 pb-2">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2 flex-wrap">
            {SECTIES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStap(i)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: i === stap ? "#6d84a8" : "rgba(255,255,255,0.70)",
                  color: i === stap ? "#fff" : "#8a8078",
                  boxShadow: i === stap ? "0 2px 8px rgba(109,132,168,0.25)" : "none",
                }}
              >
                {s.nav}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 flex items-start justify-center px-5 py-8">
          <div className="w-full max-w-md">
            <div
              className="rounded-2xl p-6 sm:p-8 space-y-5"
              style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
            >
              {/* Nummer label voor momenten */}
              {sectie.id.startsWith("moment") && (
                <p
                  className="text-xs uppercase tracking-widest font-medium"
                  style={{ color: "#8a8078", letterSpacing: "0.13em" }}
                >
                  Moment {sectie.nav}
                </p>
              )}

              <h2
                className="text-xl sm:text-2xl font-semibold leading-snug"
                style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}
              >
                {sectie.titel}
              </h2>

              <div className="space-y-3">
                {sectie.intro.map((alinea, i) => (
                  <p key={i} className="text-sm sm:text-base leading-relaxed" style={{ color: "#6b6460" }}>
                    {alinea}
                  </p>
                ))}
              </div>

              {sectie.oefening && (
                <div
                  className="rounded-xl px-5 py-4 space-y-2"
                  style={{ background: "rgba(109,132,168,0.08)", borderLeft: "3px solid #6d84a8" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6d84a8" }}>
                    {sectie.oefening.titel}
                  </p>
                  {sectie.oefening.tekst.map((t, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>
                      {t}
                    </p>
                  ))}
                </div>
              )}

              {sectie.bvraag && (
                <div className="pt-1">
                  <p className="text-xs font-medium mb-2" style={{ color: "#8a8078" }}>
                    Benji vraagt:
                  </p>
                  <Link
                    href="/"
                    className="block w-full text-left text-sm font-medium py-3 px-4 rounded-xl transition-colors"
                    style={{ background: "rgba(255,255,255,0.80)", color: "#6d84a8", border: "1px solid rgba(109,132,168,0.20)" }}
                  >
                    {sectie.bvraag} →
                  </Link>
                </div>
              )}

              {sectie.id === "afsluiting" && (
                <Link
                  href="/"
                  className="block w-full text-center py-3.5 rounded-2xl font-medium text-white text-sm"
                  style={{ background: "#6d84a8" }}
                >
                  Praat met Benji
                </Link>
              )}
            </div>

            {/* Vorige / Volgende */}
            <div className="flex justify-between items-center mt-5 px-1">
              <button
                onClick={() => setStap((s) => s - 1)}
                disabled={isEerste}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-0"
                style={{ color: "#6d84a8", background: "rgba(255,255,255,0.70)" }}
              >
                ← Vorige
              </button>

              <p className="text-xs" style={{ color: "#a09890" }}>
                {stap + 1} / {SECTIES.length}
              </p>

              <button
                onClick={() => setStap((s) => s + 1)}
                disabled={isLaatste}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-0"
                style={{ color: "#6d84a8", background: "rgba(255,255,255,0.70)" }}
              >
                Volgende →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

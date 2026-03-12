"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notFound, useParams } from "next/navigation";

interface Ervaring {
  tekst: string;
  naam: string;
  context?: string;
}

interface Vraag {
  vraag: string;
  antwoord: string;
}

export default function LandingPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : "";
  const [showIen, setShowIen] = useState(false);
  const page = useQuery(api.landingPages.getBySlug, { slug });

  // page === undefined = loading, page === null = not found / not live
  if (page === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
      </div>
    );
  }

  if (page === null) {
    notFound();
    return null;
  }

  const voorWieBullets: string[] = page.voorWieBullets
    ? page.voorWieBullets.split("\n").filter(Boolean)
    : [];

  let ervaringen: Ervaring[] = [];
  try {
    if (page.ervaringenJson) ervaringen = JSON.parse(page.ervaringenJson);
  } catch {
    ervaringen = [];
  }

  let vragen: Vraag[] = [];
  try {
    if (page.vragenJson) vragen = JSON.parse(page.vragenJson);
  } catch {
    vragen = [];
  }

  const ctaUrl = page.ctaUrl || "#";
  const ctaText = page.ctaText || "Start mijn reis";

  const renderTextWithParagraphs = (text: string) =>
    text.split("\n\n").map((para, i) => (
      <p key={i}>{para}</p>
    ));

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      {/* Vaste achtergrond doorlopend zichtbaar */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        {(page as any).bgImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(page as any).bgImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      {/* Alle content boven de achtergrond */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-2">
          <a href="https://talktobenji.com">
            <Image
              src="/images/benji-logo-2.png"
              alt="Talk To Benji"
              width={32}
              height={32}
              className="opacity-60 hover:opacity-80 transition-opacity"
            />
          </a>
        </div>

        {/* HERO */}
        <section className="flex items-center justify-center px-5 pt-12 pb-16">
          <div className="w-full max-w-md text-center">
            {page.heroLabel && (
              <p className="text-xs uppercase tracking-widest mb-5 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
                {page.heroLabel}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-snug" style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}>
              {page.heroTitle}
            </h1>
            {page.heroSubtitle && (
              <p className="text-base leading-relaxed mb-3" style={{ color: "#6b6460", textWrap: "balance" } as React.CSSProperties}>
                {page.heroSubtitle}
              </p>
            )}
            {page.heroBody && (
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a8078", textWrap: "balance" } as React.CSSProperties}>
                {page.heroBody}
              </p>
            )}
            <a
              href={ctaUrl}
              className="inline-block w-full sm:w-auto sm:px-10 py-3.5 rounded-2xl font-medium text-white text-sm"
              style={{ background: "#6d84a8" }}
            >
              {ctaText}
            </a>
          </div>
        </section>

        {/* SECTIE 1 */}
        {(page.section1Title || page.section1Text) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                {page.section1Title && (
                  <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
                    {page.section1Title}
                  </h2>
                )}
                {page.section1Text && (
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    {renderTextWithParagraphs(page.section1Text)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTIE 2 */}
        {(page.section2Title || page.section2Text) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                {page.section2Title && (
                  <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
                    {page.section2Title}
                  </h2>
                )}
                {page.section2Text && (
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    {renderTextWithParagraphs(page.section2Text)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTAFBEELDING */}
        {((page as any).productImageUrl || page.productImagePath) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              {(page as any).productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(page as any).productImageUrl} alt="Productafbeelding" className="w-full rounded-2xl" />
              ) : (
                <Image src={page.productImagePath!} alt="Productafbeelding" width={600} height={420} className="w-full rounded-2xl" />
              )}
            </div>
          </section>
        )}

        {/* VOOR WIE */}
        {voorWieBullets.length > 0 && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
                  Dit is voor jou als...
                </h2>
                <ul className="space-y-3">
                  {voorWieBullets.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      <span style={{ color: "#b0a8a0", flexShrink: 0, marginTop: 2 }}>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ERVARINGEN */}
        {ervaringen.length > 0 && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto space-y-4">
              {ervaringen.map((e, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6"
                  style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                >
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#3d3530" }}>
                    "{e.tekst}"
                  </p>
                  <p className="text-xs" style={{ color: "#8a8078" }}>
                    {e.naam}{e.context ? `, ${e.context}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WIE IS IEN */}
        {(page.wieIsTitle || page.wieIsText) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                {page.wieIsTitle && (
                  <h2 className="text-lg font-semibold mb-3" style={{ color: "#3d3530" }}>
                    {page.wieIsTitle}
                  </h2>
                )}
                {page.wieIsText && (
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6460" }}>
                    {page.wieIsText}
                  </p>
                )}
                <button
                  onClick={() => setShowIen(true)}
                  className="text-sm font-medium text-left"
                  style={{ color: "#6d84a8" }}
                >
                  Lees haar verhaal: Waarom Benji →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {vragen.length > 0 && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
                Misschien vraag je je af...
              </h2>
              <div
                className="rounded-2xl p-6 sm:p-7 space-y-6"
                style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
              >
                {vragen.map((v, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#3d3530" }}>{v.vraag}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{v.antwoord}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FINALE CTA */}
        {(page.finalCtaTitle || page.finalCtaBody) && (
          <section className="px-5 pb-20">
            <div className="max-w-md mx-auto text-center">
              <div
                className="rounded-2xl px-6 sm:px-10 py-10"
                style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.09)" }}
              >
                {page.finalCtaTitle && (
                  <h2 className="text-2xl font-semibold mb-3 leading-snug" style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}>
                    {page.finalCtaTitle}
                  </h2>
                )}
                {page.finalCtaBody && (
                  <p className="text-sm leading-relaxed mb-7" style={{ color: "#6b6460", textWrap: "balance" } as React.CSSProperties}>
                    {page.finalCtaBody}
                  </p>
                )}
                <a
                  href={ctaUrl}
                  className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
                  style={{ background: "#6d84a8" }}
                >
                  {ctaText}
                </a>
                <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
                  Na aankoop ontvang je direct een bericht van Ien.
                  Je eerste dag begint de volgende ochtend.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="px-5 py-10 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-xs" style={{ color: "#6b6460" }}>
              Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
            {page.footerText && (
              <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
                {page.footerText}
              </p>
            )}
            <p className="text-xs" style={{ color: "#8a8078" }}>
              Gesprekken zijn privé en beveiligd. Benji is geen vervanging van professionele hulp.
            </p>
            <p className="text-xs" style={{ color: "#a09890" }}>
              © Talk To Benji — talktobenji.com
            </p>
          </div>
        </footer>

      </div>

      {/* Ien popup */}
      {showIen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowIen(false)}
        >
          <div
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            style={{ background: "#fdf9f4" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-end px-5 pt-4 pb-2" style={{ background: "#fdf9f4" }}>
              <button onClick={() => setShowIen(false)} className="p-1.5 rounded-full" style={{ color: "#8a8078" }}>
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-10 space-y-4 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <h2 className="text-lg font-semibold" style={{ color: "#3d3530" }}>Waarom ik Talk To Benji ben gestart</h2>
              <p>Verlies is iets wat iedereen meemaakt.</p>
              <p>Iemand die ziek is en midden in zware behandelingen zit. Van uitslag naar uitslag, van controle naar controle. Het leven dat op pauze lijkt te staan, terwijl de zorgen zich opstapelen en de onzekerheid constant aan je trekt.</p>
              <p>Een scheiding die een relatie doet eindigen. Niet alleen het verlies van een partner, maar ook van een gedeelde toekomst, van plannen, van een thuis zoals je het kende.</p>
              <p>De één verliest een dierbare, iemand die er altijd was en er nu opeens niet meer is.</p>
              <p>Verdriet heeft geen vaste vorm. Het past niet altijd in een categorie, en het volgt zeker geen planning.</p>
              <p>Maar er is iets wat ik keer op keer zie, al jaren.<br />Verdriet wordt heel vaak alleen gedragen.</p>
              <p>Niet omdat er niemand is. Maar omdat je niemand wilt belasten. Omdat iedereen het druk heeft. Omdat je je misschien al te veel voelt.</p>
              <p>Ik weet hoe dat voelt. Ik zag het van dichtbij toen mijn schoonzus ziek werd en overleed. Het verdriet van haar man, haar kinderen, haar broers en zussen, iedereen op zijn eigen manier, en iedereen ergens ook alleen.</p>
              <p>Ik woon zelf in Zweden, ver van familie en vrienden in Nederland. Die afstand voegt iets extra's toe aan verdriet. Dat gevoel van ver weg zijn midden in verdriet heeft mede Benji doen ontstaan.</p>
              <p>Vanuit die overtuiging begon ik vier jaar geleden Beterschap-cadeau.nl, een plek voor mensen die iemand willen steunen die iets moeilijks meemaakt.</p>
              <Image src="/images/beterschap-cadeau.png" alt="Beterschap-cadeau.nl" width={600} height={380} className="w-full rounded-xl" />
              <p>Er volgde een troostwoordenboekje, omdat mensen behoefte bleken te hebben aan woorden als die van henzelf niet komen.</p>
              <div className="flex justify-center">
                <Image src="/images/troostende-woorden-cover.png" alt="Troostende woorden" width={200} height={280} className="rounded-xl shadow-sm" />
              </div>
              <p>En langzaamaan groeide de vraag die me al die tijd bezighield: hoe kan ik mensen direct helpen, op het moment dat ze er zelf mee zitten?</p>
              <p>Benji is het antwoord op die vraag.</p>
              <p>Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet, ook als je het (nog) niet hardop durft te zeggen.</p>
              <div className="flex items-center gap-3 pt-2">
                <Image src="/images/ien-founder.png" alt="Ien" width={48} height={48} className="rounded-full flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm" style={{ color: "#3d3530" }}>Ien</p>
                  <p className="text-xs" style={{ color: "#8a8078" }}>Founder, Talk To Benji</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


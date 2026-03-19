"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notFound, useParams } from "next/navigation";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { KoopKnopLink } from "@/components/KoopKnopLink";
import { VerhaalPopup } from "@/components/VerhaalPopup";

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
      <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", flexDirection: "column" }}>
        <HeaderBar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
        </div>
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

        {/* Header */}
        <HeaderBar />

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
            <KoopKnopLink
              href={ctaUrl}
              buttonLabel={ctaText}
              className="inline-block w-full sm:w-auto sm:px-10 py-3.5 rounded-2xl font-medium text-white text-sm"
              style={{ background: "#6d84a8" }}
            >
              {ctaText}
            </KoopKnopLink>
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
                  {(page as any).voorWieTitle || "Dit is voor jou als..."}
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
                <KoopKnopLink
                  href={ctaUrl}
                  buttonLabel={ctaText}
                  className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
                  style={{ background: "#6d84a8" }}
                >
                  {ctaText}
                </KoopKnopLink>
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

      {showIen && <VerhaalPopup onClose={() => setShowIen(false)} />}
    </div>
  );
}


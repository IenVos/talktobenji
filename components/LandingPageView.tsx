"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { KoopKnopLink } from "@/components/KoopKnopLink";
import { VerhaalPopup } from "@/components/VerhaalPopup";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Ervaring {
  tekst: string;
  naam: string;
  context?: string;
}

interface Vraag {
  vraag: string;
  antwoord: string;
}

interface PricingBlock {
  titel: string;
  subtitel?: string;
  prijs: string;
  tekst?: string;
  aanbevolen?: boolean;
  ctaTekst?: string;
  ctaUrl?: string;
}

interface FeatureSlide {
  afbeelding: string;  // URL of pad
  titel: string;
  onderschrift?: string;
}

function FeatureSlider({ label, titel, slides }: { label?: string; titel?: string; slides: FeatureSlide[] }) {
  const [active, setActive] = useState(0);
  if (slides.length === 0) return null;
  const prev = () => setActive((a) => (a - 1 + slides.length) % slides.length);
  const next = () => setActive((a) => (a + 1) % slides.length);
  return (
    <section className="px-5 pb-12">
      <div className="max-w-2xl mx-auto text-center">
        {label && (
          <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>{label}</p>
        )}
        {titel && (
          <h2 className="text-2xl font-semibold mb-8" style={{ color: "#3d3530" }}>{titel}</h2>
        )}
        <div className="relative flex items-center gap-3">
          <button
            onClick={prev}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
            style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(160,148,136,0.35)" }}
            aria-label="Vorige"
          >
            <ChevronLeft size={18} style={{ color: "#8a8078" }} />
          </button>
          <div className="flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {slides.map((slide, i) => (
                <div key={i} className="flex-shrink-0 w-full flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.afbeelding}
                    alt={slide.titel}
                    className="w-full rounded-2xl"
                    style={{ maxHeight: 320, objectFit: "contain", background: "rgba(255,255,255,0.6)" }}
                  />
                  <p className="text-sm font-medium" style={{ color: "#6d84a8" }}>{slide.titel}</p>
                  {slide.onderschrift && (
                    <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>{slide.onderschrift}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={next}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
            style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(160,148,136,0.35)" }}
            aria-label="Volgende"
          >
            <ChevronRight size={18} style={{ color: "#8a8078" }} />
          </button>
        </div>
        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === active ? 20 : 6,
                  height: 6,
                  background: i === active ? "#6d84a8" : "rgba(160,148,136,0.4)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function LandingPageView({ slug }: { slug: string }) {
  const [showIen, setShowIen] = useState(false);
  const page = useQuery(api.landingPages.getBySlug, { slug });

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
  const ctaColor = (page as any).ctaColor || "#6d84a8";
  const hideErvaringen = (page as any).hideErvaringen ?? false;
  const hideVragen = (page as any).hideVragen ?? false;
  const hideWieIsIen = (page as any).hideWieIsIen ?? false;
  const hideMidCta = (page as any).hideMidCta ?? false;

  let pricingBlocks: PricingBlock[] = [];
  try { if ((page as any).pricingBlocksJson) pricingBlocks = JSON.parse((page as any).pricingBlocksJson); } catch {}
  const activePricingBlocks = pricingBlocks.filter(b => b.titel || b.prijs);
  const hasPricing = activePricingBlocks.length > 0;

  let featureSlides: FeatureSlide[] = [];
  try { if ((page as any).featureSlidesJson) featureSlides = JSON.parse((page as any).featureSlidesJson); } catch {}
  const featureSliderLabel = (page as any).featureSliderLabel as string | undefined;
  const featureSliderTitel = (page as any).featureSliderTitel as string | undefined;

  const renderTextWithParagraphs = (text: string) =>
    text.split("\n\n").map((para, i) => {
      const videoMatch = para.trim().match(/^\[video:(.+)\]$/);
      if (videoMatch) {
        const inner = videoMatch[1];
        const isCenter = inner.endsWith(":center");
        const src = isCenter ? inner.slice(0, -7) : inner;
        return isCenter ? (
          <div key={i} className="my-4 flex justify-center">
            <video src={src} controls playsInline
              className="rounded-xl max-h-[360px] w-auto max-w-full"
              style={{ maxWidth: "60%" }}
            />
          </div>
        ) : (
          <video key={i} src={src} controls playsInline
            className="w-auto max-w-full rounded-xl my-4 max-h-[360px] mx-auto block"
          />
        );
      }
      const lines = para.split("\n");
      return (
        <p key={i}>
          {lines.map((line, j) => (
            <span key={j}>{line}{j < lines.length - 1 && <br />}</span>
          ))}
        </p>
      );
    });

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        {(page as any).bgImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(page as any).bgImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

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
            {(page as any).heroVideoUrl && (
              <div className="mb-8">
                <video
                  src={(page as any).heroVideoUrl}
                  controls
                  playsInline
                  className="w-auto max-w-full mx-auto block rounded-2xl"
                  style={{ maxHeight: "420px" }}
                />
              </div>
            )}
            {hasPricing ? (
              <div className={`grid gap-3 mt-2 text-left ${activePricingBlocks.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : activePricingBlocks.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                {activePricingBlocks.map((block, i) => (
                  <div
                    key={i}
                    className="relative flex flex-col rounded-2xl"
                    style={{
                      background: block.aanbevolen ? "rgba(109,132,168,0.12)" : "rgba(255,255,255,0.72)",
                      border: block.aanbevolen ? "2px solid rgba(109,132,168,0.55)" : "1px solid rgba(160,148,136,0.35)",
                      boxShadow: block.aanbevolen ? "0 8px 32px rgba(61,53,48,0.16)" : "0 4px 16px rgba(61,53,48,0.08)",
                      padding: "1.25rem",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {block.aanbevolen && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: "#6d84a8", color: "#fff" }}>
                        Meest gekozen
                      </span>
                    )}
                    {block.titel && (
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#a09088" }}>{block.titel}</p>
                    )}
                    {block.subtitel && (
                      <p className="text-xs mb-2 leading-snug" style={{ color: "#8a8078" }}>{block.subtitel}</p>
                    )}
                    {block.prijs && (
                      <p className="text-xl font-bold mb-3" style={{ color: "#3d3530" }}>{block.prijs}</p>
                    )}
                    {block.tekst && (
                      <ul className="space-y-1.5 mb-4 flex-1">
                        {block.tekst.split("\n").filter(Boolean).map((line, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs" style={{ color: "#6b6460" }}>
                            <span style={{ color: "#a09088", flexShrink: 0, marginTop: 1 }}>✓</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {block.ctaTekst && block.ctaUrl && (
                      <KoopKnopLink
                        href={block.ctaUrl}
                        buttonLabel={block.ctaTekst}
                        className="mt-auto block w-full text-center py-2.5 rounded-xl text-xs font-medium text-white"
                        style={{ background: block.aanbevolen ? "#6d84a8" : "#a09088" }}
                      >
                        {block.ctaTekst}
                      </KoopKnopLink>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <KoopKnopLink
                href={ctaUrl}
                buttonLabel={ctaText}
                className="inline-block w-full sm:w-auto sm:px-10 py-3.5 rounded-2xl font-medium text-white text-sm"
                style={{ background: ctaColor }}
              >
                {ctaText}
              </KoopKnopLink>
            )}
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

        {/* FEATURE SLIDER */}
        {featureSlides.length > 0 && (
          <FeatureSlider
            label={featureSliderLabel}
            titel={featureSliderTitel}
            slides={featureSlides}
          />
        )}

        {/* MID-PAGE CTA */}
        {!hideMidCta && !hasPricing && (
          <section className="px-5 pb-12">
            <div className="max-w-md mx-auto text-center">
              <KoopKnopLink
                href={ctaUrl}
                buttonLabel={ctaText}
                className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm"
                style={{ background: ctaColor }}
              >
                {ctaText}
              </KoopKnopLink>
            </div>
          </section>
        )}

        {/* ERVARINGEN */}
        {ervaringen.length > 0 && !hideErvaringen && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto space-y-4">
              {ervaringen.map((e, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 sm:p-7"
                  style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}
                >
                  <p className="text-2xl mb-3" style={{ color: "#c8bfb8", lineHeight: 1 }}>"</p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#3d3530" }}>
                    {e.tekst}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "#8a8078" }}>
                    — {e.naam}{e.context ? `, ${e.context}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WIE IS IEN */}
        {(page.wieIsTitle || page.wieIsText) && !hideWieIsIen && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src="/images/ien-founder.png"
                    alt="Ien Vos"
                    width={64}
                    height={64}
                    className="rounded-full object-cover flex-shrink-0"
                    style={{ width: 64, height: 64 }}
                  />
                  {page.wieIsTitle && (
                    <h2 className="text-lg font-semibold" style={{ color: "#3d3530" }}>
                      {page.wieIsTitle}
                    </h2>
                  )}
                </div>
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
        {vragen.length > 0 && !hideVragen && (
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

        {/* PRIJSBLOKKEN ONDERAAN — compacte versie */}
        {hasPricing && (
          <section className="px-5 pb-12">
            <div className="max-w-2xl mx-auto">
              <div className={`grid gap-3 ${activePricingBlocks.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : activePricingBlocks.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                {activePricingBlocks.map((block, i) => (
                  <div
                    key={i}
                    className="relative flex flex-col rounded-2xl text-center"
                    style={{
                      background: block.aanbevolen ? "rgba(109,132,168,0.08)" : "rgba(255,255,255,0.55)",
                      border: block.aanbevolen ? "1.5px solid rgba(109,132,168,0.4)" : "1px solid rgba(160,148,136,0.25)",
                      padding: "1.25rem 1rem",
                    }}
                  >
                    {block.aanbevolen && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: "#6d84a8", color: "#fff" }}>
                        Meest gekozen
                      </span>
                    )}
                    {block.titel && (
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#a09088" }}>{block.titel}</p>
                    )}
                    {block.prijs && (
                      <p className="text-lg font-bold mb-3" style={{ color: "#3d3530" }}>{block.prijs}</p>
                    )}
                    {block.ctaTekst && block.ctaUrl && (
                      <KoopKnopLink
                        href={block.ctaUrl}
                        buttonLabel={block.ctaTekst}
                        className="mt-auto block w-full text-center py-2 rounded-xl text-xs font-medium text-white"
                        style={{ background: block.aanbevolen ? "#6d84a8" : "#a09088" }}
                      >
                        {block.ctaTekst}
                      </KoopKnopLink>
                    )}
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
                  <div className="text-sm leading-relaxed mb-7 space-y-3" style={{ color: "#6b6460" }}>
                    {renderTextWithParagraphs(page.finalCtaBody)}
                  </div>
                )}
                {!hasPricing && (
                  <KoopKnopLink
                    href={ctaUrl}
                    buttonLabel={ctaText}
                    className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm"
                    style={{ background: ctaColor }}
                  >
                    {ctaText}
                  </KoopKnopLink>
                )}
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
            <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
              Wil je meer weten over het programma?{" "}
              <a href="/niet-alleen-nl" style={{ color: "#6d84a8" }}>
                Bekijk Niet Alleen →
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

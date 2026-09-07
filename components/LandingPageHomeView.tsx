"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderConcept } from "@/app/home-concept/SiteHeaderConcept";
import { HouvasteKnop } from "@/app/home-concept/HouvasteKnop";
import { KoopKnopLink } from "@/components/KoopKnopLink";
import {
  MessageSquare, PencilLine, CalendarCheck, Gem, Sparkles, HandHelping,
  Heart, Shield, Clock, BookOpen, Star, Mail, Leaf, Users,
} from "lucide-react";

// Zelfde iconensleutels als de "Wat je krijgt"-rij in de standaard LP-weergave,
// zodat een pagina zonder aanpassing in beide stijlen werkt.
const WAT_ICONS: Record<string, React.ElementType> = {
  gesprekken: MessageSquare, reflecties: PencilLine, checkins: CalendarCheck,
  memories: Gem, inspiratie: Sparkles, handreiking: HandHelping, hart: Heart,
  schild: Shield, klok: Clock, boek: BookOpen, ster: Star, mail: Mail,
  blad: Leaf, mensen: Users,
};

type WatItem = { icon: string; naam: string; omschrijving?: string };
type ContentBlock = { titel?: string; tekst?: string };
type PricingBlock = { titel?: string; subtitel?: string; prijs?: string; tekst?: string; aanbevolen?: boolean; ctaTekst?: string; ctaUrl?: string };
type Vraag = { vraag: string; antwoord: string };

function parseJson<T>(raw: unknown): T[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

/** Tekst met \n als <br/> en \n\n als aparte alinea's. */
function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split("\n\n").map((para, i) => (
        <p key={i} className={className}>
          {para.split("\n").map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function LandingPageHomeView({ page }: { page: any }) {
  useEffect(() => {
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "ViewContent");
    }
  }, []);

  const heroTitle: string = page.heroTitle || "";
  const [heroTitleHoofd, ...heroTitleRest] = heroTitle.split("\n");
  const heroAccent = heroTitleRest.join("\n").trim();
  const heroImage = page.heroImageUrl || "/images/achtergrond.png";
  const ctaText = page.ctaText || "Ik wil kennismaken";
  const ctaUrl = page.ctaUrl || "#";
  const heroNote = [page.ctaPrijsTekst, page.ctaMicroCopy].filter(Boolean).join(" · ");

  const watItems = parseJson<WatItem>(page.watJeKrijgtJson).filter((w) => w.naam);
  const contentBlocks = parseJson<ContentBlock>(page.contentBlocksJson).filter((b) => b.titel || b.tekst);
  const pricingBlocks = parseJson<PricingBlock>(page.pricingBlocksJson).filter((b) => b.titel || b.prijs);
  const vragen = parseJson<Vraag>(page.vragenJson).filter((v) => v.vraag);
  const voorWie: string[] = page.voorWieBullets ? String(page.voorWieBullets).split("\n").filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeaderConcept />

      {/* Hero */}
      <section className="relative bg-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src={heroImage} alt="" fill className="object-cover object-center" priority />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
          {page.heroLabel && (
            <p className="text-[#F0B429] text-base sm:text-lg font-semibold mb-4 tracking-wide">
              {page.heroLabel}
            </p>
          )}
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white max-w-3xl mx-auto text-balance">
            {heroTitleHoofd}
            {heroAccent && (
              <span className="block text-primary-200 mt-1">{heroAccent}</span>
            )}
          </h1>
          {page.heroSubtitle && (
            <div className="mt-6 text-lg sm:text-xl text-primary-200 max-w-xl mx-auto leading-relaxed space-y-3">
              <Paragraphs text={page.heroSubtitle} />
            </div>
          )}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <KoopKnopLink
              href={ctaUrl}
              buttonLabel={ctaText}
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow text-base text-center"
            >
              {ctaText}
            </KoopKnopLink>
          </div>
          {heroNote && (
            <p className="mt-6 text-sm text-primary-300">{heroNote}</p>
          )}
        </div>
      </section>

      {/* Intro: sectie 1 als zachte kaart */}
      {(page.section1Title || page.section1Text) && (
        <section className="max-w-2xl mx-auto px-6 pt-14 sm:pt-16 pb-4">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-7 sm:p-9">
            {page.section1Title && (
              <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 text-balance">{page.section1Title}</h2>
            )}
            {page.section1Text && (
              <div className="space-y-4 text-sm sm:text-[15px] text-primary-700 leading-relaxed text-pretty">
                <Paragraphs text={page.section1Text} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sectie 2 */}
      {(page.section2Title || page.section2Text) && (
        <section className="max-w-2xl mx-auto px-6 py-6">
          <div className="text-center">
            {page.section2Title && (
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4 text-balance">{page.section2Title}</h2>
            )}
            {page.section2Text && (
              <div className="space-y-4 text-primary-700 leading-relaxed text-pretty">
                <Paragraphs text={page.section2Text} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Wat je krijgt */}
      {watItems.length > 0 && (
        <section className="py-12 sm:py-16 bg-primary-50">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-400 text-center mb-2">Wat erbij zit</p>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-900 text-center mb-8 text-balance">
              {page.watJeKrijgtTitel || "Wat je krijgt"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watItems.map((w, i) => {
                const Icon = WAT_ICONS[w.icon] ?? Heart;
                return (
                  <div key={i} className="flex items-start gap-4 bg-white border border-primary-100 rounded-2xl p-5">
                    <div className="w-11 h-11 rounded-xl bg-primary-900 text-white flex items-center justify-center flex-shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-primary-900 mb-1">{w.naam}</h3>
                      {w.omschrijving && <p className="text-sm text-primary-600 leading-relaxed">{w.omschrijving}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Inhoudsblokken: hoe het werkt */}
      {contentBlocks.length > 0 && (
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-6 py-14 sm:py-16 space-y-8">
            {contentBlocks.map((b, i) => (
              <div key={i} className="bg-white border-l-2 border-primary-200 pl-6">
                {b.titel && <h3 className="text-lg sm:text-xl font-bold text-primary-900 mb-3 text-balance">{b.titel}</h3>}
                {b.tekst && (
                  <div className="space-y-3 text-sm sm:text-[15px] text-primary-700 leading-relaxed text-pretty">
                    <Paragraphs text={b.tekst} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Voor wie */}
      {voorWie.length > 0 && (
        <section className="bg-primary-50 border-y border-primary-100">
          <div className="max-w-2xl mx-auto px-6 py-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-3 text-balance">
              {page.voorWieTitle || "Dit is voor jou als..."}
            </h2>
            {page.voorWieSubtitel && (
              <p className="text-primary-600 text-center mb-8 max-w-lg mx-auto text-balance">{page.voorWieSubtitel}</p>
            )}
            <ul className="space-y-3 max-w-xl mx-auto">
              {voorWie.map((item, i) => (
                <li key={i} className="flex items-start gap-3 bg-white border border-primary-100 rounded-xl p-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs mt-0.5">✓</span>
                  <span className="text-sm text-primary-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Prijsblokken */}
      {pricingBlocks.length > 0 && (
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
            {(page.pricingTitel || page.pricingSubtitel) && (
              <div className="text-center mb-10">
                {page.pricingTitel && (
                  <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-3 text-balance">{page.pricingTitel}</h2>
                )}
                {page.pricingSubtitel && (
                  <p className="text-primary-600 max-w-lg mx-auto text-balance">{page.pricingSubtitel}</p>
                )}
              </div>
            )}
            <div className={`grid gap-6 ${pricingBlocks.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : pricingBlocks.length >= 3 ? "sm:grid-cols-3" : "max-w-sm mx-auto"}`}>
              {pricingBlocks.map((b, i) => (
                <div
                  key={i}
                  className={`relative flex flex-col rounded-2xl p-7 ${b.aanbevolen ? "bg-primary-900 text-white shadow-lg" : "bg-white border border-primary-100"}`}
                >
                  {b.aanbevolen && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap" style={{ background: "#F0B429", color: "#3d3530" }}>
                      Meest nabij
                    </span>
                  )}
                  {b.titel && (
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${b.aanbevolen ? "text-primary-200" : "text-primary-400"}`}>{b.titel}</p>
                  )}
                  {b.prijs && (
                    <p className={`text-3xl font-bold leading-tight ${b.aanbevolen ? "text-white" : "text-primary-900"}`}>{b.prijs}</p>
                  )}
                  {b.subtitel && (
                    <p className={`text-xs mt-1 mb-5 ${b.aanbevolen ? "text-primary-300" : "text-primary-400"}`}>{b.subtitel}</p>
                  )}
                  {!b.subtitel && <div className="mb-5" />}
                  {b.tekst && (
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {b.tekst.split("\n").filter(Boolean).map((line, j) => (
                        <li key={j} className={`flex items-start gap-2 text-sm leading-relaxed ${b.aanbevolen ? "text-primary-100" : "text-primary-700"}`}>
                          <span className="mt-0.5 flex-shrink-0" style={{ color: b.aanbevolen ? "#F0B429" : "#7ec8e3" }}>✓</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {b.ctaTekst && b.ctaUrl && (
                    <KoopKnopLink
                      href={b.ctaUrl}
                      buttonLabel={b.ctaTekst}
                      className={`mt-auto block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${b.aanbevolen ? "bg-white text-primary-900 hover:bg-primary-50" : "bg-primary-800 text-white hover:bg-primary-700"}`}
                    >
                      {b.ctaTekst}
                    </KoopKnopLink>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Wie is Ien */}
      {(page.wieIsTitle || page.wieIsText) && !page.hideWieIsIen && (
        <section className="bg-primary-50 border-y border-primary-100">
          <div className="max-w-2xl mx-auto px-6 py-14">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3">
                <Image src={page.founderImageUrl || "/images/ien-founder.png"} alt="Ien, oprichter" width={80} height={80} className="object-cover w-full h-full" />
              </div>
              <p className="text-xs font-semibold text-primary-900">Ien</p>
              <p className="text-xs text-primary-400">Founder Talk To Benji</p>
            </div>
            {page.wieIsTitle && (
              <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-5 text-balance text-center">{page.wieIsTitle}</h2>
            )}
            {page.wieIsText && (
              <div className="space-y-4 text-sm text-primary-700 leading-relaxed text-left">
                <Paragraphs text={page.wieIsText} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {vragen.length > 0 && !page.hideVragen && (
        <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-2 text-balance">
            {page.faqTitel || "Veelgestelde vragen"}
          </h2>
          {page.faqSubtitel && <p className="text-primary-500 text-center mb-10 text-sm">{page.faqSubtitel}</p>}
          <div className={`space-y-3 ${page.faqSubtitel ? "" : "mt-8"}`}>
            {vragen.map((item, i) => (
              <details key={i} className="group bg-white border border-[#F0B429] rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none hover:bg-primary-50 transition-colors">
                  <span className="text-sm sm:text-base font-semibold text-primary-900 text-balance pr-2">{item.vraag}</span>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-light leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-5 pt-1">
                  <div className="text-sm text-primary-600 leading-relaxed space-y-2">
                    <Paragraphs text={item.antwoord} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Finale CTA */}
      {(page.finalCtaTitle || page.finalCtaBody) && (
        <section className="bg-primary-900">
          <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
            {page.finalCtaTitle && (
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-balance">{page.finalCtaTitle}</h2>
            )}
            {page.finalCtaBody && (
              <div className="text-primary-200 mb-8 max-w-lg mx-auto text-balance space-y-3">
                <Paragraphs text={page.finalCtaBody} />
              </div>
            )}
            <KoopKnopLink
              href={ctaUrl}
              buttonLabel={ctaText}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow text-base"
            >
              {ctaText}
            </KoopKnopLink>
            {heroNote && <p className="mt-5 text-sm text-primary-300">{heroNote}</p>}
          </div>
        </section>
      )}

      <SiteFooter />
      {page.houvastKnop && <HouvasteKnop type={page.houvastType || undefined} />}
    </div>
  );
}

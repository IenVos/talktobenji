"use client";

import Image from "next/image";
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
type Ervaring = { tekst: string; naam?: string; context?: string };

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
  const prijsTekst = (page.ctaPrijsTekst || "").trim();
  const reassurance = (page.ctaMicroCopy || "").trim();

  const watItems = parseJson<WatItem>(page.watJeKrijgtJson).filter((w) => w.naam);
  const verloopStappen = parseJson<{ titel?: string; tekst?: string }>(page.verloopJson).filter((s) => s.titel || s.tekst);
  const contentBlocks = parseJson<ContentBlock>(page.contentBlocksJson).filter((b) => b.titel || b.tekst);
  const pricingBlocks = parseJson<PricingBlock>(page.pricingBlocksJson).filter((b) => b.titel || b.prijs);
  const vragen = parseJson<Vraag>(page.vragenJson).filter((v) => v.vraag);
  const ervaringen = parseJson<Ervaring>(page.ervaringenJson).filter((e) => e.tekst);
  const voorWie: string[] = page.voorWieBullets ? String(page.voorWieBullets).split("\n").filter(Boolean) : [];

  // Herbruikbare CTA-knop (licht op donker, of primair op licht).
  const CtaKnop = ({ label, variant = "wit" }: { label: string; variant?: "wit" | "donker" }) => (
    <KoopKnopLink
      href={ctaUrl}
      buttonLabel={label}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold shadow transition-colors ${
        variant === "wit"
          ? "bg-white text-primary-900 hover:bg-primary-50"
          : "bg-primary-800 text-white hover:bg-primary-700"
      }`}
    >
      {label}
    </KoopKnopLink>
  );

  // Tussentijdse CTA-strook op lichte achtergrond, met eigen (contextuele) tekst.
  const MidCta = ({ label }: { label: string }) => (
    <section className="bg-white">
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <CtaKnop label={label} variant="donker" />
        {prijsTekst && <p className="mt-4 text-sm text-primary-500">{prijsTekst}</p>}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteHeaderConcept />

      {/* 1. HERO / HOOK */}
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
            {heroAccent && <span className="block text-primary-200 mt-1">{heroAccent}</span>}
          </h1>
          {page.heroSubtitle && (
            <div className="mt-6 text-lg sm:text-xl text-primary-200 max-w-2xl mx-auto leading-relaxed space-y-4">
              <Paragraphs text={page.heroSubtitle} />
            </div>
          )}
          <div className="mt-10">
            <CtaKnop label={ctaText} />
          </div>
          {prijsTekst && <p className="mt-6 text-sm text-primary-300">{prijsTekst}</p>}
        </div>
      </section>

      {/* 2. HERKENNING / PROBLEEM */}
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

      {/* 3. NIEUWE MOGELIJKHEID / BIG IDEA */}
      {(page.section2Title || page.section2Text) && (
        <section className="max-w-2xl mx-auto px-6 py-12 sm:py-14">
          <div className="text-center">
            {page.section2Title && (
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4 text-balance">{page.section2Title}</h2>
            )}
            {page.section2Text && (
              <div className="space-y-4 text-primary-700 leading-relaxed text-pretty text-lg">
                <Paragraphs text={page.section2Text} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. VOOR WIE */}
      {voorWie.length > 0 && (
        <section className="bg-primary-50 border-y border-primary-100">
          <div className="max-w-2xl mx-auto px-6 py-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-3 text-balance">
              {page.voorWieTitle || "Dit is voor jou als je..."}
            </h2>
            {page.voorWieSubtitel && (
              <p className="text-primary-600 text-center mb-8 max-w-lg mx-auto text-balance font-medium">{page.voorWieSubtitel}</p>
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

      <MidCta label="Dit is precies wat ik nodig heb" />

      {/* 5. BELOOFDE ERVARING / HOE HET WERKT / WAT IS BENJI */}
      {contentBlocks.length > 0 && (
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-6 pt-4 pb-14 sm:pb-16 space-y-8">
            {contentBlocks.map((b, i) => (
              <div key={i} className="border-l-2 border-primary-200 pl-6">
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

      {/* 5b. VERLOOP-TIJDLIJN (infographic: wat je kunt verwachten + uitkomst) */}
      {verloopStappen.length > 0 && (
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
            {page.verloopLabel && (
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4a7c59" }}>
                {page.verloopLabel}
              </p>
            )}
            {page.verloopTitel && (
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-3 text-balance">
                {page.verloopTitel}
              </h2>
            )}
            {page.verloopIntro && (
              <div className="text-primary-600 leading-relaxed mb-10 max-w-xl text-pretty">
                <Paragraphs text={page.verloopIntro} />
              </div>
            )}

            <ol className="relative">
              {/* verticale lijn */}
              <span className="absolute left-[19px] top-2 bottom-2 w-px bg-primary-100" aria-hidden="true" />
              {verloopStappen.map((s, i) => (
                <li key={i} className="relative flex gap-5 pb-9 last:pb-0">
                  <span
                    className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center text-sm font-bold"
                    style={{ borderColor: "#4a7c59", color: "#4a7c59" }}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    {s.titel && <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-1.5">{s.titel}</h3>}
                    {s.tekst && (
                      <div className="text-sm sm:text-[15px] text-primary-600 leading-relaxed text-pretty">
                        <Paragraphs text={s.tekst} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {(page.verloopUitkomstTitel || page.verloopUitkomst) && (
              <div className="mt-8 rounded-2xl p-6 sm:p-8" style={{ backgroundColor: "#f0f5f1", border: "1px solid #cfe0d5" }}>
                {page.verloopUitkomstTitel && (
                  <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: "#3f6b4d" }}>
                    {page.verloopUitkomstTitel}
                  </h3>
                )}
                {page.verloopUitkomst && (
                  <div className="text-sm sm:text-[15px] leading-relaxed text-pretty" style={{ color: "#3f6b4d" }}>
                    <Paragraphs text={page.verloopUitkomst} />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. WAT JE KRIJGT */}
      {watItems.length > 0 && !page.hideWatJeKrijgt && (
        <section className="py-12 sm:py-16 bg-primary-50 border-y border-primary-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-400 text-center mb-2">Inbegrepen</p>
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

      {/* 7. AANBOD / OFFER CARD */}
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
            <div className={`grid gap-6 ${pricingBlocks.length === 1 ? "max-w-md mx-auto" : pricingBlocks.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : "sm:grid-cols-3"}`}>
              {pricingBlocks.map((b, i) => (
                <div key={i} className={`relative flex flex-col rounded-2xl p-7 ${b.aanbevolen ? "bg-primary-900 text-white shadow-xl" : "bg-white border border-primary-100"}`}>
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
                          <span className="mt-0.5 flex-shrink-0" style={{ color: "#F0B429" }}>✓</span>
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
            {reassurance && (
              <p className="mt-6 text-sm text-primary-500 text-center max-w-md mx-auto text-balance">{reassurance}</p>
            )}
          </div>
        </section>
      )}

      {/* 8. WIE IS IEN */}
      {(page.wieIsTitle || page.wieIsText) && !page.hideWieIsIen && (
        <section className="bg-primary-50 border-y border-primary-100">
          <div className="max-w-2xl mx-auto px-6 py-14">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3">
                <Image src={page.founderImageUrl || "/images/ien-founder.png"} alt="Ien, oprichter" width={96} height={96} className="object-cover w-full h-full" />
              </div>
              <p className="text-sm font-semibold text-primary-900">Ien</p>
              <p className="text-xs text-primary-400">Founder Talk To Benji</p>
            </div>
            {page.wieIsTitle && (
              <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-5 text-balance text-center">{page.wieIsTitle}</h2>
            )}
            {page.wieIsText && (
              <div className="space-y-4 text-sm sm:text-[15px] text-primary-700 leading-relaxed text-left">
                <Paragraphs text={page.wieIsText} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 9. SOCIAL PROOF */}
      {ervaringen.length > 0 && !page.hideErvaringen && (
        <section className="bg-white border-b border-primary-100">
          <div className="max-w-5xl mx-auto px-6 py-14 sm:py-16">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-900 text-center mb-8 text-balance">
              {page.ervaringenTitel || "Wat anderen ervaren"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ervaringen.slice(0, 4).map((e, i) => (
                <div key={i} className="bg-white rounded-xl border border-primary-100 flex flex-col p-5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-200 mb-2 flex-shrink-0" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-sm leading-relaxed italic mb-3 flex-1 text-pretty text-primary-700">{e.tekst}</p>
                  {(e.naam || e.context) && (
                    <p className="text-xs font-medium text-primary-400">{[e.naam, e.context].filter(Boolean).join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {ervaringen.length > 0 && <MidCta label={ctaText} />}

      {/* 10. FAQ / BEZWAARAFHANDELING */}
      {vragen.length > 0 && !page.hideVragen && (
        <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-2 text-balance">
            {page.faqTitel || "Misschien vraag je je dit af"}
          </h2>
          {page.faqSubtitel && <p className="text-primary-500 text-center mb-8 text-sm">{page.faqSubtitel}</p>}
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

      {/* 11. FINALE CTA */}
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
            <CtaKnop label={ctaText} />
            {prijsTekst && <p className="mt-5 text-sm text-primary-300">{prijsTekst}</p>}
            {reassurance && <p className="mt-2 text-sm text-primary-300 max-w-md mx-auto text-balance">{reassurance}</p>}
          </div>
        </section>
      )}

      <SiteFooter />
      {page.houvastKnop && <HouvasteKnop type={page.houvastType || undefined} />}
    </div>
  );
}

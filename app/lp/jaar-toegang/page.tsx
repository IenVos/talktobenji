"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { KoopKnopLink } from "@/components/KoopKnopLink";
import { VerhaalPopup } from "@/components/VerhaalPopup";
import {
  MessageCircle, CheckSquare, BookOpen, Heart,
  Lightbulb, Sparkles, FileText, Clock, Palette, Star,
} from "lucide-react";

const FEATURE_ICONS = [
  MessageCircle, CheckSquare, BookOpen, Heart,
  Lightbulb, Sparkles, FileText, Clock, Palette, Star,
];

interface Ervaring { tekst: string; naam: string; context?: string }
interface Vraag { vraag: string; antwoord: string }

function parseFeatures(text: string) {
  return text.split("\n\n").filter(Boolean).map((block) => {
    const i = block.indexOf(" — ");
    if (i === -1) return { name: block, desc: "" };
    return { name: block.slice(0, i), desc: block.slice(i + 3) };
  });
}

const CARD = { background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 16px rgba(0,0,0,0.09)", border: "1px solid rgba(0,0,0,0.09)" };

export default function JaarToegangPage() {
  const [showIen, setShowIen] = useState(false);
  const page = useQuery(api.landingPages.getBySlug, { slug: "jaar-toegang" });

  if (page === undefined) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fdf9f4" }}>
        <HeaderBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
        </div>
      </div>
    );
  }
  if (page === null) return null;

  const features = page.section1Text ? parseFeatures(page.section1Text) : [];
  const voorWieBullets = page.voorWieBullets ? page.voorWieBullets.split("\n").filter(Boolean) : [];
  let ervaringen: Ervaring[] = [];
  try { if (page.ervaringenJson) ervaringen = JSON.parse(page.ervaringenJson); } catch { /* */ }
  let vragen: Vraag[] = [];
  try { if (page.vragenJson) vragen = JSON.parse(page.vragenJson); } catch { /* */ }

  const ctaUrl = page.ctaUrl || "#";
  const ctaText = page.ctaText || "Krijg toegang";

  return (
    <div className="min-h-screen relative" style={{ background: "#fdf9f4" }}>

      {/* Achtergrond */}
      <div className="fixed inset-0 z-0">
        {(page as any).bgImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(page as any).bgImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        )}
        <div className="absolute inset-0" style={{ background: "rgba(253,249,244,0.88)" }} />
      </div>

      <div className="relative z-10">
        <HeaderBar />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="text-center px-5 pt-14 pb-16 max-w-2xl mx-auto">
          {page.heroLabel && (
            <p className="text-xs uppercase tracking-[0.16em] font-medium mb-6" style={{ color: "#9a9088" }}>
              {page.heroLabel}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-5" style={{ color: "#2e2a26", textWrap: "balance" } as React.CSSProperties}>
            {page.heroTitle}
          </h1>
          {page.heroSubtitle && (
            <p className="text-base sm:text-lg leading-relaxed mb-4 max-w-xl mx-auto" style={{ color: "#6b6460" }}>
              {page.heroSubtitle}
            </p>
          )}
          {page.heroBody && (
            <p className="text-sm font-medium mb-8" style={{ color: "#8a8078" }}>
              {page.heroBody}
            </p>
          )}
          <KoopKnopLink
            href={ctaUrl}
            buttonLabel={ctaText}
            className="inline-block px-10 py-4 rounded-2xl font-semibold text-white text-base"
            style={{ background: "#6d84a8" }}
          >
            {ctaText}
          </KoopKnopLink>
        </section>

        {/* ── FEATURES GRID ────────────────────────────────────── */}
        {features.length > 0 && (
          <section className="px-5 pb-16">
            <div className="max-w-3xl mx-auto">
              {page.section1Title && (
                <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8" style={{ color: "#2e2a26" }}>
                  {page.section1Title}
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f, i) => {
                  const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                  return (
                    <div key={i} className="rounded-2xl p-5" style={CARD}>
                      <Icon size={18} strokeWidth={1.5} className="mb-2" style={{ color: "#6d84a8" }} />
                      <p className="font-semibold text-sm mb-1" style={{ color: "#2e2a26" }}>{f.name}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── VOOR WIE ─────────────────────────────────────────── */}
        {voorWieBullets.length > 0 && (
          <section className="px-5 pb-16">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8" style={{ color: "#2e2a26" }}>
                {(page as any).voorWieTitle || "Voor wie is dit?"}
              </h2>
              <div className="space-y-3">
                {voorWieBullets.map((item, i) => (
                  <div key={i} className="rounded-2xl px-6 py-5" style={CARD}>
                    <p className="text-base leading-relaxed" style={{ color: "#3d3530" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── IEN / FOUNDER ────────────────────────────────────── */}
        <section className="px-5 pb-10">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl p-6 flex items-start gap-4" style={CARD}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ien-founder.png"
                alt="Ien"
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: "#2e2a26" }}>Ien</p>
                <p className="text-xs mb-2" style={{ color: "#6d84a8" }}>Founder van Talk To Benji</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  {page.wieIsText
                    ? page.wieIsText.split("\n\n")[0]
                    : "Benji is gemaakt omdat verdriet geen kantooruren kent. Omdat iemand die mist niet tot maandag kan wachten."}
                </p>
              </div>
            </div>

            {/* Citaat */}
            <blockquote
              className="mt-4 px-6 py-5 rounded-2xl border-l-4"
              style={{ ...CARD, borderLeftColor: "#6d84a8" }}
            >
              <p className="text-base italic font-medium" style={{ color: "#3d3530" }}>
                Dit is wat ik toen had willen hebben.
              </p>
            </blockquote>
          </div>
        </section>

        {/* ── ERVARINGEN ───────────────────────────────────────── */}
        {ervaringen.length > 0 && (
          <section className="px-5 py-10">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-[0.16em] font-medium text-center mb-8" style={{ color: "#9a9088" }}>
                Wat anderen zeggen
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ervaringen.map((e, i) => (
                  <div key={i} className="rounded-2xl p-6" style={CARD}>
                    <p className="text-base leading-relaxed mb-4" style={{ color: "#3d3530" }}>
                      "{e.tekst}"
                    </p>
                    <p className="text-sm italic" style={{ color: "#8a8078" }}>
                      {e.naam}{e.context ? `, ${e.context}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ (altijd open — beter voor leesbaarheid) ───────── */}
        {vragen.length > 0 && (
          <section className="px-5 py-10">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8" style={{ color: "#2e2a26" }}>
                Veelgestelde vragen
              </h2>
              <div className="space-y-3">
                {vragen.map((v, i) => (
                  <div key={i} className="rounded-2xl px-6 py-5" style={CARD}>
                    <p className="font-semibold text-sm mb-2" style={{ color: "#2e2a26" }}>{v.vraag}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{v.antwoord}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FINALE CTA ───────────────────────────────────────── */}
        {(page.finalCtaTitle || page.finalCtaBody) && (
          <section className="px-5 pb-20">
            <div className="max-w-xl mx-auto text-center">
              <div
                className="rounded-2xl px-8 py-10"
                style={{ ...CARD, border: "2px solid rgba(109,132,168,0.30)", boxShadow: "0 4px 32px rgba(0,0,0,0.12)" }}
              >
                {page.finalCtaTitle && (
                  <h2 className="text-2xl font-semibold mb-3 leading-snug" style={{ color: "#2e2a26", textWrap: "balance" } as React.CSSProperties}>
                    {page.finalCtaTitle}
                  </h2>
                )}
                {page.finalCtaBody && (
                  <p className="text-sm leading-relaxed mb-7" style={{ color: "#6b6460" }}>
                    {page.finalCtaBody}
                  </p>
                )}
                <KoopKnopLink
                  href={ctaUrl}
                  buttonLabel={ctaText}
                  className="inline-block w-full py-4 rounded-2xl font-semibold text-white text-base mb-4"
                  style={{ background: "#6d84a8" }}
                >
                  {ctaText}
                </KoopKnopLink>
                <p className="text-xs" style={{ color: "#9a9088" }}>
                  Veilig betalen · direct toegang · geen automatische verlenging
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="px-5 py-10 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="max-w-lg mx-auto space-y-2">
            <p className="text-xs" style={{ color: "#6b6460" }}>
              Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
            {page.footerText && (
              <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>{page.footerText}</p>
            )}
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

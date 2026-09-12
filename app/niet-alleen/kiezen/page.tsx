"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, PawPrint, Users, MessageCircle, Leaf, ArrowRight, type LucideIcon } from "lucide-react";
import { HeaderBar } from "@/components/chat/HeaderBar";

type TypeKey = "persoon" | "huisdier" | "relatie" | "eenzaamheid" | "kinderloos";

const TYPES: {
  key: TypeKey;
  titel: string;
  sub: string;
  slug: string;
  icon: LucideIcon;
}[] = [
  { key: "persoon",     titel: "Ik mis iemand",            sub: "Je verloor iemand die je lief was.",                 slug: "verlies-persoon",     icon: Heart },
  { key: "huisdier",    titel: "Ik verloor mijn dier",     sub: "Een maatje dat zoveel meer was dan “maar een dier”.", slug: "verlies-huisdier",    icon: PawPrint },
  { key: "relatie",     titel: "Mijn relatie is voorbij",  sub: "Je hoofd is er nog niet klaar mee.",                 slug: "relatie-voorbij",     icon: Users },
  { key: "eenzaamheid", titel: "Ik voel me eenzaam",       sub: "Omringd door mensen, en toch alleen.",               slug: "ik-voel-me-eenzaam",  icon: MessageCircle },
  { key: "kinderloos",  titel: "Ongewenst kinderloos",     sub: "Een verdriet dat mensen niet kunnen zien.",          slug: "ongewenst-kinderloos", icon: Leaf },
];

// EH deelt soms "scheiding" voor het relatie-type
const ALIAS: Record<string, TypeKey> = { scheiding: "relatie" };

function normaliseerType(raw: string | null): TypeKey | null {
  if (!raw) return null;
  const v = raw.toLowerCase().trim();
  if (TYPES.some((t) => t.key === v)) return v as TypeKey;
  return ALIAS[v] ?? null;
}

function KiezenInhoud() {
  const params = useSearchParams();
  const gekozen = normaliseerType(params?.get("type") ?? null);

  // Als ze een type deelden bij EH: die kaart bovenaan.
  const gesorteerd = gekozen
    ? [...TYPES].sort((a, b) => (a.key === gekozen ? -1 : b.key === gekozen ? 1 : 0))
    : TYPES;

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", flexDirection: "column" }}>
      {/* Achtergrond */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
        <HeaderBar />

        {/* Kop */}
        <section className="px-5 pt-8 pb-6 text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
              Niet Alleen
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ color: "#3d3530" }}>
              Wat draag jij met je mee?
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              Kies wat het dichtst bij jou ligt. Dan laat ik je zien hoe Niet Alleen jou daarin kan bijstaan.
            </p>
          </div>
        </section>

        {/* Keuzekaarten */}
        <section className="px-4 pb-20">
          <div className="max-w-xl mx-auto grid grid-cols-1 gap-3">
            {gesorteerd.map((t) => {
              const Icon = t.icon;
              const isGekozen = t.key === gekozen;
              return (
                <Link
                  key={t.key}
                  href={`/lp/${t.slug}`}
                  className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-shadow"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: isGekozen ? "0 6px 24px rgba(109,132,168,0.28)" : "0 4px 20px rgba(0,0,0,0.10)",
                    border: isGekozen ? "1.5px solid #6d84a8" : "1px solid rgba(109,132,168,0.18)",
                  }}
                >
                  <span
                    className="flex-shrink-0 flex items-center justify-center rounded-xl"
                    style={{ width: 46, height: 46, background: "#eef2f7", color: "#6d84a8" }}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="flex-1 min-w-0">
                    {isGekozen && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#6d84a8", letterSpacing: "0.08em" }}>
                        Dit deelde je met ons
                      </span>
                    )}
                    <span className="block text-base font-semibold leading-snug" style={{ color: "#3d3530" }}>
                      {t.titel}
                    </span>
                    <span className="block text-xs leading-relaxed" style={{ color: "#6b6460" }}>
                      {t.sub}
                    </span>
                  </span>
                  <ArrowRight size={18} className="flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#6d84a8" }} />
                </Link>
              );
            })}
          </div>

          <p className="max-w-xl mx-auto text-center text-xs mt-6" style={{ color: "#8a8078" }}>
            Herken je je niet helemaal in een van deze? Kies dan wat er het dichtst bij komt.
          </p>
        </section>
      </div>

      {/* Blauwe footer */}
      <footer className="bg-primary-900 text-white py-6 sm:py-8" style={{ position: "relative", zIndex: 1 }}>
        <div className="w-full max-w-xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-primary-200">
            <Link href="/faq" className="hover:text-white transition-colors">Veelgestelde vragen</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/algemene-voorwaarden" className="hover:text-white transition-colors">Algemene voorwaarden</Link>
            <a href="mailto:contactmetien@talktobenji.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function KiezenPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fdf9f4" }} />}>
      <KiezenInhoud />
    </Suspense>
  );
}

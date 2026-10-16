"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ErZijnFlipbook } from "@/components/ErZijnFlipbook";

// Standaardinhoud (fallback als de bewerkbare CTA-record "er-zijn" nog niet
// geladen/bestaat). De teksten zijn in de admin aan te passen via /admin/cta.
const DEFAULT = {
  eyebrow: "Digitaal boekje",
  title: "Er Zijn",
  subtitle: "Wat je zegt als je niet weet wat je moet zeggen",
  body: "Iemand in je omgeving heeft verdriet, en je wilt er zijn. Maar wat zeg je dan? Dit boekje helpt je op weg.",
  bullets: [
    "Woorden die wél troosten bij verlies, verdriet of eenzaamheid",
    "Wat je beter niet zegt, en wat je in plaats daarvan kunt doen",
    "Een spiekbriefje met zinnen om te sturen of te zeggen",
    "68 pagina's, direct in je inbox",
  ],
  buttonText: "Download het boekje →",
  buttonUrl: "/betalen/er-zijn",
};

export function ErZijnBlock() {
  const product = useQuery(api.checkoutProducts.getBySlug, { slug: "er-zijn" });
  const ctaBlocks = useQuery(api.ctaBlocks.listAll, {});
  const card = ctaBlocks?.find((b: any) => b.key === "er-zijn");

  const eyebrow = card?.eyebrow || DEFAULT.eyebrow;
  const title = card?.title || DEFAULT.title;
  const subtitle = card?.subtitle || DEFAULT.subtitle;
  const intro = card?.body || DEFAULT.body;
  const bullets = card?.bullets?.length ? card.bullets : DEFAULT.bullets;
  const buttonText = card?.buttonText || DEFAULT.buttonText;
  const buttonUrl = card?.buttonUrl || DEFAULT.buttonUrl;

  const prijs =
    product?.priceInCents != null
      ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
          product.priceInCents / 100,
        )
      : "€17,00";

  return (
    <div className="my-10 rounded-2xl overflow-hidden border" style={{ background: "#faf7f4", borderColor: "#e8e1d9" }}>
      {/* Flipbook bovenaan */}
      <div className="px-5 pt-7 pb-6" style={{ background: "#f2ece5" }}>
        <ErZijnFlipbook />
      </div>

      {/* Streep */}
      <div style={{ borderTop: "1px solid #e8e1d9" }} />

      {/* Productinfo onder de streep */}
      <div className="px-6 py-7 max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "#a08c78", letterSpacing: "0.14em" }}>
          {eyebrow}
        </p>
        <h3 className="text-2xl font-semibold mb-1" style={{ color: "#3d3530" }}>
          {title}
        </h3>
        <p className="text-base mb-4" style={{ color: "#6d84a8" }}>
          {subtitle}
        </p>
        <p className="text-sm leading-relaxed mb-5 max-w-lg mx-auto" style={{ color: "#6b6460" }}>
          {intro}
        </p>

        <ul className="space-y-2 mb-6 text-left max-w-md mx-auto">
          {bullets.map((punt: string) => (
            <li key={punt} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <Check size={16} className="shrink-0 mt-0.5" style={{ color: "#6d84a8" }} />
              <span>{punt}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-center gap-3">
          <Link
            href={buttonUrl}
            className="inline-block text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
            style={{ background: "#6d84a8", color: "#fff", textDecoration: "none" }}
          >
            {buttonText}
          </Link>
          <span className="text-base font-semibold" style={{ color: "#3d3530" }}>
            {prijs}
          </span>
        </div>
        <p className="text-xs mt-3" style={{ color: "#a08c78" }}>
          {card?.footnote || "Eenmalige aankoop · Direct te downloaden"}
        </p>
      </div>
    </div>
  );
}

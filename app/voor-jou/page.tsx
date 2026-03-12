"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ExternalLink,
  Pencil, Waves, BookOpen, Heart, Leaf, Sun, Feather, Star,
  Anchor, Wind, Sparkles, Flame, Music, Compass, Cloud, MessageCircle,
  Flower2, Coffee, Umbrella, Bird, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  pencil: Pencil, waves: Waves, bookOpen: BookOpen, heart: Heart,
  leaf: Leaf, sun: Sun, feather: Feather, star: Star, anchor: Anchor,
  wind: Wind, sparkles: Sparkles, flame: Flame, music: Music,
  compass: Compass, cloud: Cloud, messageCircle: MessageCircle,
  flower2: Flower2, coffee: Coffee, umbrella: Umbrella, bird: Bird,
};

function CardIcon({ name, size = 18 }: { name?: string | null; size?: number }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} className="flex-shrink-0" />;
}

export default function VoorJouPage() {
  const items = useQuery(api.onderweg.listVoorJou, {});

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", flexDirection: "column" }}>

      {/* Achtergrond */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>

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

        {/* Header */}
        <section className="px-5 pt-8 pb-6 text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
              Van Talk To Benji
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ color: "#3d3530" }}>
              Voor jou
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              Producten en programma's die je kunnen helpen als je iets moeilijks meemaakt.
            </p>
          </div>
        </section>

        {/* Productkaarten */}
        <section className="px-2 sm:px-4 pb-20">
          <div className="max-w-xl mx-auto">
            {items === undefined ? (
              <div className="py-12 text-center text-sm" style={{ color: "#8a8078" }}>Laden…</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: "#8a8078" }}>Binnenkort meer hier.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
                      border: "1px solid rgba(109,132,168,0.18)",
                    }}
                  >
                    {item.imageUrl ? (
                      <div className="w-full overflow-hidden" style={{ aspectRatio: "1/1" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title ?? ""}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full"
                        style={{ aspectRatio: "1/1", background: "linear-gradient(135deg, #e8eef5 0%, #f5f0eb 100%)" }}
                      />
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      {item.title && (
                        <h2 className="text-sm font-semibold leading-snug mb-1.5" style={{ color: "#3d3530" }}>
                          {item.title}
                        </h2>
                      )}
                      {item.content && (
                        <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: "#6b6460" }}>
                          {item.content}
                        </p>
                      )}
                      {item.paymentUrl && (
                        <a
                          href={item.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                          style={{ background: "#6d84a8" }}
                        >
                          <CardIcon name={(item as any).icon} size={13} />
                          {item.buttonLabel ?? "Bekijken"}
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Blauwe footer */}
      <footer className="bg-primary-900 text-white py-6 sm:py-8" style={{ position: "relative", zIndex: 1 }}>
        <div className="w-full max-w-xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-primary-200">
            <Link href="/faq" className="hover:text-white transition-colors">
              Veelgestelde vragen
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/algemene-voorwaarden" className="hover:text-white transition-colors">
              Algemene voorwaarden
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

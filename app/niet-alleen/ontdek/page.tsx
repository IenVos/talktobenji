"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Heart, BookOpen, Lightbulb, ArrowRight } from "lucide-react";

const FUNCTIES = [
  {
    icon: MessageCircle,
    titel: "Gesprekken met Benji",
    beschrijving:
      "Altijd iemand die luistert. Geen oordeel, geen haast. Benji is er wanneer jij het nodig hebt — ook 's nachts.",
  },
  {
    icon: Heart,
    titel: "Memories",
    beschrijving:
      "Bewaar herinneringen, momenten en gedachten die je niet wilt vergeten. Jouw persoonlijke schatkist.",
  },
  {
    icon: BookOpen,
    titel: "Handreikingen",
    beschrijving:
      "Geleide oefeningen — zoals het geheugenarchief en de brief aan wie je mist — om het verlies een plek te geven.",
  },
  {
    icon: Lightbulb,
    titel: "Inspiratie & troost",
    beschrijving:
      "Gedichten, citaten en teksten die je helpen stilstaan bij wat er is. Samengesteld met zorg.",
  },
];

export default function OntdekPage() {
  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <Link href="/niet-alleen">
          <Image
            src="/images/benji-logo-2.png"
            alt="Talk To Benji"
            width={34}
            height={34}
            className="opacity-50 hover:opacity-70 transition-opacity"
          />
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-10">
        {/* Intro */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
            Er is meer — wanneer je er klaar voor bent
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
            Niet Alleen is een begin. Met een volledig Talk To Benji account ga je
            verder — op je eigen tempo, met alles wat je nodig hebt.
          </p>
          <p className="text-sm" style={{ color: "#a09890" }}>
            Na je 30 dagen kun je hier verder. Of eerder, als je wilt.
          </p>
        </div>

        {/* Functies */}
        <div className="space-y-4">
          {FUNCTIES.map(({ icon: Icon, titel, beschrijving }) => (
            <div
              key={titel}
              className="flex gap-4 rounded-2xl p-5 border"
              style={{ background: "white", borderColor: "#e8e0d8" }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#eef1f6" }}
              >
                <Icon size={18} style={{ color: "#6d84a8" }} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>
                  {titel}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  {beschrijving}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Wat er ook met je 30 dagen gebeurt */}
        <div
          className="rounded-2xl p-5 border"
          style={{ background: "#eef1f6", borderColor: "#dde3ec" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "#3d3530" }}>
            Jouw 30 dagen verdwijnen niet
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
            Alles wat je hebt geschreven blijft bewaard als je een abonnement neemt.
            Benji heeft ook toegang tot wat je hebt gedeeld — zodat gesprekken
            direct persoonlijk kunnen beginnen.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/lp/prijzen"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-medium text-white text-sm"
            style={{ background: "#6d84a8" }}
          >
            Bekijk abonnementen
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/niet-alleen"
            className="block text-center text-sm"
            style={{ color: "#a09890" }}
          >
            Terug naar mijn 30 dagen
          </Link>
        </div>
      </div>
    </div>
  );
}

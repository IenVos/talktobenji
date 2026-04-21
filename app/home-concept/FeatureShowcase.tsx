"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const FEATURES = [
  { id: "gesprek",      label: "Gesprek met Benji",    image: "/images/screenshots/gesprek.png",      imageAlt: "Gesprek met Benji" },
  { id: "mijn-plek",   label: "Mijn plek",             image: "/images/screenshots/mijn-plek.png",    imageAlt: "Mijn plek overzicht" },
  { id: "memories",    label: "Memories",              image: "/images/screenshots/memories.png",     imageAlt: "Memories" },
  { id: "inspiratie",  label: "Inspiratie & troost",   image: "/images/screenshots/inspiratie.png",   imageAlt: "Inspiratie en troost" },
  { id: "check-in",    label: "Dagelijkse check-ins",  image: "/images/screenshots/check-in.png",     imageAlt: "Dagelijkse check-in" },
  { id: "handreikingen", label: "Handreikingen",       image: "/images/screenshots/handreikingen.png",imageAlt: "Handreikingen" },
];

export function FeatureShowcase() {
  const [open, setOpen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeFeature = FEATURES.find((f) => f.id === open);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <>
      {/* Horizontale scrollstrip met pijlen erbuiten */}
      <div className="flex items-center gap-3">
        {/* Pijl links */}
        <button
          onClick={() => scroll("left")}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-primary-200 shadow-sm flex items-center justify-center text-primary-500 hover:text-primary-900 hover:border-primary-400 transition-colors"
          aria-label="Scroll links"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        <div ref={scrollRef} className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-4 pb-2" style={{ width: "max-content" }}>
            {FEATURES.map((f) => (
              <button
                key={f.id}
                onClick={() => setOpen(f.id)}
                className="group flex-shrink-0 w-56 sm:w-64 text-left"
              >
                <div className="rounded-xl overflow-hidden border border-primary-100 bg-primary-50 group-hover:border-primary-300 group-hover:shadow-md transition-all">
                  <Image
                    src={f.image}
                    alt={f.imageAlt}
                    width={400}
                    height={280}
                    className="w-full h-40 object-cover object-top"
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-primary-600 group-hover:text-primary-900 transition-colors text-center">
                  {f.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Pijl rechts */}
        <button
          onClick={() => scroll("right")}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-primary-200 shadow-sm flex items-center justify-center text-primary-500 hover:text-primary-900 hover:border-primary-400 transition-colors"
          aria-label="Scroll rechts"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Modal */}
      {activeFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <p className="font-semibold text-primary-900 text-sm">{activeFeature.label}</p>
              <button
                onClick={() => setOpen(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Sluiten"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <Image
                src={activeFeature.image}
                alt={activeFeature.imageAlt}
                width={1200}
                height={900}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

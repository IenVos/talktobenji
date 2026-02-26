"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingBag, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { renderRichText } from "@/lib/renderRichText";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

const CARD_PCT = 60;
const SIDE_PCT = (100 - CARD_PCT) / 2;
const GAP_PX = 16;

function circularOffset(index: number, active: number, total: number) {
  let d = index - active;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

function OnderwegContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const items = useQuery(api.onderweg.listActiveWithUrls, {});

  const titleParam = searchParams?.get("title") ?? null;
  const initialIndex = Math.min(Number(searchParams?.get("index") ?? 0), (items?.length ?? 1) - 1);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Navigeer naar kaart op basis van ?title= param zodra items geladen zijn
  useEffect(() => {
    if (!titleParam || !items || items.length === 0) return;
    const needle = titleParam.toLowerCase();
    const idx = items.findIndex(
      (item) => item.title?.toLowerCase().includes(needle) || needle.includes(item.title?.toLowerCase() ?? "____")
    );
    if (idx >= 0) setActiveIndex(idx);
  }, [titleParam, items]);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);
  const [maxCardHeight, setMaxCardHeight] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const total = items?.length ?? 0;

  // Meet alle article-elementen en stel hoogte in op de langste
  useEffect(() => {
    if (!items || items.length === 0) return;
    const raf = requestAnimationFrame(() => {
      let max = 0;
      articleRefs.current.forEach((el) => {
        if (el) {
          const prev = el.style.minHeight;
          el.style.minHeight = "0";
          max = Math.max(max, el.scrollHeight);
          el.style.minHeight = prev;
        }
      });
      if (max > 0) setMaxCardHeight(max);
    });
    return () => cancelAnimationFrame(raf);
  }, [items, imagesLoaded]);

  const goTo = useCallback((index: number) => {
    if (total === 0) return;
    setActiveIndex(((index % total) + total) % total);
  }, [total]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
    touchDeltaX.current = 0;
  }, [activeIndex, goTo]);

  return (
    <div className="space-y-6">
      {/* Introductie — eigen kaart */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-4">
          <ShoppingBag size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Iets voor onderweg</h2>
            <p className="text-sm text-gray-600 mt-1">Producten en items die je kunnen helpen</p>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700">
          <p>
            Hier vind je handige producten en items die je kunnen ondersteunen. Van fysieke items
            tot digitale downloads — alles wat je kan helpen in je dagelijks leven.
          </p>
        </div>
      </div>

      {/* Carousel — eigen kaart */}
      {items === undefined ? (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="py-8 flex justify-center">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
            <p className="text-sm text-primary-800">
              De items worden binnenkort toegevoegd. Je kunt dan door producten bladeren die je kunnen helpen.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-primary-200 py-6">
          <div
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  className="absolute top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors shadow-sm"
                  style={{ left: `calc(${SIDE_PCT / 2}% - 16px)` }}
                  aria-label="Vorige"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  className="absolute top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors shadow-sm"
                  style={{ right: `calc(${SIDE_PCT / 2}% - 16px)` }}
                  aria-label="Volgende"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="overflow-hidden">
              <div className="relative" style={{ width: `${CARD_PCT}%`, marginLeft: `${SIDE_PCT}%` }}>
                {items.map((item, index) => {
                  const offset = circularOffset(index, activeIndex, total);
                  const isActive = offset === 0;
                  const isNeighbor = Math.abs(offset) === 1;
                  const isVisible = Math.abs(offset) <= 1;

                  return (
                    <div
                      key={item._id}
                      style={{
                        position: isActive ? "relative" : "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateX(calc(${offset} * (100% + ${GAP_PX}px))) scale(${isActive ? 1 : 0.95})`,
                        opacity: isActive ? 1 : isNeighbor ? 0.4 : 0,
                        transition: isDragging ? "none" : "transform 0.4s ease, opacity 0.4s ease",
                        zIndex: isActive ? 2 : 1,
                        pointerEvents: isActive ? "auto" : "none",
                        cursor: isActive ? "default" : "pointer",
                      }}
                      onClick={() => { if (!isActive && isVisible) goTo(index); }}
                    >
                      <article
                        ref={(el) => { articleRefs.current[index] = el; }}
                        className="rounded-xl bg-white border border-primary-100 overflow-hidden flex flex-col"
                      >
                        {/* Afbeelding met titel + content als overlay */}
                        <div className="relative w-full aspect-[3/2]">
                          {item.imageUrl ? (
                            <button
                              type="button"
                              onClick={(e) => { if (isActive) { e.stopPropagation(); setLightboxImage({ url: item.imageUrl!, alt: item.title || "" }); } }}
                              className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                              title="Afbeelding vergroten"
                              tabIndex={isActive ? 0 : -1}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onLoad={() => setImagesLoaded((c) => c + 1)}
                              />
                            </button>
                          ) : (
                            <div className="w-full h-full bg-primary-50 flex items-center justify-center">
                              <ShoppingBag size={40} className="text-primary-200" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex flex-col bg-black/25 pointer-events-none">
                            {/* Titel + content gecentreerd */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
                              {item.title && (
                                <h3 className="text-base font-semibold text-white text-center leading-snug drop-shadow-md text-balance">
                                  {item.title}
                                </h3>
                              )}
                              {item.content && item.content.trim() !== item.title?.trim() && (
                                <p className="text-sm text-white/90 text-center leading-relaxed drop-shadow-sm text-balance whitespace-pre-wrap">
                                  {renderRichText(item.content)}
                                </p>
                              )}
                            </div>
                            {/* Prijs + knop onderaan de afbeelding */}
                            {(item.paymentUrl || (item.priceCents != null && item.priceCents > 0)) && (
                              <div className="flex flex-col items-center gap-1.5 px-4 pb-4 pointer-events-auto">
                                {item.priceCents != null && item.priceCents > 0 && (
                                  <span className="text-xs text-white/80 font-medium drop-shadow-sm">
                                    €{(item.priceCents / 100).toFixed(2)}
                                  </span>
                                )}
                                {item.paymentUrl && (
                                  <a
                                    href={item.paymentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-white/90 text-primary-800 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {(item as any).buttonLabel || "Bestellen"}
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {total > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              {items.map((item, index) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`rounded-full transition-all ${
                    index === activeIndex
                      ? "w-3 h-3 bg-primary-600"
                      : "w-2.5 h-2.5 bg-primary-300 hover:bg-primary-400"
                  }`}
                  aria-label={`Ga naar item ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

export default function AccountOnderwegPage() {
  return (
    <Suspense>
      <OnderwegContent />
    </Suspense>
  );
}

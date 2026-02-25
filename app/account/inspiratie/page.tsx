"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles, FileDown, ChevronLeft, ChevronRight, Gem, Check, PenLine } from "lucide-react";
import { renderRichText } from "@/lib/renderRichText";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Paywall } from "@/components/Paywall";
import { ComingSoonSection } from "@/components/ComingSoonSection";

const CARD_PCT = 75;
const SIDE_PCT = (100 - CARD_PCT) / 2;
const GAP_PX = 16;

function circularOffset(index: number, active: number, total: number) {
  let d = index - active;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

export default function AccountInspiratiePage() {
  const { data: session } = useSession();

  // Check feature access
  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    session?.userId
      ? {
          userId: session.userId as string,
          email: session.user?.email || undefined,
          feature: "inspiration",
        }
      : "skip"
  );

  const items = useQuery(api.inspiratie.listActiveWithUrls, {});
  const addMemory = useMutation(api.memories.addMemory);

  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
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

  const handleSaveReflection = async (itemId: string, itemTitle: string, imageStorageId?: string) => {
    const text = reflections[itemId]?.trim();
    if (!text || !session?.userId) return;
    setSavingId(itemId);
    try {
      await addMemory({
        userId: session.userId as string,
        text,
        title: itemTitle || undefined,
        source: "inspiratie",
        memoryDate: new Date().toISOString().slice(0, 10),
        ...(imageStorageId ? { imageStorageId: imageStorageId as any } : {}),
      });
      setSavedIds((prev) => new Set([...prev, itemId]));
    } catch {}
    finally { setSavingId(null); }
  };

  const content = (
    <div className="space-y-6">
      {/* Introductie — eigen kaart */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-4">
          <Sparkles size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Inspiratie & troost</h2>
            <p className="text-sm text-gray-600 mt-1">Gedichten, citaten en teksten die je kunnen steunen</p>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700">
          <p>
            Hier vind je gedichten, citaten en andere teksten die je kunnen troosten en inspireren
            in moeilijke momenten. Of je nu even behoefte hebt aan woorden van troost, een gedicht
            om bij stil te staan, of een citaat dat je herinnert aan hoop. We verzamelen het hier
            voor je.
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
              Deze collectie wordt binnenkort gevuld. Je kunt dan door gedichten, citaten en andere
              troostende teksten bladeren.
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
                        className={`rounded-xl overflow-hidden flex flex-col${!item.imageUrl ? " bg-white border border-primary-100 shadow-sm" : ""}`}
                        style={{ minHeight: maxCardHeight > 0 ? `${maxCardHeight}px` : undefined }}
                      >
                        {item.imageUrl && (
                          <button
                            type="button"
                            onClick={(e) => { if (isActive) { e.stopPropagation(); setLightboxImage({ url: item.imageUrl!, alt: item.title || "" }); } }}
                            className="w-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 flex items-center justify-center"
                            title="Afbeelding vergroten"
                            tabIndex={isActive ? 0 : -1}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full max-h-96 object-contain"
                              onLoad={() => setImagesLoaded((c) => c + 1)}
                            />
                          </button>
                        )}

                        {(item.title || item.content || item.pdfUrl || (item.priceCents != null && item.priceCents > 0)) && (
                        <div className="p-5 flex-1 flex flex-col items-center">
                          <div className="w-full max-w-sm">
                            {item.title && (
                              <h3 className="text-base font-semibold text-primary-900 mb-2">{item.title}</h3>
                            )}
                            <div className="flex-1 text-sm text-gray-600 leading-relaxed">
                              {item.content && (
                                <p className="whitespace-pre-wrap">{renderRichText(item.content)}</p>
                              )}
                            </div>
                            {(item.pdfUrl || (item.priceCents != null && item.priceCents > 0)) && (
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                {item.priceCents != null && item.priceCents > 0 && (
                                  <a
                                    href={`/account/steun?item=${encodeURIComponent(item.title || "")}&price=${item.priceCents}`}
                                    className="bestellen-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                                    tabIndex={isActive ? 0 : -1}
                                  >
                                    Bestellen €{(item.priceCents / 100).toFixed(2)}
                                  </a>
                                )}
                                {item.pdfUrl && (
                                  <a
                                    href={item.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-primary-300 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
                                    title="PDF downloaden"
                                    tabIndex={isActive ? 0 : -1}
                                  >
                                    <FileDown size={16} />
                                    Download
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        )}

                        {/* Reflectie — alleen bij kaarten met een afbeelding */}
                        {item.imageUrl && <div className="px-5 pb-6 pt-5 bg-white border-t border-gray-100 flex flex-col items-center">
                          {savedIds.has(item._id) ? (
                            <div className="w-full max-w-xs space-y-2 text-center">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {reflections[item._id]}
                              </p>
                              <p className="text-xs text-primary-500 flex items-center justify-center gap-1">
                                <Check size={11} /> Bewaard in Memories
                              </p>
                            </div>
                          ) : (
                            <div className="w-full max-w-xs space-y-2.5">
                              <label className="flex items-center justify-center gap-1.5 text-xs text-gray-400 cursor-text">
                                <PenLine size={12} />
                                Schrijf een gedachte bij deze kaart
                              </label>
                              <textarea
                                value={reflections[item._id] ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReflections((r) => ({ ...r, [item._id]: val }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Wat komt er bij je op?"
                                rows={2}
                                tabIndex={isActive ? 0 : -1}
                                className="w-full text-sm resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 focus:outline-none focus:border-primary-300 focus:bg-white text-gray-700 placeholder-gray-300 transition-colors"
                              />
                              {reflections[item._id]?.trim() && (
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveReflection(item._id, item.title || "", (item as any).imageStorageId);
                                    }}
                                    disabled={savingId === item._id}
                                    tabIndex={isActive ? 0 : -1}
                                    className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-700 transition-colors disabled:opacity-50"
                                  >
                                    <Gem size={12} />
                                    {savingId === item._id ? "Bewaren..." : "Bewaren in Memories"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>}
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

      <ComingSoonSection section="inspiratie" label="Inspiratie & troost" />

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );

  // Show paywall overlay if no access
  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Alles in 1"
        message="Inspiratie & troost is beschikbaar in Benji Alles in 1. Krijg toegang tot gedichten, citaten en teksten die je kunnen steunen."
      >
        {content}
      </Paywall>
    );
  }

  return content;
}

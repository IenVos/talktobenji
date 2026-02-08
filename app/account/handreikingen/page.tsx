"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HandHelping, FileDown } from "lucide-react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

export default function AccountHandreikingenPage() {
  const items = useQuery(api.handreikingen.listActiveWithUrls, {});
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-6">
          <HandHelping size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Handreikingen</h2>
            <p className="text-sm text-gray-600 mt-1">Praktische tips en ideeën voor moeilijke momenten</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            In deze verzameling vind je kleine, praktische tips en ideeën die je kunnen ondersteunen
            in moeilijke tijden. Of het nu gaat om momenten van verdriet, rouw of gewoon even stil
            staan bij je gevoelens – deze handreikingen bieden je een helpende hand om rust en troost
            te vinden in het dagelijks leven.
          </p>
        </div>

        {items === undefined ? (
          <div className="mt-6 py-8 flex justify-center">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 p-4 rounded-xl bg-primary-50 border border-primary-100">
            <p className="text-sm text-primary-800">
              De handreikingen worden binnenkort toegevoegd. Je kunt dan door tips en ideeën bladeren
              die je kunnen helpen.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {items.map((item) => (
              <article
                key={item._id}
                className={`p-5 rounded-xl bg-primary-50/50 border border-primary-100 ${
                  item.imageUrl ? "flex flex-col sm:flex-row gap-4" : ""
                }`}
              >
                {item.imageUrl && (
                  <div className="flex flex-col flex-shrink-0 gap-2">
                    {item.pdfUrl ? (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-32 h-40 rounded-lg overflow-hidden bg-gray-100 border border-primary-200 cursor-pointer hover:ring-2 hover:ring-primary-400 transition-shadow"
                        title="Afbeelding vergroten"
                        onClick={(e) => { e.preventDefault(); setLightboxImage({ url: item.imageUrl!, alt: item.title }); }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightboxImage({ url: item.imageUrl!, alt: item.title })}
                        className="block w-32 h-40 rounded-lg overflow-hidden bg-gray-100 border border-primary-200 cursor-pointer hover:ring-2 hover:ring-primary-400 transition-shadow text-left"
                        title="Afbeelding vergroten"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                    {item.priceCents != null && item.priceCents > 0 && (
                      <a
                        href={`/account/steun?item=${encodeURIComponent(item.title)}&price=${item.priceCents}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-primary-900 bg-transparent text-primary-900 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors whitespace-nowrap"
                      >
                        Bestellen €{(item.priceCents / 100).toFixed(2)}
                      </a>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-primary-900">{item.title}</h3>
                  {item.pdfUrl ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        <FileDown size={18} />
                        PDF bekijken / downloaden
                      </a>
                      {item.content && (
                        <p className="text-sm text-gray-600 mt-2">{item.content}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {item.content}
                    </div>
                  )}
                </div>
                {!item.imageUrl && item.priceCents != null && item.priceCents > 0 && (
                  <a
                    href={`/account/steun?item=${encodeURIComponent(item.title)}&price=${item.priceCents}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-primary-900 bg-transparent text-primary-900 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors whitespace-nowrap self-start"
                  >
                    Bestellen €{(item.priceCents / 100).toFixed(2)}
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

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

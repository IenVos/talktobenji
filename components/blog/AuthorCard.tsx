"use client";

import { useState } from "react";

export function AuthorCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Compacte auteur-balk bovenaan */}
      <div className="flex items-center gap-3 mb-8 py-3 border-b border-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ien-founder.png"
          alt="Ien"
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-stone-800">Ien</span>
          <span className="text-stone-300 text-xs">·</span>
          <span className="text-xs text-stone-500">Founder van Talk To Benji</span>
          <span className="text-stone-300 text-xs">·</span>
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-primary-600 hover:underline"
          >
            Waarom Benji? →
          </button>
        </div>
      </div>

      {/* Popup overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ien-founder.png"
                alt="Ien"
                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-stone-800">Ien</p>
                <p className="text-xs text-primary-600">Founder van Talk To Benji</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-3">
              Ien richtte Talk To Benji op na haar eigen ervaringen met verlies en rouw. Ze weet hoe eenzaam het kan voelen als je verdriet draagt terwijl de wereld gewoon doorgaat.
            </p>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Benji is er voor de momenten dat je iets kwijt wilt — zonder oordeel, zonder haast. Overdag, 's avonds, midden in de nacht. Geen vervanging van professionele hulp, maar een luisterend oor dat altijd beschikbaar is.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ErvaringenTrigger({ className, style, children }: { className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className} style={style}>
        {children ?? "Ervaringen"}
      </button>
      {open && <ErvaringenPopup onClose={() => setOpen(false)} />}
    </>
  );
}

export function ErvaringenPopup({ onClose }: { onClose: () => void }) {
  const items = useQuery(api.testimonials.listActive, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88dvh] rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-gray-900">Ervaringen</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inhoud */}
        <div className="px-5 py-6 space-y-4">
          {!items ? (
            <p className="text-sm text-gray-400 text-center py-4">Laden...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nog geen ervaringen.</p>
          ) : (
            items.map((e) => (
              <div key={e._id} className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{e.quote}&rdquo;</p>
                <p className="text-xs text-gray-400 font-medium">{e.name}</p>
              </div>
            ))
          )}
          <p className="text-xs text-gray-400 text-center pt-2">
            Ervaringen zijn geanonimiseerd gedeeld met toestemming.
          </p>
        </div>
      </div>
    </div>
  );
}

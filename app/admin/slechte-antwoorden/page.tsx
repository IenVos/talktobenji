"use client";

import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { ThumbsDown } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SlechteAntwoordenPage() {
  const items = useAdminQuery(api.admin.getNotHelpfulMessages, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onbevredigende antwoorden</h1>
          <p className="text-sm text-gray-500 mt-1">
            Berichten die bezoekers als niet behulpzaam hebben gemarkeerd
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
          <ThumbsDown size={14} />
          {items?.length ?? 0} gemarkeerd
        </div>
      </div>

      {items === undefined && (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      )}

      {items?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nog geen onbevredigende antwoorden gemarkeerd.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                {item.userId && (
                  <span className="text-xs text-gray-400">Ingelogde gebruiker</span>
                )}
              </div>

              {item.userMessage && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-400 mb-1.5">Bezoeker schreef</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.userMessage}</p>
                </div>
              )}

              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-medium text-orange-500">Benji antwoordde</p>
                  <span className="flex items-center gap-0.5 text-xs text-orange-400">
                    <ThumbsDown size={10} />
                    niet behulpzaam
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item.botResponse}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

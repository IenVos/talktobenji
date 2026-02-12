"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { MessageCircleHeart, Star, Check, X, Image as ImageIcon, Trash2, ImageOff } from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bug: { label: "Bug", color: "bg-red-100 text-red-800" },
  suggestion: { label: "Suggestie", color: "bg-blue-100 text-blue-800" },
  compliment: { label: "Compliment", color: "bg-green-100 text-green-800" },
  complaint: { label: "Klacht", color: "bg-amber-100 text-amber-800" },
  feature_request: { label: "Feature request", color: "bg-purple-100 text-purple-800" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Nieuw", color: "bg-blue-100 text-blue-800" },
  reviewed: { label: "Bekeken", color: "bg-green-100 text-green-800" },
  implemented: { label: "Doorgevoerd", color: "bg-emerald-100 text-emerald-800" },
  declined: { label: "Afgewezen", color: "bg-gray-100 text-gray-600" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedbackPage() {
  const feedback = useQuery(api.admin.getAllFeedback, {});
  const updateStatus = useMutation(api.admin.updateFeedbackStatus);
  const deleteFeedback = useMutation(api.admin.deleteFeedback);
  const deleteFeedbackImage = useMutation(api.admin.deleteFeedbackImage);
  const [filter, setFilter] = useState<string>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = feedback?.filter((f) => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  const newCount = feedback?.filter((f) => f.status === "new").length ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
            <MessageCircleHeart size={24} className="text-primary-600" />
            Feedback
          </h1>
          <p className="text-sm text-primary-700 mt-1">
            Alle feedback van gebruikers
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {newCount} nieuw
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "Alles" },
          { value: "new", label: "Nieuw" },
          { value: "reviewed", label: "Bekeken" },
          { value: "implemented", label: "Doorgevoerd" },
          { value: "declined", label: "Afgewezen" },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === f.value
                ? "border-primary-500 bg-primary-50 text-primary-800"
                : "border-gray-200 text-gray-600 hover:border-primary-300"
            }`}
          >
            {f.label}
            {f.value === "new" && newCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs bg-red-500 text-white">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feedback lijst */}
      {feedback === undefined ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filtered?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Geen feedback gevonden.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((item) => {
            const typeConfig = TYPE_LABELS[item.feedbackType] ?? TYPE_LABELS.suggestion;
            const statusConfig = STATUS_LABELS[item.status] ?? STATUS_LABELS.new;
            return (
              <div
                key={item._id}
                className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-md ${
                  item.status === "new" ? "border-blue-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {item.rating != null && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= item.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.status === "new" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus({ feedbackId: item._id, status: "reviewed" })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Markeer als bekeken"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus({ feedbackId: item._id, status: "declined" })}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Afwijzen"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    {confirmDelete === item._id ? (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-red-700 mr-1">Verwijderen?</span>
                        <button
                          type="button"
                          onClick={() => { deleteFeedback({ feedbackId: item._id }); setConfirmDelete(null); }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Bevestig verwijderen"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="Annuleer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(item._id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Verwijder feedback"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-900 whitespace-pre-wrap mb-3">{item.comment}</p>

                {item.imageUrl && (
                  <div className="flex items-start gap-2 mb-3">
                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt="Bijlage"
                        className="max-w-xs h-auto rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                    <button
                      type="button"
                      onClick={() => { if (window.confirm("Afbeelding verwijderen? De tekst blijft behouden.")) { deleteFeedbackImage({ feedbackId: item._id }); } }}
                      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                      title="Verwijder alleen de afbeelding"
                    >
                      <ImageOff size={16} />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>{formatDate(item.createdAt)}</span>
                  {item.userEmail && <span>{item.userEmail}</span>}
                  {item.userId && !item.userEmail && <span>User: {item.userId}</span>}
                  {item.imageUrl && (
                    <span className="flex items-center gap-1 text-primary-600">
                      <ImageIcon size={12} />
                      Bijlage
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MessageSquare, Trash2 } from "lucide-react";


function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountGesprekkenPage() {
  const { data: session } = useSession();
  const deleteSession = useMutation(api.chat.deleteUserSession);
  const [deletingId, setDeletingId] = useState<Id<"chatSessions"> | null>(null);

  const sessions = useQuery(
    api.chat.getUserSessions,
    session?.userId ? { userId: session.userId, limit: 50 } : "skip"
  );

  return (
    <div>
      {sessions === undefined ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary-200 p-8 text-center">
          <MessageSquare size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-gray-600">Je hebt nog geen gesprekken.</p>
          <Link
            href="/?welcome=1"
            className="inline-block mt-4 text-primary-600 hover:underline font-medium"
          >
            Start een gesprek met Benji
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s._id} className="group">
              <div className="flex items-stretch gap-1 bg-white rounded-xl border border-primary-200 overflow-hidden hover:border-primary-400 transition-colors">
                <Link
                  href={`/gesprek/${s._id}`}
                  className="flex-1 p-4 min-w-0 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {formatDate(s.lastActivityAt)}
                    </span>
                    <span className="text-xs text-primary-600">
                      {s.status === "active" ? "Actief" : "Afgesloten"}
                    </span>
                  </div>
                  {s.topic && (
                    <p className="text-xs text-gray-500 mt-1">{s.topic}</p>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (
                      !confirm(
                        "Weet je zeker dat je dit gesprek wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
                      )
                    )
                      return;
                    if (!session?.userId) return;
                    setDeletingId(s._id);
                    try {
                      await deleteSession({
                        sessionId: s._id,
                        userId: session.userId,
                      });
                    } catch (err) {
                      console.error(err);
                      alert("Verwijderen mislukt. Probeer het opnieuw.");
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId === s._id}
                  className="px-3 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Gesprek verwijderen"
                  aria-label="Gesprek verwijderen"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6">
        <Link href="/?welcome=1" className="text-gray-500 hover:text-gray-700 text-sm">
          Terug naar Benji
        </Link>
      </p>
    </div>
  );
}

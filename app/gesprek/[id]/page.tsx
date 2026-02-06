"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MessageSquare, Trash2 } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GesprekPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { data: session, status } = useSession();
  const deleteSession = useMutation(api.chat.deleteUserSession);
  const [deleting, setDeleting] = useState(false);
  const sessionData = useQuery(
    api.chat.getSession,
    id ? { sessionId: id as Id<"chatSessions"> } : "skip"
  );
  const messages = useQuery(
    api.chat.getMessages,
    id ? { sessionId: id as Id<"chatSessions"> } : "skip"
  );

  if (!id || status === "loading") {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Log in om dit gesprek te bekijken.</p>
        <Link href="/inloggen" className="mt-4 text-primary-600 hover:underline">
          Inloggen
        </Link>
      </div>
    );
  }

  if (sessionData === undefined || messages === undefined) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!sessionData || sessionData.userId !== session.userId) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Gesprek niet gevonden of geen toegang.</p>
        <Link href="/account/gesprekken" className="mt-4 text-primary-600 hover:underline">
          Naar mijn gesprekken
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/account/gesprekken">
              <Image
                src="/images/benji-logo-2.png"
                alt="Benji"
                width={40}
                height={40}
                className="object-contain"
              />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-primary-900">Gesprek</h1>
              <p className="text-sm text-gray-600">
                {formatDate(sessionData.startedAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (
                !confirm(
                  "Weet je zeker dat je dit gesprek wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
                )
              )
                return;
              if (!session?.userId || !id) return;
              setDeleting(true);
              try {
                await deleteSession({
                  sessionId: id as Id<"chatSessions">,
                  userId: session.userId,
                });
                router.push("/account/gesprekken");
              } catch (err) {
                console.error(err);
                alert("Verwijderen mislukt. Probeer het opnieuw.");
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Gesprek verwijderen"
          >
            <Trash2 size={18} />
            <span>Verwijderen</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-primary-200 overflow-hidden">
          <div className="divide-y divide-primary-100 max-h-[60vh] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m._id}
                className={`p-4 ${
                  m.role === "user" ? "bg-primary-50/50" : "bg-white"
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  {m.role === "user" ? "Jij" : "Benji"}
                </p>
                <p className="text-gray-900 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center">
          <Link href="/account/gesprekken" className="text-gray-500 hover:text-gray-700 text-sm">
            Terug naar mijn gesprekken
          </Link>
        </p>
      </div>
    </div>
  );
}

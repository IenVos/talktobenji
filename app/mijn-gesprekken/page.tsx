"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MessageSquare, LogIn } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MijnGesprekkenPage() {
  const { data: session, status } = useSession();
  const sessions = useQuery(
    api.chat.getUserSessions,
    session?.userId ? { userId: session.userId, limit: 50 } : "skip"
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Image
            src="/images/benji-logo-2.png"
            alt="Benji"
            width={64}
            height={64}
            className="mx-auto object-contain mb-4"
          />
          <h1 className="text-xl font-bold text-primary-900">Mijn gesprekken</h1>
          <p className="text-gray-600 mt-2 mb-6">
            Log in om je eerdere gesprekken met Benji terug te kijken.
          </p>
          <Link
            href="/inloggen?callbackUrl=/mijn-gesprekken"
            className="inline-flex items-center gap-2 py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
          >
            <LogIn size={20} />
            Inloggen
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Nog geen account?{" "}
            <Link href="/registreren" className="text-primary-600 hover:underline">
              Account aanmaken
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/images/benji-logo-2.png"
            alt="Benji"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-primary-900">Mijn gesprekken</h1>
            <p className="text-sm text-gray-600">Je eerdere gesprekken met Benji</p>
          </div>
        </div>

        {sessions === undefined ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-primary-200 p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-primary-300 mb-4" />
            <p className="text-gray-600">Je hebt nog geen gesprekken.</p>
            <Link
              href="/"
              className="inline-block mt-4 text-primary-600 hover:underline font-medium"
            >
              Start een gesprek met Benji
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s._id}>
                <Link
                  href={`/gesprek/${s._id}`}
                  className="block bg-white rounded-xl border border-primary-200 p-4 hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
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
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            Terug naar Benji
          </Link>
        </p>
      </div>
    </div>
  );
}

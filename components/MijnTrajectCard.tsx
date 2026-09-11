"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Leaf, HeartHandshake, Lock, ArrowRight } from "lucide-react";

/**
 * "Mijn traject" in de linkerkolom onder het menu.
 * - Niet Alleen actief → voortgang (week x/8) + "Verder".
 * - Nog niet in bezit → rustig kaartje met slotje, klik = ontdekken.
 * (De echte eigendom-logica per programma komt met de toegang-flow.)
 */
export function MijnTrajectCard({ className = "" }: { className?: string }) {
  const { data: session } = useSession();
  const profiel = useQuery(
    api.nietAlleen.getProfile,
    session?.userId
      ? { userId: session.userId as string, email: session.user?.email || undefined }
      : "skip"
  );

  const naActief = !!(profiel && (profiel as any).verliesType);
  const dag = (profiel as any)?.dagNummer ?? 0;
  const week = Math.min(Math.max(Math.ceil(dag / 7), 1), 8);
  const pct = Math.min(Math.round((dag / 56) * 100), 100);

  return (
    <div className={`mt-4 rounded-xl border border-primary-200 bg-white p-3 shadow-sm flex flex-col ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">
        Mijn traject
      </p>

      {naActief ? (
        <div className="rounded-lg border border-primary-100 p-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-green-50 text-green-700">
              <Leaf size={16} />
            </span>
            <span className="text-sm font-semibold text-gray-900">Niet Alleen</span>
            <span className="ml-auto text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Actief
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-primary-50 mt-2.5 overflow-hidden">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Week {week} van 8</p>
          <Link
            href="/niet-alleen"
            className="mt-2.5 flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg py-2 border transition-colors bg-amber-50/60 border-amber-400 text-amber-700 hover:bg-amber-50"
          >
            Verder met vandaag <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <Link
          href="/account/onderweg"
          className="flex items-center gap-2.5 rounded-lg border border-primary-100 p-3 hover:bg-gray-50 transition-colors"
        >
          <span className="p-1.5 rounded-md bg-gray-100 text-gray-400">
            <Leaf size={16} />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-500">Niet Alleen</span>
            <span className="text-[11px] text-gray-400">8 weken, in je eigen tempo</span>
          </span>
          <Lock size={14} className="ml-auto flex-shrink-0 text-gray-300" />
        </Link>
      )}

      {/* Zij aan Zij — voorlopig altijd op slot (eigendom volgt met de flow) */}
      <Link
        href="/lp/zij-aan-zij"
        className="mt-2 flex items-center gap-2.5 rounded-lg border border-primary-100 p-3 hover:bg-gray-50 transition-colors"
      >
        <span className="p-1.5 rounded-md bg-gray-100 text-gray-400">
          <HeartHandshake size={16} />
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-gray-500">Zij aan Zij</span>
          <span className="text-[11px] text-gray-400">Persoonlijk met Ien</span>
        </span>
        <Lock size={14} className="ml-auto flex-shrink-0 text-gray-300" />
      </Link>
    </div>
  );
}

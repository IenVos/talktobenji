"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageSquare, PencilLine, Sparkles, HandHelping, Gem, Target, CalendarCheck, ShoppingBag } from "lucide-react";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { ConversationLimitBanner } from "@/components/ConversationLimitBanner";
import { ComingSoonSection } from "@/components/ComingSoonSection";

const CATEGORIES = [
  { href: "/account/gesprekken", label: "Jouw gesprekken", icon: MessageSquare, desc: "Je eerdere gesprekken met Benji" },
  { href: "/account/reflecties", label: "Reflecties", icon: PencilLine, desc: "Notities, emoties en dagelijkse check-in" },
  { href: "/account/doelen", label: "Persoonlijke doelen", icon: Target, desc: "Je doelen en wensen bijhouden" },
  { href: "/account/checkins", label: "Dagelijkse check-ins", icon: CalendarCheck, desc: "Korte vragen om je gedachten te ordenen" },
  { href: "/account/herinneringen", label: "Memories", icon: Gem, desc: "Mooie herinneringen om naar terug te kijken" },
  { href: "/account/inspiratie", label: "Inspiratie & troost", icon: Sparkles, desc: "Gedichten, citaten en teksten die je kunnen steunen" },
  { href: "/account/handreikingen", label: "Handreikingen", icon: HandHelping, desc: "Praktische tips en ideeën voor moeilijke momenten" },
];

export default function AccountPage() {
  const { data: session } = useSession();
  const onderwegItems = useQuery(api.onderweg.listActiveWithUrls, {});
  const featuredItems = onderwegItems?.slice(0, 3) ?? [];

  return (
    <div className="space-y-4">
      {/* Conversation limit banner */}
      {session?.userId && (
        <ConversationLimitBanner
          userId={session.userId as string}
          email={session.user?.email || undefined}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 p-5 rounded-xl bg-white border border-primary-200 hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-primary-50 text-primary-700 group-hover:bg-primary-100 transition-colors">
              <Icon size={24} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {label}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
            </div>
            <span className="text-primary-500 group-hover:translate-x-0.5 transition-transform" aria-hidden>→</span>
          </Link>
        ))}
      </div>

      {featuredItems.length > 0 && (
        <div className="bg-white rounded-xl border border-primary-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary-800">
              <ShoppingBag size={16} className="text-primary-400" />
              <span className="text-sm font-medium">Iets om mee te nemen</span>
            </div>
            <Link
              href="/account/onderweg"
              className="text-xs text-primary-500 hover:text-primary-700 transition-colors"
            >
              Bekijk alles →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {featuredItems.map((item, i) => (
              <Link
                key={item._id}
                href={`/account/onderweg?index=${i}`}
                className="group relative flex flex-col"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-primary-50">
                  {(item as any).imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(item as any).imageUrl}
                      alt={item.title || ""}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={24} className="text-primary-200" />
                    </div>
                  )}
                  {item.title && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <p className="text-[11px] sm:text-xs font-semibold text-white text-center leading-snug line-clamp-3 px-2 drop-shadow-md text-balance">
                        {item.title}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ComingSoonSection section="account" label="Mijn plek" />
    </div>
  );
}

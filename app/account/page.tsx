"use client";

import Link from "next/link";
import { MessageSquare, PencilLine, Sparkles, HandHelping } from "lucide-react";

const CATEGORIES = [
  { href: "/account/gesprekken", label: "Jouw gesprekken", icon: MessageSquare, desc: "Je eerdere gesprekken met Benji" },
  { href: "/account/reflecties", label: "Reflecties", icon: PencilLine, desc: "Notities, emoties en dagelijkse check-in" },
  { href: "/account/inspiratie", label: "Inspiratie & troost", icon: Sparkles, desc: "Gedichten, citaten en teksten die je kunnen steunen" },
  { href: "/account/handreikingen", label: "Handreikingen", icon: HandHelping, desc: "Praktische tips en ideeën voor moeilijke momenten" },
];

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        Kies waar je naartoe wilt:
      </p>
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
    </div>
  );
}

"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface PaywallProps {
  title?: string;
  message: string;
  ctaText?: string;
  ctaLink?: string;
  children?: React.ReactNode;
}

export function Paywall({
  title = "Upgrade naar Benji Uitgebreid",
  message,
  ctaText = "Bekijk abonnementen",
  ctaLink = "/prijzen",
  children,
}: PaywallProps) {
  return (
    <div className="relative min-h-[600px]">
      {/* Content achter de paywall - blurred */}
      {children && (
        <div className="pointer-events-none blur-sm opacity-30 select-none">
          {children}
        </div>
      )}

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex justify-center pt-0 p-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg border border-primary-200 p-8 h-fit">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Lock size={28} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>
          <Link
            href={ctaLink}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}

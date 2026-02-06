"use client";

import Image from "next/image";
import { CreditCard } from "lucide-react";

export default function AccountBetalingenPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Image
          src="/images/benji-logo-2.png"
          alt="Benji"
          width={40}
          height={40}
          className="object-contain"
        />
        <div>
          <h1 className="text-xl font-bold text-primary-900">Betalingen</h1>
          <p className="text-sm text-gray-600">Overzicht van je betalingen</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <CreditCard size={24} className="text-primary-500" />
          <p>Nog geen betalingen. Stripe wordt later geïntegreerd.</p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Hier komt later het overzicht van donaties en betalingen (Stripe).
        </p>
      </div>
    </div>
  );
}

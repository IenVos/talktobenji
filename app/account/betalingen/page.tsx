"use client";

import { CreditCard } from "lucide-react";

export default function AccountBetalingenPage() {
  return (
    <div>
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

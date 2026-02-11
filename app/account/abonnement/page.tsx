"use client";

import { Calendar, CreditCard } from "lucide-react";

export default function AccountAbonnementPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <Calendar size={20} className="text-primary-500" />
          Abonnement
        </h2>
        <p className="text-gray-600">Geen actief abonnement. Benji is nu gratis te gebruiken.</p>
        <p className="mt-2 text-sm text-gray-500">
          Hier komt later de abonnementsinfo (looptijd, etc.) wanneer dit wordt ingericht.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <CreditCard size={20} className="text-primary-500" />
          Betalingen
        </h2>
        <p className="text-gray-600">Nog geen betalingen.</p>
        <p className="mt-2 text-sm text-gray-500">
          Hier komt later het overzicht van donaties en betalingen (Stripe).
        </p>
      </div>
    </div>
  );
}

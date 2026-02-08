"use client";

import { Calendar } from "lucide-react";

export default function AccountAbonnementPage() {
  return (
    <div>
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar size={24} className="text-primary-500" />
          <p>Geen actief abonnement. Benji is nu gratis te gebruiken.</p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Hier komt later de abonnementsinfo (looptijd, etc.) wanneer dit wordt ingericht.
        </p>
      </div>
    </div>
  );
}

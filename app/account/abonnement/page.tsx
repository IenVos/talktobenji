"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { Calendar } from "lucide-react";

export default function AccountAbonnementPage() {
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
          <h1 className="text-xl font-bold text-primary-900">Abonnement</h1>
          <p className="text-sm text-gray-600">Je abonnementsstatus</p>
        </div>
      </div>

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

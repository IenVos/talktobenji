"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function AccountSteunPage() {
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
          <h1 className="text-xl font-bold text-primary-900">Steun Benji</h1>
          <p className="text-sm text-gray-600">Help Talk To Benji verder te groeien</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-4">
          <Heart size={24} className="text-primary-500" />
          <p className="font-medium">Dank je voor je interesse!</p>
        </div>
        <p className="text-gray-600">
          De mogelijkheid om Benji te steunen (donaties, producten) komt binnenkort.
          We werken aan een Stripe-integratie.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Hier kun je straks kiezen uit bedragen of iets kopen ter ondersteuning van Talk To Benji.
        </p>
      </div>
    </div>
  );
}

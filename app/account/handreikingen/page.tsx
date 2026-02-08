"use client";

import { HandHelping } from "lucide-react";

export default function AccountHandreikingenPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-6">
          <HandHelping size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Handreikingen</h2>
            <p className="text-sm text-gray-600 mt-1">Praktische tips en ideeën voor moeilijke momenten</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            In deze verzameling vind je kleine, praktische tips en ideeën die je kunnen ondersteunen
            in moeilijke tijden. Of het nu gaat om momenten van verdriet, rouw of gewoon even stil
            staan bij je gevoelens – deze handreikingen bieden je een helpende hand om rust en troost
            te vinden in het dagelijks leven.
          </p>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <p className="text-sm text-primary-800">
            De handreikingen worden binnenkort toegevoegd. Je kunt dan door tips en ideeën bladeren
            die je kunnen helpen.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Sparkles } from "lucide-react";

export default function AccountInspiratiePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-6">
          <Sparkles size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Inspiratie & troost</h2>
            <p className="text-sm text-gray-600 mt-1">Gedichten, citaten en teksten die je kunnen steunen</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            Hier vind je gedichten, citaten en andere teksten die je kunnen troosten en inspireren
            in moeilijke momenten. Of je nu even behoefte hebt aan woorden van troost, een gedicht
            om bij stil te staan, of een citaat dat je herinnert aan hoop – we verzamelen het hier
            voor je.
          </p>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <p className="text-sm text-primary-800">
            Deze collectie wordt binnenkort gevuld. Je kunt dan door gedichten, citaten en andere
            troostende teksten bladeren.
          </p>
        </div>
      </div>
    </div>
  );
}

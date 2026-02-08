"use client";

import { useState } from "react";
import { Heart, Euro, Compass } from "lucide-react";

const FIXED_AMOUNTS = [5, 10, 25];

export default function AccountSteunPage() {
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleDonate = (amount: number | null) => {
    if (amount !== null) {
      // Straks: Stripe integratie
      alert(`Bedankt voor je interesse! Donatie van €${amount} komt binnenkort.`);
    }
  };

  const handleCustomDonate = () => {
    const val = parseFloat(customAmount.replace(",", "."));
    if (!isNaN(val) && val >= 1) {
      handleDonate(val);
      setCustomAmount("");
      setShowCustomInput(false);
    } else {
      alert("Vul een bedrag in van minimaal €1.");
    }
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-6">
          <Heart size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Waarom Benji steunen?</h2>
            <p className="text-sm text-gray-600 mt-1">Jouw bijdrage maakt het verschil</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            Talk To Benji is een gratis chatbot voor iedereen die te maken heeft met rouw, verlies of verdriet.
            Of je nu een dierbare bent verloren, je huisdier mist, of gewoon even wil praten – Benji is er,
            dag en nacht, zonder oordeel.
          </p>
          <p>
            Om Benji gratis en voor iedereen beschikbaar te houden, zijn we afhankelijk van steun van mensen
            zoals jij. Een donatie of aankoop helpt ons om de techniek te onderhouden, Benji verder te
            verbeteren, en meer mensen te bereiken die een luisterend oor nodig hebben.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="text-base font-semibold text-primary-900 mb-4">Hoe kun je Benji steunen?</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <strong>Donatie</strong> – Kies een bedrag dat bij je past. Elk bedrag helpt, hoe klein ook.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <strong>Iets voor onderweg</strong> – Kleine dingen met betekenis die je kunnen steunen (bijv. een kaart of boek). Binnenkort beschikbaar.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <strong>Delen</strong> – Vertel anderen over Benji. Soms is dat het mooiste wat je kunt doen.
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="text-base font-semibold text-primary-900 mb-4">Kies je donatiebedrag</h3>
        <div className="flex flex-wrap gap-3">
          {FIXED_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleDonate(amount)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-200 bg-white text-primary-800 font-semibold hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Euro size={18} />
              €{amount}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold transition-colors ${
              showCustomInput
                ? "border-primary-500 bg-primary-50 text-primary-800"
                : "border-primary-200 bg-white text-primary-800 hover:border-primary-500 hover:bg-primary-50"
            }`}
          >
            <Euro size={18} />
            Zelf kiezen
          </button>
        </div>
        {showCustomInput && (
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <span className="text-primary-700 font-medium">€</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
              className="w-32 px-3 py-2 border border-primary-200 rounded-lg text-primary-900 font-medium"
            />
            <button
              type="button"
              onClick={handleCustomDonate}
              disabled={!customAmount.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Doneren
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900 mb-4">
          <Compass size={20} className="text-primary-500" />
          Iets voor onderweg
        </h3>
        <p className="text-sm text-gray-700 mb-2">
          Kleine dingen met betekenis die je onderweg kunnen dragen – een kaart, boek of iets anders
          dat troost en herinnering biedt. De opbrengst gaat naar Benji. Binnenkort beschikbaar.
        </p>
      </div>

      <div className="bg-primary-50 rounded-xl border border-primary-200 p-6">
        <p className="font-medium text-primary-800 mb-2">Dank je voor je interesse!</p>
        <p className="text-sm text-gray-600">
          De online betaling komt binnenkort. We werken aan een Stripe-integratie.
          Tot die tijd: deel Benji met iemand die het kan gebruiken.
        </p>
      </div>
    </div>
  );
}

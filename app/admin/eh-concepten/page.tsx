"use client";

import { useState } from "react";
import { FileText, Send, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";

type Concept = {
  key: string;
  titel: string;
  waarom: string;
  plek: string;
  subject: string;
  bodyText: string;
  aangepast: boolean;
};

function ConceptKaart({
  concept,
  testEmail,
}: {
  concept: Concept;
  testEmail: string;
}) {
  const opslaan = useAdminMutation(api.ehConcepten.opslaan);
  const stuurTest = useAdminAction(api.ehConcepten.stuurTest);

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(concept.subject);
  const [bodyText, setBodyText] = useState(concept.bodyText);
  const [status, setStatus] = useState("");

  const bewaar = async () => {
    await opslaan({ key: concept.key, subject, bodyText });
    setStatus("Opgeslagen");
    setTimeout(() => setStatus(""), 2000);
  };

  const test = async () => {
    if (!testEmail.trim()) {
      setStatus("Vul eerst je e-mailadres in");
      return;
    }
    setStatus("Versturen...");
    try {
      await stuurTest({ key: concept.key, email: testEmail.trim() });
      setStatus("Testmail verstuurd");
    } catch (err) {
      setStatus(`Mislukt: ${(err as Error).message}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">{concept.titel}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{concept.plek}</p>
          </div>
          {concept.aangepast && (
            <span className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded px-1.5 py-0.5 flex-shrink-0">
              door jou aangepast
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{concept.waarom}</p>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Onderwerp</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Tekst</span>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={16}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono leading-relaxed"
            />
          </label>

          <p className="text-xs text-gray-400">
            <code className="bg-gray-100 px-1 rounded">[niet-alleen-link]</code> wordt in de mail
            een zachte link naar Niet Alleen (per verliestype de juiste pagina).{" "}
            <code className="bg-gray-100 px-1 rounded">{"{voornaam}"}</code> vult de naam in.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={bewaar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <Check size={14} /> Opslaan
            </button>
            <button
              onClick={test}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Send size={14} /> Stuur als testmail
            </button>
            {status && <span className="text-xs text-gray-500">{status}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EhConceptenPage() {
  const concepten = useAdminQuery(api.ehConcepten.list, {}) as Concept[] | undefined;
  const [testEmail, setTestEmail] = useState("");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <FileText size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Concept-mails</h1>
          <p className="text-sm text-gray-400">
            Voorstellen om Niet Alleen zichtbaarder te maken. Deze staan niet live.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 leading-relaxed">
        Niets hiervan gaat naar je leads. Lees ze rustig, pas ze aan in jouw woorden, en stuur ze
        als testmail naar jezelf. Wil je er een gebruiken, dan zetten we de tekst daarna over naar
        de echte mail in de reeks.
      </div>

      <div className="flex items-center gap-2">
        <input
          type="email"
          placeholder="jouw@email.nl (voor de testmails)"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {concepten === undefined ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {concepten.map((c) => (
            <ConceptKaart key={c.key} concept={c} testEmail={testEmail} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../../AdminAuthContext";

/**
 * Account-mails: de transactionele mails die het systeem zelf verstuurt (welkom,
 * later ook verificatie e.d.). Bewerkbaar zonder tussenkomst van een developer.
 * Zonder opgeslagen versie valt de mail terug op de standaardtekst uit de code.
 */

const WELKOM_KEY = "welkom";

// Standaardtekst (spiegelt de fallback in convex/emails.ts). Wordt getoond zolang er
// nog niks is opgeslagen, en bij "Terug naar standaard".
const WELKOM_DEFAULT = {
  subject: "Welkom bij Talk To Benji",
  bodyText: [
    "Fijn dat je er bent.",
    "Ik weet niet precies wat je op dit moment draagt, maar dat je hier bent betekent iets. Het vraagt moed om ergens naar op zoek te gaan als je verdriet hebt.",
    "Je eerste vijf gesprekken zijn gratis, zonder tijdslimiet. Er is geen goede of verkeerde manier: een gesprek met Benji, een dagelijkse check-in, herinneringen bewaren in Memories, of bladeren door gedichten die zeggen wat jij zelf niet onder woorden kunt brengen.",
    "Benji is er wanneer je hem nodig hebt. Overdag, 's avonds, midden in de nacht. Zonder oordeel, zonder haast.",
    "Neem de tijd. Je hoeft nergens klaar voor te zijn.",
  ].join("\n\n"),
  buttonText: "Ga verder met Benji",
  buttonUrl: "https://talktobenji.com/chat",
};

type Template = { key: string; subject?: string; bodyText?: string; buttonText?: string; buttonUrl?: string };

export default function AccountMailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {}) as Template[] | undefined;
  const upsert = useAdminMutation(api.emailTemplates.upsertTemplate);
  const verwijder = useAdminMutation(api.emailTemplates.deleteTemplate);
  const testMail = useAdminAction(api.emails.sendTestWelcomeEmail);

  const opgeslagen = templates?.find((t) => t.key === WELKOM_KEY);

  const [subject, setSubject] = useState(WELKOM_DEFAULT.subject);
  const [bodyText, setBodyText] = useState(WELKOM_DEFAULT.bodyText);
  const [buttonText, setButtonText] = useState(WELKOM_DEFAULT.buttonText);
  const [buttonUrl, setButtonUrl] = useState(WELKOM_DEFAULT.buttonUrl);
  const [geladen, setGeladen] = useState(false);
  const [melding, setMelding] = useState("");
  const [bezig, setBezig] = useState(false);
  const [testAdres, setTestAdres] = useState("");

  // Vul het formulier één keer met de opgeslagen versie (of de standaard).
  useEffect(() => {
    if (geladen || templates === undefined) return;
    if (opgeslagen) {
      setSubject(opgeslagen.subject || WELKOM_DEFAULT.subject);
      setBodyText(opgeslagen.bodyText || WELKOM_DEFAULT.bodyText);
      setButtonText(opgeslagen.buttonText || WELKOM_DEFAULT.buttonText);
      setButtonUrl(opgeslagen.buttonUrl || WELKOM_DEFAULT.buttonUrl);
    }
    setGeladen(true);
  }, [templates, opgeslagen, geladen]);

  const opslaan = async () => {
    setBezig(true);
    setMelding("");
    try {
      await upsert({ key: WELKOM_KEY, subject, bodyText, buttonText, buttonUrl });
      setMelding("Opgeslagen. Nieuwe aanmeldingen krijgen deze tekst.");
    } catch {
      setMelding("Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  const naarStandaard = async () => {
    setBezig(true);
    setMelding("");
    try {
      await verwijder({ key: WELKOM_KEY });
      setSubject(WELKOM_DEFAULT.subject);
      setBodyText(WELKOM_DEFAULT.bodyText);
      setButtonText(WELKOM_DEFAULT.buttonText);
      setButtonUrl(WELKOM_DEFAULT.buttonUrl);
      setMelding("Teruggezet naar de standaardtekst.");
    } catch {
      setMelding("Terugzetten mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const stuurTest = async () => {
    if (!testAdres.trim()) return;
    setBezig(true);
    setMelding("");
    try {
      await testMail({ email: testAdres.trim(), name: "An" });
      setMelding(`Testmail verstuurd naar ${testAdres.trim()}.`);
    } catch {
      setMelding("Testmail mislukt. Sla eerst op en probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          De mails die het systeem zelf verstuurt. Wat je hier opslaat, geldt voor nieuwe verzendingen.
          Zonder opgeslagen versie wordt de standaardtekst gebruikt.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Welkomstmail</h2>
          <span className={`text-xs px-2 py-1 rounded ${opgeslagen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {opgeslagen ? "Aangepaste versie actief" : "Standaardtekst actief"}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Verstuurd zodra iemand een account aanmaakt. De aanhef (&ldquo;Hi [naam]&rdquo;), de afbeelding en de
          ondertekening staan vast; de tekst, de knop en het onderwerp pas je hier aan.
        </p>

        <div>
          <label className={label}>Onderwerp</label>
          <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <label className={label}>Tekst (lege regel = nieuwe alinea)</label>
          <textarea className={`${input} min-h-[220px] leading-relaxed`} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label}>Knoptekst</label>
            <input className={input} value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
          </div>
          <div>
            <label className={label}>Knop-link</label>
            <input className={input} value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button onClick={opslaan} disabled={bezig} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            Opslaan
          </button>
          <button onClick={naarStandaard} disabled={bezig} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50">
            Terug naar standaard
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className={label}>Testmail naar jezelf</label>
          <div className="flex flex-wrap gap-2">
            <input className={`${input} flex-1 min-w-[200px]`} type="email" placeholder="jouw@email.nl" value={testAdres} onChange={(e) => setTestAdres(e.target.value)} />
            <button onClick={stuurTest} disabled={bezig || !testAdres.trim()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              Stuur test
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">De testmail gebruikt de opgeslagen versie. Sla dus eerst op.</p>
        </div>

        {melding && <p className="text-sm text-gray-600">{melding}</p>}
      </div>
    </div>
  );
}

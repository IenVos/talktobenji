"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../../AdminAuthContext";

const TYPE_LABEL: Record<string, string> = {
  persoon: "Verlies van een persoon",
  huisdier: "Verlies van een huisdier",
  scheiding: "Relatie voorbij",
  eenzaamheid: "Eenzaamheid",
  kinderloos: "Kinderwens",
  algemeen: "Algemeen (geen type)",
};

export default function ReactivatiePage() {
  const data = useAdminQuery(api.mailFunnel.reactivatieDoelgroep, {}) as
    | {
        totaal: number;
        perType: { type: string; aantal: number }[];
        redenen: { afgemeld: number; gekocht: number; alBenji: number; testadres: number };
        nogInReeks: number;
        teKortGeleden: number;
        voorStart: number;
        uniekeLeadsNaStart: number;
        lijst: { email: string; naam: string | null; type: string; dagenSindsLaatste: number }[];
      }
    | undefined;
  const bounce = useAdminQuery(api.mailFunnel.reactivatieBounceCheck, {}) as
    | { aantal: number; adressen: string[] }
    | undefined;

  const [toonLijst, setToonLijst] = useState(false);

  return (
    <>
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reactivatie: eenmalige Benji-mail</h1>
        <p className="text-sm text-gray-500 mt-1">
          De leads die de Even Houvast-reeks helemaal doorliepen, niet kochten, zich niet afmeldden en
          Benji nog nooit zagen. Dit is alleen een overzicht. Er verstuurt hier nog niets: eerst
          controleer je of de aantallen kloppen.
        </p>
      </div>

      {/* Hoofdgetal */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-gray-900">{data?.totaal ?? "…"}</span>
          <span className="text-sm text-gray-500">mensen krijgen de reactivatiemail</span>
        </div>

        {data && data.perType.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.perType.map((r) => (
              <div
                key={r.type}
                className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2"
              >
                <span className="text-sm text-gray-700">{TYPE_LABEL[r.type] ?? r.type}</span>
                <span className="text-sm font-semibold text-gray-900">{r.aantal}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wie valt af en waarom */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Wie valt af, en waarom</h2>
        <p className="text-xs text-gray-500">
          Van alle mensen die de reeks helemaal doorliepen. Zo zie je dat we niemand mailen die dat niet
          zou moeten krijgen.
        </p>
        <ul className="text-sm text-gray-700 divide-y divide-gray-100">
          <Rij label="Heeft zich afgemeld (nooit aanschrijven)" waarde={data?.redenen.afgemeld} />
          <Rij label="Heeft Niet Alleen gekocht" waarde={data?.redenen.gekocht} />
          <Rij label="Kende Benji al, of heeft al toegang" waarde={data?.redenen.alBenji} />
          <Rij label="Testadres van jou" waarde={data?.redenen.testadres} />
          <Rij label="Laatste mail nog geen 3 dagen geleden" waarde={data?.teKortGeleden} />
        </ul>
      </div>

      {/* Context: wie zit hier bewust niet in */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Bewust niet meegenomen</h2>
        <ul className="text-sm text-gray-700 divide-y divide-gray-100">
          <Rij
            label="Zit nog midden in de reeks (krijgt Benji vanzelf)"
            waarde={data?.nogInReeks}
          />
          <Rij
            label="Oude leads van vóór 25 juni (alleen de brief gehad)"
            waarde={data?.voorStart}
          />
        </ul>
        <p className="text-xs text-gray-500">
          De oude leads van vóór 25 juni pakken we later apart op, met een eigen tekst, als we zien hoe
          deze eerste zending loopt.
        </p>
      </div>

      {/* Bounce-waarschuwing */}
      {bounce && bounce.aantal > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-amber-900">
            Let op: {bounce.aantal} {bounce.aantal === 1 ? "adres" : "adressen"} bouncede eerder
          </h2>
          <p className="text-sm text-amber-800 mt-1">
            Deze zitten nu nog in de doelgroep. Ze gaven eerder een harde bounce of klacht, dus de mail
            komt mogelijk niet aan. We filteren ze nog niet automatisch weg. Bij het versturen (volgende
            stap) beslissen we of we ze overslaan.
          </p>
        </div>
      )}

      {/* De lijst zelf */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <button
          onClick={() => setToonLijst((v) => !v)}
          className="text-sm font-medium text-primary-700 hover:underline"
        >
          {toonLijst ? "Verberg de lijst" : `Toon de lijst (${data?.totaal ?? 0} mensen)`}
        </button>
        {toonLijst && data && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">E-mail</th>
                  <th className="py-2 pr-4 font-medium">Naam</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 font-medium">Laatste mail</th>
                </tr>
              </thead>
              <tbody>
                {data.lijst.map((r) => (
                  <tr key={r.email} className="border-b border-gray-50">
                    <td className="py-2 pr-4 text-gray-800">{r.email}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.naam ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{TYPE_LABEL[r.type] ?? r.type}</td>
                    <td className="py-2 text-gray-600">{r.dagenSindsLaatste} dagen geleden</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mail 1 */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-gray-900">Mail 1: de hoofdmail</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gaat naar de hele groep hierboven. Ze stromen nog niet de evergreen funnel in: dat gebeurt pas
          na mail 2, zodat iedereen eerst de volledige reactivatie doorloopt.
        </p>
      </div>
      <ReactivatieOpsteller stap={1} />
      <ReactivatieVerzenden stap={1} />

      {/* Mail 2 */}
      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mt-4">Mail 2: zachte herinnering</h2>
        <p className="text-sm text-gray-500 mt-1">
          Verstuur je een paar dagen na mail 1. Gaat <strong>alleen</strong> naar wie mail 1 niet opende of
          aanklikte (wie al reageerde krijgt hem niet). Zodra deze ronde klaar is, stroomt iedereen uit de
          reactivatiegroep de evergreen funnel in. Verstuur je geen mail 2, dan blijft de instroom uit.
        </p>
      </div>
      <ReactivatieOpsteller stap={2} />
      <ReactivatieVerzenden stap={2} />
    </div>
    </>
  );
}

function ReactivatieOpsteller({ stap }: { stap: 1 | 2 }) {
  const opgeslagen = useAdminQuery(api.mailFunnel.getReactivatieMail, stap === 2 ? { stap: 2 } : {}) as
    | {
        subject: string;
        bodyText: string;
        buttonText: string;
        buttonUrl: string;
        imageUrl: string;
        imageCaption: string;
        opgeslagen: boolean;
      }
    | undefined;
  const save = useAdminMutation(api.mailFunnel.saveReactivatieMail);
  const stuurTest = useAdminAction(api.mailFunnel.stuurTestReactivatie);
  const generateUploadUrl = useAdminMutation(api.pageContent.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pageContent.getImageUrl);

  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [geladen, setGeladen] = useState(false);
  const [uploaden, setUploaden] = useState(false);

  const [testEmail, setTestEmail] = useState("annadelapierre@icloud.com");
  const [testNaam, setTestNaam] = useState("Ien");
  const [testType, setTestType] = useState("huisdier");
  const [bezig, setBezig] = useState<"idle" | "opslaan" | "test">("idle");
  const [melding, setMelding] = useState("");

  // Eenmalig de opgeslagen tekst (of default) in de velden zetten.
  useEffect(() => {
    if (opgeslagen && !geladen) {
      setSubject(opgeslagen.subject);
      setBodyText(opgeslagen.bodyText);
      setButtonText(opgeslagen.buttonText ?? "");
      setButtonUrl(opgeslagen.buttonUrl ?? "");
      setImageUrl(opgeslagen.imageUrl ?? "");
      setImageCaption(opgeslagen.imageCaption ?? "");
      setGeladen(true);
    }
  }, [opgeslagen, geladen]);

  const uploadAfbeelding = async (file: File) => {
    setUploaden(true);
    setMelding("");
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      const publiek = await getImageUrl({ storageId });
      if (publiek) setImageUrl(publiek);
    } catch (e: any) {
      setMelding(e?.message ?? "Uploaden mislukt.");
    } finally {
      setUploaden(false);
    }
  };

  const opslaan = async () => {
    setBezig("opslaan");
    setMelding("");
    try {
      await save({ stap, subject, bodyText, buttonText, buttonUrl, imageUrl, imageCaption });
      setMelding("Opgeslagen.");
    } catch (e: any) {
      setMelding(e?.message ?? "Opslaan mislukt.");
    } finally {
      setBezig("idle");
    }
  };

  const testen = async () => {
    if (!testEmail.includes("@")) {
      setMelding("Vul een geldig testadres in.");
      return;
    }
    setBezig("test");
    setMelding("");
    try {
      // Eerst opslaan, zodat de test exact de huidige tekst gebruikt.
      await save({ stap, subject, bodyText, buttonText, buttonUrl, imageUrl, imageCaption });
      await stuurTest({ stap, email: testEmail.trim(), naam: testNaam.trim() || undefined, type: testType });
      setMelding(`Testmail verstuurd naar ${testEmail.trim()}.`);
    } catch (e: any) {
      setMelding(e?.message ?? "Testmail versturen mislukt.");
    } finally {
      setBezig("idle");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">De tekst opstellen</h2>
        <p className="text-xs text-gray-500 mt-1">
          Kleine testtekst om mee te beginnen. Pas hem gerust aan. Alles verschijnt in de volgorde van je
          tekst, dus met deze markers bepaal je zelf de plek:
        </p>
        <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc pl-5">
          <li>
            <code>[benji-blok]</code> op een eigen regel: het Benji-kaartje met de gratis-proef-knop, op
            precies die plek.
          </li>
          <li>
            <code>[afbeelding]</code> op een eigen regel: de afbeelding hieronder, op die plek in de tekst.
          </li>
          <li>
            <code>[knop]</code> op een eigen regel: de knop (hieronder ingesteld), op die plek.
          </li>
          <li>
            <code>{"{voornaam}"}</code> wordt per persoon ingevuld.
          </li>
          <li>
            Een afsluitgroet als <em>Lieve groet,</em> krijgt automatisch je foto-handtekening eronder. Je
            naam hoef je er niet bij te zetten.
          </li>
          <li>
            Een regel die met <strong>P.S.</strong> begint, wordt als P.S. opgemaakt op die plek.
          </li>
          <li>
            Gebruik je geen <code>[afbeelding]</code>- of <code>[knop]</code>-marker, dan komen die
            automatisch vlak boven je afsluitgroet.
          </li>
        </ul>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Onderwerp</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Tekst</span>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={10}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Knoptekst (optioneel)</span>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="Laat leeg voor geen knop"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Knop-link (optioneel)</span>
          <input
            type="text"
            value={buttonUrl}
            onChange={(e) => setButtonUrl(e.target.value)}
            placeholder="https://www.talktobenji.com/..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {/* Afbeelding (optioneel) */}
      <div className="rounded-lg border border-gray-200 p-3 space-y-2">
        <span className="text-sm font-medium text-gray-700">Afbeelding (optioneel)</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… of upload hiernaast"
            className="flex-1 min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <label
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
              uploaden
                ? "opacity-50 border-gray-200"
                : "border-primary-200 text-primary-700 hover:bg-primary-50"
            }`}
          >
            {uploaden ? "Uploaden…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploaden}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAfbeelding(file);
              }}
            />
          </label>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Verwijderen
            </button>
          )}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-w-[180px] rounded-lg border border-gray-200" />
        )}
        <input
          type="text"
          value={imageCaption}
          onChange={(e) => setImageCaption(e.target.value)}
          placeholder="Bijschrift onder de afbeelding (optioneel)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={opslaan}
          disabled={bezig !== "idle"}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {bezig === "opslaan" ? "Opslaan…" : "Opslaan"}
        </button>
      </div>

      {/* Testmail */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Testmail naar jezelf</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="jouw@e-mail.nl"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={testNaam}
            onChange={(e) => setTestNaam(e.target.value)}
            placeholder="Naam (voor {voornaam})"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.entries(TYPE_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={testen}
          disabled={bezig !== "idle"}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {bezig === "test" ? "Versturen…" : "Stuur testmail"}
        </button>
      </div>

      {melding && <p className="text-sm text-gray-600">{melding}</p>}
    </div>
  );
}

function ReactivatieVerzenden({ stap }: { stap: 1 | 2 }) {
  const status = useAdminQuery(
    stap === 2 ? api.mailFunnel.reactivatie2VerzendStatus : api.mailFunnel.reactivatieVerzendStatus,
    {}
  ) as
    | {
        status: string;
        gestopt: boolean;
        batchGrootte: number;
        intervalSec: number;
        aantalVerzonden: number;
        totaalDoelgroep: number;
        resterend: number;
      }
    | undefined;
  const start = useAdminMutation(
    stap === 2 ? api.mailFunnel.startReactivatie2Verzending : api.mailFunnel.startReactivatieVerzending
  );
  const stop = useAdminMutation(
    stap === 2 ? api.mailFunnel.stopReactivatie2Verzending : api.mailFunnel.stopReactivatieVerzending
  );

  const [batch, setBatch] = useState(25);
  const [intervalSec, setIntervalSec] = useState(60);
  const [ingesteld, setIngesteld] = useState(false);
  const [bevestig, setBevestig] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  // Eenmalig de opgeslagen instellingen overnemen.
  useEffect(() => {
    if (status && !ingesteld) {
      setBatch(status.batchGrootte);
      setIntervalSec(status.intervalSec);
      setIngesteld(true);
    }
  }, [status, ingesteld]);

  const loopt = status?.status === "bezig";

  const starten = async () => {
    setBezig(true);
    setMelding("");
    try {
      await start({ bevestig: true, batchGrootte: batch, intervalSec: intervalSec });
      setMelding("Verzending gestart.");
      setBevestig(false);
    } catch (e: any) {
      setMelding(e?.message ?? "Starten mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const stoppen = async () => {
    setBezig(true);
    try {
      await stop({});
      setMelding("Noodrem ingedrukt. De volgende ronde stopt.");
    } catch (e: any) {
      setMelding(e?.message ?? "Stoppen mislukt.");
    } finally {
      setBezig(false);
    }
  };

  // Geschatte duur: aantal rondes maal de pauze.
  const rondes = batch > 0 ? Math.ceil((status?.resterend ?? 0) / batch) : 0;
  const duurMin = Math.round((rondes * intervalSec) / 60);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Versturen naar de doelgroep</h2>
        <p className="text-xs text-gray-500 mt-1">
          Gespreid in kleine groepjes, zodat Outlook en Hotmail niet gaan knijpen. Vlak voor elke mail
          wordt nog gecontroleerd of iemand zich niet net heeft afgemeld of heeft gekocht.{" "}
          {stap === 2
            ? "Gaat alleen naar wie mail 1 niet opende of aanklikte. Zodra deze ronde klaar is, stroomt de hele reactivatiegroep de evergreen funnel in."
            : "Ze stromen nog niet de evergreen funnel in: dat gebeurt na de mail 2-ronde."}
        </p>
      </div>

      {/* Voortgang */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-2xl font-bold text-gray-900">{status?.totaalDoelgroep ?? "…"}</p>
          <p className="text-xs text-gray-500">in de doelgroep</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-2xl font-bold text-green-700">{status?.aantalVerzonden ?? "…"}</p>
          <p className="text-xs text-gray-500">verstuurd</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-2xl font-bold text-gray-900">{status?.resterend ?? "…"}</p>
          <p className="text-xs text-gray-500">nog te gaan</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-2xl font-bold text-gray-900">
            {loopt ? "bezig" : status?.status === "verzonden" ? "klaar" : "klaar om te starten"}
          </p>
          <p className="text-xs text-gray-500">status</p>
        </div>
      </div>

      {/* Instellingen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Aantal per ronde</span>
          <input
            type="number"
            min={1}
            max={100}
            value={batch}
            onChange={(e) => setBatch(Number(e.target.value))}
            disabled={loopt}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Pauze tussen rondes (seconden)</span>
          <input
            type="number"
            min={5}
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
            disabled={loopt}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
          />
        </label>
      </div>
      {!loopt && (status?.resterend ?? 0) > 0 && (
        <p className="text-xs text-gray-500">
          Standaard 25 per 60 seconden. Met deze instelling duurt het ongeveer{" "}
          {duurMin <= 1 ? "een paar minuten" : `${duurMin} minuten`}.
        </p>
      )}

      {/* Start / stop */}
      {loopt ? (
        <button
          onClick={stoppen}
          disabled={bezig}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Noodrem: stop de verzending
        </button>
      ) : (
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={bevestig}
              onChange={(e) => setBevestig(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Ik heb een testmail bekeken en de tekst klopt. Verstuur naar{" "}
              <strong>{status?.resterend ?? 0}</strong> mensen.
            </span>
          </label>
          <button
            onClick={starten}
            disabled={!bevestig || bezig || (status?.resterend ?? 0) === 0}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {bezig ? "Starten…" : "Start de verzending"}
          </button>
        </div>
      )}

      {melding && <p className="text-sm text-gray-600">{melding}</p>}
    </div>
  );
}

function Rij({ label, waarde }: { label: string; waarde?: number }) {
  return (
    <li className="flex items-center justify-between py-2">
      <span>{label}</span>
      <span className="font-semibold text-gray-900">{waarde ?? "…"}</span>
    </li>
  );
}

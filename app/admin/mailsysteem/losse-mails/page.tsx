"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../../AdminAuthContext";

const DOELGROEPEN = [
  { code: "lijst", label: "Hele lijst (zonder rustgroep)" },
  { code: "lijst-incl-rust", label: "Hele lijst (incl. rustgroep, voor de maandmail)" },
  { code: "type:persoon", label: "Alleen: verlies van een persoon" },
  { code: "type:huisdier", label: "Alleen: verlies van een huisdier" },
  { code: "type:scheiding", label: "Alleen: relatie voorbij" },
  { code: "type:eenzaamheid", label: "Alleen: eenzaamheid" },
  { code: "type:kinderloos", label: "Alleen: kinderwens" },
];
const doelLabel = (c: string) => DOELGROEPEN.find((d) => d.code === c)?.label ?? c;

const STATUS_LABEL: Record<string, string> = {
  concept: "Concept",
  gepland: "Ingepland",
  bezig: "Wordt verstuurd",
  verzonden: "Verzonden",
};

function datumNL(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

type Rij = {
  _id: string;
  subject: string;
  doelgroep: string;
  doelgroepLabel: string;
  status: string;
  geplandOp: number | null;
  aantalVerzonden: number;
  verstuurdOp: number | null;
};

export default function LosseMailsPage() {
  const rijen = useAdminQuery(api.broadcasts.lijst, {}) as Rij[] | undefined;
  const [bewerkId, setBewerkId] = useState<string | null>(null);
  const [nieuw, setNieuw] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Losse mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tussendoor-mails en de maandmail: schrijf een bericht, kies wie het krijgt, test naar jezelf en
          verstuur nu of op een gepland moment. Afgemelde mensen vallen altijd af.
        </p>
      </div>

      {nieuw || bewerkId ? (
        <Composer
          id={bewerkId}
          onKlaar={() => {
            setNieuw(false);
            setBewerkId(null);
          }}
        />
      ) : (
        <button
          onClick={() => setNieuw(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Nieuwe mail
        </button>
      )}

      {/* Lijst met mails */}
      <div className="space-y-2">
        {rijen?.length === 0 && <p className="text-sm text-gray-400">Nog geen losse mails.</p>}
        {rijen?.map((r) => (
          <div key={r._id} className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.subject || "(geen onderwerp)"}</p>
              <p className="text-xs text-gray-400">
                {doelLabel(r.doelgroep)} · {STATUS_LABEL[r.status] ?? r.status}
                {r.status === "gepland" && r.geplandOp ? ` op ${datumNL(r.geplandOp)}` : ""}
                {r.status === "verzonden" ? ` · ${r.aantalVerzonden} verstuurd` : ""}
                {r.status === "bezig" ? ` · ${r.aantalVerzonden} tot nu toe` : ""}
              </p>
            </div>
            {(r.status === "concept" || r.status === "gepland") && (
              <button
                onClick={() => {
                  setNieuw(false);
                  setBewerkId(r._id);
                }}
                className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-primary-700"
              >
                Openen
              </button>
            )}
            {r.status === "verzonden" && (
              <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">Klaar</span>
            )}
            {r.status === "bezig" && (
              <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">Bezig</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Composer({ id, onKlaar }: { id: string | null; onKlaar: () => void }) {
  const bestaand = useAdminQuery(api.broadcasts.get, id ? { id } : "skip") as any;
  const opslaan = useAdminMutation(api.broadcasts.opslaan);
  const verwijderen = useAdminMutation(api.broadcasts.verwijderen);
  const stuurTest = useAdminAction(api.broadcasts.stuurTestLosseMail);
  const startVerzending = useAdminMutation(api.broadcasts.startVerzending);
  const stopVerzending = useAdminMutation(api.broadcasts.stopVerzending);
  const generateUploadUrl = useAdminMutation(api.pageContent.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pageContent.getImageUrl);

  const [mailId, setMailId] = useState<string | null>(id);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [doelgroep, setDoelgroep] = useState("lijst");
  const [geladen, setGeladen] = useState(false);
  const [uploaden, setUploaden] = useState(false);

  const [testEmail, setTestEmail] = useState("");
  const [testNaam, setTestNaam] = useState("");
  const [batch, setBatch] = useState(25);
  const [intervalSec, setIntervalSec] = useState(60);
  const [wanneer, setWanneer] = useState<"nu" | "plan">("nu");
  const [planMoment, setPlanMoment] = useState("");
  const [bevestig, setBevestig] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  const aantal = useAdminQuery(api.broadcasts.doelgroepAantal, { doelgroep }) as { aantal: number } | undefined;
  const status = bestaand?.status ?? "concept";
  const loopt = status === "bezig";
  const isGepland = status === "gepland";

  useEffect(() => {
    if (bestaand && !geladen) {
      setSubject(bestaand.subject ?? "");
      setBodyText(bestaand.bodyText ?? "");
      setButtonText(bestaand.buttonText ?? "");
      setButtonUrl(bestaand.buttonUrl ?? "");
      setImageUrl(bestaand.imageUrl ?? "");
      setImageCaption(bestaand.imageCaption ?? "");
      setDoelgroep(bestaand.doelgroep ?? "lijst");
      setBatch(bestaand.batchGrootte ?? 25);
      setIntervalSec(bestaand.intervalSec ?? 60);
      setGeladen(true);
    }
  }, [bestaand, geladen]);

  const bewaar = async (): Promise<string | null> => {
    const res = await opslaan({
      id: (mailId ?? undefined) as any,
      subject,
      bodyText,
      buttonText,
      buttonUrl,
      imageUrl,
      imageCaption,
      doelgroep,
    });
    const nieuweId = String(res.id);
    setMailId(nieuweId);
    return nieuweId;
  };

  const uploadAfbeelding = async (file: File) => {
    setUploaden(true);
    try {
      const url = await generateUploadUrl();
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await r.json();
      const publiek = await getImageUrl({ storageId });
      if (publiek) setImageUrl(publiek);
    } finally {
      setUploaden(false);
    }
  };

  const opslaanKnop = async () => {
    setBezig(true);
    setMelding("");
    try {
      await bewaar();
      setMelding("Opgeslagen.");
    } catch (e: any) {
      setMelding(e?.message ?? "Opslaan mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const testen = async () => {
    if (!testEmail.includes("@")) {
      setMelding("Vul een geldig testadres in.");
      return;
    }
    setBezig(true);
    setMelding("");
    try {
      const savedId = await bewaar();
      if (!savedId) return;
      await stuurTest({ id: savedId as any, email: testEmail.trim(), naam: testNaam.trim() || undefined, type: undefined });
      setMelding(`Testmail verstuurd naar ${testEmail.trim()}.`);
    } catch (e: any) {
      setMelding(e?.message ?? "Testmail versturen mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const versturen = async () => {
    setBezig(true);
    setMelding("");
    try {
      const savedId = await bewaar();
      if (!savedId) return;
      let geplandOp: number | undefined = undefined;
      if (wanneer === "plan") {
        if (!planMoment) {
          setMelding("Kies een datum en tijd om in te plannen.");
          setBezig(false);
          return;
        }
        geplandOp = new Date(planMoment).getTime();
        if (geplandOp <= Date.now()) {
          setMelding("Kies een moment in de toekomst.");
          setBezig(false);
          return;
        }
      }
      await startVerzending({
        id: savedId as any,
        bevestig: true,
        geplandOp,
        batchGrootte: batch,
        intervalSec,
      });
      setMelding(wanneer === "plan" ? "Ingepland." : "Verzending gestart.");
      setBevestig(false);
      onKlaar();
    } catch (e: any) {
      setMelding(e?.message ?? "Versturen mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const stoppen = async () => {
    if (!mailId) return;
    setBezig(true);
    try {
      await stopVerzending({ id: mailId as any });
      setMelding("Gestopt.");
      onKlaar();
    } catch (e: any) {
      setMelding(e?.message ?? "Stoppen mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="bg-white border border-primary-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{mailId ? "Mail bewerken" : "Nieuwe mail"}</h2>
        <button onClick={onKlaar} className="text-sm text-gray-500 hover:underline">Sluiten</button>
      </div>

      {loopt && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Deze mail wordt op dit moment verstuurd ({bestaand?.aantalVerzonden ?? 0} tot nu toe).
          <button onClick={stoppen} disabled={bezig} className="ml-2 rounded bg-red-600 px-3 py-1 text-white text-xs">
            Noodrem
          </button>
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Doelgroep</span>
        <select value={doelgroep} onChange={(e) => setDoelgroep(e.target.value)} disabled={loopt} className={inputCls}>
          {DOELGROEPEN.map((d) => (
            <option key={d.code} value={d.code}>{d.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{aantal ? `${aantal.aantal} mensen` : "…"} in deze doelgroep.</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Onderwerp</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={loopt} className={inputCls} />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Tekst</span>
        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={9} disabled={loopt} className={`${inputCls} font-mono`} />
        <span className="text-[11px] text-gray-400">
          Markers op een eigen regel: <code>[benji-blok]</code>, <code>[afbeelding]</code>, <code>[knop]</code>.
          <code>{"{voornaam}"}</code> wordt ingevuld. Een afsluitgroet krijgt de foto-handtekening; een
          P.S.-regel wordt als P.S. opgemaakt.
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Knoptekst (optioneel)</span>
          <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} disabled={loopt} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Knop-link (optioneel)</span>
          <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} disabled={loopt} placeholder="https://…" className={inputCls} />
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 p-3 space-y-2">
        <span className="text-xs font-semibold text-gray-600">Afbeelding (optioneel)</span>
        <div className="flex flex-wrap items-center gap-2">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={loopt} placeholder="https://… of upload" className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${uploaden ? "opacity-50 border-gray-200" : "border-primary-200 text-primary-700 hover:bg-primary-50"}`}>
            {uploaden ? "Uploaden…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" disabled={uploaden || loopt} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAfbeelding(f); }} />
          </label>
          {imageUrl && <button type="button" onClick={() => setImageUrl("")} className="text-xs text-gray-400 hover:text-red-500">Verwijderen</button>}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-w-[160px] rounded-lg border border-gray-200" />
        )}
        <input value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} disabled={loopt} placeholder="Bijschrift (optioneel)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      {!loopt && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={opslaanKnop} disabled={bezig} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {bezig ? "Bezig…" : "Opslaan"}
            </button>
            {mailId && (
              <button
                onClick={() => { if (confirm("Deze mail verwijderen?")) verwijderen({ id: mailId as any }).then(onKlaar); }}
                className="rounded-lg px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                Verwijderen
              </button>
            )}
          </div>

          {/* Testmail */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <span className="text-sm font-semibold text-gray-900">Testmail naar jezelf</span>
            <div className="flex flex-wrap items-center gap-2">
              <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="jouw@e-mail.nl" className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <input value={testNaam} onChange={(e) => setTestNaam(e.target.value)} placeholder="Naam" className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <button onClick={testen} disabled={bezig} className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                Stuur test
              </button>
            </div>
          </div>

          {/* Versturen / inplannen */}
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <span className="text-sm font-semibold text-gray-900">Versturen</span>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={wanneer === "nu"} onChange={() => setWanneer("nu")} /> Nu versturen
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={wanneer === "plan"} onChange={() => setWanneer("plan")} /> Inplannen
              </label>
              {wanneer === "plan" && (
                <input
                  type="datetime-local"
                  value={planMoment}
                  onChange={(e) => setPlanMoment(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              )}
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500">Tempo instellen (standaard 25 per 60s)</summary>
              <div className="grid grid-cols-2 gap-3 mt-2 max-w-sm">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Aantal per ronde</span>
                  <input type="number" min={1} max={100} value={batch} onChange={(e) => setBatch(Number(e.target.value))} className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Pauze (seconden)</span>
                  <input type="number" min={5} value={intervalSec} onChange={(e) => setIntervalSec(Number(e.target.value))} className={inputCls} />
                </label>
              </div>
            </details>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={bevestig} onChange={(e) => setBevestig(e.target.checked)} className="mt-0.5" />
              <span>Ik heb een testmail bekeken en de tekst klopt. Verstuur naar <strong>{aantal?.aantal ?? 0}</strong> mensen{wanneer === "plan" ? " op het gekozen moment" : ""}.</span>
            </label>
            <button
              onClick={versturen}
              disabled={!bevestig || bezig || (aantal?.aantal ?? 0) === 0}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {bezig ? "Bezig…" : wanneer === "plan" ? "Inplannen" : "Nu versturen"}
            </button>
          </div>
        </>
      )}

      {isGepland && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          Ingepland op {datumNL(bestaand?.geplandOp ?? null)}.
          <button onClick={stoppen} disabled={bezig} className="ml-2 rounded bg-gray-700 px-3 py-1 text-white text-xs">
            Annuleren (terug naar concept)
          </button>
        </div>
      )}

      {melding && <p className="text-sm text-gray-600">{melding}</p>}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../../AdminAuthContext";

const DOELGROEPEN = [
  { code: "lijst", label: "Hele lijst (zonder rustgroep)" },
  { code: "lijst-incl-rust", label: "Hele lijst (incl. rustgroep, voor de maandmail)" },
  { code: "sluimerend", label: "Sluimerend (opende eerder, nu lang niet)" },
  { code: "nooit-geopend", label: "Nooit-openers (opende nog nooit iets)" },
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
  naEvergreen: boolean;
  geplandOp: number | null;
  aantalVerzonden: number;
  verstuurdOp: number | null;
};

export default function LosseMailsPage() {
  const rijen = useAdminQuery(api.broadcasts.lijst, {}) as Rij[] | undefined;
  const stopVerzending = useAdminMutation(api.broadcasts.stopVerzending);
  const [bewerkId, setBewerkId] = useState<string | null>(null);
  const [nieuw, setNieuw] = useState(false);
  const [reactiesId, setReactiesId] = useState<string | null>(null);

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

      <GroepenBeheer />

      {/* Lijst met mails */}
      <div className="space-y-2">
        {rijen?.length === 0 && <p className="text-sm text-gray-400">Nog geen losse mails.</p>}
        {rijen?.map((r) => (
          <div key={r._id}>
          <div className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.subject || "(geen onderwerp)"}</p>
              <p className="text-xs text-gray-400">
                {doelLabel(r.doelgroep)} · {STATUS_LABEL[r.status] ?? r.status}
                {r.status === "gepland" && r.geplandOp ? ` op ${datumNL(r.geplandOp)}` : ""}
                {r.status === "verzonden" ? ` · ${r.aantalVerzonden} verstuurd` : ""}
                {r.status === "bezig" ? ` · ${r.aantalVerzonden} tot nu toe` : ""}
                {r.naEvergreen ? " · → evergreen" : ""}
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
              <>
                <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">Klaar</span>
                <button onClick={() => setReactiesId(reactiesId === r._id ? null : r._id)} className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-primary-700">
                  Reacties
                </button>
              </>
            )}
            {r.status === "bezig" && (
              <>
                <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">Bezig</span>
                <button
                  onClick={() => { if (confirm("Verzending nu stoppen? Wat al verstuurd is, is verstuurd.")) stopVerzending({ id: r._id as any }); }}
                  className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                >
                  Noodrem
                </button>
              </>
            )}
            {r.status === "gepland" && (
              <button
                onClick={() => { if (confirm("Ingeplande verzending annuleren?")) stopVerzending({ id: r._id as any }); }}
                className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
              >
                Annuleren
              </button>
            )}
          </div>
          {reactiesId === r._id && <ReactiesPanel id={r._id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReactiesPanel({ id }: { id: string }) {
  const data = useAdminQuery(api.broadcasts.reacties, { id }) as
    | { verstuurd: number; gereageerd: number; nietGereageerd: number; verstuurdOp: number | null; dagenGeleden: number | null }
    | undefined;
  const uitschrijven = useAdminMutation(api.broadcasts.schrijfNietReageerdersUit);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  const teVroeg = (data?.dagenGeleden ?? 99) < 7;

  const doeUitschrijven = async () => {
    if (!confirm(`${data?.nietGereageerd ?? 0} mensen uitschrijven die niet reageerden op deze mail?`)) return;
    setBezig(true);
    try {
      const r = await uitschrijven({ id: id as any });
      setMelding(`${r.uitgeschreven} mensen uitgeschreven.`);
    } catch (e: any) {
      setMelding(e?.message ?? "Uitschrijven mislukt.");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="mt-1 rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
      {!data ? (
        <p className="text-sm text-gray-400">Laden…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white border border-gray-100 p-2"><p className="text-xl font-bold text-gray-900">{data.verstuurd}</p><p className="text-[11px] text-gray-500">verstuurd</p></div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-2"><p className="text-xl font-bold text-green-700">{data.gereageerd}</p><p className="text-[11px] text-gray-500">reageerde (open/klik)</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-2"><p className="text-xl font-bold text-amber-700">{data.nietGereageerd}</p><p className="text-[11px] text-gray-500">geen reactie</p></div>
          </div>
          <p className="text-xs text-gray-500">
            {data.dagenGeleden !== null ? `Verstuurd ${data.dagenGeleden} dagen geleden. ` : ""}
            Wie hem opende of klikte, blijft. De rest kun je uitschrijven, het beste na een dag of veertien
            zodat iedereen de kans had. Open-meting is niet waterdicht, dus wees niet te streng.
          </p>
          <button
            onClick={doeUitschrijven}
            disabled={bezig || (data.nietGereageerd ?? 0) === 0}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${teVroeg ? "bg-gray-400" : "bg-red-600"}`}
          >
            {bezig ? "Bezig…" : `Schrijf de ${data.nietGereageerd} niet-reageerders uit`}
          </button>
          {teVroeg && <span className="ml-2 text-xs text-amber-600">Nog vroeg. Geef mensen liefst ~14 dagen.</span>}
          {melding && <p className="text-sm text-gray-600">{melding}</p>}
        </>
      )}
    </div>
  );
}

// Haalt e-mailadressen (en waar mogelijk namen) uit geplakte tekst of een CSV.
// Neemt per regel het eerste adres dat op een e-mail lijkt; een niet-numerieke,
// niet-datum tekst ernaast geldt als naam (zoals bij "adres,naam").
function parseLeden(text: string): { email: string; naam?: string }[] {
  const uit: { email: string; naam?: string }[] = [];
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const delen = line.split(/[,;\t]/).map((s) => s.trim().replace(/^"|"$/g, ""));
    const email = delen.find((d) => emailRe.test(d));
    if (!email) continue;
    const naam = delen.find(
      (d) => d && d !== email && !emailRe.test(d) && !/^\d+$/.test(d) && !/^\d{4}-\d{2}-\d{2}/.test(d)
    );
    uit.push({ email, naam });
  }
  return uit;
}

function GroepenBeheer() {
  const groepen = useAdminQuery(api.mailGroepen.lijst, {}) as { _id: string; naam: string; aantal: number }[] | undefined;
  const maak = useAdminMutation(api.mailGroepen.maak);
  const hernoem = useAdminMutation(api.mailGroepen.hernoem);
  const verwijder = useAdminMutation(api.mailGroepen.verwijder);
  const ledenToevoegen = useAdminMutation(api.mailGroepen.ledenToevoegen);

  const [open, setOpen] = useState(false);
  const [nieuweNaam, setNieuweNaam] = useState("");
  const [actieveGroep, setActieveGroep] = useState<string | null>(null);
  const [plak, setPlak] = useState("");
  const [alleenNieuwe, setAlleenNieuwe] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  const nieuweGroep = async () => {
    if (!nieuweNaam.trim()) return;
    const res = await maak({ naam: nieuweNaam.trim() });
    setNieuweNaam("");
    setActieveGroep(String(res.id));
  };

  const toevoegen = async (viaTekst: string) => {
    if (!actieveGroep) {
      setMelding("Kies of maak eerst een groep.");
      return;
    }
    const leden = parseLeden(viaTekst);
    if (leden.length === 0) {
      setMelding("Geen geldige e-mailadressen gevonden.");
      return;
    }
    setBezig(true);
    setMelding("");
    try {
      const r = await ledenToevoegen({ id: actieveGroep as any, leden, alleenNieuwe });
      setMelding(
        `${r.toegevoegd} toegevoegd. Overgeslagen: ${r.alInSysteem} al in ons systeem, ${r.dubbel} dubbel, ${r.afgemeld} afgemeld/test, ${r.ongeldig} ongeldig.`
      );
      setPlak("");
    } catch (e: any) {
      setMelding(e?.message ?? "Toevoegen mislukt.");
    } finally {
      setBezig(false);
    }
  };

  const csvUpload = async (file: File) => {
    const tekst = await file.text();
    await toevoegen(tekst);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700">
        <span>Eigen doelgroepen {groepen ? `(${groepen.length})` : ""}</span>
        <span className="text-gray-400">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Maak een eigen groep en plak adressen of upload een CSV (bijv. een export uit MailerLite). We
            schonen automatisch op: dubbelen, afgemelde en testadressen vallen af, en met het vinkje
            hieronder ook adressen die je al in je eigen systeem hebt. Groepen kies je bovenin bij Doelgroep.
          </p>

          {/* Bestaande groepen */}
          <div className="space-y-1">
            {groepen?.map((g) => (
              <div key={g._id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${actieveGroep === g._id ? "bg-primary-50 border border-primary-200" : "bg-gray-50 border border-gray-100"}`}>
                <button onClick={() => setActieveGroep(g._id)} className="flex-1 text-left">
                  <span className="font-medium text-gray-900">{g.naam}</span>
                  <span className="text-gray-400"> · {g.aantal} adressen</span>
                </button>
                <button
                  onClick={() => {
                    const nw = prompt("Nieuwe naam voor de groep", g.naam);
                    if (nw) hernoem({ id: g._id as any, naam: nw });
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Hernoem
                </button>
                <button
                  onClick={() => { if (confirm(`Groep "${g.naam}" verwijderen?`)) verwijder({ id: g._id as any }); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Verwijder
                </button>
              </div>
            ))}
          </div>

          {/* Nieuwe groep */}
          <div className="flex gap-2">
            <input value={nieuweNaam} onChange={(e) => setNieuweNaam(e.target.value)} placeholder="Naam nieuwe groep (bijv. MailerLite-migratie)" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button onClick={nieuweGroep} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">Maak groep</button>
          </div>

          {/* Adressen toevoegen aan de actieve groep */}
          {actieveGroep && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">
                Adressen toevoegen aan: {groepen?.find((g) => g._id === actieveGroep)?.naam}
              </p>
              <textarea value={plak} onChange={(e) => setPlak(e.target.value)} rows={5} placeholder={"Plak hier adressen, één per regel.\nMag ook 'adres,naam'."} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={alleenNieuwe} onChange={(e) => setAlleenNieuwe(e.target.checked)} />
                Alleen adressen toevoegen die nog niet in mijn systeem zitten
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => toevoegen(plak)} disabled={bezig} className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white disabled:opacity-50">
                  {bezig ? "Bezig…" : "Plakte adressen toevoegen"}
                </button>
                <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${bezig ? "opacity-50 border-gray-200" : "border-primary-200 text-primary-700 hover:bg-primary-50"}`}>
                  CSV uploaden
                  <input type="file" accept=".csv,text/csv,text/plain" className="hidden" disabled={bezig} onChange={(e) => { const f = e.target.files?.[0]; if (f) csvUpload(f); }} />
                </label>
              </div>
            </div>
          )}

          {melding && <p className="text-sm text-gray-600">{melding}</p>}
        </div>
      )}
    </div>
  );
}

function Composer({ id, onKlaar }: { id: string | null; onKlaar: () => void }) {
  const bestaand = useAdminQuery(api.broadcasts.get, id ? { id } : "skip") as any;
  const groepen = useAdminQuery(api.mailGroepen.lijst, {}) as { _id: string; naam: string; aantal: number }[] | undefined;
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
  const [naEvergreen, setNaEvergreen] = useState(false);
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
      setNaEvergreen(!!bestaand.naEvergreen);
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
      naEvergreen,
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
          {groepen && groepen.length > 0 && (
            <optgroup label="Eigen doelgroepen">
              {groepen.map((g) => (
                <option key={g._id} value={`groep:${g._id}`}>{g.naam} ({g.aantal})</option>
              ))}
            </optgroup>
          )}
        </select>
        <span className="text-xs text-gray-400">{aantal ? `${aantal.aantal} mensen` : "…"} in deze doelgroep.</span>
      </label>

      <label className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${naEvergreen ? "border-primary-200 bg-primary-50" : "border-gray-200 bg-gray-50"} ${loopt ? "opacity-60" : ""}`}>
        <input type="checkbox" checked={naEvergreen} disabled={loopt} onChange={(e) => setNaEvergreen(e.target.checked)} className="mt-0.5" />
        <span className="text-gray-700">
          <strong>Na versturen in de evergreen funnel zetten.</strong> Iedereen die deze mail krijgt, stroomt daarna
          op zijn eigen dag 1 de evergreen reeks in. Handig voor een intro of migratie: eerst deze mail, daarna
          de reeks. Wie er al in zit, blijft ongemoeid.
        </span>
      </label>

      {(doelgroep === "sluimerend" || doelgroep === "nooit-geopend") && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
          Dit is de her-activatiemail. Stuur hem één keer. Wie hem opent of klikt, blijft. Wie na de
          wachttijd niets deed, schrijf je uit met de knop bij deze mail in de lijst hieronder.
          <button
            type="button"
            onClick={() => {
              setSubject("Mag ik je nog schrijven?");
              setBodyText(
                "Hoi {voornaam},\n\n" +
                  "Ik merk dat je mijn mails al een tijdje niet opent, en dat is helemaal oké. Ik wil je alleen niet blijven mailen als je er geen behoefte meer aan hebt.\n\n" +
                  "Wil je mijn berichten blijven ontvangen? Open dan gewoon deze mail, of klik hieronder. Dan weet ik dat je erbij wilt blijven.\n\n" +
                  "Hoor ik niets, dan haal ik je rustig van de lijst. Geen harde gevoelens, en je bent altijd welkom terug.\n\n" +
                  "Lieve groet,"
              );
              setButtonText("Ja, blijf me schrijven");
              setButtonUrl("https://www.talktobenji.com");
            }}
            className="mt-2 block rounded-lg bg-white border border-blue-200 px-3 py-1.5 text-blue-800 hover:bg-blue-100"
          >
            Voorbeeldtekst invullen
          </button>
        </div>
      )}

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

"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../../AdminAuthContext";

// De funnels ("sporen") die op dezelfde motor draaien. "evergreen" = de bestaande
// reeks. Nieuwe funnels voeg je hier toe; verder werkt alles hetzelfde.
const SPOREN = [
  { code: "evergreen", label: "Evergreen", beschrijving: "De tijdloze reeks waar EH-doorlopers in stromen (het huidige NA-gerichte spoor)." },
  { code: "benji", label: "Benji", beschrijving: "Voor wie de Benji-link uit de brief gebruikte en chatte: op weg naar doorgaan met Benji na de gratis week." },
];

const FASES = [
  { code: "", label: "Geen fase" },
  { code: "intensief", label: "Intensief (maand 1-3)" },
  { code: "verdieping", label: "Verdieping (maand 4-6)" },
  { code: "aanwezigheid", label: "Aanwezigheid (maand 7-12)" },
];

const TYPES = [
  { code: "", label: "Alle types (algemene versie)" },
  { code: "persoon", label: "Verlies van een persoon" },
  { code: "huisdier", label: "Verlies van een huisdier" },
  { code: "scheiding", label: "Relatie voorbij" },
  { code: "eenzaamheid", label: "Eenzaamheid" },
  { code: "kinderloos", label: "Kinderwens" },
];
const typeLabel = (c?: string | null) => TYPES.find((t) => t.code === (c ?? ""))?.label ?? c;

type Mail = {
  _id: string;
  dagOffset: number;
  subject: string;
  bodyText: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  imageCaption?: string;
  verliesType?: string;
  actief: boolean;
};
type Blok = {
  _id: string;
  naam: string;
  fase?: string;
  volgorde: number;
  vanDag: number;
  totDag: number;
  actief: boolean;
  mails: Mail[];
};

export default function EvergreenPage() {
  const [spoor, setSpoor] = useState<string>("evergreen");

  const blokken = useAdminQuery(api.evergreen.blokkenMetMails, { spoor }) as Blok[] | undefined;
  const tijdlijn = useAdminQuery(api.evergreen.tijdlijn, { spoor }) as
    | { dagOffset: number; subject: string; blokNaam: string; verliesType: string | null }[]
    | undefined;

  const blokToevoegen = useAdminMutation(api.evergreen.blokToevoegen);
  const seedBenjiOpening = useAdminMutation(api.evergreen.seedBenjiOpening);
  const [nieuwBlok, setNieuwBlok] = useState(false);
  const [seedBezig, setSeedBezig] = useState(false);

  const huidigSpoor = SPOREN.find((s) => s.code === spoor);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funnels</h1>
        <p className="text-sm text-gray-500 mt-1">
          Eén motor, meerdere funnels ("sporen"). Elke funnel heeft eigen blokken en mails; een lead
          krijgt alleen de blokken van zijn eigen spoor. Kies hieronder welke funnel je bewerkt.
        </p>
      </div>

      {/* Spoor-keuze */}
      <div className="flex flex-wrap gap-2">
        {SPOREN.map((s) => (
          <button
            key={s.code}
            onClick={() => { setSpoor(s.code); setNieuwBlok(false); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
              spoor === s.code
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {huidigSpoor?.beschrijving && (
        <p className="-mt-3 text-xs text-gray-500">{huidigSpoor.beschrijving}</p>
      )}

      {/* Tijdlijn-preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900">Wat een lead krijgt, op volgorde</h2>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Alleen actieve mails in actieve blokken. Dag 1 is de dag dat iemand instroomt.
        </p>
        {!tijdlijn ? (
          <p className="text-sm text-gray-400">Laden…</p>
        ) : tijdlijn.length === 0 ? (
          <p className="text-sm text-gray-400">Nog geen actieve mails. Voeg hieronder een blok en mails toe.</p>
        ) : (
          <ol className="space-y-1">
            {tijdlijn.map((t, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm">
                <span className="w-16 flex-shrink-0 font-semibold text-gray-900">Dag {t.dagOffset}</span>
                <span className="text-gray-700">{t.subject}</span>
                <span className="text-xs text-gray-400">
                  {t.blokNaam}
                  {t.verliesType ? ` · ${typeLabel(t.verliesType)}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Snelstart Benji-spoor: bestaande brief-klikker-mails erin zetten */}
      {spoor === "benji" && blokken && !blokken.some((b) => b.naam === "Opening (brief-klikkers)") && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900">Begin met de brief-klikker-mails</h2>
          <p className="text-xs text-gray-600 mt-1 mb-3">
            Zet je bestaande <strong>kom-terug</strong> (dag 3) en <strong>vervolg</strong> (dag 4) hierin, met de tekst
            die je nu hebt opgeslagen. De één-klik-Benji-knop komt automatisch mee. Daarna bouw je vanaf hier verder.
          </p>
          <button
            disabled={seedBezig}
            onClick={async () => {
              if (!confirm("De kom-terug (dag 3) en vervolg (dag 4) mails als eerste blok in dit Benji-spoor zetten?")) return;
              setSeedBezig(true);
              try {
                const r: any = await seedBenjiOpening({});
                if (r && r.ok === false) alert(r.reden ?? "Er staat al een Benji-blok.");
              } finally {
                setSeedBezig(false);
              }
            }}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {seedBezig ? "Bezig…" : "Zet de brief-klikker-mails hierin"}
          </button>
        </div>
      )}

      {/* Blokken */}
      <div className="space-y-4">
        {blokken?.map((b, i) => (
          <BlokKaart key={b._id} blok={b} isEerste={i === 0} isLaatste={i === blokken.length - 1} />
        ))}
      </div>

      {/* Nieuw blok */}
      {nieuwBlok ? (
        <BlokForm
          onKlaar={() => setNieuwBlok(false)}
          onOpslaan={async (f) => {
            await blokToevoegen({ ...f, spoor });
            setNieuwBlok(false);
          }}
        />
      ) : (
        <button
          onClick={() => setNieuwBlok(true)}
          className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
        >
          + Blok toevoegen
        </button>
      )}
    </div>
  );
}

function BlokForm({
  blok,
  onOpslaan,
  onKlaar,
}: {
  blok?: Blok;
  onOpslaan: (f: { naam: string; fase?: string; vanDag: number; totDag: number; actief: boolean }) => Promise<void>;
  onKlaar: () => void;
}) {
  const [naam, setNaam] = useState(blok?.naam ?? "");
  const [fase, setFase] = useState(blok?.fase ?? "");
  const [vanDag, setVanDag] = useState(blok?.vanDag ?? 1);
  const [totDag, setTotDag] = useState(blok?.totDag ?? 30);
  const [actief, setActief] = useState(blok?.actief ?? true);
  const [bezig, setBezig] = useState(false);

  const opslaan = async () => {
    setBezig(true);
    try {
      await onOpslaan({ naam, fase: fase || undefined, vanDag, totDag, actief });
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-white border border-primary-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-gray-600">Naam van het blok</span>
          <input
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bijv. De nachten"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Fase</span>
          <select
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {FASES.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Van dag</span>
            <input
              type="number"
              min={1}
              value={vanDag}
              onChange={(e) => setVanDag(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Tot dag</span>
            <input
              type="number"
              min={1}
              value={totDag}
              onChange={(e) => setTotDag(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={actief} onChange={(e) => setActief(e.target.checked)} />
        Blok actief
      </label>
      <div className="flex gap-2">
        <button
          onClick={opslaan}
          disabled={bezig}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {bezig ? "Opslaan…" : "Opslaan"}
        </button>
        <button onClick={onKlaar} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">
          Annuleren
        </button>
      </div>
    </div>
  );
}

function BlokKaart({ blok, isEerste, isLaatste }: { blok: Blok; isEerste: boolean; isLaatste: boolean }) {
  const blokBijwerken = useAdminMutation(api.evergreen.blokBijwerken);
  const blokVerwijderen = useAdminMutation(api.evergreen.blokVerwijderen);
  const blokVerplaatsen = useAdminMutation(api.evergreen.blokVerplaatsen);
  const mailToevoegen = useAdminMutation(api.evergreen.mailToevoegen);

  const [bewerk, setBewerk] = useState(false);
  const [open, setOpen] = useState(true);
  const [nieuweMail, setNieuweMail] = useState(false);

  const laatsteDag = blok.mails.length ? Math.max(...blok.mails.map((m) => m.dagOffset)) : blok.vanDag;

  if (bewerk) {
    return (
      <BlokForm
        blok={blok}
        onKlaar={() => setBewerk(false)}
        onOpslaan={async (f) => {
          await blokBijwerken({ id: blok._id, ...f });
          setBewerk(false);
        }}
      />
    );
  }

  return (
    <div className={`bg-white border rounded-xl ${blok.actief ? "border-gray-200" : "border-gray-200 opacity-60"}`}>
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => setOpen((v) => !v)} className="text-gray-400 hover:text-gray-700">
          {open ? "▾" : "▸"}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{blok.naam}</span>
            {!blok.actief && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">op pauze</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {blok.fase ? `${FASES.find((f) => f.code === blok.fase)?.label ?? blok.fase} · ` : ""}
            dag {blok.vanDag}-{blok.totDag} · {blok.mails.length} {blok.mails.length === 1 ? "mail" : "mails"}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => blokVerplaatsen({ id: blok._id, richting: "omhoog" })}
            disabled={isEerste}
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="Omhoog"
          >
            ↑
          </button>
          <button
            onClick={() => blokVerplaatsen({ id: blok._id, richting: "omlaag" })}
            disabled={isLaatste}
            className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="Omlaag"
          >
            ↓
          </button>
          <button onClick={() => setBewerk(true)} className="px-2 py-1 rounded hover:bg-gray-100 text-primary-700">
            Bewerk
          </button>
          <button
            onClick={() => {
              if (confirm(`Blok "${blok.naam}" en alle mails erin verwijderen?`)) {
                blokVerwijderen({ id: blok._id });
              }
            }}
            className="px-2 py-1 rounded hover:bg-red-50 text-red-500"
          >
            Verwijder
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-2">
          {blok.mails.length === 0 && (
            <p className="text-sm text-gray-400">Nog geen mails in dit blok.</p>
          )}
          {blok.mails.map((m) => (
            <MailRij key={m._id} mail={m} />
          ))}

          {nieuweMail ? (
            <MailForm
              standaardDag={laatsteDag + 7}
              onKlaar={() => setNieuweMail(false)}
              onOpslaan={async (f) => {
                await mailToevoegen({ blokId: blok._id, ...f });
                setNieuweMail(false);
              }}
            />
          ) : (
            <button
              onClick={() => setNieuweMail(true)}
              className="mt-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full"
            >
              + Mail toevoegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MailRij({ mail }: { mail: Mail }) {
  const mailBijwerken = useAdminMutation(api.evergreen.mailBijwerken);
  const mailVerwijderen = useAdminMutation(api.evergreen.mailVerwijderen);
  const stuurTest = useAdminAction(api.evergreen.stuurTestEvergreen);
  const [bewerk, setBewerk] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("annadelapierre@icloud.com");
  const [testNaam, setTestNaam] = useState("");
  const [testBezig, setTestBezig] = useState(false);
  const [testMelding, setTestMelding] = useState("");

  const testen = async () => {
    if (!testEmail.includes("@")) {
      setTestMelding("Vul een geldig testadres in.");
      return;
    }
    setTestBezig(true);
    setTestMelding("");
    try {
      await stuurTest({
        mailId: mail._id,
        email: testEmail.trim(),
        naam: testNaam.trim() || undefined,
        type: mail.verliesType || undefined,
      });
      setTestMelding(`Testmail verstuurd naar ${testEmail.trim()}.`);
    } catch (e: any) {
      setTestMelding(e?.message ?? "Testmail versturen mislukt.");
    } finally {
      setTestBezig(false);
    }
  };

  if (bewerk) {
    return (
      <MailForm
        mail={mail}
        onKlaar={() => setBewerk(false)}
        onOpslaan={async (f) => {
          await mailBijwerken({ id: mail._id, ...f });
          setBewerk(false);
        }}
      />
    );
  }

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="w-14 flex-shrink-0 text-sm font-semibold text-gray-900">Dag {mail.dagOffset}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate">{mail.subject || "(geen onderwerp)"}</p>
          <p className="text-xs text-gray-400">
            {typeLabel(mail.verliesType)}
            {!mail.actief ? " · op pauze" : ""}
          </p>
        </div>
        <button onClick={() => setTestOpen((v) => !v)} className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600">
          Test
        </button>
        <button onClick={() => setBewerk(true)} className="text-xs px-2 py-1 rounded hover:bg-gray-200 text-primary-700">
          Bewerk
        </button>
        <button
          onClick={() => {
            if (confirm("Deze mail verwijderen?")) mailVerwijderen({ id: mail._id });
          }}
          className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500"
        >
          Verwijder
        </button>
      </div>

      {testOpen && (
        <div className="border-t border-gray-100 px-3 py-2 space-y-2">
          <p className="text-xs text-gray-500">
            Stuur deze mail nu als test naar jezelf (de opgeslagen versie). De echte leads krijgen hem op
            dag {mail.dagOffset}.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="jouw@e-mail.nl" className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            <input value={testNaam} onChange={(e) => setTestNaam(e.target.value)} placeholder="Naam" className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            <button onClick={testen} disabled={testBezig} className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
              {testBezig ? "Versturen…" : "Stuur test"}
            </button>
          </div>
          {testMelding && <p className="text-xs text-gray-500">{testMelding}</p>}
        </div>
      )}
    </div>
  );
}

function MailForm({
  mail,
  standaardDag,
  onOpslaan,
  onKlaar,
}: {
  mail?: Mail;
  standaardDag?: number;
  onOpslaan: (f: {
    dagOffset: number;
    subject: string;
    bodyText: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imageCaption?: string;
    verliesType?: string;
    actief: boolean;
  }) => Promise<void>;
  onKlaar: () => void;
}) {
  const generateUploadUrl = useAdminMutation(api.pageContent.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pageContent.getImageUrl);

  const [dagOffset, setDagOffset] = useState(mail?.dagOffset ?? standaardDag ?? 1);
  const [subject, setSubject] = useState(mail?.subject ?? "");
  const [bodyText, setBodyText] = useState(mail?.bodyText ?? "");
  const [buttonText, setButtonText] = useState(mail?.buttonText ?? "");
  const [buttonUrl, setButtonUrl] = useState(mail?.buttonUrl ?? "");
  const [imageUrl, setImageUrl] = useState(mail?.imageUrl ?? "");
  const [imageCaption, setImageCaption] = useState(mail?.imageCaption ?? "");
  const [verliesType, setVerliesType] = useState(mail?.verliesType ?? "");
  const [actief, setActief] = useState(mail?.actief ?? true);
  const [bezig, setBezig] = useState(false);
  const [uploaden, setUploaden] = useState(false);

  const upload = async (file: File) => {
    setUploaden(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      const publiek = await getImageUrl({ storageId });
      if (publiek) setImageUrl(publiek);
    } finally {
      setUploaden(false);
    }
  };

  const opslaan = async () => {
    setBezig(true);
    try {
      await onOpslaan({
        dagOffset,
        subject,
        bodyText,
        buttonText,
        buttonUrl,
        imageUrl,
        imageCaption,
        verliesType: verliesType || undefined,
        actief,
      });
    } finally {
      setBezig(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="rounded-lg border border-primary-200 bg-white p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Dag na instroom</span>
          <input type="number" min={1} value={dagOffset} onChange={(e) => setDagOffset(Number(e.target.value))} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Voor welk verliestype</span>
          <select value={verliesType} onChange={(e) => setVerliesType(e.target.value)} className={inputCls}>
            {TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-gray-600">Onderwerp</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-gray-600">Tekst</span>
        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={8} className={`${inputCls} font-mono`} />
        <span className="text-[11px] text-gray-400">
          Markers op een eigen regel: <code>[benji-blok]</code>, <code>[afbeelding]</code>, <code>[knop]</code>.
          <code>{"{voornaam}"}</code> wordt ingevuld. Een afsluitgroet krijgt de foto-handtekening; een
          P.S.-regel wordt als P.S. opgemaakt.
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Knoptekst (optioneel)</span>
          <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Knop-link (optioneel)</span>
          <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 p-3 space-y-2">
        <span className="text-xs font-semibold text-gray-600">Afbeelding (optioneel)</span>
        <div className="flex flex-wrap items-center gap-2">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… of upload" className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${uploaden ? "opacity-50 border-gray-200" : "border-primary-200 text-primary-700 hover:bg-primary-50"}`}>
            {uploaden ? "Uploaden…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" disabled={uploaden} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </label>
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl("")} className="text-xs text-gray-400 hover:text-red-500">Verwijderen</button>
          )}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-w-[160px] rounded-lg border border-gray-200" />
        )}
        <input value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="Bijschrift (optioneel)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={actief} onChange={(e) => setActief(e.target.checked)} />
        Mail actief (uit = wordt overgeslagen)
      </label>

      <div className="flex gap-2">
        <button onClick={opslaan} disabled={bezig} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {bezig ? "Opslaan…" : "Opslaan"}
        </button>
        <button onClick={onKlaar} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">
          Annuleren
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { HeaderBar } from "@/components/chat/HeaderBar";

// ─── Content ──────────────────────────────────────────────────────────────────

const MOMENTEN = [
  {
    id: "m1",
    nav: "1",
    titel: "Als je 's nachts wakker ligt",
    intro: [
      "Het is 3 uur. De rest van de wereld slaapt. Jij niet.",
      "De stilte voelt te groot. Je hoofd maakt overuren over dingen die je overdag probeert weg te duwen. Dit is niet gek. 's Nachts is er geen afleiding meer, dan komt het verdriet gewoon langs.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Leg je hand op je borst. Voel je hartslag. Zeg zachtjes, hardop of in gedachten: \"Ik ben hier. Dit mag er zijn.\"",
        "Niet om het weg te maken, maar om jezelf even gezelschap te houden.",
      ],
    },
    vraag: "Wat houdt je nu het meest bezig?",
    metFoto: false,
  },
  {
    id: "m2",
    nav: "2",
    titel: "Als je niet weet wat je voelt",
    intro: [
      "Verdoofd. Leeg. Of juist alles tegelijk, en je weet niet eens hoe je dat moet noemen.",
      "Verdriet ziet er niet altijd uit zoals in films. Soms is het een waas. Soms voel je gewoon niks. En dat voelt dan ook weer verkeerd. Maar verdoofdheid is ook een manier waarop je lichaam je beschermt. Het klopt.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Pak een vel papier en schrijf drie woorden op die ook maar een beetje in de buurt komen van wat je voelt.",
        "Geen zinnen. Geen uitleg. Gewoon drie woorden. Je hoeft het niet te begrijpen.",
      ],
    },
    vraag: "Als je gevoel vandaag een kleur had, welke zou dat zijn?",
    metFoto: false,
  },
  {
    id: "m3",
    nav: "3",
    titel: "Als iemand vraagt \"hoe gaat het\" en je het antwoord niet weet",
    intro: [
      "Je zegt \"gaat wel\" of \"beetje moe.\" En terwijl je het zegt, voel je hoe eenzaam dat is.",
      "Want het echte antwoord is te groot voor een praatje tussendoor. Dus je verpakt het. Elke dag weer. Dat kost meer energie dan mensen denken. Steeds doen alsof je er bent terwijl je er eigenlijk niet helemaal bent.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Je hoeft het niemand uit te leggen. Maar schrijf voor jezelf, nu, het antwoord op zoals je het écht zou willen geven.",
        "Niemand leest het. Het is alleen voor jou.",
      ],
    },
    vraag: "Aan wie zou je het echte antwoord wel durven geven?",
    metFoto: false,
  },
  {
    id: "m4",
    nav: "4",
    titel: "Als een foto, een geur of een liedje je overspoelt",
    intro: [
      "Zonder waarschuwing. Midden op de dag. En ineens ben je er helemaal in.",
      "Een nummer op de radio. De geur van een jas. Een foto die je niet zocht maar toch tegenkwam. Het overspoelt je en je weet even niet meer waar je bent.",
      "Dit zijn geen zwakke momenten. Dit zijn momenten waarop je liefde voelt. Rouw en liefde zijn hetzelfde.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Laat het even komen. Zet geen wekker, leg je telefoon weg, en geef het twee minuten.",
        "Huil als het komt. Adem als het zakt. Je hoeft het niet weg te duwen.",
      ],
    },
    vraag: "Waar denk je aan als dit gebeurt?",
    metFoto: true,
  },
  {
    id: "m5",
    nav: "5",
    titel: "Als je je schuldig voelt dat je even gelachen hebt",
    intro: [
      "Even niet aan het verdriet gedacht. En dan meteen dat steekje: hoe kan ik lachen terwijl...",
      "Dit is een van de zwaarste dingen aan verdriet, dat je je schuldig voelt over de momenten dat het even lichter is. Alsof lachen verraad is. Maar dat is het niet.",
      "Lachen betekent niet dat je het loslaat. Het betekent dat je nog leeft. En dat is precies wat degene van wie je houdt voor je zou willen.",
    ],
    oefening: {
      titel: "Wat je nu kunt doen",
      tekst: [
        "Schrijf één herinnering op die je blij maakt. Niet om het verdriet te vergeten, maar om het naast elkaar te laten bestaan.",
        "Blij en verdrietig tegelijk. Dat mag.",
      ],
    },
    vraag: "Waar lachte jij om, en waarom voelt dat goed én moeilijk tegelijk?",
    metFoto: false,
  },
];

// ─── Download helper ──────────────────────────────────────────────────────────

function maakHtmlDownload(antwoorden: Record<string, string>, foto: string | null): string {
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const momentenHtml = MOMENTEN.map((m) => {
    const antwoord = antwoorden[m.id] || "";
    const fotoHtml = m.metFoto && foto
      ? `<div style="margin: 16px 0;"><img src="${foto}" alt="" style="max-width: 100%; border-radius: 10px;" /></div>`
      : "";
    return `
      <div class="moment">
        <div class="moment-titel">${m.titel}</div>
        <div class="vraag">${m.vraag}</div>
        ${fotoHtml}
        <div class="antwoord">${antwoord ? antwoord.replace(/\n/g, "<br>") : "<em style='color:#b0a8a0;'>Geen antwoord ingevuld.</em>"}</div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Houvast — mijn woorden</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 48px 24px; background: #fdf9f4; color: #3d3530; }
    h1 { font-size: 32px; font-weight: 600; margin-bottom: 6px; }
    .datum { color: #8a8078; font-size: 14px; margin-bottom: 48px; }
    .moment { margin-bottom: 44px; border-top: 1px solid #e8e0d8; padding-top: 28px; }
    .moment-titel { font-size: 17px; font-weight: 600; margin-bottom: 8px; color: #3d3530; }
    .vraag { color: #6b6460; font-size: 14px; margin-bottom: 14px; font-style: italic; }
    .antwoord { font-size: 16px; line-height: 1.9; color: #3d3530; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e8e0d8; color: #a09890; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Houvast</h1>
  <div class="datum">Opgeslagen op ${datum}</div>
  ${momentenHtml}
  <div class="footer">Gemaakt met Talk To Benji · talktobenji.com</div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HouvasteGidsPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const profiel = useQuery(api.houvast.getByToken, { token });
  const [stap, setStap] = useState(0);
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({});
  const [foto, setFoto] = useState<string | null>(null);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [luistert, setLuistert] = useState<string | null>(null);
  const herkenningRef = useRef<any>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [wachtwoord, setWachtwoord] = useState("");
  const [aanmeldStatus, setAanmeldStatus] = useState<"idle" | "loading" | "success" | "bestaand" | "error">("idle");
  const [heeftSpeechSupport, setHeeftSpeechSupport] = useState(false);
  useEffect(() => {
    setHeeftSpeechSupport(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);

  // Laad opgeslagen antwoorden uit localStorage
  useEffect(() => {
    if (!token) return;
    const opgeslagenAntwoorden = localStorage.getItem(`houvast-${token}-antwoorden`);
    const opgeslagenFoto = localStorage.getItem(`houvast-${token}-foto`);
    const isOpgeslagen = localStorage.getItem(`houvast-${token}-opgeslagen`);
    if (opgeslagenAntwoorden) setAntwoorden(JSON.parse(opgeslagenAntwoorden));
    if (opgeslagenFoto) setFoto(opgeslagenFoto);
    if (isOpgeslagen === "1") setOpgeslagen(true);
  }, [token]);

  // Sla automatisch op bij elke wijziging
  useEffect(() => {
    if (!token || opgeslagen) return;
    localStorage.setItem(`houvast-${token}-antwoorden`, JSON.stringify(antwoorden));
  }, [antwoorden, token, opgeslagen]);

  useEffect(() => {
    if (!token || opgeslagen || !foto) return;
    localStorage.setItem(`houvast-${token}-foto`, foto);
  }, [foto, token, opgeslagen]);

  const setAntwoord = (id: string, waarde: string) => {
    if (opgeslagen) return;
    setAntwoorden((prev) => ({ ...prev, [id]: waarde }));
  };

  const toggleOpname = (momentId: string) => {
    if (luistert === momentId) {
      if (herkenningRef.current) {
        herkenningRef.current.onend = null;
        herkenningRef.current.onerror = null;
        try { herkenningRef.current.stop(); } catch {}
      }
      setLuistert(null);
      return;
    }
    // Stop en neutraliseer bestaande instantie zodat zijn onend de nieuwe state niet reset
    if (herkenningRef.current) {
      herkenningRef.current.onend = null;
      herkenningRef.current.onerror = null;
      try { herkenningRef.current.stop(); } catch {}
      herkenningRef.current = null;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const herkenning = new SR();
    herkenning.lang = "nl-NL";
    herkenning.continuous = true;
    herkenning.interimResults = false;
    herkenning.onresult = (e: any) => {
      const tekst = Array.from(e.results as SpeechRecognitionResultList)
        .slice(e.resultIndex)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ");
      setAntwoorden((prev) => ({ ...prev, [momentId]: (prev[momentId] || "") + (prev[momentId] ? " " : "") + tekst }));
    };
    // Alleen state resetten als dit nog de actieve instantie is
    herkenning.onend = () => {
      if (herkenningRef.current === herkenning) setLuistert(null);
    };
    herkenning.onerror = () => {
      if (herkenningRef.current === herkenning) setLuistert(null);
    };
    herkenningRef.current = herkenning;
    try {
      herkenning.start();
      setLuistert(momentId);
    } catch {
      setLuistert(null);
    }
  };

  const registreer = async () => {
    if (!profiel?.email || wachtwoord.length < 8) return;
    setAanmeldStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profiel.email, password: wachtwoord, name: "" }),
      });
      const data = await res.json();
      if (res.status === 409 || data?.error?.toLowerCase().includes("bestaat")) {
        setAanmeldStatus("bestaand");
      } else if (!res.ok) {
        setAanmeldStatus("error");
      } else {
        setAanmeldStatus("success");
      }
    } catch {
      setAanmeldStatus("error");
    }
  };

  const verwerkFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bestand = e.target.files?.[0];
    if (!bestand) return;
    const lezer = new FileReader();
    lezer.onload = (ev) => setFoto(ev.target?.result as string);
    lezer.readAsDataURL(bestand);
  };

  const download = () => {
    const html = maakHtmlDownload(antwoorden, foto);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "houvast-mijn-woorden.html";
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(`houvast-${token}-opgeslagen`, "1");
    setOpgeslagen(true);
  };

  // Secties: welkom + 5 momenten + bewaar + en nu
  const ALLE_STAPPEN = ["welkom", ...MOMENTEN.map((m) => m.id), "bewaar", "enu"];
  const huidigStap = ALLE_STAPPEN[stap];
  const isEerste = stap === 0;
  const isLaatste = stap === ALLE_STAPPEN.length - 1;
  const huidigMoment = MOMENTEN.find((m) => m.id === huidigStap);


  // ─── Loading ───────────────────────────────────────────────────────────────

  if (profiel === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
        </div>
      </div>
    );
  }

  // ─── Geen toegang ──────────────────────────────────────────────────────────

  if (!profiel) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
          <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <HeaderBar />
          <div className="flex items-center justify-center px-5 pt-16 pb-20">
            <div className="w-full max-w-sm text-center">
              <p className="text-base font-medium mb-3" style={{ color: "#3d3530" }}>
                Deze link is niet meer geldig.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b6460" }}>
                Vul je e-mailadres opnieuw in en we sturen je een nieuwe link.
              </p>
              <Link
                href="/houvast"
                className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm"
                style={{ background: "#6d84a8" }}
              >
                Stuur mij de link opnieuw
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <HeaderBar />

        {/* Navigatie */}
        <nav className="px-5 pt-4 pb-2">
          <div className="max-w-md mx-auto flex items-center justify-center gap-1.5 flex-wrap">
            {[
              { id: "welkom", label: "Welkom" },
              ...MOMENTEN.map((m) => ({ id: m.id, label: m.nav })),
              { id: "bewaar", label: "Bewaar" },
              { id: "enu", label: "En nu?" },
            ].map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStap(i)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: s.id === huidigStap ? "#6d84a8" : "rgba(255,255,255,0.70)",
                  color: s.id === huidigStap ? "#fff" : "#8a8078",
                  boxShadow: s.id === huidigStap ? "0 2px 8px rgba(109,132,168,0.25)" : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 flex items-start justify-center px-5 py-6">
          <div className="w-full max-w-md">

            {/* ── Welkom ── */}
            {huidigStap === "welkom" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-4"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>Welkom</h2>
                {[
                  "Je bent hier omdat je iets draagt wat zwaar is.",
                  "Misschien weet je precies wat het is. Misschien ook niet. Misschien is het verdriet om iemand die er niet meer is, om iets wat anders liep dan je had gehoopt, om een leven dat er nu anders uitziet dan je had verwacht.",
                  "Het maakt niet uit hoe je het noemt. Het telt.",
                  "Houvast is er niet om je verdriet op te lossen. Dat kan niemand. Maar voor elk moment dat het extra zwaar voelt, vind je hier iets wat je nu meteen kunt doen. Klein. Eerlijk. Zonder dat je er iets voor hoeft te weten of te begrijpen.",
                  "Je hoeft dit niet alleen te dragen.",
                ].map((alinea, i) => (
                  <p key={i} className="text-sm sm:text-base leading-relaxed" style={{ color: i === 4 ? "#3d3530" : "#6b6460", fontWeight: i === 4 ? 500 : 400 }}>
                    {alinea}
                  </p>
                ))}
              </div>
            )}

            {/* ── Moment ── */}
            {huidigMoment && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#8a8078", letterSpacing: "0.13em" }}>
                  Moment {huidigMoment.nav}
                </p>

                <h2
                  className="text-xl sm:text-2xl font-semibold leading-snug"
                  style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}
                >
                  {huidigMoment.titel}
                </h2>

                <div className="space-y-3">
                  {huidigMoment.intro.map((alinea, i) => (
                    <p key={i} className="text-sm sm:text-base leading-relaxed" style={{ color: "#6b6460" }}>
                      {alinea}
                    </p>
                  ))}
                </div>

                <div
                  className="rounded-xl px-5 py-4 space-y-2"
                  style={{ background: "rgba(109,132,168,0.08)", borderLeft: "3px solid #6d84a8" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6d84a8" }}>
                    {huidigMoment.oefening.titel}
                  </p>
                  {huidigMoment.oefening.tekst.map((t, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>{t}</p>
                  ))}
                </div>

                {/* Schrijfvak */}
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: "#3d3530" }}>
                    {huidigMoment.vraag}
                  </p>
                  <textarea
                    rows={4}
                    placeholder="Schrijf hier wat er in je opkomt..."
                    value={antwoorden[huidigMoment.id] || ""}
                    onChange={(e) => setAntwoord(huidigMoment.id, e.target.value)}
                    disabled={opgeslagen}
                    className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed outline-none resize-none disabled:opacity-60"
                    style={{
                      background: "rgba(255,255,255,0.90)",
                      border: "1px solid rgba(0,0,0,0.09)",
                      color: "#3d3530",
                    }}
                  />
                  {!opgeslagen && heeftSpeechSupport && (
                    <button
                      type="button"
                      onClick={() => toggleOpname(huidigMoment.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: luistert === huidigMoment.id ? "rgba(220,53,69,0.10)" : "rgba(109,132,168,0.10)",
                        color: luistert === huidigMoment.id ? "#dc3545" : "#6d84a8",
                      }}
                    >
                      <span>{luistert === huidigMoment.id ? "◼" : "🎙"}</span>
                      {luistert === huidigMoment.id ? "Stop met opnemen" : "Inspreken"}
                    </button>
                  )}
                </div>

                {/* Foto upload (alleen moment 4) */}
                {huidigMoment.metFoto && !opgeslagen && (
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: "#8a8078" }}>
                      Voeg een foto toe als je wil — iets wat bij dit moment past.
                    </p>
                    {foto && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto} alt="" className="w-full rounded-xl" />
                        <button
                          onClick={() => setFoto(null)}
                          className="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg"
                          style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
                        >
                          Verwijderen
                        </button>
                      </div>
                    )}
                    {!foto && (
                      <>
                        <input
                          ref={fotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={verwerkFoto}
                        />
                        <button
                          onClick={() => fotoInputRef.current?.click()}
                          className="text-xs font-medium px-3 py-2 rounded-xl"
                          style={{ background: "rgba(109,132,168,0.10)", color: "#6d84a8" }}
                        >
                          + Foto toevoegen
                        </button>
                      </>
                    )}
                  </div>
                )}
                {huidigMoment.metFoto && opgeslagen && foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="" className="w-full rounded-xl" />
                )}
              </div>
            )}

            {/* ── Bewaar ── */}
            {huidigStap === "bewaar" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
                  {opgeslagen ? "Opgeslagen" : "Je woorden bewaren"}
                </h2>

                {opgeslagen ? (
                  <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    Je hebt alles opgeslagen. Wat je hier hebt geschreven is van jou, voor altijd.
                  </p>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Als je klaar bent, kun je alles opslaan als een bestand op je telefoon of computer. Je kunt het altijd terugvinden.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Let op: als je eenmaal hebt opgeslagen, kun je de antwoorden hier niet meer wijzigen.
                    </p>

                    {/* Overzicht ingevulde antwoorden */}
                    <div className="space-y-3 pt-1">
                      {MOMENTEN.map((m) => (
                        <div key={m.id} className="rounded-xl px-4 py-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                          <p className="text-xs font-medium mb-1" style={{ color: "#8a8078" }}>Moment {m.nav}</p>
                          <p className="text-xs" style={{ color: "#6b6460" }}>
                            {antwoorden[m.id]
                              ? antwoorden[m.id].slice(0, 80) + (antwoorden[m.id].length > 80 ? "…" : "")
                              : <em>Niet ingevuld</em>}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={download}
                      className="w-full py-3.5 rounded-2xl font-medium text-white text-sm"
                      style={{ background: "#6d84a8" }}
                    >
                      Opslaan en downloaden
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── En nu? ── */}
            {huidigStap === "enu" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>En nu?</h2>

                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  'Houvast' is er voor de eerste stap. Voor de langere weg is Benji er.
                </p>

                <div className="space-y-3">
                  {[
                    { label: "Reflecties", tekst: "Dagelijkse vragen die je helpen stilstaan bij wat je voelt, zonder dat je weet wat je moet zeggen." },
                    { label: "Check-ins", tekst: "Korte momenten om bij jezelf te landen. Hoe gaat het écht, op dit moment?" },
                    { label: "Handreikingen", tekst: "Kleine oefeningen voor zware momenten, afgestemd op waar jij nu bent." },
                    { label: "Memories", tekst: "Een plek om herinneringen te bewaren, aan wie of wat je mist. Zodat het niet vergeten wordt." },
                    { label: "Praten met Benji", tekst: "Soms wil je het gewoon kwijt. Benji luistert, stelt een vraag, laat je niet alleen met je gedachten." },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl px-4 py-4" style={{ background: "rgba(109,132,168,0.07)" }}>
                      <p className="text-sm font-semibold mb-1" style={{ color: "#3d3530" }}>{item.label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{item.tekst}</p>
                    </div>
                  ))}
                </div>

                {/* Aanmeldformulier */}
                {aanmeldStatus === "success" ? (
                  <div className="rounded-xl px-5 py-5 text-center space-y-2" style={{ background: "rgba(109,132,168,0.08)" }}>
                    <p className="text-sm font-medium" style={{ color: "#3d3530" }}>Account aangemaakt.</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Je hebt 7 dagen gratis toegang tot alles. Log in om te beginnen.
                    </p>
                    <Link
                      href={`/inloggen?email=${encodeURIComponent(profiel?.email ?? "")}&registered=1`}
                      className="inline-block mt-2 w-full py-3 rounded-2xl font-medium text-white text-sm"
                      style={{ background: "#6d84a8" }}
                    >
                      Inloggen bij Benji
                    </Link>
                  </div>
                ) : aanmeldStatus === "bestaand" ? (
                  <div className="rounded-xl px-5 py-5 space-y-3" style={{ background: "rgba(109,132,168,0.08)" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Je hebt al een account met dit e-mailadres. Log direct in.
                    </p>
                    <Link
                      href={`/inloggen?email=${encodeURIComponent(profiel?.email ?? "")}`}
                      className="block w-full text-center py-3 rounded-2xl font-medium text-white text-sm"
                      style={{ background: "#6d84a8" }}
                    >
                      Inloggen bij Benji
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <p className="text-sm font-medium" style={{ color: "#3d3530" }}>
                      Start 7 dagen gratis
                    </p>
                    <input
                      type="email"
                      readOnly
                      value={profiel?.email ?? ""}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none opacity-60"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#3d3530" }}
                    />
                    <input
                      type="password"
                      placeholder="Kies een wachtwoord (min. 8 tekens)"
                      value={wachtwoord}
                      onChange={(e) => setWachtwoord(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.08)", color: "#3d3530" }}
                    />
                    {aanmeldStatus === "error" && (
                      <p className="text-xs" style={{ color: "#c0392b" }}>Er ging iets mis. Probeer het opnieuw.</p>
                    )}
                    <button
                      onClick={registreer}
                      disabled={aanmeldStatus === "loading" || wachtwoord.length < 8}
                      className="w-full py-3.5 rounded-2xl font-medium text-white text-sm disabled:opacity-50"
                      style={{ background: "#6d84a8" }}
                    >
                      {aanmeldStatus === "loading" ? "Bezig…" : "Maak mijn account aan"}
                    </button>
                    <p className="text-xs text-center" style={{ color: "#a09890" }}>
                      7 dagen gratis, daarna kun je kiezen of je verder wilt.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Vorige / Volgende */}
            <div className="flex justify-between items-center mt-5 px-1">
              <button
                onClick={() => setStap((s) => s - 1)}
                disabled={isEerste}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-0"
                style={{ color: "#6d84a8", background: "rgba(255,255,255,0.70)" }}
              >
                ← Vorige
              </button>

              <p className="text-xs" style={{ color: "#a09890" }}>
                {stap + 1} / {ALLE_STAPPEN.length}
              </p>

              <button
                onClick={() => setStap((s) => s + 1)}
                disabled={isLaatste}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-0"
                style={{ color: "#6d84a8", background: "rgba(255,255,255,0.70)" }}
              >
                Volgende →
              </button>
            </div>

          </div>
        </main>

        <footer className="px-5 py-8 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="max-w-lg mx-auto space-y-2">
            <p className="text-xs" style={{ color: "#6b6460" }}>
              Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
            <p className="text-xs" style={{ color: "#a09890" }}>
              © Talk To Benji — talktobenji.com
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

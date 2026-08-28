"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, Mic, Square, Gem, ThumbsDown, ThumbsUp, Check } from "lucide-react";
import { WelcomeScreen, WelcomeScreenInfoIcons } from "@/components/chat/WelcomeScreen";
import { FeedbackModal } from "@/components/chat/FeedbackModal";
import { HeaderBar } from "@/components/chat/HeaderBar";
import type { TopicId } from "@/components/chat/TopicButtons";
import { hexToDarker } from "@/lib/utils";
import { bepaalBron } from "@/lib/leadBron";
import { ConversationLimitGate } from "@/components/ConversationLimitGate";
import { SiteFooter } from "@/components/SiteFooter";

export type SearchParamsProp = { topic?: string | string[]; testError?: string | string[]; welcome?: string | string[]; start?: string | string[]; t?: string | string[]; vn?: string | string[]; stijl?: string | string[] };

/** Rendert chatbericht met klikbare markdown-links [tekst](url) */
// Rendert links ([tekst](url)) binnen een stuk platte tekst.
function renderTextWithLinks(text: string, isUser: boolean, keyPrefix: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const href = match[2];
    const isSafe = href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
    if (!isSafe) { lastIndex = match.index + match[0].length; continue; }
    parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a
        key={`${keyPrefix}-${match.index}`}
        href={href}
        className={isUser ? "underline underline-offset-2 opacity-90" : "text-primary-600 hover:text-primary-700 underline underline-offset-2 font-medium"}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  parts.push(text.slice(lastIndex));
  return parts;
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Briefzin-quote: Benji zet een concept-zin voor de brief tussen [[q]]...[[/q]].
  // Die tonen we als apart quote-blok, niet verweven in de gewone tekst.
  const quoteRegex = /\[\[q\]\]([\s\S]*?)\[\[\/q\]\]/g;
  if (quoteRegex.test(content)) {
    quoteRegex.lastIndex = 0;
    const blocks: React.ReactNode[] = [];
    let last = 0;
    let m;
    let i = 0;
    while ((m = quoteRegex.exec(content)) !== null) {
      const before = content.slice(last, m.index).trim();
      if (before) blocks.push(<p key={`t${i}`} className="text-sm sm:text-base break-words">{renderTextWithLinks(before, isUser, `b${i}`)}</p>);
      const quote = m[1].trim();
      if (quote) blocks.push(
        <blockquote key={`q${i}`} className="my-2 border-l-4 border-primary-300 pl-3 py-1 italic text-sm sm:text-base text-primary-800">
          {quote}
        </blockquote>
      );
      last = m.index + m[0].length;
      i++;
    }
    const after = content.slice(last).trim();
    if (after) blocks.push(<p key={`t${i}`} className="text-sm sm:text-base break-words">{renderTextWithLinks(after, isUser, `b${i}`)}</p>);
    return <div className="space-y-1">{blocks}</div>;
  }
  return <p className="text-sm sm:text-base break-words">{renderTextWithLinks(content, isUser, "l")}</p>;
}

/** Introkaartje van de geleide momenten: korte uitleg wat de lead kan verwachten. */
const MOMENT_INTRO: Record<string, { titel: string; body: string[]; brief: string }> = {
  scheiding: {
    titel: "Wat goed dat je hier bent",
    body: [
      "Er is een relatie geëindigd. Je rouwt om iemand die nog leeft, en dat doet evenveel pijn.",
      "Er is geen afscheid voor dit verdriet, maar het is er. In de momenten die je met me deelt, krijg je de ruimte om het een plek te geven.",
    ],
    brief: "Aan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
  },
};

function MomentIntroKaart({ type }: { type: string }) {
  const k = MOMENT_INTRO[type] ?? MOMENT_INTRO.scheiding;
  return (
    <div className="w-full max-w-sm bg-white/90 border border-gray-200 rounded-2xl shadow-sm px-5 py-5">
      <h3 className="text-lg font-bold text-primary-900 mb-3 text-balance">{k.titel}</h3>
      <div className="space-y-2.5">
        {k.body.map((p, i) => (
          <p key={i} className={i === 0 ? "text-sm text-primary-800 leading-relaxed" : "text-sm text-primary-600 leading-relaxed"}>{p}</p>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "#576b8f" }}>{k.brief}</p>
    </div>
  );
}

// Kaartjes-flow (test via ?stijl=kaartjes): een welkomstkaartje (wie is Benji + brief)
// en vijf lichtblauwe "opdracht"-kaartjes. De lichtblauwe kleur maakt duidelijk dat dit
// de opdracht is en niet Benji zelf. De bezoeker antwoordt in de chat.
const MOMENT_KAARTJES: Record<
  string,
  { welkom: { titel: string; body: string[]; brief: string }; momenten: { titel: string; erkenning: string[]; vraag: string }[] }
> = {
  scheiding: {
    welkom: {
      titel: "Ik ben Benji",
      body: [
        "We gaan vijf momenten langs. Situaties die vaak terugkomen als een relatie voorbij is: 's nachts wakker liggen, een liedje dat je overvalt, “gaat wel” zeggen terwijl het niet zo is.",
        "Bij elk moment stel ik je één vraag. Eén zin is genoeg, meer mag ook. Er is geen fout antwoord.",
        "Aan het eind maak ik van wat je schreef een brief. Je eigen woorden, één keer achter elkaar, voluit.",
      ],
      brief: "Zullen we beginnen?",
    },
    momenten: [
      {
        titel: "Als je niet weet wat je voelt",
        erkenning: [
          "“Ik mis hem en ik ben blij dat het voorbij is.” Beide waar. Tegelijk.",
          "Bij het einde van een relatie lopen gevoelens door elkaar heen. Dat maakt je niet verward of ondankbaar, het laat zien hoeveel er speelde. De meeste mensen kiezen dan één van de twee, meestal de nette. En de andere gaat mee naar bed.",
        ],
        vraag: "Noem twee gevoelens die op dit moment allebei waar zijn. Ze mogen elkaar tegenspreken. Welke van de twee mag er van jezelf eigenlijk niet zijn?",
      },
      {
        titel: "Als een plek of een liedje je overspoelt",
        erkenning: [
          "Een café waar jullie kwamen. Een nummer dat van jullie was. Een foto die ineens voorbijkomt. Het vraagt niet of het gelegen komt: je staat in de rij bij de supermarkt en drie seconden later ben je twee jaar terug.",
          "Dat is geen terugval. Zo werkt herinnering, die zit in plekken en geluiden, niet in een agenda. En het geeft aan waar iets van jullie nog ligt.",
        ],
        vraag: "Beschrijf één plek, liedje of gewoonte die je terugbrengt. Waar was je, wat gebeurde er precies, en wil je die plek terug of wil je hem kwijt?",
      },
      {
        titel: "Als je 's nachts wakker ligt met ‘had ik maar’",
        erkenning: [
          "Wat als. Waarom. Had ik maar iets gezegd. Je grijpt naar je telefoon, maar het is te laat om te bellen.",
          "Je rouwt om iemand die er nog is, dat is de moeilijkste soort, want de deur is dicht maar niet op slot. Vaak zit daar één zin onder. Iets wat je nooit hebt gezegd, of wat je juist te vaak zei zonder dat het aankwam.",
        ],
        vraag: "Wat heb je nooit gezegd? Schrijf het op zoals je het zou zeggen als je wist dat het geen gevolgen had.",
      },
      {
        titel: "Als je je schuldig voelt over een goed moment",
        erkenning: [
          "Een avond gelachen, je even vrij gevoeld. En dan de twijfel: mag dat al?",
          "Dat het even lichter was, zegt niets over hoeveel het telde. Verdriet is geen bewijs dat je moet blijven leveren. Maar die twijfel zegt wél iets, meestal over wat je denkt te moeten laten zien aan de mensen om je heen.",
        ],
        vraag: "Wanneer voelde je je voor het laatst even vrij? Waar was je, met wie, en wat dacht je toen?",
      },
      {
        titel: "Als iemand vraagt hoe het gaat",
        erkenning: [
          "“Gaat wel.” En dan gaat het gesprek verder.",
          "Er is geen begrafenis, geen kaart, geen erkend moment, en toch ben je iemand kwijt. Dat uitleggen in een praatje tussendoor lukt niet, dus verpak je het maar. Steeds korter, tot je het zelf bijna gelooft. Ergens moet het één keer voluit gezegd kunnen worden.",
        ],
        vraag: "Maak de zin af zoals je hem nooit hardop zegt: “Wat ik eigenlijk kwijt ben, is…”",
      },
    ],
  },
};

/** Welkomstkaartje van de kaartjes-flow: wie is Benji + de brief-belofte. */
function MomentWelkomKaart({ type }: { type: string }) {
  const k = (MOMENT_KAARTJES[type] ?? MOMENT_KAARTJES.scheiding).welkom;
  return (
    <div className="w-full max-w-sm bg-white/90 border border-gray-200 rounded-2xl shadow-sm px-5 py-5">
      <h3 className="text-lg font-bold text-primary-900 mb-3 text-balance">{k.titel}</h3>
      <div className="space-y-2.5">
        {k.body.map((p, i) => (
          <p key={i} className="text-sm text-primary-800 leading-relaxed">{p}</p>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "#576b8f" }}>{k.brief}</p>
    </div>
  );
}

/** Lichtblauw opdracht-kaartje (moment 1..5): titel + korte erkenning + één kleine vraag. */
function MomentOpdrachtKaart({ type, nummer }: { type: string; nummer: number }) {
  const lijst = (MOMENT_KAARTJES[type] ?? MOMENT_KAARTJES.scheiding).momenten;
  const m = lijst[nummer - 1];
  if (!m) return null;
  return (
    <div className="w-full max-w-sm rounded-2xl shadow-sm px-5 py-5" style={{ background: "#eef2fb", border: "1px solid #c7d4f0" }}>
      <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: "#576b8f" }}>Moment {nummer} van 5</p>
      <h3 className="text-base font-bold mb-2 text-balance" style={{ color: "#2f3b52" }}>{m.titel}</h3>
      <div className="space-y-2 mb-3">
        {m.erkenning.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: "#4a5772" }}>{p}</p>
        ))}
      </div>
      <p className="text-sm font-semibold leading-relaxed" style={{ color: "#2f3b52" }}>{m.vraag}</p>
    </div>
  );
}

/** Oefening-kaartje met de ademcirkel (grounding), 1x bij het nacht-moment. */
function MomentOefeningKaart() {
  return (
    <div className="w-full max-w-sm bg-white/90 border border-gray-200 rounded-2xl shadow-sm px-5 py-5">
      <p className="text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: "#576b8f" }}>Even ademen</p>
      <p className="text-sm text-primary-800 leading-relaxed mb-3">Leg je hand op je borst. Zeg zachtjes: &ldquo;Ik ben hier. Dit mag er zijn.&rdquo;</p>
      <style>{`@keyframes momenten-breathe { 0%,100%{transform:scale(1);opacity:.4;} 50%{transform:scale(1.5);opacity:.65;} }`}</style>
      <div className="flex justify-center py-3">
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "radial-gradient(circle, #c7d4f0 0%, #e2dbd4 100%)", animation: "momenten-breathe 6s ease-in-out infinite" }} />
      </div>
      <p className="text-xs text-center text-primary-400">Adem rustig mee, zo lang je wilt.</p>
    </div>
  );
}

/** E-mail-kaartje bij de afsluiting: bevestigend, vraagt alleen het adres. */
function MomentEmailKaart({ onDone }: { onDone: (email: string, naam: string) => Promise<void> }) {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const geldig = /\S+@\S+\.\S+/.test(email);
  return (
    <div className="w-full max-w-sm rounded-2xl shadow-sm px-5 py-5" style={{ background: "#eef2fb", border: "1px solid #c7d4f0" }}>
      {klaar ? (
        <>
          <h3 className="text-base font-bold text-primary-900 mb-1">Je brief is onderweg</h3>
          <p className="text-sm text-primary-700 leading-relaxed">Dank je. Je brief komt binnen een paar minuten in je mail. 💙</p>
        </>
      ) : (
        <>
        <h3 className="text-base font-bold text-primary-900 mb-3">Welk e-mailadres mag ik gebruiken?</h3>
        <div className="space-y-2">
          <input type="text" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Je voornaam (optioneel)" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jouw@email.nl" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <button type="button" disabled={!geldig || busy} onClick={async () => { setBusy(true); try { await onDone(email.trim(), naam.trim()); setKlaar(true); } finally { setBusy(false); } }} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#576b8f" }}>
            {busy ? "Versturen…" : "Stuur mij mijn brief"}
          </button>
          <p className="text-[11px] text-primary-400 text-center">Je woorden blijven van jou. We sturen alleen deze brief.</p>
        </div>
        </>
      )}
    </div>
  );
}

/** Herkent [HERINNERING: tekst | emotie: gevoel] markers in bot-berichten */
const MEMORY_REGEX = /\[HERINNERING:\s*(.+?)\s*\|\s*emotie:\s*(\w+)\]/;

function parseMemoryMarker(content: string): { cleanContent: string; memoryText?: string; emotion?: string } {
  const match = content.match(MEMORY_REGEX);
  if (!match) return { cleanContent: content };
  return {
    cleanContent: content.replace(MEMORY_REGEX, "").trim(),
    memoryText: match[1].trim(),
    emotion: match[2].trim(),
  };
}

function MemorySaveButton({ memoryText, emotion, userId, accent }: { memoryText: string; emotion: string; userId: string; accent: string }) {
  const addMemory = useMutation(api.memories.addMemory);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      await addMemory({
        userId,
        text: memoryText,
        emotion,
        source: "chat",
      });
      setSaved(true);
    } catch {
      // stil falen
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
        <Gem size={14} />
        <span>Bewaard in Memories</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:shadow-sm disabled:opacity-50"
      style={{ borderColor: accent, color: accent }}
    >
      <Gem size={14} />
      {saving ? "Opslaan..." : "Bewaar in Memories"}
    </button>
  );
}

const STORAGE_KEY = "benji_session_id";
const ORIGINAL_ACCENT = "#6d84a8";
const ACCENT_CACHE_KEY = "benji_accent_color";
const HAS_CHATTED_KEY = "benji_has_chatted";
const ANONYMOUS_ID_KEY = "benji_anonymous_id";

function getCachedAccent(): string {
  if (typeof window === "undefined") return ORIGINAL_ACCENT;
  try {
    return localStorage.getItem(ACCENT_CACHE_KEY) || ORIGINAL_ACCENT;
  } catch {
    return ORIGINAL_ACCENT;
  }
}

function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!id) {
      id = "anon_" + crypto.randomUUID();
      localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export type NachtConfig = {
  backgroundImageUrl?: string;
  introText?: string;
  question?: string;
  subText?: string;
  inputPlaceholder?: string;
  showWaaromButton?: boolean;
  buttons?: { id: string; label: string }[];
};

export default function ChatPageClient({
  searchParams = {},
  nachtConfig,
}: {
  searchParams?: SearchParamsProp;
  nachtConfig?: NachtConfig;
}) {
  const isNacht = !!nachtConfig;
  const router = useRouter();
  const { isLoading: convexAuthLoading } = useConvexAuth();
  const { data: session, status } = useSession();
  const topicParam = Array.isArray(searchParams?.topic) ? searchParams.topic[0] : searchParams?.topic;
  const welcomeParam = Array.isArray(searchParams?.welcome) ? searchParams.welcome[0] : searchParams?.welcome;
  const startParam = Array.isArray(searchParams?.start) ? searchParams.start[0] : searchParams?.start;
  // Geleide-momenten: verliestype (?t=) en stijl (?stijl=kaartjes voor de kaartjes-flow).
  const momentenTypeParam = (Array.isArray(searchParams?.t) ? searchParams.t[0] : searchParams?.t) || "scheiding";
  const momentenStijlParam = Array.isArray(searchParams?.stijl) ? searchParams.stijl[0] : searchParams?.stijl;
  // De kaartjes-flow is nu de STANDAARD voor de momenten-landingspagina. Met ?stijl=vrij
  // val je terug op de oude vrije chat (voor de zekerheid / vergelijken).
  const momentenKaartjes = momentenStijlParam !== "vrij";
  const [sessionIdState, setSessionIdState] = useState<Id<"chatSessions"> | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (stored as Id<"chatSessions">) : null;
    } catch {
      return null;
    }
  });
  const sessionId = sessionIdState;
  // Heeft deze bezoeker al eerder met Benji gepraat? Dan hoeft het uitlegkaartje
  // op het welkomstscherm niet meer. Lazy uit localStorage zodat er geen flits is.
  const [heeftGechat] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return !!localStorage.getItem(HAS_CHATTED_KEY); } catch { return false; }
  });
  const setSessionId = (id: Id<"chatSessions"> | null) => {
    setSessionIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };
  const [showTopicButtons, setShowTopicButtons] = useState(true);
  // Even Houvast-lead via ?start=eh: terwijl we serverside beslissen (directe
  // verliestype-opener of gewoon welkomstscherm) tonen we één schone spinner, zodat
  // er geen flikker is tussen chat- en keuzescherm.
  const [ehResolving, setEhResolving] = useState<boolean>(() => {
    const s = Array.isArray(searchParams?.start) ? searchParams.start[0] : searchParams?.start;
    return s === "eh" || s === "brief" || s === "ennu" || s === "direct" || s === "momenten";
  });
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageLimitType, setMessageLimitType] = useState<"guest" | "free" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingOpener, setIsAddingOpener] = useState(false);
  const lastMessageCountRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showMicHint, setShowMicHint] = useState(false);
  const micHintShownRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  // Spiegelt sessionId zodat effecten met lege deps de actuele waarde kennen.
  const hasConversationRef = useRef(false);
  const topicFromUrlHandled = useRef<string | null>(null);

  const messages = useQuery(
    api.chat.getMessages,
    sessionId && !convexAuthLoading ? { sessionId } : "skip"
  );

  // Anonieme sessie-teller (alleen voor niet-ingelogde gebruikers)
  const [anonymousId, setAnonymousId] = useState<string>("");
  const nudgeTimerFired = useRef(false);
  const [hideInitialNudge, setHideInitialNudge] = useState(false);
  useEffect(() => {
    if (!session?.userId) setAnonymousId(getOrCreateAnonymousId());
  }, [session?.userId]);
  const anonymousCount = useQuery(
    api.chat.countAnonymousSessions,
    !session?.userId && anonymousId ? { anonymousId } : "skip"
  ) ?? 0;

  const showNudgeBanner = !session?.userId && anonymousCount >= 3 && anonymousCount < 5;
  const [saveCardDismissed, setSaveCardDismissed] = useState(false);
  const isAnonymousUser = !session?.userId;
  const DEVICE_MEMORY_CARD_AFTER = 2; // toon device-memory info na 2e gebruikersbericht
  const SAVE_CARD_AFTER = 8;  // toon save-card na 8 gebruikersberichten
  const LIMIT_WARNING_AFTER = 13; // toon limiet-waarschuwing na 13 gebruikersberichten (limiet is 15)

  // Nieuw gratis-model (gebruik i.p.v. tijd). Alles hangt achter de env-flag; zolang
  // die uit staat is berichtenModelActief false en verandert er niets aan de UI.
  const berichtenConfig = useQuery(api.benjiLimiet.getConfig) as
    | { actief: boolean; limiet: number; zachtSeinVanaf: number }
    | undefined;
  const berichtenModelActief = berichtenConfig?.actief ?? false;
  // getConversationCount weet als enige of deze ingelogde gebruiker onder de teller
  // valt (isBerichtenModel) én of hij onbeperkt/betaald is (hasUnlimited). Zo raakt
  // een betaalde klant nooit de paywall, ook al heeft die >175 berichten.
  const convCount = useQuery(
    api.subscriptions.getConversationCount,
    berichtenModelActief && session?.userId
      ? { userId: session.userId, email: session.user?.email ?? undefined }
      : "skip"
  ) as { count: number; limit: number | null; hasUnlimited: boolean; isBerichtenModel?: boolean } | undefined;
  // Anonieme bezoeker (zonder account): zelfde tegoed van 5 gesprekken via anonymousId.
  const anonStatus = useQuery(
    api.benjiLimiet.getAnoniemBerichtenStatus,
    berichtenModelActief && !session?.userId && anonymousId ? { anonymousId } : "skip"
  ) as { actief: boolean; gebruikt: number; bereikt: boolean; zachtSein: boolean; volgendGesprekNummer: number; nieuwGesprekStart: boolean } | undefined;
  // Ingelogde bezoeker: apart status-query voor het gesprek-nummer (de zachte tekst).
  const berichtenStatus = useQuery(
    api.benjiLimiet.getBerichtenStatus,
    berichtenModelActief && session?.userId ? { userId: session.userId } : "skip"
  ) as { actief: boolean; gebruikt: number; bereikt: boolean; volgendGesprekNummer: number; nieuwGesprekStart: boolean } | undefined;

  const loggedInPaywallActief = !!(berichtenModelActief && convCount && convCount.isBerichtenModel && !convCount.hasUnlimited);
  const paywallBereikt = session?.userId
    ? !!(loggedInPaywallActief && convCount!.limit !== null && (convCount!.count ?? 0) >= convCount!.limit!)
    : !!anonStatus?.bereikt;
  // Zachte melding "dit is je vijfde gesprek": op basis van welk gesprek het VOLGENDE
  // bericht wordt, en alleen aan het begin van een nieuw gesprek (vóór je typt). Alleen
  // beleving; de grens blijft de berichtenteller.
  const nietBetaald = session?.userId ? loggedInPaywallActief : berichtenModelActief;
  const gesprekStatus = session?.userId ? berichtenStatus : anonStatus;
  const volgendGesprek = gesprekStatus?.volgendGesprekNummer ?? 1;
  const toonGesprekMelding = !!(nietBetaald && !paywallBereikt && gesprekStatus?.nieuwGesprekStart && (volgendGesprek === 4 || volgendGesprek === 5));

  // Account-nudge onder het logo: pas tonen na 4 eigen berichten, net nadat Benji
  // heeft geantwoord. Latcht dan aan en blijft staan; reset bij een nieuw gesprek.
  const [accountNudge, setAccountNudge] = useState(false);
  const accountNudgeSession = useRef<string | null>(null);
  useEffect(() => {
    if (sessionId !== accountNudgeSession.current) {
      accountNudgeSession.current = sessionId;
      setAccountNudge(false);
    }
    if (accountNudge || !isAnonymousUser || !sessionId) return;
    const totaalBerichten = messages?.length ?? 0;
    const laatste = messages && messages.length ? messages[messages.length - 1] : null;
    if (totaalBerichten >= 4 && laatste?.role === "bot" && !isLoading) setAccountNudge(true);
  }, [messages, sessionId, isAnonymousUser, isLoading, accountNudge]);

  // Leading indicator voor advertentie-rendement: meld eenmalig dat de paywall in
  // beeld kwam (de client blokkeert versturen, dus de server ziet het anders niet).
  // Alleen zinvol voor ingelogde bezoekers (die hebben een subscription-rij).
  const meldPaywallBereikt = useMutation(api.benjiLimiet.meldPaywallBereikt);
  const paywallGemeld = useRef(false);
  useEffect(() => {
    if (paywallBereikt && session?.userId && !paywallGemeld.current) {
      paywallGemeld.current = true;
      meldPaywallBereikt().catch(() => {});
    }
  }, [paywallBereikt, session?.userId, meldPaywallBereikt]);

  const preferencesData = useQuery(
    api.preferences.getPreferencesWithUrl,
    session?.userId ? { userId: session.userId } : "skip"
  );
  const [cachedAccent, setCachedAccent] = useState(getCachedAccent);
  const accent = preferencesData?.accentColor || cachedAccent;
  const accentHover = hexToDarker(accent, 12);
  const accentDark = hexToDarker(accent, 45);

  // Update localStorage cache wanneer preferences laden
  useEffect(() => {
    if (preferencesData?.accentColor) {
      try {
        localStorage.setItem(ACCENT_CACHE_KEY, preferencesData.accentColor);
        setCachedAccent(preferencesData.accentColor);
      } catch {}
    }
  }, [preferencesData?.accentColor]);
  const storedSession = useQuery(
    api.chat.getSession,
    sessionIdState && !convexAuthLoading ? { sessionId: sessionIdState } : "skip"
  );

  useEffect(() => {
    // Niet wissen terwijl Convex-auth nog laadt — dan lijkt een geldige sessie tijdelijk onbereikbaar
    if (convexAuthLoading) return;
    if (sessionIdState && storedSession === null) {
      setSessionIdState(null);
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    }
  }, [sessionIdState, storedSession, convexAuthLoading]);

  // Na registratie/inloggen (via "Bewaar je gesprek"): laad automatisch het laatste
  // gesprek terug, zodat de klant niet op het welkomstscherm belandt en het gesprek
  // via het menu moet opzoeken. Alleen in dit scenario (vlag in localStorage), zodat
  // "nieuw gesprek" onaangetast blijft.
  const [restoreAfterLogin] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("benji_restore_after_login") === "1"; } catch { return false; }
  });
  // Zolang het terugladen loopt: laadstand aan, zodat het welkomstscherm niet even
  // flitst voordat het gesprek er is.
  const [restoreBezig, setRestoreBezig] = useState<boolean>(restoreAfterLogin);
  const restoreSessions = useQuery(
    api.chat.getUserSessions,
    restoreAfterLogin && session?.userId ? { userId: session.userId, limit: 1 } : "skip"
  );
  const restoreDone = useRef(false);
  useEffect(() => {
    if (restoreDone.current) return;
    if (!restoreAfterLogin) { setRestoreBezig(false); return; }
    if (status === "unauthenticated") {
      // Niet ingelogd → niks te herstellen, vlag opruimen.
      restoreDone.current = true;
      try { localStorage.removeItem("benji_restore_after_login"); } catch {}
      setRestoreBezig(false);
      return;
    }
    if (!session?.userId) return;        // auth nog aan het laden
    if (restoreSessions === undefined) return; // sessies nog aan het laden
    restoreDone.current = true;
    try { localStorage.removeItem("benji_restore_after_login"); } catch {}
    if (restoreSessions.length > 0 && !sessionIdState) {
      setSessionId(restoreSessions[0]._id as Id<"chatSessions">);
    }
    setRestoreBezig(false);
  }, [restoreAfterLogin, status, session?.userId, restoreSessions, sessionIdState]);
  // Veiligheidsklep: nooit langer dan 5s in de laadstand.
  useEffect(() => {
    if (!restoreBezig) return;
    const t = setTimeout(() => setRestoreBezig(false), 5000);
    return () => clearTimeout(t);
  }, [restoreBezig]);

  // Toon mic-hint bij het starten van een nieuw gesprek (eenmalig per sessie)
  useEffect(() => {
    if (sessionIdState && speechSupported && !micHintShownRef.current) {
      micHintShownRef.current = true;
      setShowMicHint(true);
      const t = setTimeout(() => setShowMicHint(false), 6000);
      return () => clearTimeout(t);
    }
  }, [sessionIdState, speechSupported]);

  // Wis chat zodra gebruiker uitlogt (status "unauthenticated")
  useEffect(() => {
    if (status === "unauthenticated") {
      setSessionIdState(null);
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    }
  }, [status]);

  // Reset lastMessageCountRef bij sessiewissel – anders herkent useEffect het opener-bericht niet
  useEffect(() => {
    lastMessageCountRef.current = 0;
  }, [sessionId]);

  const startSession = useMutation(api.chat.startSession);
  const addOpenerToSession = useMutation(api.chat.addOpenerToSession);
  const saveMomentenEmail = useMutation(api.chat.saveMomentenEmail);
  const showMomentKaart = useMutation(api.chat.showMomentKaart);
  const startMomentenAfsluiting = useMutation(api.chat.startMomentenAfsluiting);
  const saveKaartAntwoord = useMutation(api.chat.saveKaartAntwoord);
  const addPersonalizedOpenerToSession = useMutation(api.chat.addPersonalizedOpenerToSession);
  const startEhChat = useMutation(api.chat.startEhChat);
  const linkSessionToUser = useMutation(api.chat.linkSessionToUser);
  const handleUserMessage = useAction(api.ai.handleUserMessage);
  const reageerOpMoment = useAction(api.ai.reageerOpMoment);
  const submitMessageFeedback = useMutation(api.chat.submitMessageFeedback);

  const welcomeFromAccountHandled = useRef(false);
  const ehStartHandled = useRef(false);

  // Even Houvast-lead via de mail-link (?start=eh): open direct de chat met de juiste
  // verliestype-opener, zonder het keuzescherm. Serverside wordt het verliestype + de
  // naam opgezocht; wie al eens gepraat heeft of geen EH-lead is, krijgt gewoon het
  // welkomstscherm (fallback).
  useEffect(() => {
    if ((startParam !== "eh" && startParam !== "brief" && startParam !== "ennu" && startParam !== "direct") || ehStartHandled.current) return;
    if (status === "loading") return; // wacht op auth; spinner blijft staan

    const schoonUrl = () => {
      if (typeof window !== "undefined") window.history.replaceState(null, "", "/benji");
    };

    const uid = session?.userId;
    if (!uid) {
      // Niet ingelogd: gewoon het welkomstscherm tonen, geen opener forceren.
      ehStartHandled.current = true;
      setEhResolving(false);
      schoonUrl();
      return;
    }

    ehStartHandled.current = true;
    (async () => {
      try {
        setSessionId(null);
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
        // Voorbeeldmodus (admin): ?start=brief&t=<type>&vn=<naam> toont de brief-opener
        // o.b.v. deze params i.p.v. echte lead-data, zodat de opener bekeken kan worden.
        const previewType = Array.isArray(searchParams?.t) ? searchParams.t[0] : searchParams?.t;
        const previewNaam = Array.isArray(searchParams?.vn) ? searchParams.vn[0] : searchParams?.vn;
        const res = await startEhChat({
          userId: uid,
          userEmail: session.user?.email ?? undefined,
          userName: session.user?.name ?? undefined,
          variant: startParam === "brief" ? "brief" : startParam === "ennu" ? "en-nu" : startParam === "direct" ? "direct" : undefined,
          previewType: startParam === "brief" ? previewType || undefined : undefined,
          previewNaam: startParam === "brief" ? previewNaam || undefined : undefined,
        });
        if (res && !res.fallback && res.sessionId) {
          // Eerste keer: direct de verliestype-chat openen.
          setShowTopicButtons(false);
          setSessionId(res.sessionId as Id<"chatSessions">);
          if (typeof window !== "undefined") {
            if (!sessionStorage.getItem("benji_start_chat_fired") && typeof (window as any).fbq === "function") {
              (window as any).fbq("trackCustom", "StartChat");
              sessionStorage.setItem("benji_start_chat_fired", "1");
            }
            localStorage.setItem(HAS_CHATTED_KEY, "1");
          }
          setEhResolving(false);
          schoonUrl();
        } else {
          // Terugkerend / heeft al een account: nooit het keuzescherm, maar door naar
          // het account-dashboard, waar ze een nieuw gesprek kunnen starten of hun
          // bestaande gesprek vervolgen (en de rest van hun plek zien). ehResolving
          // blijft aan zodat /benji leeg blijft tijdens de navigatie (geen flikker).
          router.replace("/account");
        }
      } catch (e) {
        console.error(e);
        // Ingelogd maar er ging iets mis: stuur ze alsnog naar hun account.
        router.replace("/account");
      }
    })();
  }, [startParam, status, session?.userId, session?.user?.email, session?.user?.name, startEhChat, router]);

  // Vanuit account: start direct een gesprek met Benji's eerste bericht (gepersonaliseerd met naam)
  useEffect(() => {
    const userName = session?.user?.name;
    if (welcomeParam !== "1" || !session?.userId || !userName || welcomeFromAccountHandled.current) return;
    welcomeFromAccountHandled.current = true;
    setShowTopicButtons(false);
    (async () => {
      try {
        setIsAddingOpener(true);
        setSessionId(null);
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
        const newSessionId = await startSession({
          userId: session.userId,
          userEmail: session.user?.email ?? undefined,
          userName,
        });
        await addPersonalizedOpenerToSession({
          sessionId: newSessionId,
          userName,
        });
        setSessionId(newSessionId);
        if (typeof window !== "undefined") {
          if (!sessionStorage.getItem("benji_start_chat_fired") && typeof (window as any).fbq === "function") {
            (window as any).fbq("trackCustom", "StartChat");
            sessionStorage.setItem("benji_start_chat_fired", "1");
          }
          localStorage.setItem(HAS_CHATTED_KEY, "1");
        }
      } catch (e) {
        console.error(e);
        welcomeFromAccountHandled.current = false;
        setChatError("Er ging iets mis. Probeer het opnieuw.");
      } finally {
        setIsAddingOpener(false);
      }
    })();
  }, [welcomeParam, session?.userId, session?.user?.name, session?.user?.email, startSession, addPersonalizedOpenerToSession]);

  // Geleide momenten via ?start=momenten (&t=scheiding): start anoniem een
  // momenten-sessie in de gewone chat-UI. Benji opent met moment 1 en loopt de
  // vijf momenten door (script zit in de AI-prompt op basis van momentenType).
  const momentenHandled = useRef(false);
  // Ad-herkomst (utm) van de momenten-landings-URL, vastgelegd bij het openen.
  const momentenBronRef = useRef<{ bron: string; bronUrl: string }>({ bron: "", bronUrl: "" });
  useEffect(() => {
    if (startParam !== "momenten" || momentenHandled.current) return;
    momentenHandled.current = true;
    // Leg de ad-herkomst (utm) van de landings-URL vast zodra de momenten-chat opent,
    // zodat we die later bij de brief kunnen meesturen voor advertentie-attributie.
    momentenBronRef.current = bepaalBron();
    const type = (Array.isArray(searchParams?.t) ? searchParams.t[0] : searchParams?.t) || "scheiding";
    setShowTopicButtons(false);
    (async () => {
      try {
        setIsAddingOpener(true);
        setSessionId(null);
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
        const newSessionId = await startSession({
          anonymousId: getOrCreateAnonymousId(),
          momentenType: type,
          // ?stijl=kaartjes → de kaartjes-flow (test). Zonder param = de huidige flow.
          momentenVariant: momentenKaartjes ? "kaartjes" : undefined,
        });
        setSessionId(newSessionId);
        // Kaartjes-flow: alleen het welkomstkaartje staat er nu. Laat moment 1 iets later
        // komen (rustiger tempo, tijd om het welkom te lezen), met even de bolletjes ertussen.
        if (momentenKaartjes) {
          setIsLoading(true);
          setTimeout(async () => {
            try { await showMomentKaart({ sessionId: newSessionId, nummer: 1 }); } catch {}
            setIsLoading(false);
          }, 2600);
        }
        if (typeof window !== "undefined") {
          if (!sessionStorage.getItem("benji_start_chat_fired") && typeof (window as any).fbq === "function") {
            (window as any).fbq("trackCustom", "StartChat");
            sessionStorage.setItem("benji_start_chat_fired", "1");
          }
          localStorage.setItem(HAS_CHATTED_KEY, "1");
        }
      } catch (e) {
        console.error(e);
        momentenHandled.current = false;
        setChatError("Er ging iets mis. Probeer het opnieuw.");
      } finally {
        setIsAddingOpener(false);
        setEhResolving(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startParam]);

  // Kaartjes-flow: de bezoeker bepaalt zelf het tempo. Benji reageert vrij op elk
  // moment; met de knop "Volgende moment →" (hieronder gerenderd) schuift de bezoeker
  // door naar het volgende kaartje, of tikt 'm meteen om een moment over te slaan.
  // Het hoogste getoonde moment-kaartje bepalen we uit de berichten.
  const momentenKaartTot = useMemo(() => {
    if (startParam !== "momenten" || !momentenKaartjes || !messages) return 0;
    let maxCard = 0;
    for (const m of messages) {
      if (m.role === "user") continue;
      const mm = m.content.match(/\[\[kaart:moment([1-5])\]\]/);
      if (mm) maxCard = Math.max(maxCard, parseInt(mm[1], 10));
    }
    return maxCard;
  }, [messages, startParam, momentenKaartjes]);
  // Heeft de bezoeker het laatst getoonde moment-kaartje al beantwoord? Pas dan mag de
  // "Volgende moment"-knop verschijnen (anders raakt getypte tekst kwijt bij doorklikken).
  const momentBeantwoord = useMemo(() => {
    if (startParam !== "momenten" || !momentenKaartjes || !messages) return false;
    let idx = -1;
    messages.forEach((m, i) => {
      if (m.role !== "user" && /\[\[kaart:moment[1-5]\]\]/.test(m.content)) idx = i;
    });
    if (idx < 0) return false;
    return messages.slice(idx + 1).some((m) => m.role === "user");
  }, [messages, startParam, momentenKaartjes]);
  // Is het e-mailkaartje (afsluiting) al getoond? Dan geen "Volgende"-knop meer.
  const momentenEmailGetoond = useMemo(
    () => !!messages?.some((m) => m.role !== "user" && m.content.includes("[[kaart:email]]")),
    [messages]
  );
  const [momentenAfsluitBezig, setMomentenAfsluitBezig] = useState(false);

  // Koppel anonieme sessie aan gebruiker na inloggen
  useEffect(() => {
    if (!session?.userId || !sessionId || !storedSession) return;
    if (storedSession.userId) return;
    linkSessionToUser({
      sessionId,
      userId: session.userId,
      userEmail: session.user?.email ?? undefined,
      userName: session.user?.name ?? undefined,
    }).catch(console.error);
  }, [session?.userId, session?.user?.email, session?.user?.name, sessionId, storedSession, linkSessionToUser]);

  // iOS Safari: toetsenbord herschaalt de viewport niet — gebruik visualViewport om de layout mee te laten krimpen
  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const update = () => {
      document.documentElement.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      // Alleen tijdens een actief gesprek naar beneden scrollen (toetsenbord open/dicht).
      // Op het welkomstscherm blijft de inhoud bovenaan staan.
      if (!hasConversationRef.current) return;
      requestAnimationFrame(() => {
        if (mainRef.current) {
          const { scrollHeight, scrollTop, clientHeight } = mainRef.current;
          if (scrollHeight - scrollTop - clientHeight < 300) {
            mainRef.current.scrollTo({ top: scrollHeight, behavior: "smooth" });
          }
        }
      });
    };
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "nl-NL";
      let speechPrefix = "";
      let latestText = "";
      recognition.onresult = (event: any) => {
        if (recognitionRef.current?._ignoreResults) return;
        const parts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          parts.push(event.results[i][0].transcript);
        }
        const transcript = parts.join(" ");
        latestText = speechPrefix ? speechPrefix + " " + transcript : transcript;
        setInput(latestText);
      };
      recognition.onend = () => {
        // Auto-restart unless user explicitly stopped
        if (recognitionRef.current?._userStopped) {
          recognitionRef.current._userStopped = false;
          setIsRecording(false);
        } else if (recognitionRef.current) {
          speechPrefix = latestText;
          try { recognition.start(); } catch {}
        }
      };
      recognition.onerror = (e: any) => {
        if (e.error === "aborted") return;
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
      recognitionRef.current._speechPrefix = speechPrefix;
      recognitionRef.current._setSpeechPrefix = (v: string) => { speechPrefix = v; };
      recognitionRef.current._setLatestText = (v: string) => { latestText = v; };
    }
  }, []);

  // Houd de ref gelijk aan sessionId voor effecten met lege deps (zie visualViewport).
  useEffect(() => {
    hasConversationRef.current = !!sessionId;
  }, [sessionId]);

  // Auto-scroll: altijd naar beneden bij nieuw bericht, anders alleen als al onderaan
  const prevMessageCountRef = useRef<number>(0);
  useEffect(() => {
    if (!mainRef.current) return;

    if (!sessionId && !isAddingOpener) {
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
      prevMessageCountRef.current = 0;
      return;
    }

    // Start van een nieuw gesprek: begin bovenaan i.p.v. midden in beeld
    // (voorkomt dat het eerste chatwolkje vanuit het midden omhoog "schiet").
    if (isAddingOpener && (messages?.length ?? 0) === 0) {
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const currentCount = messages?.length ?? 0;
    const newMessageArrived = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    if (newMessageArrived) {
      // Nieuw bericht: naar beneden scrollen. Dubbele requestAnimationFrame zodat het
      // pas gebeurt NADAT het wachtbolletje weg is en de nieuwe bubbel is uitgelijnd,
      // anders verspringt het beeld (scroll naar een hoogte die daarna nog krimpt).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mainRef.current) {
            mainRef.current.scrollTo({ top: mainRef.current.scrollHeight, behavior: "smooth" });
          }
        });
      });
      return;
    }

    // Geen nieuw bericht (bijv. isAddingOpener): alleen scrollen als al onderaan
    const main = mainRef.current;
    const distanceFromBottom = main.scrollHeight - main.scrollTop - main.clientHeight;
    if (distanceFromBottom < 200) {
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTo({ top: mainRef.current.scrollHeight, behavior: "smooth" });
        }
      });
    }
  }, [sessionId, isAddingOpener, messages]);

  // Test: toon foutmelding via ?testError=1 in de URL
  useEffect(() => {
    const testError = Array.isArray(searchParams?.testError) ? searchParams.testError[0] : searchParams?.testError;
    if (testError === "1") setChatError("Er ging iets mis. Probeer het opnieuw of start een nieuw gesprek via het menu.");
  }, [searchParams?.testError]);

  // Zet isLoading uit zodra er een nieuw bot bericht is
  useEffect(() => {
    if (messages && messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "bot") {
        // Zet loading direct uit zodra bot bericht binnenkomt
        setIsLoading(false);
        setIsAddingOpener(false);
        lastMessageCountRef.current = messages.length;
      } else if (lastMessage.role === "user") {
        // Update de count voor user messages ook
        lastMessageCountRef.current = messages.length;
      }
    }
  }, [messages]);

  // Verwijder pending bericht zodra het van de server binnenkomt
  useEffect(() => {
    if (!pendingUserMessage || !messages) return;
    const hasOurMessage = messages.some((m) => m.role === "user" && m.content === pendingUserMessage);
    if (hasOurMessage) setPendingUserMessage(null);
  }, [messages, pendingUserMessage]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current._userStopped = true;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Preserve existing text in the input
      recognitionRef.current._ignoreResults = false;
      recognitionRef.current._setSpeechPrefix(input.trim());
      recognitionRef.current._setLatestText(input.trim());
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    // Nieuw model: gratis berichten-tegoed op → paywall staat in beeld, niet versturen.
    if (paywallBereikt) return;
    setShowTopicButtons(false);
    const messageText = text.trim();
    setInput("");
    if (recognitionRef.current) {
      recognitionRef.current._ignoreResults = true;
      recognitionRef.current._setSpeechPrefix("");
      recognitionRef.current._setLatestText("");
    }
    // Behoud scroll positie tijdens het versturen om verspringen te voorkomen
    const currentScrollTop = mainRef.current?.scrollTop ?? 0;
    setPendingUserMessage(messageText); // Direct tonen: 1. jouw bericht, 2. bolletjes, 3. Benji
    const startTime = Date.now();

    // Kaartjes-flow: Benji reageert NIET op elk moment (dat voelde als te veel). Per
    // moment (1 t/m 4) bepaalt Benji zelf of het antwoord echt kwetsbaar is; zo ja geeft
    // hij één korte reactie, maximaal 2 keer per gesprek. Anders wordt het antwoord stil
    // opgeslagen (geen bolletjes). Moment 5 start meteen de afsluiting (erkenning + brief +
    // e-mailkaartje), zonder extra knop.
    if (startParam === "momenten" && momentenKaartjes && sessionId) {
      const huidigMoment = momentenKaartTot; // 1..5
      try {
        if (huidigMoment >= 5) {
          await saveKaartAntwoord({ sessionId, content: messageText });
          setPendingUserMessage(null);
          setMomentenAfsluitBezig(true);
          setIsLoading(true);
          await startMomentenAfsluiting({ sessionId });
          const elapsed = Date.now() - startTime;
          if (elapsed < 4000) await new Promise((r) => setTimeout(r, 4000 - elapsed));
        } else {
          setIsLoading(true);
          const res = await reageerOpMoment({ sessionId, moment: huidigMoment, content: messageText });
          // Alleen als Benji echt reageerde het tempo aanhouden; bij stil opslaan geen
          // kunstmatige vertraging, dan verschijnt de "Volgende moment"-knop meteen.
          if (res?.gereageerd) {
            const elapsed = Date.now() - startTime;
            if (elapsed < 4000) await new Promise((r) => setTimeout(r, 4000 - elapsed));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        setPendingUserMessage(null);
      }
      return;
    }

    try {
      let activeSessionId = sessionId;

      // Als opgeslagen sessie niet (meer) toegankelijk is, wis deze en start een nieuwe
      if (activeSessionId && storedSession === null) {
        activeSessionId = null;
        setSessionId(null);
      }

      if (!activeSessionId) {
        const startArgs = session?.userId
          ? { userId: session.userId, userEmail: session.user?.email ?? undefined, userName: session.user?.name ?? undefined }
          : { anonymousId: getOrCreateAnonymousId() };
        activeSessionId = await startSession(startArgs);
        setSessionId(activeSessionId);
        if (typeof window !== "undefined") {
          // Eerste chat in deze sessie — fire pixel event (eenmalig per sessie)
          if (!sessionStorage.getItem("benji_start_chat_fired") && typeof (window as any).fbq === "function") {
            (window as any).fbq("trackCustom", "StartChat");
            sessionStorage.setItem("benji_start_chat_fired", "1");
          }
          localStorage.setItem(HAS_CHATTED_KEY, "1");
        }
      }

      // Verstuur bericht en genereer antwoord (gebruikersbericht staat al via pendingUserMessage)
      setIsLoading(true);
      const result = await handleUserMessage({ sessionId: activeSessionId, userMessage: messageText });

      // Rate limit of andere zachte fout
      if (result && !result.success && result.error) {
        if (result.error === "GUEST_MESSAGE_LIMIT") {
          setMessageLimitType("guest");
          return;
        }
        if (result.error === "USER_MESSAGE_LIMIT") {
          setMessageLimitType("free");
          return;
        }
        if (result.error === "BENJI_LIMIET_BEREIKT") {
          // Nieuw model: gratis berichten-tegoed op. De paywall verschijnt reactief
          // via convCount; het niet-verstuurde bericht weghalen zodat het niet als
          // "verzonden" blijft staan.
          setPendingUserMessage(null);
          return;
        }
        setChatError(result.error);
        return;
      }

      // Minimum 5 seconden: bolletjes langer zichtbaar, rustiger tempo als een echt gesprek
      const elapsed = Date.now() - startTime;
      const minDelay = 5000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (e: any) {
      if (e?.message?.includes("GUEST_LIMIT_REACHED")) {
        // Gate toont automatisch via anonymousCount — geen foutmelding nodig
        return;
      }
      // Sessie behoort toe aan een andere gebruiker — wis en toon herstelmelding
      if (e?.message?.includes("Niet geautoriseerd")) {
        setSessionId(null);
        setChatError("Je sessie is verlopen. Vernieuw de pagina om opnieuw te beginnen.");
        return;
      }
      console.error(e);
      setChatError("Er ging iets mis. Probeer het opnieuw of start een nieuw gesprek via het menu.");
    }
    finally {
      setIsLoading(false);
      setPendingUserMessage(null);
    }
  };

  const handleTopicSelect = async (topicId: TopicId, _label: string) => {
    setShowTopicButtons(false);
    setChatError(null);
    const startTime = Date.now();
    try {
      // Zet loading pas aan wanneer we daadwerkelijk wachten op antwoord
      setIsLoading(true);
      setIsAddingOpener(true);
      
      const startArgs = session?.userId
        ? { topic: topicId, userId: session.userId, userEmail: session.user?.email ?? undefined, userName: session.user?.name ?? undefined }
        : { topic: topicId, anonymousId: getOrCreateAnonymousId() };
      const newSessionId = await startSession(startArgs);
      await addOpenerToSession({ sessionId: newSessionId, topicId });
      setSessionId(newSessionId);
      if (typeof window !== "undefined") localStorage.setItem("benji_has_chatted", "1");

      // Minimum 5 seconden: bolletjes langer zichtbaar, rustiger tempo
      const elapsed = Date.now() - startTime;
      const minDelay = 5000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (e: any) {
      if (e?.message?.includes("GUEST_LIMIT_REACHED")) return;
      console.error(e);
      setChatError("Er ging iets mis bij het starten. Probeer het opnieuw.");
    }
    finally {
      setIsLoading(false);
      setIsAddingOpener(false);
    }
  };

  useEffect(() => {
    const topicFromUrl = topicParam as TopicId | null;
    if (!topicFromUrl || topicFromUrlHandled.current === topicFromUrl || isLoading) return;
    topicFromUrlHandled.current = topicFromUrl;
    setShowTopicButtons(false);
    setIsLoading(true);
    setIsAddingOpener(true);
    (async () => {
      try {
        const startArgs = session?.userId
          ? { topic: topicFromUrl, userId: session.userId, userEmail: session.user?.email ?? undefined, userName: session.user?.name ?? undefined }
          : { topic: topicFromUrl, anonymousId: getOrCreateAnonymousId() };
        const newSessionId = await startSession(startArgs);
        await addOpenerToSession({ sessionId: newSessionId, topicId: topicFromUrl });
        setSessionId(newSessionId);
        if (typeof window !== "undefined") {
          if (!sessionStorage.getItem("benji_start_chat_fired") && typeof (window as any).fbq === "function") {
            (window as any).fbq("trackCustom", "StartChat");
            sessionStorage.setItem("benji_start_chat_fired", "1");
          }
          localStorage.setItem(HAS_CHATTED_KEY, "1");
        }
      } catch (e) { console.error(e); }
      finally {
        setIsLoading(false);
        setIsAddingOpener(false);
        router.replace("/");
        topicFromUrlHandled.current = null;
      }
    })();
  }, [topicParam, router, session?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Voorkom dat form submit scroll-gedrag triggert
    if (!input.trim() || isLoading) return;
    if (isRecording && recognitionRef.current) { recognitionRef.current._userStopped = true; recognitionRef.current.stop(); setIsRecording(false); }
    await sendMessage(input.trim());
  };

  // Klik op het logo: terug naar het welkomstscherm (knoppen) i.p.v. wegnavigeren,
  // zonder het oude gesprek opnieuw te openen.
  const handleBackToWelcome = () => {
    setSessionId(null);
    setShowTopicButtons(true);
    setChatError(null);
  };

  return (
    <div
      className="relative flex flex-col chat-theme bg-cover bg-center bg-no-repeat"
      style={
        {
          height: "var(--vvh, 100dvh)",
          "--chat-accent": accent,
          "--chat-accent-hover": accentHover,
          "--chat-accent-dark": accentDark,
          // Nacht: achtergrond op een vaste laag (zie hieronder), dus hier geen image.
          ...(isNacht
            ? {}
            : {
                backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${preferencesData?.backgroundImageUrl || "/images/achtergrond.png"})`,
              }),
        } as React.CSSProperties
      }
    >
      {isNacht && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${nachtConfig?.backgroundImageUrl || "/images/achtergrond.png"})`,
          }}
        />
      )}
      <HeaderBar onLogoClick={isNacht && sessionId ? handleBackToWelcome : undefined} accountLink={accountNudge} />

      <ConversationLimitGate
        userId={session?.userId as string | undefined}
        email={session?.user?.email || undefined}
        anonymousCount={!session?.userId ? anonymousCount : undefined}
      >
        <main ref={mainRef} className="flex-1 overflow-y-auto relative min-h-0">
        {/* Laden terwijl Convex auth initialiseert — voorkomt leeg scherm */}
        {convexAuthLoading && sessionId && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
          </div>
        )}
        {/* Chat-inhoud */}
        <div className={`relative max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-8 sm:pb-10 min-h-full w-full touch-manipulation ${!sessionId && !isAddingOpener && !ehResolving ? "flex flex-col justify-center" : ""}`}>
          {/* Terugladen na inloggen: spinner i.p.v. even het welkomstscherm laten flitsen */}
          {restoreBezig && !sessionId && (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            </div>
          )}
          {!restoreBezig && !sessionId && !isAddingOpener && !ehResolving && (
            <>
              <WelcomeScreen
                showTopicButtons={showTopicButtons}
                onTopicSelect={handleTopicSelect}
                theme={isNacht ? "dark" : "light"}
                introText={nachtConfig?.introText}
                question={nachtConfig?.question}
                subText={nachtConfig?.subText}
                buttons={nachtConfig?.buttons}
                showWaaromButton={nachtConfig?.showWaaromButton ?? false}
                toonIntroKader={!heeftGechat}
              />
              <div className="w-full max-w-sm mx-auto mt-4">
                <form onSubmit={handleSubmit} className="w-full rounded-xl bg-primary-900 px-3 py-2.5 sm:py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={isLoading || !speechSupported}
                      className={`p-2.5 rounded-lg flex-shrink-0 transition-colors ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary-600 text-white hover:bg-primary-500"} disabled:opacity-40`}
                      title={!speechSupported ? "Spraak niet beschikbaar" : isRecording ? "Stop opname" : "Start spraakopname"}
                    >
                      {isRecording ? <Square size={18} /> : <Mic size={18} />}
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isRecording ? "Luisteren..." : (isNacht && nachtConfig?.inputPlaceholder) ? nachtConfig.inputPlaceholder! : "Typ je bericht..."}
                        suppressHydrationWarning
                        className={`w-full px-3 py-2 sm:py-2.5 rounded-lg text-sm bg-white border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 ${isRecording ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                        disabled={isLoading || paywallBereikt}
                      />
                      {isRecording && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></div>}
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading || paywallBereikt}
                      className="p-2 sm:p-2.5 rounded-lg flex-shrink-0 bg-primary-700 text-white hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  {isRecording && <p className="text-xs text-red-300 mt-1.5 text-center animate-pulse">Spraakopname actief - spreek nu...</p>}
                </form>
              </div>
            </>
          )}

          {/* Even Houvast-lead (?start=eh): terwijl we serverside beslissen (directe
              chat of door naar /account) tonen we alleen een spinner. Zonder deze gate
              flitst een uit localStorage geladen oud gesprek even in beeld. */}
          {ehResolving && (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {(() => {
              if (ehResolving) return null;
              let userMsgCount = 0;
              return messages?.map((msg: Doc<"chatMessages">, idx: number) => {
              const isUser = msg.role === "user";
              if (isUser) userMsgCount++;
              const parsed = !isUser ? parseMemoryMarker(msg.content) : null;
              const displayContent = parsed ? parsed.cleanContent : msg.content;
              // Onder het nieuwe model verstoren tussentijdse kaartjes het gesprek;
              // we laten alleen bij de afsluiting (de paywall) iets zien.
              const showDeviceMemoryCard = !berichtenModelActief && isAnonymousUser && userMsgCount === DEVICE_MEMORY_CARD_AFTER && !isUser;
              // Save- en limiet-kaart tellen nog op de oude per-sessie-logica ("3 gesprekken",
              // "nog 2 berichten"). Onder het nieuwe model regelen het zachte zinnetje + de
              // inline-paywall de grens, dus die twee uit om tegenstrijdige tellingen te voorkomen.
              const showSaveCard = !berichtenModelActief && isAnonymousUser && !saveCardDismissed && userMsgCount === SAVE_CARD_AFTER && !isUser;
              const showLimitWarning = !berichtenModelActief && isAnonymousUser && userMsgCount === LIMIT_WARNING_AFTER && !isUser;
              // Geleide momenten: bot-berichten met een kaart-marker als kaartje tonen
              // (gecentreerd). Een eventuele reactie ervóór blijft een gewone bubbel.
              const kaartMatch = !isUser ? displayContent.match(/\[\[(momentkaart:intro:[a-z]+|kaart:welkom|kaart:moment[1-5]|kaart:oefening|kaart:email)\]\]/) : null;
              if (kaartMatch) {
                const marker = kaartMatch[1];
                const cleanText = displayContent.replace(kaartMatch[0], "").trim();
                return (
                  <div key={msg._id} className="flex flex-col items-center gap-2 w-full">
                    {cleanText && (
                      <div className="self-start max-w-sm">
                        <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-gray-800 rounded-bl-md shadow-sm ${isNacht ? "bg-white/80 border border-white/30 backdrop-blur-sm" : "bg-white border border-gray-200"}`}>
                          <MessageContent content={cleanText} isUser={false} />
                        </div>
                      </div>
                    )}
                    {marker.startsWith("momentkaart:intro")
                      ? <MomentIntroKaart type={marker.split(":")[2]} />
                      : marker === "kaart:welkom"
                        ? <MomentWelkomKaart type={momentenTypeParam} />
                        : marker.startsWith("kaart:moment")
                          ? <MomentOpdrachtKaart type={momentenTypeParam} nummer={parseInt(marker.replace("kaart:moment", ""), 10)} />
                          : marker === "kaart:oefening"
                            ? <MomentOefeningKaart />
                            : <MomentEmailKaart onDone={async (email, naam) => { await saveMomentenEmail({ sessionId: msg.sessionId, email, naam: naam || undefined, bron: momentenBronRef.current.bron || undefined, bronUrl: momentenBronRef.current.bronUrl || undefined }); }} />}
                  </div>
                );
              }
              return (
                <>
                <div key={msg._id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  {isUser ? (
                    <div className="max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-primary-900 text-white rounded-br-md">
                      <MessageContent content={displayContent} isUser={isUser} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 max-w-sm">
                      <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-gray-800 rounded-bl-md shadow-sm ${isNacht ? "bg-white/80 border border-white/30 backdrop-blur-sm" : "bg-white border border-gray-200"}`}>
                        <MessageContent content={displayContent} isUser={false} />
                        {parsed?.memoryText && session?.userId && startParam !== "momenten" && (
                          <MemorySaveButton
                            memoryText={parsed.memoryText}
                            emotion={parsed.emotion || "warm"}
                            userId={session.userId as string}
                            accent={accent}
                          />
                        )}
                      </div>
                      {startParam !== "momenten" && (
                      <div className="flex justify-start pl-1">
                        {msg.feedback === "helpful" ? (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <ThumbsUp size={12} />
                            Fijn om te horen
                          </span>
                        ) : msg.feedback === "not_helpful" ? (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Check size={12} />
                            Bedankt voor je terugkoppeling
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => submitMessageFeedback({ messageId: msg._id, feedback: "helpful" })}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-500 transition-colors"
                              title="Dit antwoord was behulpzaam"
                            >
                              <ThumbsUp size={13} />
                            </button>
                            <button
                              onClick={() => submitMessageFeedback({ messageId: msg._id, feedback: "not_helpful" })}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                              title="Dit antwoord was niet behulpzaam"
                            >
                              <ThumbsDown size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  )}
                </div>
                {showDeviceMemoryCard && (
                  <div key={`device-memory-${msg._id}`} className="flex justify-center my-2">
                    <div className="animate-card-in bg-primary-50 border border-primary-200 rounded-2xl px-4 py-3 max-w-sm w-full shadow-sm">
                      <p className="text-sm text-primary-900 font-medium mb-1">Benji onthoudt je verhaal</p>
                      <p className="text-xs text-primary-700 mb-2">Met een gratis account onthoudt Benji wat je deelt, op elk apparaat waar je inlogt. Zo hoef je nooit opnieuw te beginnen.</p>
                      <a href="/registreren" className="text-xs font-medium text-primary-700 underline hover:text-primary-900 transition-colors">
                        Maak een gratis account →
                      </a>
                    </div>
                  </div>
                )}
                {showSaveCard && (
                  <div key={`save-card-${msg._id}`} className="flex justify-center my-2">
                    <div className="animate-card-in bg-primary-50 border border-primary-200 rounded-2xl px-4 py-3 max-w-sm w-full shadow-sm">
                      <p className="text-sm text-primary-900 font-medium mb-1">Wil je meer dan 3 gesprekken?</p>
                      <p className="text-xs text-primary-700 mb-3">Met een gratis profiel kun je vijf gesprekken gratis voeren, én onthoudt Benji je verhaal.</p>
                      <div className="flex gap-2">
                        <a
                          href="/registreren"
                          className="flex-1 text-center text-xs font-medium bg-primary-300 hover:bg-primary-400 text-primary-900 rounded-xl px-3 py-2 transition-colors"
                        >
                          Aanmelden
                        </a>
                        <button
                          onClick={() => setSaveCardDismissed(true)}
                          className="text-xs text-primary-600 hover:text-primary-800 px-3 py-2 transition-colors"
                        >
                          Niet nu
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {showLimitWarning && (
                  <div key={`limit-warning-${msg._id}`} className="flex justify-center my-2">
                    <div className="animate-card-in bg-primary-50 border border-primary-200 rounded-2xl px-4 py-3 max-w-sm w-full shadow-sm">
                      <p className="text-sm text-primary-900 font-medium mb-1">Nog 2 berichten over</p>
                      <p className="text-xs text-primary-700 mb-3">Met een gratis profiel kun je doorpraten én onthoudt Benji je verhaal de volgende keer. Zo hoef je niet opnieuw te beginnen.</p>
                      <div className="flex gap-2">
                        <a
                          href="/registreren"
                          className="flex-1 text-center text-xs font-medium bg-primary-300 hover:bg-primary-400 text-primary-900 rounded-xl px-3 py-2 transition-colors"
                        >
                          Gratis profiel aanmaken
                        </a>
                        <a
                          href="/inloggen"
                          className="text-xs text-primary-600 hover:text-primary-800 px-3 py-2 transition-colors"
                        >
                          Inloggen
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                </>
              );
            });
            })()}
            {pendingUserMessage && (
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-primary-900 text-white rounded-br-md">
                  <MessageContent content={pendingUserMessage} isUser />
                </div>
              </div>
            )}
            {isLoading && !isAddingOpener && (
              <div className="flex justify-start pl-2 py-2">
                {/* Eén rustig pulserend bolletje, maar nu duidelijk zichtbaar: groter,
                    vollere kleur en een snellere, verder uitdijende puls. Alleen bij het
                    wachten op een antwoord op JOUW bericht, niet tijdens het openen
                    (de opener zet isLoading ook aan, vandaar de !isAddingOpener). */}
                <span className="relative flex h-4 w-4">
                  <span className={`absolute inline-flex h-full w-full rounded-full animate-ping ${isNacht ? "bg-white/70" : "bg-primary-400"}`} style={{ animationDuration: '1.6s' }}></span>
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${isNacht ? "bg-white" : "bg-primary-600"}`}></span>
                </span>
              </div>
            )}
            {/* Kaartjes-flow: pas ná het verzonden antwoord verschijnt "Volgende moment".
                Moment 5 sluit vanzelf af (geen knop), dus alleen bij moment 1 t/m 4. */}
            {startParam === "momenten" && momentenKaartjes && sessionId &&
              momentenKaartTot >= 1 && momentenKaartTot < 5 && momentBeantwoord &&
              !momentenEmailGetoond && !isLoading && (
              <div className="flex justify-center pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => showMomentKaart({ sessionId, nummer: momentenKaartTot + 1 })}
                  className="text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                  style={{ background: "#eef2fb", border: "1px solid #c7d4f0", color: "#576b8f" }}
                >
                  Volgende moment →
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Zachte nudge: eerste bezoek (5s), gesprek 3 en gesprek 4 — alleen op welkomstscherm */}
      {showNudgeBanner && !berichtenModelActief && !sessionId && !isAddingOpener && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-800 text-sm mx-3 mb-1">
          <span>
            {anonymousCount === 0
              ? "Benji is gratis te proberen — maak een account om je gesprekken te bewaren."
              : `Je hebt ${anonymousCount} van 5 gratis gesprekken gebruikt.`}
          </span>
          <Link href="/registreren" className="flex-shrink-0 text-xs font-medium underline hover:text-primary-900 transition-colors">
            Maak een gratis account →
          </Link>
        </div>
      )}

      {/* Berichtenlimiet popup */}
      {messageLimitType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            {messageLimitType === "guest" ? (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Je hebt het maximum bereikt</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Je hebt 15 berichten verstuurd in dit gesprek. Maak een gratis account aan om verder te gaan en je gesprekken te bewaren.
                </p>
                <div className="flex flex-col gap-2">
                  <Link href="/registreren" className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Gratis account aanmaken
                  </Link>
                  <Link href="/inloggen" className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    Ik heb al een account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Gesprek is ten einde</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  Je hebt het maximum van 40 berichten in dit gesprek bereikt. Start een nieuw gesprek of upgrade voor onbeperkt chatten.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/account/abonnement?upgrade=true" className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Mijn abonnement
                  </Link>
                  <button onClick={() => setMessageLimitType(null)} className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    Nieuw gesprek
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {chatError && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 bg-amber-50 border-t border-amber-200 text-amber-800 text-sm">
          <span>{chatError}</span>
          <button
            type="button"
            onClick={() => setChatError(null)}
            className="flex-shrink-0 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
            aria-label="Melding sluiten"
          >
            ✕
          </button>
        </div>
      )}

      {/* Nieuw model: paywall wanneer de 5 gesprekken op zijn. Inline melding, het
          gesprek blijft gewoon zichtbaar. Verschijnt pas ná Benji's antwoord
          (niet terwijl hij nog aan het typen is), zodat het gesprek niet wordt
          onderbroken. */}
      {/* Zachte melding aan het BEGIN van gesprek 4 en 5 (vóór je typt), boven het
          invoerveld zodat je het meteen ziet. Alleen beleving; grens = berichtenteller. */}
      {toonGesprekMelding && !isLoading && !pendingUserMessage && (
        <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 pb-1 pt-1">
          <div className="animate-card-in max-w-sm mx-auto text-center text-xs text-primary-700 bg-primary-50/90 border border-primary-200 rounded-xl px-4 py-2.5">
            {volgendGesprek === 4 ? (
              <>
                Je hebt hierna nog één gesprek met Benji. Daarna kun je{" "}
                <Link href="/wat-kost-benji" className="font-medium text-primary-800 underline hover:text-primary-900 transition-colors">altijd verder</Link>.
              </>
            ) : (
              "Dit is je vijfde gesprek met Benji."
            )}
          </div>
        </div>
      )}

      {paywallBereikt && !isLoading && !pendingUserMessage && (
        <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 pb-2 pt-1">
          <div className="animate-card-in bg-primary-100 border border-primary-300 rounded-2xl px-5 py-5 shadow-sm text-center max-w-sm mx-auto">
            <p className="text-sm font-semibold text-primary-900 mb-2">Benji blijft er graag voor je</p>
            <p className="text-xs text-primary-700 leading-relaxed mb-4">
              Je gesprekken en herinneringen blijven bewaard.<br />
              Je kunt gewoon verder waar je gebleven was.
            </p>
            <Link href="/wat-kost-benji" className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-400 hover:bg-primary-500 text-primary-900 rounded-xl text-sm font-medium transition-colors">
              Verder praten met Benji
            </Link>
            <p className="text-[11px] text-primary-600/70 mt-3">
              Vanaf 20 p/m. Geen abonnement,<br />
              stopt vanzelf.
            </p>
          </div>
        </div>
      )}


<footer className="bg-primary-900 flex-shrink-0 overflow-visible" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-bottom) * 0.2)', paddingBottom: 'max(1rem, calc(0.5rem + env(safe-area-inset-bottom)))', pointerEvents: 'auto' }}>
        {!sessionId && !isAddingOpener ? (
          <>
            <SiteFooter variant="dark" compact />
          </>
        ) : (
          <div className="px-3 sm:px-4 py-4 sm:py-5">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto overflow-visible">
              <div className="flex gap-2 sm:gap-3 overflow-visible">
                <div className="relative flex-shrink-0">
                  {/* Mic hint tooltip */}
                  {showMicHint && !isRecording && (
                    <div
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50"
                      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.18))" }}
                    >
                      <div
                        className="px-3 py-2 rounded-xl text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
                        style={{ background: "rgba(109,132,168,0.95)" }}
                        onClick={() => { setShowMicHint(false); toggleRecording(); }}
                      >
                        <Mic size={13} />
                        Tik om in te spreken
                      </div>
                      {/* Pijltje naar beneden */}
                      <div className="flex justify-center">
                        <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid rgba(109,132,168,0.95)" }} />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isLoading || !speechSupported}
                    className={`relative p-3 sm:p-3.5 rounded-xl transition-colors ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary-700 text-white hover:bg-primary-600"} disabled:opacity-50`}
                    title={!speechSupported ? "Spraak niet beschikbaar" : isRecording ? "Stop opname" : "Start spraakopname"}
                  >
                    {/* Pulse ring als hint actief is */}
                    {showMicHint && !isRecording && speechSupported && (
                      <span className="absolute inset-0 rounded-xl animate-ping opacity-40" style={{ background: "#6d84a8" }} />
                    )}
                    {isRecording ? <Square size={20} /> : <Mic size={20} />}
                  </button>
                </div>
                <div className="flex-1 relative overflow-visible">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isRecording ? "Luisteren..." : "Typ je bericht..."} suppressHydrationWarning className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 ${isRecording ? "border-red-500 bg-red-50" : "border-gray-300"}`} disabled={isLoading || paywallBereikt} />
                  {isRecording && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></div>}
                </div>
                <button type="submit" disabled={!input.trim() || isLoading || paywallBereikt} className="p-3 sm:p-3.5 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                  <Send size={20} />
                </button>
              </div>
              {isRecording && <p className="text-xs text-red-300 mt-2 text-center animate-pulse">Spraakopname actief - spreek nu...</p>}
            </form>
            {sessionId && (
              <p className="text-center text-xs text-primary-400 mt-2">
                Benji leert van elk gesprek.{" "}
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(true)}
                  className="underline hover:text-primary-200 transition-colors"
                >
                  Deel je ervaring
                </button>{" "}
                en help mee.
              </p>
            )}
          </div>
        )}
      </footer>
      </ConversationLimitGate>

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        userId={session?.userId ?? undefined}
        userEmail={session?.user?.email ?? undefined}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, Mic, Square, Gem } from "lucide-react";
import { WelcomeScreen, WelcomeScreenInfoIcons } from "@/components/chat/WelcomeScreen";
import { HeaderBar } from "@/components/chat/HeaderBar";
import type { TopicId } from "@/components/chat/TopicButtons";
import { hexToDarker } from "@/lib/utils";
import { ConversationLimitGate } from "@/components/ConversationLimitGate";

export type SearchParamsProp = { topic?: string | string[]; testError?: string | string[]; welcome?: string | string[] };

/** Rendert chatbericht met klikbare markdown-links [tekst](url) */
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[2];
    const isSafe = href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
    if (!isSafe) { lastIndex = match.index + match[0].length; continue; }
    parts.push(content.slice(lastIndex, match.index));
    parts.push(
      <a
        key={match.index}
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
  parts.push(content.slice(lastIndex));
  return <p className="text-sm sm:text-base break-words">{parts}</p>;
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

export default function ChatPageClient({
  searchParams = {},
}: {
  searchParams?: SearchParamsProp;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const topicParam = Array.isArray(searchParams?.topic) ? searchParams.topic[0] : searchParams?.topic;
  const welcomeParam = Array.isArray(searchParams?.welcome) ? searchParams.welcome[0] : searchParams?.welcome;
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
  const setSessionId = (id: Id<"chatSessions"> | null) => {
    setSessionIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };
  const [showTopicButtons, setShowTopicButtons] = useState(true);
  const [input, setInput] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingOpener, setIsAddingOpener] = useState(false);
  const lastMessageCountRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const topicFromUrlHandled = useRef<string | null>(null);

  const messages = useQuery(
    api.chat.getMessages,
    sessionId ? { sessionId } : "skip"
  );
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
    sessionIdState ? { sessionId: sessionIdState } : "skip"
  );

  useEffect(() => {
    if (sessionIdState && storedSession === null) {
      setSessionIdState(null);
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    }
  }, [sessionIdState, storedSession]);

  // Reset lastMessageCountRef bij sessiewissel – anders herkent useEffect het opener-bericht niet
  useEffect(() => {
    lastMessageCountRef.current = 0;
  }, [sessionId]);

  const startSession = useMutation(api.chat.startSession);
  const addOpenerToSession = useMutation(api.chat.addOpenerToSession);
  const addPersonalizedOpenerToSession = useMutation(api.chat.addPersonalizedOpenerToSession);
  const linkSessionToUser = useMutation(api.chat.linkSessionToUser);
  const handleUserMessage = useAction(api.ai.handleUserMessage);

  const welcomeFromAccountHandled = useRef(false);

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
        if (typeof window !== "undefined") localStorage.setItem(HAS_CHATTED_KEY, "1");
      } catch (e) {
        console.error(e);
        welcomeFromAccountHandled.current = false;
        setChatError("Er ging iets mis. Probeer het opnieuw.");
      } finally {
        setIsAddingOpener(false);
      }
    })();
  }, [welcomeParam, session?.userId, session?.user?.name, session?.user?.email, startSession, addPersonalizedOpenerToSession]);

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

  // Scroll alleen als gebruiker al onderaan was - voorkom verspringen
  useEffect(() => {
    if (!mainRef.current) return;
    
    if (!sessionId && !isAddingOpener) {
      // Reset naar boven bij nieuwe sessie
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    
    // Check of gebruiker al onderaan was (binnen 200px van de bottom)
    const main = mainRef.current;
    const scrollHeight = main.scrollHeight;
    const scrollTop = main.scrollTop;
    const clientHeight = main.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 200;
    
    // Alleen scrollen als gebruiker al onderaan was
    if (isNearBottom) {
      // Gebruik requestAnimationFrame voor soepele scroll zonder verspringen
      requestAnimationFrame(() => {
        if (mainRef.current) {
          // Scroll naar beneden met smooth behavior
          mainRef.current.scrollTo({
            top: mainRef.current.scrollHeight,
            behavior: "smooth"
          });
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
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const startArgs = session?.userId
          ? { userId: session.userId, userEmail: session.user?.email ?? undefined, userName: session.user?.name ?? undefined }
          : { anonymousId: getOrCreateAnonymousId() };
        activeSessionId = await startSession(startArgs);
        setSessionId(activeSessionId);
        if (typeof window !== "undefined") localStorage.setItem(HAS_CHATTED_KEY, "1");
      }
      
      // Verstuur bericht en genereer antwoord (gebruikersbericht staat al via pendingUserMessage)
      setIsLoading(true);
      const result = await handleUserMessage({ sessionId: activeSessionId, userMessage: messageText });

      // Rate limit of andere zachte fout
      if (result && !result.success && result.error) {
        setChatError(result.error);
        return;
      }
      
      // Minimum 5 seconden: bolletjes langer zichtbaar, rustiger tempo als een echt gesprek
      const elapsed = Date.now() - startTime;
      const minDelay = 5000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (e) {
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
    } catch (e) {
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
        if (typeof window !== "undefined") localStorage.setItem(HAS_CHATTED_KEY, "1");
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

  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-white flex flex-col chat-theme"
      style={
        {
          "--chat-accent": accent,
          "--chat-accent-hover": accentHover,
          "--chat-accent-dark": accentDark,
        } as React.CSSProperties
      }
    >
      <HeaderBar onLogoClick={() => { setSessionId(null); setShowTopicButtons(true); }} />

      <ConversationLimitGate
        userId={session?.userId as string | undefined}
        email={session?.user?.email || undefined}
      >
        <main ref={mainRef} className="flex-1 overflow-y-auto relative">
        {/* Eén achtergrondlaag: custom of standaard, pointer-events: none, z-0 */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${preferencesData?.backgroundImageUrl || "/images/achtergrond.png"})`,
            pointerEvents: "none",
          }}
          aria-hidden
        />
        {/* Chat-inhoud - relative in flow, z-50 bovenop. Geen pointer-events/touchAction override - defaults werken. */}
        <div className="relative z-50 max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-full w-full touch-manipulation">
          {!sessionId && !isAddingOpener && (
            <>
              <WelcomeScreen
                showTopicButtons={showTopicButtons}
                onTopicSelect={handleTopicSelect}
              />
              <div className="w-full max-w-sm mx-auto mt-4">
                <form onSubmit={handleSubmit} className="w-full rounded-xl bg-primary-900 px-3 py-2.5 sm:py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={isLoading || !speechSupported}
                      className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 transition-colors ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary-700 text-white hover:bg-primary-600"} disabled:opacity-50`}
                      title={!speechSupported ? "Spraak niet beschikbaar" : isRecording ? "Stop opname" : "Start spraakopname"}
                    >
                      {isRecording ? <Square size={18} /> : <Mic size={18} />}
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isRecording ? "Luisteren..." : "Typ je bericht..."}
                        suppressHydrationWarning
                        className={`w-full px-3 py-2 sm:py-2.5 rounded-lg text-sm bg-white border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 ${isRecording ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                        disabled={isLoading}
                      />
                      {isRecording && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></div>}
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
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

          <div className="space-y-3 sm:space-y-4">
            {messages?.map((msg: Doc<"chatMessages">) => {
              const isUser = msg.role === "user";
              const parsed = !isUser ? parseMemoryMarker(msg.content) : null;
              const displayContent = parsed ? parsed.cleanContent : msg.content;
              return (
                <div key={msg._id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${isUser ? "max-w-[85%] sm:max-w-[80%] bg-primary-900 text-white rounded-br-md" : "max-w-sm bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"}`}>
                    <MessageContent content={displayContent} isUser={isUser} />
                    {parsed?.memoryText && session?.userId && (
                      <MemorySaveButton
                        memoryText={parsed.memoryText}
                        emotion={parsed.emotion || "warm"}
                        userId={session.userId as string}
                        accent={accent}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {pendingUserMessage && (
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-primary-900 text-white rounded-br-md">
                  <MessageContent content={pendingUserMessage} isUser />
                </div>
              </div>
            )}
            {(isLoading || isAddingOpener) && (
              <div className="flex justify-start">
                <div className="max-w-sm bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1 h-1 bg-primary-600/60 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '2s' }}></div>
                    <div className="w-1 h-1 bg-primary-600/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2s' }}></div>
                    <div className="w-1 h-1 bg-primary-600/60 rounded-full animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

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

      <footer className="bg-primary-900 flex-shrink-0 overflow-visible" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-bottom) * 0.2)', paddingBottom: 'max(1rem, calc(0.5rem + env(safe-area-inset-bottom)))', pointerEvents: 'auto' }}>
        {!sessionId && !isAddingOpener ? (
          <WelcomeScreenInfoIcons variant="dark" />
        ) : (
          <div className="px-3 sm:px-4 py-4 sm:py-5">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto overflow-visible">
              <div className="flex gap-2 sm:gap-3 overflow-visible">
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isLoading || !speechSupported}
                  className={`p-3 sm:p-3.5 rounded-xl transition-colors flex-shrink-0 ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary-700 text-white hover:bg-primary-600"} disabled:opacity-50`}
                  title={!speechSupported ? "Spraak niet beschikbaar" : isRecording ? "Stop opname" : "Start spraakopname"}
                >
                  {isRecording ? <Square size={20} /> : <Mic size={20} />}
                </button>
                <div className="flex-1 relative overflow-visible">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isRecording ? "Luisteren..." : "Typ je bericht..."} suppressHydrationWarning className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 ${isRecording ? "border-red-500 bg-red-50" : "border-gray-300"}`} disabled={isLoading} />
                  {isRecording && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></div>}
                </div>
                <button type="submit" disabled={!input.trim() || isLoading} className="p-3 sm:p-3.5 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                  <Send size={20} />
                </button>
              </div>
              {isRecording && <p className="text-xs text-red-300 mt-2 text-center animate-pulse">Spraakopname actief - spreek nu...</p>}
            </form>
          </div>
        )}
      </footer>
      </ConversationLimitGate>
    </div>
  );
}

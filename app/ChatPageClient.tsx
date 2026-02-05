"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, Mic, Square } from "lucide-react";
import { WelcomeScreen, WelcomeScreenInfoIcons } from "@/components/chat/WelcomeScreen";
import { HeaderBar } from "@/components/chat/HeaderBar";
import type { TopicId } from "@/components/chat/TopicButtons";

export type SearchParamsProp = { topic?: string | string[]; testError?: string | string[] };

const STORAGE_KEY = "benji_session_id";
const HAS_CHATTED_KEY = "benji_has_chatted";

export default function ChatPageClient({
  searchParams = {},
}: {
  searchParams?: SearchParamsProp;
}) {
  const router = useRouter();
  const topicParam = Array.isArray(searchParams?.topic) ? searchParams.topic[0] : searchParams?.topic;
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

  const startSession = useMutation(api.chat.startSession);
  const addOpenerToSession = useMutation(api.chat.addOpenerToSession);
  const handleUserMessage = useAction(api.ai.handleUserMessage);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "nl-NL";
      recognitionRef.current.onresult = (event: any) => {
        setInput(Array.from(event.results).map((r: any) => r[0].transcript).join(""));
      };
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId && !isAddingOpener) {
      mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { setInput(""); recognitionRef.current.start(); setIsRecording(true); }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setShowTopicButtons(false);
    const messageText = text.trim();
    setInput("");
    setPendingUserMessage(messageText); // Direct tonen: 1. jouw bericht, 2. bolletjes, 3. Benji
    const startTime = Date.now();
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = await startSession({});
        setSessionId(activeSessionId);
        if (typeof window !== "undefined") localStorage.setItem(HAS_CHATTED_KEY, "1");
      }
      
      // Verstuur bericht en genereer antwoord (gebruikersbericht staat al via pendingUserMessage)
      setIsLoading(true);
      const messagePromise = handleUserMessage({ sessionId: activeSessionId, userMessage: messageText });
      
      // Wacht op antwoord
      await messagePromise;
      
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
      
      const newSessionId = await startSession({ topic: topicId });
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
        const newSessionId = await startSession({ topic: topicFromUrl });
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
  }, [topicParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); setIsRecording(false); }
    await sendMessage(input.trim());
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col">
      <HeaderBar onLogoClick={() => { setSessionId(null); setShowTopicButtons(true); }} />

      <main ref={mainRef} className="flex-1 overflow-y-auto relative">
        {/* Achtergrondafbeelding */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/images/achtergrond.png)", pointerEvents: "none" }}
          aria-hidden
        />
        {/* Waas ~70% - pointer-events: none zodat alle kliks doorkomen */}
        <div className="absolute inset-0 z-0 bg-white/70" style={{ pointerEvents: "none" }} aria-hidden />
        {/* Chat-inhoud bovenop - hoge z-index, pointer-events auto */}
        <div className="relative z-50 max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-full w-full" style={{ pointerEvents: "auto" }}>
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
                        placeholder={isRecording ? "Luisteren..." : "Typ je vraag om te beginnen"}
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
              <WelcomeScreenInfoIcons />
            </>
          )}

          <div className="space-y-3 sm:space-y-4">
            {messages?.map((msg: Doc<"chatMessages">) => (
              <div key={msg._id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${msg.role === "user" ? "bg-primary-900 text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"}`}>
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                </div>
              </div>
            ))}
            {pendingUserMessage && (
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-primary-900 text-white rounded-br-md">
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{pendingUserMessage}</p>
                </div>
              </div>
            )}
            {(isLoading || isAddingOpener) && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
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
          <div className="w-full h-8 sm:h-10 shrink-0" aria-hidden />
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
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isRecording ? "Luisteren..." : "Typ je vraag om te beginnen"} suppressHydrationWarning className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 ${isRecording ? "border-red-500 bg-red-50" : "border-gray-300"}`} disabled={isLoading} />
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
    </div>
  );
}

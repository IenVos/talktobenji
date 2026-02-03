"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, Mic, Square } from "lucide-react";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import type { TopicId } from "@/components/chat/TopicButtons";

export type SearchParamsProp = { topic?: string | string[] };

// Logo in header: wissel naar "/images/benji-logo-1.png" om het andere logo te proberen
const HEADER_LOGO = "/images/benji-logo-2.png";

export default function ChatPageClient({
  searchParams = {},
}: {
  searchParams?: SearchParamsProp;
}) {
  const router = useRouter();
  const topicParam = Array.isArray(searchParams?.topic) ? searchParams.topic[0] : searchParams?.topic;
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);
  const [showTopicButtons, setShowTopicButtons] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingOpener, setIsAddingOpener] = useState(false);
  const lastMessageCountRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const topicFromUrlHandled = useRef<string | null>(null);

  const messages = useQuery(
    api.chat.getMessages,
    sessionId ? { sessionId } : "skip"
  );

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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    const startTime = Date.now();
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = await startSession({});
        setSessionId(activeSessionId);
      }
      
      // Verstuur bericht en genereer antwoord
      const messagePromise = handleUserMessage({ sessionId: activeSessionId, userMessage: messageText });
      
      // Wacht even zodat het gebruikersbericht zichtbaar is
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Zet loading aan - bolletjes verschijnen nu TERWIJL we wachten op antwoord
      setIsLoading(true);
      
      // Wacht op antwoord
      await messagePromise;
      
      // Minimum 3 seconden wachten voor rust in het gesprek
      const elapsed = Date.now() - startTime;
      const minDelay = 3000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleTopicSelect = async (topicId: TopicId, _label: string) => {
    setShowTopicButtons(false);
    const startTime = Date.now();
    try {
      // Zet loading pas aan wanneer we daadwerkelijk wachten op antwoord
      setIsLoading(true);
      setIsAddingOpener(true);
      
      const newSessionId = await startSession({ topic: topicId });
      await addOpenerToSession({ sessionId: newSessionId, topicId });
      setSessionId(newSessionId);
      
      // Minimum 3 seconden wachten voor rust in het gesprek
      const elapsed = Date.now() - startTime;
      const minDelay = 3000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (e) { console.error(e); }
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
      <header className="sticky top-0 z-20 bg-primary-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={{ paddingTop: 'max(1rem, calc(0.75rem + env(safe-area-inset-top)))', paddingBottom: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-top) * 0.1))' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3 min-w-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 min-w-0 group cursor-pointer no-underline outline-none"
            aria-label="Naar hoofdpagina"
          >
            <div className="h-10 sm:h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image src={HEADER_LOGO} alt="" width={56} height={48} className="object-contain h-full w-auto" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="font-semibold text-primary-500 text-sm sm:text-base leading-tight group-hover:text-primary-400">Talk To Benji</span>
              <span className="text-xs sm:text-sm text-primary-500 leading-tight opacity-90">Je luisterend oor in moeilijke tijden</span>
            </div>
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative">
        {/* Achtergrondafbeelding */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/images/achtergrond.png)" }}
          aria-hidden
        />
        {/* Waas ~70% zodat de chat goed leesbaar blijft */}
        <div className="absolute inset-0 bg-white/70 pointer-events-none" aria-hidden />
        {/* Chat-inhoud bovenop */}
        <div className="relative z-10 max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {!sessionId && !isAddingOpener && (
            <WelcomeScreen showTopicButtons={showTopicButtons} onTopicSelect={handleTopicSelect} />
          )}

          <div className="space-y-3 sm:space-y-4">
            {messages?.map((msg: Doc<"chatMessages">) => (
              <div key={msg._id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${msg.role === "user" ? "bg-primary-900 text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"}`}>
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                </div>
              </div>
            ))}
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

      <footer className="bg-primary-900 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0 overflow-visible" style={{ paddingTop: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom) * 0.1))', paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto overflow-visible">
          <div className="flex gap-2 sm:gap-3 overflow-visible">
            {speechSupported && (
              <button type="button" onClick={toggleRecording} disabled={isLoading} className={`p-2.5 sm:p-3 rounded-xl transition-colors flex-shrink-0 ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary-700 text-white hover:bg-primary-600"} disabled:opacity-50`} title={isRecording ? "Stop opname" : "Start spraakopname"}>
                {isRecording ? <Square size={20} /> : <Mic size={20} />}
              </button>
            )}
            <div className="flex-1 relative overflow-visible">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isRecording ? "Luisteren..." : "Typ je vraag..."} suppressHydrationWarning className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 ${isRecording ? "border-red-500 bg-red-50" : "border-gray-300"}`} disabled={isLoading} />
              {isRecording && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></div>}
            </div>
            <button type="submit" disabled={!input.trim() || isLoading} className="p-2.5 sm:p-3 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
              <Send size={20} />
            </button>
          </div>
          {isRecording && <p className="text-xs text-red-300 mt-2 text-center animate-pulse">Spraakopname actief - spreek nu...</p>}
        </form>
      </footer>
    </div>
  );
}

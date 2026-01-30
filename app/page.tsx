"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, User, Mic, Square, Loader2, MessageCircle, LogIn, X } from "lucide-react";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import type { TopicId } from "@/components/chat/TopicButtons";
import { useAuthModal } from "@/lib/AuthModalContext";

/** Na dit aantal gebruikersberichten tonen we de optie om een account aan te maken. (Tijdelijk 2 voor testen; zet later bijv. op 6.) */
const MESSAGES_BEFORE_ACCOUNT_PROMPT = 2;

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { setShowAuthModal } = useAuthModal();
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);
  const [showTopicButtons, setShowTopicButtons] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [accountPromptDismissed, setAccountPromptDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const topicFromUrlHandled = useRef<string | null>(null);
  const linkedSessionRef = useRef<Id<"chatSessions"> | null>(null);

  const messages = useQuery(
    api.chat.getMessages,
    sessionId ? { sessionId } : "skip"
  );

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const searchSuggestions = useQuery(
    api.knowledgeBase.searchQuestions,
    debouncedSearch.length >= 2 && !isLoading
      ? { searchTerm: debouncedSearch, limit: 5 }
      : "skip"
  );

  const [showSuggestions, setShowSuggestions] = useState(true);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const startSession = useMutation(api.chat.startSession);
  const addOpenerToSession = useMutation(api.chat.addOpenerToSession);
  const handleUserMessage = useAction(api.ai.handleUserMessage);
  const linkSessionToUser = useMutation(api.chat.linkSessionToUser);

  const userMessageCount = messages?.filter((m) => m.role === "user").length ?? 0;
  const isLoggedIn = status === "authenticated" && session !== null;
  const showAccountPrompt =
    sessionId &&
    userMessageCount >= MESSAGES_BEFORE_ACCOUNT_PROMPT &&
    !isLoggedIn &&
    !accountPromptDismissed;

  // Bij inloggen: huidige anonieme sessie koppelen aan het account
  useEffect(() => {
    if (
      status !== "authenticated" ||
      !session?.userId ||
      !sessionId ||
      linkedSessionRef.current === sessionId
    ) {
      return;
    }
    const s = session as { userId?: string; user?: { email?: string; name?: string } };
    linkSessionToUser({
      sessionId,
      userId: s.userId!,
      userEmail: s.user?.email,
      userName: s.user?.name,
    }).then(() => {
      linkedSessionRef.current = sessionId;
    });
  }, [status, session, sessionId, linkSessionToUser]);

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "nl-NL";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInput(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setShowTopicButtons(false);
    setInput("");
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = await startSession({});
        setSessionId(activeSessionId);
      }
      await handleUserMessage({
        sessionId: activeSessionId,
        userMessage: text.trim(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = async (topicId: TopicId, _label: string) => {
    setShowTopicButtons(false);
    setIsLoading(true);
    try {
      const newSessionId = await startSession({ topic: topicId });
      await addOpenerToSession({ sessionId: newSessionId, topicId });
      setSessionId(newSessionId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Topic from menu (URL ?topic=...)
  useEffect(() => {
    const topicFromUrl = searchParams.get("topic") as TopicId | null;
    if (!topicFromUrl || topicFromUrlHandled.current === topicFromUrl || isLoading) return;
    topicFromUrlHandled.current = topicFromUrl;
    setShowTopicButtons(false);
    setIsLoading(true);
    (async () => {
      try {
        const newSessionId = await startSession({ topic: topicFromUrl });
        await addOpenerToSession({ sessionId: newSessionId, topicId: topicFromUrl });
        setSessionId(newSessionId);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        router.replace("/");
        topicFromUrlHandled.current = null;
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("topic")]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    await sendMessage(input.trim());
  };

  const handleSuggestionClick = (questionText: string) => {
    setShowSuggestions(false);
    sendMessage(questionText);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col">
      {/* Header */}
      <header className="bg-primary-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 min-w-0 pr-12 sm:pr-14">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="text-white" size={22} strokeWidth={2} />
            </div>
            <h1 className="font-semibold text-white text-sm sm:text-base truncate">Benji</h1>
          </div>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              title="Account aanmaken of inloggen"
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-primary-200 hover:bg-white/10 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Account / Inloggen</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Welcome message when no session */}
          {!sessionId && (
            <WelcomeScreen
              showTopicButtons={showTopicButtons}
              onTopicSelect={handleTopicSelect}
            />
          )}

          {/* Chat messages */}
          <div className="space-y-3 sm:space-y-4">
            {messages?.map((msg: Doc<"chatMessages">) => (
              <div
                key={msg._id}
                className={`flex gap-2 sm:gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "bot" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-white" size={16} strokeWidth={2} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary-900 text-white rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <User className="text-white" size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="text-white animate-spin" size={16} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-sm text-gray-600">Aan het denken...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt om account aan te maken na een aantal berichten */}
          {showAccountPrompt && (
            <div className="mt-4 p-4 bg-[#e8eded] border border-[#5a8a8a]/30 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Wil je je gesprek bewaren?
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Maak een gratis account aan en je gesprekken blijven bewaard.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#5a8a8a] text-white text-sm font-medium hover:bg-[#4a7a7a] transition-colors"
                >
                  <LogIn size={16} />
                  Account aanmaken
                </button>
                <button
                  type="button"
                  onClick={() => setAccountPromptDismissed(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200/80 transition-colors"
                  aria-label="Later"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="bg-primary-900 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0 overflow-visible">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto overflow-visible">
          <div className="flex gap-2 sm:gap-3 overflow-visible">
            {/* Voice input button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-2.5 sm:p-3 rounded-xl transition-colors flex-shrink-0 ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-primary-700 text-white hover:bg-primary-600"
                } disabled:opacity-50`}
                title={isRecording ? "Stop opname" : "Start spraakopname"}
              >
                {isRecording ? <Square size={20} /> : <Mic size={20} />}
              </button>
            )}

            {/* Text input + type-ahead suggesties (dropdown boven het veld zodat hij zichtbaar blijft) */}
            <div className="flex-1 relative overflow-visible">
              {searchSuggestions &&
                searchSuggestions.length > 0 &&
                debouncedSearch.length >= 2 &&
                showSuggestions &&
                !isLoading && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 bottom-full mb-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto"
                  >
                    <p className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">
                      Kies een vraag of typ verder
                    </p>
                    {searchSuggestions.map((q) => (
                      <button
                        key={q._id}
                        type="button"
                        onClick={() => handleSuggestionClick(q.question)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-primary-50 first:rounded-t-lg"
                      >
                        {q.question}
                      </button>
                    ))}
                  </div>
                )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={isRecording ? "Luisteren..." : "Typ je vraag..."}
                suppressHydrationWarning
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                  isRecording ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {isRecording && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 sm:p-3 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </div>

          {/* Recording hint */}
          {isRecording && (
            <p className="text-xs text-red-300 mt-2 text-center animate-pulse">
              Spraakopname actief - spreek nu...
            </p>
          )}
        </form>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col">
          <header className="bg-primary-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto flex items-center gap-3 min-w-0 pr-12 sm:pr-14">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="text-white" size={22} strokeWidth={2} />
              </div>
              <h1 className="font-semibold text-white text-sm sm:text-base truncate">Benji</h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center">
            <div className="text-sm text-gray-500">Laden...</div>
          </main>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
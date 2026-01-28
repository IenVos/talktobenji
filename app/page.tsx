"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, User, Mic, Square, Loader2, MessageCircle, AlertCircle, X } from "lucide-react";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const startSession = useMutation(api.chat.startSession);
  const handleUserMessage = useAction(api.ai.handleUserMessage);

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
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="text-white" size={22} strokeWidth={2} />
            </div>
            <h1 className="font-semibold text-white text-sm sm:text-base truncate">TalkToBenji Chat</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowDisclaimer(true)}
            className="p-2 rounded-full text-white/90 hover:bg-primary-700 hover:text-white transition-colors flex-shrink-0"
            title="Over Benji"
            aria-label="Over Benji"
          >
            <AlertCircle size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Disclaimer modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDisclaimer(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 sm:p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowDisclaimer(false)}
              className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Sluiten"
            >
              <X size={20} />
            </button>
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-primary-600" size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Over Benji</h3>
                <p className="text-xs text-gray-500">Geen professionele hulp</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Ik ben Benji, een AI-chatbot. Ik denk graag met je mee en sta voor je klaar, maar ik bied geen professionele hulp. 
              Bij grote vragen of problemen raad ik altijd aan om professionele hulp te zoeken.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Welcome message when no session */}
          {!sessionId && (
            <div className="text-center py-8 sm:py-16 px-4">
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-primary-700 rounded-xl flex items-center justify-center">
                <MessageCircle className="text-white" size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Welkom bij TalkToBenji
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                Ik ben Benji, je rustige gesprekspartner. <br /> Schrijf of spreek wat je wilt delen.
              </p>
            </div>
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
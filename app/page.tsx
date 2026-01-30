import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import { ChatPageClient } from "./ChatPageClient";

type PageProps = {
  searchParams?: { topic?: string };
};

export default function Page({ searchParams }: PageProps) {
  const topicFromUrl = searchParams?.topic ?? null;
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
      <ChatPageClient topicFromUrl={topicFromUrl} />
    </Suspense>
  );
}

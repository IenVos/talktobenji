import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeaderBar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Pagina niet gevonden</h1>
        <p className="text-gray-600 mb-6">De pagina die je zoekt bestaat niet of is verplaatst.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
        >
          ← Terug naar Benji
        </Link>
      </main>
    </div>
  );
}

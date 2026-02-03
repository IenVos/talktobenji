import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Algemene voorwaarden - Talk To Benji",
  description: "Algemene voorwaarden van Talk To Benji",
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary-900 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-primary-500 hover:text-primary-400 text-sm font-medium">
            ← Terug naar Talk To Benji
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 text-gray-700 text-sm leading-relaxed space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Algemene voorwaarden</h1>
        <p>
          Door Talk To Benji te gebruiken ga je akkoord met onze algemene voorwaarden. Benji is een ondersteunende chatbot en vervangt geen professionele hulp. Bij crisissituaties raden we aan om contact op te nemen met 113 (0800-0113).
        </p>
        <p>
          Voor vragen kun je contact opnemen via{" "}
          <a href="mailto:contact@talktobenji.nl" className="text-primary-600 hover:underline">
            contact@talktobenji.nl
          </a>
          .
        </p>
        <Link href="/" className="inline-block mt-6 text-primary-600 hover:text-primary-700 font-medium">
          ← Terug naar Benji
        </Link>
      </main>
    </div>
  );
}

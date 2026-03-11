"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function NietAlleenBetaaldPage() {
  const { data: session } = useSession();
  const naam = session?.user?.name?.split(" ")[0] || null;

  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Purchase", { value: 37, currency: "EUR" });
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(253,249,244,0.88), rgba(253,249,244,0.88)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Minimale header */}
      <div className="px-6 pt-6 pb-2">
        <a href="https://talktobenji.com">
          <Image
            src="/images/benji-logo-2.png"
            alt="Talk To Benji"
            width={32}
            height={32}
            className="opacity-60 hover:opacity-80 transition-opacity"
          />
        </a>
      </div>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="max-w-lg w-full text-center space-y-8">

          {/* Icoon */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#eef1f6", border: "1px solid #d4dce8" }}
            >
              <Heart size={34} fill="#6d84a8" style={{ color: "#6d84a8" }} />
            </div>
          </div>

          {/* Titel */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "#3d3530" }}>
              {naam ? `Fijn dat je er bent, ${naam}.` : "Fijn dat je er bent."}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460", textWrap: "balance" } as any}>
              Je eerste dag begint morgenochtend. Je ontvangt dan een bericht van Ien
              met alles wat je nodig hebt om te beginnen.
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-6 text-left space-y-2"
            style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "#6d84a8" }}>
              Wat je nu kunt doen:
            </p>
            <ul className="text-sm space-y-2" style={{ color: "#6b6460" }}>
              <li className="flex items-start gap-2">
                <span style={{ color: "#6d84a8", marginTop: 1, flexShrink: 0 }}>→</span>
                Maak vast een account aan zodat je morgen direct kunt beginnen
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#6d84a8", marginTop: 1, flexShrink: 0 }}>→</span>
                Check je inbox — je ontvangt een bevestiging van Ien
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#6d84a8", marginTop: 1, flexShrink: 0 }}>→</span>
                Morgenochtend start dag 1 van jouw 30 dagen
              </li>
            </ul>
          </div>

          {/* Knoppen */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <Link
                href="/niet-alleen"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-medium text-white transition-colors"
                style={{ background: "#6d84a8" }}
              >
                Naar mijn pagina
                <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Link
                  href="/registreren"
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-medium text-white transition-colors"
                  style={{ background: "#6d84a8" }}
                >
                  Account aanmaken
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/inloggen"
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-medium border transition-colors"
                  style={{ color: "#6b6460", borderColor: "#d4ccc4", background: "white" }}
                >
                  Al een account? Inloggen
                </Link>
              </>
            )}
          </div>

          <p className="text-xs" style={{ color: "#8a8078" }}>
            Heb je vragen? Mail ons op{" "}
            <a
              href="mailto:contactmetien@talktobenji.com"
              style={{ color: "#6d84a8" }}
            >
              contactmetien@talktobenji.com
            </a>
          </p>

        </div>
      </main>
    </div>
  );
}

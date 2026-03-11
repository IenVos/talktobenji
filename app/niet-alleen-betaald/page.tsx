"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
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
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "#3d3530" }}>
              {naam ? `Goed dat je er bent, ${naam}.` : "Goed dat je er bent."}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460", textWrap: "balance" } as any}>
              Je betaling is gelukt. Je ontvangt binnen enkele minuten een mail van Ien
              met alles wat je nodig hebt.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#8a8078", textWrap: "balance" } as any}>
              Je hoeft nu niets te doen. Laat het maar even landen.
            </p>
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

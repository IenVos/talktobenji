"use client";

/**
 * Landingspunt van de één-klik-link uit de Even Houvast Benji-mail.
 * Leest ?token= uit de URL, wisselt het in via de "benji-token"-login (die bij
 * Convex het account + de 7-daagse trial aanmaakt) en stuurt door naar Benji.
 * Geen wachtwoord nodig. Bestaande login-flows blijven ongemoeid.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

function BenjiStartInner() {
  const params = useSearchParams();
  const convex = useConvex();
  const token = (params?.get("token") || "").trim();
  const [status, setStatus] = useState<"bezig" | "fout">("bezig");
  const gestart = useRef(false);

  useEffect(() => {
    if (gestart.current) return; // maar één keer inwisselen
    gestart.current = true;
    if (!token) {
      setStatus("fout");
      return;
    }
    (async () => {
      try {
        const res = await signIn("benji-token", { token, redirect: false });
        if (res?.ok && !res.error) {
          // Beslis HIER waar we heen gaan, vóór /benji laadt. Een terugkerende
          // gebruiker (heeft al gepraat / geen verse EH-lead) gaat rechtstreeks naar
          // het account, zonder dat het chatscherm ertussendoor flitst. Een verse
          // EH-lead gaat direct de verliestype-chat in via ?start=eh. De query werkt
          // op het token (zelf het geheim), dus vóórdat de sessie is doorgedrongen.
          let bestemming: "chat" | "account" = "chat";
          try {
            const r = await convex.query(api.benjiStart.routeNaStart, { token });
            if (r?.bestemming === "account") bestemming = "account";
          } catch {
            // Bij twijfel: naar /benji?start=eh; daar wordt alsnog veilig beslist.
          }
          // Harde navigatie zodat de nieuwe sessie meteen geladen is.
          window.location.href = bestemming === "account" ? "/account" : "/benji?start=eh";
        } else {
          setStatus("fout");
        }
      } catch {
        setStatus("fout");
      }
    })();
  }, [token, convex]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fdf9f4",
        padding: "24px",
        fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        color: "#3d3530",
      }}
    >
      {status === "bezig" ? (
        <div style={{ textAlign: "center", maxWidth: "340px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              margin: "0 auto 20px",
              border: "3px solid rgba(109,132,168,.25)",
              borderTopColor: "#6d84a8",
              borderRadius: "50%",
              animation: "benjiSpin 0.9s linear infinite",
            }}
          />
          <p style={{ fontSize: "16px", lineHeight: 1.6, color: "#6b6460", margin: 0 }}>
            Even Benji voor je klaarzetten...
          </p>
          <style>{`@keyframes benjiSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <p style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 10px" }}>
            Deze link werkt niet meer
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#6b6460", margin: "0 0 22px" }}>
            De link is zeven dagen geldig. Heb je al een wachtwoord ingesteld? Log dan
            gewoon in. Anders kun je de mail van Ien beantwoorden, dan sturen we je een
            nieuwe link.
          </p>
          <Link
            href="/inloggen"
            style={{
              display: "inline-block",
              background: "#6d84a8",
              color: "#ffffff",
              padding: "12px 26px",
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Inloggen
          </Link>
        </div>
      )}
    </main>
  );
}

export default function BenjiStartPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100dvh", background: "#fdf9f4" }} />
      }
    >
      <BenjiStartInner />
    </Suspense>
  );
}

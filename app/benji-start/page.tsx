"use client";

/**
 * Landingspunt van de één-klik-link uit de Even Houvast Benji-mail.
 * Leest ?token= uit de URL, wisselt het in via de "benji-token"-login (die bij
 * Convex het account + de 7-daagse trial aanmaakt) en stuurt door naar Benji.
 * Geen wachtwoord nodig. Bestaande login-flows blijven ongemoeid.
 */

import { Suspense, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

function BenjiStartInner() {
  const params = useSearchParams();
  const convex = useConvex();
  const token = (params?.get("token") || "").trim();
  // "o=brief" markeert dat de klik uit de persoonlijke brief komt. We geven dit door
  // aan de chat (?start=brief) zodat Benji opent met een brugzin die de brief erkent.
  // Andere Benji-links (opvolgmails, evergreen, funnel) hebben deze tag niet.
  const opener = (params?.get("o") || "").trim();
  const gestart = useRef(false);

  useEffect(() => {
    if (gestart.current) return; // maar één keer inwisselen
    gestart.current = true;
    // Geen token in de URL: gewoon door naar de publieke Benji-pagina.
    if (!token) {
      window.location.href = "/benji";
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
          const chatUrl = opener === "brief" ? "/benji?start=brief" : "/benji?start=eh";
          window.location.href = bestemming === "account" ? "/account" : chatUrl;
        } else {
          // Token verlopen of ongeldig (na de 7 dagen). Geen doodlopend scherm meer:
          // stuur de warme lead gewoon door naar de publieke Benji-pagina.
          window.location.href = "/benji";
        }
      } catch {
        window.location.href = "/benji";
      }
    })();
  }, [token, opener, convex]);

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

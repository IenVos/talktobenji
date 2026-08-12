"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const ANON_KEY = "benji_anonymous_id";

/**
 * Koppelt anonieme gesprekken aan het account zodra iemand is ingelogd.
 *
 * Draait globaal (in de layout, binnen ConvexClientProvider). Zodra de gebruiker
 * geauthenticeerd is en er nog een anonymousId in localStorage staat, worden de
 * bijbehorende anonieme sessies (gesprek + geheugen) aan het account gekoppeld.
 * Dekt zowel e-mail- als Google-registratie. De userId wordt server-side uit de
 * JWT gehaald; de client geeft alleen de anonymousId mee.
 */
export function AnonymousSessionClaimer() {
  const { status } = useSession();
  const claim = useMutation(api.chat.claimAnonymousSessions);
  const inFlight = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || inFlight.current) return;

    let anonId: string | null = null;
    try {
      anonId = localStorage.getItem(ANON_KEY);
      if (anonId && localStorage.getItem("benji_anon_claimed") === anonId) return;
    } catch {
      return;
    }
    if (!anonId) return;

    inFlight.current = true;
    claim({ anonymousId: anonId })
      .then((res) => {
        // Alleen als de server echt geauthenticeerd was markeren we het als afgehandeld;
        // anders mag de volgende render het opnieuw proberen (token nog niet klaar).
        if (res?.authed) {
          try { localStorage.setItem("benji_anon_claimed", anonId!); } catch {}
        } else {
          inFlight.current = false;
        }
      })
      .catch(() => {
        inFlight.current = false;
      });
  }, [status, claim]);

  return null;
}

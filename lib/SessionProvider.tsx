"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      refetchInterval={0} // Geen automatische refetch (bespaart requests)
      refetchOnWindowFocus={true} // Refetch wanneer gebruiker terugkomt naar tab
    >
      {children}
    </NextAuthSessionProvider>
  );
}

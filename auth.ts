/**
 * NextAuth config: e-mail/wachtwoord (Credentials) + JWT voor Convex.
 */
import { SignJWT, importPKCS8 } from "jose";
import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { compare } from "bcryptjs";

// Convex verwacht issuer = CONVEX_SITE_URL (bijv. https://xxx.convex.site)
const CONVEX_SITE_URL = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(
  /\.cloud$/,
  ".site"
);

const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "E-mail en wachtwoord",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !adapterSecret) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Auth] Missing credentials or adapterSecret:", {
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password,
              hasAdapterSecret: !!adapterSecret,
            });
          }
          return null;
        }
        
        // Debug logging - uitgebreid
        console.log("[Auth] Debug authorize - Secret details:");
        console.log("  - adapterSecret exists?", !!adapterSecret);
        console.log("  - adapterSecret type:", typeof adapterSecret);
        console.log("  - adapterSecret length:", adapterSecret?.length || 0);
        console.log("  - adapterSecret first 15:", adapterSecret?.substring(0, 15) || "N/A");
        console.log("  - adapterSecret last 10:", adapterSecret?.substring(adapterSecret.length - 10) || "N/A");
        console.log("  - adapterSecret JSON:", JSON.stringify(adapterSecret?.substring(0, 20)));

        // Zorg ervoor dat secret een string is en geen extra whitespace heeft
        const cleanSecret = String(adapterSecret || "").trim();
        
        console.log("[Auth] Clean secret:");
        console.log("  - cleanSecret length:", cleanSecret.length);
        console.log("  - cleanSecret first 15:", cleanSecret.substring(0, 15));
        
        const cred = await fetchQuery(api.credentials.getCredentialsByEmail, {
          secret: cleanSecret, // Gebruik de cleaned secret
          email: credentials.email.trim(),
        });
        if (!cred || !cred.hashedPassword) {
          return null;
        }
        const valid = await compare(credentials.password, cred.hashedPassword);
        if (!valid) {
          return null;
        }
        return {
          id: cred.userId as string,
          email: cred.email,
          name: cred.name ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dagen
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = token.userId as string | undefined;
      if (userId) {
        (session as SessionWithUserId).userId = userId;
      }
      const privateKeyPem = process.env.CONVEX_AUTH_PRIVATE_KEY;
      if (!privateKeyPem || !userId) {
        return { ...session, convexToken: null };
      }
      const privateKey = await importPKCS8(privateKeyPem, "RS256");
      const convexToken = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setIssuer(CONVEX_SITE_URL)
        .setAudience("convex")
        .setExpirationTime("1h")
        .sign(privateKey);
      return { ...session, convexToken };
    },
    async redirect({ url, baseUrl }) {
      // Als er een callbackUrl is, gebruik die
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Als url al een volledige URL is en op hetzelfde domein, gebruik die
      if (url.startsWith(baseUrl)) return url;
      // Anders redirect naar account pagina
      return `${baseUrl}/account/gesprekken`;
    },
  },
  pages: {
    signIn: "/inloggen",
    error: "/inloggen",
  },
};

export type SessionWithUserId = { userId?: string; convexToken?: string | null };

declare module "next-auth" {
  interface Session extends SessionWithUserId {
    convexToken?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}

export async function auth() {
  const { getServerSession } = await import("next-auth/next");
  return getServerSession(authOptions);
}

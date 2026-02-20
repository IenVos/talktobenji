/**
 * NextAuth config: e-mail/wachtwoord (Credentials) + JWT voor Convex.
 */
import { SignJWT, importPKCS8 } from "jose";
import NextAuth, { type AuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { compare } from "bcryptjs";

const SESSION_CHECK_INTERVAL_MS = 10 * 60 * 1000; // elke 10 minuten controleren

// Convex verwacht issuer = CONVEX_SITE_URL (bijv. https://xxx.convex.site)
const CONVEX_SITE_URL = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(
  /\.cloud$/,
  ".site"
);

const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;

export const authOptions: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  // ← VERWIJDER useSecureCookies en cookies config volledig
  
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "E-mail en wachtwoord",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password || !adapterSecret) {
          return null;
        }
        const cleanSecret = String(adapterSecret || "").trim();
        const cred = await fetchQuery(api.credentials.getCredentialsByEmail, {
          secret: cleanSecret,
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
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        token.issuedAt = Date.now();
        token.lastChecked = Date.now();
      }

      // Sessie-update na naam- of e-mailwijziging
      if (trigger === "update") {
        if (session?.name) token.name = session.name;
        if (session?.email) token.email = session.email;
      }

      // Periodiek controleren of wachtwoord is gewijzigd na uitgifte van token
      if (!user && token.userId && token.email) {
        const lastChecked = (token.lastChecked as number) ?? 0;
        if (Date.now() - lastChecked > SESSION_CHECK_INTERVAL_MS) {
          try {
            const cleanSecret = String(adapterSecret || "").trim();
            const passwordChangedAt = await fetchQuery(
              api.credentials.getPasswordChangedAt,
              { secret: cleanSecret, email: token.email as string }
            );
            token.lastChecked = Date.now();
            if (passwordChangedAt && passwordChangedAt > ((token.issuedAt as number) ?? 0)) {
              token.forceLogout = true;
            }
          } catch {
            // Bij fout sessie intact laten
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.forceLogout) {
        session.forceLogout = true;
        return session;
      }

      const userId = token.userId as string | undefined;
      
      if (userId) {
        session.userId = userId;
        session.user = session.user || {};
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }

      const rawKey = process.env.CONVEX_AUTH_PRIVATE_KEY;
      if (!rawKey || !userId) {
        session.convexToken = null;
        return session;
      }

      try {
        // Normaliseer PEM: Vercel slaat \n op als letterlijke tekst, niet als newlines
        const privateKeyPem = rawKey.replace(/\\n/g, "\n");
        const privateKey = await importPKCS8(privateKeyPem, "RS256");
        const convexToken = await new SignJWT({ sub: userId })
          .setProtectedHeader({ alg: "RS256" })
          .setIssuedAt()
          .setIssuer(CONVEX_SITE_URL)
          .setAudience("convex")
          .setExpirationTime("1h")
          .sign(privateKey);

        session.convexToken = convexToken;
      } catch (e) {
        console.error("Convex token signing failed:", e);
        session.convexToken = null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/account`;
    },
  },
  pages: {
    signIn: "/inloggen",
    error: "/inloggen",
  },
  debug: process.env.NODE_ENV === "development",
};


// TypeScript declarations
declare module "next-auth" {
  interface Session {
    userId?: string;
    convexToken?: string | null;
    forceLogout?: boolean;
    user: {
      email?: string | null;
      name?: string | null;
    };
  }
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    issuedAt?: number;
    lastChecked?: number;
    forceLogout?: boolean;
  }
}

export async function auth() {
  const { getServerSession } = await import("next-auth/next");
  return getServerSession(authOptions);
}
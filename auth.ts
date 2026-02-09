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

// Cookie domain: .talktobenji.com zodat cookie werkt op zowel www als non-www
const isProduction = process.env.NODE_ENV === "production";
const cookieDomain =
  isProduction && process.env.NEXTAUTH_URL
    ? "." + new URL(process.env.NEXTAUTH_URL).hostname.replace(/^www\./, "")
    : undefined;

export const authOptions: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
        domain: cookieDomain,
      },
    },
  },
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
          return null;
        }
        const cleanSecret = String(adapterSecret || "").trim();
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
      return `${baseUrl}/account`;
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

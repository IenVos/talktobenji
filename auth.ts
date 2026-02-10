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

// Convex verwacht issuer = CONVEX_SITE_URL (bijv. https://xxx.convex.site)
const CONVEX_SITE_URL = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(
  /\.cloud$/,
  ".site"
);

const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;

export const authOptions: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  useSecureCookies: false,
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
    maxAge: 30 * 24 * 60 * 60, // 30 dagen
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = token.userId as string | undefined;
      
      // Zet userId en user info op session
      if (userId) {
        session.userId = userId;
        session.user = session.user || {};
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }

      // Genereer Convex token
      const privateKeyPem = process.env.CONVEX_AUTH_PRIVATE_KEY;
      if (!privateKeyPem || !userId) {
        session.convexToken = null;
        return session; // ← Return originele session object
      }

      const privateKey = await importPKCS8(privateKeyPem, "RS256");
      const convexToken = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setIssuer(CONVEX_SITE_URL)
        .setAudience("convex")
        .setExpirationTime("1h")
        .sign(privateKey);
      
      session.convexToken = convexToken;
      return session; // ← Return originele session object
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
  debug: process.env.NODE_ENV === "development",
};

// TypeScript declarations
declare module "next-auth" {
  interface Session {
    userId?: string;
    convexToken?: string | null;
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
  }
}

export async function auth() {
  const { getServerSession } = await import("next-auth/next");
  return getServerSession(authOptions);
}
import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { compare } from "bcryptjs";
import { encode } from "next-auth/jwt";

/**
 * Custom login endpoint dat de sessie-cookie handmatig zet.
 * Omzeilt het NextAuth CredentialsProvider cookie-probleem.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail en wachtwoord zijn verplicht" }, { status: 400 });
    }

    const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
    if (!adapterSecret) {
      return NextResponse.json({ error: "Server configuratie fout" }, { status: 500 });
    }

    // Haal credentials op via Convex
    const cred = await fetchQuery(api.credentials.getCredentialsByEmail, {
      secret: String(adapterSecret).trim(),
      email: email.trim().toLowerCase(),
    });

    if (!cred || !cred.hashedPassword) {
      return NextResponse.json({ error: "Ongeldig e-mailadres of wachtwoord" }, { status: 401 });
    }

    // Verifieer wachtwoord
    const valid = await compare(password, cred.hashedPassword);
    if (!valid) {
      return NextResponse.json({ error: "Ongeldig e-mailadres of wachtwoord" }, { status: 401 });
    }

    // Maak JWT token aan (zelfde formaat als NextAuth)
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server configuratie fout" }, { status: 500 });
    }

    const token = await encode({
      token: {
        sub: cred.userId as string,
        userId: cred.userId as string,
        email: cred.email,
        name: cred.name ?? null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 dagen
      },
      secret,
    });

    // Zet de sessie-cookie handmatig
    const useSecureCookies = (process.env.NEXTAUTH_URL || "").startsWith("https://");
    const cookieName = useSecureCookies
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.json({
      ok: true,
      userId: cred.userId,
      email: cred.email,
      name: cred.name,
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 dagen
    });

    return response;
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { compare } from "bcryptjs";
import { encode } from "next-auth/jwt";
import { rateLimit } from "@/lib/rate-limit";

async function handleLogin(email: string, password: string, callbackUrl: string) {
  if (!email || !password) {
    return { error: "E-mail en wachtwoord zijn verplicht" };
  }

  const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  if (!adapterSecret) {
    return { error: "Server configuratie fout" };
  }

  const cred = await fetchQuery(api.credentials.getCredentialsByEmail, {
    secret: String(adapterSecret).trim(),
    email: email.trim().toLowerCase(),
  });

  if (!cred || !cred.hashedPassword) {
    return { error: "Ongeldig e-mailadres of wachtwoord" };
  }

  const valid = await compare(password, cred.hashedPassword);
  if (!valid) {
    return { error: "Ongeldig e-mailadres of wachtwoord" };
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { error: "Server configuratie fout" };
  }

  const token = await encode({
    token: {
      sub: cred.userId as string,
      userId: cred.userId as string,
      email: cred.email,
      name: cred.name ?? null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    secret,
  });

  return { ok: true, token, callbackUrl };
}

/**
 * Native form POST: zet cookie via 302 redirect (browser handelt cookie af, geen JS nodig).
 * Dit is de meest betrouwbare manier om cookies te zetten.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Te veel inlogpogingen. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    let email: string, password: string, callbackUrl: string;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Native form POST
      const formData = await request.formData();
      email = formData.get("email") as string;
      password = formData.get("password") as string;
      callbackUrl = (formData.get("callbackUrl") as string) || "/account";
    } else {
      // JSON fetch (fallback)
      const body = await request.json();
      email = body.email;
      password = body.password;
      callbackUrl = body.callbackUrl || "/account";
    }

    const result = await handleLogin(email, password, callbackUrl);

    if (result.error) {
      if (contentType.includes("application/x-www-form-urlencoded")) {
        // Redirect terug naar login met error
        const errorUrl = new URL("/inloggen", request.url);
        errorUrl.searchParams.set("error", result.error);
        return NextResponse.redirect(errorUrl, 303);
      }
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Cookie naam (matched useSecureCookies: false in auth.ts)
    const cookieName = "next-auth.session-token";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Native form: redirect naar account met cookie
      const redirectUrl = new URL(result.callbackUrl!, request.url);
      const response = NextResponse.redirect(redirectUrl, 303);
      response.cookies.set(cookieName, result.token!, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      return response;
    }

    // JSON fetch: return cookie in response
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, result.token!, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

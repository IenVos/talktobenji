import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { encode } from "next-auth/jwt";

/**
 * Tijdelijke debug endpoint om sessie-problemen te diagnosticeren.
 * Verwijder dit bestand na het oplossen van het probleem.
 */
export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const sessionCookies = cookies.filter((c) =>
    c.name.includes("next-auth") || c.name.includes("session")
  );

  let serverSession = null;
  let sessionError = null;
  try {
    serverSession = await getServerSession(authOptions);
  } catch (e: any) {
    sessionError = e.message;
  }

  // Test: kan de JWT encoder werken met het huidige secret?
  let jwtTestResult = null;
  let jwtTestError = null;
  try {
    const testToken = await encode({
      token: { sub: "test-user", userId: "test" },
      secret: process.env.AUTH_SECRET || "",
    });
    jwtTestResult = {
      success: true,
      tokenLength: testToken?.length || 0,
      tokenPreview: testToken?.substring(0, 30) + "...",
    };
  } catch (e: any) {
    jwtTestError = e.message;
  }

  // Check welke cookie-naam NextAuth zou gebruiken
  const useSecureCookies = (process.env.NEXTAUTH_URL || "").startsWith("https://");
  const expectedCookieName = useSecureCookies
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const response = NextResponse.json({
    timestamp: new Date().toISOString(),
    url: request.url,
    host: request.headers.get("host"),
    nextauthUrl: process.env.NEXTAUTH_URL || "(not set)",
    nodeEnv: process.env.NODE_ENV,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    hasPrivateKey: !!process.env.CONVEX_AUTH_PRIVATE_KEY,
    useSecureCookies,
    expectedCookieName,
    allCookieNames: cookies.map((c) => c.name),
    sessionCookies: sessionCookies.map((c) => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      valuePreview: c.value?.substring(0, 20) + "...",
    })),
    serverSession: serverSession
      ? { userId: (serverSession as any).userId, hasUser: !!serverSession.user, email: serverSession.user?.email }
      : null,
    sessionError,
    jwtTest: jwtTestResult || { error: jwtTestError },
  });

  // Test: zet een testcookie om te zien of cookie-setting werkt op Vercel
  response.cookies.set("__test-session-debug", "works", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });

  return response;
}

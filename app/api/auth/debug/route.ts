import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

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

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    url: request.url,
    host: request.headers.get("host"),
    nextauthUrl: process.env.NEXTAUTH_URL || "(not set)",
    nodeEnv: process.env.NODE_ENV,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasPrivateKey: !!process.env.CONVEX_AUTH_PRIVATE_KEY,
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
  });
}

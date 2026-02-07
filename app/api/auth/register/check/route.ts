/**
 * Controleert of de register-configuratie klopt (alleen in development).
 * GET /api/auth/register/check
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, message: "Alleen in development" });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;

  const convexUrlSet = !!convexUrl?.trim();
  const adapterSecretSet = !!adapterSecret?.trim();

  let message = "";
  if (!convexUrlSet) {
    message =
      "NEXT_PUBLIC_CONVEX_URL ontbreekt. Draai 'npx convex dev' – die zet het automatisch in .env.local.";
  } else if (!adapterSecretSet) {
    message =
      "CONVEX_AUTH_ADAPTER_SECRET ontbreekt. Gebruik: npm run setup:adapter-secret";
  } else {
    message =
      "Env-variabelen zijn gezet. Zorg dat CONVEX_AUTH_ADAPTER_SECRET ook in Convex staat (zelfde waarde).";
  }

  return NextResponse.json({
    ok: convexUrlSet && adapterSecretSet,
    convexUrlSet,
    adapterSecretSet,
    convexUrlPreview: convexUrlSet ? `${convexUrl?.slice(0, 30)}...` : null,
    adapterSecretPreview: adapterSecretSet ? `${adapterSecret?.substring(0, 10)}... (length: ${adapterSecret?.length})` : null,
    message,
    // Debug info (alleen in development)
    debug: process.env.NODE_ENV === "development" ? {
      adapterSecretLength: adapterSecret?.length || 0,
      adapterSecretFirstChars: adapterSecret?.substring(0, 15) || "N/A",
      adapterSecretLastChars: adapterSecret?.substring(adapterSecret.length - 5) || "N/A",
    } : undefined,
  });
}

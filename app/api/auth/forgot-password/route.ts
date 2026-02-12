import { NextResponse, NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Wachtwoord vergeten: neemt e-mailadres aan en stuurt resetlink.
 * Voor nu: altijd success (om te voorkomen dat we verraden of een e-mail bestaat).
 * Voeg later e-mailverzending toe (bijv. Resend) + Convex tabel voor reset-tokens.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 3, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
    }

    // TODO: Controleer of e-mail bestaat in credentials, maak reset-token aan,
    // stuur e-mail met link naar /wachtwoord-resetten?token=xxx
    // Voor nu: altijd succesvol antwoord (security: verraad niet of email bestaat)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { rateLimit, retryAfterMessage } from "@/lib/rate-limit";
import { addToMailerLite } from "@/lib/mailerlite";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`houvast-brief:${ip}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();
  const { email, name, verliesType, antwoorden, fotos, honeypot } = body ?? {};

  // Honeypot: alleen bots vullen dit verborgen veld in → doe alsof het lukte.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }
  if (!Array.isArray(antwoorden) || antwoorden.length === 0) {
    return NextResponse.json({ error: "Geen antwoorden meegegeven" }, { status: 400 });
  }

  // Sanitize de antwoorden tot { vraag, antwoord }-paren.
  const schoon = antwoorden
    .filter((a: any) => a && typeof a.vraag === "string" && typeof a.antwoord === "string")
    .map((a: any) => ({ vraag: a.vraag.slice(0, 500), antwoord: a.antwoord.slice(0, 4000) }));

  // Foto's: alleen base64 data-URL's, max 5, elk tot ~3MB (om de request behapbaar te houden).
  const schoneFotos: string[] = Array.isArray(fotos)
    ? fotos
        .filter((f: any) => typeof f === "string" && f.startsWith("data:image/") && f.length < 4_000_000)
        .slice(0, 5)
    : [];

  try {
    await convex.action(api.houvast.genereerEnVerstuurBrief, {
      email,
      naam: name && typeof name === "string" ? name.trim() : undefined,
      verliesType: verliesType && typeof verliesType === "string" ? verliesType : undefined,
      antwoorden: schoon,
      fotos: schoneFotos.length > 0 ? schoneFotos : undefined,
    });

    // MailerLite — voeg toe aan de aparte groep "Even Houvast" (NIET de Gratis-groep).
    // Die Gratis-groep triggert de MailerLite-automation; deze leads krijgen al de
    // eigen Even Houvast-opvolgreeks, dus ze gaan in een groep zonder automation.
    const mailerLiteGroep = process.env.MAILERLITE_GROUP_EVEN_HOUVAST;
    if (mailerLiteGroep) {
      await addToMailerLite({
        email,
        name: name ?? "",
        groups: [mailerLiteGroep],
        context: "houvast-brief",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[houvast/brief] Fout:", err?.message);
    // Al een brief verstuurd naar dit adres → vriendelijke melding (geen 500).
    if (typeof err?.message === "string" && err.message.includes("al een brief")) {
      return NextResponse.json({ error: "Je hebt op dit e-mailadres al een brief ontvangen.", code: "al_verzonden" }, { status: 409 });
    }
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}

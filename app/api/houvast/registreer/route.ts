import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { rateLimit, retryAfterMessage } from "@/lib/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`houvast:${ip}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel aanmeldingen. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();
  const { email, name } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  try {
    await convex.action(api.houvast.registreer, {
      email,
      name: name && typeof name === "string" ? name.trim() : undefined,
    });

    // MailerLite — voeg toe aan groep Gratis-gebruikers
    const mailerLiteKey = process.env.MAILERLITE_API_KEY;
    const mailerLiteGroep = process.env.MAILERLITE_GROUP_GRATIS;
    if (mailerLiteKey && mailerLiteGroep) {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mailerLiteKey}` },
        body: JSON.stringify({ email, fields: { name: name ?? "" }, groups: [mailerLiteGroep] }),
      }).catch((err) => console.error("[MailerLite] Fout bij houvast registratie:", err));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[houvast/registreer] Fout:", err?.message);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { rateLimit, retryAfterMessage } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel registratiepogingen. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  try {
    const { email, password, name, source } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Vul een geldig e-mailadres in" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8 || password.length > 256) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 en maximaal 256 tekens zijn" },
        { status: 400 }
      );
    }

    if (!adapterSecret) {
      console.error("CONVEX_AUTH_ADAPTER_SECRET niet geconfigureerd");
      return NextResponse.json(
        { error: "Registratie is tijdelijk niet beschikbaar (geen adapter secret)" },
        { status: 500 }
      );
    }

    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL niet geconfigureerd");
      return NextResponse.json(
        { error: "Registratie is tijdelijk niet beschikbaar (geen Convex URL)" },
        { status: 500 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const cleanSecret = String(adapterSecret || "").trim();

    const isHouvast = source === "houvast";

    const userId = await fetchMutation(
      api.credentials.createUserWithPassword,
      {
        secret: cleanSecret,
        email: email.trim().toLowerCase(),
        name: (name || "").trim() || email.trim().split("@")[0],
        hashedPassword,
        emailVerified: isHouvast ? true : undefined,
      },
      { url: convexUrl }
    );

    // MailerLite — voeg toe aan groep Gratis-gebruikers
    const mailerLiteKey = process.env.MAILERLITE_API_KEY;
    const mailerLiteGroep = process.env.MAILERLITE_GROUP_GRATIS;
    if (mailerLiteKey && mailerLiteGroep) {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailerLiteKey}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fields: { name: (name || "").trim() || email.trim().split("@")[0] },
          groups: [mailerLiteGroep],
        }),
      }).catch((err) => console.error("[MailerLite] Fout bij registratie:", err));
    }

    return NextResponse.json({
      success: true,
      userId,
      email: email.trim().toLowerCase(),
    });
  } catch (error: unknown) {
    const err = error as { message?: string; data?: unknown; stack?: string };
    const message = err?.message ?? "Onbekende fout";

    if (process.env.NODE_ENV === "development") {
      console.error("Register Convex error:", {
        message,
        data: err?.data,
        fullError: String(error),
      });
    }

    if (message.includes("al in gebruik")) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al in gebruik" },
        { status: 409 }
      );
    }

    if (message.includes("secret") || message.includes("Secret")) {
      console.error("[Register] CONVEX_AUTH_ADAPTER_SECRET mismatch — controleer Vercel env vars en Convex dashboard");
      return NextResponse.json(
        { error: "Registratie is tijdelijk niet beschikbaar. Probeer het later opnieuw." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Registratie mislukt: ${message}`
            : "Registratie mislukt. Probeer het later opnieuw.",
      },
      { status: 500 }
    );
  }
}

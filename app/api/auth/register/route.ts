import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET;

    if (!secret) {
      console.error("[register] CONVEX_AUTH_ADAPTER_SECRET ontbreekt op de server.");
      return NextResponse.json(
        { error: "Registreren is tijdelijk niet mogelijk. Probeer het later of neem contact op." },
        { status: 503 }
      );
    }

    if (!trimmedEmail) {
      return NextResponse.json(
        { error: "Vul je e-mailadres in." },
        { status: 400 }
      );
    }

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Vul je naam in." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Vul een wachtwoord in." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 tekens zijn." },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);
    await fetchMutation(api.credentials.createUserWithPassword, {
      secret,
      email: trimmedEmail,
      name: trimmedName,
      hashedPassword,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Registreren mislukt.";
    console.error("[register] Error:", e);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

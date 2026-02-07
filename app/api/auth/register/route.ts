import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const adapterSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  try {
    const { email, password, name } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Vul een geldig e-mailadres in" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 tekens zijn" },
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

    // Debug logging - uitgebreid
    console.log("[Register] Debug - Secret details:");
    console.log("  - adapterSecret exists?", !!adapterSecret);
    console.log("  - adapterSecret type:", typeof adapterSecret);
    console.log("  - adapterSecret length:", adapterSecret?.length || 0);
    console.log("  - adapterSecret first 15:", adapterSecret?.substring(0, 15) || "N/A");
    console.log("  - adapterSecret last 10:", adapterSecret?.substring(adapterSecret.length - 10) || "N/A");
    console.log("  - adapterSecret JSON:", JSON.stringify(adapterSecret?.substring(0, 20)));

    // Zorg ervoor dat secret een string is en geen extra whitespace heeft
    const cleanSecret = String(adapterSecret || "").trim();
    
    console.log("[Register] Clean secret:");
    console.log("  - cleanSecret length:", cleanSecret.length);
    console.log("  - cleanSecret first 15:", cleanSecret.substring(0, 15));

    const userId = await fetchMutation(
      api.credentials.createUserWithPassword,
      {
        secret: cleanSecret, // Gebruik de cleaned secret
        email: email.trim().toLowerCase(),
        name: (name || "").trim() || email.trim().split("@")[0],
        hashedPassword,
      },
      { url: convexUrl }
    );

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
      return NextResponse.json(
        {
          error:
            "CONVEX_AUTH_ADAPTER_SECRET klopt niet. Zet dezelfde waarde in .env.local én in Convex (npx convex env set CONVEX_AUTH_ADAPTER_SECRET \"waarde\").",
        },
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

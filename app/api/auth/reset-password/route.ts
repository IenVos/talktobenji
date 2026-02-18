import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ error: "Token en wachtwoord zijn verplicht" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Wachtwoord moet minimaal 8 tekens zijn" }, { status: 400 });
    }

    // Hash nieuw wachtwoord
    const hashedPassword = await bcrypt.hash(password, 10);

    // Hash het ontvangen token om te vergelijken met de opgeslagen hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Reset wachtwoord via Convex
    await convex.mutation(api.credentials.resetPassword, {
      secret,
      token: hashedToken,
      hashedPassword,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const msg = error?.message || "Er ging iets mis";
    if (msg.includes("ongeldig") || msg.includes("verlopen")) {
      return NextResponse.json({ error: "De resetlink is ongeldig of verlopen. Vraag een nieuwe aan." }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

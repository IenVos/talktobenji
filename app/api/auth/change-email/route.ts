import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newEmail = typeof body?.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";

    if (!currentPassword || !newEmail) {
      return NextResponse.json({ error: "Vul alle velden in" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }

    // Verifieer huidig wachtwoord
    const cred = await convex.query(api.credentials.getCredentialsByEmail, {
      secret,
      email: session.user?.email || "",
    });

    if (!cred) {
      return NextResponse.json({ error: "Account niet gevonden" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, cred.hashedPassword);
    if (!valid) {
      return NextResponse.json({ error: "Wachtwoord is onjuist" }, { status: 400 });
    }

    if (newEmail === cred.email?.toLowerCase()) {
      return NextResponse.json({ error: "Dit is al je huidige e-mailadres" }, { status: 400 });
    }

    await convex.mutation(api.credentials.changeEmail, {
      secret,
      userId: session.userId,
      newEmail,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Change email error:", error);
    const msg = error?.message || "";
    if (msg.includes("al in gebruik")) {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 400 });
    }
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

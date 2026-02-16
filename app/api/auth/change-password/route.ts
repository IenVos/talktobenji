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
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Vul beide wachtwoorden in" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Nieuw wachtwoord moet minimaal 8 tekens zijn" }, { status: 400 });
    }

    // Haal huidige credentials op
    const cred = await convex.query(api.credentials.getCredentialsByEmail, {
      secret,
      email: session.user?.email || "",
    });

    if (!cred) {
      return NextResponse.json({ error: "Account niet gevonden" }, { status: 404 });
    }

    // Verifieer huidig wachtwoord
    const valid = await bcrypt.compare(currentPassword, cred.hashedPassword);
    if (!valid) {
      return NextResponse.json({ error: "Huidig wachtwoord is onjuist" }, { status: 400 });
    }

    // Hash nieuw wachtwoord en sla op
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await convex.mutation(api.credentials.changePassword, {
      secret,
      userId: session.userId,
      hashedPassword,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

/**
 * Interne API route — wordt aangeroepen door de KennisShop webhook
 * om het Niet Alleen profiel aan te maken en de welkomstmail te sturen.
 */
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, naam, userId, webhookSecret } = body;

  if (!webhookSecret || webhookSecret !== process.env.KENNISSHOP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!email || !naam || !userId) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  try {
    // Profiel aanmaken
    await convex.mutation(internal.nietAlleen.activateNietAlleen, {
      userId,
      email,
      naam,
    });

    // Welkomstmail sturen
    await convex.action(internal.nietAlleenEmails.sendWelkomstMail, {
      email,
      naam,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[niet-alleen/activate] Fout:", err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

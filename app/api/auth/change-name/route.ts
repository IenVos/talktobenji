import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name || name.length < 1) {
      return NextResponse.json({ error: "Naam mag niet leeg zijn" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Naam is te lang" }, { status: 400 });
    }

    await convex.mutation(api.credentials.changeName, {
      secret,
      userId: session.userId,
      name,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Change name error:", error);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}

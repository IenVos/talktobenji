import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[houvast/registreer] Fout:", err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

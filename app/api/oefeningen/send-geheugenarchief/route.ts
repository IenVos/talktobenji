import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.talktobenji.com";

const CATEGORIES: Record<number, string> = {
  2: "Het eerste beeld",
  3: "De stem",
  4: "De geur",
  5: "Hoe hij of zij lachte",
  6: "De kleine gewoontes",
  7: "Wat hij of zij altijd zei",
  8: "Waar hij of zij van hield",
  9: "Wat hem of haar dwarszat",
  10: "Hoe het voelde om bij hem of haar te zijn",
  11: "Iets wat mensen niet wisten",
  12: "Een herinnering die je altijd bij je draagt",
  13: "Wat hij of zij zou zeggen",
  14: "Wat hij of zij je heeft meegegeven",
  15: "De zin die hem of haar omschrijft",
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session?.user?.email) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const answers: Record<number, string> = body?.answers || {};
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const rawPhotoUrl: unknown = body?.photoUrl;
    const photoUrl =
      typeof rawPhotoUrl === "string" && rawPhotoUrl.startsWith("data:image/")
        ? rawPhotoUrl
        : null;
    // categories passed from frontend (accounts for pet mode & dynamic names)
    const categoriesFromClient: Record<string, string> | null =
      body?.categories && typeof body.categories === "object" ? body.categories : null;

    const resolveCategory = (num: number): string =>
      categoriesFromClient?.[String(num)] ?? CATEGORIES[num] ?? "";

    const entriesHtml = Array.from({ length: 14 }, (_, i) => i + 2)
      .filter((num) => answers[num]?.trim())
      .map(
        (num) => `
        <div style="margin-bottom: 28px;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a0aec0; margin: 0 0 6px 0;">${resolveCategory(num)}</p>
          <div style="border-left: 3px solid #c7d4f0; padding: 10px 16px; background: #f7f9ff; border-radius: 0 6px 6px 0;">
            <p style="font-size: 14px; line-height: 1.8; color: #2d3748; margin: 0;">${escapeHtml(answers[num])}</p>
          </div>
        </div>`
      )
      .join("\n");

    if (!entriesHtml) {
      return NextResponse.json({ error: "Geen antwoorden gevonden" }, { status: 400 });
    }

    const photoHtml = photoUrl
      ? `<div style="margin-bottom: 20px;"><img src="${photoUrl}" alt="" width="72" height="72" style="width:72px;height:72px;border-radius:50%;object-fit:cover;display:block;" /></div>`
      : "";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #2d3748;">
        <img src="${appUrl}/images/benji-logo-2.png" alt="Benji" width="36" height="36" style="display: block; margin-bottom: 24px;" />
        ${photoHtml}
        <h1 style="font-size: 22px; font-weight: 500; color: #1a202c; margin: 0 0 4px 0;">${name ? `Portret van ${name}` : "Portret van..."}</h1>
        <p style="font-size: 13px; color: #718096; margin: 0 0 36px 0;">Opgemaakt via Talk To Benji</p>
        ${entriesHtml}
        <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Dit portret is alleen voor jou. Je kunt het bewaren, uitprinten of delen met mensen die van ${name || "diegene"} hielden.<br/>
          Met warmte, <strong>Benji</strong>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "Talk To Benji <noreply@talktobenji.com>",
      to: session.user.email,
      subject: `${name ? `Portret van ${name}` : "Portret van..."} · Talk To Benji`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send geheugenarchief error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}

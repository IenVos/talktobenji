import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Resend } from "resend";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function buildInvoicePdf({
  invoiceNr, date, customerName, customerEmail, productName, totalInclBtw,
}: {
  invoiceNr: string; date: string; customerName: string; customerEmail: string;
  productName: string; totalInclBtw: number;
}): Promise<Uint8Array> {
  const BTW_RATE = 0.25;
  const exclBtw = totalInclBtw / (1 + BTW_RATE);
  const btwBedrag = totalInclBtw - exclBtw;
  const fmt = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);
  const gray = rgb(0.6, 0.6, 0.6);
  const dark = rgb(0.11, 0.1, 0.09);
  const mid = rgb(0.47, 0.44, 0.42);
  const green = rgb(0.09, 0.64, 0.26);
  const line = rgb(0.91, 0.9, 0.89);
  const L = 56;
  const R = width - 56;

  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(0.96, 0.95, 0.94) });
  page.drawText("TalkToBenji", { x: L, y: height - 38, size: 15, font: fontBold, color: dark });
  page.drawText("onderdeel van LAAV", { x: L, y: height - 54, size: 9, font: fontReg, color: mid });

  let y = height - 110;
  page.drawText("FACTUUR", { x: L, y, size: 8, font: fontBold, color: gray });
  page.drawRectangle({ x: R - 72, y: y - 4, width: 72, height: 18, color: rgb(0.86, 0.99, 0.87) });
  page.drawText("VOLDAAN", { x: R - 58, y: y + 1, size: 8, font: fontBold, color: green });
  y -= 20;
  page.drawText(invoiceNr, { x: L, y, size: 13, font: fontBold, color: dark });
  y -= 16;
  page.drawText(date, { x: L, y, size: 10, font: fontReg, color: mid });

  y -= 36;
  page.drawText("VAN", { x: L, y, size: 8, font: fontBold, color: gray });
  page.drawText("AAN", { x: width / 2, y, size: 8, font: fontBold, color: gray });
  const vanLines = ["TalkToBenji", "contactmetien@talktobenji.com", "Hässleholm, 28192", "Zweden", "BTW: SE671123042201"];
  const aanLines = [customerName, customerEmail];
  y -= 16;
  for (const l of vanLines) {
    page.drawText(l, { x: L, y, size: 9.5, font: l === "TalkToBenji" ? fontBold : fontReg, color: dark });
    y -= 14;
  }
  let aanY = y + vanLines.length * 14 - 14;
  for (const l of aanLines) {
    page.drawText(l, { x: width / 2, y: aanY, size: 9.5, font: l === customerName ? fontBold : fontReg, color: dark });
    aanY -= 14;
  }

  y -= 16;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: line });
  y -= 20;
  page.drawText("OMSCHRIJVING", { x: L, y, size: 8, font: fontBold, color: gray });
  page.drawText("BEDRAG", { x: R - 60, y, size: 8, font: fontBold, color: gray });
  y -= 20;
  page.drawText(productName, { x: L, y, size: 11, font: fontBold, color: dark });
  page.drawText(fmt(exclBtw), { x: R - 60, y, size: 11, font: fontReg, color: dark });
  y -= 20;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: line });

  const col1 = R - 180;
  const col2 = R - 60;
  y -= 20;
  page.drawText("Subtotaal excl. btw", { x: col1, y, size: 9.5, font: fontReg, color: mid });
  page.drawText(fmt(exclBtw), { x: col2, y, size: 9.5, font: fontReg, color: mid });
  y -= 16;
  page.drawText("BTW (25%)", { x: col1, y, size: 9.5, font: fontReg, color: mid });
  page.drawText(fmt(btwBedrag), { x: col2, y, size: 9.5, font: fontReg, color: mid });
  y -= 14;
  page.drawLine({ start: { x: col1, y }, end: { x: R, y }, thickness: 1, color: dark });
  y -= 16;
  page.drawText("Totaal incl. btw", { x: col1, y, size: 11, font: fontBold, color: dark });
  page.drawText(fmt(totalInclBtw), { x: col2, y, size: 11, font: fontBold, color: dark });
  y -= 36;
  page.drawRectangle({ x: L, y: y - 8, width: R - L, height: 28, color: rgb(0.96, 0.95, 0.94) });
  page.drawText(`Betaald via Stripe  -  ${date}`, { x: L + 14, y: y + 4, size: 9.5, font: fontBold, color: mid });
  page.drawLine({ start: { x: 0, y: 48 }, end: { x: width, y: 48 }, thickness: 0.5, color: line });
  page.drawText("Vragen? contactmetien@talktobenji.com", { x: L, y: 24, size: 8.5, font: fontReg, color: gray });

  return doc.save();
}

export async function POST(req: NextRequest) {
  const { adminToken, toEmail, subject, body, productName } = await req.json();

  if (!adminToken || !toEmail || !subject || !body) {
    return NextResponse.json({ error: "Velden ontbreken" }, { status: 400 });
  }

  try {
    await convex.query(api.adminAuth.validateToken, { adminToken });
  } catch {
    return NextResponse.json({ error: "Geen toegang" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend niet geconfigureerd" }, { status: 500 });
  }

  const voornaam = "Testpersoon";
  const invoiceNr = `TTB-TEST-XXXXXX`;
  const date = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  const toHtml = (text: string) =>
    text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#6d84a8;">$1</a>')
      .replace(/\n/g, "<br/>");

  const bodyHtml = body
    .replace(/{naam}/g, voornaam)
    .split("\n\n")
    .map((p: string) => `<p style="font-size:15px;line-height:1.8;color:#4a5568;">${toHtml(p)}</p>`)
    .join("");

  let attachments: { filename: string; content: string }[] = [];
  try {
    const pdfBytes = await buildInvoicePdf({
      invoiceNr,
      date,
      customerName: voornaam,
      customerEmail: toEmail,
      productName: productName || "Testproduct",
      totalInclBtw: 37,
    });
    attachments = [{ filename: `${invoiceNr}.pdf`, content: Buffer.from(pdfBytes).toString("base64") }];
  } catch {
    // PDF mislukt — mail zonder bijlage
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Talk To Benji <noreply@talktobenji.com>",
    to: toEmail,
    subject: `[TEST] ${subject.replace("{naam}", voornaam)}`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
      <p style="font-size:11px;color:#a0aec0;margin-bottom:16px;">— Dit is een testmail —</p>
      ${bodyHtml}
      <p style="font-size:13px;color:#a0aec0;margin-top:28px;border-top:1px solid #e8e4e0;padding-top:16px;">Je factuur (${invoiceNr}) vind je als bijlage bij deze e-mail.</p>
      <p style="font-size:14px;color:#718096;">Vragen? Stuur een mail naar <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a>.</p>
    </div>`,
    ...(attachments.length > 0 && { attachments }),
  });

  return NextResponse.json({ ok: true });
}

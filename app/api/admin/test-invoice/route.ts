import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { calculateVat, EU_COUNTRY_NAMES_NL } from "@/lib/vat";

// Alleen beschikbaar in development
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Alleen beschikbaar in development" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("country") ?? "NL").toUpperCase();
  const business = searchParams.get("business") === "1";
  const totalCents = parseInt(searchParams.get("total") ?? "3700", 10);

  const effectiveCountry = business ? "OTHER" : country;
  const vat = calculateVat(totalCents, effectiveCountry);
  const countryName = country === "OTHER" ? "Buiten EU" : (EU_COUNTRY_NAMES_NL[country] ?? country);

  const invoiceNr = `TTB-${new Date().getFullYear()}-TEST01`;
  const date = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  const fmt = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;
  const totalInclBtw = totalCents / 100;
  const exclBtw = vat.basePrice / 100;
  const btwBedrag = business ? 0 : vat.vatAmount / 100;
  const effectiveVatRate = business ? 0 : vat.vatRate;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  const gray = rgb(0.6, 0.6, 0.6);
  const dark = rgb(0.11, 0.1, 0.09);
  const mid = rgb(0.47, 0.44, 0.42);
  const green = rgb(0.09, 0.64, 0.26);
  const lineColor = rgb(0.91, 0.9, 0.89);
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
  const aanLines: string[] = [`Test Klant (${countryName})`, "test@voorbeeld.nl"];
  if (business) aanLines.push("Btw-nummer: NL123456789B01");

  y -= 16;
  for (const l of vanLines) {
    page.drawText(l, { x: L, y, size: 9.5, font: l === "TalkToBenji" ? fontBold : fontReg, color: dark });
    y -= 14;
  }
  let aanY = y + vanLines.length * 14 - 14;
  for (const l of aanLines) {
    page.drawText(l, { x: width / 2, y: aanY, size: 9.5, font: l === aanLines[0] ? fontBold : fontReg, color: dark });
    aanY -= 14;
  }

  y -= 16;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: lineColor });

  y -= 20;
  page.drawText("OMSCHRIJVING", { x: L, y, size: 8, font: fontBold, color: gray });
  page.drawText("BEDRAG", { x: R - 60, y, size: 8, font: fontBold, color: gray });

  y -= 20;
  page.drawText("Niet Alleen — 30 dagen programma", { x: L, y, size: 11, font: fontBold, color: dark });
  page.drawText(fmt(exclBtw), { x: R - 60, y, size: 11, font: fontReg, color: dark });

  y -= 20;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: lineColor });

  const col1 = R - 180;
  const col2 = R - 60;
  y -= 20;
  page.drawText("Subtotaal excl. btw", { x: col1, y, size: 9.5, font: fontReg, color: mid });
  page.drawText(fmt(exclBtw), { x: col2, y, size: 9.5, font: fontReg, color: mid });
  y -= 16;

  if (business) {
    page.drawText("BTW 0%", { x: col1, y, size: 9.5, font: fontReg, color: mid });
    page.drawText(fmt(0), { x: col2, y, size: 9.5, font: fontReg, color: mid });
    y -= 14;
    page.drawLine({ start: { x: col1, y }, end: { x: R, y }, thickness: 1, color: dark });
    y -= 16;
    page.drawText("Totaal", { x: col1, y, size: 11, font: fontBold, color: dark });
    page.drawText(fmt(exclBtw), { x: col2, y, size: 11, font: fontBold, color: dark });
  } else {
    const btwLabel = `BTW (${Math.round(effectiveVatRate * 100)}%)`;
    page.drawText(btwLabel, { x: col1, y, size: 9.5, font: fontReg, color: mid });
    page.drawText(fmt(btwBedrag), { x: col2, y, size: 9.5, font: fontReg, color: mid });
    y -= 14;
    page.drawLine({ start: { x: col1, y }, end: { x: R, y }, thickness: 1, color: dark });
    y -= 16;
    page.drawText("Totaal incl. btw", { x: col1, y, size: 11, font: fontBold, color: dark });
    page.drawText(fmt(totalInclBtw), { x: col2, y, size: 11, font: fontBold, color: dark });
  }

  // Reverse charge zin net boven de Betaald-balk, volle breedte
  if (business) {
    y -= 24;
    page.drawText("BTW 0% – Btw verlegd volgens artikel 196 van Richtlijn 2006/112/EG", {
      x: L + 14, y, size: 8, font: fontReg, color: mid,
    });
  }

  y -= 28;
  page.drawRectangle({ x: L, y: y - 8, width: R - L, height: 28, color: rgb(0.96, 0.95, 0.94) });
  page.drawText(`Betaald via Stripe  -  ${date}`, { x: L + 14, y: y + 4, size: 9.5, font: fontBold, color: mid });

  page.drawLine({ start: { x: 0, y: 48 }, end: { x: width, y: 48 }, thickness: 0.5, color: lineColor });
  page.drawText("Vragen? contactmetien@talktobenji.com", { x: L, y: 24, size: 8.5, font: fontReg, color: gray });

  const pdfBytes = await doc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoiceNr}.pdf"`,
    },
  });
}

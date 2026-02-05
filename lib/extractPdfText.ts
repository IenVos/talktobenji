/**
 * Extraheer tekst uit een PDF-bestand in de browser.
 * Laadt PDF.js via CDN (niet via bundler) om "Object.defineProperty" fout te vermijden.
 * Werkt alleen met tekst-PDF's, niet met gescande afbeeldingen.
 */

const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

export async function extractTextFromPdf(file: File): Promise<string> {
  if (typeof window === "undefined") throw new Error("PDF.js werkt alleen in de browser");

  // Dynamische import van CDN - bypassed webpack, voorkomt bundling-fouten
  const pdfjsLib = await import(/* webpackIgnore: true */ PDFJS_URL);
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument(typedArray).promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: { str?: string }) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

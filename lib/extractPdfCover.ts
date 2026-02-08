/**
 * Extraheer de eerste pagina van een PDF als afbeelding (PNG blob).
 * Gebruikt pdfjs-dist in de browser. Voor coverafbeelding van PDF's.
 */
export async function extractPdfCoverAsBlob(pdfFile: File): Promise<Blob> {
  if (typeof window === "undefined") throw new Error("extractPdfCover werkt alleen in de browser");

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context niet beschikbaar");

  await page.render({
    canvasContext: ctx,
    canvas,
    viewport,
  }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob mislukt"))),
      "image/png",
      0.9
    );
  });
}

import { PDFDocument } from "pdf-lib";

/**
 * Booklet reorder for A3 landscape scans.
 *
 * File A (first scan):  Right half → Page 1,  Left half → Page 4
 * File B (second scan): Left half  → Page 2,  Right half → Page 3
 *
 * Final output: Page 1, Page 2, Page 3, Page 4
 *
 * Each file may be:
 *   - A 2-page PDF (extract by index — page 0 = left, page 1 = right)
 *   - A single wide A3 landscape page (split down the middle)
 */

interface SplitPages {
  left: PDFDocument;
  right: PDFDocument;
}

/** Split a single-page A3 landscape into left-half and right-half PDFs */
async function splitA3Page(srcDoc: PDFDocument): Promise<SplitPages> {
  const srcPage = srcDoc.getPage(0);
  const { width, height } = srcPage.getSize();
  const halfWidth = width / 2;

  // Left half
  const leftDoc = await PDFDocument.create();
  const [leftEmbed] = await leftDoc.embedPages([srcPage], [
    { left: 0, bottom: 0, right: halfWidth, top: height },
  ]);
  const leftPage = leftDoc.addPage([halfWidth, height]);
  leftPage.drawPage(leftEmbed, { x: 0, y: 0, width: halfWidth, height });

  // Right half
  const rightDoc = await PDFDocument.create();
  const [rightEmbed] = await rightDoc.embedPages([srcPage], [
    { left: halfWidth, bottom: 0, right: width, top: height },
  ]);
  const rightPage = rightDoc.addPage([halfWidth, height]);
  rightPage.drawPage(rightEmbed, { x: 0, y: 0, width: halfWidth, height });

  return { left: leftDoc, right: rightDoc };
}

/** For a 2-page PDF, wrap each page as its own PDFDocument */
async function splitTwoPagePdf(srcDoc: PDFDocument): Promise<SplitPages> {
  const leftDoc = await PDFDocument.create();
  const [p0] = await leftDoc.copyPages(srcDoc, [0]);
  leftDoc.addPage(p0);

  const rightDoc = await PDFDocument.create();
  const [p1] = await rightDoc.copyPages(srcDoc, [1]);
  rightDoc.addPage(p1);

  return { left: leftDoc, right: rightDoc };
}

/** Get left/right halves from any input file */
async function getHalves(pdfBytes: Uint8Array): Promise<SplitPages> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const pageCount = srcDoc.getPageCount();

  if (pageCount >= 2) {
    // 2-page PDF: index 0 = left, index 1 = right
    return splitTwoPagePdf(srcDoc);
  }

  // Single page — A3 landscape split
  return splitA3Page(srcDoc);
}

export interface MergeResult {
  pdfBytes: Uint8Array;
  pageCount: number;
}

/**
 * Merge two scanned files into correct 4-page reading order.
 *
 * File A (first/lower#): Left half = Page 1, Right half = Page 4
 * File B (second/higher#): Left half = Page 2, Right half = Page 3
 */
export async function mergeBooklet(
  fileABytes: Uint8Array,
  fileBBytes: Uint8Array
): Promise<MergeResult> {
  const fileA = await getHalves(fileABytes);
  const fileB = await getHalves(fileBBytes);

  const merged = await PDFDocument.create();

  // Page 1 = File A Left half
  const [p1] = await merged.copyPages(fileA.left, [0]);
  merged.addPage(p1);

  // Page 2 = File B Left half
  const [p2] = await merged.copyPages(fileB.left, [0]);
  merged.addPage(p2);

  // Page 3 = File B Right half
  const [p3] = await merged.copyPages(fileB.right, [0]);
  merged.addPage(p3);

  // Page 4 = File A Right half
  const [p4] = await merged.copyPages(fileA.right, [0]);
  merged.addPage(p4);

  const pdfBytes = await merged.save();
  return { pdfBytes: new Uint8Array(pdfBytes), pageCount: 4 };
}

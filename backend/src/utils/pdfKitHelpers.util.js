import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SCHOOL_INFO } from "../config/school.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "../../public");

const FONT_PATHS = {
  regular: path.join(PUBLIC_DIR, "Amiri-Regular.ttf"),
  bold: path.join(PUBLIC_DIR, "Amiri-Bold.ttf"),
};
const LOGO_PATH = path.join(PUBLIC_DIR, "logo.png");

/** Register Amiri fonts on a PDFDocument instance. */
export function registerPdfFonts(doc) {
  if (fs.existsSync(FONT_PATHS.regular)) {
    doc.registerFont("Amiri", FONT_PATHS.regular);
  }
  if (fs.existsSync(FONT_PATHS.bold)) {
    doc.registerFont("Amiri-Bold", FONT_PATHS.bold);
  }
}

export function hasAmiriFont() {
  return fs.existsSync(FONT_PATHS.regular);
}

/** Use Amiri when available, otherwise Helvetica. */
export function setFont(doc, bold = false) {
  const useAmiri = hasAmiriFont();
  doc.font(bold ? (useAmiri ? "Amiri-Bold" : "Helvetica-Bold") : useAmiri ? "Amiri" : "Helvetica");
}

/**
 * Draw report header with logo + school name. Returns new Y position.
 * @param {import('pdfkit').PDFDocument} doc
 * @param {string} [subtitle] - Optional report title below school name
 * @param {object} [options]
 * @param {number} [options.marginLeft=30]
 * @param {boolean} [options.withLogo=true]
 */
export function drawReportHeader(doc, subtitle = "", options = {}) {
  const marginLeft = options.marginLeft ?? 30;
  const withLogo = options.withLogo !== false;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - marginLeft * 2;
  let y = doc.y || marginLeft;

  registerPdfFonts(doc);

  const logoExists = withLogo && fs.existsSync(LOGO_PATH);
  const logoSize = 48;
  let textX = marginLeft;
  let textWidth = contentWidth;
  let headerBottom = y;

  if (logoExists) {
    try {
      doc.image(LOGO_PATH, marginLeft, y, { width: logoSize, height: logoSize });
      headerBottom = y + logoSize;
      textX = marginLeft + logoSize + 12;
      textWidth = contentWidth - logoSize - 12;
    } catch {
      // ignore broken logo
    }
  }

  setFont(doc, true);
  doc.fontSize(14);
  doc.text(SCHOOL_INFO.name, textX, y, { width: textWidth, align: logoExists ? "right" : "center" });
  y = Math.max(doc.y + 4, headerBottom + 4);

  if (SCHOOL_INFO.address) {
    setFont(doc, false);
    doc.fontSize(9);
    doc.text(SCHOOL_INFO.address, textX, y, { width: textWidth, align: logoExists ? "right" : "center" });
    y = doc.y + 2;
  }

  if (subtitle) {
    setFont(doc, true);
    doc.fontSize(12);
    doc.text(subtitle, marginLeft, y + 6, { width: contentWidth, align: "center" });
    y = doc.y + 8;
  } else {
    y += 8;
  }

  doc.moveTo(marginLeft, y).lineTo(pageWidth - marginLeft, y).stroke();
  doc.y = y + 12;
  return doc.y;
}

export { SCHOOL_INFO, LOGO_PATH, FONT_PATHS };

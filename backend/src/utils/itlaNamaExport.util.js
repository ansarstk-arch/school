import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerPdfFonts, setFont } from "./pdfKitHelpers.util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../../public/logo.png");

const hasLogo = () => fs.existsSync(LOGO_PATH);
const HEAD_LINES = [
  "د پوهنې جلیلې وزارت",
  "د عمومي تعلیماتو ریاست",
  "د اساسي او ثانوي تعلیماتو ریاست",
  "د اسلامي تعلیماتو ریاست",
];

const BORDER_THIN = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const BORDER_MEDIUM = {
  top: { style: "medium" },
  left: { style: "medium" },
  bottom: { style: "medium" },
  right: { style: "medium" },
};

function passBand(total, obtained) {
  const max = Number(total || 0);
  if (!Number.isFinite(max) || max <= 0) return "—";
  const pct = (Number(obtained || 0) / max) * 100;
  if (pct >= 90) return "عالي";
  if (pct >= 75) return "ډېر ښه";
  if (pct >= 60) return "ښه";
  if (pct >= 50) return "د منلو وړ";
  return "کمزوری";
}

function styleCell(cell, opts = {}) {
  cell.font = opts.font || { name: "Arial", size: 10 };
  cell.alignment =
    opts.alignment || { horizontal: "center", vertical: "middle", wrapText: true, readingOrder: "rtl" };
  if (opts.fill) cell.fill = opts.fill;
  if (opts.border) cell.border = opts.border;
}

function buildStudentSheet({ wb, student, classInfo, examInfo, logoId, index }) {
  const ws = wb.addWorksheet(`اطلاع نامه ${index + 1}`, {
    views: [{ rightToLeft: true }],
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.25, right: 0.25, top: 0.25, bottom: 0.25, header: 0.1, footer: 0.1 },
    },
  });

  ws.columns = [
    { width: 8 },
    { width: 12 },
    { width: 13 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  for (let r = 1; r <= 40; r += 1) ws.getRow(r).height = 18;

  ws.mergeCells(1, 1, 40, 10);
  styleCell(ws.getCell(1, 1), { border: BORDER_MEDIUM });

  if (logoId) {
    ws.addImage(logoId, { tl: { col: 0.7, row: 0.4 }, ext: { width: 88, height: 88 } });
    ws.addImage(logoId, { tl: { col: 8.4, row: 0.4 }, ext: { width: 88, height: 88 } });
  }

  ws.mergeCells(1, 3, 4, 8);
  const head = ws.getCell(1, 3);
  head.value = HEAD_LINES.join("\n");
  styleCell(head, {
    font: { name: "Arial", size: 11, bold: true },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true, readingOrder: "rtl" },
  });

  ws.mergeCells(6, 3, 8, 8);
  const title = ws.getCell(6, 3);
  title.value = "اطلاع نامه";
  styleCell(title, {
    font: { name: "Arial", size: 24, bold: true, color: { argb: "FF0F172A" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
    border: BORDER_MEDIUM,
  });

  ws.mergeCells(9, 1, 9, 5);
  ws.mergeCells(9, 6, 9, 10);
  ws.getCell(9, 1).value = `د زده کوونکي نوم: ${student.studentName || "—"}`;
  ws.getCell(9, 6).value = `د پلار نوم: ${student.fatherName || "—"}`;
  styleCell(ws.getCell(9, 1), { font: { name: "Arial", size: 11, bold: true }, border: BORDER_THIN });
  styleCell(ws.getCell(9, 6), { font: { name: "Arial", size: 11, bold: true }, border: BORDER_THIN });

  ws.mergeCells(10, 1, 10, 3);
  ws.mergeCells(10, 4, 10, 7);
  ws.mergeCells(10, 8, 10, 10);
  ws.getCell(10, 1).value = `صنف: ${classInfo?.className || "—"}${classInfo?.section ? ` (${classInfo.section})` : ""}`;
  ws.getCell(10, 4).value = `امتحان: ${examInfo?.examTitle || "—"}`;
  ws.getCell(10, 8).value = `نمبر: ${student.rollNumber || "—"}`;
  [1, 4, 8].forEach((c) =>
    styleCell(ws.getCell(10, c), { font: { name: "Arial", size: 10, bold: true }, border: BORDER_THIN })
  );

  const headerRow = 12;
  const headers = ["درجه", "پایله", "مجموعه نمرې", "لاسته راوړې نمرې", "مضمون"];
  headers.forEach((h, i) => {
    const c = ws.getCell(headerRow, i + 1);
    c.value = h;
    styleCell(c, {
      font: { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } },
      border: BORDER_THIN,
    });
  });
  ws.mergeCells(headerRow, 5, headerRow, 10);

  let row = headerRow + 1;
  student.subjects.forEach((s) => {
    ws.getCell(row, 1).value = passBand(s.totalMarks, s.obtainedMarks);
    ws.getCell(row, 2).value = s.statusLabel || "—";
    ws.getCell(row, 3).value = s.totalMarks ?? "—";
    ws.getCell(row, 4).value = s.obtainedMarks ?? "—";
    ws.getCell(row, 5).value = s.subjectName || "—";
    ws.mergeCells(row, 5, row, 10);
    for (let c = 1; c <= 10; c += 1) {
      if (c > 5) continue;
      styleCell(ws.getCell(row, c), { border: BORDER_THIN, alignment: { horizontal: "center", vertical: "middle", readingOrder: "rtl" } });
    }
    styleCell(ws.getCell(row, 5), {
      border: BORDER_THIN,
      alignment: { horizontal: "right", vertical: "middle", readingOrder: "rtl" },
    });
    row += 1;
  });

  ws.getCell(row, 1).value = passBand(student.totalPossible, student.totalObtained);
  ws.getCell(row, 2).value = student.overallStatusLabel || "—";
  ws.getCell(row, 3).value = student.totalPossible ?? "—";
  ws.getCell(row, 4).value = student.totalObtained ?? "—";
  ws.getCell(row, 5).value = "ټول";
  ws.mergeCells(row, 5, row, 10);
  for (let c = 1; c <= 5; c += 1) {
    styleCell(ws.getCell(row, c), {
      font: { name: "Arial", size: 11, bold: true },
      border: BORDER_THIN,
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } },
    });
  }

  const footerTop = Math.max(row + 2, 32);
  ws.mergeCells(footerTop, 1, footerTop + 1, 3);
  ws.mergeCells(footerTop, 4, footerTop + 1, 7);
  ws.mergeCells(footerTop, 8, footerTop + 1, 10);

  ws.getCell(footerTop, 1).value = "د مضمون استاد";
  ws.getCell(footerTop, 4).value = `د ټولګي استاد: ${classInfo?.supervisorName || "—"}`;
  ws.getCell(footerTop, 8).value = "اداره";
  [1, 4, 8].forEach((c) =>
    styleCell(ws.getCell(footerTop, c), {
      font: { name: "Arial", size: 10, bold: true },
      border: BORDER_THIN,
      alignment: { horizontal: "center", vertical: "middle", readingOrder: "rtl" },
    })
  );
}

export async function generateItlaNamaExcel({ classInfo, examInfo, students }) {
  const wb = new ExcelJS.Workbook();
  const logoId = hasLogo()
    ? wb.addImage({
        buffer: fs.readFileSync(LOGO_PATH),
        extension: "png",
      })
    : null;

  students.forEach((student, index) => {
    buildStudentSheet({ wb, student, classInfo, examInfo, logoId, index });
  });
  return wb;
}

export function generateItlaNamaPDF({ classInfo, examInfo, students }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 30 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      registerPdfFonts(doc);

      const drawTemplate = (st) => {
        const left = 28;
        const right = doc.page.width - 28;
        const top = 28;
        const width = right - left;
        const tableTop = 230;
        const colWidths = [70, 80, 90, 90, width - 330];
        const rowH = 24;

        doc.lineWidth(1.2).rect(left, top, width, doc.page.height - 56).stroke();

        setFont(doc, true);
        doc.fontSize(12).fillColor("#111827");
        doc.text(HEAD_LINES.join("\n"), left + 100, top + 18, { width: width - 200, align: "center" });

        doc.roundedRect(left + 130, top + 78, width - 260, 52, 6).fillAndStroke("#4F81BD", "#3B6AA2");
        setFont(doc, true);
        doc.fillColor("#0F172A").fontSize(27).text("اطلاع نامه", left + 130, top + 89, {
          width: width - 260,
          align: "center",
        });

        doc.fillColor("#000000");
        setFont(doc, true);
        doc.fontSize(10);
        doc.text(`نوم: ${st.studentName || "—"}`, left + 16, top + 142, { width: width / 2 - 20, align: "right" });
        doc.text(`ولد: ${st.fatherName || "—"}`, left + width / 2, top + 142, {
          width: width / 2 - 16,
          align: "right",
        });
        doc.text(
          `صنف: ${classInfo?.className || "—"}${classInfo?.section ? ` (${classInfo.section})` : ""}`,
          left + 16,
          top + 164,
          { width: width / 2 - 20, align: "right" }
        );
        doc.text(`امتحان: ${examInfo?.examTitle || "—"}`, left + width / 2, top + 164, {
          width: width / 2 - 16,
          align: "right",
        });
        doc.text(`نمبر: ${st.rollNumber || "—"}`, left + 16, top + 186, { width: width - 32, align: "right" });
        doc.text(`تعلیمي کال: ${examInfo?.academicYear || "—"}`, left + 16, top + 206, {
          width: width - 32,
          align: "right",
        });

        let x = left;
        ["درجه", "پایله", "مجموعه نمرې", "لاسته راوړې نمرې", "مضمون"].forEach((h, i) => {
          doc.rect(x, tableTop, colWidths[i], rowH).fillAndStroke("#4F81BD", "#1F2937");
          setFont(doc, true);
          doc.fillColor("#FFFFFF").fontSize(10).text(h, x + 6, tableTop + 7, {
            width: colWidths[i] - 12,
            align: "center",
          });
          x += colWidths[i];
        });

        let y = tableTop + rowH;
        st.subjects.forEach((s) => {
          x = left;
          const vals = [
            passBand(s.totalMarks, s.obtainedMarks),
            s.statusLabel || "—",
            String(s.totalMarks ?? "—"),
            String(s.obtainedMarks ?? "—"),
            s.subjectName || "—",
          ];
          vals.forEach((v, i) => {
            doc.rect(x, y, colWidths[i], rowH).stroke();
            setFont(doc, false);
            doc.fillColor("#111827").fontSize(10).text(v, x + 6, y + 7, {
              width: colWidths[i] - 12,
              align: i === 4 ? "right" : "center",
            });
            x += colWidths[i];
          });
          y += rowH;
        });

        x = left;
        [
          passBand(st.totalPossible, st.totalObtained),
          st.overallStatusLabel || "—",
          String(st.totalPossible ?? "—"),
          String(st.totalObtained ?? "—"),
          "ټول",
        ].forEach((v, i) => {
          doc.rect(x, y, colWidths[i], rowH).fillAndStroke("#EFF6FF", "#1F2937");
          setFont(doc, true);
          doc.fillColor("#111827").fontSize(10).text(v, x + 6, y + 7, {
            width: colWidths[i] - 12,
            align: i === 4 ? "right" : "center",
          });
          x += colWidths[i];
        });

        const footY = doc.page.height - 82;
        const footW = (width - 16) / 3;
        ["د مضمون استاد", `د ټولګي استاد: ${classInfo?.supervisorName || "—"}`, "اداره"].forEach((label, i) => {
          const fx = left + i * (footW + 8);
          doc.rect(fx, footY, footW, 34).stroke();
          setFont(doc, true);
          doc.fillColor("#111827").fontSize(10).text(label, fx + 6, footY + 11, { width: footW - 12, align: "center" });
        });
      };

      students.forEach((st, idx) => {
        if (idx > 0) doc.addPage();
        drawTemplate(st);
      });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}


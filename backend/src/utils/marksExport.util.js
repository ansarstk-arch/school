import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { registerPdfFonts, setFont, drawReportHeader } from "./pdfKitHelpers.util.js";
import { eq, and } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import {
  studentMarks,
  exams,
  classes,
  subjects,
  students,
  examSubjectConfig,
} from "../db/schema.js";

const STATUS_LABELS = { Pass: "بریالی", Fail: "ناکام", Absent: "غیر حاضر" };

async function fetchMarksForExport(query) {
  const { examId, classId, subjectId, institutionType, status, search } = query;
  const conditions = [];

  if (examId) conditions.push(eq(studentMarks.examId, Number(examId)));
  if (classId) conditions.push(eq(studentMarks.classId, Number(classId)));
  if (subjectId) conditions.push(eq(studentMarks.subjectId, Number(subjectId)));
  if (institutionType) conditions.push(eq(studentMarks.institutionType, institutionType));
  if (status) conditions.push(eq(studentMarks.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let rows = await db
    .select({
      rollNumber: students.rollNumber,
      studentName: students.fullName,
      fatherName: students.fatherName,
      obtainedMarks: studentMarks.obtainedMarks,
      status: studentMarks.status,
      remarks: studentMarks.remarks,
      examTitle: exams.examTitle,
      className: classes.name,
      subjectName: subjects.name,
      totalMarks: examSubjectConfig.totalMarks,
    })
    .from(studentMarks)
    .innerJoin(exams, eq(studentMarks.examId, exams.id))
    .innerJoin(classes, eq(studentMarks.classId, classes.id))
    .innerJoin(subjects, eq(studentMarks.subjectId, subjects.id))
    .innerJoin(students, eq(studentMarks.studentId, students.id))
    .leftJoin(
      examSubjectConfig,
      and(
        eq(examSubjectConfig.examId, studentMarks.examId),
        eq(examSubjectConfig.classId, studentMarks.classId),
        eq(examSubjectConfig.subjectId, studentMarks.subjectId)
      )
    )
    .where(whereClause);

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.fatherName?.toLowerCase().includes(q) ||
        String(r.rollNumber || "").includes(q)
    );
  }

  return rows;
}

export const generateMarksExcel = async (query) => {
  const rows = await fetchMarksForExport(query);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("نمرې", { views: [{ rightToLeft: true }] });

  const title =
    rows[0]?.examTitle && rows[0]?.subjectName
      ? `${rows[0].examTitle} - ${rows[0].subjectName}`
      : "د نمرو راپور";

  ws.mergeCells(1, 1, 1, 7);
  ws.getCell(1, 1).value = title;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.getCell(1, 1).alignment = { horizontal: "center" };

  const headers = ["#", "رول نمبر", "نوم", "د پلار نوم", "ټولټال", "ترلاسه", "حالت", "یادښت"];
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };

  rows.forEach((r, i) => {
    ws.addRow([
      i + 1,
      r.rollNumber || "",
      r.studentName,
      r.fatherName,
      r.totalMarks ?? "",
      r.status === "Absent" ? "—" : r.obtainedMarks,
      STATUS_LABELS[r.status] || r.status,
      r.remarks || "",
    ]);
  });

  ws.columns = [
    { width: 5 },
    { width: 12 },
    { width: 22 },
    { width: 22 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 18 },
  ];

  return wb.xlsx.writeBuffer();
};

export const generateMarksPDF = async (query) => {
  const rows = await fetchMarksForExport(query);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const title =
      rows[0]?.examTitle && rows[0]?.className
        ? `${rows[0].examTitle} - ${rows[0].className}`
        : "د نمرو راپور";

    registerPdfFonts(doc);
    drawReportHeader(doc, title);

    setFont(doc, true);
    doc.fontSize(9);
    const colX = [40, 80, 140, 280, 380, 440, 500, 560];
    const headers = ["#", "رول", "نوم", "پلار", "ټول", "نمرې", "حالت"];

    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 70, align: "right" }));
    doc.moveDown(0.5);

    setFont(doc, false);
    rows.forEach((r, i) => {
      if (doc.y > 520) {
        doc.addPage();
      }
      const vals = [
        String(i + 1),
        r.rollNumber || "—",
        r.studentName || "—",
        r.fatherName || "—",
        String(r.totalMarks ?? ""),
        r.status === "Absent" ? "—" : String(r.obtainedMarks ?? ""),
        STATUS_LABELS[r.status] || r.status,
      ];
      vals.forEach((v, idx) => doc.text(v, colX[idx], doc.y, { width: 75, lineBreak: false, align: "right" }));
      doc.moveDown(0.4);
    });

    doc.end();
  });
};

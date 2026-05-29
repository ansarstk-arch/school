import { eq, and, desc, sql, like, or, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  examResultPrep,
  exams,
  classes,
  subjects,
  examSubjectConfig,
  students,
  teachers,
} from "../../db/schema.js";
import { calculateResultPrep } from "../../services/result-calculation.service.js";
import ApiError from "../../utils/ApiError.util.js";
import { generateItlaNamaExcel, generateItlaNamaPDF } from "../../utils/itlaNamaExport.util.js";

// ─── TRIGGER CALCULATION ───────────────────────────────────────────────────────
export const runResultCalculation = asyncHandler(async (req, res) => {
  const { examId, classId, institutionType } = req.body;

  if (!examId || !classId || !institutionType) {
    return res.respond(400, "امتحان، ټولګی او د ادارې ډول اړین دي");
  }

  const result = await calculateResultPrep(examId, classId, institutionType);

  res.respond(200, "د پایلو محاسبه چمتو شوه", result);
});

// ─── GET PREP RECORDS ────────────────────────────────────────────────────────────
export const getResultPrepRecords = asyncHandler(async (req, res) => {
  const {
    examId,
    classId,
    institutionType,
    academicYear,
    overallStatus,
    calculationStatus,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];

  if (examId) conditions.push(eq(examResultPrep.examId, Number(examId)));
  if (classId) conditions.push(eq(examResultPrep.classId, Number(classId)));
  if (institutionType) conditions.push(eq(examResultPrep.institutionType, institutionType));
  if (academicYear) conditions.push(eq(exams.academicYear, academicYear));
  if (overallStatus) conditions.push(eq(examResultPrep.overallStatus, overallStatus));
  if (calculationStatus) conditions.push(eq(examResultPrep.calculationStatus, calculationStatus));
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        like(students.fullName, q),
        like(students.fatherName, q),
        like(students.rollNumber, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: examResultPrep.id,
      examId: examResultPrep.examId,
      classId: examResultPrep.classId,
      studentId: examResultPrep.studentId,
      institutionType: examResultPrep.institutionType,
      totalObtained: examResultPrep.totalObtained,
      totalPossible: examResultPrep.totalPossible,
      percentage: examResultPrep.percentage,
      grade: examResultPrep.grade,
      rank: examResultPrep.rank,
      gpa: examResultPrep.gpa,
      overallStatus: examResultPrep.overallStatus,
      subjectDetails: examResultPrep.subjectDetails,
      calculationStatus: examResultPrep.calculationStatus,
      updatedAt: examResultPrep.updatedAt,
      examTitle: exams.examTitle,
      academicYear: exams.academicYear,
      className: classes.name,
      studentName: students.fullName,
      fatherName: students.fatherName,
      rollNumber: students.rollNumber,
    })
    .from(examResultPrep)
    .innerJoin(exams, eq(examResultPrep.examId, exams.id))
    .innerJoin(classes, eq(examResultPrep.classId, classes.id))
    .innerJoin(students, eq(examResultPrep.studentId, students.id))
    .where(whereClause)
    .orderBy(examResultPrep.rank)
    .limit(Number(limit))
    .offset(offset);

  const records = rows.map((r) => ({
    ...r,
    subjectDetails: r.subjectDetails ? JSON.parse(r.subjectDetails) : [],
  }));

  const [countResult] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(examResultPrep)
    .innerJoin(exams, eq(examResultPrep.examId, exams.id))
    .innerJoin(classes, eq(examResultPrep.classId, classes.id))
    .innerJoin(students, eq(examResultPrep.studentId, students.id))
    .where(whereClause);

  res.respond(200, "د پایلو چمتو ریکارډونه ترلاسه شول", {
    records,
    pagination: {
      total: countResult?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult?.count || 0) / Number(limit)) || 1,
    },
  });
});

// ─── SUMMARY ───────────────────────────────────────────────────────────────────
export const getResultPrepSummary = asyncHandler(async (req, res) => {
  const { examId, classId, institutionType } = req.query;

  if (!examId || !classId) {
    return res.respond(400, "امتحان او ټولګی اړین دي");
  }

  const conditions = [
    eq(examResultPrep.examId, Number(examId)),
    eq(examResultPrep.classId, Number(classId)),
  ];
  if (institutionType) conditions.push(eq(examResultPrep.institutionType, institutionType));

  const rows = await db
    .select()
    .from(examResultPrep)
    .where(and(...conditions));

  const total = rows.length;
  const passed = rows.filter((r) => r.overallStatus === "Pass").length;
  const failed = rows.filter((r) => r.overallStatus === "Fail").length;
  const avgPercentage =
    total > 0 ? rows.reduce((s, r) => s + (r.percentage || 0), 0) / total : 0;

  res.respond(200, "لنډیز ترلاسه شو", {
    totalStudents: total,
    passed,
    failed,
    averagePercentage: Math.round(avgPercentage * 100) / 100,
    calculationStatus: total > 0 ? "ready" : "pending",
  });
});

const STATUS_LABELS = { Pass: "بریالی", Fail: "ناکام" };

async function fetchItlaNamaPayload({ examId, classId, institutionType, studentIds }) {
  const [examRow] = await db.select().from(exams).where(eq(exams.id, Number(examId)));
  const [classRow] = await db.select().from(classes).where(eq(classes.id, Number(classId)));
  if (!examRow || !classRow) throw new ApiError(404, "امتحان یا ټولګی ونه موندل شو");

  let supervisorName = null;
  if (classRow.supervisorId) {
    const [teacherRow] = await db
      .select({ name: teachers.name })
      .from(teachers)
      .where(eq(teachers.id, classRow.supervisorId));
    supervisorName = teacherRow?.name || null;
  }

  const configs = await db
    .select({
      subjectId: examSubjectConfig.subjectId,
      subjectName: subjects.name,
      totalMarks: examSubjectConfig.totalMarks,
      passingMarks: examSubjectConfig.passingMarks,
    })
    .from(examSubjectConfig)
    .innerJoin(subjects, eq(examSubjectConfig.subjectId, subjects.id))
    .where(
      and(
        eq(examSubjectConfig.examId, Number(examId)),
        eq(examSubjectConfig.classId, Number(classId))
      )
    );

  if (configs.length === 0) {
    throw new ApiError(400, "د دې امتحان لپاره د مضامینو تنظیم نشته");
  }

  const conditions = [
    eq(examResultPrep.examId, Number(examId)),
    eq(examResultPrep.classId, Number(classId)),
  ];
  if (institutionType) conditions.push(eq(examResultPrep.institutionType, institutionType));
  if (studentIds?.length) conditions.push(inArray(examResultPrep.studentId, studentIds));

  const rows = await db
    .select({
      studentId: examResultPrep.studentId,
      totalObtained: examResultPrep.totalObtained,
      totalPossible: examResultPrep.totalPossible,
      overallStatus: examResultPrep.overallStatus,
      subjectDetails: examResultPrep.subjectDetails,
      studentName: students.fullName,
      fatherName: students.fatherName,
      rollNumber: students.rollNumber,
    })
    .from(examResultPrep)
    .innerJoin(students, eq(examResultPrep.studentId, students.id))
    .where(and(...conditions))
    .orderBy(students.rollNumber, students.fullName);

  if (rows.length === 0) {
    throw new ApiError(404, "هیڅ پایلې ونه موندل شوې. لومړی د پایلو محاسبه ترسره کړئ.");
  }

  const totalPossibleFallback = configs.reduce((s, c) => s + Number(c.totalMarks || 0), 0);

  const studentsPayload = rows.map((r) => {
    const details = r.subjectDetails ? JSON.parse(r.subjectDetails) : [];
    const subjectsPayload = configs.map((cfg) => {
      const d = details.find((x) => Number(x.subjectId) === Number(cfg.subjectId));
      const status = d?.status || "Absent";
      return {
        subjectId: cfg.subjectId,
        subjectName: cfg.subjectName,
        totalMarks: cfg.totalMarks,
        obtainedMarks: d?.obtainedMarks ?? null,
        status,
        statusLabel: status === "Absent" ? "غیر حاضر" : STATUS_LABELS[status] || status,
      };
    });

    return {
      studentId: r.studentId,
      studentName: r.studentName,
      fatherName: r.fatherName,
      rollNumber: r.rollNumber,
      totalObtained: r.totalObtained ?? 0,
      totalPossible: r.totalPossible ?? totalPossibleFallback,
      overallStatus: r.overallStatus || "Fail",
      overallStatusLabel: r.overallStatus === "Pass" ? "بریالی" : "ناکام",
      subjects: subjectsPayload,
    };
  });

  return {
    examInfo: { examId: examRow.id, examTitle: examRow.examTitle, academicYear: examRow.academicYear },
    classInfo: {
      classId: classRow.id,
      className: classRow.name,
      section: classRow.section,
      supervisorName,
    },
    students: studentsPayload,
  };
}

export const downloadItlaNamaExcel = asyncHandler(async (req, res) => {
  const { examId, classId, institutionType, studentIds } = req.query;
  if (!examId || !classId) throw new ApiError(400, "امتحان او ټولګی اړین دي");

  const ids = studentIds
    ? String(studentIds)
        .split(",")
        .map((x) => parseInt(x, 10))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const payload = await fetchItlaNamaPayload({
    examId,
    classId,
    institutionType,
    studentIds: ids.length ? ids : null,
  });

  const wb = await generateItlaNamaExcel(payload);
  const buffer = await wb.xlsx.writeBuffer();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=itla-nama-${Date.now()}.xlsx`);
  res.send(buffer);
});

export const downloadItlaNamaPDF = asyncHandler(async (req, res) => {
  const { examId, classId, institutionType, studentIds } = req.query;
  if (!examId || !classId) throw new ApiError(400, "امتحان او ټولګی اړین دي");

  const ids = studentIds
    ? String(studentIds)
        .split(",")
        .map((x) => parseInt(x, 10))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const payload = await fetchItlaNamaPayload({
    examId,
    classId,
    institutionType,
    studentIds: ids.length ? ids : null,
  });

  const pdfBuffer = await generateItlaNamaPDF(payload);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=itla-nama-${Date.now()}.pdf`);
  res.send(pdfBuffer);
});

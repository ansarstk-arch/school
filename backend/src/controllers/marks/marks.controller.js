import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  studentMarks,
  examSubjectConfig,
  exams,
  classes,
  subjects,
  students,
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import {
  validateExamClassContext,
  validateSubjectForClass,
  validateObtainedMarks,
  computeMarkStatus,
  getStudentsForClass,
  getConfigForSubject,
} from "../../utils/marksHelpers.util.js";
import { generateMarksExcel, generateMarksPDF } from "../../utils/marksExport.util.js";

// ─── GET ALL MARKS ─────────────────────────────────────────────────────────────
export const getAllMarks = asyncHandler(async (req, res) => {
  const {
    examId,
    classId,
    subjectId,
    institutionType,
    academicYear,
    status,
    studentId,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];

  if (examId) conditions.push(eq(studentMarks.examId, Number(examId)));
  if (classId) conditions.push(eq(studentMarks.classId, Number(classId)));
  if (subjectId) conditions.push(eq(studentMarks.subjectId, Number(subjectId)));
  if (institutionType) conditions.push(eq(studentMarks.institutionType, institutionType));
  if (academicYear) conditions.push(eq(exams.academicYear, academicYear));
  if (status) conditions.push(eq(studentMarks.status, status));
  if (studentId) conditions.push(eq(studentMarks.studentId, Number(studentId)));
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        like(students.fullName, q),
        like(students.fatherName, q),
        like(students.rollNumber, q),
        like(exams.examTitle, q),
        like(subjects.name, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: studentMarks.id,
      examId: studentMarks.examId,
      classId: studentMarks.classId,
      subjectId: studentMarks.subjectId,
      studentId: studentMarks.studentId,
      institutionType: studentMarks.institutionType,
      obtainedMarks: studentMarks.obtainedMarks,
      status: studentMarks.status,
      remarks: studentMarks.remarks,
      createdAt: studentMarks.createdAt,
      updatedAt: studentMarks.updatedAt,
      examTitle: exams.examTitle,
      academicYear: exams.academicYear,
      examStartDate: exams.startDate,
      className: classes.name,
      subjectName: subjects.name,
      studentName: students.fullName,
      fatherName: students.fatherName,
      rollNumber: students.rollNumber,
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
    .where(whereClause)
    .orderBy(desc(studentMarks.updatedAt))
    .limit(Number(limit))
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(studentMarks)
    .innerJoin(exams, eq(studentMarks.examId, exams.id))
    .innerJoin(classes, eq(studentMarks.classId, classes.id))
    .innerJoin(subjects, eq(studentMarks.subjectId, subjects.id))
    .innerJoin(students, eq(studentMarks.studentId, students.id))
    .where(whereClause);

  res.respond(200, "نمرې ترلاسه شوې", {
    marks: rows,
    pagination: {
      total: countResult?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult?.count || 0) / Number(limit)) || 1,
    },
  });
});

// ─── MARKS ENTRY SHEET ─────────────────────────────────────────────────────────
export const getMarksEntrySheet = asyncHandler(async (req, res) => {
  const { examId, classId, subjectId, institutionType, search } = req.query;

  if (!examId || !classId || !subjectId || !institutionType) {
    return res.respond(400, "امتحان، ټولګی، مضمون او د ادارې ډول اړین دي");
  }

  const { exam } = await validateExamClassContext(examId, classId, institutionType);
  await validateSubjectForClass(subjectId, classId, institutionType, exam.academicYear);

  const config = await getConfigForSubject(examId, classId, subjectId);
  if (!config) {
    return res.respond(400, "لومړی د دې مضمون لپاره ټولټال او بریالیتوب نمرې تنظیم کړئ");
  }

  const classStudents = await getStudentsForClass(classId, search);

  const existingMarks = await db
    .select()
    .from(studentMarks)
    .where(
      and(
        eq(studentMarks.examId, Number(examId)),
        eq(studentMarks.classId, Number(classId)),
        eq(studentMarks.subjectId, Number(subjectId))
      )
    );

  const markMap = Object.fromEntries(existingMarks.map((m) => [m.studentId, m]));

  const [subject] = await db
    .select({ name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, Number(subjectId)));

  const sheet = classStudents.map((st) => {
    const mark = markMap[st.id];
    return {
      studentId: st.id,
      fullName: st.fullName,
      fatherName: st.fatherName,
      rollNumber: st.rollNumber,
      totalMarks: config.totalMarks,
      obtainedMarks: mark?.obtainedMarks ?? null,
      status: mark?.status ?? null,
      remarks: mark?.remarks ?? "",
      markId: mark?.id ?? null,
    };
  });

  res.respond(200, "د نمرو داخلولو لیست ترلاسه شو", {
    config: {
      totalMarks: config.totalMarks,
      passingMarks: config.passingMarks,
    },
    subjectName: subject?.name,
    examTitle: exam.examTitle,
    students: sheet,
  });
});

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
export const getMarkById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [row] = await db
    .select({
      id: studentMarks.id,
      examId: studentMarks.examId,
      classId: studentMarks.classId,
      subjectId: studentMarks.subjectId,
      studentId: studentMarks.studentId,
      institutionType: studentMarks.institutionType,
      obtainedMarks: studentMarks.obtainedMarks,
      status: studentMarks.status,
      remarks: studentMarks.remarks,
      studentName: students.fullName,
      subjectName: subjects.name,
    })
    .from(studentMarks)
    .innerJoin(students, eq(studentMarks.studentId, students.id))
    .innerJoin(subjects, eq(studentMarks.subjectId, subjects.id))
    .where(eq(studentMarks.id, Number(id)));

  if (!row) return res.respond(404, "نمرې ونه موندل شوې");

  res.respond(200, "نمرې ترلاسه شوې", { mark: row });
});

// ─── CREATE SINGLE ─────────────────────────────────────────────────────────────
export const createMark = asyncHandler(async (req, res) => {
  const {
    examId,
    classId,
    subjectId,
    studentId,
    institutionType,
    obtainedMarks,
    status,
    remarks,
  } = req.body;

  const { exam } = await validateExamClassContext(examId, classId, institutionType);
  await validateSubjectForClass(subjectId, classId, institutionType, exam.academicYear);

  const config = await getConfigForSubject(examId, classId, subjectId);
  if (!config) return res.respond(400, "د مضمون تنظیم نشته");

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, Number(studentId)), eq(students.classId, Number(classId))));

  if (!student) return res.respond(400, "زده کوونکی په دې ټولګي کې ونه موندل شو");

  const [duplicate] = await db
    .select({ id: studentMarks.id })
    .from(studentMarks)
    .where(
      and(
        eq(studentMarks.examId, Number(examId)),
        eq(studentMarks.classId, Number(classId)),
        eq(studentMarks.subjectId, Number(subjectId)),
        eq(studentMarks.studentId, Number(studentId))
      )
    );

  if (duplicate) return res.respond(409, "د دې زده کوونکي نمرې لا دمخه ثبت شوې دي");

  const finalStatus = status || "Pass";
  const validatedObtained = validateObtainedMarks(obtainedMarks, config.totalMarks, finalStatus);
  const computedStatus =
    finalStatus === "Absent"
      ? "Absent"
      : computeMarkStatus(validatedObtained, config.passingMarks, finalStatus);

  const [created] = await db
    .insert(studentMarks)
    .values({
      examId: Number(examId),
      classId: Number(classId),
      subjectId: Number(subjectId),
      studentId: Number(studentId),
      institutionType,
      obtainedMarks: validatedObtained,
      status: computedStatus,
      remarks: remarks || null,
    })
    .returning();

  res.respond(201, "نمرې بریالي ثبت شوې", { mark: created });
});

// ─── BULK SAVE ─────────────────────────────────────────────────────────────────
export const bulkSaveMarks = asyncHandler(async (req, res) => {
  const { examId, classId, subjectId, institutionType, marks } = req.body;

  if (!Array.isArray(marks) || marks.length === 0) {
    return res.respond(400, "د ثبتولو لپاره نمرې نشته");
  }

  const { exam } = await validateExamClassContext(examId, classId, institutionType);
  await validateSubjectForClass(subjectId, classId, institutionType, exam.academicYear);

  const config = await getConfigForSubject(examId, classId, subjectId);
  if (!config) return res.respond(400, "د مضمون تنظیم نشته");

  let saved = 0;
  let failed = 0;
  const errors = [];

  for (const item of marks) {
    try {
      const { studentId, obtainedMarks, status, remarks, markId } = item;
      const finalStatus = status || "Pass";
      const validatedObtained = validateObtainedMarks(
        obtainedMarks,
        config.totalMarks,
        finalStatus
      );
      const computedStatus =
        finalStatus === "Absent"
          ? "Absent"
          : computeMarkStatus(validatedObtained, config.passingMarks, finalStatus);

      if (markId) {
        await db
          .update(studentMarks)
          .set({
            obtainedMarks: validatedObtained,
            status: computedStatus,
            remarks: remarks || null,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(studentMarks.id, Number(markId)));
      } else {
        const [dup] = await db
          .select({ id: studentMarks.id })
          .from(studentMarks)
          .where(
            and(
              eq(studentMarks.examId, Number(examId)),
              eq(studentMarks.classId, Number(classId)),
              eq(studentMarks.subjectId, Number(subjectId)),
              eq(studentMarks.studentId, Number(studentId))
            )
          );

        if (dup) {
          await db
            .update(studentMarks)
            .set({
              obtainedMarks: validatedObtained,
              status: computedStatus,
              remarks: remarks || null,
              updatedAt: sql`(datetime('now'))`,
            })
            .where(eq(studentMarks.id, dup.id));
        } else {
          await db.insert(studentMarks).values({
            examId: Number(examId),
            classId: Number(classId),
            subjectId: Number(subjectId),
            studentId: Number(studentId),
            institutionType,
            obtainedMarks: validatedObtained,
            status: computedStatus,
            remarks: remarks || null,
          });
        }
      }
      saved += 1;
    } catch (err) {
      failed += 1;
      errors.push({ studentId: item.studentId, message: err.message });
    }
  }

  res.respond(200, `${saved} نمرې بریالي ثبت شوې${failed > 0 ? `، ${failed} ناکام` : ""}`, {
    saved,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateMark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { obtainedMarks, status, remarks } = req.body;

  const [existing] = await db.select().from(studentMarks).where(eq(studentMarks.id, Number(id)));
  if (!existing) return res.respond(404, "نمرې ونه موندل شوې");

  const config = await getConfigForSubject(
    existing.examId,
    existing.classId,
    existing.subjectId
  );
  if (!config) return res.respond(400, "د مضمون تنظیم نشته");

  const finalStatus = status ?? existing.status;
  const validatedObtained = validateObtainedMarks(
    obtainedMarks ?? existing.obtainedMarks,
    config.totalMarks,
    finalStatus
  );
  const computedStatus =
    finalStatus === "Absent"
      ? "Absent"
      : computeMarkStatus(validatedObtained, config.passingMarks, finalStatus);

  const [updated] = await db
    .update(studentMarks)
    .set({
      obtainedMarks: validatedObtained,
      status: computedStatus,
      remarks: remarks !== undefined ? remarks : existing.remarks,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(studentMarks.id, Number(id)))
    .returning();

  res.respond(200, "نمرې بریالي تازه شوې", { mark: updated });
});

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const deleteMark = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db
    .select({ id: studentMarks.id })
    .from(studentMarks)
    .where(eq(studentMarks.id, Number(id)));

  if (!existing) return res.respond(404, "نمرې ونه موندل شوې");

  await db.delete(studentMarks).where(eq(studentMarks.id, Number(id)));

  res.respond(200, "نمرې بریالي ړنګ شوې");
});

// ─── EXPORT ────────────────────────────────────────────────────────────────────
export const exportMarksExcel = asyncHandler(async (req, res) => {
  const buffer = await generateMarksExcel(req.query);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="marks-export.xlsx"');
  res.send(buffer);
});

export const exportMarksPDF = asyncHandler(async (req, res) => {
  const buffer = await generateMarksPDF(req.query);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="marks-export.pdf"');
  res.send(buffer);
});

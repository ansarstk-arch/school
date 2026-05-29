import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  examSubjectConfig,
  exams,
  classes,
  subjects,
  subjectClasses,
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import {
  validateExamClassContext,
  validateSubjectForClass,
  validateMarksConfig,
  validateSchoolYearlyTotal,
} from "../../utils/marksHelpers.util.js";

// ─── GET ALL CONFIGS ───────────────────────────────────────────────────────────
export const getAllExamSubjectConfigs = asyncHandler(async (req, res) => {
  const {
    examId,
    classId,
    subjectId,
    institutionType,
    academicYear,
    dateFrom,
    dateTo,
    page = 1,
    limit = 12,
    search,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];

  if (examId) conditions.push(eq(examSubjectConfig.examId, Number(examId)));
  if (classId) conditions.push(eq(examSubjectConfig.classId, Number(classId)));
  if (subjectId) conditions.push(eq(examSubjectConfig.subjectId, Number(subjectId)));
  if (institutionType) conditions.push(eq(examSubjectConfig.institutionType, institutionType));
  if (academicYear) conditions.push(eq(exams.academicYear, academicYear));
  if (dateFrom) conditions.push(sql`${exams.startDate} >= ${dateFrom}`);
  if (dateTo) conditions.push(sql`${exams.endDate} <= ${dateTo}`);
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        like(exams.examTitle, q),
        like(subjects.name, q),
        like(classes.name, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: examSubjectConfig.id,
      examId: examSubjectConfig.examId,
      classId: examSubjectConfig.classId,
      subjectId: examSubjectConfig.subjectId,
      institutionType: examSubjectConfig.institutionType,
      totalMarks: examSubjectConfig.totalMarks,
      passingMarks: examSubjectConfig.passingMarks,
      createdAt: examSubjectConfig.createdAt,
      updatedAt: examSubjectConfig.updatedAt,
      examTitle: exams.examTitle,
      examStartDate: exams.startDate,
      examEndDate: exams.endDate,
      academicYear: exams.academicYear,
      className: classes.name,
      classSection: classes.section,
      subjectName: subjects.name,
    })
    .from(examSubjectConfig)
    .innerJoin(exams, eq(examSubjectConfig.examId, exams.id))
    .innerJoin(classes, eq(examSubjectConfig.classId, classes.id))
    .innerJoin(subjects, eq(examSubjectConfig.subjectId, subjects.id))
    .where(whereClause)
    .orderBy(desc(examSubjectConfig.updatedAt))
    .limit(Number(limit))
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(examSubjectConfig)
    .innerJoin(exams, eq(examSubjectConfig.examId, exams.id))
    .innerJoin(classes, eq(examSubjectConfig.classId, classes.id))
    .innerJoin(subjects, eq(examSubjectConfig.subjectId, subjects.id))
    .where(whereClause);

  res.respond(200, "د امتحان مضامین تنظیم ترلاسه شول", {
    configs: rows,
    pagination: {
      total: countResult?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult?.count || 0) / Number(limit)) || 1,
    },
  });
});

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
export const getExamSubjectConfigById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [row] = await db
    .select({
      id: examSubjectConfig.id,
      examId: examSubjectConfig.examId,
      classId: examSubjectConfig.classId,
      subjectId: examSubjectConfig.subjectId,
      institutionType: examSubjectConfig.institutionType,
      totalMarks: examSubjectConfig.totalMarks,
      passingMarks: examSubjectConfig.passingMarks,
      createdAt: examSubjectConfig.createdAt,
      updatedAt: examSubjectConfig.updatedAt,
      examTitle: exams.examTitle,
      className: classes.name,
      subjectName: subjects.name,
    })
    .from(examSubjectConfig)
    .innerJoin(exams, eq(examSubjectConfig.examId, exams.id))
    .innerJoin(classes, eq(examSubjectConfig.classId, classes.id))
    .innerJoin(subjects, eq(examSubjectConfig.subjectId, subjects.id))
    .where(eq(examSubjectConfig.id, Number(id)));

  if (!row) return res.respond(404, "تنظیم ونه موندل شو");

  res.respond(200, "تنظیم ترلاسه شو", { config: row });
});

// ─── SUBJECTS FOR CLASS (step 2 of config flow) ────────────────────────────────
export const getSubjectsForExamClass = asyncHandler(async (req, res) => {
  const { examId, classId, institutionType } = req.query;

  if (!examId || !classId || !institutionType) {
    return res.respond(400, "امتحان، ټولګی او د ادارې ډول اړین دي");
  }

  const { exam } = await validateExamClassContext(examId, classId, institutionType);

  const classSubjects = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(subjectClasses)
    .innerJoin(subjects, eq(subjectClasses.subjectId, subjects.id))
    .where(
      and(
        eq(subjectClasses.classId, Number(classId)),
        eq(subjects.type, institutionType),
        eq(subjects.academicYear, exam.academicYear)
      )
    );

  const existingConfigs = await db
    .select()
    .from(examSubjectConfig)
    .where(
      and(
        eq(examSubjectConfig.examId, Number(examId)),
        eq(examSubjectConfig.classId, Number(classId))
      )
    );

  const configMap = Object.fromEntries(existingConfigs.map((c) => [c.subjectId, c]));

  const subjectsWithConfig = classSubjects.map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    config: configMap[s.subjectId]
      ? {
          id: configMap[s.subjectId].id,
          totalMarks: configMap[s.subjectId].totalMarks,
          passingMarks: configMap[s.subjectId].passingMarks,
        }
      : null,
  }));

  res.respond(200, "مضامین ترلاسه شول", {
    exam: { id: exam.id, examTitle: exam.examTitle, academicYear: exam.academicYear },
    subjects: subjectsWithConfig,
  });
});

// ─── CREATE ────────────────────────────────────────────────────────────────────
export const createExamSubjectConfig = asyncHandler(async (req, res) => {
  const { examId, classId, subjectId, institutionType, totalMarks, passingMarks } = req.body;

  const { exam } = await validateExamClassContext(examId, classId, institutionType);
  await validateSubjectForClass(subjectId, classId, institutionType, exam.academicYear);
  const { total, passing } = validateMarksConfig(totalMarks, passingMarks);

  // Validate School yearly total marks limit
  const validation = await validateSchoolYearlyTotal(
    examId,
    subjectId,
    classId,
    total,
    exam.academicYear
  );

  if (!validation.valid) {
    return res.respond(
      400,
      `د ښوونځي امتحانونو لپاره د دې مضمون ټولټال نمرې د ${validation.limit} څخه زیاتې نشي کیدای. اوسنی ټولټال: ${validation.currentTotal}، نوی ټولټال به: ${validation.newTotal} وي`
    );
  }

  const [duplicate] = await db
    .select({ id: examSubjectConfig.id })
    .from(examSubjectConfig)
    .where(
      and(
        eq(examSubjectConfig.examId, Number(examId)),
        eq(examSubjectConfig.classId, Number(classId)),
        eq(examSubjectConfig.subjectId, Number(subjectId))
      )
    );

  if (duplicate) {
    return res.respond(409, "د دې مضمون لپاره تنظیم لا دمخه شتون لري");
  }

  const [created] = await db
    .insert(examSubjectConfig)
    .values({
      examId: Number(examId),
      classId: Number(classId),
      subjectId: Number(subjectId),
      institutionType,
      totalMarks: total,
      passingMarks: passing,
    })
    .returning();

  res.respond(201, "مضمون تنظیم بریالي ثبت شو", { config: created });
});

// ─── BULK UPSERT (config screen save all) ──────────────────────────────────────
export const bulkUpsertExamSubjectConfig = asyncHandler(async (req, res) => {
  const { examId, classId, institutionType, configs } = req.body;

  if (!Array.isArray(configs) || configs.length === 0) {
    return res.respond(400, "لږ تر لږه یو مضمون اړین دی");
  }

  const { exam } = await validateExamClassContext(examId, classId, institutionType);

  const saved = [];
  const errors = [];

  for (const item of configs) {
    try {
      const { subjectId, totalMarks, passingMarks } = item;
      await validateSubjectForClass(subjectId, classId, institutionType, exam.academicYear);
      const { total, passing } = validateMarksConfig(totalMarks, passingMarks);

      // Validate School yearly total marks limit
      const validation = await validateSchoolYearlyTotal(
        examId,
        subjectId,
        classId,
        total,
        exam.academicYear
      );

      if (!validation.valid) {
        errors.push({
          subjectId,
          message: `د ښوونځي امتحانونو لپاره د دې مضمون ټولټال نمرې د ${validation.limit} څخه زیاتې نشي کیدای. اوسنی: ${validation.currentTotal}، نوی به: ${validation.newTotal} وي (پاتې: ${validation.remaining})`
        });
        continue;
      }

      const [existing] = await db
        .select()
        .from(examSubjectConfig)
        .where(
          and(
            eq(examSubjectConfig.examId, Number(examId)),
            eq(examSubjectConfig.classId, Number(classId)),
            eq(examSubjectConfig.subjectId, Number(subjectId))
          )
        );

      if (existing) {
        const [updated] = await db
          .update(examSubjectConfig)
          .set({
            totalMarks: total,
            passingMarks: passing,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(examSubjectConfig.id, existing.id))
          .returning();
        saved.push(updated);
      } else {
        const [created] = await db
          .insert(examSubjectConfig)
          .values({
            examId: Number(examId),
            classId: Number(classId),
            subjectId: Number(subjectId),
            institutionType,
            totalMarks: total,
            passingMarks: passing,
          })
          .returning();
        saved.push(created);
      }
    } catch (err) {
      errors.push({ subjectId: item.subjectId, message: err.message });
    }
  }

  if (errors.length > 0 && saved.length === 0) {
    return res.respond(400, "د تنظیم ثبتول ناکام شول", { errors });
  }

  res.respond(200, `${saved.length} مضامین بریالي تنظیم شول`, {
    configs: saved,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateExamSubjectConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { totalMarks, passingMarks } = req.body;

  const [existing] = await db
    .select()
    .from(examSubjectConfig)
    .where(eq(examSubjectConfig.id, Number(id)));

  if (!existing) return res.respond(404, "تنظیم ونه موندل شو");

  const { total, passing } = validateMarksConfig(
    totalMarks ?? existing.totalMarks,
    passingMarks ?? existing.passingMarks
  );

  // Get exam details for validation
  const [exam] = await db
    .select({ academicYear: exams.academicYear })
    .from(exams)
    .where(eq(exams.id, existing.examId));

  // Validate School yearly total marks limit
  const validation = await validateSchoolYearlyTotal(
    existing.examId,
    existing.subjectId,
    existing.classId,
    total,
    exam.academicYear
  );

  if (!validation.valid) {
    return res.respond(
      400,
      `د ښوونځي امتحانونو لپاره د دې مضمون ټولټال نمرې د ${validation.limit} څخه زیاتې نشي کیدای. اوسنی: ${validation.currentTotal}، نوی به: ${validation.newTotal} وي (پاتې: ${validation.remaining})`
    );
  }

  const [updated] = await db
    .update(examSubjectConfig)
    .set({
      totalMarks: total,
      passingMarks: passing,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(examSubjectConfig.id, Number(id)))
    .returning();

  res.respond(200, "تنظیم بریالي تازه شو", { config: updated });
});

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const deleteExamSubjectConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db
    .select({ id: examSubjectConfig.id })
    .from(examSubjectConfig)
    .where(eq(examSubjectConfig.id, Number(id)));

  if (!existing) return res.respond(404, "تنظیم ونه موندل شو");

  await db.delete(examSubjectConfig).where(eq(examSubjectConfig.id, Number(id)));

  res.respond(200, "تنظیم بریالي ړنګ شو");
});

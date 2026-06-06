import { eq, and, inArray, sql } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { exams, classes } from "../db/schema.js";
import { currentShamsiYear } from "../lib/afghan-date.js";

/** Default School exam titles (Pashto) — combined per-subject total must not exceed 100 */
export const DEFAULT_SCHOOL_EXAM_TITLES = ["څلور نیمه", "سالانه"];

export const DEFAULT_SCHOOL_EXAM_TYPES = {
  "څلور نیمه": "FirstTerm",
  سالانه: "Annual",
};

export const isDefaultSchoolExam = (exam) =>
  exam?.institutionType === "School" &&
  DEFAULT_SCHOOL_EXAM_TITLES.includes(exam?.examTitle);

export const isDefaultSchoolExamTitle = (title) =>
  DEFAULT_SCHOOL_EXAM_TITLES.includes(title);

/** Sync assignedClasses on default School exams for an academic year */
export const syncSchoolExamClassAssignments = async (academicYear) => {
  const year = String(academicYear || currentShamsiYear());
  const schoolClasses = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.type, "School"), eq(classes.academicYear, year)));

  const schoolClassIds = schoolClasses.map((c) => c.id);
  const assignedJson = JSON.stringify(schoolClassIds);

  for (const title of DEFAULT_SCHOOL_EXAM_TITLES) {
    await db
      .update(exams)
      .set({
        assignedClasses: assignedJson,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(
        and(
          eq(exams.institutionType, "School"),
          eq(exams.academicYear, year),
          eq(exams.examTitle, title)
        )
      );
  }
};

/** Ensure default School exams exist for a year */
export const ensureDefaultSchoolExamsForYear = async (academicYear) => {
  const year = String(academicYear || currentShamsiYear());

  const schoolClasses = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.type, "School"), eq(classes.academicYear, year)));
  const schoolClassIds = schoolClasses.map((c) => c.id);

  const existing = await db
    .select({ id: exams.id, examTitle: exams.examTitle })
    .from(exams)
    .where(and(eq(exams.institutionType, "School"), eq(exams.academicYear, year)));

  const existingTitles = new Set(existing.map((e) => e.examTitle));

  for (const title of DEFAULT_SCHOOL_EXAM_TITLES) {
    if (existingTitles.has(title)) continue;
    await db.insert(exams).values({
      examTitle: title,
      examType: DEFAULT_SCHOOL_EXAM_TYPES[title],
      institutionType: "School",
      assignedClasses: JSON.stringify(schoolClassIds),
      startDate: `${year}-01-01`,
      endDate: `${year}-12-30`,
      status: "فعال",
      academicYear: year,
    });
  }

  await syncSchoolExamClassAssignments(year);

  for (const title of DEFAULT_SCHOOL_EXAM_TITLES) {
    await db
      .update(exams)
      .set({
        examType: DEFAULT_SCHOOL_EXAM_TYPES[title],
        updatedAt: sql`(datetime('now'))`,
      })
      .where(
        and(
          eq(exams.institutionType, "School"),
          eq(exams.academicYear, year),
          eq(exams.examTitle, title)
        )
      );
  }
};

/** IDs of default School exams for a year (used in 100-mark validation) */
export const getDefaultSchoolExamIds = async (academicYear) => {
  const year = String(academicYear || currentShamsiYear());
  const rows = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.institutionType, "School"),
        eq(exams.academicYear, year),
        inArray(exams.examTitle, DEFAULT_SCHOOL_EXAM_TITLES)
      )
    );
  return rows.map((r) => r.id);
};

/** Certificate exam type for report card rendering */
export const resolveCertificateExamType = (exam) => {
  if (!exam) return "SingleExam";
  if (exam.examTitle === "څلور نیمه") return "FirstTerm";
  if (exam.examTitle === "سالانه") return "Annual";
  if (exam.examType === "FirstTerm") return "FirstTerm";
  if (exam.examType === "Annual") return "Annual";
  return "SingleExam";
};

/**
 * Result calculation preparation — decoupled from marks entry.
 * Aggregates student_marks + exam_subject_config into exam_result_prep.
 */

import { eq, and, sql } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import {
  studentMarks,
  examSubjectConfig,
  examResultPrep,
  students,
  exams,
} from "../db/schema.js";
import ApiError from "../utils/ApiError.util.js";
import { validateExamClassContext } from "../utils/marksHelpers.util.js";

const gradeFromPercentage = (pct) => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
};

const gpaFromPercentage = (pct) => {
  if (pct >= 90) return 4.0;
  if (pct >= 80) return 3.5;
  if (pct >= 70) return 3.0;
  if (pct >= 60) return 2.5;
  if (pct >= 50) return 2.0;
  return 0;
};

/**
 * Build/refresh result prep rows for exam + class.
 * Does not modify student_marks.
 */
export const calculateResultPrep = async (examId, classId, institutionType) => {
  const { exam, class: cls } = await validateExamClassContext(examId, classId, institutionType);

  const configs = await db
    .select()
    .from(examSubjectConfig)
    .where(
      and(
        eq(examSubjectConfig.examId, Number(examId)),
        eq(examSubjectConfig.classId, Number(classId))
      )
    );

  if (configs.length === 0) {
    throw new ApiError(400, "د دې امتحان لپاره د مضامینو تنظیم نشته");
  }

  const classStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.classId, Number(classId)));

  const marksRows = await db
    .select()
    .from(studentMarks)
    .where(
      and(
        eq(studentMarks.examId, Number(examId)),
        eq(studentMarks.classId, Number(classId))
      )
    );

  const results = [];

  for (const st of classStudents) {
    const studentMarkRows = marksRows.filter((m) => m.studentId === st.id);
    const subjectDetails = [];
    let totalObtained = 0;
    let totalPossible = 0;
    let failedSubjects = 0;
    let absentSubjects = 0;

    for (const cfg of configs) {
      const mark = studentMarkRows.find((m) => m.subjectId === cfg.subjectId);
      totalPossible += cfg.totalMarks;

      if (!mark || mark.status === "Absent") {
        absentSubjects += 1;
        subjectDetails.push({
          subjectId: cfg.subjectId,
          totalMarks: cfg.totalMarks,
          passingMarks: cfg.passingMarks,
          obtainedMarks: null,
          status: mark?.status || "Absent",
        });
        continue;
      }

      const obtained = Number(mark.obtainedMarks) || 0;
      totalObtained += obtained;

      if (mark.status === "Fail") failedSubjects += 1;

      subjectDetails.push({
        subjectId: cfg.subjectId,
        totalMarks: cfg.totalMarks,
        passingMarks: cfg.passingMarks,
        obtainedMarks: obtained,
        status: mark.status,
      });
    }

    const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    const overallStatus =
      failedSubjects > 0 || absentSubjects === configs.length ? "Fail" : "Pass";

    results.push({
      examId: Number(examId),
      classId: Number(classId),
      studentId: st.id,
      institutionType,
      totalObtained,
      totalPossible,
      percentage: Math.round(percentage * 100) / 100,
      grade: gradeFromPercentage(percentage),
      gpa: gpaFromPercentage(percentage),
      overallStatus,
      subjectDetails: JSON.stringify(subjectDetails),
      calculationStatus: "ready",
      updatedAt: sql`(datetime('now'))`,
    });
  }

  // Rank by percentage descending
  results.sort((a, b) => b.percentage - a.percentage);
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  // Upsert prep rows
  for (const row of results) {
    const [existing] = await db
      .select({ id: examResultPrep.id })
      .from(examResultPrep)
      .where(
        and(
          eq(examResultPrep.examId, row.examId),
          eq(examResultPrep.classId, row.classId),
          eq(examResultPrep.studentId, row.studentId)
        )
      );

    if (existing) {
      await db.update(examResultPrep).set(row).where(eq(examResultPrep.id, existing.id));
    } else {
      await db.insert(examResultPrep).values({
        ...row,
        createdAt: sql`(datetime('now'))`,
      });
    }
  }

  return {
    examTitle: exam.examTitle,
    className: cls.name,
    studentsProcessed: results.length,
    subjectsCount: configs.length,
  };
};

export default { calculateResultPrep };

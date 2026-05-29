import { eq, and, asc, inArray, sql } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import {
  exams,
  classes,
  subjects,
  subjectClasses,
  students,
  examSubjectConfig,
} from "../db/schema.js";
import ApiError from "./ApiError.util.js";

const INSTITUTION_TYPES = ["School", "Center", "Madrasa"];

export const MARK_STATUSES = ["Pass", "Fail", "Absent"];

export const parseAssignedClasses = (assignedClasses) => {
  if (typeof assignedClasses === "string") {
    try {
      return JSON.parse(assignedClasses);
    } catch {
      return [];
    }
  }
  return Array.isArray(assignedClasses) ? assignedClasses : [];
};

/** Validate exam exists and class belongs to exam + institution */
export const validateExamClassContext = async (examId, classId, institutionType) => {
  const [exam] = await db.select().from(exams).where(eq(exams.id, Number(examId)));
  if (!exam) throw new ApiError(404, "امتحان ونه موندل شو");

  if (!INSTITUTION_TYPES.includes(institutionType)) {
    throw new ApiError(400, "د ادارې ډول سم نه دی");
  }

  if (exam.institutionType !== institutionType) {
    throw new ApiError(400, "د امتحان ادارې ډول سره سمون نلري");
  }

  const assigned = parseAssignedClasses(exam.assignedClasses);
  if (!assigned.map(Number).includes(Number(classId))) {
    throw new ApiError(400, "دا ټولګی د دې امتحان سره تړاو نلري");
  }

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, Number(classId)), eq(classes.type, institutionType)));

  if (!cls) {
    throw new ApiError(400, "ټولګی ونه موندل شو یا د ادارې ډول سره سمون نلري");
  }

  return { exam, class: cls };
};

/** Subject must be linked to class */
export const validateSubjectForClass = async (subjectId, classId, institutionType, academicYear) => {
  const [subject] = await db
    .select()
    .from(subjects)
    .where(
      and(
        eq(subjects.id, Number(subjectId)),
        eq(subjects.type, institutionType),
        eq(subjects.academicYear, academicYear)
      )
    );

  if (!subject) throw new ApiError(400, "مضمون ونه موندل شو");

  const [link] = await db
    .select()
    .from(subjectClasses)
    .where(
      and(
        eq(subjectClasses.subjectId, Number(subjectId)),
        eq(subjectClasses.classId, Number(classId))
      )
    );

  if (!link) throw new ApiError(400, "دا مضمون د ټولګي سره تړاو نلري");

  return subject;
};

export const validateMarksConfig = (totalMarks, passingMarks) => {
  const total = Number(totalMarks);
  const passing = Number(passingMarks);

  if (!Number.isFinite(total) || total <= 0) {
    throw new ApiError(400, "ټولټال نمرې اړینې او مثبتې دي");
  }
  if (total > 100) {
    throw new ApiError(400, "ټولټال نمرې نشي کولی د 100 څخه زیاتې وي");
  }
  if (!Number.isFinite(passing) || passing < 0) {
    throw new ApiError(400, "د بریالیتوب نمرې اړینې دي");
  }
  if (passing > total) {
    throw new ApiError(400, "د بریالیتوب نمرې نشي کولی د ټولټال نمرو څخه زیاتې وي");
  }

  return { total, passing };
};

export const computeMarkStatus = (obtainedMarks, passingMarks, statusOverride) => {
  if (statusOverride === "Absent") return "Absent";
  const obtained = Number(obtainedMarks);
  if (!Number.isFinite(obtained)) return "Fail";
  if (obtained >= Number(passingMarks)) return "Pass";
  return "Fail";
};

export const validateObtainedMarks = (obtainedMarks, totalMarks, status) => {
  if (status === "Absent") return null;

  const obtained = Number(obtainedMarks);
  if (obtainedMarks === "" || obtainedMarks === null || obtainedMarks === undefined) {
    throw new ApiError(400, "ترلاسه شوې نمرې اړینې دي");
  }
  if (!Number.isFinite(obtained) || obtained < 0) {
    throw new ApiError(400, "نمرې منفي نشي کیدای");
  }
  if (obtained > Number(totalMarks)) {
    throw new ApiError(400, `نمرې نشي کولی د ${totalMarks} څخه زیاتې وي`);
  }
  return obtained;
};

/** Students in class for marks entry */
export const getStudentsForClass = async (classId, search) => {
  const conditions = [eq(students.classId, Number(classId))];

  let query = db
    .select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      rollNumber: students.rollNumber,
    })
    .from(students)
    .where(and(...conditions))
    .orderBy(asc(students.rollNumber), asc(students.fullName));

  const list = await query;

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    return list.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.fatherName?.toLowerCase().includes(q) ||
        String(s.rollNumber || "").includes(q)
    );
  }

  return list;
};

export const getConfigForSubject = async (examId, classId, subjectId) => {
  const [config] = await db
    .select()
    .from(examSubjectConfig)
    .where(
      and(
        eq(examSubjectConfig.examId, Number(examId)),
        eq(examSubjectConfig.classId, Number(classId)),
        eq(examSubjectConfig.subjectId, Number(subjectId))
      )
    );
  return config;
};

/**
 * Calculate total marks for a subject across all School exams in an academic year
 * Used to enforce the 100-mark limit for School institution type
 */
export const calculateSchoolYearlyTotalMarks = async (
  subjectId,
  classId,
  academicYear,
  excludeExamId = null
) => {
  // Get all School exams for this academic year
  const schoolExams = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.institutionType, "School"),
        eq(exams.academicYear, academicYear)
      )
    );

  const examIds = schoolExams.map(e => e.id);
  
  if (examIds.length === 0) return 0;

  // Get all configs for this subject and class across all School exams
  const conditions = [
    eq(examSubjectConfig.subjectId, Number(subjectId)),
    eq(examSubjectConfig.classId, Number(classId)),
    inArray(examSubjectConfig.examId, examIds)
  ];

  // Exclude current exam if updating
  if (excludeExamId) {
    conditions.push(sql`${examSubjectConfig.examId} != ${Number(excludeExamId)}`);
  }

  const configs = await db
    .select({ totalMarks: examSubjectConfig.totalMarks })
    .from(examSubjectConfig)
    .where(and(...conditions));

  // Sum up all total marks
  const total = configs.reduce((sum, config) => sum + Number(config.totalMarks || 0), 0);
  return total;
};

/**
 * Validate that School exam total marks don't exceed 100 for the year
 * Returns { valid: boolean, currentTotal: number, newTotal: number, remaining: number }
 */
export const validateSchoolYearlyTotal = async (
  examId,
  subjectId,
  classId,
  newTotalMarks,
  academicYear
) => {
  // Get the exam to check if it's a School exam
  const [exam] = await db
    .select({ institutionType: exams.institutionType })
    .from(exams)
    .where(eq(exams.id, Number(examId)));

  // Only validate for School type
  if (!exam || exam.institutionType !== "School") {
    return { valid: true, currentTotal: 0, newTotal: 0, remaining: 100 };
  }

  // Calculate current total (excluding this exam)
  const currentTotal = await calculateSchoolYearlyTotalMarks(
    subjectId,
    classId,
    academicYear,
    examId
  );

  const newTotal = currentTotal + Number(newTotalMarks);
  const remaining = 100 - newTotal;

  return {
    valid: newTotal <= 100,
    currentTotal,
    newTotal,
    remaining,
    limit: 100
  };
};

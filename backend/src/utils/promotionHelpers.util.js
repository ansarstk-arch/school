import { eq, and, sql } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import {
  students,
  classes,
  studentPromotions,
  studentMarks,
  attendance,
  examResultPrep,
} from "../db/schema.js";
import ApiError from "./ApiError.util.js";

// ─── CLASS PROGRESSION MAPS ────────────────────────────────────────────────────

const SCHOOL_PROGRESSION = {
  "Grade 1": "Grade 2",
  "Grade 2": "Grade 3",
  "Grade 3": "Grade 4",
  "Grade 4": "Grade 5",
  "Grade 5": "Grade 6",
  "Grade 6": "Grade 7",
  "Grade 7": "Grade 8",
  "Grade 8": "Grade 9",
  "Grade 9": "Grade 10",
  "Grade 10": "Grade 11",
  "Grade 11": "Grade 12",
  "Grade 12": "Graduated",
};

const CENTER_PROGRESSION = {
  "Level 1": "Level 2",
  "Level 2": "Level 3",
  "Level 3": "Level 4",
  "Level 4": "Level 5",
  "Level 5": "Completed",
};

const MADRASA_PROGRESSION = {
  "Hifz 1": "Hifz 2",
  "Hifz 2": "Hifz 3",
  "Hifz 3": "Hifz 4",
  "Hifz 4": "Hifz 5",
  "Hifz 5": "Alim",
  "Alim": "Completed",
};

/**
 * Get next class in progression
 */
export const getNextClass = async (currentClassName, institutionType, academicYear) => {
  let progressionMap;
  
  switch (institutionType) {
    case "School":
      progressionMap = SCHOOL_PROGRESSION;
      break;
    case "Center":
      progressionMap = CENTER_PROGRESSION;
      break;
    case "Madrasa":
      progressionMap = MADRASA_PROGRESSION;
      break;
    default:
      throw new ApiError(400, "د ادارې ډول سم نه دی");
  }

  const nextClassName = progressionMap[currentClassName];
  
  if (!nextClassName) {
    return null; // No next class (graduated or completed)
  }

  if (nextClassName === "Graduated" || nextClassName === "Completed") {
    return { graduated: true, nextClassName };
  }

  // Find the next class in database
  const [nextClass] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.name, nextClassName),
        eq(classes.type, institutionType),
        eq(classes.academicYear, academicYear)
      )
    )
    .limit(1);

  if (!nextClass) {
    throw new ApiError(404, `راتلونکی ټولګی (${nextClassName}) ونه موندل شو`);
  }

  return { graduated: false, nextClass };
};

/**
 * Validate promotion data
 */
export const validatePromotion = async (studentId, fromClassId, toClassId, toAcademicYear) => {
  // Check if student exists
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, Number(studentId)));

  if (!student) {
    throw new ApiError(404, "زده کوونکی ونه موندل شو");
  }

  // Check if from class matches student's current class
  if (student.classId !== Number(fromClassId)) {
    throw new ApiError(400, "زده کوونکی په دې ټولګي کې نه دی");
  }

  // Check if to class exists
  const [toClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, Number(toClassId)));

  if (!toClass) {
    throw new ApiError(404, "نوی ټولګی ونه موندل شو");
  }

  // Check if already promoted this year
  const [existingPromotion] = await db
    .select()
    .from(studentPromotions)
    .where(
      and(
        eq(studentPromotions.studentId, Number(studentId)),
        eq(studentPromotions.toAcademicYear, toAcademicYear),
        eq(studentPromotions.isActive, true)
      )
    );

  if (existingPromotion) {
    throw new ApiError(409, "زده کوونکی دمخه په دې کال کې ترفیع شوی دی");
  }

  return { student, toClass };
};

/**
 * Calculate student eligibility for promotion
 */
export const calculateEligibility = async (studentId, academicYear) => {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, Number(studentId)));

  if (!student) {
    return { eligible: false, reason: "زده کوونکی ونه موندل شو" };
  }

  // Get student's exam results
  const results = await db
    .select()
    .from(examResultPrep)
    .where(
      and(
        eq(examResultPrep.studentId, Number(studentId)),
        sql`${examResultPrep.calculationStatus} = 'finalized'`
      )
    )
    .orderBy(sql`${examResultPrep.createdAt} DESC`)
    .limit(1);

  let percentage = 0;
  let totalMarks = 0;
  let obtainedMarks = 0;

  if (results.length > 0) {
    const result = results[0];
    percentage = result.percentage || 0;
    totalMarks = result.totalPossible || 0;
    obtainedMarks = result.totalObtained || 0;
  }

  // Get attendance percentage
  const attendanceStats = await db
    .select({
      total: sql`COUNT(*)`.mapWith(Number),
      present: sql`SUM(CASE WHEN ${attendance.status} = 'Present' THEN 1 ELSE 0 END)`.mapWith(Number),
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.personId, Number(studentId)),
        eq(attendance.attendanceType, "Student"),
        sql`strftime('%Y', ${attendance.attendanceDate}) = ${academicYear}`
      )
    );

  const attendancePercentage = attendanceStats[0]?.total > 0
    ? (attendanceStats[0].present / attendanceStats[0].total) * 100
    : 0;

  // Default criteria (can be overridden by rules)
  const minPercentage = 40;
  const minAttendance = 75;

  const eligible = percentage >= minPercentage && attendancePercentage >= minAttendance;

  return {
    eligible,
    percentage,
    attendancePercentage,
    totalMarks,
    obtainedMarks,
    reason: eligible
      ? "زده کوونکی د ترفیع لپاره وړ دی"
      : `نمرې: ${percentage.toFixed(1)}% (اړین: ${minPercentage}%), حاضري: ${attendancePercentage.toFixed(1)}% (اړین: ${minAttendance}%)`,
  };
};

/**
 * Execute promotion transaction
 */
export const executePromotion = async (promotionData) => {
  const {
    studentId,
    fromClassId,
    fromSection,
    fromAcademicYear,
    fromInstitutionType,
    toClassId,
    toSection,
    toAcademicYear,
    toInstitutionType,
    promotionType,
    promotionStatus,
    promotionDate,
    basedOn,
    totalMarks,
    obtainedMarks,
    percentage,
    attendancePercentage,
    remarks,
    promotedBy,
    batchId,
  } = promotionData;

  // Create promotion record
  const [promotion] = await db
    .insert(studentPromotions)
    .values({
      studentId: Number(studentId),
      fromClassId: Number(fromClassId),
      fromSection,
      fromAcademicYear,
      fromInstitutionType,
      toClassId: Number(toClassId),
      toSection,
      toAcademicYear,
      toInstitutionType,
      promotionType,
      promotionStatus,
      promotionDate,
      basedOn,
      totalMarks,
      obtainedMarks,
      percentage,
      attendancePercentage,
      remarks,
      promotedBy: promotedBy ? Number(promotedBy) : null,
      isActive: true,
    })
    .returning();

  // Update student's class and academic year
  await db
    .update(students)
    .set({
      classId: Number(toClassId),
      section: toSection,
      academicYear: toAcademicYear,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(students.id, Number(studentId)));

  return promotion;
};

/**
 * Rollback promotion
 */
export const rollbackPromotion = async (promotionId) => {
  const [promotion] = await db
    .select()
    .from(studentPromotions)
    .where(eq(studentPromotions.id, Number(promotionId)));

  if (!promotion) {
    throw new ApiError(404, "ترفیع ونه موندل شو");
  }

  if (!promotion.isActive) {
    throw new ApiError(400, "دا ترفیع دمخه لغوه شوی دی");
  }

  // Revert student to original class
  await db
    .update(students)
    .set({
      classId: promotion.fromClassId,
      section: promotion.fromSection,
      academicYear: promotion.fromAcademicYear,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(students.id, promotion.studentId));

  // Mark promotion as inactive
  await db
    .update(studentPromotions)
    .set({
      isActive: false,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(studentPromotions.id, Number(promotionId)));

  return promotion;
};

/**
 * Get students eligible for promotion in a class
 */
export const getEligibleStudentsInClass = async (classId, academicYear) => {
  const classStudents = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.classId, Number(classId)),
        eq(students.academicYear, academicYear)
      )
    );

  const eligibilityPromises = classStudents.map(async (student) => {
    const eligibility = await calculateEligibility(student.id, academicYear);
    return {
      ...student,
      ...eligibility,
    };
  });

  return Promise.all(eligibilityPromises);
};

/**
 * Calculate promotion statistics for a class
 */
export const calculatePromotionStats = async (classId, academicYear) => {
  const eligibleStudents = await getEligibleStudentsInClass(classId, academicYear);

  const stats = {
    total: eligibleStudents.length,
    eligible: eligibleStudents.filter((s) => s.eligible).length,
    notEligible: eligibleStudents.filter((s) => !s.eligible).length,
    averagePercentage: 0,
    averageAttendance: 0,
  };

  if (stats.total > 0) {
    stats.averagePercentage =
      eligibleStudents.reduce((sum, s) => sum + (s.percentage || 0), 0) / stats.total;
    stats.averageAttendance =
      eligibleStudents.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / stats.total;
  }

  return stats;
};

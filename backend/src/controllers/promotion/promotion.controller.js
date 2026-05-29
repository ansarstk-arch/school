import { eq, and, desc, sql, like, or, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  students,
  classes,
  studentPromotions,
  promotionBatches,
  users,
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import {
  validatePromotion,
  executePromotion,
  rollbackPromotion,
  calculateEligibility,
  getEligibleStudentsInClass,
  getNextClass,
} from "../../utils/promotionHelpers.util.js";

// ─── GET ALL PROMOTIONS ────────────────────────────────────────────────────────
export const getAllPromotions = asyncHandler(async (req, res) => {
  const {
    studentId,
    fromClassId,
    toClassId,
    fromAcademicYear,
    toAcademicYear,
    promotionStatus,
    promotionType,
    dateFrom,
    dateTo,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [eq(studentPromotions.isActive, true)];

  if (studentId) conditions.push(eq(studentPromotions.studentId, Number(studentId)));
  if (fromClassId) conditions.push(eq(studentPromotions.fromClassId, Number(fromClassId)));
  if (toClassId) conditions.push(eq(studentPromotions.toClassId, Number(toClassId)));
  if (fromAcademicYear) conditions.push(eq(studentPromotions.fromAcademicYear, fromAcademicYear));
  if (toAcademicYear) conditions.push(eq(studentPromotions.toAcademicYear, toAcademicYear));
  if (promotionStatus) conditions.push(eq(studentPromotions.promotionStatus, promotionStatus));
  if (promotionType) conditions.push(eq(studentPromotions.promotionType, promotionType));
  if (dateFrom) conditions.push(sql`${studentPromotions.promotionDate} >= ${dateFrom}`);
  if (dateTo) conditions.push(sql`${studentPromotions.promotionDate} <= ${dateTo}`);

  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(like(students.fullName, q));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: studentPromotions.id,
      studentId: studentPromotions.studentId,
      studentName: students.fullName,
      studentRollNumber: students.rollNumber,
      fromClassId: studentPromotions.fromClassId,
      fromClassName: sql`fc.name`,
      fromSection: studentPromotions.fromSection,
      fromAcademicYear: studentPromotions.fromAcademicYear,
      fromInstitutionType: studentPromotions.fromInstitutionType,
      toClassId: studentPromotions.toClassId,
      toClassName: sql`tc.name`,
      toSection: studentPromotions.toSection,
      toAcademicYear: studentPromotions.toAcademicYear,
      toInstitutionType: studentPromotions.toInstitutionType,
      promotionType: studentPromotions.promotionType,
      promotionStatus: studentPromotions.promotionStatus,
      promotionDate: studentPromotions.promotionDate,
      basedOn: studentPromotions.basedOn,
      percentage: studentPromotions.percentage,
      attendancePercentage: studentPromotions.attendancePercentage,
      remarks: studentPromotions.remarks,
      promotedBy: studentPromotions.promotedBy,
      promotedByName: users.name,
      createdAt: studentPromotions.createdAt,
    })
    .from(studentPromotions)
    .innerJoin(students, eq(studentPromotions.studentId, students.id))
    .leftJoin(sql`classes fc`, sql`${studentPromotions.fromClassId} = fc.id`)
    .leftJoin(sql`classes tc`, sql`${studentPromotions.toClassId} = tc.id`)
    .leftJoin(users, eq(studentPromotions.promotedBy, users.id))
    .where(whereClause)
    .orderBy(desc(studentPromotions.createdAt))
    .limit(Number(limit))
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(studentPromotions)
    .innerJoin(students, eq(studentPromotions.studentId, students.id))
    .where(whereClause);

  res.respond(200, "ترفیعات ترلاسه شول", {
    promotions: rows,
    pagination: {
      total: countResult?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult?.count || 0) / Number(limit)) || 1,
    },
  });
});

// ─── GET PROMOTION BY ID ───────────────────────────────────────────────────────
export const getPromotionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [row] = await db
    .select({
      id: studentPromotions.id,
      studentId: studentPromotions.studentId,
      studentName: students.fullName,
      studentRollNumber: students.rollNumber,
      fromClassId: studentPromotions.fromClassId,
      fromClassName: sql`fc.name`,
      fromSection: studentPromotions.fromSection,
      fromAcademicYear: studentPromotions.fromAcademicYear,
      fromInstitutionType: studentPromotions.fromInstitutionType,
      toClassId: studentPromotions.toClassId,
      toClassName: sql`tc.name`,
      toSection: studentPromotions.toSection,
      toAcademicYear: studentPromotions.toAcademicYear,
      toInstitutionType: studentPromotions.toInstitutionType,
      promotionType: studentPromotions.promotionType,
      promotionStatus: studentPromotions.promotionStatus,
      promotionDate: studentPromotions.promotionDate,
      basedOn: studentPromotions.basedOn,
      totalMarks: studentPromotions.totalMarks,
      obtainedMarks: studentPromotions.obtainedMarks,
      percentage: studentPromotions.percentage,
      attendancePercentage: studentPromotions.attendancePercentage,
      remarks: studentPromotions.remarks,
      promotedBy: studentPromotions.promotedBy,
      promotedByName: users.name,
      isActive: studentPromotions.isActive,
      createdAt: studentPromotions.createdAt,
      updatedAt: studentPromotions.updatedAt,
    })
    .from(studentPromotions)
    .innerJoin(students, eq(studentPromotions.studentId, students.id))
    .leftJoin(sql`classes fc`, sql`${studentPromotions.fromClassId} = fc.id`)
    .leftJoin(sql`classes tc`, sql`${studentPromotions.toClassId} = tc.id`)
    .leftJoin(users, eq(studentPromotions.promotedBy, users.id))
    .where(eq(studentPromotions.id, Number(id)));

  if (!row) {
    return res.respond(404, "ترفیع ونه موندل شو");
  }

  res.respond(200, "ترفیع ترلاسه شو", { promotion: row });
});

// ─── SEARCH STUDENT BY ID ──────────────────────────────────────────────────────
export const searchStudentById = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const [student] = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      fullName: students.fullName,
      fatherName: students.fatherName,
      classId: students.classId,
      className: classes.name,
      section: students.section,
      academicYear: students.academicYear,
      institutionType: classes.type,
      image: students.image,
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(eq(students.id, Number(studentId)));

  if (!student) {
    return res.respond(404, "زده کوونکی ونه موندل شو");
  }

  // Calculate eligibility
  const eligibility = await calculateEligibility(student.id, student.academicYear);

  res.respond(200, "زده کوونکی وموندل شو", {
    student: {
      ...student,
      ...eligibility,
    },
  });
});

// ─── INDIVIDUAL PROMOTION ──────────────────────────────────────────────────────
export const promoteIndividualStudent = asyncHandler(async (req, res) => {
  const {
    studentId,
    toClassId,
    toAcademicYear,
    promotionStatus = "Promoted",
    remarks,
  } = req.body;

  // Get student's current class
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, Number(studentId)));

  if (!student) {
    return res.respond(404, "زده کوونکی ونه موندل شو");
  }

  if (!student.classId) {
    return res.respond(400, "زده کوونکی په هیڅ ټولګي کې نه دی");
  }

  // Get from class details
  const [fromClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, student.classId));

  // Validate promotion
  await validatePromotion(studentId, student.classId, toClassId, toAcademicYear);

  // Get to class details
  const [toClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, Number(toClassId)));

  // Calculate eligibility
  const eligibility = await calculateEligibility(studentId, student.academicYear);

  // Execute promotion
  const promotion = await executePromotion({
    studentId,
    fromClassId: student.classId,
    fromSection: student.section,
    fromAcademicYear: student.academicYear,
    fromInstitutionType: fromClass.type,
    toClassId: Number(toClassId),
    toSection: toClass.section,
    toAcademicYear,
    toInstitutionType: toClass.type,
    promotionType: "Individual",
    promotionStatus,
    promotionDate: new Date().toISOString().split("T")[0],
    basedOn: eligibility.eligible ? "Marks" : "Manual",
    totalMarks: eligibility.totalMarks,
    obtainedMarks: eligibility.obtainedMarks,
    percentage: eligibility.percentage,
    attendancePercentage: eligibility.attendancePercentage,
    remarks,
    promotedBy: req.user?.id,
  });

  res.respond(201, "زده کوونکی بریالیتوب سره ترفیع شو", { promotion });
});

// ─── WHOLE CLASS PROMOTION ─────────────────────────────────────────────────────
export const promoteWholeClass = asyncHandler(async (req, res) => {
  const {
    fromClassId,
    toClassId,
    toAcademicYear,
    remarks,
  } = req.body;

  // Get from class details
  const [fromClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, Number(fromClassId)));

  if (!fromClass) {
    return res.respond(404, "اوسنی ټولګی ونه موندل شو");
  }

  // Get to class details
  const [toClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, Number(toClassId)));

  if (!toClass) {
    return res.respond(404, "نوی ټولګی ونه موندل شو");
  }

  // Get all students in the class
  const classStudents = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.classId, Number(fromClassId)),
        eq(students.academicYear, fromClass.academicYear)
      )
    );

  if (classStudents.length === 0) {
    return res.respond(404, "په دې ټولګي کې هیڅ زده کوونکی نشته");
  }

  // Create promotion batch
  const [batch] = await db
    .insert(promotionBatches)
    .values({
      batchName: `${fromClass.name} → ${toClass.name} (${new Date().toISOString().split("T")[0]})`,
      batchType: "ClassPromotion",
      fromClassId: Number(fromClassId),
      toClassId: Number(toClassId),
      fromAcademicYear: fromClass.academicYear,
      toAcademicYear,
      institutionType: fromClass.type,
      totalStudents: classStudents.length,
      status: "InProgress",
      startedAt: new Date().toISOString(),
      promotedBy: req.user?.id,
      remarks,
    })
    .returning();

  let promotedCount = 0;
  let repeatedCount = 0;
  let failedCount = 0;
  const errors = [];

  // Process each student
  for (const student of classStudents) {
    try {
      // Calculate eligibility
      const eligibility = await calculateEligibility(student.id, fromClass.academicYear);

      // Determine promotion status
      const promotionStatus = eligibility.eligible ? "Promoted" : "Repeated";
      const targetClassId = eligibility.eligible ? Number(toClassId) : Number(fromClassId);

      // Execute promotion
      await executePromotion({
        studentId: student.id,
        fromClassId: Number(fromClassId),
        fromSection: student.section,
        fromAcademicYear: fromClass.academicYear,
        fromInstitutionType: fromClass.type,
        toClassId: targetClassId,
        toSection: eligibility.eligible ? toClass.section : fromClass.section,
        toAcademicYear,
        toInstitutionType: fromClass.type,
        promotionType: "ClassPromotion",
        promotionStatus,
        promotionDate: new Date().toISOString().split("T")[0],
        basedOn: "Marks",
        totalMarks: eligibility.totalMarks,
        obtainedMarks: eligibility.obtainedMarks,
        percentage: eligibility.percentage,
        attendancePercentage: eligibility.attendancePercentage,
        remarks,
        promotedBy: req.user?.id,
        batchId: batch.id,
      });

      if (promotionStatus === "Promoted") {
        promotedCount++;
      } else {
        repeatedCount++;
      }
    } catch (error) {
      failedCount++;
      errors.push({
        studentId: student.id,
        studentName: student.fullName,
        message: error.message,
      });
    }
  }

  // Update batch statistics
  await db
    .update(promotionBatches)
    .set({
      promotedCount,
      repeatedCount,
      failedCount,
      status: failedCount === 0 ? "Completed" : "PartiallyCompleted",
      completedAt: new Date().toISOString(),
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(promotionBatches.id, batch.id));

  res.respond(200, `ټولګی بریالیتوب سره ترفیع شو`, {
    batch,
    totalStudents: classStudents.length,
    promotedCount,
    repeatedCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// ─── GET ELIGIBLE STUDENTS ─────────────────────────────────────────────────────
export const getEligibleStudents = asyncHandler(async (req, res) => {
  const { classId, academicYear, page = 1, limit = 12 } = req.query;

  if (!classId || !academicYear) {
    return res.respond(400, "ټولګی او تعلیمي کال اړین دي");
  }

  const eligibleStudents = await getEligibleStudentsInClass(classId, academicYear);
  const { paginateArray } = await import("../../utils/pagination.util.js");
  const { items, pagination } = paginateArray(eligibleStudents, page, limit);

  res.respond(200, "وړ زده کوونکي ترلاسه شول", {
    students: items,
    pagination,
    summary: {
      total: eligibleStudents.length,
      eligible: eligibleStudents.filter((s) => s.eligible).length,
      notEligible: eligibleStudents.filter((s) => !s.eligible).length,
    },
  });
});

// ─── PROMOTION PREVIEW ─────────────────────────────────────────────────────────
export const previewPromotion = asyncHandler(async (req, res) => {
  const { studentIds, fromClassId, toClassId, toAcademicYear } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.respond(400, "لږترلږه یو زده کوونکی وټاکئ");
  }

  // Get class details
  const [fromClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, Number(fromClassId)));

  const [toClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, Number(toClassId)));

  if (!fromClass || !toClass) {
    return res.respond(404, "ټولګي ونه موندل شول");
  }

  // Get students with eligibility
  const studentsData = await db
    .select()
    .from(students)
    .where(inArray(students.id, studentIds.map(Number)));

  const preview = await Promise.all(
    studentsData.map(async (student) => {
      const eligibility = await calculateEligibility(student.id, fromClass.academicYear);
      return {
        studentId: student.id,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        currentClass: fromClass.name,
        targetClass: toClass.name,
        eligible: eligibility.eligible,
        percentage: eligibility.percentage,
        attendancePercentage: eligibility.attendancePercentage,
        willBePromoted: eligibility.eligible,
        reason: eligibility.reason,
      };
    })
  );

  const summary = {
    total: preview.length,
    willBePromoted: preview.filter((p) => p.willBePromoted).length,
    willRepeat: preview.filter((p) => !p.willBePromoted).length,
  };

  res.respond(200, "د ترفیع مخکتنه", { preview, summary });
});

// ─── ROLLBACK PROMOTION ────────────────────────────────────────────────────────
export const rollbackPromotionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await rollbackPromotion(id);

  res.respond(200, "ترفیع بریالیتوب سره لغوه شو", { promotion });
});

// ─── GET STUDENT PROMOTION HISTORY ─────────────────────────────────────────────
export const getStudentPromotionHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const history = await db
    .select({
      id: studentPromotions.id,
      fromClassName: sql`fc.name`,
      fromSection: studentPromotions.fromSection,
      fromAcademicYear: studentPromotions.fromAcademicYear,
      toClassName: sql`tc.name`,
      toSection: studentPromotions.toSection,
      toAcademicYear: studentPromotions.toAcademicYear,
      promotionStatus: studentPromotions.promotionStatus,
      promotionDate: studentPromotions.promotionDate,
      percentage: studentPromotions.percentage,
      isActive: studentPromotions.isActive,
    })
    .from(studentPromotions)
    .leftJoin(sql`classes fc`, sql`${studentPromotions.fromClassId} = fc.id`)
    .leftJoin(sql`classes tc`, sql`${studentPromotions.toClassId} = tc.id`)
    .where(eq(studentPromotions.studentId, Number(studentId)))
    .orderBy(desc(studentPromotions.promotionDate));

  res.respond(200, "د زده کوونکي ترفیع تاریخچه", { history });
});

// ─── GET NEXT CLASS ────────────────────────────────────────────────────────────
export const getNextClassForStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { toAcademicYear } = req.query;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, Number(studentId)));

  if (!student) {
    return res.respond(404, "زده کوونکی ونه موندل شو");
  }

  if (!student.classId) {
    return res.respond(400, "زده کوونکی په هیڅ ټولګي کې نه دی");
  }

  const [currentClass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, student.classId));

  if (!currentClass) {
    return res.respond(404, "اوسنی ټولګی ونه موندل شو");
  }

  const nextClassInfo = await getNextClass(
    currentClass.name,
    currentClass.type,
    toAcademicYear || student.academicYear
  );

  res.respond(200, "راتلونکی ټولګی", {
    currentClass: {
      id: currentClass.id,
      name: currentClass.name,
      section: currentClass.section,
      type: currentClass.type,
    },
    nextClass: nextClassInfo,
  });
});

import { eq, like, and, desc, sql, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { exams, classes } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { currentShamsiYear } from "../../lib/afghan-date.js";
import {
  ensureDefaultSchoolExamsForYear,
  syncSchoolExamClassAssignments,
  isDefaultSchoolExamTitle,
  DEFAULT_SCHOOL_EXAM_TITLES,
  DEFAULT_SCHOOL_EXAM_TYPES,
} from "../../utils/schoolExamHelpers.util.js";

// Helper: Parse assigned classes from JSON string or array
const parseAssignedClasses = (assignedClasses) => {
  if (typeof assignedClasses === 'string') {
    try {
      return JSON.parse(assignedClasses);
    } catch (e) {
      throw new ApiError(400, "د ټولګیو فارمټ سم نه دی");
    }
  }
  return Array.isArray(assignedClasses) ? assignedClasses : [];
};

// Helper: Validate that all assigned class IDs exist and match institution type
const validateAssignedClasses = async (classIds, institutionType, academicYear) => {
  if (!Array.isArray(classIds) || classIds.length === 0) {
    throw new ApiError(400, "لږ تر لږه یوه ټولګي اړینه ده");
  }

  // Check if all classes exist and match the institution type and academic year
  const existingClasses = await db
    .select({ id: classes.id, name: classes.name, type: classes.type, academicYear: classes.academicYear })
    .from(classes)
    .where(
      and(
        inArray(classes.id, classIds.map(id => Number(id))),
        eq(classes.type, institutionType),
        eq(classes.academicYear, academicYear)
      )
    );

  if (existingClasses.length !== classIds.length) {
    const foundIds = existingClasses.map(c => c.id);
    const missingIds = classIds.filter(id => !foundIds.includes(Number(id)));
    throw new ApiError(400, `دا ټولګي ونه موندل شول یا د سمې ادارې سره تړاو نلري: ${missingIds.join(', ')}`);
  }

  return existingClasses;
};

// ─── AUTO UPDATE EXAM STATUS ──────────────────────────────────────────────────
export const updateExpiredExamStatuses = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  // Find all active exams that have passed their end date
  const expiredExams = await db
    .select({ id: exams.id, examTitle: exams.examTitle, endDate: exams.endDate })
    .from(exams)
    .where(
      and(
        eq(exams.status, "فعال"),
        sql`${exams.endDate} < ${today}`
      )
    );

  if (expiredExams.length === 0) {
    return res.respond(200, "هیڅ پای ته رسیدلي امتحان ونه موندل شو", { 
      updatedCount: 0,
      expiredExams: []
    });
  }

  // Update expired exams to inactive status
  const expiredIds = expiredExams.map(exam => exam.id);
  
  await db
    .update(exams)
    .set({
      status: "غیر فعال",
      updatedAt: sql`(datetime('now'))`,
    })
    .where(inArray(exams.id, expiredIds));

  res.respond(200, `${expiredExams.length} امتحانات د پای نېټې له امله غیر فعال شول`, {
    updatedCount: expiredExams.length,
    expiredExams: expiredExams.map(exam => ({
      id: exam.id,
      examTitle: exam.examTitle,
      endDate: exam.endDate
    }))
  });
});

// ─── GET ALL EXAMS ─────────────────────────────────────────────────────────────
export const getAllExams = asyncHandler(async (req, res) => {
  // First, automatically update expired exam statuses
  const today = new Date().toISOString().split('T')[0];
  
  await db
    .update(exams)
    .set({
      status: "غیر فعال",
      updatedAt: sql`(datetime('now'))`,
    })
    .where(
      and(
        eq(exams.status, "فعال"),
        sql`${exams.endDate} < ${today}`
      )
    );

  const { 
    id, 
    examTitle, 
    institutionType, 
    status, 
    academicYear,
    page = 1, 
    limit = 12,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;
  await ensureDefaultSchoolExamsForYear(academicYear || String(currentShamsiYear()));

  const offset = (page - 1) * limit;
  const conditions = [];

  // Build filter conditions
  if (id) conditions.push(eq(exams.id, Number(id)));
  if (examTitle) conditions.push(like(exams.examTitle, `%${examTitle}%`));
  if (institutionType) conditions.push(eq(exams.institutionType, institutionType));
  if (status) conditions.push(eq(exams.status, status));
  const year = academicYear || String(currentShamsiYear());
  conditions.push(eq(exams.academicYear, year));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine sort column and order
  const sortColumn = exams[sortBy] || exams.createdAt;
  const orderFn = sortOrder === "asc" ? sortColumn : desc(sortColumn);

  // Execute queries in parallel
  const [examsList, countResult] = await Promise.all([
    db
      .select()
      .from(exams)
      .where(whereClause)
      .orderBy(orderFn)
      .limit(Number(limit))
      .offset(offset),
    
    db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(exams)
      .where(whereClause),
  ]);

  // Parse assigned classes for each exam
  const examsWithParsedClasses = examsList.map(exam => ({
    ...exam,
    assignedClasses: parseAssignedClasses(exam.assignedClasses),
  }));

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  res.respond(200, "امتحانات ترلاسه شول", {
    exams: examsWithParsedClasses,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    },
  });
});

// ─── GET EXAM BY ID ────────────────────────────────────────────────────────────
export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    throw new ApiError(400, "د امتحان پېژندنه سمه نه ده");
  }

  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, Number(id)));

  if (!exam) {
    throw new ApiError(404, "امتحان ونه موندل شو");
  }

  // Parse assigned classes
  const examWithParsedClasses = {
    ...exam,
    assignedClasses: parseAssignedClasses(exam.assignedClasses),
  };

  res.respond(200, "امتحان ترلاسه شو", { exam: examWithParsedClasses });
});

// ─── CREATE EXAM ───────────────────────────────────────────────────────────────
export const createExam = asyncHandler(async (req, res) => {
  const { examTitle, institutionType, assignedClasses, startDate, endDate, status, academicYear, examType } = req.body;

  if (institutionType === "School" && isDefaultSchoolExamTitle(examTitle?.trim())) {
    throw new ApiError(400, "د ښوونځي ډیفالټ امتحانات (څلور نیمه، سالانه) په لاس نه شي جوړېدای");
  }

  const classIds = parseAssignedClasses(assignedClasses);
  await validateAssignedClasses(classIds, institutionType, academicYear);

  const existingExam = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.examTitle, examTitle.trim()),
        eq(exams.institutionType, institutionType),
        eq(exams.academicYear, academicYear)
      )
    );

  if (existingExam.length > 0) {
    throw new ApiError(400, "دا د امتحان نوم دمخه شتون لري");
  }

  const resolvedExamType =
    institutionType === "School" ? (examType || "Custom") : (examType || "Custom");

  const [newExam] = await db
    .insert(exams)
    .values({
      examTitle: examTitle.trim(),
      examType: resolvedExamType,
      institutionType,
      assignedClasses: JSON.stringify(classIds),
      startDate,
      endDate,
      status,
      academicYear,
    })
    .returning();

  // Parse assigned classes for response
  const examWithParsedClasses = {
    ...newExam,
    assignedClasses: parseAssignedClasses(newExam.assignedClasses),
  };

  res.respond(201, "امتحان بریالي ثبت شو", { exam: examWithParsedClasses });
});

// ─── UPDATE EXAM ───────────────────────────────────────────────────────────────
export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { examTitle, institutionType, assignedClasses, startDate, endDate, status, academicYear } = req.body;

  if (!id || isNaN(Number(id))) {
    throw new ApiError(400, "د امتحان پېژندنه سمه نه ده");
  }

  // Check if exam exists
  const [existingExam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, Number(id)));

  if (!existingExam) {
    throw new ApiError(404, "امتحان ونه موندل شو");
  }

  if (isDefaultSchoolExamTitle(existingExam.examTitle)) {
    throw new ApiError(400, "د ښوونځي ډیفالټ امتحان نشي سمول کیدای");
  }

  const classIds = parseAssignedClasses(assignedClasses);
  await validateAssignedClasses(classIds, institutionType, academicYear);

  // Check for duplicate exam title (excluding current exam)
  const duplicateExam = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.examTitle, examTitle.trim()),
        eq(exams.institutionType, institutionType),
        eq(exams.academicYear, academicYear),
        sql`${exams.id} != ${Number(id)}`
      )
    );

  if (duplicateExam.length > 0) {
    throw new ApiError(400, "دا د امتحان نوم دمخه شتون لري");
  }

  // Update the exam
  const [updatedExam] = await db
    .update(exams)
    .set({
      examTitle: examTitle.trim(),
      institutionType,
      assignedClasses: JSON.stringify(classIds),
      startDate,
      endDate,
      status,
      academicYear,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(exams.id, Number(id)))
    .returning();

  // Parse assigned classes for response
  const examWithParsedClasses = {
    ...updatedExam,
    assignedClasses: parseAssignedClasses(updatedExam.assignedClasses),
  };

  res.respond(200, "امتحان بریالي تازه شو", { exam: examWithParsedClasses });
});

// ─── DELETE EXAM ───────────────────────────────────────────────────────────────
export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    throw new ApiError(400, "د امتحان پېژندنه سمه نه ده");
  }

  // Check if exam exists
  const [existingExam] = await db
    .select({ id: exams.id, examTitle: exams.examTitle })
    .from(exams)
    .where(eq(exams.id, Number(id)));

  if (!existingExam) {
    throw new ApiError(404, "امتحان ونه موندل شو");
  }

  if (isDefaultSchoolExamTitle(existingExam.examTitle)) {
    throw new ApiError(400, "د ښوونځي ډیفالټ امتحان نشي ړنګېدای");
  }

  await db.delete(exams).where(eq(exams.id, Number(id)));

  res.respond(200, "امتحان بریالي ړنګ شو", { 
    deletedExam: { 
      id: existingExam.id, 
      examTitle: existingExam.examTitle 
    } 
  });
});

// ─── GET CLASSES BY INSTITUTION TYPE ──────────────────────────────────────────
export const getClassesByInstitution = asyncHandler(async (req, res) => {
  const { institutionType, academicYear } = req.query;

  if (!institutionType) {
    throw new ApiError(400, "د ادارې ډول اړین دی");
  }

  if (!academicYear) {
    throw new ApiError(400, "تعلیمي کال اړین دی");
  }

  const classesList = await db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      type: classes.type,
      academicYear: classes.academicYear,
    })
    .from(classes)
    .where(
      and(
        eq(classes.type, institutionType),
        eq(classes.academicYear, academicYear)
      )
    )
    .orderBy(classes.name, classes.section);

  res.respond(200, "ټولګي ترلاسه شول", { classes: classesList });
});

export default {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getClassesByInstitution,
  updateExpiredExamStatuses,
};
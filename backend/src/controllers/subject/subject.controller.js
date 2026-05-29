import { eq, and, like, desc, sql, inArray, ne } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { subjects, subjectClasses, classes } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";

// ─── GET ALL SUBJECTS ──────────────────────────────────────────────────────────
export const getAllSubjects = asyncHandler(async (req, res) => {
  const { name, type, academicYear, classId, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (name) conditions.push(like(subjects.name, `%${name}%`));
  if (type) conditions.push(eq(subjects.type, type));
  if (academicYear) conditions.push(eq(subjects.academicYear, academicYear));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get subjects
  const subjectsList = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      type: subjects.type,
      academicYear: subjects.academicYear,
      createdAt: subjects.createdAt,
      updatedAt: subjects.updatedAt,
    })
    .from(subjects)
    .where(whereClause)
    .orderBy(desc(subjects.createdAt))
    .limit(Number(limit))
    .offset(offset);

  // Get class assignments for each subject
  const subjectIds = subjectsList.map(s => s.id);
  let classAssignments = [];

  if (subjectIds.length > 0) {
    classAssignments = await db
      .select({
        subjectId: subjectClasses.subjectId,
        classId: subjectClasses.classId,
        className: classes.name,
        section: classes.section,
      })
      .from(subjectClasses)
      .innerJoin(classes, eq(subjectClasses.classId, classes.id))
      .where(inArray(subjectClasses.subjectId, subjectIds));
  }

  // Group classes by subject
  const subjectsWithClasses = subjectsList.map(subject => {
    const assignedClasses = classAssignments
      .filter(ca => ca.subjectId === subject.id)
      .map(ca => ({
        id: ca.classId,
        name: ca.className,
        section: ca.section,
      }));

    return {
      ...subject,
      classes: assignedClasses,
      classIds: assignedClasses.map(c => c.id),
    };
  });

  // Filter by classId if provided
  let filteredSubjects = subjectsWithClasses;
  if (classId) {
    filteredSubjects = subjectsWithClasses.filter(s =>
      s.classIds.includes(Number(classId))
    );
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(subjects)
    .where(whereClause);

  res.respond(200, "مضامین ترلاسه شول", {
    subjects: filteredSubjects,
    pagination: {
      total: countResult?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult?.count || 0) / limit),
    },
  });
});

// ─── GET SUBJECT BY ID ─────────────────────────────────────────────────────────
export const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [subject] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, Number(id)));

  if (!subject) throw new ApiError(404, "مضمون ونه موندل شو");

  // Get assigned classes
  const assignedClasses = await db
    .select({
      classId: subjectClasses.classId,
      className: classes.name,
      section: classes.section,
    })
    .from(subjectClasses)
    .innerJoin(classes, eq(subjectClasses.classId, classes.id))
    .where(eq(subjectClasses.subjectId, Number(id)));

  res.respond(200, "مضمون ترلاسه شو", {
    subject: {
      ...subject,
      classes: assignedClasses.map(c => ({
        id: c.classId,
        name: c.className,
        section: c.section,
      })),
      classIds: assignedClasses.map(c => c.classId),
    },
  });
});

// ─── CREATE SUBJECT ────────────────────────────────────────────────────────────
export const createSubject = asyncHandler(async (req, res) => {
  const { name, type, academicYear, classIds = [] } = req.body;

  // Validate name is not just whitespace
  if (!name || !name.trim()) {
    throw new ApiError(400, "د مضمون نوم اړین دی");
  }

  // Validate type
  if (!type || !["School", "Center", "Madrasa"].includes(type)) {
    throw new ApiError(400, "ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  // Validate academicYear
  if (!academicYear) {
    throw new ApiError(400, "تعلیمي کال اړین دی");
  }

  // Validate classIds
  if (!Array.isArray(classIds) || classIds.length === 0) {
    throw new ApiError(400, "لږترلږه یو ټولګی وټاکئ");
  }

  // Check for duplicate: same name + type + academicYear
  const [existing] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        eq(subjects.name, name.trim()),
        eq(subjects.type, type),
        eq(subjects.academicYear, academicYear)
      )
    );

  if (existing) {
    throw new ApiError(400, "دا مضمون دمخه شتون لري (ورته نوم، ډول او تعلیمي کال)");
  }

  // Validate that all classIds belong to the same type and academicYear
  if (classIds.length > 0) {
    const classList = await db
      .select({ id: classes.id, type: classes.type, academicYear: classes.academicYear })
      .from(classes)
      .where(inArray(classes.id, classIds.map(Number)));

    if (classList.length !== classIds.length) {
      throw new ApiError(400, "ځینې ټولګي ونه موندل شول");
    }

    const invalidClasses = classList.filter(
      c => c.type !== type || c.academicYear !== academicYear
    );

    if (invalidClasses.length > 0) {
      throw new ApiError(400, "ټولګي باید د ورته ډول او تعلیمي کال وي");
    }
  }

  // Create subject
  const [newSubject] = await db
    .insert(subjects)
    .values({ name: name.trim(), type, academicYear })
    .returning();

  // Assign classes
  if (classIds.length > 0) {
    await db.insert(subjectClasses).values(
      classIds.map(classId => ({
        subjectId: newSubject.id,
        classId: Number(classId),
      }))
    );
  }

  res.respond(201, "مضمون بریالیتوب سره ثبت شو", { subject: newSubject });
});

// ─── UPDATE SUBJECT ────────────────────────────────────────────────────────────
export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, type, academicYear, classIds } = req.body;

  const [existing] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, Number(id)));

  if (!existing) throw new ApiError(404, "مضمون ونه موندل شو");

  const finalName = name !== undefined ? name.trim() : existing.name;
  const finalType = type ?? existing.type;
  const finalAcademicYear = academicYear ?? existing.academicYear;

  // Validate name is not just whitespace
  if (name !== undefined && !name.trim()) {
    throw new ApiError(400, "د مضمون نوم اړین دی");
  }

  // Validate type
  if (type && !["School", "Center", "Madrasa"].includes(type)) {
    throw new ApiError(400, "ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  // Check for duplicate (exclude self)
  const [dup] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        eq(subjects.name, finalName),
        eq(subjects.type, finalType),
        eq(subjects.academicYear, finalAcademicYear),
        ne(subjects.id, Number(id))
      )
    );

  if (dup) {
    throw new ApiError(400, "دا مضمون دمخه شتون لري (ورته نوم، ډول او تعلیمي کال)");
  }

  // Validate classIds if provided
  if (classIds !== undefined && classIds.length > 0) {
    const classList = await db
      .select({ id: classes.id, type: classes.type, academicYear: classes.academicYear })
      .from(classes)
      .where(inArray(classes.id, classIds.map(Number)));

    if (classList.length !== classIds.length) {
      throw new ApiError(400, "ځینې ټولګي ونه موندل شول");
    }

    const invalidClasses = classList.filter(
      c => c.type !== finalType || c.academicYear !== finalAcademicYear
    );

    if (invalidClasses.length > 0) {
      throw new ApiError(400, "ټولګي باید د ورته ډول او تعلیمي کال وي");
    }
  }

  // Update subject
  const [updated] = await db
    .update(subjects)
    .set({
      name: finalName,
      type: finalType,
      academicYear: finalAcademicYear,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subjects.id, Number(id)))
    .returning();

  // Update class assignments if provided
  if (classIds !== undefined) {
    // Remove old assignments
    await db
      .delete(subjectClasses)
      .where(eq(subjectClasses.subjectId, Number(id)));

    // Add new assignments
    if (classIds.length > 0) {
      await db.insert(subjectClasses).values(
        classIds.map(classId => ({
          subjectId: Number(id),
          classId: Number(classId),
        }))
      );
    }
  }

  res.respond(200, "مضمون بریالیتوب سره تازه شو", { subject: updated });
});

// ─── DELETE SUBJECT ────────────────────────────────────────────────────────────
export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, Number(id)));

  if (!existing) throw new ApiError(404, "مضمون ونه موندل شو");

  // Delete subject (cascade will handle subjectClasses)
  await db.delete(subjects).where(eq(subjects.id, Number(id)));

  res.respond(200, "مضمون بریالیتوب سره ړنګ شو");
});

// ─── GET CLASSES BY TYPE AND YEAR ──────────────────────────────────────────────
export const getClassesByTypeAndYear = asyncHandler(async (req, res) => {
  const { type, academicYear } = req.query;

  if (!type) throw new ApiError(400, "د مضمون ډول اړین دی");
  if (!academicYear) throw new ApiError(400, "تعلیمي کال اړین دی");

  const classList = await db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
    })
    .from(classes)
    .where(
      and(
        eq(classes.type, type),
        eq(classes.academicYear, academicYear)
      )
    )
    .orderBy(classes.name);

  res.respond(200, "ټولګي ترلاسه شول", { classes: classList });
});

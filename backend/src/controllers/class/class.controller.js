import { eq, and, like, or, desc, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { classes, teachers, exams } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";

// ─── GET ALL CLASSES ───────────────────────────────────────────────────────────
export const getAllClasses = asyncHandler(async (req, res) => {
  const { name, type, academicYear, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (name)         conditions.push(like(classes.name, `%${name}%`));
  if (type)         conditions.push(eq(classes.type, type));
  if (academicYear) conditions.push(eq(classes.academicYear, academicYear));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [classesList, countResult] = await Promise.all([
    db
      .select({
        id:           classes.id,
        name:         classes.name,
        section:      classes.section,
        type:         classes.type,
        academicYear: classes.academicYear,
        monthlyFee:   classes.monthlyFee,
        supervisorId: classes.supervisorId,
        supervisorName: teachers.name,
        createdAt:    classes.createdAt,
      })
      .from(classes)
      .leftJoin(teachers, eq(classes.supervisorId, teachers.id))
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(Number(limit))
      .offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(classes).where(whereClause),
  ]);

  res.respond(200, "ټولګي ترلاسه شول", {
    classes: classesList,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

// ─── GET CLASS BY ID ───────────────────────────────────────────────────────────
export const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [cls] = await db
    .select({
      id:             classes.id,
      name:           classes.name,
      section:        classes.section,
      type:           classes.type,
      academicYear:   classes.academicYear,
      monthlyFee:     classes.monthlyFee,
      supervisorId:   classes.supervisorId,
      supervisorName: teachers.name,
      createdAt:      classes.createdAt,
    })
    .from(classes)
    .leftJoin(teachers, eq(classes.supervisorId, teachers.id))
    .where(eq(classes.id, Number(id)));

  if (!cls) throw new ApiError(404, "ټولګی ونه موندل شو");

  res.respond(200, "ټولګی ترلاسه شو", { class: cls });
});

// ─── CREATE CLASS ──────────────────────────────────────────────────────────────
export const createClass = asyncHandler(async (req, res) => {
  const { name, section, type, academicYear, monthlyFee, supervisorId } = req.body;

  // Comprehensive validation
  if (!name || !name.trim()) {
    throw new ApiError(400, "د ټولګي نوم اړین دی");
  }
  if (name.length < 1 || name.length > 100) {
    throw new ApiError(400, "د ټولګي نوم باید د ۱ څخه تر ۱۰۰ توري پورې وي");
  }

  if (!type || !type.trim()) {
    throw new ApiError(400, "د ټولګي ډول اړین دی");
  }
  const validTypes = ["School", "Center", "Madrasa"];
  if (!validTypes.includes(type)) {
    throw new ApiError(400, "د ټولګي ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  if (!academicYear || !academicYear.trim()) {
    throw new ApiError(400, "تعلیمي کال اړین دی");
  }
  if (!/^\d{4}$/.test(academicYear)) {
    throw new ApiError(400, "تعلیمي کال باید د څلورو عددونو څخه جوړ وي");
  }

  if (section && (section.length < 1 || section.length > 50)) {
    throw new ApiError(400, "د ټولګي برخه باید د ۱ څخه تر ۵۰ توري پورې وي");
  }

  if (monthlyFee && (isNaN(monthlyFee) || Number(monthlyFee) < 0)) {
    throw new ApiError(400, "میاشتنۍ فیس باید مثبت عدد وي");
  }

  // Duplicate check: same name + section + type + academicYear
  const [existing] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(
      and(
        eq(classes.name, name.trim()),
        eq(classes.type, type),
        eq(classes.academicYear, academicYear),
        section
          ? eq(classes.section, section.trim())
          : sql`${classes.section} IS NULL`
      )
    );

  if (existing) throw new ApiError(400, "دا ټولګی دمخه شتون لري (ورته نوم، ډول او تعلیمي کال)");

  // Validate supervisor belongs to compatible type (updated for JSON array format)
  if (supervisorId) {
    const [teacher] = await db.select({ teacherType: teachers.teacherType }).from(teachers).where(eq(teachers.id, Number(supervisorId)));
    if (!teacher) throw new ApiError(400, "نهګران ونه موندل شو");
    
    // Parse teacher types from JSON array
    const teacherTypes = JSON.parse(teacher.teacherType || '["School"]');
    if (!teacherTypes.includes(type)) {
      throw new ApiError(400, "نهګران د دې ټولګي ډول سره سم نه دی");
    }
  }

  const [newClass] = await db.insert(classes).values({
    name: name.trim(),
    section: section ? section.trim() : null,
    type,
    academicYear,
    monthlyFee: monthlyFee ? Number(monthlyFee) : null,
    supervisorId: supervisorId ? Number(supervisorId) : null,
  }).returning();

  // Auto-create exams for School type only
  if (type === "School") {
    const assignedClasses = JSON.stringify([newClass.id]);
    
    await db.insert(exams).values([
      {
        examTitle: `لومړی ازموینه - ${name.trim()}${section ? ` (${section.trim()})` : ''} - ${academicYear}`,
        examType: "FirstTerm",
        institutionType: "School",
        assignedClasses,
        startDate: `${academicYear}-06-01`,
        endDate: `${academicYear}-06-15`,
        status: "فعال",
        academicYear,
      },
      {
        examTitle: `کلنۍ ازموینه - ${name.trim()}${section ? ` (${section.trim()})` : ''} - ${academicYear}`,
        examType: "Annual",
        institutionType: "School",
        assignedClasses,
        startDate: `${academicYear}-12-01`,
        endDate: `${academicYear}-12-15`,
        status: "فعال",
        academicYear,
      },
    ]);
  }

  res.respond(201, "ټولګی بریالیتوب سره ثبت شو", { class: newClass });
});

// ─── UPDATE CLASS ──────────────────────────────────────────────────────────────
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, section, type, academicYear, monthlyFee, supervisorId } = req.body;

  const [existing] = await db.select().from(classes).where(eq(classes.id, Number(id)));
  if (!existing) throw new ApiError(404, "ټولګی ونه موندل شو");

  // Validation for updated fields
  if (name !== undefined) {
    if (!name || !name.trim()) {
      throw new ApiError(400, "د ټولګي نوم اړین دی");
    }
    if (name.length < 1 || name.length > 100) {
      throw new ApiError(400, "د ټولګي نوم باید د ۱ څخه تر ۱۰۰ توري پورې وي");
    }
  }

  if (type !== undefined) {
    if (!type || !type.trim()) {
      throw new ApiError(400, "د ټولګي ډول اړین دی");
    }
    const validTypes = ["School", "Center", "Madrasa"];
    if (!validTypes.includes(type)) {
      throw new ApiError(400, "د ټولګي ډول باید ښوونځی، مرکز یا مدرسه وي");
    }
  }

  if (academicYear !== undefined) {
    if (!academicYear || !academicYear.trim()) {
      throw new ApiError(400, "تعلیمي کال اړین دی");
    }
    if (!/^\d{4}$/.test(academicYear)) {
      throw new ApiError(400, "تعلیمي کال باید د څلورو عددونو څخه جوړ وي");
    }
  }

  if (section !== undefined && section && (section.length < 1 || section.length > 50)) {
    throw new ApiError(400, "د ټولګي برخه باید د ۱ څخه تر ۵۰ توري پورې وي");
  }

  if (monthlyFee !== undefined && monthlyFee && (isNaN(monthlyFee) || Number(monthlyFee) < 0)) {
    throw new ApiError(400, "میاشتنۍ فیس باید مثبت عدد وي");
  }

  const finalName         = name !== undefined ? name.trim() : existing.name;
  const finalSection      = section !== undefined ? (section ? section.trim() : null) : existing.section;
  const finalType         = type ?? existing.type;
  const finalAcademicYear = academicYear ?? existing.academicYear;

  // Duplicate check (exclude self)
  const [dup] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(
      and(
        eq(classes.name, finalName),
        eq(classes.type, finalType),
        eq(classes.academicYear, finalAcademicYear),
        finalSection
          ? eq(classes.section, finalSection)
          : sql`${classes.section} IS NULL`,
        sql`${classes.id} != ${Number(id)}`
      )
    );

  if (dup) throw new ApiError(400, "دا ټولګی دمخه شتون لري (ورته نوم، ډول او تعلیمي کال)");

  // Validate supervisor type compatibility (updated for JSON array format)
  const finalSupervisorId = supervisorId !== undefined ? (supervisorId ? Number(supervisorId) : null) : existing.supervisorId;
  if (finalSupervisorId) {
    const [teacher] = await db.select({ teacherType: teachers.teacherType }).from(teachers).where(eq(teachers.id, finalSupervisorId));
    if (!teacher) throw new ApiError(400, "نهګران ونه موندل شو");
    
    // Parse teacher types from JSON array
    const teacherTypes = JSON.parse(teacher.teacherType || '["School"]');
    if (!teacherTypes.includes(finalType)) {
      throw new ApiError(400, "نهګران د دې ټولګي ډول سره سم نه دی");
    }
  }

  const [updated] = await db
    .update(classes)
    .set({
      name:         finalName,
      section:      finalSection,
      type:         finalType,
      academicYear: finalAcademicYear,
      monthlyFee:   monthlyFee !== undefined ? (monthlyFee ? Number(monthlyFee) : null) : existing.monthlyFee,
      supervisorId: finalSupervisorId,
      updatedAt:    new Date().toISOString(),
    })
    .where(eq(classes.id, Number(id)))
    .returning();

  res.respond(200, "ټولګی بریالیتوب سره تازه شو", { class: updated });
});

// ─── DELETE CLASS ──────────────────────────────────────────────────────────────
export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, Number(id)));
  if (!existing) throw new ApiError(404, "ټولګی ونه موندل شو");

  await db.delete(classes).where(eq(classes.id, Number(id)));

  res.respond(200, "ټولګی بریالیتوب سره ړنګ شو");
});

// ─── GET TEACHERS BY TYPE (for supervisor dropdown) ────────────────────────────
export const getTeachersByType = asyncHandler(async (req, res) => {
  const { type } = req.query;

  if (!type) throw new ApiError(400, "د ټولګي ډول اړین دی");

  // Return teachers whose type array includes the requested type
  const list = await db
    .select({ id: teachers.id, name: teachers.name, teacherType: teachers.teacherType })
    .from(teachers)
    .where(like(teachers.teacherType, `%"${type}"%`))
    .orderBy(teachers.name);

  res.respond(200, "ښوونکي ترلاسه شول", { teachers: list });
});

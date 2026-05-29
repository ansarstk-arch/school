import { eq, like, and, desc, sql, gte, lte } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { teachers, teacherApplicants } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { compressImage, deleteImage, getImageUrl } from "../../utils/imageProcessor.util.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../../uploads/teachers');

// Helper: process uploaded image → compress and return filename
const processUploadedImage = async (file) => {
  if (!file) return null;
  try {
    const compressedPath = path.join(UPLOAD_DIR, `compressed-${file.filename}`);
    await compressImage(file.path, compressedPath, 200);
    return path.basename(compressedPath);
  } catch (err) {
    console.error('Image processing error:', err);
    return null;
  }
};

// Helper: attach imageUrl and qualification alias to a teacher record
const withImageUrl = (record) => {
  if (!record) return record;
  return {
    ...record,
    imageUrl: record.image ? getImageUrl(record.image) : null,
    qualification: record.education || null,
  };
};

// ─── GET ALL TEACHERS ──────────────────────────────────────────────────────────
export const getAllTeachers = asyncHandler(async (req, res) => {
  const { id, name, education, teacherType, joiningYear, page = 1, limit = 12 } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (id)          conditions.push(eq(teachers.id, Number(id)));
  if (name)        conditions.push(like(teachers.name, `%${name}%`));
  if (education)   conditions.push(eq(teachers.education, education));
  if (teacherType) conditions.push(like(teachers.teacherType, `%"${teacherType}"%`));
  if (joiningYear) conditions.push(like(teachers.joiningDate, `${joiningYear}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [teachersList, countResult] = await Promise.all([
    db.select().from(teachers).where(whereClause).orderBy(desc(teachers.createdAt)).limit(Number(limit)).offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(teachers).where(whereClause),
  ]);

  // Parse teacherType JSON to array for each teacher
  const parsedTeachers = teachersList.map(teacher => ({
    ...teacher,
    teacherType: teacher.teacherType ? JSON.parse(teacher.teacherType) : ["School"]
  }));

  res.respond(200, "ښوونکي ترلاسه شول", {
    teachers: parsedTeachers.map(withImageUrl),
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

// ─── GET TEACHER BY ID ─────────────────────────────────────────────────────────
export const getTeacherById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
  if (!teacher) throw new ApiError(404, "ښوونکی ونه موندل شو");

  // Parse teacherType JSON to array
  const parsedTeacher = {
    ...teacher,
    teacherType: teacher.teacherType ? JSON.parse(teacher.teacherType) : ["School"]
  };

  res.respond(200, "ښوونکی ترلاسه شو", { teacher: withImageUrl(parsedTeacher) });
});

// ─── CREATE TEACHER ────────────────────────────────────────────────────────────
export const createTeacher = asyncHandler(async (req, res) => {
  const { name, fatherName, phone, idCardNumber, education, teacherType: teacherTypeRaw, salary, skills, address, joiningDate, notes } = req.body;

  const [existingTeacher] = await db.select().from(teachers).where(eq(teachers.phone, phone));
  if (existingTeacher) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");

  // Parse teacherType from JSON string (sent from FormData)
  let teacherType;
  try {
    teacherType = typeof teacherTypeRaw === 'string' ? JSON.parse(teacherTypeRaw) : teacherTypeRaw;
  } catch (e) {
    console.error("Failed to parse teacherType:", teacherTypeRaw);
    throw new ApiError(400, "د ښوونکي ډول په سمه توګه نه دی لیږل شوی");
  }

  // Validate teacherType - must be array with at least one value
  if (!teacherType || !Array.isArray(teacherType) || teacherType.length === 0) {
    throw new ApiError(400, "د ښوونکي ډول اړین دی - لږترلږه یو ډول وټاکئ");
  }
  
  const validTypes = ["School", "Center", "Madrasa"];
  const invalidTypes = teacherType.filter(type => !validTypes.includes(type));
  if (invalidTypes.length > 0) {
    throw new ApiError(400, "د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  const imageName = await processUploadedImage(req.file);

  const [newTeacher] = await db.insert(teachers).values({
    name,
    fatherName,
    phone,
    idCardNumber: idCardNumber || null,
    education,
    teacherType: JSON.stringify(teacherType), // Store as JSON array
    salary:      salary ? Number(salary) : null,
    skills:      skills || null,
    address:     address || null,
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    image:       imageName,
    notes:       notes || null,
  }).returning();

  // Parse teacherType back to array for response
  const responseTeacher = {
    ...newTeacher,
    teacherType: JSON.parse(newTeacher.teacherType)
  };

  res.respond(201, "ښوونکی بریالیتوب سره ثبت شو", { teacher: withImageUrl(responseTeacher) });
});

// ─── UPDATE TEACHER ────────────────────────────────────────────────────────────
export const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, fatherName, phone, idCardNumber, education, teacherType: teacherTypeRaw, salary, skills, address, joiningDate, notes, removeImage } = req.body;

  const [existingTeacher] = await db.select().from(teachers).where(eq(teachers.id, id));
  if (!existingTeacher) throw new ApiError(404, "ښوونکی ونه موندل شو");

  if (phone && phone !== existingTeacher.phone) {
    const [phoneExists] = await db.select().from(teachers).where(eq(teachers.phone, phone));
    if (phoneExists) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");
  }

  // Parse teacherType from JSON string (sent from FormData) if provided
  let teacherType;
  if (teacherTypeRaw !== undefined) {
    try {
      teacherType = typeof teacherTypeRaw === 'string' ? JSON.parse(teacherTypeRaw) : teacherTypeRaw;
    } catch (e) {
      console.error("Failed to parse teacherType:", teacherTypeRaw);
      throw new ApiError(400, "د ښوونکي ډول په سمه توګه نه دی لیږل شوی");
    }

    // Validate teacherType if provided
    if (!Array.isArray(teacherType) || teacherType.length === 0) {
      throw new ApiError(400, "د ښوونکي ډول اړین دی - لږترلږه یو ډول وټاکئ");
    }

    const validTypes = ["School", "Center", "Madrasa"];
    const invalidTypes = teacherType.filter(type => !validTypes.includes(type));
    if (invalidTypes.length > 0) {
      console.error("Invalid teacher types received:", teacherType);
      console.error("Invalid types:", invalidTypes);
      throw new ApiError(400, "د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي");
    }
  }

  let newImageName = existingTeacher.image;

  if (req.file) {
    if (existingTeacher.image) await deleteImage(path.join(UPLOAD_DIR, existingTeacher.image));
    newImageName = await processUploadedImage(req.file);
  } else if (removeImage === 'true' || removeImage === true) {
    if (existingTeacher.image) await deleteImage(path.join(UPLOAD_DIR, existingTeacher.image));
    newImageName = null;
  }

  const updateData = { updatedAt: new Date().toISOString(), image: newImageName };
  if (name !== undefined)         updateData.name = name;
  if (fatherName !== undefined)   updateData.fatherName = fatherName;
  if (phone !== undefined)        updateData.phone = phone;
  if (idCardNumber !== undefined) updateData.idCardNumber = idCardNumber || null;
  if (education !== undefined)    updateData.education = education;
  if (teacherType !== undefined)  updateData.teacherType = JSON.stringify(teacherType); // Store as JSON array
  if (salary !== undefined)       updateData.salary = salary ? Number(salary) : null;
  if (skills !== undefined)       updateData.skills = skills || null;
  if (address !== undefined)      updateData.address = address || null;
  if (joiningDate !== undefined)  updateData.joiningDate = joiningDate || null;
  if (notes !== undefined)        updateData.notes = notes || null;

  const [updatedTeacher] = await db.update(teachers).set(updateData).where(eq(teachers.id, id)).returning();

  // Parse teacherType back to array for response
  const responseTeacher = {
    ...updatedTeacher,
    teacherType: updatedTeacher.teacherType ? JSON.parse(updatedTeacher.teacherType) : ["School"]
  };

  res.respond(200, "ښوونکی بریالیتوب سره تازه شو", { teacher: withImageUrl(responseTeacher) });
});

// ─── DELETE TEACHER ────────────────────────────────────────────────────────────
export const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingTeacher] = await db.select().from(teachers).where(eq(teachers.id, id));
  if (!existingTeacher) throw new ApiError(404, "ښوونکی ونه موندل شو");

  if (existingTeacher.image) await deleteImage(path.join(UPLOAD_DIR, existingTeacher.image));

  await db.delete(teachers).where(eq(teachers.id, id));

  res.respond(200, "ښوونکی بریالیتوب سره ړنګ شو");
});

// ─── GET ALL APPLICANTS ────────────────────────────────────────────────────────
export const getAllApplicants = asyncHandler(async (req, res) => {
  const { name, phone, skills, appliedYear, dateFrom, dateTo, page = 1, limit = 12 } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (name)        conditions.push(like(teacherApplicants.name, `%${name}%`));
  if (phone)       conditions.push(like(teacherApplicants.phone, `%${phone}%`));
  if (skills)      conditions.push(like(teacherApplicants.skills, `%${skills}%`));
  if (appliedYear) conditions.push(like(teacherApplicants.appliedAt, `${appliedYear}%`));
  if (dateFrom)    conditions.push(gte(teacherApplicants.appliedAt, dateFrom));
  if (dateTo)      conditions.push(lte(teacherApplicants.appliedAt, dateTo));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [applicantsList, countResult] = await Promise.all([
    db.select().from(teacherApplicants).where(whereClause).orderBy(desc(teacherApplicants.createdAt)).limit(Number(limit)).offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(teacherApplicants).where(whereClause),
  ]);

  res.respond(200, "د کار غوښتونکي ترلاسه شول", {
    applicants: applicantsList,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

// ─── GET APPLICANT BY ID ───────────────────────────────────────────────────────
export const getApplicantById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [applicant] = await db.select().from(teacherApplicants).where(eq(teacherApplicants.id, id));
  if (!applicant) throw new ApiError(404, "د کار غوښتونکی ونه موندل شو");

  res.respond(200, "د کار غوښتونکی ترلاسه شو", { applicant });
});

// ─── CREATE APPLICANT ──────────────────────────────────────────────────────────
export const createApplicant = asyncHandler(async (req, res) => {
  const { name, fatherName, phone, education, skills, address, appliedAt, notes } = req.body;

  const [newApplicant] = await db.insert(teacherApplicants).values({
    name,
    fatherName,
    phone,
    education,
    skills:    skills    || null,
    address:   address   || null,
    appliedAt: appliedAt || new Date().toISOString().split('T')[0],
    notes:     notes     || null,
  }).returning();

  res.respond(201, "د کار غوښتونکی بریالیتوب سره ثبت شو", { applicant: newApplicant });
});

// ─── UPDATE APPLICANT ──────────────────────────────────────────────────────────
export const updateApplicant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, fatherName, phone, education, skills, address, appliedAt, notes } = req.body;

  const [existingApplicant] = await db.select().from(teacherApplicants).where(eq(teacherApplicants.id, id));
  if (!existingApplicant) throw new ApiError(404, "د کار غوښتونکی ونه موندل شو");

  if (phone && phone !== existingApplicant.phone) {
    const [dupApplicant] = await db.select().from(teacherApplicants).where(eq(teacherApplicants.phone, phone));
    const [dupTeacher]   = await db.select().from(teachers).where(eq(teachers.phone, phone));
    if ((dupApplicant && dupApplicant.id !== existingApplicant.id) || dupTeacher) {
      throw new ApiError(400, "دا ټېلیفون نمبر دمخه کارول شوی");
    }
  }

  const [updatedApplicant] = await db.update(teacherApplicants).set({
    name:       name       ?? existingApplicant.name,
    fatherName: fatherName ?? existingApplicant.fatherName,
    phone:      phone      ?? existingApplicant.phone,
    education:  education  ?? existingApplicant.education,
    skills:     skills     ?? existingApplicant.skills,
    address:    address    ?? existingApplicant.address,
    appliedAt:  appliedAt  ?? existingApplicant.appliedAt,
    notes:      notes      ?? existingApplicant.notes,
  }).where(eq(teacherApplicants.id, id)).returning();

  res.respond(200, "د کار غوښتونکی بریالیتوب سره تازه شو", { applicant: updatedApplicant });
});

// ─── DELETE APPLICANT ──────────────────────────────────────────────────────────
export const deleteApplicant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingApplicant] = await db.select().from(teacherApplicants).where(eq(teacherApplicants.id, id));
  if (!existingApplicant) throw new ApiError(404, "د کار غوښتونکی ونه موندل شو");

  await db.delete(teacherApplicants).where(eq(teacherApplicants.id, id));

  res.respond(200, "د کار غوښتونکی بریالیتوب سره ړنګ شو");
});

// ─── CONVERT APPLICANT TO TEACHER ──────────────────────────────────────────────
export const convertApplicantToTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { salary, joiningDate, idCardNumber, teacherType } = req.body;

  const [applicant] = await db.select().from(teacherApplicants).where(eq(teacherApplicants.id, id));
  if (!applicant) throw new ApiError(404, "د کار غوښتونکی ونه موندل شو");

  const [existingTeacher] = await db.select().from(teachers).where(eq(teachers.phone, applicant.phone));
  if (existingTeacher) throw new ApiError(400, "دا ټېلیفون نمبر دمخه د ښوونکي په توګه شتون لري");

  // Validate teacherType - default to ["School"] if not provided
  let validatedTeacherType = teacherType || ["School"];
  if (!Array.isArray(validatedTeacherType) || validatedTeacherType.length === 0) {
    validatedTeacherType = ["School"];
  }

  const validTypes = ["School", "Center", "Madrasa"];
  const invalidTypes = validatedTeacherType.filter(type => !validTypes.includes(type));
  if (invalidTypes.length > 0) {
    throw new ApiError(400, "د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  const [newTeacher] = await db.insert(teachers).values({
    name:         applicant.name,
    fatherName:   applicant.fatherName,
    phone:        applicant.phone,
    idCardNumber: idCardNumber || null,
    education:    applicant.education,
    teacherType:  JSON.stringify(validatedTeacherType), // Store as JSON array
    salary:       salary ? Number(salary) : null,
    skills:       applicant.skills,
    address:      applicant.address,
    joiningDate:  joiningDate || new Date().toISOString().split('T')[0],
    notes:        applicant.notes,
  }).returning();

  await db.delete(teacherApplicants).where(eq(teacherApplicants.id, id));

  // Parse teacherType back to array for response
  const responseTeacher = {
    ...newTeacher,
    teacherType: JSON.parse(newTeacher.teacherType)
  };

  res.respond(201, "غوښتونکی بریالیتوب سره ښوونکي ته بدل شو", { teacher: withImageUrl(responseTeacher) });
});

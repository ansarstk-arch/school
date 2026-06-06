import { eq, like, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { teachers, teacherApplicants, users, salaries, classes, attendance, students } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { hashPassword } from "../../utils/hash.util.js";
import { currentShamsiYear, currentShamsiYearMonth } from "../../utils/shamsiDate.util.js";
import { columnInShamsiYear } from "../../utils/yearFilter.util.js";
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

const parseTeacherRecord = (record) => {
  if (!record) return record;
  return {
    ...record,
    imageUrl: record.image ? getImageUrl(record.image) : null,
    qualification: record.education || null,
    teacherType: record.teacherType
      ? (typeof record.teacherType === "string" ? JSON.parse(record.teacherType) : record.teacherType)
      : ["School"],
    assignedClasses: record.assignedClasses
      ? (typeof record.assignedClasses === "string" ? JSON.parse(record.assignedClasses) : record.assignedClasses)
      : [],
  };
};

const withImageUrl = (record) => parseTeacherRecord(record);

const extractUsername = (email) => {
  if (!email) return null;
  return email.endsWith("@school.local") ? email.replace("@school.local", "") : email;
};

const attachUserInfo = async (teacher) => {
  const parsed = withImageUrl(teacher);
  if (!teacher.userId) return { ...parsed, username: null };
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, teacher.userId));
  return { ...parsed, username: extractUsername(user?.email) };
};

const syncTeacherUserAccount = async ({ teacher, name, username, password }) => {
  if (!teacher.userId) {
    if (!username?.trim() || !password?.trim()) return;
    const email = `${String(username).trim().toLowerCase()}@school.local`;
    const [dup] = await db.select().from(users).where(eq(users.email, email));
    if (dup) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");
    const hashed = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      name: name || teacher.name,
      email,
      password: hashed,
      role: "teacher",
      permissions: "{}",
      isActive: teacher.status === "active",
    }).returning({ id: users.id });
    await db.update(teachers)
      .set({ userId: newUser.id, updatedAt: new Date().toISOString() })
      .where(eq(teachers.id, teacher.id));
    return;
  }

  const [currentUser] = await db.select().from(users).where(eq(users.id, teacher.userId));
  if (!currentUser) return;

  const updateUser = {
    name: name || teacher.name,
    updatedAt: new Date().toISOString(),
  };

  if (username?.trim()) {
    const email = `${String(username).trim().toLowerCase()}@school.local`;
    if (email !== currentUser.email) {
      const [dup] = await db.select().from(users).where(eq(users.email, email));
      if (dup) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");
    }
    updateUser.email = email;
  }

  if (password?.trim()) {
    updateUser.password = await hashPassword(password);
  }

  await db.update(users).set(updateUser).where(eq(users.id, teacher.userId));
};

// ─── GET ALL TEACHERS ──────────────────────────────────────────────────────────
export const getAllTeachers = asyncHandler(async (req, res) => {
  const {
    id, name, education, teacherType, joiningYear, dateFrom, dateTo, status,
    page = 1, limit = 12,
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (id)          conditions.push(eq(teachers.id, Number(id)));
  if (name)        conditions.push(like(teachers.name, `%${name}%`));
  if (education)   conditions.push(eq(teachers.education, education));
  if (teacherType) conditions.push(like(teachers.teacherType, `%"${teacherType}"%`));
  if (status)      conditions.push(eq(teachers.status, status));
  else             conditions.push(eq(teachers.status, "active"));

  const year = joiningYear || String(currentShamsiYear());
  conditions.push(columnInShamsiYear(teachers.joiningDate, year));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [teachersList, countResult] = await Promise.all([
    db.select().from(teachers).where(whereClause).orderBy(desc(teachers.createdAt)).limit(Number(limit)).offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(teachers).where(whereClause),
  ]);

  const teachersWithUsers = await Promise.all(teachersList.map(attachUserInfo));

  res.respond(200, "ښوونکي ترلاسه شول", {
    teachers: teachersWithUsers,
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

  const month = currentShamsiYearMonth();
  const [salaryRow] = await db.select({
    paidAmount: salaries.paidAmount,
    paymentStatus: salaries.paymentStatus,
    netSalary: salaries.netSalary,
  })
    .from(salaries)
    .where(and(eq(salaries.personType, "Teacher"), eq(salaries.personId, Number(id)), eq(salaries.month, month)))
    .limit(1);

  const parsed = withImageUrl(teacher);
  let assignedClassDetails = [];
  if (parsed.assignedClasses?.length) {
    assignedClassDetails = await db.select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      type: classes.type,
    })
      .from(classes)
      .where(inArray(classes.id, parsed.assignedClasses));
  }

  let username = null;
  if (teacher.userId) {
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, teacher.userId));
    username = extractUsername(user?.email);
  }

  res.respond(200, "ښوونکی ترلاسه شو", {
    teacher: {
      ...parsed,
      username,
      salaryDetails: {
        month,
        paid: salaryRow?.paidAmount || 0,
        netSalary: salaryRow?.netSalary || 0,
        status: salaryRow?.paymentStatus || "Pending",
        isPaid: salaryRow?.paymentStatus === "Paid",
      },
      assignedClassDetails,
    },
  });
});

// ─── CREATE TEACHER ────────────────────────────────────────────────────────────
export const getClassesByTeacherTypes = asyncHandler(async (req, res) => {
  const { types, academicYear } = req.query;
  if (!types) throw new ApiError(400, "د ښوونکي ډول اړین دی");

  let parsedTypes;
  try {
    parsedTypes = typeof types === "string" ? JSON.parse(types) : types;
  } catch {
    parsedTypes = String(types).split(",").map((t) => t.trim());
  }

  const year = academicYear || String(currentShamsiYear());
  const classList = await db.select({
    id: classes.id,
    name: classes.name,
    section: classes.section,
    type: classes.type,
    academicYear: classes.academicYear,
  })
    .from(classes)
    .where(and(inArray(classes.type, parsedTypes), eq(classes.academicYear, year)))
    .orderBy(classes.type, classes.name);

  res.respond(200, "ټولګي ترلاسه شول", { classes: classList });
});

export const createTeacher = asyncHandler(async (req, res) => {
  const {
    name, fatherName, phone, idCardNumber, education, teacherType: teacherTypeRaw,
    salary, skills, address, joiningDate, notes, username, password,
    assignedClasses: assignedClassesRaw,
  } = req.body;

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

  if (salary === undefined || salary === null || salary === "") {
    throw new ApiError(400, "معاش اړین دی");
  }
  if (!username?.trim() || !password?.trim()) {
    throw new ApiError(400, "د کارن نوم او پاسورډ اړین دی");
  }

  const email = `${String(username).trim().toLowerCase()}@school.local`;
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");

  let assignedClasses = [];
  if (assignedClassesRaw) {
    try {
      assignedClasses = typeof assignedClassesRaw === "string"
        ? JSON.parse(assignedClassesRaw)
        : assignedClassesRaw;
    } catch {
      throw new ApiError(400, "ټولګي په سمه توګه نه دي لیږل شوي");
    }
  }

  const imageName = await processUploadedImage(req.file);
  const hashed = await hashPassword(password);

  const [newUser] = await db.insert(users).values({
    name,
    email,
    password: hashed,
    role: "teacher",
    permissions: "{}",
    isActive: true,
  }).returning({ id: users.id });

  const [newTeacher] = await db.insert(teachers).values({
    name,
    fatherName,
    phone,
    idCardNumber: idCardNumber || null,
    education,
    teacherType: JSON.stringify(teacherType),
    salary: Number(salary),
    skills: skills || null,
    address: address || null,
    joiningDate: joiningDate || new Date().toISOString().split("T")[0],
    image: imageName,
    notes: notes || null,
    status: "active",
    userId: newUser.id,
    assignedClasses: JSON.stringify(assignedClasses.map(Number)),
  }).returning();

  res.respond(201, "ښوونکی بریالیتوب سره ثبت شو", { teacher: withImageUrl(newTeacher) });
});

// ─── UPDATE TEACHER ────────────────────────────────────────────────────────────
export const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name, fatherName, phone, idCardNumber, education, teacherType: teacherTypeRaw,
    salary, skills, address, joiningDate, notes, removeImage, assignedClasses: assignedClassesRaw,
    username, password,
  } = req.body;

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
  if (salary !== undefined) {
    if (salary === "" || salary === null) throw new ApiError(400, "معاش اړین دی");
    updateData.salary = Number(salary);
  }
  if (assignedClassesRaw !== undefined) {
    let assignedClasses = [];
    try {
      assignedClasses = typeof assignedClassesRaw === "string"
        ? JSON.parse(assignedClassesRaw)
        : assignedClassesRaw;
    } catch {
      throw new ApiError(400, "ټولګي په سمه توګه نه دي لیږل شوي");
    }
    updateData.assignedClasses = JSON.stringify(assignedClasses.map(Number));
  }
  if (skills !== undefined)       updateData.skills = skills || null;
  if (address !== undefined)      updateData.address = address || null;
  if (joiningDate !== undefined)  updateData.joiningDate = joiningDate || null;
  if (notes !== undefined)        updateData.notes = notes || null;

  const [updatedTeacher] = await db.update(teachers).set(updateData).where(eq(teachers.id, id)).returning();

  if (username !== undefined || password !== undefined) {
    await syncTeacherUserAccount({
      teacher: existingTeacher,
      name: name ?? existingTeacher.name,
      username,
      password,
    });
  }

  const [refreshed] = await db.select().from(teachers).where(eq(teachers.id, id));
  const teacherWithUser = await attachUserInfo(refreshed);
  res.respond(200, "ښوونکی بریالیتوب سره تازه شو", { teacher: teacherWithUser });
});

// ─── DELETE TEACHER ────────────────────────────────────────────────────────────
export const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingTeacher] = await db.select().from(teachers).where(eq(teachers.id, id));
  if (!existingTeacher) throw new ApiError(404, "ښوونکی ونه موندل شو");

  if (existingTeacher.image) await deleteImage(path.join(UPLOAD_DIR, existingTeacher.image));

  if (existingTeacher.userId) {
    await db.update(users).set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(users.id, existingTeacher.userId));
  }

  await db.delete(teachers).where(eq(teachers.id, id));
  res.respond(200, "ښوونکی بریالیتوب سره ړنګ شو");
});

export const toggleTeacherStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    throw new ApiError(400, "حالت باید active یا inactive وي");
  }

  const [existing] = await db.select().from(teachers).where(eq(teachers.id, id));
  if (!existing) throw new ApiError(404, "ښوونکی ونه موندل شو");

  const [updated] = await db.update(teachers)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(teachers.id, id))
    .returning();

  if (existing.userId) {
    await db.update(users)
      .set({ isActive: status === "active", updatedAt: new Date().toISOString() })
      .where(eq(users.id, existing.userId));
  }

  res.respond(200, status === "active" ? "ښوونکی فعال شو" : "ښوونکی غیر فعال شو", {
    teacher: withImageUrl(updated),
  });
});

// ─── GET ALL APPLICANTS ────────────────────────────────────────────────────────
export const getAllApplicants = asyncHandler(async (req, res) => {
  const { name, phone, skills, appliedYear, page = 1, limit = 12 } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (name)        conditions.push(like(teacherApplicants.name, `%${name}%`));
  if (phone)       conditions.push(like(teacherApplicants.phone, `%${phone}%`));
  if (skills)      conditions.push(like(teacherApplicants.skills, `%${skills}%`));
  const year = appliedYear || String(currentShamsiYear());
  conditions.push(columnInShamsiYear(teacherApplicants.appliedAt, year));

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

// ─── RESET TEACHER PASSWORD (admin) ───────────────────────────────────────────
export const resetTeacherPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, Number(id)));
  if (!teacher) throw new ApiError(404, "ښوونکی ونه موندل شو");
  if (!teacher.userId) throw new ApiError(400, "دا ښوونکی د ننوتلو حساب نلري");

  const hashed = await hashPassword(newPassword);
  await db.update(users)
    .set({ password: hashed, updatedAt: new Date().toISOString() })
    .where(eq(users.id, teacher.userId));

  res.respond(200, "پاسورډ بریالۍ بدل شو");
});

const getTeacherByUserId = async (userId) => {
  const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId));
  return teacher ? parseTeacherRecord(teacher) : null;
};

const getClassAttendanceMeta = async (classId, attendanceDate) => {
  const [row] = await db
    .select({
      count: sql`count(*)`.mapWith(Number),
      takenBy: sql`min(${attendance.takenBy})`.mapWith(Number),
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.attendanceType, "Student"),
        eq(attendance.classId, classId),
        eq(attendance.attendanceDate, attendanceDate)
      )
    );

  return {
    hasAttendance: (row?.count || 0) > 0,
    takenBy: row?.takenBy || null,
    recordCount: row?.count || 0,
  };
};

// ─── TEACHER DASHBOARD ─────────────────────────────────────────────────────────
export const getMyTeacherDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "تاسو د دې برخې لپاره اجازه نلرئ");
  }

  const teacher = await getTeacherByUserId(req.user.id);
  if (!teacher) throw new ApiError(404, "د ښوونکي پروفایل ونه موندل شو");

  const [user] = await db.select({
    email: users.email,
    name: users.name,
  }).from(users).where(eq(users.id, req.user.id));

  const attendanceDate = req.query.attendanceDate || new Date().toISOString().split("T")[0];
  let assignedClassDetails = [];

  if (teacher.assignedClasses?.length) {
    assignedClassDetails = await db.select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      type: classes.type,
      academicYear: classes.academicYear,
    })
      .from(classes)
      .where(inArray(classes.id, teacher.assignedClasses));

    assignedClassDetails = await Promise.all(
      assignedClassDetails.map(async (cls) => {
        const meta = await getClassAttendanceMeta(cls.id, attendanceDate);
        const takenByMe = meta.hasAttendance && meta.takenBy === req.user.id;
        const takenByOther = meta.hasAttendance && meta.takenBy !== null && meta.takenBy !== req.user.id;
        return {
          ...cls,
          attendanceStatus: !meta.hasAttendance
            ? "pending"
            : takenByMe
              ? "completed"
              : takenByOther
                ? "taken_by_other"
                : "pending",
          canTakeAttendance: !takenByOther,
          isReadOnly: takenByOther,
        };
      })
    );
  }

  res.respond(200, "ډیشبورډ ترلاسه شو", {
    teacher: {
      ...teacher,
      username: user?.email?.endsWith("@school.local")
        ? user.email.replace("@school.local", "")
        : user?.email,
      email: user?.email,
    },
    assignedClassDetails,
    attendanceDate,
  });
});

// ─── TEACHER: GET CLASS STUDENTS FOR ATTENDANCE ────────────────────────────────
export const getMyClassAttendance = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "تاسو د دې برخې لپاره اجازه نلرئ");
  }

  const teacher = await getTeacherByUserId(req.user.id);
  if (!teacher) throw new ApiError(404, "د ښوونکي پروفایل ونه موندل شو");

  const classId = Number(req.params.classId);
  const attendanceDate = req.query.attendanceDate || new Date().toISOString().split("T")[0];

  if (!teacher.assignedClasses?.includes(classId)) {
    throw new ApiError(403, "تاسو د دې ټولګي لپاره اجازه نلرئ");
  }

  const [classRow] = await db.select().from(classes).where(eq(classes.id, classId));
  if (!classRow) throw new ApiError(404, "ټولګی ونه موندل شو");

  const meta = await getClassAttendanceMeta(classId, attendanceDate);
  const takenByMe = meta.hasAttendance && meta.takenBy === req.user.id;
  const takenByOther = meta.hasAttendance && meta.takenBy !== null && meta.takenBy !== req.user.id;

  const people = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      rollNumber: students.rollNumber,
      classId: students.classId,
    })
    .from(students)
    .where(and(eq(students.classId, classId), eq(students.status, "active")))
    .orderBy(students.rollNumber, students.fullName);

  const existingAttendance = await db
    .select({
      personId: attendance.personId,
      status: attendance.status,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.attendanceType, "Student"),
        eq(attendance.classId, classId),
        eq(attendance.attendanceDate, attendanceDate)
      )
    );

  const attendanceMap = {};
  existingAttendance.forEach((att) => {
    attendanceMap[att.personId] = att.status;
  });

  const peopleWithAttendance = people.map((person) => ({
    ...person,
    attendance: {
      status: attendanceMap[person.id] ?? null,
    },
  }));

  res.respond(200, "د ټولګي زده کوونکي ترلاسه شول", {
    class: classRow,
    people: peopleWithAttendance,
    attendanceDate,
    canTakeAttendance: !takenByOther,
    isReadOnly: takenByOther,
    attendanceStatus: !meta.hasAttendance
      ? "pending"
      : takenByMe
        ? "completed"
        : takenByOther
          ? "taken_by_other"
          : "pending",
  });
});

// ─── TEACHER: SUBMIT CLASS ATTENDANCE (once per class per day) ─────────────────
export const submitTeacherClassAttendance = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "تاسو د دې برخې لپاره اجازه نلرئ");
  }

  const teacher = await getTeacherByUserId(req.user.id);
  if (!teacher) throw new ApiError(404, "د ښوونکي پروفایل ونه موندل شو");

  const { classId, attendanceDate, attendanceData } = req.body;
  const parsedClassId = Number(classId);

  if (!teacher.assignedClasses?.includes(parsedClassId)) {
    throw new ApiError(403, "تاسو د دې ټولګي لپاره اجازه نلرئ");
  }

  const [classRow] = await db.select().from(classes).where(eq(classes.id, parsedClassId));
  if (!classRow) throw new ApiError(404, "ټولګی ونه موندل شو");

  const meta = await getClassAttendanceMeta(parsedClassId, attendanceDate);
  const takenByOther = meta.hasAttendance && meta.takenBy !== null && meta.takenBy !== req.user.id;
  if (takenByOther) {
    throw new ApiError(400, "د دې ټولګي حاضري نن د بل ښوونکي لخوا ثبت شوې ده");
  }

  const results = { created: 0, updated: 0, errors: [] };

  for (const item of attendanceData) {
    try {
      const personId = Number(item.personId);
      const [student] = await db.select({ id: students.id })
        .from(students)
        .where(and(eq(students.id, personId), eq(students.classId, parsedClassId)));

      if (!student) {
        results.errors.push({ personId, error: "زده کوونکی ونه موندل شو" });
        continue;
      }

      const [existingAttendance] = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.attendanceType, "Student"),
            eq(attendance.personId, personId),
            eq(attendance.attendanceDate, attendanceDate)
          )
        );

      if (existingAttendance) {
        await db
          .update(attendance)
          .set({
            status: item.status || null,
            notes: item.notes || null,
            takenBy: req.user.id,
            updatedBy: req.user.id,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(attendance.id, existingAttendance.id));
        results.updated++;
      } else {
        await db.insert(attendance).values({
          attendanceType: "Student",
          personId,
          institutionType: classRow.type,
          classId: parsedClassId,
          attendanceDate,
          status: item.status || null,
          attendanceMethod: "Manual",
          notes: item.notes || null,
          takenBy: req.user.id,
        });
        results.created++;
      }
    } catch (error) {
      results.errors.push({ personId: item.personId, error: error.message });
    }
  }

  const total = results.created + results.updated;
  res.respond(201, `حاضرۍ بریالۍ ثبت شوه - ${total} زده کوونکي`, { results });
});

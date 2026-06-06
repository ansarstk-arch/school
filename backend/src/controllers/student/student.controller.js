import { eq, like, and, desc, sql, inArray, count, gte, lte } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { students, studentEnrollments, classes, attendance, feePayments } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { compressImage, deleteImage, getImageUrl } from "../../utils/imageProcessor.util.js";
import { getCurrentAfghanDate } from "../../utils/dateHandler.util.js";
import { assertInstitutionAccess } from "../../utils/permissions.util.js";
import {
  currentShamsiYear,
  currentShamsiYearMonth,
  getCurrentShamsiMonthRange,
  getWeekDateRange,
  getCurrentGregorianDateAfghanTZ,
} from "../../utils/shamsiDate.util.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: process uploaded image → compress and return filename
const processUploadedImage = async (file, enrollmentTypes) => {
  if (!file) return null;
  
  try {
    // Determine the primary enrollment type for folder organization
    const primaryType = enrollmentTypes[0] || 'School';
    const UPLOAD_DIR = path.join(__dirname, `../../../uploads/students/${primaryType}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    
    const compressedPath = path.join(UPLOAD_DIR, `compressed-${file.filename}`);
    await compressImage(file.path, compressedPath, 200);
    
    // Return relative path from uploads folder
    return `students/${primaryType}/${path.basename(compressedPath)}`;
  } catch (err) {
    console.error('Image processing error:', err);
    return null;
  }
};

// Helper: attach imageUrl to a student record
const withImageUrl = (record) => {
  if (!record) return record;
  return { ...record, imageUrl: record.image ? getImageUrl(record.image) : null };
};

// Helper: get full upload path
const getFullImagePath = (relativePath) => {
  if (!relativePath) return null;
  return path.join(__dirname, '../../../uploads', relativePath);
};

const ensureAbsentCallsTable = async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS absent_parent_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      called INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, attendance_date)
    )
  `);
};

// ─── GET CLASSES BY TYPE AND YEAR (for filtering) ──────────────────────────────
export const getClassesByTypeAndYear = asyncHandler(async (req, res) => {
  const { type, academicYear } = req.query;

  if (!type) throw new ApiError(400, "د ټولګي ډول اړین دی");
  if (!academicYear) throw new ApiError(400, "تعلیمي کال اړین دی");

  assertInstitutionAccess(req.user?.permissions, req.user?.role, type);

  const classesList = await db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      type: classes.type,
      academicYear: classes.academicYear,
    })
    .from(classes)
    .where(and(eq(classes.type, type), eq(classes.academicYear, academicYear)))
    .orderBy(classes.name, classes.section);

  res.respond(200, "ټولګي ترلاسه شول", { classes: classesList });
});

// ─── GET ALL STUDENTS ──────────────────────────────────────────────────────────
const buildAttendanceStats = (records) => ({
  totalDays: records.length,
  present: records.filter((r) => r.status === "Present").length,
  absent: records.filter((r) => r.status === "Absent").length,
  leave: records.filter((r) => r.status === "Leave").length,
});

export const getAllStudents = asyncHandler(async (req, res) => {
  const {
    id, fullName, fatherName, classId, gender, academicYear, enrollmentType,
    status, page = 1, limit = 12,
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (id)           conditions.push(eq(students.id, Number(id)));
  if (fullName)     conditions.push(like(students.fullName, `%${fullName}%`));
  if (fatherName)   conditions.push(like(students.fatherName, `%${fatherName}%`));
  if (classId)      conditions.push(eq(students.classId, Number(classId)));
  if (gender)       conditions.push(eq(students.gender, gender));
  if (status)       conditions.push(eq(students.status, status));
  else              conditions.push(eq(students.status, "active"));

  const year = academicYear || String(currentShamsiYear());
  conditions.push(eq(students.academicYear, year));

  // Filter by enrollment type
  if (enrollmentType) {
    conditions.push(eq(classes.type, enrollmentType));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let [studentsList, countResult] = await Promise.all([
    db.select({
      id: students.id,
      rollNumber: students.rollNumber,
      fullName: students.fullName,
      fatherName: students.fatherName,
      grandFatherName: students.grandFatherName,
      maternalUncleName: students.maternalUncleName,
      gender: students.gender,
      dob: students.dob,
      phone: students.phone,
      emergencyContact: students.emergencyContact,
      parentNumber1: students.phone,
      parentNumber2: students.emergencyContact,
      address: students.address,
      idCardNumber: students.idCardNumber,
      classId: students.classId,
      className: classes.name,
      classSection: classes.section,
      classType: classes.type,
      section: students.section,
      academicYear: students.academicYear,
      registrationFee: students.registrationFee,
      image: students.image,
      status: students.status,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(whereClause)
      .orderBy(desc(students.createdAt))
      .limit(Number(limit))
      .offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(whereClause),
  ]);

  // Fetch enrollments for each student
  if (studentsList.length > 0) {
    const studentIds = studentsList.map(s => s.id);
    const enrollments = await db.select().from(studentEnrollments).where(inArray(studentEnrollments.studentId, studentIds));
    
    // Group enrollments by student
    const enrollmentsByStudent = {};
    enrollments.forEach(e => {
      if (!enrollmentsByStudent[e.studentId]) {
        enrollmentsByStudent[e.studentId] = [];
      }
      enrollmentsByStudent[e.studentId].push({
        type: e.enrollmentType,
        fee: e.monthlyFee,
      });
    });

    // Attach enrollments and format className to students
    studentsList = studentsList.map(s => {
      const className = s.className 
        ? `${s.className}${s.classSection ? ` - ${s.classSection}` : ''}` 
        : null;
      
      return {
        ...withImageUrl(s),
        className,
        enrollments: enrollmentsByStudent[s.id] || [],
      };
    });
  }

  // Filter by enrollment type if specified
  if (enrollmentType) {
    studentsList = studentsList.filter(s => 
      s.enrollments.some(e => e.type === enrollmentType)
    );
  }

  res.respond(200, "زده کوونکي ترلاسه شول", {
    students: studentsList,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

// ─── GET STUDENT BY ID ─────────────────────────────────────────────────────────
export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [student] = await db.select().from(students).where(eq(students.id, id));
  if (!student) throw new ApiError(404, "زده کوونکی ونه موندل شو");

  // Fetch enrollments
  const enrollments = await db.select().from(studentEnrollments).where(eq(studentEnrollments.studentId, id));

  // Calculate age from DOB
  let age = null;
  if (student.dob) {
    const dobDate = new Date(student.dob);
    const today = new Date();
    age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
  }

  const today = getCurrentGregorianDateAfghanTZ();
  const { monthStart, monthEnd } = getCurrentShamsiMonthRange();
  const { weekStart, weekEnd } = getWeekDateRange();
  const shamsiMonth = currentShamsiYearMonth();

  const [dailyRecords, weeklyRecords, monthlyRecords] = await Promise.all([
    db.select({ status: attendance.status }).from(attendance).where(
      and(eq(attendance.attendanceType, "Student"), eq(attendance.personId, Number(id)), eq(attendance.attendanceDate, today))
    ),
    db.select({ status: attendance.status }).from(attendance).where(
      and(eq(attendance.attendanceType, "Student"), eq(attendance.personId, Number(id)), gte(attendance.attendanceDate, weekStart), lte(attendance.attendanceDate, weekEnd))
    ),
    db.select({ status: attendance.status }).from(attendance).where(
      and(eq(attendance.attendanceType, "Student"), eq(attendance.personId, Number(id)), gte(attendance.attendanceDate, monthStart), lte(attendance.attendanceDate, monthEnd))
    ),
  ]);

  const attendanceStats = {
    daily: buildAttendanceStats(dailyRecords),
    weekly: buildAttendanceStats(weeklyRecords),
    monthly: buildAttendanceStats(monthlyRecords),
  };

  const [currentMonthFee] = await db
    .select({
      amount: feePayments.amount,
      paid: feePayments.paid,
      status: feePayments.status,
    })
    .from(feePayments)
    .where(
      and(
        eq(feePayments.studentId, Number(id)),
        eq(feePayments.month, shamsiMonth)
      )
    );

  const feeDetails = {
    thisMonthAmount: currentMonthFee?.amount || 0,
    thisMonthPaid: currentMonthFee?.paid || 0,
    thisMonthStatus: currentMonthFee?.status || "Unpaid",
    thisMonthRemaining: (currentMonthFee?.amount || 0) - (currentMonthFee?.paid || 0),
  };

  res.respond(200, "زده کوونکی ترلاسه شو", { 
    student: {
      ...withImageUrl(student),
      parentNumber1: student.phone,
      parentNumber2: student.emergencyContact,
      age,
      attendanceStats,
      feeDetails,
      enrollments: enrollments.map(e => ({
        type: e.enrollmentType,
        fee: e.monthlyFee,
      })),
    }
  });
});

// ─── CREATE STUDENT ────────────────────────────────────────────────────────────
export const createStudent = asyncHandler(async (req, res) => {
  const { 
    fullName, fatherName, grandFatherName, maternalUncleName, parentNumber1, idCardNumber, 
    gender, dob, address, parentNumber2, academicYear, 
    enrollments, classes: classIds, fees, registrationFee, rollNumber, section 
  } = req.body;

  // Parse JSON fields if they come as strings
  const parsedEnrollments = typeof enrollments === 'string' ? JSON.parse(enrollments) : enrollments;
  const parsedClasses = typeof classIds === 'string' ? JSON.parse(classIds) : classIds;
  const parsedFees = typeof fees === 'string' ? JSON.parse(fees) : fees;

  // Validate that classes exist
  for (const type of parsedEnrollments) {
    const classId = parsedClasses[type];
    if (classId) {
      const [cls] = await db.select({ id: classes.id, type: classes.type }).from(classes).where(eq(classes.id, Number(classId)));
      if (!cls) throw new ApiError(400, `ټولګی د ${type} لپاره ونه موندل شو`);
      if (cls.type !== type) throw new ApiError(400, `ټولګی د ${type} ډول سره سم نه دی`);
    }
  }

  // Process image
  const imagePath = await processUploadedImage(req.file, parsedEnrollments);

  // Use the first enrollment's class as the main classId
  const primaryType = parsedEnrollments[0];
  const primaryClassId = parsedClasses[primaryType];

  // Create student
  const [newStudent] = await db.insert(students).values({
    fullName,
    fatherName,
    grandFatherName: grandFatherName || null,
    maternalUncleName: maternalUncleName || null,
    phone: parentNumber1 || null,
    idCardNumber: idCardNumber || null,
    gender,
    dob: dob || null,
    address: address || null,
    emergencyContact: parentNumber2 || null,
    academicYear,
    classId: primaryClassId ? Number(primaryClassId) : null,
    section: section || null,
    rollNumber: rollNumber || null,
    registrationFee: registrationFee ? Number(registrationFee) : null,
    image: imagePath,
  }).returning();

  // Create enrollments
  const enrollmentRecords = parsedEnrollments.map(type => ({
    studentId: newStudent.id,
    enrollmentType: type,
    monthlyFee: parsedFees?.[type] ? Number(parsedFees[type]) : null,
  }));

  await db.insert(studentEnrollments).values(enrollmentRecords);

  // Fetch created enrollments
  const createdEnrollments = await db.select().from(studentEnrollments).where(eq(studentEnrollments.studentId, newStudent.id));

  res.respond(201, "زده کوونکی بریالیتوب سره ثبت شو", { 
    student: {
      ...withImageUrl(newStudent),
      enrollments: createdEnrollments.map(e => ({
        type: e.enrollmentType,
        fee: e.monthlyFee,
      })),
    }
  });
});

// ─── UPDATE STUDENT ────────────────────────────────────────────────────────────
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    fullName, fatherName, grandFatherName, maternalUncleName, parentNumber1, idCardNumber, 
    gender, dob, address, parentNumber2, academicYear, 
    enrollments, classes: classIds, fees, registrationFee, rollNumber, section, removeImage 
  } = req.body;

  const [existingStudent] = await db.select().from(students).where(eq(students.id, id));
  if (!existingStudent) throw new ApiError(404, "زده کوونکی ونه موندل شو");

  // Parse JSON fields if they come as strings
  const parsedEnrollments = enrollments ? (typeof enrollments === 'string' ? JSON.parse(enrollments) : enrollments) : null;
  const parsedClasses = classIds ? (typeof classIds === 'string' ? JSON.parse(classIds) : classIds) : null;
  const parsedFees = fees ? (typeof fees === 'string' ? JSON.parse(fees) : fees) : null;

  // Validate classes if enrollments are being updated
  if (parsedEnrollments && parsedClasses) {
    for (const type of parsedEnrollments) {
      const classId = parsedClasses[type];
      if (classId) {
        const [cls] = await db.select({ id: classes.id, type: classes.type }).from(classes).where(eq(classes.id, Number(classId)));
        if (!cls) throw new ApiError(400, `ټولګی د ${type} لپاره ونه موندل شو`);
        if (cls.type !== type) throw new ApiError(400, `ټولګی د ${type} ډول سره سم نه دی`);
      }
    }
  }

  // Handle image update
  let newImagePath = existingStudent.image;
  if (req.file) {
    if (existingStudent.image) {
      const oldImagePath = getFullImagePath(existingStudent.image);
      if (oldImagePath) await deleteImage(oldImagePath);
    }
    newImagePath = await processUploadedImage(req.file, parsedEnrollments || ['School']);
  } else if (removeImage === 'true' || removeImage === true) {
    if (existingStudent.image) {
      const oldImagePath = getFullImagePath(existingStudent.image);
      if (oldImagePath) await deleteImage(oldImagePath);
    }
    newImagePath = null;
  }

  // Update student
  const updateData = { updatedAt: new Date().toISOString(), image: newImagePath };
  if (fullName !== undefined)         updateData.fullName = fullName;
  if (fatherName !== undefined)       updateData.fatherName = fatherName;
  if (grandFatherName !== undefined)  updateData.grandFatherName = grandFatherName || null;
  if (maternalUncleName !== undefined) updateData.maternalUncleName = maternalUncleName || null;
  if (parentNumber1 !== undefined)    updateData.phone = parentNumber1 || null;
  if (idCardNumber !== undefined)     updateData.idCardNumber = idCardNumber || null;
  if (gender !== undefined)           updateData.gender = gender;
  if (dob !== undefined)              updateData.dob = dob || null;
  if (address !== undefined)          updateData.address = address || null;
  if (parentNumber2 !== undefined)    updateData.emergencyContact = parentNumber2 || null;
  if (academicYear !== undefined)     updateData.academicYear = academicYear;
  if (rollNumber !== undefined)       updateData.rollNumber = rollNumber || null;
  if (section !== undefined)          updateData.section = section || null;
  if (registrationFee !== undefined)  updateData.registrationFee = registrationFee ? Number(registrationFee) : null;

  // Update primary classId if enrollments are being updated
  if (parsedEnrollments && parsedClasses) {
    const primaryType = parsedEnrollments[0];
    const primaryClassId = parsedClasses[primaryType];
    updateData.classId = primaryClassId ? Number(primaryClassId) : null;
  }

  const [updatedStudent] = await db.update(students).set(updateData).where(eq(students.id, id)).returning();

  // Update enrollments if provided
  if (parsedEnrollments) {
    // Delete existing enrollments
    await db.delete(studentEnrollments).where(eq(studentEnrollments.studentId, id));

    // Create new enrollments
    const enrollmentRecords = parsedEnrollments.map(type => ({
      studentId: Number(id),
      enrollmentType: type,
      monthlyFee: parsedFees?.[type] ? Number(parsedFees[type]) : null,
    }));

    await db.insert(studentEnrollments).values(enrollmentRecords);
  }

  // Fetch updated enrollments
  const updatedEnrollments = await db.select().from(studentEnrollments).where(eq(studentEnrollments.studentId, id));

  res.respond(200, "زده کوونکی بریالیتوب سره تازه شو", { 
    student: {
      ...withImageUrl(updatedStudent),
      enrollments: updatedEnrollments.map(e => ({
        type: e.enrollmentType,
        fee: e.monthlyFee,
      })),
    }
  });
});

// ─── DELETE STUDENT ────────────────────────────────────────────────────────────
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingStudent] = await db.select().from(students).where(eq(students.id, id));
  if (!existingStudent) throw new ApiError(404, "زده کوونکی ونه موندل شو");

  // Delete image if exists
  if (existingStudent.image) {
    const imagePath = getFullImagePath(existingStudent.image);
    if (imagePath) await deleteImage(imagePath);
  }

  await db.update(feePayments)
    .set({ studentId: null, updatedAt: new Date().toISOString() })
    .where(eq(feePayments.studentId, Number(id)));

  await db.delete(studentEnrollments).where(eq(studentEnrollments.studentId, id));
  await db.delete(students).where(eq(students.id, id));

  res.respond(200, "زده کوونکی بریالیتوب سره ړنګ شو");
});

export const toggleStudentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    throw new ApiError(400, "حالت باید active یا inactive وي");
  }

  const [existing] = await db.select().from(students).where(eq(students.id, id));
  if (!existing) throw new ApiError(404, "زده کوونکی ونه موندل شو");

  const [updated] = await db.update(students)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(students.id, id))
    .returning();

  res.respond(200, status === "active" ? "زده کوونکی فعال شو" : "زده کوونکی غیر فعال شو", {
    student: withImageUrl(updated),
  });
});

export const getParentNumbers = asyncHandler(async (req, res) => {
  await ensureAbsentCallsTable();
  const {
    id,
    fullName,
    fatherName,
    classId,
    enrollmentType,
    academicYear,
    absentOnly,
    called,
    page = 1,
    limit = 20,
  } = req.query;

  const targetDate = getCurrentAfghanDate();
  const year = academicYear || String(currentShamsiYear());
  const filters = [eq(students.academicYear, year), eq(students.status, "active")];

  if (id) filters.push(eq(students.id, Number(id)));
  if (fullName) filters.push(like(students.fullName, `%${fullName}%`));
  if (fatherName) filters.push(like(students.fatherName, `%${fatherName}%`));
  if (classId) filters.push(eq(students.classId, Number(classId)));
  if (enrollmentType) filters.push(eq(classes.type, enrollmentType));

  const whereClause = and(...filters);
  const offset = (Number(page) - 1) * Number(limit);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: students.id,
        fullName: students.fullName,
        fatherName: students.fatherName,
        className: classes.name,
        classSection: classes.section,
        enrollmentType: classes.type,
        parentNumber1: students.phone,
        parentNumber2: students.emergencyContact,
        attendanceStatus: attendance.status,
        callStatus: sql`COALESCE(apc.called, 0)`,
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(
        attendance,
        and(
          eq(attendance.attendanceType, "Student"),
          eq(attendance.personId, students.id),
          eq(attendance.attendanceDate, targetDate)
        )
      )
      .leftJoin(sql`absent_parent_calls apc`, sql`apc.student_id = ${students.id} AND apc.attendance_date = ${targetDate}`)
      .where(whereClause)
      .orderBy(students.fullName)
      .limit(Number(limit))
      .offset(offset),
    db.select({ count: count() }).from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(whereClause)
  ]);

  let data = rows;
  if (absentOnly === "absent") data = data.filter((r) => r.attendanceStatus === "Absent");
  if (absentOnly === "present") data = data.filter((r) => r.attendanceStatus === "Present");
  if (called === "true") data = data.filter((r) => Number(r.callStatus) === 1);
  if (called === "false") data = data.filter((r) => Number(r.callStatus) === 0);

  const groupByParentPhone = (items) => {
    const groups = new Map();
    for (const row of items) {
      const phone = row.parentNumber1?.trim();
      const key = phone || `solo-${row.id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          ...row,
          studentIds: [row.id],
          ids: [row.id],
        });
      } else {
        const g = groups.get(key);
        g.studentIds.push(row.id);
        g.ids.push(row.id);
        g.fullName = `${g.fullName}، ${row.fullName}`;
        if (Number(row.callStatus) === 0) g.callStatus = 0;
        if (row.attendanceStatus === "Absent") g.attendanceStatus = "Absent";
      }
    }
    return Array.from(groups.values());
  };

  res.respond(200, "د والدینو نمبرونه ترلاسه شول", {
    date: targetDate,
    parentNumbers: groupByParentPhone(data),
    pagination: {
      total: Number(totalRows[0]?.count || 0),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(Number(totalRows[0]?.count || 0) / Number(limit)),
    },
  });
});

export const toggleParentCallStatus = asyncHandler(async (req, res) => {
  await ensureAbsentCallsTable();
  const { studentId, studentIds, attendanceDate, called } = req.body;
  if (!attendanceDate) throw new ApiError(400, "اړین معلومات نشته");

  let ids = Array.isArray(studentIds) ? studentIds.map(Number) : [];
  if (ids.length === 0 && studentId) {
    const [student] = await db.select({ phone: students.phone })
      .from(students).where(eq(students.id, Number(studentId)));
    if (student?.phone) {
      const siblings = await db.select({ id: students.id })
        .from(students)
        .where(and(eq(students.phone, student.phone), eq(students.status, "active")));
      ids = siblings.map((s) => s.id);
    } else {
      ids = [Number(studentId)];
    }
  }

  if (ids.length === 0) throw new ApiError(400, "زده کوونکی ونه موندل شو");

  for (const id of ids) {
    await db.run(sql`
      INSERT INTO absent_parent_calls (student_id, attendance_date, called, updated_at)
      VALUES (${id}, ${String(attendanceDate)}, ${called ? 1 : 0}, datetime('now'))
      ON CONFLICT(student_id, attendance_date) DO UPDATE SET
        called = excluded.called,
        updated_at = datetime('now')
    `);
  }

  res.respond(200, "د اړیکې حالت تازه شو", { updatedStudentIds: ids });
});

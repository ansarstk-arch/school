import { eq, like, and, desc, sql, inArray, gte, lte, count, sum } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { feePayments, students, classes, studentEnrollments, users } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { 
  generateFeeReceiptPDF, 
  generateMultipleReceiptsPDF, 
  generateFeeExcelExport, 
  generateFeePDFExport 
} from "../../utils/feeReceipt.util.js";
import { currentShamsiYearMonth } from "../../lib/afghan-date.js";
import { resolveInstitutionFilter, assertInstitutionAccess, getAllowedInstitutions } from "../../utils/permissions.util.js";

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/** Normalize academic year to 4-digit string (fixes legacy "1405.0" values). */
const normalizeAcademicYear = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const raw = String(value).trim();
  const match = raw.match(/\d{4}/);
  return match ? match[0] : raw.replace(/\.0$/, "");
};

const formatPaymentRow = (payment) => ({
  ...payment,
  className: payment.className ?? "—",
  studentName: payment.studentName ?? "—",
  fatherName: payment.fatherName ?? "—",
  academicYear: normalizeAcademicYear(payment.academicYear),
  amount: Number(payment.amount ?? 0),
  paid: Number(payment.paid ?? 0),
  remaining: Number(payment.amount ?? 0) - Number(payment.paid ?? 0),
});

// Auto-generate unpaid fee records for all active students for a given month
export const ensureMonthlyFeeRecords = async (month, academicYear) => {
  try {
    // Get all students with their enrollments
    const allStudents = await db
      .select({
        studentId: students.id,
        studentName: students.fullName,
        classId: students.classId,
        academicYear: students.academicYear,
      })
      .from(students)
      .where(and(eq(students.academicYear, String(academicYear)), eq(students.status, "active")));

    for (const student of allStudents) {
      // Get student enrollments
      const enrollments = await db
        .select({
          enrollmentType: studentEnrollments.enrollmentType,
          monthlyFee: studentEnrollments.monthlyFee,
        })
        .from(studentEnrollments)
        .where(eq(studentEnrollments.studentId, student.studentId));

      if (enrollments.length === 0) continue;

      // Check each enrollment type
      for (const enrollment of enrollments) {
        // Check if fee record already exists
        const [existingFee] = await db
          .select({ id: feePayments.id })
          .from(feePayments)
          .where(
            and(
              eq(feePayments.studentId, student.studentId),
              eq(feePayments.month, month),
              eq(feePayments.academicYear, String(academicYear)),
              eq(feePayments.enrollmentType, enrollment.enrollmentType)
            )
          );

        // If no record exists, create unpaid fee record
        if (!existingFee && enrollment.monthlyFee > 0) {
          const receiptNo = await generateReceiptNumber();
          
          await db.insert(feePayments).values({
            receiptNo,
            studentId: student.studentId,
            enrollmentType: enrollment.enrollmentType,
            month,
            academicYear: String(academicYear),
            amount: enrollment.monthlyFee,
            paid: 0,
            status: 'Unpaid',
            date: new Date().toISOString().split('T')[0],
            collectedBy: null,
            notes: 'Auto-generated monthly fee',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring monthly fee records:', error);
    // Don't throw - this is a background operation
  }
};

// Generate unique receipt number
const generateReceiptNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `RCP-${year}${month}${day}`;
  
  // Find the last receipt number for today
  const [lastReceipt] = await db
    .select({ receiptNo: feePayments.receiptNo })
    .from(feePayments)
    .where(like(feePayments.receiptNo, `${prefix}%`))
    .orderBy(desc(feePayments.receiptNo))
    .limit(1);
  
  let sequence = 1;
  if (lastReceipt) {
    const lastSequence = parseInt(lastReceipt.receiptNo.split('-').pop());
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// Calculate student's monthly fee based on enrollments
const calculateStudentFee = async (studentId, enrollmentType) => {
  // Get student's enrollment fee for specific type
  const [enrollment] = await db
    .select({ monthlyFee: studentEnrollments.monthlyFee })
    .from(studentEnrollments)
    .where(
      and(
        eq(studentEnrollments.studentId, studentId),
        eq(studentEnrollments.enrollmentType, enrollmentType)
      )
    );
  
  if (enrollment && enrollment.monthlyFee) {
    return enrollment.monthlyFee;
  }
  
  // Fallback to class fee
  const [student] = await db
    .select({ 
      classId: students.classId,
      monthlyFee: classes.monthlyFee 
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(eq(students.id, studentId));
  
  return student?.monthlyFee || 0;
};

// ─── GET ALL FEE PAYMENTS ──────────────────────────────────────────────────────
export const getFeePayments = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    academicYear = '', 
    status = '', // Optional - can filter by specific status
    enrollmentType = '',
    month = '',
    startDate = '',
    endDate = ''
  } = req.query;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const pageLimit = parseInt(limit, 10) || 10;
  
  // Auto-generate unpaid fee records for requested month to ensure data exists
  if (month && academicYear) {
    await ensureMonthlyFeeRecords(month, academicYear);
  }
  
  // Build where conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      sql`(${students.fullName} LIKE ${`%${search}%`} OR ${feePayments.receiptNo} LIKE ${`%${search}%`})`
    );
  }
  
  if (academicYear) {
    const yearNorm = normalizeAcademicYear(academicYear);
    conditions.push(
      sql`REPLACE(CAST(${feePayments.academicYear} AS TEXT), '.0', '') = ${yearNorm}`
    );
  }
  
  // Only filter by status if it's provided
  if (status && status.trim() !== '') {
    conditions.push(eq(feePayments.status, status));
  }

  const requestedType = enrollmentType?.trim() || null;
  const institutionScope = resolveInstitutionFilter(
    req.user?.permissions,
    req.user?.role,
    requestedType
  );
  if (institutionScope.value) {
    conditions.push(eq(feePayments.enrollmentType, institutionScope.value));
  } else if (institutionScope.allowed.length < 3) {
    conditions.push(inArray(feePayments.enrollmentType, institutionScope.allowed));
  }

  if (month) {
    conditions.push(eq(feePayments.month, month));
  }
  
  if (startDate && endDate) {
    conditions.push(
      and(
        gte(feePayments.date, startDate),
        lte(feePayments.date, endDate)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .where(whereClause);

  // Get paginated results
  const payments = await db
    .select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      studentId: feePayments.studentId,
      studentName: students.fullName,
      fatherName: students.fatherName,
      className: classes.name,
      enrollmentType: feePayments.enrollmentType,
      month: feePayments.month,
      academicYear: feePayments.academicYear,
      amount: feePayments.amount,
      paid: feePayments.paid,
      remaining: sql`${feePayments.amount} - ${feePayments.paid}`,
      status: feePayments.status,
      date: feePayments.date,
      collectedBy: users.name,
      notes: feePayments.notes,
      createdAt: feePayments.createdAt,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .leftJoin(users, eq(feePayments.collectedBy, users.id))
    .where(whereClause)
    .orderBy(desc(feePayments.createdAt))
    .limit(pageLimit)
    .offset(offset);

  const totalRecords = Number(totalResult?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageLimit));

  const currentPageNum = parseInt(page, 10) || 1;
  res.respond(200, "د فیس پیسو معلومات ترلاسه شول", {
    payments: payments.map(formatPaymentRow),
    pagination: {
      page: currentPageNum,
      limit: pageLimit,
      total: totalRecords,
      totalPages,
      currentPage: currentPageNum,
      totalRecords,
      hasNext: currentPageNum < totalPages,
      hasPrev: currentPageNum > 1,
    },
  });
});

// ─── GET FEE PAYMENT BY ID ─────────────────────────────────────────────────────
export const getFeePaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [payment] = await db
    .select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      studentId: feePayments.studentId,
      studentName: students.fullName,
      fatherName: students.fatherName,
      className: classes.name,
      enrollmentType: feePayments.enrollmentType,
      month: feePayments.month,
      academicYear: feePayments.academicYear,
      amount: feePayments.amount,
      paid: feePayments.paid,
      remaining: sql`${feePayments.amount} - ${feePayments.paid}`,
      status: feePayments.status,
      date: feePayments.date,
      collectedBy: users.name,
      notes: feePayments.notes,
      createdAt: feePayments.createdAt,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .leftJoin(users, eq(feePayments.collectedBy, users.id))
    .where(eq(feePayments.id, Number(id)));

  if (!payment) {
    throw new ApiError(404, "د فیس پیسو معلومات ونه موندل شول");
  }

  res.respond(200, "د فیس پیسو معلومات ترلاسه شول", { payment });
});

// ─── GET STUDENT BY ID FOR FEE FORM ────────────────────────────────────────────
export const getStudentForFee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [student] = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      classId: students.classId,
      className: classes.name,
      section: students.section,
      academicYear: students.academicYear,
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(eq(students.id, Number(id)));

  if (!student) {
    throw new ApiError(404, "زده کوونکی ونه موندل شو");
  }

  // Get student enrollments with fees
  const enrollments = await db
    .select({
      enrollmentType: studentEnrollments.enrollmentType,
      monthlyFee: studentEnrollments.monthlyFee,
    })
    .from(studentEnrollments)
    .where(eq(studentEnrollments.studentId, Number(id)));

  res.respond(200, "د زده کوونکي معلومات ترلاسه شول", {
    student: { ...student, enrollments },
  });
});

// ─── GET STUDENTS BY FILTERS ───────────────────────────────────────────────────
export const getStudentsByFilters = asyncHandler(async (req, res) => {
  const { type, classId } = req.query;

  let conditions = [];
  
  if (classId) {
    conditions.push(eq(students.classId, Number(classId)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let studentsQuery = db
    .select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      classId: students.classId,
      className: classes.name,
      section: students.section,
      academicYear: students.academicYear,
      monthlyFee: sql`COALESCE(${studentEnrollments.monthlyFee}, ${classes.monthlyFee}, 0)`,
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id));

  if (whereClause) {
    studentsQuery = studentsQuery.where(whereClause);
  }

  // Filter by enrollment type if specified
  if (type) {
    const typeCondition = eq(studentEnrollments.enrollmentType, type);
    studentsQuery = studentsQuery
      .innerJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId))
      .where(whereClause ? and(whereClause, typeCondition) : typeCondition);
  } else {
    studentsQuery = studentsQuery
      .leftJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId));
    if (whereClause) {
      studentsQuery = studentsQuery.where(whereClause);
    }
  }

  const rawStudents = await studentsQuery.orderBy(students.fullName);

  const studentsById = new Map();
  for (const row of rawStudents) {
    const feeValue = Number(row.monthlyFee || 0);
    if (!studentsById.has(row.id)) {
      studentsById.set(row.id, { ...row, monthlyFee: feeValue });
      continue;
    }
    const existing = studentsById.get(row.id);
    existing.monthlyFee += feeValue;
  }

  res.respond(200, "زده کوونکي ترلاسه شول", {
    students: Array.from(studentsById.values()),
  });
});

// ─── GET STUDENTS BY MULTIPLE IDS ──────────────────────────────────────────────
export const getStudentsByIds = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, "د زده کوونکو IDs اړین دی");
  }

  const studentsList = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      classId: students.classId,
      className: classes.name,
      section: students.section,
      academicYear: students.academicYear,
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(inArray(students.id, ids.map(id => Number(id))))
    .orderBy(students.fullName);

  // Get enrollments for each student
  const studentsWithEnrollments = await Promise.all(
    studentsList.map(async (student) => {
      const enrollments = await db
        .select({
          enrollmentType: studentEnrollments.enrollmentType,
          monthlyFee: studentEnrollments.monthlyFee,
        })
        .from(studentEnrollments)
        .where(eq(studentEnrollments.studentId, student.id));

      return {
        ...student,
        enrollments: enrollments || [],
      };
    })
  );

  res.respond(200, "زده کوونکي ترلاسه شول", { students: studentsWithEnrollments });
});

// ─── CREATE FEE PAYMENT ────────────────────────────────────────────────────────
export const createFeePayment = asyncHandler(async (req, res) => {
  const {
    studentIds,
    month,
    academicYear,
    paidAmount,
    date,
    notes,
    enrollmentType,
  } = req.body;

  const collectedBy = req.user?.id;
  if (!collectedBy) {
    throw new ApiError(401, "د فیس ثبتولو لپاره لومړی ننوتل اړین دی");
  }

  if (enrollmentType) {
    assertInstitutionAccess(req.user?.permissions, req.user?.role, enrollmentType);
  }

  const normalizedStudentIds = [...new Set(studentIds.map((id) => Number(id)))].filter(
    (id) => Number.isFinite(id) && id > 0
  );

  if (normalizedStudentIds.length === 0) {
    throw new ApiError(400, "لږ تر لږه یو زده کوونکی اړین دی");
  }

  const totalPaidAmount = Number(paidAmount);
  if (!Number.isFinite(totalPaidAmount) || totalPaidAmount < 0) {
    throw new ApiError(400, "ورکړل شوی فیس باید سم عدد وي");
  }

  const createdPayments = [];
  const studentFees = [];

  for (const studentId of normalizedStudentIds) {
    const [studentInfo] = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        fatherName: students.fatherName,
        classId: students.classId,
        className: classes.name,
        section: students.section,
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.id, studentId));

    if (!studentInfo) {
      throw new ApiError(404, `زده کوونکی د ID ${studentId} سره ونه موندل شو`);
    }

    const [existingPayment] = await db
      .select({
        id: feePayments.id,
        enrollmentType: feePayments.enrollmentType,
      })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.studentId, studentId),
          eq(feePayments.month, month),
          eq(feePayments.academicYear, String(academicYear))
        )
      );

    if (existingPayment) {
      throw new ApiError(
        400,
        `د ${studentInfo.fullName} لپاره د ${month} میاشتې فیس دمخه ثبت شوی دی`
      );
    }

    const enrollments = await db
      .select({
        enrollmentType: studentEnrollments.enrollmentType,
        monthlyFee: studentEnrollments.monthlyFee,
      })
      .from(studentEnrollments)
      .where(eq(studentEnrollments.studentId, studentId));

    const allowedTypes = getAllowedInstitutions(req.user?.permissions, req.user?.role);
    const applicableEnrollments = enrollmentType
      ? enrollments.filter((e) => e.enrollmentType === enrollmentType)
      : enrollments.filter((e) => allowedTypes.includes(e.enrollmentType));

    if (applicableEnrollments.length === 0) {
      const typeLabel =
        enrollmentType === "School"
          ? "ښوونځی"
          : enrollmentType === "Center"
            ? "مرکز"
            : enrollmentType === "Madrasa"
              ? "مدرسه"
              : enrollmentType;
      throw new ApiError(
        400,
        `د ${studentInfo.fullName} لپاره د ${typeLabel || "ټاکل شوي"} ډول شمولیت ونه موندل شو`
      );
    }

    const studentTotalFee = applicableEnrollments.reduce(
      (sum, enrollment) => sum + (enrollment.monthlyFee || 0),
      0
    );

    if (studentTotalFee <= 0) {
      throw new ApiError(400, `د زده کوونکي ${studentInfo.fullName} لپاره فیس ټاکل شوی نه دی`);
    }

    studentFees.push({
      ...studentInfo,
      enrollments: applicableEnrollments,
      totalFee: studentTotalFee,
      paymentEnrollmentType:
        enrollmentType || applicableEnrollments[0].enrollmentType,
    });
  }

  const totalFeeAmount = studentFees.reduce((sum, student) => sum + student.totalFee, 0);

  for (const studentFee of studentFees) {
    const studentProportion = studentFee.totalFee / totalFeeAmount;
    const studentPaidAmount = totalPaidAmount * studentProportion;

    let status = "Unpaid";
    if (studentPaidAmount >= studentFee.totalFee) {
      status = "Paid";
    } else if (studentPaidAmount > 0) {
      status = "Partial";
    }

    const receiptNo = await generateReceiptNumber();

    try {
      const [newPayment] = await db
        .insert(feePayments)
        .values({
          receiptNo,
          studentId: studentFee.id,
          enrollmentType: studentFee.paymentEnrollmentType,
          month,
          academicYear: normalizeAcademicYear(academicYear),
          amount: studentFee.totalFee,
          paid: studentPaidAmount,
          status,
          date,
          collectedBy,
          notes: notes || null,
        })
        .returning();

      const [collectorInfo] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, collectedBy));

      createdPayments.push({
        ...newPayment,
        studentName: studentFee.fullName,
        fatherName: studentFee.fatherName,
        className: studentFee.className,
        section: studentFee.section,
        collectedBy: collectorInfo?.name || "Unknown",
      });
    } catch (error) {
      if (error?.message?.includes("UNIQUE constraint failed")) {
        throw new ApiError(
          400,
          `د ${studentFee.fullName} لپاره د ${month} میاشتې فیس دمخه ثبت شوی دی`
        );
      }
      throw error;
    }
  }

  res.respond(201, "فیس بریالیتوب سره ورکړل شو", {
    payments: createdPayments,
    count: createdPayments.length,
  });
});

// ─── UPDATE FEE PAYMENT ────────────────────────────────────────────────────────
export const updateFeePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, amount, notes } = req.body;

  // Get existing payment
  const [existingPayment] = await db
    .select()
    .from(feePayments)
    .where(eq(feePayments.id, Number(id)));

  if (!existingPayment) {
    throw new ApiError(404, "د فیس پیسو معلومات ونه موندل شول");
  }

  assertInstitutionAccess(
    req.user?.permissions,
    req.user?.role,
    existingPayment.enrollmentType
  );

  const nextAmount =
    amount !== undefined && amount !== null
      ? Number(amount)
      : Number(existingPayment.amount || 0);

  const nextPaidAmount =
    paidAmount !== undefined && paidAmount !== null
      ? Number(paidAmount)
      : Number(existingPayment.paid || 0);

  if (!Number.isFinite(nextAmount) || nextAmount < 0) {
    throw new ApiError(400, "د فیس مقدار باید سم عدد وي");
  }

  if (!Number.isFinite(nextPaidAmount) || nextPaidAmount < 0) {
    throw new ApiError(400, "ورکړل شوی فیس باید سم عدد وي");
  }

  if (nextPaidAmount > nextAmount) {
    throw new ApiError(400, "ورکړل شوی مقدار د ټول فیس څخه زیات نشي کیدای");
  }

  // Calculate new status
  let status = "Unpaid";
  if (nextPaidAmount >= nextAmount) {
    status = "Paid";
  } else if (nextPaidAmount > 0) {
    status = "Partial";
  }

  // Update payment
  const [updatedPayment] = await db
    .update(feePayments)
    .set({
      amount: nextAmount,
      paid: nextPaidAmount,
      status,
      notes: notes !== undefined ? notes : existingPayment.notes,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(feePayments.id, Number(id)))
    .returning();

  res.respond(200, "د فیس پیسو معلومات افډیټ شول", { payment: updatedPayment });
});

// ─── DELETE FEE PAYMENT ────────────────────────────────────────────────────────
export const deleteFeePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingPayment] = await db
    .select({ id: feePayments.id, enrollmentType: feePayments.enrollmentType })
    .from(feePayments)
    .where(eq(feePayments.id, Number(id)));

  if (!existingPayment) {
    throw new ApiError(404, "د فیس پیسو معلومات ونه موندل شول");
  }

  if (existingPayment.enrollmentType) {
    assertInstitutionAccess(req.user?.permissions, req.user?.role, existingPayment.enrollmentType);
  }

  await db.delete(feePayments).where(eq(feePayments.id, Number(id)));

  res.respond(200, "د فیس پیسو معلومات ډیلیټ شول");
});

// ─── GET FEE STATISTICS ────────────────────────────────────────────────────────
export const getFeeStatistics = asyncHandler(async (req, res) => {
  const currentMonth = req.query.month || currentShamsiYearMonth();
  const academicYear = req.query.academicYear || currentMonth.split('-')[0];
  
  // Auto-generate unpaid fee records for requested month to ensure accurate statistics
  if (currentMonth && academicYear) {
    await ensureMonthlyFeeRecords(currentMonth, academicYear);
  }
  
  // Get all students with their enrollments to calculate total expected fees
  const allStudents = await db
    .select({
      studentId: students.id,
      enrollmentType: studentEnrollments.enrollmentType,
      monthlyFee: studentEnrollments.monthlyFee,
    })
    .from(students)
    .leftJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId));
  
  // Calculate total expected fees from all students across all enrollment types
  let totalExpectedFees = 0;
  allStudents.forEach(student => {
    if (student.monthlyFee) {
      totalExpectedFees += student.monthlyFee;
    }
  });
  
  // This month's statistics
  const [thisMonthStats] = await db
    .select({
      totalCollected: sql`COALESCE(SUM(${feePayments.paid}), 0)`,
      totalPayments: count(feePayments.id),
    })
    .from(feePayments)
    .where(eq(feePayments.month, currentMonth));

  const totalCollected = parseFloat(thisMonthStats.totalCollected) || 0;
  const remaining = totalExpectedFees - totalCollected;

  // Payment status breakdown for this month
  const statusBreakdown = await db
    .select({
      status: feePayments.status,
      count: count(feePayments.id),
      totalAmount: sql`COALESCE(SUM(${feePayments.amount}), 0)`,
      totalPaid: sql`COALESCE(SUM(${feePayments.paid}), 0)`,
    })
    .from(feePayments)
    .where(eq(feePayments.month, currentMonth))
    .groupBy(feePayments.status);

  // Recent payments (last 10)
  const recentPayments = await db
    .select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      studentName: students.fullName,
      amount: feePayments.paid,
      date: feePayments.date,
      status: feePayments.status,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .where(eq(feePayments.month, currentMonth))
    .orderBy(desc(feePayments.createdAt))
    .limit(10);

  res.respond(200, "د فیس احصایې ترلاسه شوې", {
    thisMonth: {
      totalCollected: totalCollected,
      totalDue: totalExpectedFees,
      totalPayments: thisMonthStats.totalPayments || 0,
      remaining: remaining > 0 ? remaining : 0,
    },
    statusBreakdown: statusBreakdown.map(item => ({
      status: item.status,
      count: item.count,
      totalAmount: parseFloat(item.totalAmount) || 0,
      totalPaid: parseFloat(item.totalPaid) || 0,
    })),
    recentPayments,
  });
});

// ─── EXPORT FEE PAYMENTS ───────────────────────────────────────────────────────
export const exportFeePayments = asyncHandler(async (req, res) => {
  const { 
    search = '', 
    academicYear = '', 
    enrollmentType = '', 
    status = '',
    month = '',
    startDate = '',
    endDate = '',
    format = 'excel' // excel or pdf
  } = req.query;

  // Build where conditions (same as getFeePayments)
  const conditions = [];
  
  if (search) {
    conditions.push(
      sql`(${students.fullName} LIKE ${`%${search}%`} OR ${feePayments.receiptNo} LIKE ${`%${search}%`})`
    );
  }
  
  if (academicYear) {
    const yearNorm = normalizeAcademicYear(academicYear);
    conditions.push(
      sql`REPLACE(CAST(${feePayments.academicYear} AS TEXT), '.0', '') = ${yearNorm}`
    );
  }
  
  if (enrollmentType) {
    conditions.push(eq(feePayments.enrollmentType, enrollmentType));
  }
  
  if (status) {
    conditions.push(eq(feePayments.status, status));
  }
  
  if (month) {
    conditions.push(eq(feePayments.month, month));
  }
  
  if (startDate && endDate) {
    conditions.push(
      and(
        gte(feePayments.date, startDate),
        lte(feePayments.date, endDate)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get all matching records for export
  const payments = await db
    .select({
      receiptNo: feePayments.receiptNo,
      studentName: students.fullName,
      fatherName: students.fatherName,
      enrollmentType: feePayments.enrollmentType,
      month: feePayments.month,
      academicYear: feePayments.academicYear,
      amount: feePayments.amount,
      paid: feePayments.paid,
      remaining: sql`${feePayments.amount} - ${feePayments.paid}`,
      status: feePayments.status,
      date: feePayments.date,
      collectedBy: users.name,
      notes: feePayments.notes,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .leftJoin(users, eq(feePayments.collectedBy, users.id))
    .where(whereClause)
    .orderBy(desc(feePayments.createdAt));

  if (format === 'excel') {
    const workbook = await generateFeeExcelExport(payments, req.query);
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=fee-payments-${Date.now()}.xlsx`);
    res.send(buffer);
  } else if (format === 'pdf') {
    const pdfBuffer = await generateFeePDFExport(payments, req.query);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fee-payments-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } else {
    res.respond(200, "د فیس پیسو معلومات د ایکسپورټ لپاره چمتو شول", {
      payments,
      format,
      totalRecords: payments.length,
    });
  }
});

// ─── GENERATE RECEIPT PDF ──────────────────────────────────────────────────────
export const generateReceiptPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [payment] = await db
    .select({
      receiptNo: feePayments.receiptNo,
      studentName: students.fullName,
      fatherName: students.fatherName,
      className: classes.name,
      enrollmentType: feePayments.enrollmentType,
      month: feePayments.month,
      academicYear: feePayments.academicYear,
      amount: feePayments.amount,
      paid: feePayments.paid,
      status: feePayments.status,
      date: feePayments.date,
      collectedBy: users.name,
      notes: feePayments.notes,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .leftJoin(users, eq(feePayments.collectedBy, users.id))
    .where(eq(feePayments.id, Number(id)));

  if (!payment) {
    throw new ApiError(404, "د فیس پیسو معلومات ونه موندل شول");
  }

  const pdfBuffer = await generateFeeReceiptPDF(payment);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.receiptNo}.pdf`);
  res.send(pdfBuffer);
});

// ─── GENERATE MULTIPLE RECEIPTS PDF ────────────────────────────────────────────
export const generateMultipleReceiptsPDFEndpoint = asyncHandler(async (req, res) => {
  const { paymentIds } = req.body;

  if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
    throw new ApiError(400, "د رسیدونو IDs اړین دی");
  }

  const payments = await db
    .select({
      receiptNo: feePayments.receiptNo,
      studentName: students.fullName,
      fatherName: students.fatherName,
      enrollmentType: feePayments.enrollmentType,
      month: feePayments.month,
      academicYear: feePayments.academicYear,
      amount: feePayments.amount,
      paid: feePayments.paid,
      status: feePayments.status,
      date: feePayments.date,
      collectedBy: users.name,
      notes: feePayments.notes,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .leftJoin(users, eq(feePayments.collectedBy, users.id))
    .where(inArray(feePayments.id, paymentIds.map(id => Number(id))));

  if (payments.length === 0) {
    throw new ApiError(404, "د فیس پیسو معلومات ونه موندل شول");
  }

  const pdfBuffer = await generateMultipleReceiptsPDF(payments);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipts-${Date.now()}.pdf`);
  res.send(pdfBuffer);
});
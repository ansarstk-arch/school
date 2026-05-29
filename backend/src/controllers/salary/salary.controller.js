import { eq, and, desc, sql, or, like } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { 
  salaries, 
  salaryComponents, 
  advances, 
  advancePayments,
  teachers,
  staff,
  attendance,
  users 
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { generateSalarySlipPDF } from "../../utils/salarySlipSimple.util.js";
import { 
  generateSalaryExcelReport, 
  generateSalaryPDFReport,
  generateAdvanceExcelReport 
} from "../../utils/salaryExport.util.js";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get person details (Teacher or Staff)
const getPersonDetails = async (personType, personId) => {
  let person = null;
  let personName = "";
  let position = "";
  let baseSalary = 0;

  if (personType === "Teacher") {
    const [teacher] = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        fatherName: teachers.fatherName,
        education: teachers.education,
        salary: teachers.salary,
      })
      .from(teachers)
      .where(eq(teachers.id, personId));
    
    if (teacher) {
      person = teacher;
      personName = teacher.name;
      position = teacher.education || "ښوونکی";
      baseSalary = teacher.salary || 0;
    }
  } else if (personType === "Staff") {
    const [staffMember] = await db
      .select({
        id: staff.id,
        name: staff.name,
        fatherName: staff.fatherName,
        position: staff.position,
        salary: staff.salary,
      })
      .from(staff)
      .where(eq(staff.id, personId));
    
    if (staffMember) {
      person = staffMember;
      personName = staffMember.name;
      position = staffMember.position || "کارمند";
      baseSalary = staffMember.salary || 0;
    }
  }

  return { person, personName, position, baseSalary };
};

// Get attendance for a person in a specific month
const getAttendanceForMonth = async (personType, personId, month) => {
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = `${year}-${monthNum}-31`;

  const attendanceRecords = await db
    .select({
      status: attendance.status,
      attendanceDate: attendance.attendanceDate,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.attendanceType, personType === "Teacher" ? "Staff" : "Staff"),
        eq(attendance.personId, personId),
        sql`${attendance.attendanceDate} >= ${startDate}`,
        sql`${attendance.attendanceDate} <= ${endDate}`
      )
    );

  const presentDays = attendanceRecords.filter(r => r.status === "Present").length;
  const absentDays = attendanceRecords.filter(r => r.status === "Absent").length;
  const leaveDays = attendanceRecords.filter(r => r.status === "Leave").length;

  return { presentDays, absentDays, leaveDays };
};

// Get active advances for a person
const getActiveAdvances = async (personType, personId) => {
  const activeAdvances = await db
    .select()
    .from(advances)
    .where(
      and(
        eq(advances.personType, personType),
        eq(advances.personId, personId),
        eq(advances.status, "Approved"),
        sql`${advances.remainingAmount} > 0`
      )
    );

  return activeAdvances;
};

// Calculate salary deductions
const calculateDeductions = async (personType, personId, month, baseSalary, absentDays) => {
  let totalDeductions = 0;
  const components = [];

  // 1. Absence deduction (per day deduction)
  if (absentDays > 0) {
    const perDayDeduction = baseSalary / 26; // Assuming 26 working days
    const absenceDeduction = perDayDeduction * absentDays;
    totalDeductions += absenceDeduction;
    components.push({
      type: "Deduction",
      category: "Absence",
      amount: absenceDeduction,
      description: `${absentDays} ورځې غیر حاضري`,
    });
  }

  // 2. Advance/Loan deductions
  const activeAdvances = await getActiveAdvances(personType, personId);
  for (const advance of activeAdvances) {
    if (advance.monthlyDeduction > 0) {
      const deductionAmount = Math.min(advance.monthlyDeduction, advance.remainingAmount);
      totalDeductions += deductionAmount;
      components.push({
        type: "Deduction",
        category: advance.advanceType,
        amount: deductionAmount,
        description: `${advance.advanceType === "Advance" ? "پیشکي" : "پور"} - قسط`,
      });
    }
  }

  return { totalDeductions, components };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SALARY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GENERATE SALARY (Single) ──────────────────────────────────────────────────

export const createSalary = asyncHandler(async (req, res) => {
  const { personType, personId, month, academicYear, baseSalary: customBaseSalary, allowances, bonuses, notes } = req.body;
  const userId = req.user?.id;

  // Check if salary already exists
  const [existingSalary] = await db
    .select()
    .from(salaries)
    .where(
      and(
        eq(salaries.personType, personType),
        eq(salaries.personId, personId),
        eq(salaries.month, month)
      )
    );

  if (existingSalary) {
    throw new ApiError(400, "د دې میاشتې لپاره معاش دمخه جوړ شوی دی");
  }

  // Get person details
  const { person, personName, position, baseSalary: defaultBaseSalary } = await getPersonDetails(personType, personId);
  
  if (!person) {
    throw new ApiError(404, "کس ونه موندل شو");
  }

  const finalBaseSalary = customBaseSalary || defaultBaseSalary;

  if (!finalBaseSalary || finalBaseSalary <= 0) {
    throw new ApiError(400, "د کس لپاره معاش تعریف شوی نه دی");
  }

  // Get attendance
  const { presentDays, absentDays, leaveDays } = await getAttendanceForMonth(personType, personId, month);

  // Calculate deductions
  const { totalDeductions, components: deductionComponents } = await calculateDeductions(
    personType, 
    personId, 
    month, 
    finalBaseSalary, 
    absentDays
  );

  // Calculate totals
  const finalAllowances = allowances || 0;
  const finalBonuses = bonuses || 0;
  const grossSalary = finalBaseSalary + finalAllowances + finalBonuses;
  const netSalary = grossSalary - totalDeductions;

  // Create salary record
  const [newSalary] = await db
    .insert(salaries)
    .values({
      personType,
      personId,
      month,
      academicYear,
      baseSalary: finalBaseSalary,
      allowances: finalAllowances,
      bonuses: finalBonuses,
      deductions: totalDeductions,
      grossSalary,
      netSalary,
      workingDays: 26,
      presentDays,
      absentDays,
      leaveDays,
      notes,
      generatedBy: userId,
    })
    .returning();

  // Create salary components
  if (deductionComponents.length > 0) {
    await db.insert(salaryComponents).values(
      deductionComponents.map(comp => ({
        salaryId: newSalary.id,
        ...comp,
      }))
    );
  }

  // Add allowance components if any
  if (finalAllowances > 0) {
    await db.insert(salaryComponents).values({
      salaryId: newSalary.id,
      type: "Allowance",
      category: "General",
      amount: finalAllowances,
      description: "علاوې",
    });
  }

  // Add bonus components if any
  if (finalBonuses > 0) {
    await db.insert(salaryComponents).values({
      salaryId: newSalary.id,
      type: "Bonus",
      category: "General",
      amount: finalBonuses,
      description: "انعامونه",
    });
  }

  res.json({
    success: true,
    message: "معاش بریالیتوب سره جوړ شو",
    data: {
      salary: {
        ...newSalary,
        personName,
        position,
      },
    },
  });
});

// ─── BULK GENERATE SALARIES ────────────────────────────────────────────────────

export const bulkGenerateSalaries = asyncHandler(async (req, res) => {
  const { personType, month, academicYear, personIds } = req.body;
  const userId = req.user?.id;

  let peopleToProcess = [];

  // Get all teachers or staff or both
  if (personIds && personIds.length > 0) {
    // Generate for specific people
    for (const personId of personIds) {
      const { person, personName, position, baseSalary } = await getPersonDetails(personType, personId);
      if (person && baseSalary > 0) {
        peopleToProcess.push({
          personType,
          personId,
          personName,
          position,
          baseSalary,
        });
      }
    }
  } else {
    // Generate for all
    if (personType === "Teacher" || personType === "All") {
      const allTeachers = await db
        .select({
          id: teachers.id,
          name: teachers.name,
          education: teachers.education,
          salary: teachers.salary,
        })
        .from(teachers)
        .where(sql`${teachers.salary} > 0`);

      peopleToProcess.push(...allTeachers.map(t => ({
        personType: "Teacher",
        personId: t.id,
        personName: t.name,
        position: t.education || "ښوونکی",
        baseSalary: t.salary,
      })));
    }

    if (personType === "Staff" || personType === "All") {
      const allStaff = await db
        .select({
          id: staff.id,
          name: staff.name,
          position: staff.position,
          salary: staff.salary,
        })
        .from(staff)
        .where(
          and(
            eq(staff.status, "active"),
            sql`${staff.salary} > 0`
          )
        );

      peopleToProcess.push(...allStaff.map(s => ({
        personType: "Staff",
        personId: s.id,
        personName: s.name,
        position: s.position || "کارمند",
        baseSalary: s.salary,
      })));
    }
  }

  if (peopleToProcess.length === 0) {
    throw new ApiError(400, "هیڅ کس د معاش جوړولو لپاره ونه موندل شو");
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  // Process each person
  for (const person of peopleToProcess) {
    try {
      // Check if salary already exists
      const [existingSalary] = await db
        .select()
        .from(salaries)
        .where(
          and(
            eq(salaries.personType, person.personType),
            eq(salaries.personId, person.personId),
            eq(salaries.month, month)
          )
        );

      if (existingSalary) {
        results.skipped++;
        continue;
      }

      // Get attendance
      const { presentDays, absentDays, leaveDays } = await getAttendanceForMonth(
        person.personType, 
        person.personId, 
        month
      );

      // Calculate deductions
      const { totalDeductions, components: deductionComponents } = await calculateDeductions(
        person.personType,
        person.personId,
        month,
        person.baseSalary,
        absentDays
      );

      // Calculate totals
      const grossSalary = person.baseSalary;
      const netSalary = grossSalary - totalDeductions;

      // Create salary record
      const [newSalary] = await db
        .insert(salaries)
        .values({
          personType: person.personType,
          personId: person.personId,
          month,
          academicYear,
          baseSalary: person.baseSalary,
          allowances: 0,
          bonuses: 0,
          deductions: totalDeductions,
          grossSalary,
          netSalary,
          workingDays: 26,
          presentDays,
          absentDays,
          leaveDays,
          generatedBy: userId,
        })
        .returning();

      // Create deduction components
      if (deductionComponents.length > 0) {
        await db.insert(salaryComponents).values(
          deductionComponents.map(comp => ({
            salaryId: newSalary.id,
            ...comp,
          }))
        );
      }

      results.created++;
    } catch (error) {
      results.errors.push({
        personId: person.personId,
        personName: person.personName,
        error: error.message,
      });
    }
  }

  res.json({
    success: true,
    message: `معاشونه بریالیتوب سره جوړ شول - ${results.created} نوي، ${results.skipped} پخوا موجود`,
    data: results,
  });
});

// ─── GET ALL SALARIES ──────────────────────────────────────────────────────────

export const getAllSalaries = asyncHandler(async (req, res) => {
  const {
    personType,
    month,
    academicYear,
    paymentStatus,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortDir = "desc",
  } = req.query;

  // Build where conditions
  const conditions = [];

  if (personType) {
    conditions.push(eq(salaries.personType, personType));
  }

  if (month) {
    conditions.push(eq(salaries.month, month));
  }

  if (academicYear) {
    conditions.push(eq(salaries.academicYear, academicYear));
  }

  if (paymentStatus) {
    conditions.push(eq(salaries.paymentStatus, paymentStatus));
  }

  // Get salaries
  let query = db
    .select({
      id: salaries.id,
      personType: salaries.personType,
      personId: salaries.personId,
      month: salaries.month,
      academicYear: salaries.academicYear,
      baseSalary: salaries.baseSalary,
      allowances: salaries.allowances,
      bonuses: salaries.bonuses,
      deductions: salaries.deductions,
      grossSalary: salaries.grossSalary,
      netSalary: salaries.netSalary,
      paidAmount: salaries.paidAmount,
      paymentStatus: salaries.paymentStatus,
      paymentDate: salaries.paymentDate,
      paymentMethod: salaries.paymentMethod,
      workingDays: salaries.workingDays,
      presentDays: salaries.presentDays,
      absentDays: salaries.absentDays,
      leaveDays: salaries.leaveDays,
      notes: salaries.notes,
      createdAt: salaries.createdAt,
      updatedAt: salaries.updatedAt,
    })
    .from(salaries);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Add ordering
  const orderColumn = salaries[sortBy] || salaries.createdAt;
  query = sortDir === "asc" ? query.orderBy(orderColumn) : query.orderBy(desc(orderColumn));

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query.limit(parseInt(limit)).offset(offset);

  const salaryRecords = await query;

  // Get total count
  let countQuery = db.select({ count: sql`count(*)` }).from(salaries);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }
  const [{ count }] = await countQuery;

  // Enrich with person details
  const enrichedSalaries = await Promise.all(
    salaryRecords.map(async (salary) => {
      const { personName, position } = await getPersonDetails(salary.personType, salary.personId);
      
      // Get components
      const components = await db
        .select()
        .from(salaryComponents)
        .where(eq(salaryComponents.salaryId, salary.id));

      return {
        ...salary,
        personName,
        position,
        components,
      };
    })
  );

  // Apply search filter if provided
  let filteredSalaries = enrichedSalaries;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredSalaries = enrichedSalaries.filter(s => 
      s.personName?.toLowerCase().includes(searchLower) ||
      s.position?.toLowerCase().includes(searchLower)
    );
  }

  res.json({
    success: true,
    data: {
      salaries: filteredSalaries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit) || 1,
        pages: Math.ceil(count / limit) || 1,
      },
    },
  });
});

// Continue in next part...

// ─── GET SALARY BY ID ──────────────────────────────────────────────────────────

export const getSalaryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [salary] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, parseInt(id)));

  if (!salary) {
    throw new ApiError(404, "معاش ونه موندل شو");
  }

  // Get person details
  const { personName, position } = await getPersonDetails(salary.personType, salary.personId);

  // Get components
  const components = await db
    .select()
    .from(salaryComponents)
    .where(eq(salaryComponents.salaryId, salary.id));

  res.json({
    success: true,
    data: {
      salary: {
        ...salary,
        personName,
        position,
        components,
      },
    },
  });
});

// ─── UPDATE SALARY ─────────────────────────────────────────────────────────────

export const updateSalary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { allowances, bonuses, deductions, notes } = req.body;

  const [existingSalary] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, parseInt(id)));

  if (!existingSalary) {
    throw new ApiError(404, "معاش ونه موندل شو");
  }

  // Recalculate totals
  const newAllowances = allowances !== undefined ? allowances : existingSalary.allowances;
  const newBonuses = bonuses !== undefined ? bonuses : existingSalary.bonuses;
  const newDeductions = deductions !== undefined ? deductions : existingSalary.deductions;

  const grossSalary = existingSalary.baseSalary + newAllowances + newBonuses;
  const netSalary = grossSalary - newDeductions;

  // Update salary
  const [updatedSalary] = await db
    .update(salaries)
    .set({
      allowances: newAllowances,
      bonuses: newBonuses,
      deductions: newDeductions,
      grossSalary,
      netSalary,
      notes: notes !== undefined ? notes : existingSalary.notes,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(salaries.id, parseInt(id)))
    .returning();

  res.json({
    success: true,
    message: "معاش بریالیتوب سره تازه شو",
    data: { salary: updatedSalary },
  });
});

// ─── PAY SALARY ────────────────────────────────────────────────────────────────

export const markSalaryAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, paymentDate, paymentMethod, notes } = req.body;
  const userId = req.user?.id;

  const [existingSalary] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, parseInt(id)));

  if (!existingSalary) {
    throw new ApiError(404, "معاش ونه موندل شو");
  }

  const newPaidAmount = existingSalary.paidAmount + paidAmount;

  if (newPaidAmount > existingSalary.netSalary) {
    throw new ApiError(400, "ورکړل شوی معاش د خالص معاش څخه زیات نشي کیدای");
  }

  // Determine payment status
  let paymentStatus = "Pending";
  if (newPaidAmount >= existingSalary.netSalary) {
    paymentStatus = "Paid";
  } else if (newPaidAmount > 0) {
    paymentStatus = "Partial";
  }

  // Update salary
  const [updatedSalary] = await db
    .update(salaries)
    .set({
      paidAmount: newPaidAmount,
      paymentStatus,
      paymentDate,
      paymentMethod,
      notes: notes || existingSalary.notes,
      paidBy: userId,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(salaries.id, parseInt(id)))
    .returning();

  // If payment method is "Salary Deduction", update advance payments
  if (paymentMethod === "Salary Deduction") {
    const activeAdvances = await getActiveAdvances(existingSalary.personType, existingSalary.personId);
    
    for (const advance of activeAdvances) {
      if (advance.monthlyDeduction > 0) {
        const deductionAmount = Math.min(advance.monthlyDeduction, advance.remainingAmount);
        
        // Record advance payment
        await db.insert(advancePayments).values({
          advanceId: advance.id,
          salaryId: updatedSalary.id,
          amount: deductionAmount,
          paymentDate,
          paymentMethod: "Salary Deduction",
          recordedBy: userId,
        });

        // Update advance
        const newPaidAmount = advance.paidAmount + deductionAmount;
        const newRemainingAmount = advance.remainingAmount - deductionAmount;
        const newStatus = newRemainingAmount <= 0 ? "Completed" : "Approved";

        await db
          .update(advances)
          .set({
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(advances.id, advance.id));
      }
    }
  }

  res.json({
    success: true,
    message: "معاش بریالیتوب سره ورکړل شو",
    data: { salary: updatedSalary },
  });
});

// ─── UNDO SALARY PAYMENT (paid only) ───────────────────────────────────────────

export const undoSalaryPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingSalary] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, parseInt(id)));

  if (!existingSalary) {
    throw new ApiError(404, "معاش ونه موندل شو");
  }

  if (existingSalary.paymentStatus !== "Paid") {
    throw new ApiError(400, "یوازې ورکړل شوي معاشونه بیرته راګرځولی شي");
  }

  const [updatedSalary] = await db
    .update(salaries)
    .set({
      paidAmount: 0,
      remainingAmount: existingSalary.netSalary,
      paymentStatus: "Pending",
      paymentDate: null,
      paymentMethod: null,
      paidBy: null,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(salaries.id, parseInt(id)))
    .returning();

  res.json({
    success: true,
    message: "د معاش تادیه بریالیتوب سره بیرته راګرځول شوه",
    data: { salary: updatedSalary },
  });
});

// ─── DELETE SALARY ─────────────────────────────────────────────────────────────

export const deleteSalary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingSalary] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, parseInt(id)));

  if (!existingSalary) {
    throw new ApiError(404, "معاش ونه موندل شو");
  }

  // Delete salary (components will be deleted automatically due to CASCADE)
  await db.delete(salaries).where(eq(salaries.id, parseInt(id)));

  res.json({
    success: true,
    message: "معاش بریالیتوب سره حذف شو",
  });
});

// ─── GET SALARY STATISTICS ─────────────────────────────────────────────────────

export const getSalaryStatistics = asyncHandler(async (req, res) => {
  const { month, academicYear } = req.query;

  const conditions = [];
  if (month) conditions.push(eq(salaries.month, month));
  if (academicYear) conditions.push(eq(salaries.academicYear, academicYear));

  // Get all salaries
  let query = db.select().from(salaries);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const allSalaries = await query;

  // Calculate statistics
  const totalSalaries = allSalaries.length;
  const totalNetSalary = allSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalPaid = allSalaries.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalPending = totalNetSalary - totalPaid;

  const paidCount = allSalaries.filter(s => s.paymentStatus === "Paid").length;
  const partialCount = allSalaries.filter(s => s.paymentStatus === "Partial").length;
  const pendingCount = allSalaries.filter(s => s.paymentStatus === "Pending").length;

  // By person type
  const teacherSalaries = allSalaries.filter(s => s.personType === "Teacher");
  const staffSalaries = allSalaries.filter(s => s.personType === "Staff");

  const teacherTotal = teacherSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const staffTotal = staffSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);

  res.json({
    success: true,
    data: {
      totalSalaries,
      totalNetSalary,
      totalPaid,
      totalPending,
      paidCount,
      partialCount,
      pendingCount,
      byPersonType: {
        teacher: {
          count: teacherSalaries.length,
          total: teacherTotal,
        },
        staff: {
          count: staffSalaries.length,
          total: staffTotal,
        },
      },
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CREATE ADVANCE ────────────────────────────────────────────────────────────

export const createAdvance = asyncHandler(async (req, res) => {
  const { personType, personId, advanceType, amount, requestDate, installments, reason, notes } = req.body;
  const userId = req.user?.id;

  // Verify person exists
  const { person, personName } = await getPersonDetails(personType, personId);
  if (!person) {
    throw new ApiError(404, "کس ونه موندل شو");
  }

  // Calculate monthly deduction
  const monthlyDeduction = installments > 0 ? amount / installments : amount;

  // Create advance
  const [newAdvance] = await db
    .insert(advances)
    .values({
      personType,
      personId,
      advanceType,
      amount,
      paidAmount: 0,
      remainingAmount: amount,
      requestDate,
      status: "Pending",
      installments: installments || 1,
      monthlyDeduction,
      reason,
      notes,
      requestedBy: userId,
    })
    .returning();

  res.json({
    success: true,
    message: "پیشکي بریالیتوب سره ثبت شو",
    data: {
      advance: {
        ...newAdvance,
        personName,
      },
    },
  });
});

// ─── GET ALL ADVANCES ──────────────────────────────────────────────────────────

export const getAllAdvances = asyncHandler(async (req, res) => {
  const {
    personType,
    advanceType,
    status,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortDir = "desc",
  } = req.query;

  // Build where conditions
  const conditions = [];

  if (personType) {
    conditions.push(eq(advances.personType, personType));
  }

  if (advanceType) {
    conditions.push(eq(advances.advanceType, advanceType));
  }

  if (status) {
    conditions.push(eq(advances.status, status));
  }

  // Get advances
  let query = db.select().from(advances);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Add ordering
  const orderColumn = advances[sortBy] || advances.createdAt;
  query = sortDir === "asc" ? query.orderBy(orderColumn) : query.orderBy(desc(orderColumn));

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query.limit(parseInt(limit)).offset(offset);

  const advanceRecords = await query;

  // Get total count
  let countQuery = db.select({ count: sql`count(*)` }).from(advances);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }
  const [{ count }] = await countQuery;

  // Enrich with person details
  const enrichedAdvances = await Promise.all(
    advanceRecords.map(async (advance) => {
      const { personName, position } = await getPersonDetails(advance.personType, advance.personId);
      
      // Get payments
      const payments = await db
        .select()
        .from(advancePayments)
        .where(eq(advancePayments.advanceId, advance.id));

      return {
        ...advance,
        personName,
        position,
        payments,
      };
    })
  );

  // Apply search filter
  let filteredAdvances = enrichedAdvances;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredAdvances = enrichedAdvances.filter(a => 
      a.personName?.toLowerCase().includes(searchLower) ||
      a.position?.toLowerCase().includes(searchLower) ||
      a.reason?.toLowerCase().includes(searchLower)
    );
  }

  res.json({
    success: true,
    data: {
      advances: filteredAdvances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit) || 1,
        pages: Math.ceil(count / limit) || 1,
      },
    },
  });
});

// ─── GET ADVANCE BY ID ─────────────────────────────────────────────────────────

export const getAdvanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [advance] = await db
    .select()
    .from(advances)
    .where(eq(advances.id, parseInt(id)));

  if (!advance) {
    throw new ApiError(404, "پیشکي ونه موندل شو");
  }

  // Get person details
  const { personName, position } = await getPersonDetails(advance.personType, advance.personId);

  // Get payments
  const payments = await db
    .select()
    .from(advancePayments)
    .where(eq(advancePayments.advanceId, advance.id))
    .orderBy(desc(advancePayments.paymentDate));

  res.json({
    success: true,
    data: {
      advance: {
        ...advance,
        personName,
        position,
        payments,
      },
    },
  });
});

// ─── UPDATE ADVANCE ────────────────────────────────────────────────────────────

export const updateAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, installments, notes } = req.body;
  const userId = req.user?.id;

  const [existingAdvance] = await db
    .select()
    .from(advances)
    .where(eq(advances.id, parseInt(id)));

  if (!existingAdvance) {
    throw new ApiError(404, "پیشکي ونه موندل شو");
  }

  const updateData = {
    updatedAt: sql`(datetime('now'))`,
  };

  if (status !== undefined) {
    updateData.status = status;
    if (status === "Approved") {
      updateData.approvalDate = new Date().toISOString().split('T')[0];
      updateData.approvedBy = userId;
    }
  }

  if (installments !== undefined) {
    updateData.installments = installments;
    updateData.monthlyDeduction = existingAdvance.remainingAmount / installments;
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const [updatedAdvance] = await db
    .update(advances)
    .set(updateData)
    .where(eq(advances.id, parseInt(id)))
    .returning();

  res.json({
    success: true,
    message: "پیشکي بریالیتوب سره تازه شو",
    data: { advance: updatedAdvance },
  });
});

// ─── RECORD ADVANCE PAYMENT ────────────────────────────────────────────────────

export const recordAdvancePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, paymentDate, paymentMethod, notes } = req.body;
  const userId = req.user?.id;

  const [existingAdvance] = await db
    .select()
    .from(advances)
    .where(eq(advances.id, parseInt(id)));

  if (!existingAdvance) {
    throw new ApiError(404, "پیشکي ونه موندل شو");
  }

  if (amount > existingAdvance.remainingAmount) {
    throw new ApiError(400, "ورکړل شوی مقدار د پاتې مقدار څخه زیات نشي کیدای");
  }

  // Record payment
  await db.insert(advancePayments).values({
    advanceId: existingAdvance.id,
    amount,
    paymentDate,
    paymentMethod,
    notes,
    recordedBy: userId,
  });

  // Update advance
  const newPaidAmount = existingAdvance.paidAmount + amount;
  const newRemainingAmount = existingAdvance.remainingAmount - amount;
  const newStatus = newRemainingAmount <= 0 ? "Completed" : existingAdvance.status;

  const [updatedAdvance] = await db
    .update(advances)
    .set({
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(advances.id, parseInt(id)))
    .returning();

  res.json({
    success: true,
    message: "تادیه بریالیتوب سره ثبت شوه",
    data: { advance: updatedAdvance },
  });
});

// ─── DELETE ADVANCE ────────────────────────────────────────────────────────────

export const deleteAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingAdvance] = await db
    .select()
    .from(advances)
    .where(eq(advances.id, parseInt(id)));

  if (!existingAdvance) {
    throw new ApiError(404, "پیشکي ونه موندل شو");
  }

  // Delete advance (payments will be deleted automatically due to CASCADE)
  await db.delete(advances).where(eq(advances.id, parseInt(id)));

  res.json({
    success: true,
    message: "پیشکي بریالیتوب سره حذف شو",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT & REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GENERATE SALARY SLIP PDF ──────────────────────────────────────────────────

export const downloadSalarySlip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [salary] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, parseInt(id)));

  if (!salary) {
    throw new ApiError(404, "معاش ونه موندل شو");
  }

  // Get person details
  const { personName, position } = await getPersonDetails(salary.personType, salary.personId);

  // Get components
  const components = await db
    .select()
    .from(salaryComponents)
    .where(eq(salaryComponents.salaryId, salary.id));

  const salaryData = {
    ...salary,
    personName,
    position,
    components,
  };

  const pdfBuffer = await generateSalarySlipPDF(salaryData);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${salary.month}-${personName}.pdf"`);
  res.send(pdfBuffer);
});

// ─── EXPORT SALARIES ───────────────────────────────────────────────────────────

export const downloadSalaryExcel = asyncHandler(async (req, res) => {
  const { format, month, academicYear, personType } = req.query;

  const conditions = [];
  if (month) conditions.push(eq(salaries.month, month));
  if (academicYear) conditions.push(eq(salaries.academicYear, academicYear));
  if (personType) conditions.push(eq(salaries.personType, personType));

  let query = db.select().from(salaries);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  query = query.orderBy(desc(salaries.createdAt));

  const salaryRecords = await query;

  // Enrich with person details
  const enrichedSalaries = await Promise.all(
    salaryRecords.map(async (salary) => {
      const { personName, position } = await getPersonDetails(salary.personType, salary.personId);
      const components = await db
        .select()
        .from(salaryComponents)
        .where(eq(salaryComponents.salaryId, salary.id));

      return {
        ...salary,
        personName,
        position,
        components,
      };
    })
  );

  const filters = { month, academicYear, personType };
  const buffer = await generateSalaryExcelReport(enrichedSalaries, filters);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="salaries-${month || 'all'}.xlsx"`);
  res.send(buffer);
});

export const downloadSalaryPDF = asyncHandler(async (req, res) => {
  const { month, academicYear, personType } = req.query;

  const conditions = [];
  if (month) conditions.push(eq(salaries.month, month));
  if (academicYear) conditions.push(eq(salaries.academicYear, academicYear));
  if (personType) conditions.push(eq(salaries.personType, personType));

  let query = db.select().from(salaries);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  query = query.orderBy(desc(salaries.createdAt));

  const salaryRecords = await query;

  // Enrich with person details
  const enrichedSalaries = await Promise.all(
    salaryRecords.map(async (salary) => {
      const { personName, position } = await getPersonDetails(salary.personType, salary.personId);
      const components = await db
        .select()
        .from(salaryComponents)
        .where(eq(salaryComponents.salaryId, salary.id));

      return {
        ...salary,
        personName,
        position,
        components,
      };
    })
  );

  const filters = { month, academicYear, personType };
  const buffer = await generateSalaryPDFReport(enrichedSalaries, filters);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="salaries-${month || 'all'}.pdf"`);
  res.send(buffer);
});

// ─── EXPORT ADVANCES ───────────────────────────────────────────────────────────

export const exportAdvances = asyncHandler(async (req, res) => {
  const { format, personType, advanceType, status } = req.query;

  const conditions = [];
  if (personType) conditions.push(eq(advances.personType, personType));
  if (advanceType) conditions.push(eq(advances.advanceType, advanceType));
  if (status) conditions.push(eq(advances.status, status));

  let query = db.select().from(advances);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  query = query.orderBy(desc(advances.createdAt));

  const advanceRecords = await query;

  // Enrich with person details
  const enrichedAdvances = await Promise.all(
    advanceRecords.map(async (advance) => {
      const { personName, position } = await getPersonDetails(advance.personType, advance.personId);
      return {
        ...advance,
        personName,
        position,
      };
    })
  );

  const filters = { personType, advanceType, status };

  if (format === 'excel') {
    const buffer = await generateAdvanceExcelReport(enrichedAdvances, filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="advances-${Date.now()}.xlsx"`);
    res.send(buffer);
  } else {
    throw new ApiError(400, "د فارمټ ډول باید excel وي");
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  createSalary,
  bulkGenerateSalaries,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  markSalaryAsPaid,
  deleteSalary,
  getSalaryStatistics,
  createAdvance,
  getAllAdvances,
  getAdvanceById,
  updateAdvance,
  recordAdvancePayment,
  deleteAdvance,
  downloadSalarySlip,
  downloadSalaryExcel,
  downloadSalaryPDF,
  exportAdvances,
};

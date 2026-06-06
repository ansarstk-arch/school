import { eq, like, and, desc, sql, count, gte, lte, between } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { 
  students, teachers, staff, classes, subjects, attendance, 
  expenses, feePayments, exams, users, studentEnrollments, salaries, inventoryItems, inventorySales
} from "../../db/schema.js";
import { getCurrentAfghanDate } from "../../utils/dateHandler.util.js";
import { sumSalariesFromRows } from "../../utils/dashboardSalary.util.js";
import {
  getCurrentShamsiMonthRange,
  getCurrentShamsiYearRange,
  getLastNShamsiMonths,
  getInstituteTypeLabel,
  currentShamsiYear,
  SH_MONTHS,
  shamsiMonthToGregorianRange,
} from "../../utils/shamsiDate.util.js";

// Helper function to get date ranges
let hasExpensesPeriodTypeColumnCache = null;
const hasExpensesPeriodTypeColumn = async () => {
  if (hasExpensesPeriodTypeColumnCache !== null) return hasExpensesPeriodTypeColumnCache;
  try {
    const pragmaRows = await db.run(sql`PRAGMA table_info(expenses)`);
    hasExpensesPeriodTypeColumnCache = Array.isArray(pragmaRows)
      ? pragmaRows.some((col) => col?.name === "period_type")
      : false;
  } catch {
    hasExpensesPeriodTypeColumnCache = false;
  }
  return hasExpensesPeriodTypeColumnCache;
};

const getDateRanges = (yearOverride) => {
  const today = getCurrentAfghanDate();
  const { monthKey, monthStart, monthEnd } = getCurrentShamsiMonthRange();
  const { yearStart, yearEnd, jy } = getCurrentShamsiYearRange(yearOverride);
  const currentYear = Number(yearOverride) || jy || currentShamsiYear();
  return { today, monthStart, monthEnd, monthKey, yearStart, yearEnd, currentYear };
};

const activeStudentCondition = eq(students.status, "active");

// Helper to normalize type parameter
const normalizeType = (type) => {
  if (!type || type === "all") return "all";
  const lowerType = type.toLowerCase();
  if (lowerType === "school") return "School";
  if (lowerType === "center") return "Center";
  if (lowerType === "madrasa") return "Madrasa";
  return "all";
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CARDS API (FAST - ONLY OVERVIEW DATA) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getDashboardCards = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const year = Number(req.query.year);
  const { today, monthStart, monthEnd, monthKey, yearStart, yearEnd, currentYear } = getDateRanges(year);
  const academicYear = String(currentYear);

  let responseData = {};

  const expensesAggregation = db.select({
    daily: sql`COALESCE(SUM(CASE WHEN ${expenses.date} = ${today} THEN ${expenses.amount} ELSE 0 END), 0)`,
    monthly: sql`COALESCE(SUM(CASE WHEN ${expenses.date} >= ${monthStart} AND ${expenses.date} <= ${monthEnd} THEN ${expenses.amount} ELSE 0 END), 0)`,
    yearly: sql`COALESCE(SUM(CASE WHEN ${expenses.date} >= ${yearStart} AND ${expenses.date} <= ${yearEnd} THEN ${expenses.amount} ELSE 0 END), 0)`,
  }).from(expenses);

  if (type === "all") {
    // ─── ALL VIEW - OPTIMIZED WITH SINGLE QUERY WHERE POSSIBLE ──────────────────
    const [
      allStudentsResult,
      enrollmentBreakdown,
      teacherResult,
      classResult,
      subjectResult,
      feePaymentsResult,
      expensesResult,
      paidSalariesResult,
      inventoryRevenueResult,
      unpaidFeesResult,
      staffResult,
      attendanceResult,
      lowStockItemsResult,
      staffSalaryRows,
      teacherSalaryRows
    ] = await Promise.all([
      // Single query for total students
      db.select({ count: count() }).from(students).where(and(eq(students.academicYear, academicYear), activeStudentCondition)),
      
      // Single query for enrollment breakdown
      db.select({
        enrollmentType: studentEnrollments.enrollmentType,
        count: sql`COUNT(DISTINCT ${studentEnrollments.studentId})`
      })
        .from(studentEnrollments)
        .innerJoin(students, eq(studentEnrollments.studentId, students.id))
        .where(and(eq(students.academicYear, academicYear), activeStudentCondition))
        .groupBy(studentEnrollments.enrollmentType),
      
      db.select({ count: count() }).from(teachers).where(eq(teachers.status, "active")),
      db.select({ count: count() }).from(classes).where(eq(classes.academicYear, academicYear)),
      db.select({ count: count() }).from(subjects).where(eq(subjects.academicYear, academicYear)),
      
      // Fee payments (income)
      db.select({
        monthly: sql`COALESCE(SUM(CASE WHEN (${feePayments.month} = ${monthKey} OR (${feePayments.date} >= ${monthStart} AND ${feePayments.date} <= ${monthEnd})) THEN ${feePayments.paid} ELSE 0 END), 0)`,
        daily: sql`COALESCE(SUM(CASE WHEN ${feePayments.date} = ${today} THEN ${feePayments.paid} ELSE 0 END), 0)`,
        yearly: sql`COALESCE(SUM(CASE WHEN (${feePayments.date} >= ${yearStart} AND ${feePayments.date} <= ${yearEnd}) THEN ${feePayments.paid} ELSE 0 END), 0)`
      }).from(feePayments).where(eq(feePayments.academicYear, academicYear)),
      
      // Expenses by period type
      expensesAggregation,
      
      // Paid salaries
      db.select({ 
        monthly: sql`COALESCE(SUM(CASE WHEN ${salaries.month} BETWEEN ${monthStart.substring(0, 7)} AND ${monthEnd.substring(0, 7)} THEN ${salaries.paidAmount} ELSE 0 END), 0)`
      }).from(salaries),

      // Inventory sales (only for all dashboard revenue)
      db.select({
        monthly: sql`COALESCE(SUM(CASE WHEN ${inventorySales.saleDate} BETWEEN ${monthStart} AND ${monthEnd} THEN ${inventorySales.totalAmount} ELSE 0 END), 0)`,
        daily: sql`COALESCE(SUM(CASE WHEN ${inventorySales.saleDate} = ${today} THEN ${inventorySales.totalAmount} ELSE 0 END), 0)`,
        yearly: sql`COALESCE(SUM(CASE WHEN ${inventorySales.saleDate} BETWEEN ${yearStart} AND ${yearEnd} THEN ${inventorySales.totalAmount} ELSE 0 END), 0)`,
      }).from(inventorySales).where(eq(inventorySales.academicYear, academicYear)),
      
      db.select({ count: count() }).from(feePayments).where(and(eq(feePayments.status, "Unpaid"), eq(feePayments.academicYear, academicYear))),
      db.select({ count: count() }).from(staff).where(eq(staff.status, "active")),
      
      // Optimized attendance query
      db.select({ 
        total: count(), 
        present: sql`SUM(CASE WHEN ${attendance.status} = 'Present' THEN 1 ELSE 0 END)` 
      })
        .from(attendance)
        .where(and(
          eq(attendance.attendanceDate, today), 
          eq(attendance.attendanceType, "Student")
        )),

      db.select({ count: count() }).from(inventoryItems).where(and(eq(inventoryItems.academicYear, academicYear), sql`${inventoryItems.stockQuantity} <= ${inventoryItems.lowStockThreshold}`)),
      
      db.select({ salary: staff.salary, staffType: staff.staffType })
        .from(staff)
        .where(eq(staff.status, "active")),
      db.select({ salary: teachers.salary, teacherType: teachers.teacherType }).from(teachers),
    ]);

    // Process enrollment breakdown
    const enrollmentCounts = { school: 0, center: 0, madrasa: 0 };
    enrollmentBreakdown.forEach(item => {
      const type = item.enrollmentType?.toLowerCase();
      if (type === 'school') enrollmentCounts.school = Number(item.count || 0);
      else if (type === 'center') enrollmentCounts.center = Number(item.count || 0);
      else if (type === 'madrasa') enrollmentCounts.madrasa = Number(item.count || 0);
    });

    const attTotal = Number(attendanceResult[0]?.total || 0);
    const attPresent = Number(attendanceResult[0]?.present || 0);
    const totalStaffSalary = sumSalariesFromRows(staffSalaryRows, "staffType", "all");
    const totalTeachersSalary = sumSalariesFromRows(teacherSalaryRows, "teacherType", "all");
    
    // Calculate PURE REVENUE (total income from fees and inventory)
    const monthlyFeeIncome = Number(feePaymentsResult[0]?.monthly || 0);
    const dailyFeeIncome = Number(feePaymentsResult[0]?.daily || 0);
    const yearlyFeeIncome = Number(feePaymentsResult[0]?.yearly || 0);
    const monthlyInventoryRevenue = Number(inventoryRevenueResult[0]?.monthly || 0);
    const dailyInventoryRevenue = Number(inventoryRevenueResult[0]?.daily || 0);
    const yearlyInventoryRevenue = Number(inventoryRevenueResult[0]?.yearly || 0);
    
    // Calculate EXPENSES (pure expenses from expenses table)
    const monthlyExpenses = Number(expensesResult[0]?.monthly || 0);
    const dailyExpenses = Number(expensesResult[0]?.daily || 0);
    const yearlyExpenses = Number(expensesResult[0]?.yearly || 0);
    
    // Revenue is PURE INCOME (fees + inventory sales)
    const monthlyRevenue = monthlyFeeIncome + monthlyInventoryRevenue;
    const dailyRevenue = dailyFeeIncome + dailyInventoryRevenue;
    const yearlyRevenue = yearlyFeeIncome + yearlyInventoryRevenue;

    responseData = {
      students: {
        total: Number(allStudentsResult[0]?.count || 0),
        school: enrollmentCounts.school,
        center: enrollmentCounts.center,
        madrasa: enrollmentCounts.madrasa,
      },
      teachers: Number(teacherResult[0]?.count || 0),
      classes: Number(classResult[0]?.count || 0),
      subjects: Number(subjectResult[0]?.count || 0),
      revenue: {
        daily: dailyRevenue,
        monthly: monthlyRevenue,
        yearly: yearlyRevenue,
        inventory: monthlyInventoryRevenue, // Separate inventory revenue for card display
      },
      expenses: {
        daily: dailyExpenses,
        monthly: monthlyExpenses,
        yearly: yearlyExpenses,
      },
      unpaidFees: Number(unpaidFeesResult[0]?.count || 0),
      lowStockItems: Number(lowStockItemsResult[0]?.count || 0),
      staff: Number(staffResult[0]?.count || 0),
      attendancePercentage: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
      salaries: {
        total: totalStaffSalary + totalTeachersSalary,
        staff: totalStaffSalary,
        teachers: totalTeachersSalary,
      },
      year: currentYear,
      type: "all",
    };
  } else {
    // ─── SPECIFIC TYPE VIEW - OPTIMIZED ─────────────────────────────────────────
    const [
      studentsResult,
      teacherResult,
      classResult,
      subjectResult,
      feePaymentsResult,
      expensesResult,
      paidSalariesResult,
      unpaidFeesResult,
      staffResult,
      attendanceResult,
      staffSalaryRows,
      teacherSalaryRows
    ] = await Promise.all([
      db.select({ count: sql`COUNT(DISTINCT ${studentEnrollments.studentId})` })
        .from(studentEnrollments)
        .innerJoin(students, eq(studentEnrollments.studentId, students.id))
        .where(and(eq(studentEnrollments.enrollmentType, type), eq(students.academicYear, academicYear), activeStudentCondition)),
      
      db.select({ count: count() }).from(teachers).where(and(like(teachers.teacherType, `%"${type}"%`), eq(teachers.status, "active"))),
      db.select({ count: count() }).from(classes).where(and(eq(classes.type, type), eq(classes.academicYear, academicYear))),
      db.select({ count: count() }).from(subjects).where(and(eq(subjects.type, type), eq(subjects.academicYear, academicYear))),
      
      // Fee payments (income)
      db.select({
        monthly: sql`COALESCE(SUM(CASE WHEN (${feePayments.month} = ${monthKey} OR (${feePayments.date} >= ${monthStart} AND ${feePayments.date} <= ${monthEnd})) THEN ${feePayments.paid} ELSE 0 END), 0)`,
        daily: sql`COALESCE(SUM(CASE WHEN ${feePayments.date} = ${today} THEN ${feePayments.paid} ELSE 0 END), 0)`,
        yearly: sql`COALESCE(SUM(CASE WHEN (${feePayments.date} >= ${yearStart} AND ${feePayments.date} <= ${yearEnd}) THEN ${feePayments.paid} ELSE 0 END), 0)`
      })
        .from(feePayments)
        .where(and(eq(feePayments.enrollmentType, type), eq(feePayments.academicYear, academicYear))),
      
      db.select({
        daily: sql`COALESCE(SUM(CASE WHEN ${expenses.date} = ${today} THEN ${expenses.amount} ELSE 0 END), 0)`,
        monthly: sql`COALESCE(SUM(CASE WHEN ${expenses.date} >= ${monthStart} AND ${expenses.date} <= ${monthEnd} THEN ${expenses.amount} ELSE 0 END), 0)`,
        yearly: sql`COALESCE(SUM(CASE WHEN ${expenses.date} >= ${yearStart} AND ${expenses.date} <= ${yearEnd} THEN ${expenses.amount} ELSE 0 END), 0)`,
      })
        .from(expenses)
        .where(eq(expenses.instituteType, type)),
      
      // Paid salaries for specific type (filter by staff/teacher type in JSON array)
      db.select({ 
        monthly: sql`COALESCE(SUM(CASE WHEN ${salaries.month} BETWEEN ${monthStart.substring(0, 7)} AND ${monthEnd.substring(0, 7)} THEN ${salaries.paidAmount} ELSE 0 END), 0)`
      })
        .from(salaries)
        .leftJoin(staff, and(eq(salaries.personType, "Staff"), eq(salaries.personId, staff.id)))
        .leftJoin(teachers, and(eq(salaries.personType, "Teacher"), eq(salaries.personId, teachers.id)))
        .where(
          sql`(
            (${salaries.personType} = 'Staff' AND ${staff.staffType} LIKE ${'%"' + type + '"%'})
            OR
            (${salaries.personType} = 'Teacher' AND ${teachers.teacherType} LIKE ${'%"' + type + '"%'})
          )`
        ),
      
      db.select({ count: count() })
        .from(feePayments)
        .where(and(eq(feePayments.status, "Unpaid"), eq(feePayments.enrollmentType, type), eq(feePayments.academicYear, academicYear))),
      
      db.select({ count: count() })
        .from(staff)
        .where(and(eq(staff.status, "active"), like(staff.staffType, `%"${type}"%`))),
      
      db.select({ 
        total: count(), 
        present: sql`SUM(CASE WHEN ${attendance.status} = 'Present' THEN 1 ELSE 0 END)` 
      })
        .from(attendance)
        .where(and(
          eq(attendance.attendanceDate, today), 
          eq(attendance.attendanceType, "Student"), 
          eq(attendance.institutionType, type)
        )),
      
      db.select({ salary: staff.salary, staffType: staff.staffType })
        .from(staff)
        .where(and(eq(staff.status, "active"), like(staff.staffType, `%"${type}"%`))),
      db.select({ salary: teachers.salary, teacherType: teachers.teacherType })
        .from(teachers)
        .where(like(teachers.teacherType, `%"${type}"%`)),
    ]);

    const attTotal = Number(attendanceResult[0]?.total || 0);
    const attPresent = Number(attendanceResult[0]?.present || 0);
    const totalStaffSalary = sumSalariesFromRows(staffSalaryRows, "staffType", type);
    const totalTeachersSalary = sumSalariesFromRows(teacherSalaryRows, "teacherType", type);
    
    // Calculate PURE REVENUE (total income from fees)
    const monthlyFeeIncome = Number(feePaymentsResult[0]?.monthly || 0);
    const dailyFeeIncome = Number(feePaymentsResult[0]?.daily || 0);
    const yearlyFeeIncome = Number(feePaymentsResult[0]?.yearly || 0);
    
    // Calculate EXPENSES (pure expenses from expenses table)
    const monthlyExpenses = Number(expensesResult[0]?.monthly || 0);
    const dailyExpenses = Number(expensesResult[0]?.daily || 0);
    const yearlyExpenses = Number(expensesResult[0]?.yearly || 0);
    
    // Revenue is PURE INCOME (fees only for type-specific views)
    const monthlyRevenue = monthlyFeeIncome;
    const dailyRevenue = dailyFeeIncome;
    const yearlyRevenue = yearlyFeeIncome;

    responseData = {
      students: Number(studentsResult[0]?.count || 0),
      teachers: Number(teacherResult[0]?.count || 0),
      classes: Number(classResult[0]?.count || 0),
      subjects: Number(subjectResult[0]?.count || 0),
      revenue: {
        daily: dailyRevenue,
        monthly: monthlyRevenue,
        yearly: yearlyRevenue,
        inventory: 0, // Inventory is not type-specific, only shown in "all" view
      },
      expenses: {
        daily: dailyExpenses,
        monthly: monthlyExpenses,
        yearly: yearlyExpenses,
      },
      unpaidFees: Number(unpaidFeesResult[0]?.count || 0),
      staff: Number(staffResult[0]?.count || 0),
      attendancePercentage: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
      salaries: {
        total: totalStaffSalary + totalTeachersSalary,
        staff: totalStaffSalary,
        teachers: totalTeachersSalary,
      },
      year: currentYear,
      type: type.toLowerCase(),
    };
  }

  res.json({
    success: true,
    data: responseData,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPH 1: REVENUE VS EXPENSE CHART (SEPARATE API) ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getRevenueExpenseChart = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const months = parseInt(req.query.months) || 5;
  const monthRanges = getLastNShamsiMonths(months).map((m) => ({
    monthStart: m.monthStart,
    monthEnd: m.monthEnd,
    name: m.name,
    monthKey: m.monthKey,
  }));

  let chartData;

  if (type === "all") {
    const [revenueResult, expenseResult] = await Promise.all([
      db.select({
        ...Object.fromEntries(
          monthRanges.map((range, idx) => [
            `revenue_${idx}`,
            sql`COALESCE(SUM(CASE WHEN ${feePayments.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} THEN ${feePayments.paid} ELSE 0 END), 0)`,
          ])
        ),
      }).from(feePayments),
      db.select({
        ...Object.fromEntries(
          monthRanges.map((range, idx) => [
            `expense_${idx}`,
            sql`COALESCE(SUM(CASE WHEN ${expenses.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} THEN ${expenses.amount} ELSE 0 END), 0)`,
          ])
        ),
      }).from(expenses),
    ]);

    chartData = monthRanges.map((range, idx) => ({
      month: range.name,
      revenue: Number(revenueResult[0]?.[`revenue_${idx}`] || 0),
      expense: Number(expenseResult[0]?.[`expense_${idx}`] || 0),
    }));
  } else {
    const [revenueResult, expenseResult] = await Promise.all([
      db.select({
        ...Object.fromEntries(
          monthRanges.map((range, idx) => [
            `revenue_${idx}`,
            sql`COALESCE(SUM(CASE WHEN ${feePayments.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} AND ${feePayments.enrollmentType} = ${type} THEN ${feePayments.paid} ELSE 0 END), 0)`,
          ])
        ),
      }).from(feePayments),
      db.select({
        ...Object.fromEntries(
          monthRanges.map((range, idx) => [
            `expense_${idx}`,
            sql`COALESCE(SUM(CASE WHEN ${expenses.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} AND ${expenses.instituteType} = ${type} THEN ${expenses.amount} ELSE 0 END), 0)`,
          ])
        ),
      }).from(expenses),
    ]);

    chartData = monthRanges.map((range, idx) => ({
      month: range.name,
      revenue: Number(revenueResult[0]?.[`revenue_${idx}`] || 0),
      expense: Number(expenseResult[0]?.[`expense_${idx}`] || 0),
    }));
  }

  res.json({
    success: true,
    data: chartData,
  });
});

export const getFinancialSummaryChart = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const months = parseInt(req.query.months) || 12;
  const monthRanges = getLastNShamsiMonths(months).map((m) => ({
    monthStart: m.monthStart,
    monthEnd: m.monthEnd,
    monthKey: m.monthKey,
    name: m.name,
  }));

  const [revenueResult, expenseResult, salaryResult] = await Promise.all([
    db.select({
      ...Object.fromEntries(
        monthRanges.map((range, idx) => [
          `revenue_${idx}`,
          type === "all"
            ? sql`COALESCE(SUM(CASE WHEN ${feePayments.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} THEN ${feePayments.paid} ELSE 0 END), 0)`
            : sql`COALESCE(SUM(CASE WHEN ${feePayments.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} AND ${feePayments.enrollmentType} = ${type} THEN ${feePayments.paid} ELSE 0 END), 0)`,
        ])
      ),
    }).from(feePayments),
    db.select({
      ...Object.fromEntries(
        monthRanges.map((range, idx) => [
          `expense_${idx}`,
          type === "all"
            ? sql`COALESCE(SUM(CASE WHEN ${expenses.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} THEN ${expenses.amount} ELSE 0 END), 0)`
            : sql`COALESCE(SUM(CASE WHEN ${expenses.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} AND ${expenses.instituteType} = ${type} THEN ${expenses.amount} ELSE 0 END), 0)`,
        ])
      ),
    }).from(expenses),
    db.select({
      ...Object.fromEntries(
        monthRanges.map((range, idx) => [
          `salary_${idx}`,
          sql`COALESCE(SUM(CASE WHEN ${salaries.month} = ${range.monthKey} THEN ${salaries.paidAmount} ELSE 0 END), 0)`,
        ])
      ),
    }).from(salaries),
  ]);

  const chartData = monthRanges.map((range, idx) => ({
    month: range.name,
    revenue: Number(revenueResult[0]?.[`revenue_${idx}`] || 0),
    expenses: Number(expenseResult[0]?.[`expense_${idx}`] || 0),
    salaries: Number(salaryResult[0]?.[`salary_${idx}`] || 0),
  }));

  res.json({ success: true, data: chartData });
});

export const getYearlyStudentComparisonChart = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const year = Number(req.query.year) || currentShamsiYear();
  const previousYear = year - 1;
  const rows = [];
  for (let month = 1; month <= 12; month++) {
    const currentEnd = shamsiMonthToGregorianRange(year, month).end;
    const previousEnd = shamsiMonthToGregorianRange(previousYear, month).end;

    const [currentResult, previousResult] = await Promise.all([
      type === "all"
        ? db.select({ count: sql`COUNT(${students.id})` }).from(students).where(sql`${students.createdAt} <= ${currentEnd}`)
        : db
            .select({ count: sql`COUNT(DISTINCT ${studentEnrollments.studentId})` })
            .from(studentEnrollments)
            .innerJoin(students, eq(studentEnrollments.studentId, students.id))
            .where(and(eq(studentEnrollments.enrollmentType, type), sql`${students.createdAt} <= ${currentEnd}`)),
      type === "all"
        ? db.select({ count: sql`COUNT(${students.id})` }).from(students).where(sql`${students.createdAt} <= ${previousEnd}`)
        : db
            .select({ count: sql`COUNT(DISTINCT ${studentEnrollments.studentId})` })
            .from(studentEnrollments)
            .innerJoin(students, eq(studentEnrollments.studentId, students.id))
            .where(and(eq(studentEnrollments.enrollmentType, type), sql`${students.createdAt} <= ${previousEnd}`)),
    ]);

    rows.push({
      month: SH_MONTHS[month - 1],
      thisYear: Number(currentResult[0]?.count || 0),
      lastYear: Number(previousResult[0]?.count || 0),
    });
  }

  res.json({ success: true, data: rows });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPH 2: ATTENDANCE PIE CHART (SEPARATE API) ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getAttendanceChart = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const targetDate = req.query.date || getCurrentAfghanDate();

  let attendanceData = [];
  
  if (type === "all") {
    attendanceData = await db.select({
      status: attendance.status,
      count: count(),
    })
      .from(attendance)
      .where(and(
        eq(attendance.attendanceDate, targetDate),
        eq(attendance.attendanceType, "Student")
      ))
      .groupBy(attendance.status);
  } else {
    attendanceData = await db.select({
      status: attendance.status,
      count: count(),
    })
      .from(attendance)
      .where(and(
        eq(attendance.attendanceDate, targetDate),
        eq(attendance.attendanceType, "Student"),
        eq(attendance.institutionType, type)
      ))
      .groupBy(attendance.status);
  }

  const chartData = [
    { name: "حاضر", value: 0 },
    { name: "غیر حاضر", value: 0 },
    { name: "رخصتي", value: 0 },
  ];

  attendanceData.forEach((item) => {
    const itemCount = Number(item.count || 0);
    if (item.status === "Present") {
      chartData[0].value = itemCount;
    } else if (item.status === "Absent") {
      chartData[1].value = itemCount;
    } else if (item.status === "Leave") {
      chartData[2].value = itemCount;
    }
  });

  res.json({
    success: true,
    data: chartData,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPH 3: STUDENT GROWTH LINE CHART (SEPARATE API) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getStudentGrowthChart = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const monthsCount = parseInt(req.query.months) || 6;
  const monthsData = getLastNShamsiMonths(monthsCount);
  const monthEndDates = monthsData.map((m) => m.monthEnd);

  let result;
  
  if (type === "all") {
    // Single query for all months
    const caseStatements = monthEndDates.map((date, idx) => 
      sql`SUM(CASE WHEN ${students.createdAt} <= ${date} THEN 1 ELSE 0 END) as month_${idx}`
    );
    
    result = await db.select({
      ...Object.fromEntries(
        monthEndDates.map((date, idx) => [
          `month_${idx}`,
          sql`SUM(CASE WHEN ${students.createdAt} <= ${date} THEN 1 ELSE 0 END)`
        ])
      )
    }).from(students);
  } else {
    // Single query for specific type
    result = await db.select({
      ...Object.fromEntries(
        monthEndDates.map((date, idx) => [
          `month_${idx}`,
          sql`COUNT(DISTINCT CASE WHEN ${students.createdAt} <= ${date} THEN ${studentEnrollments.studentId} END)`
        ])
      )
    })
      .from(studentEnrollments)
      .innerJoin(students, eq(studentEnrollments.studentId, students.id))
      .where(eq(studentEnrollments.enrollmentType, type));
  }

  const chartData = monthsData.map((monthInfo, idx) => ({
    month: monthInfo.name,
    students: Number(result[0]?.[`month_${idx}`] || 0),
  }));

  res.json({
    success: true,
    data: chartData,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPH 4: MONTHLY EXPENSES BAR CHART (SEPARATE API) ────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getMonthlyExpensesChart = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const months = parseInt(req.query.months) || 5;
  const monthRanges = getLastNShamsiMonths(months).map((m) => ({
    monthStart: m.monthStart,
    monthEnd: m.monthEnd,
    name: m.name,
  }));

  let result;

  if (type === "all") {
    result = await db.select({
      ...Object.fromEntries(
        monthRanges.map((range, idx) => [
          `expense_${idx}`,
          sql`COALESCE(SUM(CASE WHEN ${expenses.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} THEN ${expenses.amount} ELSE 0 END), 0)`
        ])
      )
    }).from(expenses);
  } else {
    result = await db.select({
      ...Object.fromEntries(
        monthRanges.map((range, idx) => [
          `expense_${idx}`,
          sql`COALESCE(SUM(CASE WHEN ${expenses.date} BETWEEN ${range.monthStart} AND ${range.monthEnd} THEN ${expenses.amount} ELSE 0 END), 0)`
        ])
      )
    })
      .from(expenses)
      .where(eq(expenses.instituteType, type));
  }

  const chartData = monthRanges.map((range, idx) => ({
    month: range.name,
    expense: Number(result[0]?.[`expense_${idx}`] || 0),
  }));

  res.json({
    success: true,
    data: chartData,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RECENT ADMISSIONS (SEPARATE API) ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getRecentAdmissions = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const limit = Math.min(parseInt(req.query.limit) || 5, 5);

  let recentStudents = [];

  if (type === "all") {
    recentStudents = await db.select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      className: classes.name,
      classSection: classes.section,
      classType: classes.type,
      createdAt: students.createdAt,
    })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(activeStudentCondition)
      .orderBy(desc(students.createdAt))
      .limit(limit);
  } else {
    recentStudents = await db.select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      className: classes.name,
      classSection: classes.section,
      classType: classes.type,
      createdAt: students.createdAt,
    })
      .from(students)
      .innerJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(and(eq(studentEnrollments.enrollmentType, type), activeStudentCondition))
      .orderBy(desc(students.createdAt))
      .limit(limit);
  }

  res.json({
    success: true,
    data: recentStudents.map((s) => ({
      ...s,
      classTypeLabel: getInstituteTypeLabel(s.classType),
    })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── UPCOMING EXAMS (SEPARATE API) ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getUpcomingExams = asyncHandler(async (req, res) => {
  const rawType = req.query.type || "all";
  const type = normalizeType(rawType);
  const limit = parseInt(req.query.limit) || 5;
  const today = getCurrentAfghanDate();
  const academicYear = String(req.query.year || currentShamsiYear());

  const conditions = [
    eq(exams.status, "فعال"),
    gte(exams.endDate, today),
    eq(exams.academicYear, academicYear),
  ];
  if (type !== "all") {
    conditions.push(eq(exams.institutionType, type));
  }

  const upcomingExams = await db.select({
    id: exams.id,
    examTitle: exams.examTitle,
    institutionType: exams.institutionType,
    startDate: exams.startDate,
    endDate: exams.endDate,
    status: exams.status,
    academicYear: exams.academicYear,
  })
    .from(exams)
    .where(and(...conditions))
    .orderBy(exams.startDate)
    .limit(limit);

  res.json({
    success: true,
    data: upcomingExams.map((e) => ({
      ...e,
      institutionTypeLabel: getInstituteTypeLabel(e.institutionType),
    })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SYSTEM STATUS (SEPARATE API) ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getSystemStatus = asyncHandler(async (req, res) => {
  let dbStatus = "فعال";
  let backendStatus = "فعال";
  
  try {
    await db.select({ count: count() }).from(users).limit(1);
  } catch (error) {
    dbStatus = "ستونزه";
    backendStatus = "ستونزه";
  }

  res.json({
    success: true,
    data: {
      frontend: { status: "فعال", variant: "success" },
      backend: { status: backendStatus, variant: backendStatus === "فعال" ? "success" : "destructive" },
      database: { status: dbStatus, variant: dbStatus === "فعال" ? "success" : "destructive" },
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LEGACY: KEEP OLD getDashboardOverview FOR BACKWARD COMPATIBILITY ──────────
// ═══════════════════════════════════════════════════════════════════════════════

export const getDashboardOverview = getDashboardCards;

export default {
  getDashboardCards,
  getDashboardOverview,
  getRevenueExpenseChart,
  getFinancialSummaryChart,
  getYearlyStudentComparisonChart,
  getAttendanceChart,
  getStudentGrowthChart,
  getMonthlyExpensesChart,
  getRecentAdmissions,
  getUpcomingExams,
  getSystemStatus,
};

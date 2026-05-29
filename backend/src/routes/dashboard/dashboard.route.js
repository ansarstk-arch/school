import { Router } from "express";
import {
  getDashboardCards,
  getDashboardOverview,
  getRevenueExpenseChart,
  getFinancialSummaryChart,
  getAttendanceChart,
  getStudentGrowthChart,
  getYearlyStudentComparisonChart,
  getMonthlyExpensesChart,
  getRecentAdmissions,
  getUpcomingExams,
  getSystemStatus,
} from "../../controllers/dashboard/dashboard.controller.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// ─── OPTIMIZED SEPARATE APIS ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Get dashboard cards data ONLY (fast, lightweight)
router.get("/cards", getDashboardCards);

// Get revenue vs expense chart data ONLY
router.get("/charts/revenue-expense", getRevenueExpenseChart);
router.get("/charts/financial-summary", getFinancialSummaryChart);

// Get attendance pie chart data ONLY
router.get("/charts/attendance", getAttendanceChart);

// Get student growth line chart data ONLY
router.get("/charts/student-growth", getStudentGrowthChart);
router.get("/charts/student-comparison", getYearlyStudentComparisonChart);

// Get monthly expenses bar chart data ONLY
router.get("/charts/monthly-expenses", getMonthlyExpensesChart);

// Get recent admissions list
router.get("/recent-admissions", getRecentAdmissions);

// Get upcoming exams list
router.get("/upcoming-exams", getUpcomingExams);

// Get system status
router.get("/system-status", getSystemStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LEGACY ROUTE (BACKWARD COMPATIBILITY) ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Get dashboard overview stats (same as /cards)
router.get("/overview", getDashboardOverview);

export default router;

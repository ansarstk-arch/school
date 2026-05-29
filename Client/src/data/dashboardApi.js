import apiClient from "../lib/api-client";

// ═══════════════════════════════════════════════════════════════════════════════
// ─── OPTIMIZED SEPARATE API CALLS ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Get dashboard cards data ONLY (fast, lightweight)
export const getDashboardCards = async (type = "all", year = null) => {
  const params = new URLSearchParams({ type });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/cards?${params}`, { 
    method: "GET" 
  });
};

// Get revenue vs expense chart data ONLY
export const getRevenueExpenseChart = async (type = "all", months = 5, year = null) => {
  const params = new URLSearchParams({ type, months: months.toString() });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/charts/revenue-expense?${params}`, { 
    method: "GET" 
  });
};

// Get attendance pie chart data ONLY
export const getAttendanceChart = async (type = "all", year = null, date = null) => {
  const params = new URLSearchParams({ type });
  if (year) params.append("year", String(year));
  if (date) params.append("date", date);
  return apiClient.request(`/dashboard/charts/attendance?${params}`, { 
    method: "GET" 
  });
};

// Get student growth line chart data ONLY
export const getStudentGrowthChart = async (type = "all", months = 6, year = null) => {
  const params = new URLSearchParams({ type, months: months.toString() });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/charts/student-growth?${params}`, { 
    method: "GET" 
  });
};

export const getYearlyStudentComparisonChart = async (type = "all", year = null) => {
  const params = new URLSearchParams({ type });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/charts/student-comparison?${params}`, {
    method: "GET",
  });
};

export const getFinancialSummaryChart = async (type = "all", months = 12, year = null) => {
  const params = new URLSearchParams({ type, months: months.toString() });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/charts/financial-summary?${params}`, {
    method: "GET",
  });
};

// Get monthly expenses bar chart data ONLY
export const getMonthlyExpensesChart = async (type = "all", months = 5, year = null) => {
  const params = new URLSearchParams({ type, months: months.toString() });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/charts/monthly-expenses?${params}`, { 
    method: "GET" 
  });
};

// Get recent admissions list
export const getRecentAdmissions = async (type = "all", limit = 10, year = null) => {
  const params = new URLSearchParams({ type, limit: limit.toString() });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/recent-admissions?${params}`, { 
    method: "GET" 
  });
};

// Get upcoming exams list
export const getUpcomingExams = async (type = "all", limit = 5, year = null) => {
  const params = new URLSearchParams({ type, limit: limit.toString() });
  if (year) params.append("year", String(year));
  return apiClient.request(`/dashboard/upcoming-exams?${params}`, { 
    method: "GET" 
  });
};

// Get system status
export const getSystemStatus = async () => {
  return apiClient.request("/dashboard/system-status", { 
    method: "GET" 
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LEGACY FUNCTION (BACKWARD COMPATIBILITY) ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Get dashboard overview (same as getDashboardCards)
export const getDashboardOverview = getDashboardCards;

export default {
  getDashboardCards,
  getDashboardOverview,
  getRevenueExpenseChart,
  getAttendanceChart,
  getStudentGrowthChart,
  getYearlyStudentComparisonChart,
  getFinancialSummaryChart,
  getMonthlyExpensesChart,
  getRecentAdmissions,
  getUpcomingExams,
  getSystemStatus,
};

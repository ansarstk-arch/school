import apiClient from "../lib/api-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return qs ? `?${qs}` : "";
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
  "x-refresh-token": localStorage.getItem("refreshToken") || "",
});

const downloadBlob = async (url, filename) => {
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("د فایل ډاونلوډ کې تېروتنه");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SALARY API
// ═══════════════════════════════════════════════════════════════════════════════

export const getSalaries = async (params = {}) =>
  apiClient.request(`/salaries${buildQuery(params)}`, { method: "GET" });

export const getSalaryById = async (id) =>
  apiClient.request(`/salaries/${id}`, { method: "GET" });

export const createSalary = async (data) =>
  apiClient.request("/salaries", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const generateBulkSalaries = async (data) =>
  apiClient.request("/salaries/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateSalary = async (id, data) =>
  apiClient.request(`/salaries/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const markSalaryAsPaid = async (id, data) =>
  apiClient.request(`/salaries/${id}/paid`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const undoSalaryPayment = async (id) =>
  apiClient.request(`/salaries/${id}/undo-payment`, { method: "PATCH" });

export const deleteSalary = async (id) =>
  apiClient.request(`/salaries/${id}`, { method: "DELETE" });

export const getSalaryStatistics = async (params = {}) =>
  apiClient.request(`/salaries/statistics${buildQuery(params)}`, { method: "GET" });

export const downloadSalarySlip = async (id) =>
  downloadBlob(`${API_BASE}/salaries/${id}/slip`, `salary-slip-${id}.pdf`);

export const downloadSalaryExcel = async (params = {}) =>
  downloadBlob(
    `${API_BASE}/salaries/export/excel${buildQuery(params)}`,
    `salaries-${new Date().toISOString().slice(0, 10)}.xlsx`
  );

export const downloadSalaryPDF = async (params = {}) =>
  downloadBlob(
    `${API_BASE}/salaries/export/pdf${buildQuery(params)}`,
    `salaries-report-${new Date().toISOString().slice(0, 10)}.pdf`
  );

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCE API
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdvances = async (params = {}) =>
  apiClient.request(`/advances${buildQuery(params)}`, { method: "GET" });

export const getAdvanceStatistics = async (params = {}) =>
  apiClient.request(`/advances/statistics${buildQuery(params)}`, { method: "GET" });

export const getAdvanceById = async (id) =>
  apiClient.request(`/advances/${id}`, { method: "GET" });

export const createAdvance = async (data) =>
  apiClient.request("/advances", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdvance = async (id, data) =>
  apiClient.request(`/advances/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const approveAdvance = async (id) =>
  apiClient.request(`/advances/${id}/approve`, { method: "PATCH" });

export const rejectAdvance = async (id) =>
  apiClient.request(`/advances/${id}/reject`, { method: "PATCH" });

export const deleteAdvance = async (id) =>
  apiClient.request(`/advances/${id}`, { method: "DELETE" });

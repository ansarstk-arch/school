import apiClient from "../lib/api-client";

// ─── FEE PAYMENTS API ──────────────────────────────────────────────────────────

const buildAuthHeaders = (extra = {}) => {
  const headers = { ...extra };
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (refreshToken) headers["x-refresh-token"] = refreshToken;
  return headers;
};

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null
    )
  );

/**
 * Get all fee payments with filters and pagination
 */
export const getFeePayments = async (params = {}) => {
  const queryParams = new URLSearchParams(cleanParams(params));
  const queryString = queryParams.toString();
  return apiClient.request(`/fees${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

/**
 * Get fee payment by ID
 */
export const getFeePaymentById = async (id) => {
  return apiClient.request(`/fees/${id}`, { method: "GET" });
};

/**
 * Get student details for fee form
 */
export const getStudentForFee = async (id) => {
  return apiClient.request(`/fees/student/${id}`, { method: "GET" });
};

/**
 * Get students by filters for fee collection
 */
export const getStudentsByFilters = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.type) queryParams.append("type", params.type);
  if (params.classId) queryParams.append("classId", params.classId);

  return apiClient.request(`/fees/students?${queryParams}`, { method: "GET" });
};

/**
 * Get students by multiple IDs
 */
export const getStudentsByIds = async (ids) => {
  return apiClient.request("/fees/students/by-ids", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
};

/**
 * Create fee payment(s)
 */
export const createFeePayment = async (data) => {
  return apiClient.request("/fees", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Update fee payment
 */
export const updateFeePayment = async (id, data) => {
  return apiClient.request(`/fees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Delete fee payment
 */
export const deleteFeePayment = async (id) => {
  return apiClient.request(`/fees/${id}`, { method: "DELETE" });
};

/**
 * Get fee statistics
 */
export const getFeeStatistics = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/fees/statistics${qs ? `?${qs}` : ""}`, { method: "GET" });
};

/**
 * Export fee payments (Excel or PDF)
 */
export const exportFeePayments = async (params = {}) => {
  const queryParams = new URLSearchParams(cleanParams(params));
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/fees/export?${queryParams}`,
    {
      method: "GET",
      headers: buildAuthHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Export failed");
  }

  return response.blob();
};

/**
 * Generate receipt PDF for single payment
 */
export const generateReceiptPDF = async (id) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/fees/${id}/receipt`,
    {
      method: "GET",
      headers: buildAuthHeaders(),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Receipt generation failed");
  }

  return response.blob();
};

/**
 * Generate multiple receipts PDF
 */
export const generateMultipleReceiptsPDF = async (paymentIds) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/fees/receipts/multiple`,
    {
      method: "POST",
      headers: buildAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({ paymentIds }),
    }
  );

  if (!response.ok) {
    throw new Error("Multiple receipts generation failed");
  }

  return response.blob();
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default {
  getFeePayments,
  getFeePaymentById,
  getStudentForFee,
  getStudentsByFilters,
  getStudentsByIds,
  createFeePayment,
  updateFeePayment,
  deleteFeePayment,
  getFeeStatistics,
  exportFeePayments,
  generateReceiptPDF,
  generateMultipleReceiptsPDF,
  downloadBlob,
};

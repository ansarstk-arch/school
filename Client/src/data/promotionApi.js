import apiClient from "../lib/api-client";

const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );

// ─── PROMOTIONS ────────────────────────────────────────────────────────────────

export const getAllPromotions = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/promotions${qs ? `?${qs}` : ""}`, { method: "GET" });
};

export const getPromotionById = async (id) =>
  apiClient.request(`/promotions/${id}`, { method: "GET" });

export const searchStudentById = async (studentId) =>
  apiClient.request(`/promotions/search/${studentId}`, { method: "GET" });

export const promoteIndividualStudent = async (data) =>
  apiClient.request("/promotions/individual", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const promoteWholeClass = async (data) =>
  apiClient.request("/promotions/class", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const rollbackPromotion = async (id) =>
  apiClient.request(`/promotions/${id}/rollback`, { method: "PUT" });

export const getStudentPromotionHistory = async (studentId) =>
  apiClient.request(`/promotions/student/${studentId}/history`, { method: "GET" });

import apiClient from "../lib/api-client";

// ─── EXAM API ──────────────────────────────────────────────────────────────────

export const getAllExams = async (params = {}) => {
  // Remove empty values so they don't pollute the query string
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/exams${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const getExamById = async (id) =>
  apiClient.request(`/exams/${id}`, { method: "GET" });

export const createExam = async (examData) =>
  apiClient.request("/exams", {
    method: "POST",
    body: JSON.stringify(examData),
  });

export const updateExam = async (id, examData) =>
  apiClient.request(`/exams/${id}`, {
    method: "PUT",
    body: JSON.stringify(examData),
  });

export const deleteExam = async (id) =>
  apiClient.request(`/exams/${id}`, { method: "DELETE" });

// Get classes by institution type for exam assignment
export const getClassesByInstitution = async (institutionType, academicYear) => {
  const params = new URLSearchParams({ institutionType, academicYear });
  return apiClient.request(`/exams/classes-by-institution?${params}`, { method: "GET" });
};

export default {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getClassesByInstitution,
};
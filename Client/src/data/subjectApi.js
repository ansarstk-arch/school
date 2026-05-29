import apiClient from "../lib/api-client";

export const getAllSubjects = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const qs = new URLSearchParams(clean).toString();
  return apiClient.get(`/subjects${qs ? `?${qs}` : ""}`);
};

export const getSubjectById = async (id) => apiClient.get(`/subjects/${id}`);

export const createSubject = async (data) => apiClient.post("/subjects", data);

export const updateSubject = async (id, data) => apiClient.put(`/subjects/${id}`, data);

export const deleteSubject = async (id) => apiClient.delete(`/subjects/${id}`);

export const getClassesByType = async (type, academicYear) =>
  apiClient.get(`/subjects/classes-by-type?type=${encodeURIComponent(type)}&academicYear=${encodeURIComponent(academicYear)}`);

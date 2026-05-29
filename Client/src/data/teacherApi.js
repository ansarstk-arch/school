import apiClient from "../lib/api-client";

// Helper: build FormData from a plain object + optional image file
const toFormData = (data, imageFile) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      // Handle arrays (like teacherType) by converting to JSON string
      if (Array.isArray(val)) {
        fd.append(key, JSON.stringify(val));
      } else {
        fd.append(key, val);
      }
    }
  });
  if (imageFile) fd.append("image", imageFile);
  return fd;
};

// ─── TEACHER API ───────────────────────────────────────────────────────────────

export const getAllTeachers = async (params = {}) => {
  // Remove empty values so they don't pollute the query string
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/teachers${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const getTeacherById = async (id) =>
  apiClient.request(`/teachers/${id}`, { method: "GET" });

export const createTeacher = async (teacherData, imageFile) =>
  apiClient.request("/teachers", {
    method: "POST",
    body: toFormData(teacherData, imageFile),
  });

export const updateTeacher = async (id, teacherData, imageFile) =>
  apiClient.request(`/teachers/${id}`, {
    method: "PUT",
    body: toFormData(teacherData, imageFile),
  });

export const deleteTeacher = async (id) =>
  apiClient.request(`/teachers/${id}`, { method: "DELETE" });

// ─── APPLICANT API ─────────────────────────────────────────────────────────────

export const getAllApplicants = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/teachers/applicants/all${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const createApplicant = async (applicantData) =>
  apiClient.request("/teachers/applicants", {
    method: "POST",
    body: JSON.stringify(applicantData),
  });

export const updateApplicant = async (id, applicantData) =>
  apiClient.request(`/teachers/applicants/${id}`, {
    method: "PUT",
    body: JSON.stringify(applicantData),
  });

export const deleteApplicant = async (id) =>
  apiClient.request(`/teachers/applicants/${id}`, { method: "DELETE" });

export const convertApplicantToTeacher = async (id, additionalData = {}) =>
  apiClient.request(`/teachers/applicants/${id}/convert`, {
    method: "POST",
    body: JSON.stringify(additionalData),
  });

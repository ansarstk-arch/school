import apiClient from "../lib/api-client";

// Helper: build FormData from a plain object + optional image file
const toFormData = (data, imageFile) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "") return;
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
      fd.append(key, JSON.stringify(val));
    } else {
      fd.append(key, val);
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

export const toggleTeacherStatus = async (id, status) =>
  apiClient.request(`/teachers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const getClassesByTeacherTypes = async (types, academicYear) => {
  const params = new URLSearchParams({
    types: JSON.stringify(types),
    academicYear: String(academicYear),
  });
  return apiClient.request(`/teachers/classes-by-types?${params}`, { method: "GET" });
};

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

export const resetTeacherPassword = async (id, newPassword) =>
  apiClient.request(`/teachers/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });

// ─── TEACHER PORTAL API ────────────────────────────────────────────────────────

export const getMyTeacherDashboard = async (attendanceDate) => {
  const params = attendanceDate ? `?attendanceDate=${attendanceDate}` : "";
  return apiClient.request(`/teachers/me/dashboard${params}`, { method: "GET" });
};

export const getMyClassAttendance = async (classId, attendanceDate) => {
  const params = new URLSearchParams();
  if (attendanceDate) params.set("attendanceDate", attendanceDate);
  const qs = params.toString();
  return apiClient.request(`/teachers/me/classes/${classId}/attendance${qs ? `?${qs}` : ""}`, { method: "GET" });
};

export const submitTeacherClassAttendance = async (payload) =>
  apiClient.request("/teachers/me/attendance", {
    method: "POST",
    body: JSON.stringify(payload),
  });

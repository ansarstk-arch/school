import apiClient from "../lib/api-client";

// Helper: build FormData from a plain object + optional image file
const toFormData = (data, imageFile) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (key === 'classes' || key === 'fees') {
      // Only include entries that have actual values
      const filtered = Object.fromEntries(
        Object.entries(val).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      if (Object.keys(filtered).length > 0) fd.append(key, JSON.stringify(filtered));
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      fd.append(key, JSON.stringify(val));
    } else if (Array.isArray(val)) {
      fd.append(key, JSON.stringify(val));
    } else {
      fd.append(key, val);
    }
  });
  if (imageFile) fd.append("image", imageFile);
  return fd;
};

// ─── STUDENT API ───────────────────────────────────────────────────────────────

export const getAllStudents = async (params = {}) => {
  // Remove empty values so they don't pollute the query string
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/students${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const getStudentById = async (id) =>
  apiClient.request(`/students/${id}`, { method: "GET" });

export const createStudent = async (studentData, imageFile) =>
  apiClient.request("/students", {
    method: "POST",
    body: toFormData(studentData, imageFile),
  });

export const updateStudent = async (id, studentData, imageFile) =>
  apiClient.request(`/students/${id}`, {
    method: "PUT",
    body: toFormData(studentData, imageFile),
  });

export const deleteStudent = async (id) =>
  apiClient.request(`/students/${id}`, { method: "DELETE" });

export const toggleStudentStatus = async (id, status) =>
  apiClient.request(`/students/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const getParentNumbers = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/students/parent-numbers${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const toggleParentCallStatus = async (payload) =>
  apiClient.request("/students/parent-numbers/call-status", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getClassesByType = async ({ type, academicYear }) => {
  const params = new URLSearchParams({ type, academicYear: String(academicYear) });
  return apiClient.request(`/students/classes-by-type?${params}`, { method: "GET" });
};

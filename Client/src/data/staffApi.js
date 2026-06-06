import apiClient from "../lib/api-client";

// Helper: build FormData from a plain object + optional image file
const toFormData = (data, imageFile) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "") return;
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
      fd.append(key, JSON.stringify(val));
    } else {
      fd.append(key, String(val));
    }
  });
  if (imageFile) fd.append("image", imageFile);
  return fd;
};

// ─── STAFF API ─────────────────────────────────────────────────────────────────

export const getAllStaff = async (params = {}) => {
  // Remove empty values so they don't pollute the query string
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/staff${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const getStaffById = async (id) =>
  apiClient.request(`/staff/${id}`, { method: "GET" });

export const createStaff = async (staffData, imageFile) =>
  apiClient.request("/staff", {
    method: "POST",
    body: toFormData(staffData, imageFile),
  });

export const updateStaff = async (id, staffData, imageFile) =>
  apiClient.request(`/staff/${id}`, {
    method: "PUT",
    body: toFormData(staffData, imageFile),
  });

export const deleteStaff = async (id) =>
  apiClient.request(`/staff/${id}`, { method: "DELETE" });

export const resetStaffPassword = async (id, newPassword) =>
  apiClient.request(`/staff/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });

export const toggleStaffStatus = async (id, status) =>
  apiClient.request(`/staff/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

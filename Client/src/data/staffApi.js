import apiClient from "../lib/api-client";

// Helper: build FormData from a plain object + optional image file
const toFormData = (data, imageFile) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      // Handle arrays (like staffType) by converting to JSON string
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

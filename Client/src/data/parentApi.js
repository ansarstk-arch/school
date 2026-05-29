import apiClient from "../lib/api-client";

// ─── PARENT API ────────────────────────────────────────────────────────────────

export const getAllParents = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/parents${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const getParentById = async (id) =>
  apiClient.request(`/parents/${id}`, { method: "GET" });

export const createParent = async (parentData) =>
  apiClient.request("/parents", {
    method: "POST",
    body: JSON.stringify(parentData),
  });

export const updateParent = async (id, parentData) =>
  apiClient.request(`/parents/${id}`, {
    method: "PUT",
    body: JSON.stringify(parentData),
  });

export const deleteParent = async (id) =>
  apiClient.request(`/parents/${id}`, { method: "DELETE" });

export const changeParentPassword = async (id, newPassword, confirmPassword) =>
  apiClient.request(`/parents/${id}/change-password`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword, confirmPassword }),
  });

export const getClassesByTypes = async (types, academicYear) => {
  const queryString = new URLSearchParams({
    types: JSON.stringify(types),
    academicYear,
  }).toString();
  return apiClient.request(`/parents/classes-by-types?${queryString}`, { method: "GET" });
};

export const getStudentsByTypesAndClasses = async (types, classIds, academicYear) => {
  const params = {
    types: JSON.stringify(types),
    academicYear,
  };
  if (classIds && Object.keys(classIds).length > 0) {
    params.classIds = JSON.stringify(classIds);
  }
  const queryString = new URLSearchParams(params).toString();
  return apiClient.request(`/parents/students-by-types?${queryString}`, { method: "GET" });
};

import apiClient from "../lib/api-client";

export const getAllClasses = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const qs = new URLSearchParams(clean).toString();
  return apiClient.get(`/classes${qs ? `?${qs}` : ""}`);
};

export const createClass = async (data) => apiClient.post("/classes", data);

export const updateClass = async (id, data) => apiClient.put(`/classes/${id}`, data);

export const deleteClass = async (id) => apiClient.delete(`/classes/${id}`);

export const getTeachersByType = async (type) =>
  apiClient.get(`/classes/teachers-by-type?type=${encodeURIComponent(type)}`);

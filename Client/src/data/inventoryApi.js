import apiClient from "../lib/api-client";

const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  return new URLSearchParams(clean).toString();
};

export const getInventoryStats = async (params = {}) =>
  apiClient.request(`/inventory/stats${qs(params) ? `?${qs(params)}` : ""}`, { method: "GET" });

export const getInventoryItems = async (params = {}) =>
  apiClient.request(`/inventory/items${qs(params) ? `?${qs(params)}` : ""}`, { method: "GET" });

export const createInventoryItem = async (payload) =>
  apiClient.request("/inventory/items", { method: "POST", body: JSON.stringify(payload) });

export const updateInventoryItem = async (id, payload) =>
  apiClient.request(`/inventory/items/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteInventoryItem = async (id) =>
  apiClient.request(`/inventory/items/${id}`, { method: "DELETE" });

export const getInventorySales = async (params = {}) =>
  apiClient.request(`/inventory/sales${qs(params) ? `?${qs(params)}` : ""}`, { method: "GET" });

export const createInventorySale = async (payload) =>
  apiClient.request("/inventory/sales", { method: "POST", body: JSON.stringify(payload) });

export const updateInventorySale = async (id, payload) =>
  apiClient.request(`/inventory/sales/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteInventorySale = async (id) =>
  apiClient.request(`/inventory/sales/${id}`, { method: "DELETE" });

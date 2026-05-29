import apiClient from "../lib/api-client";

const safeEntries = (obj) => (obj && typeof obj === 'object') ? Object.entries(obj) : [];

const cleanParams = (params = {}) => {
  const entries = safeEntries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null);
  try {
    return Object.fromEntries(entries);
  } catch (err) {
    return {};
  }
};

const buildQuery = (params = {}) => {
  const clean = cleanParams(params);
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : "";
};

export const getExpenseCategories = async (params = {}) =>
  apiClient.get(`/expense-categories${buildQuery(params)}`);

export const createExpenseCategory = async (data) =>
  apiClient.post("/expense-categories", data);

export const updateExpenseCategory = async (id, data) =>
  apiClient.put(`/expense-categories/${id}`, data);

export const deleteExpenseCategory = async (id) =>
  apiClient.delete(`/expense-categories/${id}`);

export const getExpenses = async (params = {}) =>
  apiClient.get(`/expenses${buildQuery(params)}`);

export const getExpenseStatistics = async (params = {}) =>
  apiClient.get(`/expenses/statistics${buildQuery(params)}`);

export const createExpense = async (data) => {
  if (data instanceof FormData) {
    return apiClient.postForm("/expenses", data);
  }
  return apiClient.post("/expenses", data);
};

export const updateExpense = async (id, data) => {
  if (data instanceof FormData) {
    return apiClient.putForm(`/expenses/${id}`, data);
  }
  return apiClient.put(`/expenses/${id}`, data);
};

export const deleteExpense = async (id) =>
  apiClient.delete(`/expenses/${id}`);

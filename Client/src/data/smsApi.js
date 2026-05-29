import apiClient from "../lib/api-client";

// ─── SMS SETTINGS API ──────────────────────────────────────────────────────────
export const getSmsSettings = async () =>
  apiClient.request("/sms/settings", { method: "GET" });

export const upsertSmsSettings = async (settingsData) =>
  apiClient.request("/sms/settings", {
    method: "POST",
    body: JSON.stringify(settingsData),
  });

export const testSmsConnection = async (testData) =>
  apiClient.request("/sms/settings/test", {
    method: "POST",
    body: JSON.stringify(testData),
  });

export const deleteSmsSettings = async () =>
  apiClient.request("/sms/settings", { method: "DELETE" });

// ─── SMS TEMPLATES API ─────────────────────────────────────────────────────────
export const getAllSmsTemplates = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/sms/templates${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const getSmsTemplateById = async (id) =>
  apiClient.request(`/sms/templates/${id}`, { method: "GET" });

export const createSmsTemplate = async (templateData) =>
  apiClient.request("/sms/templates", {
    method: "POST",
    body: JSON.stringify(templateData),
  });

export const updateSmsTemplate = async (id, templateData) =>
  apiClient.request(`/sms/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(templateData),
  });

export const deleteSmsTemplate = async (id) =>
  apiClient.request(`/sms/templates/${id}`, { method: "DELETE" });

export const getDefaultTemplates = async () =>
  apiClient.request("/sms/templates/default", { method: "GET" });

export const seedDefaultTemplates = async () =>
  apiClient.request("/sms/templates/seed", { method: "POST" });

// ─── SMS RECIPIENTS API ────────────────────────────────────────────────────────
export const getAbsentRecipients = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  return apiClient.request(`/sms/recipients/absent?${queryString}`, { method: "GET" });
};

export const getFeeRecipients = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  return apiClient.request(`/sms/recipients/fee?${queryString}`, { method: "GET" });
};

export const getExamRecipients = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  return apiClient.request(`/sms/recipients/exam?${queryString}`, { method: "GET" });
};

// ─── SMS SENDING API ───────────────────────────────────────────────────────────
export const sendSmsToParents = async (smsData) =>
  apiClient.request("/sms/send", {
    method: "POST",
    body: JSON.stringify(smsData),
  });

// ─── SMS LOGS API ──────────────────────────────────────────────────────────────
export const getSmsLogs = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/sms/logs${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

export const retrySms = async (id) =>
  apiClient.request(`/sms/logs/${id}/retry`, { method: "POST" });

export const getSmsStatistics = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/sms/statistics${queryString ? `?${queryString}` : ""}`, { method: "GET" });
};

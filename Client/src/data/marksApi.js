import apiClient from "../lib/api-client";

const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );

// ─── EXAM SUBJECT CONFIG ───────────────────────────────────────────────────────

export const getAllExamSubjectConfigs = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/exam-subject-config${qs ? `?${qs}` : ""}`, { method: "GET" });
};

export const getExamSubjectConfigById = async (id) =>
  apiClient.request(`/exam-subject-config/${id}`, { method: "GET" });

export const getSubjectsForExamClass = async (examId, classId, institutionType) => {
  const qs = new URLSearchParams(
    cleanParams({ examId, classId, institutionType })
  ).toString();
  return apiClient.request(`/exam-subject-config/subjects-for-class?${qs}`, { method: "GET" });
};

export const createExamSubjectConfig = async (data) =>
  apiClient.request("/exam-subject-config", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const bulkUpsertExamSubjectConfig = async (data) =>
  apiClient.request("/exam-subject-config/bulk-upsert", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateExamSubjectConfig = async (id, data) =>
  apiClient.request(`/exam-subject-config/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteExamSubjectConfig = async (id) =>
  apiClient.request(`/exam-subject-config/${id}`, { method: "DELETE" });

// ─── MARKS ─────────────────────────────────────────────────────────────────────

export const getExamsByYear = async (academicYear, institutionType = null) => {
  const params = { academicYear };
  if (institutionType) params.institutionType = institutionType;
  const qs = new URLSearchParams(params).toString();
  return apiClient.request(`/exams?${qs}`, { method: "GET" });
};

export const getAllMarks = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/marks${qs ? `?${qs}` : ""}`, { method: "GET" });
};

export const getMarksEntrySheet = async (params) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/marks/entry-sheet?${qs}`, { method: "GET" });
};

export const getMarkById = async (id) =>
  apiClient.request(`/marks/${id}`, { method: "GET" });

export const createMark = async (data) =>
  apiClient.request("/marks", { method: "POST", body: JSON.stringify(data) });

export const bulkSaveMarks = async (data) =>
  apiClient.request("/marks/bulk", { method: "POST", body: JSON.stringify(data) });

export const updateMark = async (id, data) =>
  apiClient.request(`/marks/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteMark = async (id) =>
  apiClient.request(`/marks/${id}`, { method: "DELETE" });

export const downloadMarksExcel = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  const token = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");
  const res = await fetch(`${base}/marks/export/excel?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-refresh-token": refresh || "",
    },
  });
  if (!res.ok) throw new Error("د Excel صادرولو کې ستونزه");
  return res.blob();
};

export const downloadMarksPDF = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  const token = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");
  const res = await fetch(`${base}/marks/export/pdf?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-refresh-token": refresh || "",
    },
  });
  if (!res.ok) throw new Error("د PDF صادرولو کې ستونزه");
  return res.blob();
};

// ─── RESULT PREP ─────────────────────────────────────────────────────────────────

export const runResultCalculation = async (data) =>
  apiClient.request("/result-prep/calculate", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getResultPrepRecords = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/result-prep${qs ? `?${qs}` : ""}`, { method: "GET" });
};

export const getResultPrepSummary = async (params) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return apiClient.request(`/result-prep/summary?${qs}`, { method: "GET" });
};

// ─── ITLA NAMA (اطلاع نامه) ────────────────────────────────────────────────────

async function downloadWithAuth(urlPath, qs, errorMessage) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  const token = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");
  const res = await fetch(`${base}${urlPath}?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-refresh-token": refresh || "",
    },
  });
  if (!res.ok) throw new Error(errorMessage);
  return res.blob();
}

export const downloadItlaNamaExcel = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return downloadWithAuth(
    "/result-prep/itla-nama/excel",
    qs,
    "د اطلاع نامې Excel صادرولو کې ستونزه"
  );
};

export const downloadItlaNamaPDF = async (params = {}) => {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return downloadWithAuth(
    "/result-prep/itla-nama/pdf",
    qs,
    "د اطلاع نامې PDF صادرولو کې ستونزه"
  );
};

import apiClient from "../lib/api-client";

// ─── ATTENDANCE API ────────────────────────────────────────────────────────────
const OFFLINE_QR_QUEUE_KEY = "offlineAttendanceQrQueueV1";

const buildOfflineScanKey = (qrCode, attendanceDate) =>
  `${String(qrCode).trim().toLowerCase()}::${attendanceDate || ""}`;

const readOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QR_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeOfflineQueue = (queue) => {
  localStorage.setItem(OFFLINE_QR_QUEUE_KEY, JSON.stringify(queue));
};

export const getServerToday = async () =>
  apiClient.request("/attendance/today", { method: "GET" });

export const getAllAttendance = async (params = {}) => {
  // Remove empty values so they don't pollute the query string
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/attendance${queryString ? `?${queryString}` : ""}`, { 
    method: "GET" 
  });
};

export const bulkCreateAttendance = async (bulkData) =>
  apiClient.request("/attendance/bulk", {
    method: "POST",
    body: JSON.stringify(bulkData),
  });

export const qrAttendance = async (qrData) =>
  apiClient.request("/attendance/qr", {
    method: "POST",
    body: JSON.stringify(qrData),
  });

export const enqueueOfflineQrScan = ({ qrCode, attendanceDate, source = "camera" }) => {
  const cleanCode = String(qrCode || "").trim();
  if (!cleanCode) return false;

  const queue = readOfflineQueue();
  const scanKey = buildOfflineScanKey(cleanCode, attendanceDate);
  const exists = queue.some((item) => item.scanKey === scanKey);
  if (exists) return false;

  queue.push({
    scanKey,
    qrCode: cleanCode,
    attendanceDate,
    source,
    timestamp: new Date().toISOString(),
  });
  writeOfflineQueue(queue);
  return true;
};

export const getOfflineQrQueueCount = () => readOfflineQueue().length;

export const flushOfflineQrQueue = async () => {
  const queue = readOfflineQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 };
  }

  const failed = [];
  let processed = 0;

  for (const item of queue) {
    try {
      const response = await qrAttendance({
        qrCode: item.qrCode,
        attendanceDate: item.attendanceDate,
      });

      const action = response?.data?.action;
      if (
        action === "already_marked_today" ||
        action === "duplicate_scan" ||
        action === "duplicate_record" ||
        response?.success
      ) {
        processed += 1;
        continue;
      }

      failed.push(item);
    } catch {
      failed.push(item);
    }
  }

  writeOfflineQueue(failed);
  return { processed, failed: failed.length, remaining: failed.length };
};

export const getAttendanceStats = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/attendance/stats/summary${queryString ? `?${queryString}` : ""}`, { 
    method: "GET" 
  });
};

export const getPeopleForAttendance = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/attendance/people/list${queryString ? `?${queryString}` : ""}`, { 
    method: "GET" 
  });
};

export const downloadAttendanceReport = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const queryString = new URLSearchParams(clean).toString();
  return apiClient.request(`/attendance/download/report${queryString ? `?${queryString}` : ""}`, { 
    method: "GET" 
  });
};

export default {
  getServerToday,
  getAllAttendance,
  bulkCreateAttendance,
  qrAttendance,
  enqueueOfflineQrScan,
  getOfflineQrQueueCount,
  flushOfflineQrQueue,
  getAttendanceStats,
  getPeopleForAttendance,
  downloadAttendanceReport,
};
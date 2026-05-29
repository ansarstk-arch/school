import apiClient from "../lib/api-client";

const BASE_URL = "/attendance/settings";

export const getAllAttendanceSettings = async () => {
  return apiClient.get(BASE_URL);
};

export const getAttendanceSettingsByType = async (institutionType) => {
  return apiClient.get(`${BASE_URL}/${institutionType}`);
};

export const updateAttendanceSettings = async (institutionType, data) => {
  return apiClient.patch(`${BASE_URL}/${institutionType}`, data);
};
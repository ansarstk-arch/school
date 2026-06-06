import apiClient from "../lib/api-client";

export const getCertificateExams = async (institutionType, academicYear) => {
  const params = new URLSearchParams({
    institutionType,
    academicYear: String(academicYear),
  });
  return apiClient.get(`/certificates/exams?${params.toString()}`);
};

export const getCertificateClasses = async (examId) => {
  const params = new URLSearchParams({ examId: String(examId) });
  return apiClient.get(`/certificates/classes?${params.toString()}`);
};

export const getCertificateBatchData = async (examId, classIds, eligibleOnly = true) => {
  const params = new URLSearchParams({
    examId: String(examId),
    classIds: classIds.join(","),
    eligibleOnly: eligibleOnly ? "true" : "false",
  });
  return apiClient.get(`/certificates/batch-data?${params.toString()}`);
};

import apiClient from "@/lib/api-client";

/**
 * Get report card for a single student
 * @param {number} studentId - Student ID
 * @param {string} examType - "FirstTerm" or "Annual"
 * @param {string} academicYear - Academic year (e.g., "1403")
 */
export async function getStudentReportCard(studentId, examType, academicYear) {
  const params = new URLSearchParams({
    studentId: String(studentId),
    examType,
    academicYear,
  });
  const response = await apiClient.get(`/report-cards/student?${params.toString()}`);
  return response;
}

/**
 * Get report cards for entire class
 * @param {number} classId - Class ID
 * @param {string} examType - "FirstTerm" or "Annual"
 * @param {string} academicYear - Academic year (e.g., "1403")
 */
export async function getClassReportCards(classId, examType, academicYear) {
  const params = new URLSearchParams({
    classId: String(classId),
    examType,
    academicYear,
  });
  const response = await apiClient.get(`/report-cards/class?${params.toString()}`);
  return response;
}

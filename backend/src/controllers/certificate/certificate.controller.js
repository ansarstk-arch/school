import { eq, and } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { exams } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { currentShamsiYear } from "../../lib/afghan-date.js";
import { ensureDefaultSchoolExamsForYear } from "../../utils/schoolExamHelpers.util.js";
import {
  buildClassCertificates,
  getClassesForExamRecord,
  parseAssignedClasses,
} from "../../services/certificate.service.js";

// ─── GET EXAMS FOR CERTIFICATES ───────────────────────────────────────────────
export const getCertificateExams = asyncHandler(async (req, res) => {
  const { institutionType, academicYear } = req.query;

  if (!institutionType) throw new ApiError(400, "د ادارې ډول اړین دی");
  const year = academicYear || String(currentShamsiYear());

  if (institutionType === "School") {
    await ensureDefaultSchoolExamsForYear(year);
  }

  const examsList = await db
    .select()
    .from(exams)
    .where(
      and(
        eq(exams.institutionType, institutionType),
        eq(exams.academicYear, year)
      )
    )
    .orderBy(exams.examTitle);

  res.respond(200, "امتحانات ترلاسه شول", {
    exams: examsList.map((e) => ({
      ...e,
      assignedClasses: parseAssignedClasses(e.assignedClasses),
    })),
  });
});

// ─── GET CLASSES FOR EXAM ─────────────────────────────────────────────────────
export const getCertificateClasses = asyncHandler(async (req, res) => {
  const { examId } = req.query;
  if (!examId) throw new ApiError(400, "د امتحان پېژندنه اړینه ده");

  const [exam] = await db.select().from(exams).where(eq(exams.id, Number(examId)));
  if (!exam) throw new ApiError(404, "امتحان ونه موندل شو");

  const classesList = await getClassesForExamRecord(exam);

  res.respond(200, "ټولګي ترلاسه شول", {
    exam: { id: exam.id, examTitle: exam.examTitle, academicYear: exam.academicYear },
    classes: classesList,
  });
});

// ─── GET ELIGIBLE CERTIFICATE DATA (multi-class) ────────────────────────────────
export const getCertificateBatchData = asyncHandler(async (req, res) => {
  const { examId, classIds, eligibleOnly = "true" } = req.query;

  if (!examId) throw new ApiError(400, "د امتحان پېژندنه اړینه ده");
  if (!classIds) throw new ApiError(400, "لږ تر لږه یو ټولګی وټاکئ");

  const [exam] = await db.select().from(exams).where(eq(exams.id, Number(examId)));
  if (!exam) throw new ApiError(404, "امتحان ونه موندل شو");

  const ids = String(classIds)
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => id > 0);

  if (ids.length === 0) throw new ApiError(400, "د ټولګي پېژندنه سمه نه ده");

  const onlyEligible = eligibleOnly !== "false";
  const batches = [];
  let totalCertificates = 0;
  let totalSkipped = 0;

  for (const classId of ids) {
    const result = await buildClassCertificates(exam, classId, { eligibleOnly: onlyEligible });
    totalCertificates += result.certificates.length;
    totalSkipped += result.skipped;
    batches.push({
      class: result.class,
      examType: result.examType,
      certificates: result.certificates,
      skipped: result.skipped,
      totalStudents: result.totalStudents,
    });
  }

  res.respond(200, "د سندونو معلومات ترلاسه شول", {
    exam: {
      id: exam.id,
      examTitle: exam.examTitle,
      institutionType: exam.institutionType,
      academicYear: exam.academicYear,
    },
    batches,
    totalCertificates,
    totalSkipped,
  });
});

export default {
  getCertificateExams,
  getCertificateClasses,
  getCertificateBatchData,
};

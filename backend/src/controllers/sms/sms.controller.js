import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { columnInShamsiYear } from "../../utils/yearFilter.util.js";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  students, parents, parentStudents, attendance, smsLogs,
  smsTemplates, classes, examResultPrep, feePayments,
  parentSmsPreferences, studentEnrollments, smsEndpoints,
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { sendSmsMessage } from "../../services/sms/sms-sender.service.js";
import { replaceTemplateVariables } from "../../services/sms/sms-template.service.js";
import { institutionLabel } from "../../utils/institutionLabels.util.js";
import { SCHOOL_INFO } from "../../config/school.config.js";
import { v4 as uuidv4 } from "uuid";

const buildSmsTemplateData = (recipient, additionalData = {}) => {
  const instPs = institutionLabel(recipient.institutionType);
  return {
    parentName: recipient.parentName,
    studentName: recipient.studentName,
    className: recipient.className,
    date: additionalData?.date || new Date().toLocaleDateString("fa-AF"),
    institutionType: instPs,
    school: instPs,
    schoolName: SCHOOL_INFO.name,
    month: recipient.month,
    amount: recipient.amount,
    examName: additionalData?.examName,
    position:
      recipient.rank === 1
        ? "لومړی"
        : recipient.rank === 2
          ? "دویم"
          : recipient.rank === 3
            ? "دریم"
            : recipient.rank,
    totalMarks: recipient.totalPossible,
    obtainedMarks: recipient.totalObtained,
    percentage: recipient.percentage,
    ...additionalData,
  };
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const getSentStudentIds = async (messageType, attendanceDate) => {
  const logs = await db
    .select({ studentId: smsLogs.studentId })
    .from(smsLogs)
    .where(
      and(
        eq(smsLogs.messageType, messageType),
        eq(smsLogs.status, "Sent"),
        eq(smsLogs.attendanceDate, attendanceDate)
      )
    );
  return new Set(logs.map((l) => l.studentId).filter(Boolean));
};

const getEndpoint = async (endpointId) => {
  const [endpoint] = await db.select().from(smsEndpoints).where(eq(smsEndpoints.id, Number(endpointId)));
  if (!endpoint) throw new ApiError(404, "فون ونه موندل شو");
  if (!endpoint.apiUrl) throw new ApiError(400, `د ${endpoint.name} لپاره API پته نه ده تنظیم شوې`);
  if (!endpoint.isActive) throw new ApiError(400, `د ${endpoint.name} فون غیر فعال دی`);
  return endpoint;
};

const buildParentRecipients = async (studentRecords, institutionType, messageType = null) => {
  const studentIds = studentRecords.map((r) => r.studentId);
  if (studentIds.length === 0) return [];

  const enrollments = await db
    .select()
    .from(studentEnrollments)
    .where(
      and(
        inArray(studentEnrollments.studentId, studentIds),
        eq(studentEnrollments.enrollmentType, institutionType)
      )
    );

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const filtered = studentRecords.filter((r) => enrolledIds.has(r.studentId));
  if (filtered.length === 0) return [];

  const enrolledStudentIds = filtered.map((r) => r.studentId);

  const parentLinks = await db
    .select({
      studentId: parentStudents.studentId,
      parentId: parentStudents.parentId,
      parentName: parents.name,
      parentPhone: parents.phone,
    })
    .from(parentStudents)
    .leftJoin(parents, eq(parentStudents.parentId, parents.id))
    .where(inArray(parentStudents.studentId, enrolledStudentIds));

  const parentIds = [...new Set(parentLinks.map((p) => p.parentId))];
  const preferences = parentIds.length
    ? await db.select().from(parentSmsPreferences).where(inArray(parentSmsPreferences.parentId, parentIds))
    : [];

  const prefsMap = Object.fromEntries(preferences.map((p) => [p.parentId, p]));

  const recipients = [];
  filtered.forEach((record) => {
    parentLinks
      .filter((p) => p.studentId === record.studentId)
      .forEach((parent) => {
        if (!parent.parentPhone) return;
        const prefs = prefsMap[parent.parentId];
        if (prefs?.isBlocked) return;
        if (messageType === "Absent" && prefs && !prefs.receiveAbsentSms) return;
        if (messageType === "Present" && prefs && !prefs.receiveAbsentSms) return;
        if (messageType === "Fee" && prefs && !prefs.receiveFeeSms) return;

        recipients.push({
          parentId: parent.parentId,
          parentName: parent.parentName,
          parentPhone: parent.parentPhone,
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          institutionType,
          alreadySent: record.alreadySent || false,
          smsSentAt: record.smsSentAt || null,
        });
      });
  });

  return recipients;
};

/** Map UI recipient keys (phone:…, student:…) to a numeric id for sms_logs.recipient_id */
const resolveLogRecipientId = (recipient) => {
  const { parentId, studentId } = recipient;
  if (typeof parentId === "number" && parentId > 0) return parentId;
  if (typeof parentId === "string") {
    const numeric = Number(parentId);
    if (Number.isInteger(numeric) && numeric > 0) return numeric;
    const studentMatch = parentId.match(/^student:(\d+)$/);
    if (studentMatch) return Number(studentMatch[1]);
  }
  if (typeof studentId === "number" && studentId > 0) return studentId;
  return 0;
};

const insertSmsLogs = async (values) => {
  try {
    const rows = await db.insert(smsLogs).values(values).returning({ id: smsLogs.id });
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("[SMS] Failed to save SMS log:", err.message);
    return null;
  }
};

const normalizePhone = (input) => {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("937") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0093") && digits.length === 13) return `+${digits.slice(2)}`;
  if (digits.startsWith("07") && digits.length === 10) return `+93${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `+93${digits}`;
  return String(input).trim() || null;
};

const groupRecipientsByPhone = (recipients) => {
  const groups = new Map();

  for (const r of recipients) {
    const phone = normalizePhone(r.parentPhone);
    if (!phone) continue;

    if (!groups.has(phone)) {
      groups.set(phone, {
        ...r,
        parentPhone: phone,
        parentId: typeof r.parentId === "number" ? r.parentId : `phone:${phone}`,
        studentIds: [r.studentId],
        studentNames: [r.studentName],
      });
    } else {
      const g = groups.get(phone);
      if (typeof g.parentId !== "number" && typeof r.parentId === "number") {
        g.parentId = r.parentId;
      }
      if (!g.studentIds.includes(r.studentId)) {
        g.studentIds.push(r.studentId);
        g.studentNames.push(r.studentName);
      }
      g.alreadySent = g.alreadySent && r.alreadySent;
    }
  }

  return Array.from(groups.values()).map((g) => ({
    ...g,
    studentName: g.studentNames.join("، "),
    studentId: g.studentIds[0],
    allStudentIds: g.studentIds,
  }));
};

// ─── GET ABSENT STUDENTS' PARENTS ──────────────────────────────────────────────
export const getAbsentRecipients = asyncHandler(async (req, res) => {
  const { institutionType, date, classId } = req.query;
  if (!institutionType) throw new ApiError(400, "د موسسې ډول اړین دی");

  const attendanceDate = date || new Date().toISOString().split("T")[0];

  const conditions = [
    eq(attendance.attendanceType, "Student"),
    eq(attendance.attendanceDate, attendanceDate),
    eq(attendance.status, "Absent"),
  ];
  if (classId) conditions.push(eq(attendance.classId, Number(classId)));

  const absentRecords = await db
    .select({
      studentId: attendance.personId,
      studentName: students.fullName,
      className: classes.name,
      classSection: classes.section,
    })
    .from(attendance)
    .leftJoin(students, eq(attendance.personId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(and(...conditions));

  if (absentRecords.length === 0) {
    return res.respond(200, "نن ورځ هیڅ زده کوونکی غیر حاضر نه دی", { recipients: [], date: attendanceDate });
  }

  const sentIds = await getSentStudentIds("Absent", attendanceDate);

  const records = absentRecords.map((r) => ({
    studentId: r.studentId,
    studentName: r.studentName,
    className: `${r.className || ""}${r.classSection ? " - " + r.classSection : ""}`,
    alreadySent: sentIds.has(r.studentId),
  }));

  let recipients = await buildParentRecipients(records, institutionType, "Absent");

  // Include students with direct phone when no parent portal link exists
  const coveredIds = new Set(recipients.map((r) => r.studentId));
  for (const record of records) {
    if (coveredIds.has(record.studentId)) continue;
    const [student] = await db.select({
      phone: students.phone,
      fullName: students.fullName,
    }).from(students).where(eq(students.id, record.studentId));
    const phone = normalizePhone(student?.phone);
    if (!phone) continue;
    recipients.push({
      parentId: `student:${record.studentId}`,
      parentName: student.fullName,
      parentPhone: phone,
      studentId: record.studentId,
      studentName: record.studentName,
      className: record.className,
      institutionType,
      alreadySent: record.alreadySent || false,
    });
  }

  recipients = groupRecipientsByPhone(recipients);

  // Mark already-sent and exclude groups where all students already received SMS
  const available = recipients.filter((r) => {
    const ids = r.allStudentIds || [r.studentId];
    return !ids.every((id) => sentIds.has(id));
  });
  const alreadySentCount = recipients.filter((r) => {
    const ids = r.allStudentIds || [r.studentId];
    return ids.every((id) => sentIds.has(id));
  }).length;

  res.respond(200, "د غیر حاضرو زده کوونکو مور او پلار ترلاسه شول", {
    recipients: available,
    alreadySentCount,
    count: available.length,
    date: attendanceDate,
  });
});

// ─── GET PRESENT STUDENTS (were absent, now present) ───────────────────────────
export const getPresentRecipients = asyncHandler(async (req, res) => {
  const { institutionType, date, classId } = req.query;
  if (!institutionType) throw new ApiError(400, "د موسسې ډول اړین دی");

  const attendanceDate = date || new Date().toISOString().split("T")[0];

  const conditions = [
    eq(attendance.attendanceType, "Student"),
    eq(attendance.attendanceDate, attendanceDate),
    eq(attendance.status, "Present"),
  ];
  if (classId) conditions.push(eq(attendance.classId, Number(classId)));

  const presentRecords = await db
    .select({
      studentId: attendance.personId,
      studentName: students.fullName,
      className: classes.name,
      classSection: classes.section,
      originalStatus: attendance.originalStatus,
    })
    .from(attendance)
    .leftJoin(students, eq(attendance.personId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(and(...conditions));

  if (presentRecords.length === 0) {
    return res.respond(200, "نن حاضر شوي زده کوونکي ونه موندل شول", { recipients: [], date: attendanceDate });
  }

  const absentSentIds = await getSentStudentIds("Absent", attendanceDate);
  const presentSentIds = await getSentStudentIds("Present", attendanceDate);

  // Student must have been absent (status changed) OR received absent SMS today
  const eligible = presentRecords.filter(
    (r) => (r.originalStatus === "Absent" || absentSentIds.has(r.studentId)) && !presentSentIds.has(r.studentId)
  );

  if (eligible.length === 0) {
    return res.respond(200, "د حاضرۍ پیغام لپاره هیڅ زده کوونکی ونه موندل شو", { recipients: [], date: attendanceDate });
  }

  const records = eligible.map((r) => ({
    studentId: r.studentId,
    studentName: r.studentName,
    className: `${r.className || ""}${r.classSection ? " - " + r.classSection : ""}`,
  }));

  const recipients = await buildParentRecipients(records, institutionType, "Present");

  res.respond(200, "د حاضر شویو زده کوونکو مور او پلار ترلاسه شول", {
    recipients,
    count: recipients.length,
    date: attendanceDate,
  });
});

// ─── GET FEE DEFAULTERS' PARENTS ─────────────────────────────────────────────────
export const getFeeRecipients = asyncHandler(async (req, res) => {
  const { institutionType, month, academicYear } = req.query;
  if (!institutionType) throw new ApiError(400, "د موسسې ډول اړین دی");

  const conditions = [
    eq(feePayments.enrollmentType, institutionType),
    inArray(feePayments.status, ["Unpaid", "Partial"]),
  ];
  if (month) conditions.push(eq(feePayments.month, month));
  if (academicYear) conditions.push(eq(feePayments.academicYear, academicYear));

  const unpaidFees = await db
    .select({
      studentId: feePayments.studentId,
      studentName: students.fullName,
      month: feePayments.month,
      amount: feePayments.amount,
      paid: feePayments.paid,
      remaining: sql`${feePayments.amount} - ${feePayments.paid}`,
      className: classes.name,
      classSection: classes.section,
    })
    .from(feePayments)
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(and(...conditions));

  if (unpaidFees.length === 0) {
    return res.respond(200, "ټول فیسونه ورکړل شوي دي", { recipients: [] });
  }

  const records = unpaidFees.map((f) => ({
    studentId: f.studentId,
    studentName: f.studentName,
    className: `${f.className || ""}${f.classSection ? " - " + f.classSection : ""}`,
    month: f.month,
    amount: f.remaining,
  }));

  const recipients = await buildParentRecipients(records, institutionType, "Fee");
  const withFee = recipients.map((r) => {
    const fee = unpaidFees.find((f) => f.studentId === r.studentId);
    return { ...r, month: fee?.month, amount: fee?.remaining };
  });

  res.respond(200, "د فیس پاتې والي مور او پلار ترلاسه شول", { recipients: withFee, count: withFee.length });
});

// ─── GET EXAM RESULT RECIPIENTS ────────────────────────────────────────────────
export const getExamRecipients = asyncHandler(async (req, res) => {
  const { institutionType, examId, resultType, classId } = req.query;

  if (!institutionType) throw new ApiError(400, "د موسسې ډول اړین دی");
  if (!examId) throw new ApiError(400, "د ازموینې ID اړین دی");
  if (!resultType) throw new ApiError(400, "د نتیجې ډول اړین دی (pass/fail/top)");

  const conditions = [
    eq(examResultPrep.examId, Number(examId)),
    eq(examResultPrep.institutionType, institutionType),
    eq(examResultPrep.calculationStatus, "finalized"),
  ];
  if (classId) conditions.push(eq(examResultPrep.classId, Number(classId)));

  if (resultType === "pass") conditions.push(eq(examResultPrep.overallStatus, "Pass"));
  else if (resultType === "fail") conditions.push(eq(examResultPrep.overallStatus, "Fail"));
  else if (resultType === "top") {
    conditions.push(eq(examResultPrep.overallStatus, "Pass"));
    conditions.push(sql`${examResultPrep.rank} <= 3`);
  }

  const results = await db
    .select({
      studentId: examResultPrep.studentId,
      studentName: students.fullName,
      className: classes.name,
      classSection: classes.section,
      totalObtained: examResultPrep.totalObtained,
      totalPossible: examResultPrep.totalPossible,
      percentage: examResultPrep.percentage,
      rank: examResultPrep.rank,
      grade: examResultPrep.grade,
      overallStatus: examResultPrep.overallStatus,
    })
    .from(examResultPrep)
    .leftJoin(students, eq(examResultPrep.studentId, students.id))
    .leftJoin(classes, eq(examResultPrep.classId, classes.id))
    .where(and(...conditions))
    .orderBy(examResultPrep.rank);

  if (results.length === 0) {
    return res.respond(200, "د دې معیار لپاره هیڅ نتیجه ونه موندل شوه", { recipients: [] });
  }

  const records = results.map((r) => ({
    studentId: r.studentId,
    studentName: r.studentName,
    className: `${r.className || ""}${r.classSection ? " - " + r.classSection : ""}`,
    totalObtained: r.totalObtained,
    totalPossible: r.totalPossible,
    percentage: r.percentage,
    rank: r.rank,
  }));

  const recipients = await buildParentRecipients(records, institutionType);
  const enriched = recipients.map((r) => {
    const result = results.find((res) => res.studentId === r.studentId);
    return { ...r, ...result };
  });

  res.respond(200, "د ازموینې نتیجې مور او پلار ترلاسه شول", { recipients: enriched, count: enriched.length, resultType });
});

// ─── SEND SINGLE SMS (one recipient at a time) ─────────────────────────────────
export const sendSmsSingle = asyncHandler(async (req, res) => {
  const { endpointId, messageType, recipient, templateId, customMessage, additionalData, batchId, attendanceDate } = req.body;

  if (!endpointId) throw new ApiError(400, "فون وټاکئ");
  if (!messageType) throw new ApiError(400, "د پیغام ډول اړین دی");
  if (!recipient) throw new ApiError(400, "ترلاسه کوونکی اړین دی");

  const endpoint = await getEndpoint(endpointId);
  const attDate = attendanceDate || additionalData?.date || new Date().toISOString().split("T")[0];

  const studentIdsToLog = recipient.allStudentIds || (recipient.studentId ? [recipient.studentId] : []);

  // Once-per-day check for Absent and Present
  if (["Absent", "Present"].includes(messageType) && studentIdsToLog.length > 0) {
    const sentIds = await getSentStudentIds(messageType, attDate);
    const allSent = studentIdsToLog.every((id) => sentIds.has(id));
    if (allSent) {
      throw new ApiError(400, `د ${recipient.studentName} لپاره نن دمخه ${messageType === "Absent" ? "غیر حاضري" : "حاضري"} پیغام لیږل شوی دی`);
    }
  }

  let template;
  if (templateId) {
    [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, templateId));
    if (!template) throw new ApiError(404, "کالبد ونه موندل شو");
  } else if (customMessage) {
    template = { messagePs: customMessage };
  } else {
    throw new ApiError(400, "کالبد یا دودیز پیغام اړین دی");
  }

  const message = replaceTemplateVariables(
    template.messagePs,
    buildSmsTemplateData(recipient, additionalData)
  );

  const smsResult = await sendSmsMessage(endpoint, recipient.parentPhone, message);
  const userId = req.user?.id;
  const finalBatchId = batchId || uuidv4();

  const baseLogEntry = {
    batchId: finalBatchId,
    recipientType: "Parent",
    recipientId: resolveLogRecipientId(recipient),
    recipientName: recipient.parentName,
    recipientPhone: recipient.parentPhone,
    institutionType: recipient.institutionType,
    messageType,
    messageContent: message,
    status: smsResult.success ? "Sent" : "Failed",
    sentAt: smsResult.success ? new Date().toISOString() : null,
    failureReason: smsResult.error || null,
    apiResponse: JSON.stringify(smsResult.response),
    endpointId: endpoint.id,
    attendanceDate: ["Absent", "Present"].includes(messageType) ? attDate : null,
    sentBy: userId,
  };

  const logValues = studentIdsToLog.length > 0
    ? studentIdsToLog.map((studentId, idx) => ({
        ...baseLogEntry,
        studentId,
        studentName: recipient.studentNames?.[idx] || recipient.studentName,
      }))
    : [{ ...baseLogEntry, studentId: recipient.studentId ?? null, studentName: recipient.studentName ?? null }];

  const logId = await insertSmsLogs(logValues);

  res.respond(200, smsResult.success ? "پیغام لیږل شو" : "پیغام ناکام شو", {
    success: smsResult.success,
    error: smsResult.error,
    isNetworkError: smsResult.isNetworkError,
    logId,
    batchId: finalBatchId,
    name: recipient.parentName,
    phone: recipient.parentPhone,
  });
});

// ─── SEND SMS TO PARENTS (batch with fail-fast) ──────────────────────────────────
export const sendSmsToParents = asyncHandler(async (req, res) => {
  const { endpointId, messageType, recipients, templateId, customMessage, additionalData, attendanceDate } = req.body;

  if (!endpointId) throw new ApiError(400, "فون وټاکئ");
  if (!messageType) throw new ApiError(400, "د پیغام ډول اړین دی");
  if (!recipients?.length) throw new ApiError(400, "لږ تر لږه یو ترلاسه کوونکی اړین دی");

  const endpoint = await getEndpoint(endpointId);
  const attDate = attendanceDate || additionalData?.date || new Date().toISOString().split("T")[0];
  const batchId = uuidv4();
  const userId = req.user?.id;

  let template;
  if (templateId) {
    [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, templateId));
    if (!template) throw new ApiError(404, "کالبد ونه موندل شو");
  } else if (customMessage) {
    template = { messagePs: customMessage };
  } else {
    throw new ApiError(400, "کالبد یا دودیز پیغام اړین دی");
  }

  const results = { total: recipients.length, sent: 0, failed: 0, details: [], stoppedEarly: false, stopReason: null };

  for (const recipient of recipients) {
    if (["Absent", "Present"].includes(messageType) && recipient.studentId) {
      const sentIds = await getSentStudentIds(messageType, attDate);
      if (sentIds.has(recipient.studentId)) {
        results.failed++;
        results.details.push({ phone: recipient.parentPhone, status: "failed", error: "دمخه لیږل شوی", name: recipient.parentName });
        continue;
      }
    }

    const message = replaceTemplateVariables(
      template.messagePs,
      buildSmsTemplateData(recipient, additionalData)
    );

    const smsResult = await sendSmsMessage(endpoint, recipient.parentPhone, message);

    await insertSmsLogs({
      batchId,
      recipientType: "Parent",
      recipientId: resolveLogRecipientId(recipient),
      recipientName: recipient.parentName,
      recipientPhone: recipient.parentPhone,
      studentId: recipient.studentId ?? null,
      studentName: recipient.studentName ?? null,
      institutionType: recipient.institutionType,
      messageType,
      messageContent: message,
      status: smsResult.success ? "Sent" : "Failed",
      sentAt: smsResult.success ? new Date().toISOString() : null,
      failureReason: smsResult.error || null,
      apiResponse: JSON.stringify(smsResult.response),
      endpointId: endpoint.id,
      attendanceDate: ["Absent", "Present"].includes(messageType) ? attDate : null,
      sentBy: userId,
    });

    if (smsResult.success) {
      results.sent++;
      results.details.push({ phone: recipient.parentPhone, status: "success", name: recipient.parentName });
    } else {
      results.failed++;
      results.details.push({ phone: recipient.parentPhone, status: "failed", error: smsResult.error, name: recipient.parentName });

      if (smsResult.isNetworkError) {
        results.stoppedEarly = true;
        results.stopReason = smsResult.error;
        break;
      }
    }
  }

  res.respond(200, "د SMS لیږل بشپړ شو", {
    batchId,
    results,
    message: results.stoppedEarly
      ? `د اتصال ستونزې له امله ودرول شو. لیږل شوي: ${results.sent}، ناکام: ${results.failed}`
      : `ټول: ${results.total}، لیږل شوي: ${results.sent}، ناکام: ${results.failed}`,
  });
});

// ─── GET SMS LOGS ────────────────────────────────────────────────────────────────
export const getSmsLogs = asyncHandler(async (req, res) => {
  const { batchId, status, messageType, startDate, endDate, year, studentId, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (batchId) conditions.push(eq(smsLogs.batchId, batchId));
  if (status) conditions.push(eq(smsLogs.status, status));
  if (messageType) conditions.push(eq(smsLogs.messageType, messageType));
  if (startDate) conditions.push(sql`${smsLogs.createdAt} >= ${startDate}`);
  if (endDate) conditions.push(sql`${smsLogs.createdAt} <= ${endDate}`);
  if (year) {
    conditions.push(columnInShamsiYear(smsLogs.createdAt, year));
  }
  if (studentId) conditions.push(eq(smsLogs.studentId, Number(studentId)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db.select().from(smsLogs).where(whereClause).orderBy(desc(smsLogs.createdAt)).limit(Number(limit)).offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(smsLogs).where(whereClause),
  ]);

  res.respond(200, "د SMS ریکارډونه ترلاسه شول", {
    logs,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

// ─── RETRY FAILED SMS ──────────────────────────────────────────────────────────
export const retrySms = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { endpointId } = req.body;

  const [log] = await db.select().from(smsLogs).where(eq(smsLogs.id, id));
  if (!log) throw new ApiError(404, "د SMS ریکارډ ونه موندل شو");
  if (log.status === "Sent") throw new ApiError(400, "دا پیغام دمخه لیږل شوی دی");

  const epId = endpointId || log.endpointId;
  if (!epId) throw new ApiError(400, "فون وټاکئ");

  const endpoint = await getEndpoint(epId);
  const smsResult = await sendSmsMessage(endpoint, log.recipientPhone, log.messageContent);

  await db.update(smsLogs).set({
    status: smsResult.success ? "Sent" : "Failed",
    sentAt: smsResult.success ? new Date().toISOString() : log.sentAt,
    failureReason: smsResult.error || null,
    retryCount: log.retryCount + 1,
    apiResponse: JSON.stringify(smsResult.response),
    endpointId: endpoint.id,
    updatedAt: new Date().toISOString(),
  }).where(eq(smsLogs.id, id));

  res.respond(200, smsResult.success ? "پیغام بریالیتوب سره لیږل شو" : "پیغام بیا ناکام شو", {
    success: smsResult.success,
    error: smsResult.error,
    isNetworkError: smsResult.isNetworkError,
  });
});

// ─── GET SMS STATISTICS ────────────────────────────────────────────────────────
export const getSmsStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, institutionType, status, messageType, year, studentId } = req.query;
  const conditions = [];

  if (startDate) conditions.push(sql`${smsLogs.createdAt} >= ${startDate}`);
  if (endDate) conditions.push(sql`${smsLogs.createdAt} <= ${endDate}`);
  if (institutionType) conditions.push(eq(smsLogs.institutionType, institutionType));
  if (status) conditions.push(eq(smsLogs.status, status));
  if (messageType) conditions.push(eq(smsLogs.messageType, messageType));
  if (year) conditions.push(columnInShamsiYear(smsLogs.createdAt, year));
  if (studentId) conditions.push(eq(smsLogs.studentId, Number(studentId)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      total: sql`count(*)`.mapWith(Number),
      sent: sql`sum(case when ${smsLogs.status} = 'Sent' then 1 else 0 end)`.mapWith(Number),
      failed: sql`sum(case when ${smsLogs.status} = 'Failed' then 1 else 0 end)`.mapWith(Number),
      pending: sql`sum(case when ${smsLogs.status} = 'Pending' then 1 else 0 end)`.mapWith(Number),
    })
    .from(smsLogs)
    .where(whereClause);

  const byType = await db
    .select({ messageType: smsLogs.messageType, count: sql`count(*)`.mapWith(Number) })
    .from(smsLogs)
    .where(whereClause)
    .groupBy(smsLogs.messageType);

  res.respond(200, "د SMS احصائیې ترلاسه شوې", {
    stats: {
      total: stats.total || 0,
      sent: stats.sent || 0,
      failed: stats.failed || 0,
      pending: stats.pending || 0,
      successRate: stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(2) : 0,
    },
    byType,
  });
});

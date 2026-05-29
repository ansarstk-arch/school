import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { 
  students, parents, parentStudents, attendance, smsLogs, 
  smsSettings, smsTemplates, classes, staff, teachers,
  examResultPrep, feePayments, parentSmsPreferences, studentEnrollments
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { sendSmsMessage } from "../../services/sms/sms-sender.service.js";
import { replaceTemplateVariables } from "../../services/sms/sms-template.service.js";
import { v4 as uuidv4 } from "uuid";

// ─── GET ABSENT STUDENTS' PARENTS ──────────────────────────────────────────────
export const getAbsentRecipients = asyncHandler(async (req, res) => {
  const { institutionType, date, classId } = req.query;

  if (!institutionType) throw new ApiError(400, "د موسسې ډول اړین دی");
  
  const attendanceDate = date || new Date().toISOString().split('T')[0];

  // Build conditions
  const conditions = [
    eq(attendance.attendanceType, "Student"),
    eq(attendance.attendanceDate, attendanceDate),
    eq(attendance.status, "Absent"),
  ];

  if (classId) conditions.push(eq(attendance.classId, Number(classId)));

  // Get absent students
  const absentRecords = await db
    .select({
      studentId: attendance.personId,
      studentName: students.fullName,
      className: classes.name,
      classSection: classes.section,
      classType: classes.type,
    })
    .from(attendance)
    .leftJoin(students, eq(attendance.personId, students.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(and(...conditions));

  // Filter by institution type through enrollments
  const studentIds = absentRecords.map(r => r.studentId);
  if (studentIds.length === 0) {
    return res.respond(200, "نن ورځ هیڅ زده کوونکی غیر حاضر نه دی", { recipients: [] });
  }

  const enrollments = await db
    .select()
    .from(studentEnrollments)
    .where(
      and(
        inArray(studentEnrollments.studentId, studentIds),
        eq(studentEnrollments.enrollmentType, institutionType)
      )
    );

  const enrolledStudentIds = enrollments.map(e => e.studentId);
  const filteredAbsent = absentRecords.filter(r => enrolledStudentIds.includes(r.studentId));

  if (filteredAbsent.length === 0) {
    return res.respond(200, "د دې موسسې لپاره هیڅ زده کوونکی غیر حاضر نه دی", { recipients: [] });
  }

  // Get parents for these students
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

  // Get parent preferences
  const parentIds = [...new Set(parentLinks.map(p => p.parentId))];
  const preferences = await db
    .select()
    .from(parentSmsPreferences)
    .where(inArray(parentSmsPreferences.parentId, parentIds));

  const prefsMap = {};
  preferences.forEach(p => {
    prefsMap[p.parentId] = p;
  });

  // Build recipients list
  const recipients = [];
  filteredAbsent.forEach(absent => {
    const parentInfo = parentLinks.filter(p => p.studentId === absent.studentId);
    
    parentInfo.forEach(parent => {
      if (!parent.parentPhone) return;

      const prefs = prefsMap[parent.parentId];
      // Check if parent opted out or is blocked
      if (prefs && (prefs.isBlocked || !prefs.receiveAbsentSms)) return;

      recipients.push({
        parentId: parent.parentId,
        parentName: parent.parentName,
        parentPhone: parent.parentPhone,
        studentId: absent.studentId,
        studentName: absent.studentName,
        className: `${absent.className}${absent.classSection ? ' - ' + absent.classSection : ''}`,
        institutionType: absent.classType,
      });
    });
  });

  res.respond(200, "د غیر حاضرو زده کوونکو مور او پلار ترلاسه شول", { 
    recipients,
    count: recipients.length,
    date: attendanceDate,
  });
});

// ─── GET FEE DEFAULTERS' PARENTS ───────────────────────────────────────────────
export const getFeeRecipients = asyncHandler(async (req, res) => {
  const { institutionType, month, academicYear } = req.query;

  if (!institutionType) throw new ApiError(400, "د موسسې ډول اړین دی");

  // Get unpaid or partial fee payments
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

  const studentIds = unpaidFees.map(f => f.studentId);

  // Get parents
  const parentLinks = await db
    .select({
      studentId: parentStudents.studentId,
      parentId: parentStudents.parentId,
      parentName: parents.name,
      parentPhone: parents.phone,
    })
    .from(parentStudents)
    .leftJoin(parents, eq(parentStudents.parentId, parents.id))
    .where(inArray(parentStudents.studentId, studentIds));

  // Get preferences
  const parentIds = [...new Set(parentLinks.map(p => p.parentId))];
  const preferences = await db
    .select()
    .from(parentSmsPreferences)
    .where(inArray(parentSmsPreferences.parentId, parentIds));

  const prefsMap = {};
  preferences.forEach(p => {
    prefsMap[p.parentId] = p;
  });

  // Build recipients
  const recipients = [];
  unpaidFees.forEach(fee => {
    const parentInfo = parentLinks.filter(p => p.studentId === fee.studentId);
    
    parentInfo.forEach(parent => {
      if (!parent.parentPhone) return;

      const prefs = prefsMap[parent.parentId];
      if (prefs && (prefs.isBlocked || !prefs.receiveFeeSms)) return;

      recipients.push({
        parentId: parent.parentId,
        parentName: parent.parentName,
        parentPhone: parent.parentPhone,
        studentId: fee.studentId,
        studentName: fee.studentName,
        className: `${fee.className}${fee.classSection ? ' - ' + fee.classSection : ''}`,
        month: fee.month,
        amount: fee.remaining,
        institutionType,
      });
    });
  });

  res.respond(200, "د فیس پاتې والي مور او پلار ترلاسه شول", { 
    recipients,
    count: recipients.length,
  });
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

  // Filter by result type
  if (resultType === "pass") {
    conditions.push(eq(examResultPrep.overallStatus, "Pass"));
  } else if (resultType === "fail") {
    conditions.push(eq(examResultPrep.overallStatus, "Fail"));
  } else if (resultType === "top") {
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

  const studentIds = results.map(r => r.studentId);

  // Get parents
  const parentLinks = await db
    .select({
      studentId: parentStudents.studentId,
      parentId: parentStudents.parentId,
      parentName: parents.name,
      parentPhone: parents.phone,
    })
    .from(parentStudents)
    .leftJoin(parents, eq(parentStudents.parentId, parents.id))
    .where(inArray(parentStudents.studentId, studentIds));

  // Get preferences
  const parentIds = [...new Set(parentLinks.map(p => p.parentId))];
  const preferences = await db
    .select()
    .from(parentSmsPreferences)
    .where(inArray(parentSmsPreferences.parentId, parentIds));

  const prefsMap = {};
  preferences.forEach(p => {
    prefsMap[p.parentId] = p;
  });

  // Build recipients
  const recipients = [];
  results.forEach(result => {
    const parentInfo = parentLinks.filter(p => p.studentId === result.studentId);
    
    parentInfo.forEach(parent => {
      if (!parent.parentPhone) return;

      const prefs = prefsMap[parent.parentId];
      if (prefs && (prefs.isBlocked || !prefs.receiveExamSms)) return;

      recipients.push({
        parentId: parent.parentId,
        parentName: parent.parentName,
        parentPhone: parent.parentPhone,
        studentId: result.studentId,
        studentName: result.studentName,
        className: `${result.className}${result.classSection ? ' - ' + result.classSection : ''}`,
        totalObtained: result.totalObtained,
        totalPossible: result.totalPossible,
        percentage: result.percentage,
        rank: result.rank,
        grade: result.grade,
        overallStatus: result.overallStatus,
        institutionType,
      });
    });
  });

  res.respond(200, "د ازموینې نتیجې مور او پلار ترلاسه شول", { 
    recipients,
    count: recipients.length,
    resultType,
  });
});

// ─── SEND SMS TO PARENTS ───────────────────────────────────────────────────────
export const sendSmsToParents = asyncHandler(async (req, res) => {
  const { messageType, recipients, templateId, customMessage, additionalData } = req.body;

  if (!messageType) throw new ApiError(400, "د پیغام ډول اړین دی");
  if (!recipients || recipients.length === 0) throw new ApiError(400, "لږ تر لږه یو ترلاسه کوونکی اړین دی");

  // Check SMS settings
  const [settings] = await db.select().from(smsSettings).limit(1);
  if (!settings) throw new ApiError(404, "د SMS تنظیمات نه دي موندل شوي. لومړی تنظیمات جوړ کړئ");
  if (!settings.isActive) throw new ApiError(400, "د SMS تنظیمات غیر فعال دي");

  // Get template
  let template;
  if (templateId) {
    [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, templateId));
    if (!template) throw new ApiError(404, "کالبد ونه موندل شو");
  } else if (customMessage) {
    template = { messagePs: customMessage };
  } else {
    throw new ApiError(400, "کالبد یا دودیز پیغام اړین دی");
  }

  const batchId = uuidv4();
  const userId = req.user?.id;
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    details: [],
  };

  // Process each recipient
  for (const recipient of recipients) {
    try {
      // Replace template variables
      const message = replaceTemplateVariables(template.messagePs, {
        parentName: recipient.parentName,
        studentName: recipient.studentName,
        className: recipient.className,
        date: new Date().toLocaleDateString('fa-AF'),
        institutionType: recipient.institutionType,
        month: recipient.month,
        amount: recipient.amount,
        examName: additionalData?.examName,
        position: recipient.rank === 1 ? "لومړی" : recipient.rank === 2 ? "دویم" : recipient.rank === 3 ? "دریم" : recipient.rank,
        totalMarks: recipient.totalPossible,
        obtainedMarks: recipient.totalObtained,
        percentage: recipient.percentage,
        ...additionalData,
      });

      // Send SMS
      const smsResult = await sendSmsMessage(settings, recipient.parentPhone, message);

      // Log SMS
      await db.insert(smsLogs).values({
        batchId,
        recipientType: "Parent",
        recipientId: recipient.parentId,
        recipientName: recipient.parentName,
        recipientPhone: recipient.parentPhone,
        studentId: recipient.studentId,
        studentName: recipient.studentName,
        institutionType: recipient.institutionType,
        messageType,
        messageContent: message,
        status: smsResult.success ? "Sent" : "Failed",
        sentAt: smsResult.success ? new Date().toISOString() : null,
        failureReason: smsResult.error || null,
        apiResponse: JSON.stringify(smsResult.response),
        sentBy: userId,
      });

      if (smsResult.success) {
        results.sent++;
        results.details.push({
          phone: recipient.parentPhone,
          status: "success",
          name: recipient.parentName,
        });
      } else {
        results.failed++;
        results.details.push({
          phone: recipient.parentPhone,
          status: "failed",
          error: smsResult.error,
          name: recipient.parentName,
        });
      }
    } catch (error) {
      console.error(`SMS Error for ${recipient.parentPhone}:`, error);
      results.failed++;
      results.details.push({
        phone: recipient.parentPhone,
        status: "failed",
        error: error.message,
        name: recipient.parentName,
      });

      // Log failed SMS
      await db.insert(smsLogs).values({
        batchId,
        recipientType: "Parent",
        recipientId: recipient.parentId,
        recipientName: recipient.parentName,
        recipientPhone: recipient.parentPhone,
        studentId: recipient.studentId,
        studentName: recipient.studentName,
        institutionType: recipient.institutionType,
        messageType,
        messageContent: template.messagePs,
        status: "Failed",
        failureReason: error.message,
        sentBy: userId,
      });
    }
  }

  res.respond(200, "د SMS لیږل بشپړ شو", { 
    batchId,
    results,
    message: `ټول: ${results.total}، لیږل شوي: ${results.sent}، ناکام: ${results.failed}`,
  });
});

// ─── GET SMS LOGS ──────────────────────────────────────────────────────────────
export const getSmsLogs = asyncHandler(async (req, res) => {
  const { batchId, status, messageType, startDate, endDate, page = 1, limit = 50 } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (batchId) conditions.push(eq(smsLogs.batchId, batchId));
  if (status) conditions.push(eq(smsLogs.status, status));
  if (messageType) conditions.push(eq(smsLogs.messageType, messageType));
  if (startDate) conditions.push(sql`${smsLogs.createdAt} >= ${startDate}`);
  if (endDate) conditions.push(sql`${smsLogs.createdAt} <= ${endDate}`);

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

  const [log] = await db.select().from(smsLogs).where(eq(smsLogs.id, id));
  if (!log) throw new ApiError(404, "د SMS ریکارډ ونه موندل شو");

  if (log.status === "Sent") {
    throw new ApiError(400, "دا پیغام دمخه لیږل شوی دی");
  }

  // Get settings
  const [settings] = await db.select().from(smsSettings).limit(1);
  if (!settings || !settings.isActive) {
    throw new ApiError(400, "د SMS تنظیمات فعال نه دي");
  }

  // Retry sending
  const smsResult = await sendSmsMessage(settings, log.recipientPhone, log.messageContent);

  // Update log
  await db.update(smsLogs).set({
    status: smsResult.success ? "Sent" : "Failed",
    sentAt: smsResult.success ? new Date().toISOString() : log.sentAt,
    failureReason: smsResult.error || null,
    retryCount: log.retryCount + 1,
    apiResponse: JSON.stringify(smsResult.response),
    updatedAt: new Date().toISOString(),
  }).where(eq(smsLogs.id, id));

  res.respond(200, smsResult.success ? "پیغام بریالیتوب سره لیږل شو" : "پیغام بیا ناکام شو", {
    success: smsResult.success,
    error: smsResult.error,
  });
});

// ─── GET SMS STATISTICS ────────────────────────────────────────────────────────
export const getSmsStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, institutionType } = req.query;

  const conditions = [];
  if (startDate) conditions.push(sql`${smsLogs.createdAt} >= ${startDate}`);
  if (endDate) conditions.push(sql`${smsLogs.createdAt} <= ${endDate}`);
  if (institutionType) conditions.push(eq(smsLogs.institutionType, institutionType));

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

  // Get by message type
  const byType = await db
    .select({
      messageType: smsLogs.messageType,
      count: sql`count(*)`.mapWith(Number),
    })
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

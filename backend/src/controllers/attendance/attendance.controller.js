import { eq, like, and, desc, sql, inArray, or, isNull } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { attendance, students, staff, teachers, classes, users } from "../../db/schema.js";
import { parseAttendanceQrCode } from "../../utils/attendanceQr.util.js";
import ApiError from "../../utils/ApiError.util.js";
import { getCurrentAfghanDate, getAttendanceDateForScan, isValidAttendanceDate } from "../../utils/dateHandler.util.js";
import { generateExcelReport, generatePDFReport } from "../../utils/attendanceExport.util.js";

// Helper: Get person details based on attendance type
const getPersonDetails = async (attendanceType, personId) => {
  let person = null;
  let personName = "";
  
  switch (attendanceType) {
    case "Student":
      const [student] = await db
        .select({
          id: students.id,
          fullName: students.fullName,
          fatherName: students.fatherName,
          rollNumber: students.rollNumber,
          classId: students.classId,
        })
        .from(students)
        .where(eq(students.id, personId));
      
      if (student) {
        person = student;
        personName = student.fullName;
      }
      break;
      
    case "Staff":
      {
        const [staffMember] = await db
          .select({
            id: staff.id,
            name: staff.name,
            fatherName: staff.fatherName,
            position: staff.position,
            staffType: staff.staffType,
          })
          .from(staff)
          .where(eq(staff.id, personId));

        if (staffMember) {
          person = staffMember;
          personName = staffMember.name;
        }
      }
      break;

    case "Teacher":
      {
        const [teacher] = await db
          .select({
            id: teachers.id,
            name: teachers.name,
            fatherName: teachers.fatherName,
            position: teachers.education,
          })
          .from(teachers)
          .where(eq(teachers.id, personId));

        if (teacher) {
          person = teacher;
          personName = teacher.name;
        }
      }
      break;
  }

  return { person, personName };
};

// ─── GET ALL ATTENDANCE ────────────────────────────────────────────────────────

export const getAllAttendance = asyncHandler(async (req, res) => {
  const {
    attendanceType,
    institutionType,
    classId,
    attendanceDate,
    startDate,
    endDate,
    status,
    attendanceMethod,
    page = 1,
    limit = 50,
    search
  } = req.query;

  let query = db.select({
    id: attendance.id,
    attendanceType: attendance.attendanceType,
    personId: attendance.personId,
    institutionType: attendance.institutionType,
    classId: attendance.classId,
    attendanceDate: attendance.attendanceDate,
    status: attendance.status,
    attendanceMethod: attendance.attendanceMethod,
    scannedAt: attendance.scannedAt,
    notes: attendance.notes,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  }).from(attendance);

  // Build where conditions
  const conditions = [];

  if (attendanceType) {
    conditions.push(eq(attendance.attendanceType, attendanceType));
  }

  if (institutionType) {
    conditions.push(eq(attendance.institutionType, institutionType));
  }

  if (classId) {
    conditions.push(eq(attendance.classId, parseInt(classId)));
  }

  if (attendanceDate) {
    conditions.push(eq(attendance.attendanceDate, attendanceDate));
  }

  if (startDate && endDate) {
    conditions.push(
      and(
        sql`${attendance.attendanceDate} >= ${startDate}`,
        sql`${attendance.attendanceDate} <= ${endDate}`
      )
    );
  }

  if (status) {
    if (status === "undefined") {
      conditions.push(isNull(attendance.status));
    } else {
      conditions.push(eq(attendance.status, status));
    }
  }

  if (attendanceMethod) {
    conditions.push(eq(attendance.attendanceMethod, attendanceMethod));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Add ordering
  query = query.orderBy(desc(attendance.attendanceDate), desc(attendance.createdAt));

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query.limit(parseInt(limit)).offset(offset);

  const attendanceRecords = await query;

  // Get total count for pagination
  let countQuery = db.select({ count: sql`count(*)` }).from(attendance);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }
  const [{ count }] = await countQuery;

  // Enrich with person details
  const enrichedRecords = await Promise.all(
    attendanceRecords.map(async (record) => {
      const { person, personName } = await getPersonDetails(record.attendanceType, record.personId);
      return {
        ...record,
        person,
        personName,
      };
    })
  );

  res.json({
    success: true,
    data: {
      attendance: enrichedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit),
      },
    },
  });
});

// ─── GET PEOPLE FOR ATTENDANCE ─────────────────────────────────────────────────

export const getPeopleForAttendance = asyncHandler(async (req, res) => {
  const { attendanceType, institutionType, classId, attendanceDate } = req.query;

  if (!attendanceType) {
    throw new ApiError(400, "د حاضرۍ ډول اړین دی");
  }

  if (!attendanceDate) {
    throw new ApiError(400, "د حاضرۍ نېټه اړینه ده");
  }

  let people = [];

  if (attendanceType === "Student") {
    if (!institutionType) {
      throw new ApiError(400, "د زده کوونکو لپاره د ادارې ډول اړین دی");
    }

    if (!classId) {
      throw new ApiError(400, "د زده کوونکو لپاره ټولګی اړین دی");
    }

    // Get students from the specified class
    people = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        fatherName: students.fatherName,
        rollNumber: students.rollNumber,
        classId: students.classId,
      })
      .from(students)
      .where(eq(students.classId, parseInt(classId)))
      .orderBy(students.rollNumber, students.fullName);

  } else if (attendanceType === "Staff") {
    const staffRows = await db
      .select({
        id: staff.id,
        name: staff.name,
        fatherName: staff.fatherName,
        position: staff.position,
        staffType: staff.staffType,
      })
      .from(staff)
      .where(eq(staff.status, "active"))
      .orderBy(staff.name);

    const teacherRows = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        fatherName: teachers.fatherName,
        position: teachers.education,
      })
      .from(teachers)
      .orderBy(teachers.name);

    people = [
      ...staffRows.map((row) => ({
        ...row,
        personRole: "Staff",
        rowKey: `Staff-${row.id}`,
      })),
      ...teacherRows.map((row) => ({
        ...row,
        position: row.position || "ښوونکی",
        personRole: "Teacher",
        rowKey: `Teacher-${row.id}`,
      })),
    ];
  }

  const attendanceMap = {};

  if (attendanceType === "Staff") {
    const staffAttendance = await db
      .select({
        personId: attendance.personId,
        status: attendance.status,
        attendanceMethod: attendance.attendanceMethod,
        scannedAt: attendance.scannedAt,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.attendanceType, "Staff"),
          eq(attendance.attendanceDate, attendanceDate)
        )
      );

    const teacherAttendance = await db
      .select({
        personId: attendance.personId,
        status: attendance.status,
        attendanceMethod: attendance.attendanceMethod,
        scannedAt: attendance.scannedAt,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.attendanceType, "Teacher"),
          eq(attendance.attendanceDate, attendanceDate)
        )
      );

    staffAttendance.forEach((att) => {
      attendanceMap[`Staff-${att.personId}`] = {
        status: att.status,
        attendanceMethod: att.attendanceMethod,
        scannedAt: att.scannedAt,
      };
    });

    teacherAttendance.forEach((att) => {
      attendanceMap[`Teacher-${att.personId}`] = {
        status: att.status,
        attendanceMethod: att.attendanceMethod,
        scannedAt: att.scannedAt,
      };
    });
  } else {
    let attendanceConditions = [
      eq(attendance.attendanceType, attendanceType),
      eq(attendance.attendanceDate, attendanceDate),
    ];

    if (classId) {
      attendanceConditions.push(eq(attendance.classId, parseInt(classId)));
    }

    const existingAttendance = await db
      .select({
        personId: attendance.personId,
        status: attendance.status,
        attendanceMethod: attendance.attendanceMethod,
        scannedAt: attendance.scannedAt,
      })
      .from(attendance)
      .where(and(...attendanceConditions));

    existingAttendance.forEach((att) => {
      attendanceMap[att.personId] = {
        status: att.status,
        attendanceMethod: att.attendanceMethod,
        scannedAt: att.scannedAt,
      };
    });
  }

  const peopleWithAttendance = people.map((person) => {
    const mapKey = person.rowKey ?? person.id;
    return {
      ...person,
      attendance: attendanceMap[mapKey] || {
        status: null,
        attendanceMethod: "Manual",
        scannedAt: null,
      },
    };
  });

  res.json({
    success: true,
    data: {
      people: peopleWithAttendance,
      attendanceType,
      institutionType,
      classId: classId ? parseInt(classId) : null,
      attendanceDate,
    },
  });
});

// ─── BULK CREATE/UPDATE ATTENDANCE ─────────────────────────────────────────────

export const bulkCreateAttendance = asyncHandler(async (req, res) => {
  const { attendanceType, institutionType, classId, attendanceDate, attendanceData } = req.body;
  const userId = req.user?.id;

  if (!attendanceType || !attendanceDate || !Array.isArray(attendanceData)) {
    throw new ApiError(400, "اړین معلومات ورکول شوي نه دي");
  }

  if (attendanceType === "Student" && (!institutionType || !classId)) {
    throw new ApiError(400, "د زده کوونکو لپاره د ادارې ډول او ټولګی اړین دی");
  }

  const results = {
    created: 0,
    updated: 0,
    errors: [],
  };

  // Process each attendance record
  for (const item of attendanceData) {
    try {
      const { personId, status, notes, attendanceType: itemType } = item;
      const recordType = itemType || attendanceType;

      if (!personId) {
        results.errors.push({ personId, error: "د کس ID اړین دی" });
        continue;
      }

      const { person } = await getPersonDetails(recordType, personId);
      if (!person) {
        results.errors.push({ personId, error: "کس ونه موندل شو" });
        continue;
      }

      // Check if attendance already exists
      const [existingAttendance] = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.attendanceType, recordType),
            eq(attendance.personId, personId),
            eq(attendance.attendanceDate, attendanceDate)
          )
        );

      if (existingAttendance) {
        await db
          .update(attendance)
          .set({
            status: status || null,
            notes: notes || null,
            updatedBy: userId,
            originalStatus: existingAttendance.status,
            changeReason: "Bulk update",
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(attendance.id, existingAttendance.id));

        results.updated++;
      } else {
        await db.insert(attendance).values({
          attendanceType: recordType,
          personId,
          institutionType: recordType === "Student" ? institutionType : null,
          classId: recordType === "Student" ? classId : null,
          attendanceDate,
          status: status || null,
          attendanceMethod: "Manual",
          notes: notes || null,
          takenBy: userId,
        });

        results.created++;
      }
    } catch (error) {
      results.errors.push({ personId: item.personId, error: error.message });
    }
  }

  res.json({
    success: true,
    message: `حاضرۍ بریالۍ ثبت شوه - ${results.created} نوي، ${results.updated} تازه شوي`,
    data: results,
  });
});

// ─── QR ATTENDANCE ─────────────────────────────────────────────────────────────

export const qrAttendance = asyncHandler(async (req, res) => {
  const { qrCode, attendanceDate } = req.body;
  const userId = req.user?.id;

  if (!qrCode) {
    throw new ApiError(400, "QR کوډ اړین دی");
  }

  const attendanceDateValue = attendanceDate
    ? String(attendanceDate).trim()
    : getAttendanceDateForScan();

  if (attendanceDate && !isValidAttendanceDate(attendanceDateValue)) {
    throw new ApiError(400, "د حاضرۍ نېټه باید اوسني یا تېره ورځ وي");
  }

  let parsed;
  try {
    parsed = parseAttendanceQrCode(qrCode);
  } catch {
    throw new ApiError(400, "د QR کوډ فارمټ سم نه دی");
  }

  const { attendanceType, personId, classId, rawValue } = parsed;

  const { person, personName } = await getPersonDetails(attendanceType, personId);
  if (!person) {
    throw new ApiError(404, "کس ونه موندل شو");
  }

  const now = new Date().toISOString();
  let action = "created";

  const [existingAttendance] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.attendanceType, attendanceType),
        eq(attendance.personId, personId),
        eq(attendance.attendanceDate, attendanceDateValue)
      )
    );

  if (existingAttendance) {
    // Allow updating if status is Absent
    if (existingAttendance.status === "Absent") {
      await db
        .update(attendance)
        .set({
          status: "Present",
          attendanceMethod: "QR",
          scannedAt: now,
          updatedBy: userId,
          originalStatus: existingAttendance.status,
          changeReason: "QR scan after auto-absence",
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(attendance.id, existingAttendance.id));

      action = "updated";

      const [updatedRecord] = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, existingAttendance.id));

      return res.json({
        success: true,
        message: `${personName} - غیر حاضر څخه حاضر ته بدل شو ✓`,
        data: {
          attendance: {
            ...updatedRecord,
            personName,
          },
          action,
          rawValue,
        },
      });
    }

    if (existingAttendance.scannedAt) {
      const lastScanTime = new Date(existingAttendance.scannedAt).getTime();
      const timeDiff = (Date.now() - lastScanTime) / 1000;

      if (timeDiff < 5) {
        return res.json({
          success: true,
          message: `${personName} - دمخه سکین شوی`,
          data: {
            attendance: { ...existingAttendance, personName },
            action: "duplicate_scan",
            timeSinceLastScan: Math.round(timeDiff),
          },
        });
      }
    }

    return res.json({
      success: true,
      message: `${personName} - د نن ورځې حاضري مخکې اخیستل شوې`,
      data: {
        attendance: { ...existingAttendance, personName },
        action: "already_marked_today",
      },
    });
  } else {
    try {
      await db.insert(attendance).values({
        attendanceType,
        personId,
        institutionType:
          attendanceType === "Student"
            ? person.classId
              ? "School"
              : null
            : null,
        classId:
          attendanceType === "Student"
            ? classId || person.classId || null
            : null,
        attendanceDate: attendanceDateValue,
        status: "Present",
        attendanceMethod: "QR",
        scannedAt: now,
        takenBy: userId,
      });
    } catch (error) {
      if (error?.message?.includes("UNIQUE constraint failed")) {
        return res.json({
          success: true,
          message: `${personName} - دمخه حاضر ثبت شوی`,
          data: {
            action: "duplicate_record",
          },
        });
      }
      throw error;
    }
  }

  // Get updated attendance record
  const [updatedAttendance] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.attendanceType, attendanceType),
        eq(attendance.personId, personId),
        eq(attendance.attendanceDate, attendanceDateValue)
      )
    );

  let message = `${personName} - حاضر ثبت شو ✓`;

  res.json({
    success: true,
    message,
    data: {
      attendance: {
        ...updatedAttendance,
        personName,
      },
      action,
      rawValue,
    },
  });
});

// ─── GET ATTENDANCE STATS ──────────────────────────────────────────────────────

export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { attendanceType, institutionType, classId, startDate, endDate } = req.query;

  const conditions = [];

  if (attendanceType) {
    conditions.push(eq(attendance.attendanceType, attendanceType));
  }

  if (institutionType) {
    conditions.push(eq(attendance.institutionType, institutionType));
  }

  if (classId) {
    conditions.push(eq(attendance.classId, parseInt(classId)));
  }

  if (startDate && endDate) {
    conditions.push(
      and(
        sql`${attendance.attendanceDate} >= ${startDate}`,
        sql`${attendance.attendanceDate} <= ${endDate}`
      )
    );
  }

  // Get attendance statistics
  const stats = await db
    .select({
      status: attendance.status,
      count: sql`count(*)`,
    })
    .from(attendance)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(attendance.status);

  const statsMap = {
    Present: 0,
    Absent: 0,
    Leave: 0,
    undefined: 0,
  };

  stats.forEach((stat) => {
    const status = stat.status || "undefined";
    statsMap[status] = parseInt(stat.count);
  });

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const presentPercentage = total > 0 ? Math.round((statsMap.Present / total) * 100) : 0;

  res.json({
    success: true,
    data: {
      stats: statsMap,
      total,
      presentPercentage,
    },
  });
});

// ─── DOWNLOAD ATTENDANCE REPORT ────────────────────────────────────────────────

export const downloadAttendanceReport = asyncHandler(async (req, res) => {
  const {
    attendanceType,
    institutionType,
    classId,
    startDate,
    endDate,
    format, // 'excel' or 'pdf'
  } = req.query;

  if (!attendanceType || !startDate || !endDate) {
    throw new ApiError(400, "د حاضرۍ ډول، پیل نېټه او پای نېټه اړین دی");
  }

  if (attendanceType === "Student" && (!institutionType || !classId)) {
    throw new ApiError(400, "د زده کوونکو لپاره د ادارې ډول او ټولګی اړین دی");
  }

  // Build query conditions
  const conditions = [
    eq(attendance.attendanceType, attendanceType),
    sql`${attendance.attendanceDate} >= ${startDate}`,
    sql`${attendance.attendanceDate} <= ${endDate}`
  ];

  if (institutionType) {
    conditions.push(eq(attendance.institutionType, institutionType));
  }

  if (classId) {
    conditions.push(eq(attendance.classId, parseInt(classId)));
  }

  // Get attendance records
  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(and(...conditions))
    .orderBy(attendance.attendanceDate, attendance.personId);

  // Enrich with person details
  const enrichedRecords = await Promise.all(
    attendanceRecords.map(async (record) => {
      const { person, personName } = await getPersonDetails(record.attendanceType, record.personId);
      return {
        ...record,
        person,
        personName,
      };
    })
  );

  // Get class name if applicable
  let className = "";
  if (classId) {
    const [classInfo] = await db
      .select({ name: classes.name, section: classes.section })
      .from(classes)
      .where(eq(classes.id, parseInt(classId)));
    if (classInfo) {
      className = `${classInfo.name} - ${classInfo.section}`;
    }
  }

  // School info (hardcoded)
  const schoolInfo = {
    name: 'د امیرالمومنین ښوونځی',
    nameDari: 'مکتب امیرالمومنین',
    address: 'جوزجان، افغانستان',
    phone: '0799999999',
    ministry: 'وزارت معارف',
    department: 'ریاست معارف جوزجان',
  };

  const reportData = {
    records: enrichedRecords,
    filters: {
      attendanceType,
      institutionType,
      classId: classId ? parseInt(classId) : null,
      className,
      startDate,
      endDate,
    },
    stats: {
      total: enrichedRecords.length,
      present: enrichedRecords.filter(r => r.status === "Present").length,
      absent: enrichedRecords.filter(r => r.status === "Absent").length,
      leave: enrichedRecords.filter(r => r.status === "Leave").length,
    },
  };

  // Generate file based on format
  if (format === 'excel') {
    const buffer = await generateExcelReport(reportData, reportData.filters, schoolInfo);
    const filename = `attendance_${attendanceType}_${startDate}_${endDate}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } else if (format === 'pdf') {
    const buffer = await generatePDFReport(reportData, reportData.filters, schoolInfo);
    const filename = `attendance_${attendanceType}_${startDate}_${endDate}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } else {
    // Return JSON if no format specified
    res.json({
      success: true,
      data: reportData,
    });
  }
});

export default {
  getAllAttendance,
  getPeopleForAttendance,
  bulkCreateAttendance,
  qrAttendance,
  getAttendanceStats,
  downloadAttendanceReport,
};
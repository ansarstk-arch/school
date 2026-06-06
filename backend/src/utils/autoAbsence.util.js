import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { attendance, attendanceSettings, students, staff, teachers, studentEnrollments } from "../db/schema.js";
import { getCurrentAfghanDate } from "./dateHandler.util.js";
import { currentShamsiYear } from "../lib/afghan-date.js";

// Check if today is an off day for the institution
const isOffDay = (offDays) => {
  const today = new Date().getDay(); // 0=Sunday, 6=Saturday
  return offDays.includes(today);
};

// Mark absent for students who haven't been marked
export const markAbsentStudents = async () => {
  try {
    const today = getCurrentAfghanDate();
    const afghanNow = new Date(Date.now() + (4.5 * 60 * 60 * 1000));
    const currentTime = `${String(afghanNow.getUTCHours()).padStart(2, "0")}:${String(afghanNow.getUTCMinutes()).padStart(2, "0")}`;

    console.log(`[Auto-Absence] Running at ${currentTime} for date ${today}`);

    // Get all attendance settings
    const settings = await db.select().from(attendanceSettings).where(eq(attendanceSettings.isActive, true));

    for (const setting of settings) {
      const offDays = JSON.parse(setting.offDays || "[]");
      
      // Skip if today is an off day
      if (isOffDay(offDays)) {
        console.log(`[Auto-Absence] ${setting.institutionType}: Today is off day, skipping`);
        continue;
      }

      // Skip if cutoff time hasn't passed
      if (currentTime < setting.cutoffTime) {
        console.log(`[Auto-Absence] ${setting.institutionType}: Cutoff time ${setting.cutoffTime} not reached yet`);
        continue;
      }

      console.log(`[Auto-Absence] ${setting.institutionType}: Processing auto-absence`);

      // Get all students enrolled in this institution type
      const enrolledStudents = await db
        .select({
          studentId: studentEnrollments.studentId,
          classId: students.classId,
        })
        .from(studentEnrollments)
        .innerJoin(students, eq(studentEnrollments.studentId, students.id))
        .where(eq(studentEnrollments.enrollmentType, setting.institutionType));

      let markedCount = 0;

      for (const student of enrolledStudents) {
        // Check if attendance already exists
        const [existing] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.attendanceType, "Student"),
              eq(attendance.personId, student.studentId),
              eq(attendance.attendanceDate, today)
            )
          );

        // Only mark absent if no attendance record exists
        if (!existing) {
          await db.insert(attendance).values({
            attendanceType: "Student",
            personId: student.studentId,
            institutionType: setting.institutionType,
            classId: student.classId,
            attendanceDate: today,
            status: "Absent",
            attendanceMethod: "Manual",
            notes: "Auto-marked absent after cutoff time",
          });
          markedCount++;
        }
      }

      console.log(`[Auto-Absence] ${setting.institutionType}: Marked ${markedCount} students as absent`);
    }

    console.log(`[Auto-Absence] Completed successfully`);
  } catch (error) {
    console.error(`[Auto-Absence] Error:`, error);
  }
};

// Mark absent for staff who haven't been marked
export const markAbsentStaff = async () => {
  try {
    const today = getCurrentAfghanDate();
    const afghanNow = new Date(Date.now() + (4.5 * 60 * 60 * 1000));
    const currentTime = `${String(afghanNow.getUTCHours()).padStart(2, "0")}:${String(afghanNow.getUTCMinutes()).padStart(2, "0")}`;

    console.log(`[Auto-Absence Staff] Running at ${currentTime} for date ${today}`);

    // Get School setting (staff follows school schedule)
    const [schoolSetting] = await db
      .select()
      .from(attendanceSettings)
      .where(and(eq(attendanceSettings.institutionType, "School"), eq(attendanceSettings.isActive, true)));

    if (!schoolSetting) {
      console.log(`[Auto-Absence Staff] No active school settings found`);
      return;
    }

    const offDays = JSON.parse(schoolSetting.offDays || "[]");

    if (isOffDay(offDays)) {
      console.log(`[Auto-Absence Staff] Today is off day, skipping`);
      return;
    }

    if (currentTime < schoolSetting.cutoffTime) {
      console.log(`[Auto-Absence Staff] Cutoff time ${schoolSetting.cutoffTime} not reached yet`);
      return;
    }

    const currentYear = String(currentShamsiYear());
    const allStaff = await db
      .select({ id: staff.id })
      .from(staff)
      .where(
        and(
          eq(staff.status, "active"),
          sql`(${staff.academicYear} = ${currentYear} OR ${staff.academicYear} IS NULL OR ${staff.academicYear} = '')`
        )
      );
    const allTeachers = await db.select({ id: teachers.id }).from(teachers);

    let markedCount = 0;

    // Mark absent staff
    for (const member of allStaff) {
      const [existing] = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.attendanceType, "Staff"),
            eq(attendance.personId, member.id),
            eq(attendance.attendanceDate, today)
          )
        );

      if (!existing) {
        await db.insert(attendance).values({
          attendanceType: "Staff",
          personId: member.id,
          attendanceDate: today,
          status: "Absent",
          attendanceMethod: "Manual",
          notes: "Auto-marked absent after cutoff time",
        });
        markedCount++;
      }
    }

    // Mark absent teachers
    for (const teacher of allTeachers) {
      const [existing] = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.attendanceType, "Teacher"),
            eq(attendance.personId, teacher.id),
            eq(attendance.attendanceDate, today)
          )
        );

      if (!existing) {
        await db.insert(attendance).values({
          attendanceType: "Teacher",
          personId: teacher.id,
          attendanceDate: today,
          status: "Absent",
          attendanceMethod: "Manual",
          notes: "Auto-marked absent after cutoff time",
        });
        markedCount++;
      }
    }

    console.log(`[Auto-Absence Staff] Marked ${markedCount} staff/teachers as absent`);
  } catch (error) {
    console.error(`[Auto-Absence Staff] Error:`, error);
  }
};

// Run both auto-absence jobs
export const runAutoAbsence = async () => {
  await markAbsentStudents();
  await markAbsentStaff();
};

export default {
  markAbsentStudents,
  markAbsentStaff,
  runAutoAbsence,
};

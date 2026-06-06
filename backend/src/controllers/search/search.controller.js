import { eq, like, or, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  students, teachers, staff, parents, parentStudents, feePayments,
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";

const normalizePhone = (input) => {
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("937") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0093") && digits.length === 13) return `+${digits.slice(2)}`;
  if (digits.startsWith("07") && digits.length === 10) return `+93${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `+93${digits}`;
  return null;
};

export const fastSearch = asyncHandler(async (req, res) => {
  const raw = String(req.query.q || "").trim();
  if (!raw) throw new ApiError(400, "د لټون متن اړین دی");

  const q = raw.toLowerCase();

  const studentIdMatch = q.match(/^st-(\d+)$/);
  if (studentIdMatch) {
    const id = Number(studentIdMatch[1]);
    const [row] = await db.select({ id: students.id, fullName: students.fullName })
      .from(students).where(eq(students.id, id)).limit(1);
    if (!row) throw new ApiError(404, "زده کوونکی ونه موندل شو");
    return res.respond(200, "پایله وموندل شوه", {
      result: { type: "student", id: row.id, label: row.fullName, route: "/students", openView: true },
    });
  }

  const teacherIdMatch = q.match(/^th-(\d+)$/);
  if (teacherIdMatch) {
    const id = Number(teacherIdMatch[1]);
    const [row] = await db.select({ id: teachers.id, name: teachers.name })
      .from(teachers).where(eq(teachers.id, id)).limit(1);
    if (!row) throw new ApiError(404, "ښوونکی ونه موندل شو");
    return res.respond(200, "پایله وموندل شوه", {
      result: { type: "teacher", id: row.id, label: row.name, route: "/teachers", openView: true },
    });
  }

  const staffIdMatch = q.match(/^sf-(\d+)$/);
  if (staffIdMatch) {
    const id = Number(staffIdMatch[1]);
    const [row] = await db.select({ id: staff.id, name: staff.name })
      .from(staff).where(eq(staff.id, id)).limit(1);
    if (!row) throw new ApiError(404, "کارمند ونه موندل شو");
    return res.respond(200, "پایله وموندل شوه", {
      result: { type: "staff", id: row.id, label: row.name, route: "/staff", openView: true },
    });
  }

  if (/^rcp-/i.test(raw)) {
    const receiptNo = raw.toUpperCase();
    const [payment] = await db.select({
      id: feePayments.id,
      receiptNo: feePayments.receiptNo,
      studentId: feePayments.studentId,
    })
      .from(feePayments)
      .where(eq(feePayments.receiptNo, receiptNo))
      .limit(1);
    if (!payment) throw new ApiError(404, "رسید ونه موندل شو");
    return res.respond(200, "پایله وموندل شوه", {
      result: {
        type: "receipt",
        id: payment.id,
        label: payment.receiptNo,
        route: "/revenue",
        filter: { receiptNo: payment.receiptNo },
        openView: true,
      },
    });
  }

  const phone = normalizePhone(raw);
  if (phone) {
    const [studentByPhone] = await db.select({
      id: students.id,
      fullName: students.fullName,
    })
      .from(students)
      .where(or(eq(students.phone, phone), eq(students.emergencyContact, phone)))
      .limit(1);

    if (studentByPhone) {
      return res.respond(200, "پایله وموندل شوه", {
        result: {
          type: "student",
          id: studentByPhone.id,
          label: studentByPhone.fullName,
          route: "/students",
          openView: true,
        },
      });
    }

    const parentRows = await db.select({
      studentId: parentStudents.studentId,
      studentName: students.fullName,
    })
      .from(parents)
      .innerJoin(parentStudents, eq(parentStudents.parentId, parents.id))
      .innerJoin(students, eq(students.id, parentStudents.studentId))
      .where(eq(parents.phone, phone))
      .limit(1);

    if (parentRows[0]) {
      return res.respond(200, "پایله وموندل شوه", {
        result: {
          type: "student",
          id: parentRows[0].studentId,
          label: parentRows[0].studentName,
          route: "/students",
          openView: true,
        },
      });
    }
  }

  throw new ApiError(404, "هیڅ پایله ونه موندل شوه");
});

export default { fastSearch };

import { body } from "express-validator";

const ATTENDANCE_TYPES = ["Student", "Staff", "Teacher"];
const INSTITUTION_TYPES = ["School", "Center", "Madrasa"];
const STATUS_TYPES = ["Present", "Absent", "Leave"];
const METHOD_TYPES = ["Manual", "QR"];

// Pashto error messages
const ERRORS = {
  attendanceTypeRequired: "د حاضرۍ ډول اړین دی",
  attendanceTypeInvalid: "د حاضرۍ ډول باید زده کوونکی، ښوونکی یا کارمند وي",
  personIdRequired: "د کس ID اړین دی",
  personIdInvalid: "د کس ID باید مثبت عدد وي",
  institutionTypeInvalid: "د ادارې ډول باید ښوونځی، مرکز یا مدرسه وي",
  classIdInvalid: "د ټولګي ID باید مثبت عدد وي",
  attendanceDateRequired: "د حاضرۍ نېټه اړینه ده",
  attendanceDateInvalid: "د حاضرۍ نېټه باید سمه وي (YYYY-MM-DD)",
  statusInvalid: "د حاضرۍ حالت باید حاضر، غیر حاضر یا رخصتي وي",
  attendanceMethodInvalid: "د حاضرۍ میتود باید لاسي یا QR وي",
  scannedAtInvalid: "د سکین وخت باید سم وي",
  notesMax: "یادښتونه باید د ۵۰۰ توري څخه لږ وي",
  bulkAttendanceRequired: "د ډله ایز حاضرۍ ډیټا اړینه ده",
  bulkAttendanceInvalid: "د ډله ایز حاضرۍ ډیټا باید د اریز شکل کې وي",
  qrCodeRequired: "QR کوډ اړین دی",
  qrCodeInvalid: "QR کوډ باید د سټرینګ شکل کې وي",
};

// Validation for bulk attendance creation
export const bulkAttendanceValidator = [
  body("attendanceType")
    .notEmpty().withMessage(ERRORS.attendanceTypeRequired)
    .isIn(ATTENDANCE_TYPES).withMessage(ERRORS.attendanceTypeInvalid),

  body("attendanceDate")
    .notEmpty().withMessage(ERRORS.attendanceDateRequired)
    .isDate().withMessage(ERRORS.attendanceDateInvalid),

  body("attendanceData")
    .notEmpty().withMessage(ERRORS.bulkAttendanceRequired)
    .isArray().withMessage(ERRORS.bulkAttendanceInvalid)
    .custom((attendanceData) => {
      if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        throw new Error("د ډله ایز حاضرۍ ډیټا باید د اریز شکل کې وي او لږ تر لږه یو ریکارډ ولري");
      }
      
      for (const item of attendanceData) {
        if (!item.personId) {
          throw new Error("هر ریکارډ باید personId ولري");
        }
        if (item.attendanceType && !ATTENDANCE_TYPES.includes(item.attendanceType)) {
          throw new Error(ERRORS.attendanceTypeInvalid);
        }
        if (item.status && !STATUS_TYPES.includes(item.status)) {
          throw new Error(`د حاضرۍ حالت باید ${STATUS_TYPES.join(", ")} څخه یو وي`);
        }
      }
      return true;
    }),

  body("institutionType")
    .if(body("attendanceType").equals("Student"))
    .notEmpty().withMessage("د زده کوونکو لپاره د ادارې ډول اړین دی")
    .isIn(INSTITUTION_TYPES).withMessage(ERRORS.institutionTypeInvalid),

  body("classId")
    .if(body("attendanceType").equals("Student"))
    .notEmpty().withMessage("د زده کوونکو لپاره ټولګی اړین دی")
    .isInt({ min: 1 }).withMessage(ERRORS.classIdInvalid),
];

// Validation for QR attendance
export const qrAttendanceValidator = [
  body("qrCode")
    .notEmpty().withMessage(ERRORS.qrCodeRequired)
    .isString().withMessage(ERRORS.qrCodeInvalid),

  body("attendanceDate")
    .optional()
    .isDate().withMessage(ERRORS.attendanceDateInvalid),
];

export default {
  bulkAttendanceValidator,
  qrAttendanceValidator,
};
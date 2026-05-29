import { body, query } from "express-validator";

// Pashto error messages for fee validation
const ERRORS = {
  studentIdsRequired: "لږ تر لږه یو زده کوونکی اړین دی",
  studentIdsArray: "زده کوونکي باید لیست وي",
  studentIdInvalid: "د زده کوونکي ID باید سم عدد وي",
  enrollmentTypeRequired: "د شمولیت ډول اړین دی",
  enrollmentTypeInvalid: "د شمولیت ډول باید ښوونځی، مرکز یا مدرسه وي",
  monthRequired: "میاشت اړینه ده",
  monthInvalid: "میاشت باید سم فارمټ ولري (YYYY-MM)",
  academicYearRequired: "تعلیمي کال اړین دی",
  academicYearInvalid: "تعلیمي کال باید ۴ عدده وي",
  paidAmountRequired: "ورکړل شوی فیس اړین دی",
  paidAmountInvalid: "ورکړل شوی فیس باید مثبت عدد وي",
  dateRequired: "نېټه اړینه ده",
  dateInvalid: "نېټه باید سم فارمټ ولري (YYYY-MM-DD)",
  notesMax: "یادښتونه باید د ۵۰۰ توري څخه لږ وي",
  pageInvalid: "د پاڼې شمیره باید مثبت عدد وي",
  limitInvalid: "د محدودیت شمیره باید مثبت عدد وي",
  searchMax: "لټون باید د ۱۰۰ توري څخه لږ وي",
  statusInvalid: "حالت باید Paid، Partial یا Unpaid وي",
  formatInvalid: "فارمټ باید excel یا pdf وي",
  startDateInvalid: "د پیل نېټه باید سم فارمټ ولري",
  endDateInvalid: "د پای نېټه باید سم فارمټ ولري",
};

const ENROLLMENT_TYPES = ["School", "Center", "Madrasa"];
const PAYMENT_STATUSES = ["Paid", "Partial", "Unpaid"];
const EXPORT_FORMATS = ["excel", "pdf"];

// ─── CREATE FEE PAYMENT VALIDATOR ──────────────────────────────────────────────
export const createFeePaymentValidator = [
  body("studentIds")
    .notEmpty().withMessage(ERRORS.studentIdsRequired)
    .isArray({ min: 1 }).withMessage(ERRORS.studentIdsArray)
    .custom((studentIds) => {
      if (!Array.isArray(studentIds)) return false;
      return studentIds.every((id) => {
        const num = Number(id);
        return Number.isFinite(num) && num > 0;
      });
    }).withMessage(ERRORS.studentIdInvalid),

  body("month")
    .notEmpty().withMessage(ERRORS.monthRequired)
    .matches(/^\d{4}-\d{2}$/).withMessage(ERRORS.monthInvalid),

  body("academicYear")
    .notEmpty().withMessage(ERRORS.academicYearRequired)
    .custom((value) => /^\d{4}$/.test(String(value)))
    .withMessage(ERRORS.academicYearInvalid),

  body("paidAmount")
    .notEmpty().withMessage(ERRORS.paidAmountRequired)
    .isFloat({ min: 0 }).withMessage(ERRORS.paidAmountInvalid),

  body("date")
    .notEmpty().withMessage(ERRORS.dateRequired)
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERRORS.dateInvalid),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),

  body("enrollmentType")
    .optional({ checkFalsy: true })
    .isIn(ENROLLMENT_TYPES).withMessage(ERRORS.enrollmentTypeInvalid),
];

// ─── UPDATE FEE PAYMENT VALIDATOR ──────────────────────────────────────────────
export const updateFeePaymentValidator = [
  body("paidAmount")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.paidAmountInvalid),

  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

// ─── GET FEE PAYMENTS VALIDATOR ────────────────────────────────────────────────
export const getFeePaymentsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage(ERRORS.pageInvalid),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(ERRORS.limitInvalid),

  query("search")
    .optional()
    .isLength({ max: 100 }).withMessage(ERRORS.searchMax),

  query("academicYear")
    .optional()
    .matches(/^\d{4}$/).withMessage(ERRORS.academicYearInvalid),

  query("enrollmentType")
    .optional()
    .isIn(ENROLLMENT_TYPES).withMessage(ERRORS.enrollmentTypeInvalid),

  query("status")
    .optional()
    .isIn(PAYMENT_STATUSES).withMessage(ERRORS.statusInvalid),

  query("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/).withMessage(ERRORS.monthInvalid),

  query("startDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERRORS.startDateInvalid),

  query("endDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERRORS.endDateInvalid),
];

// ─── EXPORT FEE PAYMENTS VALIDATOR ─────────────────────────────────────────────
export const exportFeePaymentsValidator = [
  query("search")
    .optional()
    .isLength({ max: 100 }).withMessage(ERRORS.searchMax),

  query("academicYear")
    .optional()
    .matches(/^\d{4}$/).withMessage(ERRORS.academicYearInvalid),

  query("enrollmentType")
    .optional()
    .isIn(ENROLLMENT_TYPES).withMessage(ERRORS.enrollmentTypeInvalid),

  query("status")
    .optional()
    .isIn(PAYMENT_STATUSES).withMessage(ERRORS.statusInvalid),

  query("startDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERRORS.startDateInvalid),

  query("endDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERRORS.endDateInvalid),

  query("format")
    .optional()
    .isIn(EXPORT_FORMATS).withMessage(ERRORS.formatInvalid),
];
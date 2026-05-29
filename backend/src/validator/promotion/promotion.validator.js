import { body, param, query } from "express-validator";

// ─── INDIVIDUAL PROMOTION ──────────────────────────────────────────────────────

export const promoteIndividualValidator = [
  body("studentId")
    .notEmpty()
    .withMessage("د زده کوونکي ID اړین دی")
    .isInt({ min: 1 })
    .withMessage("د زده کوونکي ID باید یو مثبت عدد وي"),

  body("toClassId")
    .notEmpty()
    .withMessage("نوی ټولګی اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  body("toAcademicYear")
    .notEmpty()
    .withMessage("نوی تعلیمي کال اړین دی")
    .isString()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي (مثال: 1403)"),

  body("promotionStatus")
    .optional()
    .isIn(["Promoted", "Repeated", "Detained", "Transferred"])
    .withMessage("د ترفیع حالت باید Promoted، Repeated، Detained یا Transferred وي"),

  body("remarks")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("یادښت باید له 500 حروفو کم وي"),
];

// ─── BULK PROMOTION ────────────────────────────────────────────────────────────

export const promoteClassValidator = [
  body("fromClassId")
    .notEmpty()
    .withMessage("اوسنی ټولګی اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  body("toClassId")
    .notEmpty()
    .withMessage("نوی ټولګی اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  body("toAcademicYear")
    .notEmpty()
    .withMessage("نوی تعلیمي کال اړین دی")
    .isString()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي"),

  body("remarks")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("یادښت باید له 500 حروفو کم وي"),
];

export const promoteBulkValidator = promoteClassValidator;

// ─── GET ELIGIBLE STUDENTS ─────────────────────────────────────────────────────

export const getEligibleStudentsValidator = [
  query("classId")
    .notEmpty()
    .withMessage("د ټولګي ID اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  query("academicYear")
    .notEmpty()
    .withMessage("تعلیمي کال اړین دی")
    .isString()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي"),
];

// ─── PREVIEW PROMOTION ─────────────────────────────────────────────────────────

export const previewPromotionValidator = [
  body("studentIds")
    .notEmpty()
    .withMessage("د زده کوونکو لیست اړین دی")
    .isArray({ min: 1 })
    .withMessage("لږترلږه یو زده کوونکی وټاکئ"),

  body("studentIds.*")
    .isInt({ min: 1 })
    .withMessage("د زده کوونکي ID باید یو مثبت عدد وي"),

  body("fromClassId")
    .notEmpty()
    .withMessage("اوسنی ټولګی اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  body("toClassId")
    .notEmpty()
    .withMessage("نوی ټولګی اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  body("toAcademicYear")
    .notEmpty()
    .withMessage("نوی تعلیمي کال اړین دی")
    .isString()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي"),
];

// ─── PROMOTION ID ──────────────────────────────────────────────────────────────

export const promotionIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("د ترفیع ID اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ترفیع ID باید یو مثبت عدد وي"),
];

// ─── STUDENT ID ────────────────────────────────────────────────────────────────

export const studentIdValidator = [
  param("studentId")
    .notEmpty()
    .withMessage("د زده کوونکي ID اړین دی")
    .isInt({ min: 1 })
    .withMessage("د زده کوونکي ID باید یو مثبت عدد وي"),
];

// ─── GET NEXT CLASS ────────────────────────────────────────────────────────────

export const getNextClassValidator = [
  param("studentId")
    .notEmpty()
    .withMessage("د زده کوونکي ID اړین دی")
    .isInt({ min: 1 })
    .withMessage("د زده کوونکي ID باید یو مثبت عدد وي"),

  query("toAcademicYear")
    .optional()
    .isString()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي"),
];

// ─── GET ALL PROMOTIONS (QUERY PARAMS) ─────────────────────────────────────────

export const getAllPromotionsValidator = [
  query("studentId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د زده کوونکي ID باید یو مثبت عدد وي"),

  query("fromClassId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  query("toClassId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID باید یو مثبت عدد وي"),

  query("fromAcademicYear")
    .optional()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي"),

  query("toAcademicYear")
    .optional()
    .matches(/^\d{4}$/)
    .withMessage("تعلیمي کال باید د څلورو عددونو په بڼه وي"),

  query("promotionStatus")
    .optional()
    .isIn(["Promoted", "Repeated", "Detained", "Transferred"])
    .withMessage("د ترفیع حالت باید Promoted، Repeated، Detained یا Transferred وي"),

  query("promotionType")
    .optional()
    .isIn(["Individual", "Bulk", "YearEnd"])
    .withMessage("د ترفیع ډول باید Individual، Bulk یا YearEnd وي"),

  query("dateFrom")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("نېټه باید YYYY-MM-DD په بڼه وي"),

  query("dateTo")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("نېټه باید YYYY-MM-DD په بڼه وي"),

  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("د لټون متن باید له 100 حروفو کم وي"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د پاڼې شمېره باید یو مثبت عدد وي"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("د محدودیت شمېره باید د 1 او 100 ترمنځ وي"),
];

import { body, param } from "express-validator";

const INSTITUTION_TYPES = ["School", "Center", "Madrasa"];
const MARK_STATUSES = ["Pass", "Fail", "Absent"];

export const createMarkValidator = [
  body("examId").isInt({ min: 1 }).withMessage("امتحان اړین دی"),
  body("classId").isInt({ min: 1 }).withMessage("ټولګی اړین دی"),
  body("subjectId").isInt({ min: 1 }).withMessage("مضمون اړین دی"),
  body("studentId").isInt({ min: 1 }).withMessage("زده کوونکی اړین دی"),
  body("institutionType")
    .isIn(INSTITUTION_TYPES)
    .withMessage("د ادارې ډول اړین دی"),
  body("status")
    .optional()
    .isIn(MARK_STATUSES)
    .withMessage("حالت باید Pass، Fail یا Absent وي"),
  body("obtainedMarks")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("نمرې منفي نشي کیدای"),
];

export const bulkMarksValidator = [
  body("examId").isInt({ min: 1 }).withMessage("امتحان اړین دی"),
  body("classId").isInt({ min: 1 }).withMessage("ټولګی اړین دی"),
  body("subjectId").isInt({ min: 1 }).withMessage("مضمون اړین دی"),
  body("institutionType")
    .isIn(INSTITUTION_TYPES)
    .withMessage("د ادارې ډول اړین دی"),
  body("marks").isArray({ min: 1 }).withMessage("د ثبتولو لپاره نمرې نشته"),
  body("marks.*.studentId").isInt({ min: 1 }).withMessage("زده کوونکی آی ډی سم نه دی"),
  body("marks.*.status")
    .optional()
    .isIn(MARK_STATUSES)
    .withMessage("حالت سم نه دی"),
];

export const updateMarkValidator = [
  param("id").isInt({ min: 1 }).withMessage("آی ډی سم نه دی"),
  body("status")
    .optional()
    .isIn(MARK_STATUSES)
    .withMessage("حالت سم نه دی"),
  body("obtainedMarks")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("نمرې منفي نشي کیدای"),
];

export const markIdValidator = [
  param("id").isInt({ min: 1 }).withMessage("آی ډی سم نه دی"),
];

export const resultCalcValidator = [
  body("examId").isInt({ min: 1 }).withMessage("امتحان اړین دی"),
  body("classId").isInt({ min: 1 }).withMessage("ټولګی اړین دی"),
  body("institutionType")
    .isIn(INSTITUTION_TYPES)
    .withMessage("د ادارې ډول اړین دی"),
];

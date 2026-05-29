import { body } from "express-validator";

const titleRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s\-_.]+$/;

const INSTITUTION_TYPES = ["School", "Center", "Madrasa"];
const STATUS_VALUES = ["فعال", "غیر فعال"];

// Pashto error messages
const ERRORS = {
  examTitleRequired: "د امتحان سرلیک اړین دی",
  examTitleInvalid: "د امتحان سرلیک یوازې پښتو، دري، انګلیسي توري، عددونه او ځانګړي نښې ولري",
  examTitleLength: "د امتحان سرلیک باید د ۳ څخه تر ۲۰۰ توري پورې وي",
  institutionTypeRequired: "د ادارې ډول اړین دی",
  institutionTypeInvalid: "د ادارې ډول باید ښوونځی، مرکز یا مدرسه وي",
  assignedClassesRequired: "لږ تر لږه یوه ټولګي اړینه ده",
  assignedClassesInvalid: "ټاکل شوې ټولګي باید د سمو ټولګیو لیست وي",
  startDateRequired: "د پیل نېټه اړینه ده",
  startDateInvalid: "د پیل نېټه باید سمه وي",
  endDateRequired: "د پای نېټه اړینه ده",
  endDateInvalid: "د پای نېټه باید سمه وي",
  endDateBeforeStart: "د پای نېټه باید د پیل نېټې څخه وروسته وي",
  statusRequired: "حالت اړین دی",
  statusInvalid: "حالت باید فعال یا غیر فعال وي",
  academicYearRequired: "تعلیمي کال اړین دی",
  academicYearInvalid: "تعلیمي کال باید د ۴ عددونو څخه جوړ وي",
};

// Custom validator for assigned classes
const validateAssignedClasses = (value) => {
  let parsed = value;
  
  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (e) {
      throw new Error(ERRORS.assignedClassesInvalid);
    }
  }
  
  // Must be an array with at least one element
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(ERRORS.assignedClassesRequired);
  }
  
  // All elements must be valid integers (class IDs)
  const allValid = parsed.every(id => Number.isInteger(Number(id)) && Number(id) > 0);
  if (!allValid) {
    throw new Error(ERRORS.assignedClassesInvalid);
  }
  
  return true;
};

// Custom validator for date comparison
const validateEndDate = (endDate, { req }) => {
  const startDate = req.body.startDate;
  
  if (!startDate || !endDate) {
    return true; // Let other validators handle required validation
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end <= start) {
    throw new Error(ERRORS.endDateBeforeStart);
  }
  
  return true;
};

const baseExamFields = [
  body("examTitle")
    .notEmpty().withMessage(ERRORS.examTitleRequired)
    .trim()
    .matches(titleRegex).withMessage(ERRORS.examTitleInvalid)
    .isLength({ min: 3, max: 200 }).withMessage(ERRORS.examTitleLength),

  body("institutionType")
    .notEmpty().withMessage(ERRORS.institutionTypeRequired)
    .isIn(INSTITUTION_TYPES).withMessage(ERRORS.institutionTypeInvalid),

  body("assignedClasses")
    .notEmpty().withMessage(ERRORS.assignedClassesRequired)
    .custom(validateAssignedClasses),

  body("startDate")
    .notEmpty().withMessage(ERRORS.startDateRequired)
    .isDate().withMessage(ERRORS.startDateInvalid),

  body("endDate")
    .notEmpty().withMessage(ERRORS.endDateRequired)
    .isDate().withMessage(ERRORS.endDateInvalid)
    .custom(validateEndDate),

  body("status")
    .notEmpty().withMessage(ERRORS.statusRequired)
    .isIn(STATUS_VALUES).withMessage(ERRORS.statusInvalid),

  body("academicYear")
    .notEmpty().withMessage(ERRORS.academicYearRequired)
    .matches(/^\d{4}$/).withMessage(ERRORS.academicYearInvalid),
];

export const createExamValidator = baseExamFields;

export const updateExamValidator = baseExamFields;

export default {
  createExamValidator,
  updateExamValidator,
};
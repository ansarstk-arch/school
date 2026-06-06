import { body, query, param } from "express-validator";

const MESSAGE_TYPES = ["Absent", "Present", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"];

// ─── SMS ENDPOINT VALIDATORS ───────────────────────────────────────────────────
export const upsertSmsEndpointValidator = [
  body("slot")
    .isInt({ min: 1, max: 3 })
    .withMessage("د فون سلاټ باید ۱، ۲ یا ۳ وي"),

  body("apiUrl")
    .trim()
    .notEmpty()
    .withMessage("د API بشپړه پته اړینه ده"),
];

export const upsertSmsSettingsValidator = upsertSmsEndpointValidator;

export const testSmsConnectionValidator = [
  body("testPhone")
    .trim()
    .notEmpty()
    .withMessage("د ازموینې لپاره ټیلیفون نمبر اړین دی")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("ټیلیفون نمبر سم نه دی"),

  body("testMessage").optional().trim(),

  body("endpointId").optional().isInt({ min: 1 }),
  body("slot").optional().isInt({ min: 1, max: 3 }),
];

// ─── SMS TEMPLATES VALIDATORS ──────────────────────────────────────────────────
export const createSmsTemplateValidator = [
  body("templateType")
    .trim()
    .notEmpty()
    .withMessage("د کالبد ډول اړین دی")
    .isIn(MESSAGE_TYPES)
    .withMessage("د کالبد ډول سم نه دی"),

  body("templateName")
    .trim()
    .notEmpty()
    .withMessage("د کالبد نوم اړین دی")
    .isLength({ min: 3, max: 100 }),

  body("messagePs")
    .trim()
    .notEmpty()
    .withMessage("پښتو پیغام اړین دی")
    .isLength({ min: 10, max: 500 }),

  body("messageDa").optional().trim().isLength({ max: 500 }),
  body("variables").optional(),
];

export const updateSmsTemplateValidator = [
  param("id").isInt({ min: 1 }),
  body("templateType").optional().isIn(MESSAGE_TYPES),
  body("templateName").optional().trim().isLength({ min: 3, max: 100 }),
  body("messagePs").optional().trim().isLength({ min: 10, max: 500 }),
  body("messageDa").optional().trim().isLength({ max: 500 }),
];

export const deleteSmsTemplateValidator = [
  param("id").isInt({ min: 1 }),
];

// ─── SMS RECIPIENTS VALIDATORS ─────────────────────────────────────────────────
export const getAbsentRecipientsValidator = [
  query("institutionType")
    .trim()
    .notEmpty()
    .isIn(["School", "Center", "Madrasa"]),
  query("date").optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query("classId").optional().isInt({ min: 1 }),
];

export const getPresentRecipientsValidator = getAbsentRecipientsValidator;

export const getFeeRecipientsValidator = [
  query("institutionType").trim().notEmpty().isIn(["School", "Center", "Madrasa"]),
  query("month").optional().matches(/^\d{4}-\d{2}$/),
  query("academicYear").optional().trim(),
];

export const getExamRecipientsValidator = [
  query("institutionType").trim().notEmpty().isIn(["School", "Center", "Madrasa"]),
  query("examId").notEmpty().isInt({ min: 1 }),
  query("resultType").trim().notEmpty().isIn(["pass", "fail", "top"]),
  query("classId").optional().isInt({ min: 1 }),
];

const isValidRecipientId = (value) => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) return true;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};

const recipientShape = [
  body("recipients.*.parentId")
    .custom((value) => isValidRecipientId(value))
    .withMessage("د مور/پلار پېژندنه سمه نه ده"),
  body("recipients.*.parentPhone").trim().notEmpty(),
];

// ─── SMS SENDING VALIDATORS ────────────────────────────────────────────────────
export const sendSmsToParentsValidator = [
  body("endpointId").isInt({ min: 1 }).withMessage("فون وټاکئ"),
  body("messageType").trim().notEmpty().isIn(MESSAGE_TYPES),
  body("recipients").isArray({ min: 1 }),
  ...recipientShape,
  body("templateId").optional().isInt({ min: 1 }),
  body("customMessage").optional().trim().isLength({ min: 10, max: 500 }),
  body("attendanceDate").optional().matches(/^\d{4}-\d{2}-\d{2}$/),
];

export const sendSmsSingleValidator = [
  body("endpointId").isInt({ min: 1 }).withMessage("فون وټاکئ"),
  body("messageType").trim().notEmpty().isIn(MESSAGE_TYPES),
  body("recipient").notEmpty(),
  body("recipient.parentId")
    .custom((value) => isValidRecipientId(value))
    .withMessage("د مور/پلار پېژندنه سمه نه ده"),
  body("recipient.parentPhone").trim().notEmpty(),
  body("templateId").optional().isInt({ min: 1 }),
  body("customMessage").optional().trim().isLength({ min: 10, max: 500 }),
  body("batchId").optional().trim(),
  body("attendanceDate").optional().matches(/^\d{4}-\d{2}-\d{2}$/),
];

export const retrySmsValidator = [
  param("id").isInt({ min: 1 }),
  body("endpointId").optional().isInt({ min: 1 }),
];

export const getSmsLogsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(["Pending", "Sent", "Failed"]),
  query("messageType").optional().isIn(MESSAGE_TYPES),
  query("year").optional().isInt({ min: 1300, max: 1500 }),
  query("studentId").optional().isInt({ min: 1 }),
];

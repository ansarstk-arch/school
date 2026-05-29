import { body, query, param } from "express-validator";

// ─── SMS SETTINGS VALIDATORS ───────────────────────────────────────────────────
export const upsertSmsSettingsValidator = [
  body("apiUrl")
    .trim()
    .notEmpty()
    .withMessage("د API پته اړینه ده")
    .isURL({ require_protocol: true })
    .withMessage("د API پته سمه نه ده"),
];

export const testSmsConnectionValidator = [
  body("testPhone")
    .trim()
    .notEmpty()
    .withMessage("د ازموینې لپاره ټیلیفون نمبر اړین دی")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("ټیلیفون نمبر سم نه دی"),

  body("testMessage")
    .optional()
    .trim(),
];

// ─── SMS TEMPLATES VALIDATORS ──────────────────────────────────────────────────
export const createSmsTemplateValidator = [
  body("templateType")
    .trim()
    .notEmpty()
    .withMessage("د کالبد ډول اړین دی")
    .isIn(["Absent", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"])
    .withMessage("د کالبد ډول سم نه دی"),

  body("templateName")
    .trim()
    .notEmpty()
    .withMessage("د کالبد نوم اړین دی")
    .isLength({ min: 3, max: 100 })
    .withMessage("د کالبد نوم باید د ۳ څخه تر ۱۰۰ توري وي"),

  body("messagePs")
    .trim()
    .notEmpty()
    .withMessage("پښتو پیغام اړین دی")
    .isLength({ min: 10, max: 500 })
    .withMessage("پیغام باید د ۱۰ څخه تر ۵۰۰ توري وي"),

  body("messageDa")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("پیغام باید د ۵۰۰ توري څخه لږ وي"),

  body("variables")
    .optional(),
];

export const updateSmsTemplateValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("سم ID اړین دی"),

  body("templateType")
    .optional()
    .isIn(["Absent", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"])
    .withMessage("د کالبد ډول سم نه دی"),

  body("templateName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("د کالبد نوم باید د ۳ څخه تر ۱۰۰ توري وي"),

  body("messagePs")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("پیغام باید د ۱۰ څخه تر ۵۰۰ توري وي"),

  body("messageDa")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("پیغام باید د ۵۰۰ توري څخه لږ وي"),
];

export const deleteSmsTemplateValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("سم ID اړین دی"),
];

// ─── SMS SENDING VALIDATORS ────────────────────────────────────────────────────
export const getAbsentRecipientsValidator = [
  query("institutionType")
    .trim()
    .notEmpty()
    .withMessage("د موسسې ډول اړین دی")
    .isIn(["School", "Center", "Madrasa"])
    .withMessage("د موسسې ډول سم نه دی"),

  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("نیټه باید YYYY-MM-DD فارمټ کې وي"),

  query("classId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID سم نه دی"),
];

export const getFeeRecipientsValidator = [
  query("institutionType")
    .trim()
    .notEmpty()
    .withMessage("د موسسې ډول اړین دی")
    .isIn(["School", "Center", "Madrasa"])
    .withMessage("د موسسې ډول سم نه دی"),

  query("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("میاشت باید YYYY-MM فارمټ کې وي"),

  query("academicYear")
    .optional()
    .trim(),
];

export const getExamRecipientsValidator = [
  query("institutionType")
    .trim()
    .notEmpty()
    .withMessage("د موسسې ډول اړین دی")
    .isIn(["School", "Center", "Madrasa"])
    .withMessage("د موسسې ډول سم نه دی"),

  query("examId")
    .notEmpty()
    .withMessage("د ازموینې ID اړین دی")
    .isInt({ min: 1 })
    .withMessage("د ازموینې ID سم نه دی"),

  query("resultType")
    .trim()
    .notEmpty()
    .withMessage("د نتیجې ډول اړین دی")
    .isIn(["pass", "fail", "top"])
    .withMessage("د نتیجې ډول سم نه دی"),

  query("classId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د ټولګي ID سم نه دی"),
];

export const sendSmsToParentsValidator = [
  body("messageType")
    .trim()
    .notEmpty()
    .withMessage("د پیغام ډول اړین دی")
    .isIn(["Absent", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"])
    .withMessage("د پیغام ډول سم نه دی"),

  body("recipients")
    .isArray({ min: 1 })
    .withMessage("لږ تر لږه یو ترلاسه کوونکی اړین دی"),

  body("recipients.*.parentId")
    .isInt({ min: 1 })
    .withMessage("د مور/پلار ID سم نه دی"),

  body("recipients.*.parentPhone")
    .trim()
    .notEmpty()
    .withMessage("ټیلیفون نمبر اړین دی"),

  body("templateId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د کالبد ID سم نه دی"),

  body("customMessage")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("پیغام باید د ۱۰ څخه تر ۵۰۰ توري وي"),
];

export const retrySmsValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("سم ID اړین دی"),
];

// ─── SMS LOGS VALIDATORS ───────────────────────────────────────────────────────
export const getSmsLogsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("د پاڼې نمبر سم نه دی"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("د حد نمبر سم نه دی"),

  query("status")
    .optional()
    .isIn(["Pending", "Sent", "Failed"])
    .withMessage("د حالت ډول سم نه دی"),

  query("messageType")
    .optional()
    .isIn(["Absent", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"])
    .withMessage("د پیغام ډول سم نه دی"),
];

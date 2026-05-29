import { body } from "express-validator";

const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s]+$/;
const TYPES = ["School", "Center", "Madrasa"];

export const createClassValidator = [
  body("name")
    .notEmpty().withMessage("د ټولګي نوم اړین دی")
    .matches(nameRegex).withMessage("نوم یوازې پښتو، دري یا انګلیسي توري ولري")
    .isLength({ min: 1, max: 100 }).withMessage("نوم باید د ۱ څخه تر ۱۰۰ توري پورې وي"),

  body("section")
    .optional({ checkFalsy: true })
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s]+$/).withMessage("څانګه باید سمه وي")
    .isLength({ min: 1, max: 20 }).withMessage("څانګه باید د ۱ څخه تر ۲۰ توري پورې وي"),

  body("type")
    .notEmpty().withMessage("د ټولګي ډول اړین دی")
    .isIn(TYPES).withMessage("ډول باید ښوونځی، مرکز یا مدرسه وي"),

  body("academicYear")
    .notEmpty().withMessage("تعلیمي کال اړین دی")
    .matches(/^[0-9]{4}$/).withMessage("تعلیمي کال باید ۴ عددي وي"),

  body("monthlyFee")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage("میاشتنی فیس باید مثبت عدد وي"),

  body("supervisorId")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("نهګران باید سم وي"),
];

export const updateClassValidator = [
  body("name")
    .optional()
    .matches(nameRegex).withMessage("نوم یوازې پښتو، دري یا انګلیسي توري ولري")
    .isLength({ min: 1, max: 100 }).withMessage("نوم باید د ۱ څخه تر ۱۰۰ توري پورې وي"),

  body("section")
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 20 }).withMessage("څانګه باید د ۱ څخه تر ۲۰ توري پورې وي"),

  body("type")
    .optional()
    .isIn(TYPES).withMessage("ډول باید ښوونځی، مرکز یا مدرسه وي"),

  body("academicYear")
    .optional()
    .matches(/^[0-9]{4}$/).withMessage("تعلیمي کال باید ۴ عددي وي"),

  body("monthlyFee")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage("میاشتنی فیس باید مثبت عدد وي"),

  body("supervisorId")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("نهګران باید سم وي"),
];

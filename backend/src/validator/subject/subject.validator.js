import { body } from "express-validator";

const TYPES = ["School", "Center", "Madrasa"];

export const createSubjectValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("د مضمون نوم اړین دی")
    .isLength({ min: 2, max: 100 }).withMessage("د مضمون نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي")
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/).withMessage("د مضمون نوم یوازې پښتو، دري یا انګلیسي توري ولري"),

  body("type")
    .notEmpty().withMessage("ډول اړین دی")
    .isIn(TYPES).withMessage("ډول باید ښوونځی، مرکز یا مدرسه وي"),

  body("academicYear")
    .notEmpty().withMessage("تعلیمي کال اړین دی")
    .isString().withMessage("تعلیمي کال باید متن وي"),

  body("classIds")
    .isArray({ min: 1 }).withMessage("لږترلږه یو ټولګی وټاکئ"),

  body("classIds.*")
    .isInt({ min: 1 }).withMessage("د ټولګي ID باید مثبت عدد وي"),
];

export const updateSubjectValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("د مضمون نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي")
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/).withMessage("د مضمون نوم یوازې پښتو، دري یا انګلیسي توري ولري"),

  body("type")
    .optional()
    .isIn(TYPES).withMessage("ډول باید ښوونځی، مرکز یا مدرسه وي"),

  body("academicYear")
    .optional()
    .isString().withMessage("تعلیمي کال باید متن وي"),

  body("classIds")
    .optional()
    .isArray().withMessage("ټولګي باید لیست وي"),

  body("classIds.*")
    .isInt({ min: 1 }).withMessage("د ټولګي ID باید مثبت عدد وي"),
];

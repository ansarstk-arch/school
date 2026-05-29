import { body, param } from "express-validator";

const INSTITUTION_TYPES = ["School", "Center", "Madrasa"];

export const createExamSubjectConfigValidator = [
  body("examId").isInt({ min: 1 }).withMessage("امتحان اړین دی"),
  body("classId").isInt({ min: 1 }).withMessage("ټولګی اړین دی"),
  body("subjectId").isInt({ min: 1 }).withMessage("مضمون اړین دی"),
  body("institutionType")
    .isIn(INSTITUTION_TYPES)
    .withMessage("د ادارې ډول باید ښوونځی، مرکز یا مدرسه وي"),
  body("totalMarks")
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("ټولټال نمرې باید د 0 او 100 تر منځ وي"),
  body("passingMarks")
    .isFloat({ min: 0 })
    .withMessage("د بریالیتوب نمرې اړینې دي")
    .custom((val, { req }) => {
      if (Number(val) > Number(req.body.totalMarks)) {
        throw new Error("د بریالیتوب نمرې نشي کولی د ټولټال نمرو څخه زیاتې وي");
      }
      return true;
    }),
];

export const updateExamSubjectConfigValidator = [
  param("id").isInt({ min: 1 }).withMessage("آی ډی سم نه دی"),
  body("totalMarks")
    .optional()
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("ټولټال نمرې باید د 0 او 100 تر منځ وي"),
  body("passingMarks")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("د بریالیتوب نمرې منفي نشي کیدای"),
];

export const bulkUpsertConfigValidator = [
  body("examId").isInt({ min: 1 }).withMessage("امتحان اړین دی"),
  body("classId").isInt({ min: 1 }).withMessage("ټولګی اړین دی"),
  body("institutionType")
    .isIn(INSTITUTION_TYPES)
    .withMessage("د ادارې ډول اړین دی"),
  body("configs").isArray({ min: 1 }).withMessage("لږ تر لږه یو مضمون اړین دی"),
  body("configs.*.subjectId").isInt({ min: 1 }).withMessage("مضمون آی ډی سم نه دی"),
  body("configs.*.totalMarks")
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("ټولټال نمرې باید د 0 او 100 تر منځ وي"),
  body("configs.*.passingMarks")
    .isFloat({ min: 0 })
    .withMessage("د بریالیتوب نمرې اړینې دي"),
];

export const configIdValidator = [
  param("id").isInt({ min: 1 }).withMessage("آی ډی سم نه دی"),
];

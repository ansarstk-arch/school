import { body } from "express-validator";

const INSTITUTE_TYPES = ["School", "Center", "Madrasa"];

export const createExpenseCategoryValidator = [
  body("name")
    .notEmpty().withMessage("validation.expense.categoryNameRequired")
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/).withMessage("validation.expense.categoryNameInvalid")
    .isLength({ min: 2, max: 100 }).withMessage("validation.expense.categoryNameLength"),

  body("nameEn")
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z\s]+$/).withMessage("validation.expense.categoryNameEnInvalid")
    .isLength({ min: 2, max: 100 }).withMessage("validation.expense.categoryNameEnLength"),
];

export const updateExpenseCategoryValidator = [
  body("name")
    .optional()
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/).withMessage("validation.expense.categoryNameInvalid")
    .isLength({ min: 2, max: 100 }).withMessage("validation.expense.categoryNameLength"),

  body("nameEn")
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z\s]+$/).withMessage("validation.expense.categoryNameEnInvalid")
    .isLength({ min: 2, max: 100 }).withMessage("validation.expense.categoryNameEnLength"),
];

export const createExpenseValidator = [
  body("title")
    .notEmpty().withMessage("validation.expense.titleRequired")
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s]+$/).withMessage("validation.expense.titleInvalid")
    .isLength({ min: 2, max: 200 }).withMessage("validation.expense.titleLength"),

  body("categoryId")
    .notEmpty().withMessage("validation.expense.categoryIdRequired")
    .isInt({ min: 1 }).withMessage("validation.expense.categoryIdInvalid"),

  body("instituteType")
    .notEmpty().withMessage("validation.expense.instituteTypeRequired")
    .isIn(INSTITUTE_TYPES).withMessage("validation.expense.instituteTypeInvalid"),

  body("amount")
    .notEmpty().withMessage("validation.expense.amountRequired")
    .isFloat({ min: 0.01 }).withMessage("validation.expense.amountInvalid"),

  body("date")
    .notEmpty().withMessage("validation.expense.dateRequired")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("validation.expense.dateInvalid"),

  body("periodType")
    .optional()
    .isIn(["daily", "monthly", "yearly"]).withMessage("validation.expense.periodTypeInvalid"),

  body("description")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage("validation.expense.descriptionMax"),
];

export const updateExpenseValidator = [
  body("title")
    .optional()
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s]+$/).withMessage("validation.expense.titleInvalid")
    .isLength({ min: 2, max: 200 }).withMessage("validation.expense.titleLength"),

  body("categoryId")
    .optional()
    .isInt({ min: 1 }).withMessage("validation.expense.categoryIdInvalid"),

  body("instituteType")
    .optional()
    .isIn(INSTITUTE_TYPES).withMessage("validation.expense.instituteTypeInvalid"),

  body("amount")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("validation.expense.amountInvalid"),

  body("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("validation.expense.dateInvalid"),

  body("periodType")
    .optional()
    .isIn(["daily", "monthly", "yearly"]).withMessage("validation.expense.periodTypeInvalid"),

  body("description")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage("validation.expense.descriptionMax"),
];

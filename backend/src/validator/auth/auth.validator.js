import { body } from "express-validator";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("نوم اړین دی"),
  
  body("email")
    .trim()
    .notEmpty()
    .withMessage("بریښنالیک اړین دی")
    .isEmail()
    .withMessage("بریښنالیک سم نه دی")
    .normalizeEmail(),
  
  body("password")
    .trim()
    .notEmpty()
    .withMessage("پاسورډ اړین دی")
    .isLength({ min: 6 })
    .withMessage("پاسورډ باید لږ تر لږه ۶ توري ولري"),
  
  body("role")
    .optional()
    .isIn(["admin", "registrar", "teacher", "accountant", "custom"])
    .withMessage("رول سم نه دی"),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("بریښنالیک اړین دی")
    .isEmail()
    .withMessage("بریښنالیک سم نه دی")
    .normalizeEmail(),
  
  body("password")
    .trim()
    .notEmpty()
    .withMessage("پاسورډ اړین دی"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("اوسنی پاسورډ اړین دی"),
  
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("نوی پاسورډ اړین دی")
    .isLength({ min: 6 })
    .withMessage("نوی پاسورډ باید لږ تر لږه ۶ توري ولري"),
];

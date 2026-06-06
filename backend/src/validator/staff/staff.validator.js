import { body } from "express-validator";

// Accepts Pashto (Arabic script) + English letters + spaces
const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;

export const createStaffValidator = [
  body("name")
    .notEmpty().withMessage("نوم اړین دی")
    .matches(nameRegex).withMessage("نوم یوازې پښتو، دري یا انګلیسي توري ولري")
    .isLength({ min: 2, max: 100 }).withMessage("نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي"),

  body("fatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage("د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري")
    .isLength({ min: 2, max: 100 }).withMessage("د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي"),

  body("phone")
    .notEmpty().withMessage("ټېلیفون نمبر اړین دی")
    .matches(/^(\+93|0093|0)7[0-9]{8}$/).withMessage("ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)"),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isString().isLength({ min: 5, max: 20 }).withMessage("تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي"),

  body("position")
    .notEmpty().withMessage("مسئولیت اړین دی")
    .isLength({ min: 2, max: 100 }).withMessage("مسئولیت باید د ۲ څخه تر ۱۰۰ توري پورې وي"),

  body("salary")
    .notEmpty().withMessage("معاش اړین دی")
    .isNumeric().withMessage("معاش باید عدد وي")
    .custom((value) => Number(value) > 0).withMessage("معاش باید له صفر څخه زیات وي"),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage("یادښتونه باید د ۵۰۰ توري څخه لږ وي"),
];

export const updateStaffValidator = [
  body("name")
    .optional()
    .matches(nameRegex).withMessage("نوم یوازې پښتو، دري یا انګلیسي توري ولري")
    .isLength({ min: 2, max: 100 }).withMessage("نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي"),

  body("fatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage("د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري")
    .isLength({ min: 2, max: 100 }).withMessage("د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي"),

  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^(\+93|0093|0)7[0-9]{8}$/).withMessage("ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)"),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isLength({ min: 5, max: 20 }).withMessage("تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي"),

  body("position")
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage("مسئولیت باید د ۲ څخه تر ۱۰۰ توري پورې وي"),

  body("salary")
    .optional()
    .isNumeric().withMessage("معاش باید عدد وي")
    .custom((value) => !value || Number(value) > 0).withMessage("معاش باید له صفر څخه زیات وي"),

  body("status")
    .optional()
    .isIn(["active", "inactive"]).withMessage("حالت باید فعال یا غیر فعال وي"),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage("یادښتونه باید د ۵۰۰ توري څخه لږ وي"),
];

export const resetStaffPasswordValidator = [
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("نوی پاسورډ اړین دی")
    .isLength({ min: 6 })
    .withMessage("پاسورډ باید لږ تر لږه ۶ توري ولري"),
];

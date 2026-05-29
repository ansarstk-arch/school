import { body } from "express-validator";

const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
const addressRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s,.-]+$/;
const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const INSTITUTE_TYPES = ["School", "Center", "Madrasa"];

// Pashto error messages
const ERRORS = {
  nameRequired: "نوم اړین دی",
  nameInvalid: "نوم یوازې پښتو، دري یا انګلیسي توري ولري",
  nameLength: "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي",
  phoneRequired: "ټېلیفون نمبر اړین دی",
  phoneInvalid: "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)",
  idCardLength: "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي",
  instituteTypeRequired: "د مؤسسې ډول اړین دی",
  instituteTypeInvalid: "د مؤسسې ډول باید ښوونځی، مرکز یا مدرسه وي",
  studentIdsRequired: "لږترلږه یو زده کوونکی وټاکئ",
  studentIdsInvalid: "د زده کوونکو لیست باید سم وي",
  usernameRequired: "کارن نوم اړین دی",
  usernameInvalid: "کارن نوم یوازې انګلیسي توري، عددونه او _ ولري (۳-۲۰ توري)",
  usernameLength: "کارن نوم باید د ۳ څخه تر ۲۰ توري پورې وي",
  passwordRequired: "پټنوم اړین دی",
  passwordLength: "پټنوم باید لږترلږه ۶ توري ولري",
  addressInvalid: "پته یوازې پښتو، دري، انګلیسي توري او عددونه ولري",
  addressMax: "پته باید د ۲۰۰ توري څخه لږه وي",
  notesMax: "یادښتونه باید د ۵۰۰ توري څخه لږ وي",
  registeredAtInvalid: "د ثبت نېټه باید سمه وي",
};

export const createParentValidator = [
  body("name")
    .notEmpty().withMessage(ERRORS.nameRequired)
    .matches(nameRegex).withMessage(ERRORS.nameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.nameLength),

  body("phone")
    .notEmpty().withMessage(ERRORS.phoneRequired)
    .matches(phoneRegex).withMessage(ERRORS.phoneInvalid),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 5, max: 20 }).withMessage(ERRORS.idCardLength),

  body("instituteTypes")
    .notEmpty().withMessage(ERRORS.instituteTypeRequired)
    .isArray({ min: 1 }).withMessage(ERRORS.instituteTypeRequired)
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(type => INSTITUTE_TYPES.includes(type));
    }).withMessage(ERRORS.instituteTypeInvalid),

  body("studentIds")
    .notEmpty().withMessage(ERRORS.studentIdsRequired)
    .isArray({ min: 1 }).withMessage(ERRORS.studentIdsRequired)
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(Number(id)) && Number(id) > 0);
    }).withMessage(ERRORS.studentIdsInvalid),

  body("username")
    .notEmpty().withMessage(ERRORS.usernameRequired)
    .matches(usernameRegex).withMessage(ERRORS.usernameInvalid)
    .isLength({ min: 3, max: 20 }).withMessage(ERRORS.usernameLength),

  body("password")
    .notEmpty().withMessage(ERRORS.passwordRequired)
    .isLength({ min: 6 }).withMessage(ERRORS.passwordLength),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("registeredAt")
    .optional({ checkFalsy: true })
    .isDate().withMessage(ERRORS.registeredAtInvalid),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

export const updateParentValidator = [
  body("name")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.nameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.nameLength),

  body("phone")
    .optional({ checkFalsy: true })
    .matches(phoneRegex).withMessage(ERRORS.phoneInvalid),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isLength({ min: 5, max: 20 }).withMessage(ERRORS.idCardLength),

  body("instituteTypes")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 }).withMessage(ERRORS.instituteTypeRequired)
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(type => INSTITUTE_TYPES.includes(type));
    }).withMessage(ERRORS.instituteTypeInvalid),

  body("studentIds")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 }).withMessage(ERRORS.studentIdsRequired)
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(Number(id)) && Number(id) > 0);
    }).withMessage(ERRORS.studentIdsInvalid),

  body("username")
    .optional({ checkFalsy: true })
    .matches(usernameRegex).withMessage(ERRORS.usernameInvalid)
    .isLength({ min: 3, max: 20 }).withMessage(ERRORS.usernameLength),

  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage(ERRORS.passwordLength),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("registeredAt")
    .optional({ checkFalsy: true })
    .isDate().withMessage(ERRORS.registeredAtInvalid),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

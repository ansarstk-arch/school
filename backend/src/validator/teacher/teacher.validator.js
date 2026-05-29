import { body } from "express-validator";

const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
const addressRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s,.-]+$/;
const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;

const EDUCATION_LEVELS = ["grade12", "grade14", "bachelor", "master", "phd"];
const TEACHER_TYPES = ["School", "Center", "Madrasa"];

// Pashto error messages
const ERRORS = {
  nameRequired: "نوم اړین دی",
  nameInvalid: "نوم یوازې پښتو، دري یا انګلیسي توري ولري",
  nameLength: "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي",
  fatherNameRequired: "د پلار نوم اړین دی",
  fatherNameInvalid: "د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري",
  fatherNameLength: "د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي",
  phoneRequired: "ټېلیفون نمبر اړین دی",
  phoneInvalid: "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)",
  idCardLength: "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي",
  educationRequired: "زده کړه اړینه ده",
  educationInvalid: "زده کړه باید سمه وي (۱۲ ګرېډ، ۱۴ ګرېډ، لیسانس، ماستري، دکتورا)",
  salaryInvalid: "معاش باید مثبت عدد وي",
  skillsMax: "مهارتونه باید د ۳۰۰ توري څخه لږ وي",
  addressInvalid: "پته یوازې پښتو، دري، انګلیسي توري او عددونه ولري",
  addressMax: "پته باید د ۲۰۰ توري څخه لږه وي",
  joiningDateInvalid: "د شمولیت نېټه باید سمه وي",
  notesMax: "یادښتونه باید د ۵۰۰ توري څخه لږ وي"
};

const baseTeacherFields = [
  body("name")
    .notEmpty().withMessage(ERRORS.nameRequired)
    .matches(nameRegex).withMessage(ERRORS.nameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.nameLength),

  body("fatherName")
    .notEmpty().withMessage(ERRORS.fatherNameRequired)
    .matches(nameRegex).withMessage(ERRORS.fatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fatherNameLength),

  body("phone")
    .notEmpty().withMessage(ERRORS.phoneRequired)
    .matches(phoneRegex).withMessage(ERRORS.phoneInvalid),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 5, max: 20 }).withMessage(ERRORS.idCardLength),

  body("education")
    .notEmpty().withMessage(ERRORS.educationRequired)
    .isIn(EDUCATION_LEVELS).withMessage(ERRORS.educationInvalid),

  body("salary")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage(ERRORS.salaryInvalid),

  body("skills")
    .optional({ checkFalsy: true })
    .isLength({ max: 300 }).withMessage(ERRORS.skillsMax),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("joiningDate")
    .optional({ checkFalsy: true })
    .isDate().withMessage(ERRORS.joiningDateInvalid),

  body("teacherType")
    .optional({ checkFalsy: true })
    .custom((value) => {
      // Parse JSON string if needed
      let types;
      try {
        types = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        throw new Error("د ښوونکي ډول په سمه توګه نه دی لیږل شوی");
      }

      // Must be an array with at least one value
      if (!Array.isArray(types) || types.length === 0) {
        throw new Error("د ښوونکي ډول اړین دی - لږترلږه یو ډول وټاکئ");
      }

      // All values must be valid types
      const invalidTypes = types.filter(type => !TEACHER_TYPES.includes(type));
      if (invalidTypes.length > 0) {
        throw new Error("د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي");
      }

      return true;
    }),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

export const createTeacherValidator = baseTeacherFields;

export const updateTeacherValidator = [
  body("name")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.nameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.nameLength),

  body("fatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.fatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fatherNameLength),

  body("phone")
    .optional({ checkFalsy: true })
    .matches(phoneRegex).withMessage(ERRORS.phoneInvalid),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isLength({ min: 5, max: 20 }).withMessage(ERRORS.idCardLength),

  body("education")
    .optional({ checkFalsy: true })
    .isIn(EDUCATION_LEVELS).withMessage(ERRORS.educationInvalid),

  body("salary")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage(ERRORS.salaryInvalid),

  body("skills")
    .optional({ checkFalsy: true })
    .isLength({ max: 300 }).withMessage(ERRORS.skillsMax),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("joiningDate")
    .optional({ checkFalsy: true })
    .isDate().withMessage(ERRORS.joiningDateInvalid),

  body("teacherType")
    .optional({ checkFalsy: true })
    .custom((value) => {
      // Parse JSON string if needed
      let types;
      try {
        types = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        throw new Error("د ښوونکي ډول په سمه توګه نه دی لیږل شوی");
      }

      // Must be an array with at least one value
      if (!Array.isArray(types) || types.length === 0) {
        throw new Error("د ښوونکي ډول اړین دی - لږترلږه یو ډول وټاکئ");
      }

      // All values must be valid types
      const invalidTypes = types.filter(type => !TEACHER_TYPES.includes(type));
      if (invalidTypes.length > 0) {
        throw new Error("د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي");
      }

      return true;
    }),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

export const createApplicantValidator = [
  body("name")
    .notEmpty().withMessage(ERRORS.nameRequired)
    .matches(nameRegex).withMessage(ERRORS.nameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.nameLength),

  body("fatherName")
    .notEmpty().withMessage(ERRORS.fatherNameRequired)
    .matches(nameRegex).withMessage(ERRORS.fatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fatherNameLength),

  body("phone")
    .notEmpty().withMessage(ERRORS.phoneRequired)
    .matches(phoneRegex).withMessage(ERRORS.phoneInvalid),

  body("education")
    .notEmpty().withMessage(ERRORS.educationRequired)
    .isIn(EDUCATION_LEVELS).withMessage(ERRORS.educationInvalid),

  body("skills")
    .optional({ checkFalsy: true })
    .isLength({ max: 300 }).withMessage(ERRORS.skillsMax),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("appliedAt")
    .optional({ checkFalsy: true })
    .isDate().withMessage("د غوښتنې نېټه باید سمه وي"),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

export const updateApplicantValidator = [
  body("name")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.nameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.nameLength),

  body("fatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.fatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fatherNameLength),

  body("phone")
    .optional({ checkFalsy: true })
    .matches(phoneRegex).withMessage(ERRORS.phoneInvalid),

  body("education")
    .optional({ checkFalsy: true })
    .isIn(EDUCATION_LEVELS).withMessage(ERRORS.educationInvalid),

  body("skills")
    .optional({ checkFalsy: true })
    .isLength({ max: 300 }).withMessage(ERRORS.skillsMax),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("appliedAt")
    .optional({ checkFalsy: true })
    .isDate().withMessage("د غوښتنې نېټه باید سمه وي"),

  body("notes")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage(ERRORS.notesMax),
];

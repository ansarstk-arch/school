import { body } from "express-validator";

const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
const addressRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s,.-]+$/;
const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;

const GENDERS = ["Male", "Female"];
const ENROLLMENT_TYPES = ["School", "Center", "Madrasa"];

// Pashto error messages
const ERRORS = {
  fullNameRequired: "بشپړ نوم اړین دی",
  fullNameInvalid: "نوم یوازې پښتو، دري یا انګلیسي توري ولري",
  fullNameLength: "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي",
  fatherNameRequired: "د پلار نوم اړین دی",
  fatherNameInvalid: "د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري",
  fatherNameLength: "د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي",
  grandFatherNameInvalid: "د نیکه نوم یوازې پښتو، دري یا انګلیسي توري ولري",
  grandFatherNameLength: "د نیکه نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي",
  parentNumber1Required: "د والد نمبر ۱ اړین دی",
  parentNumber1Invalid: "د والد نمبر ۱ باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)",
  parentNumber2Invalid: "د والد نمبر ۲ باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)",
  idCardLength: "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي",
  genderInvalid: "جنسیت باید نر یا ښځینه وي",
  addressInvalid: "پته یوازې پښتو، دري، انګلیسي توري او عددونه ولري",
  addressMax: "پته باید د ۲۰۰ توري څخه لږه وي",
  dobInvalid: "د زېږېدنې نېټه باید سمه وي",
  academicYearRequired: "تعلیمي کال اړین دی",
  enrollmentsRequired: "لږ تر لږه یو د شمولیت ډول اړین دی",
  enrollmentsInvalid: "د شمولیت ډول باید ښوونځی، مرکز یا مدرسه وي",
  classesRequired: "د هر شمولیت لپاره ټولګی اړین دی",
  feesInvalid: "فیس باید مثبت عدد وي",
  registrationFeeInvalid: "د ثبت نام فیس باید مثبت عدد وي",
};

const baseStudentFields = [
  body("fullName")
    .notEmpty().withMessage(ERRORS.fullNameRequired)
    .matches(nameRegex).withMessage(ERRORS.fullNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fullNameLength),

  body("fatherName")
    .notEmpty().withMessage(ERRORS.fatherNameRequired)
    .matches(nameRegex).withMessage(ERRORS.fatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fatherNameLength),

  body("grandFatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.grandFatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.grandFatherNameLength),

  body("parentNumber1")
    .notEmpty().withMessage(ERRORS.parentNumber1Required)
    .matches(phoneRegex).withMessage(ERRORS.parentNumber1Invalid),

  body("parentNumber2")
    .optional({ checkFalsy: true })
    .matches(phoneRegex).withMessage(ERRORS.parentNumber2Invalid),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 5, max: 20 }).withMessage(ERRORS.idCardLength),

  body("gender")
    .notEmpty().withMessage(ERRORS.genderInvalid)
    .isIn(GENDERS).withMessage(ERRORS.genderInvalid),

  body("dob")
    .optional({ checkFalsy: true })
    .isDate().withMessage(ERRORS.dobInvalid),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("academicYear")
    .notEmpty().withMessage(ERRORS.academicYearRequired),

  body("enrollments")
    .notEmpty().withMessage(ERRORS.enrollmentsRequired)
    .custom((value) => {
      // Parse if it's a JSON string (from FormData)
      let parsed = value;
      if (typeof value === 'string') {
        try {
          parsed = JSON.parse(value);
        } catch (e) {
          return false;
        }
      }
      
      // Check if it's an array with at least one item
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(ERRORS.enrollmentsRequired);
      }
      
      // Check if all values are valid enrollment types
      if (!parsed.every((v) => ENROLLMENT_TYPES.includes(v))) {
        throw new Error(ERRORS.enrollmentsInvalid);
      }
      
      return true;
    }),

  body("classes")
    .notEmpty().withMessage(ERRORS.classesRequired)
    .custom((value, { req }) => {
      // Parse enrollments if it's a JSON string
      let enrollments = req.body.enrollments || [];
      if (typeof enrollments === 'string') {
        try {
          enrollments = JSON.parse(enrollments);
        } catch (e) {
          enrollments = [];
        }
      }
      
      // Parse classes if it's a JSON string
      let classes = value;
      if (typeof value === 'string') {
        try {
          classes = JSON.parse(value);
        } catch (e) {
          throw new Error(ERRORS.classesRequired);
        }
      }
      
      if (typeof classes !== 'object' || classes === null) {
        throw new Error(ERRORS.classesRequired);
      }
      
      // Ensure each enrollment type has a class ID
      for (const type of enrollments) {
        if (!classes[type]) {
          throw new Error(`د ${type} لپاره ټولګی اړین دی`);
        }
      }
      return true;
    }),

  body("fees")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(ERRORS.feesInvalid);
      return true;
    }),

  body("registrationFee")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage(ERRORS.registrationFeeInvalid),

  body("rollNumber")
    .optional({ checkFalsy: true })
    .isString(),

  body("section")
    .optional({ checkFalsy: true })
    .isString(),
];

export const createStudentValidator = baseStudentFields;

export const updateStudentValidator = [
  body("fullName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.fullNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fullNameLength),

  body("fatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.fatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.fatherNameLength),

  body("grandFatherName")
    .optional({ checkFalsy: true })
    .matches(nameRegex).withMessage(ERRORS.grandFatherNameInvalid)
    .isLength({ min: 2, max: 100 }).withMessage(ERRORS.grandFatherNameLength),

  body("parentNumber1")
    .optional({ checkFalsy: true })
    .matches(phoneRegex).withMessage(ERRORS.parentNumber1Invalid),

  body("parentNumber2")
    .optional({ checkFalsy: true })
    .matches(phoneRegex).withMessage(ERRORS.parentNumber2Invalid),

  body("idCardNumber")
    .optional({ checkFalsy: true })
    .isLength({ min: 5, max: 20 }).withMessage(ERRORS.idCardLength),

  body("gender")
    .optional({ checkFalsy: true })
    .isIn(GENDERS).withMessage(ERRORS.genderInvalid),

  body("dob")
    .optional({ checkFalsy: true })
    .isDate().withMessage(ERRORS.dobInvalid),

  body("address")
    .optional({ checkFalsy: true })
    .matches(addressRegex).withMessage(ERRORS.addressInvalid)
    .isLength({ max: 200 }).withMessage(ERRORS.addressMax),

  body("academicYear")
    .optional({ checkFalsy: true })
    .isString(),

  body("enrollments")
    .optional({ checkFalsy: true })
    .custom((value) => {
      // Parse if it's a JSON string (from FormData)
      let parsed = value;
      if (typeof value === 'string') {
        try {
          parsed = JSON.parse(value);
        } catch (e) {
          return false;
        }
      }
      
      // If provided, check if it's an array with at least one item
      if (parsed !== undefined && parsed !== null) {
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error(ERRORS.enrollmentsRequired);
        }
        
        // Check if all values are valid enrollment types
        if (!parsed.every((v) => ENROLLMENT_TYPES.includes(v))) {
          throw new Error(ERRORS.enrollmentsInvalid);
        }
      }
      
      return true;
    }),

  body("classes")
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      // Parse enrollments if it's a JSON string
      let enrollments = req.body.enrollments || [];
      if (typeof enrollments === 'string') {
        try {
          enrollments = JSON.parse(enrollments);
        } catch (e) {
          enrollments = [];
        }
      }
      
      // Parse classes if it's a JSON string
      let classes = value;
      if (typeof value === 'string') {
        try {
          classes = JSON.parse(value);
        } catch (e) {
          return true; // Optional field, so parsing error is okay
        }
      }
      
      if (classes && typeof classes === 'object' && enrollments.length > 0) {
        for (const type of enrollments) {
          if (!classes[type]) {
            throw new Error(`د ${type} لپاره ټولګی اړین دی`);
          }
        }
      }
      return true;
    }),

  body("fees")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(ERRORS.feesInvalid);
      } catch { throw new Error(ERRORS.feesInvalid); }
      return true;
    }),

  body("registrationFee")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage(ERRORS.registrationFeeInvalid),

  body("rollNumber")
    .optional({ checkFalsy: true })
    .isString(),

  body("section")
    .optional({ checkFalsy: true })
    .isString(),
];

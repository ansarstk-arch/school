import { body, query, param } from "express-validator";

// ─── ERROR MESSAGES (Pashto) ───────────────────────────────────────────────────

const ERRORS = {
  // Common
  personTypeRequired: "د کس ډول اړین دی",
  personTypeInvalid: "د کس ډول باید Teacher یا Staff وي",
  personIdRequired: "د کس ID اړین دی",
  personIdInvalid: "د کس ID باید یو مثبت عدد وي",
  monthRequired: "میاشت اړینه ده",
  monthInvalid: "میاشت باید د YYYY-MM په بڼه وي (مثال: 1403-01)",
  academicYearRequired: "تعلیمي کال اړین دی",
  academicYearInvalid: "تعلیمي کال باید ۴ عدده وي",
  
  // Salary
  baseSalaryRequired: "اصلي معاش اړین دی",
  baseSalaryInvalid: "اصلي معاش باید یو مثبت عدد وي",
  allowancesInvalid: "علاوې باید یو مثبت عدد وي",
  bonusesInvalid: "انعامونه باید یو مثبت عدد وي",
  deductionsInvalid: "کسرونه باید یو مثبت عدد وي",
  paidAmountInvalid: "ورکړل شوی معاش باید یو مثبت عدد وي",
  paymentStatusInvalid: "د تادیې حالت باید Pending، Partial یا Paid وي",
  paymentMethodInvalid: "د تادیې طریقه باید Cash، Bank یا Check وي",
  workingDaysInvalid: "کاري ورځې باید ۱ څخه تر ۳۱ پورې وي",
  notesInvalid: "یادښتونه باید د ۵۰۰ تورو څخه کم وي",
  
  // Advance
  advanceTypeRequired: "د پیشکي ډول اړین دی",
  advanceTypeInvalid: "د پیشکي ډول باید Advance یا Loan وي",
  amountRequired: "اندازه اړینه ده",
  amountInvalid: "اندازه باید یو مثبت عدد وي",
  requestDateRequired: "د غوښتنې نیټه اړینه ده",
  requestDateInvalid: "د غوښتنې نیټه باید د YYYY-MM-DD په بڼه وي",
  statusInvalid: "حالت باید Pending، Approved، Rejected، Completed یا Cancelled وي",
  installmentsInvalid: "قسطونه باید ۱ څخه تر ۳۶ پورې وي",
  monthlyDeductionInvalid: "میاشتنی کسر باید یو مثبت عدد وي",
  reasonInvalid: "دلیل باید د ۵۰۰ تورو څخه کم وي",
  
  // Bulk Generate
  personIdsRequired: "د کسانو IDs اړین دی",
  personIdsInvalid: "د کسانو IDs باید یو array وي",
  personIdsEmpty: "لږ تر لږه یو کس غوره کړئ",
};

// ─── GENERATE SALARY VALIDATOR ─────────────────────────────────────────────────

export const generateSalaryValidator = [
  body("personType")
    .notEmpty().withMessage(ERRORS.personTypeRequired)
    .isIn(["Teacher", "Staff"]).withMessage(ERRORS.personTypeInvalid),
  
  body("personId")
    .notEmpty().withMessage(ERRORS.personIdRequired)
    .isInt({ min: 1 }).withMessage(ERRORS.personIdInvalid),
  
  body("month")
    .notEmpty().withMessage(ERRORS.monthRequired)
    .matches(/^\d{4}-\d{2}$/).withMessage(ERRORS.monthInvalid),
  
  body("academicYear")
    .notEmpty().withMessage(ERRORS.academicYearRequired)
    .matches(/^\d{4}$/).withMessage(ERRORS.academicYearInvalid),
  
  body("baseSalary")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.baseSalaryInvalid),
  
  body("allowances")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.allowancesInvalid),
  
  body("bonuses")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.bonusesInvalid),
  
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesInvalid),
];

// ─── BULK GENERATE SALARY VALIDATOR ────────────────────────────────────────────

export const bulkGenerateSalaryValidator = [
  body("personType")
    .notEmpty().withMessage(ERRORS.personTypeRequired)
    .isIn(["Teacher", "Staff", "All"]).withMessage(ERRORS.personTypeInvalid),
  
  body("month")
    .notEmpty().withMessage(ERRORS.monthRequired)
    .matches(/^\d{4}-\d{2}$/).withMessage(ERRORS.monthInvalid),
  
  body("academicYear")
    .notEmpty().withMessage(ERRORS.academicYearRequired)
    .matches(/^\d{4}$/).withMessage(ERRORS.academicYearInvalid),
  
  body("personIds")
    .optional()
    .isArray().withMessage(ERRORS.personIdsInvalid),
];

// ─── UPDATE SALARY VALIDATOR ───────────────────────────────────────────────────

export const updateSalaryValidator = [
  param("id")
    .notEmpty().withMessage("د معاش ID اړین دی")
    .isInt({ min: 1 }).withMessage("د معاش ID باید یو مثبت عدد وي"),
  
  body("allowances")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.allowancesInvalid),
  
  body("bonuses")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.bonusesInvalid),
  
  body("deductions")
    .optional()
    .isFloat({ min: 0 }).withMessage(ERRORS.deductionsInvalid),
  
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesInvalid),
];

// ─── PAY SALARY VALIDATOR ──────────────────────────────────────────────────────

export const paySalaryValidator = [
  param("id")
    .notEmpty().withMessage("د معاش ID اړین دی")
    .isInt({ min: 1 }).withMessage("د معاش ID باید یو مثبت عدد وي"),
  
  body("paidAmount")
    .notEmpty().withMessage("ورکړل شوی معاش اړین دی")
    .isFloat({ min: 0 }).withMessage(ERRORS.paidAmountInvalid),
  
  body("paymentDate")
    .notEmpty().withMessage("د تادیې نیټه اړینه ده")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("د تادیې نیټه باید د YYYY-MM-DD په بڼه وي"),
  
  body("paymentMethod")
    .notEmpty().withMessage("د تادیې طریقه اړینه ده")
    .isIn(["Cash", "Bank", "Check"]).withMessage(ERRORS.paymentMethodInvalid),
  
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesInvalid),
];

// ─── GET SALARIES VALIDATOR ────────────────────────────────────────────────────

export const getSalariesValidator = [
  query("personType")
    .optional()
    .isIn(["Teacher", "Staff"]).withMessage(ERRORS.personTypeInvalid),
  
  query("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/).withMessage(ERRORS.monthInvalid),
  
  query("academicYear")
    .optional()
    .matches(/^\d{4}$/).withMessage(ERRORS.academicYearInvalid),
  
  query("paymentStatus")
    .optional()
    .isIn(["Pending", "Partial", "Paid"]).withMessage(ERRORS.paymentStatusInvalid),
  
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("د پاڼې نمبر باید یو مثبت عدد وي"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("د محدودیت باید ۱ څخه تر ۱۰۰ پورې وي"),
];

// ─── CREATE ADVANCE VALIDATOR ──────────────────────────────────────────────────

export const createAdvanceValidator = [
  body("personType")
    .notEmpty().withMessage(ERRORS.personTypeRequired)
    .isIn(["Teacher", "Staff"]).withMessage(ERRORS.personTypeInvalid),
  
  body("personId")
    .notEmpty().withMessage(ERRORS.personIdRequired)
    .isInt({ min: 1 }).withMessage(ERRORS.personIdInvalid),
  
  body("advanceType")
    .notEmpty().withMessage(ERRORS.advanceTypeRequired)
    .isIn(["Advance", "Loan"]).withMessage(ERRORS.advanceTypeInvalid),
  
  body("amount")
    .notEmpty().withMessage(ERRORS.amountRequired)
    .isFloat({ min: 1 }).withMessage(ERRORS.amountInvalid),
  
  body("requestDate")
    .notEmpty().withMessage(ERRORS.requestDateRequired)
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERRORS.requestDateInvalid),
  
  body("installments")
    .optional()
    .isInt({ min: 1, max: 36 }).withMessage(ERRORS.installmentsInvalid),
  
  body("reason")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.reasonInvalid),
  
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesInvalid),
];

// ─── UPDATE ADVANCE VALIDATOR ──────────────────────────────────────────────────

export const updateAdvanceValidator = [
  param("id")
    .notEmpty().withMessage("د پیشکي ID اړین دی")
    .isInt({ min: 1 }).withMessage("د پیشکي ID باید یو مثبت عدد وي"),
  
  body("status")
    .optional()
    .isIn(["Pending", "Approved", "Rejected", "Completed", "Cancelled"]).withMessage(ERRORS.statusInvalid),
  
  body("installments")
    .optional()
    .isInt({ min: 1, max: 36 }).withMessage(ERRORS.installmentsInvalid),
  
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesInvalid),
];

// ─── GET ADVANCES VALIDATOR ────────────────────────────────────────────────────

export const getAdvancesValidator = [
  query("personType")
    .optional()
    .isIn(["Teacher", "Staff"]).withMessage(ERRORS.personTypeInvalid),
  
  query("advanceType")
    .optional()
    .isIn(["Advance", "Loan"]).withMessage(ERRORS.advanceTypeInvalid),
  
  query("status")
    .optional()
    .isIn(["Pending", "Approved", "Rejected", "Completed", "Cancelled"]).withMessage(ERRORS.statusInvalid),
  
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("د پاڼې نمبر باید یو مثبت عدد وي"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("د محدودیت باید ۱ څخه تر ۱۰۰ پورې وي"),
];

// ─── RECORD ADVANCE PAYMENT VALIDATOR ──────────────────────────────────────────

export const recordAdvancePaymentValidator = [
  param("id")
    .notEmpty().withMessage("د پیشکي ID اړین دی")
    .isInt({ min: 1 }).withMessage("د پیشکي ID باید یو مثبت عدد وي"),
  
  body("amount")
    .notEmpty().withMessage(ERRORS.amountRequired)
    .isFloat({ min: 1 }).withMessage(ERRORS.amountInvalid),
  
  body("paymentDate")
    .notEmpty().withMessage("د تادیې نیټه اړینه ده")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("د تادیې نیټه باید د YYYY-MM-DD په بڼه وي"),
  
  body("paymentMethod")
    .notEmpty().withMessage("د تادیې طریقه اړینه ده")
    .isIn(["Salary Deduction", "Cash", "Bank", "Check"]).withMessage("د تادیې طریقه باید Salary Deduction، Cash، Bank یا Check وي"),
  
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage(ERRORS.notesInvalid),
];

export default {
  generateSalaryValidator,
  bulkGenerateSalaryValidator,
  updateSalaryValidator,
  paySalaryValidator,
  getSalariesValidator,
  createAdvanceValidator,
  updateAdvanceValidator,
  getAdvancesValidator,
  recordAdvancePaymentValidator,
};

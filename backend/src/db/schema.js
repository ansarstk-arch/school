import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

// ─── USERS (auth) ──────────────────────────────────────────────────────────────
// System users for authentication and login

export const users = sqliteTable("users", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  password:     text("password").notNull(),
  role:         text("role").notNull().default("user"), // admin | registrar | accountant | user
  permissions:  text("permissions").notNull().default("{}"), // JSON: { students: true, ... }
  isActive:     integer("is_active", { mode: "boolean" }).notNull().default(true),
  refreshToken: text("refresh_token"),
  ...timestamps,
});

// ─── STAFF ─────────────────────────────────────────────────────────────────────
// Non-teaching staff members (guards, cleaners, office staff, etc.) with salary

export const staff = sqliteTable("staff", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  name:         text("name").notNull(),
  fatherName:   text("father_name"),
  phone:        text("phone"),
  idCardNumber: text("id_card_number"),
  position:     text("position").notNull(), // Guard | Cleaner | Office Staff | Driver | etc.
  staffType:    text("staff_type").notNull().default("School"), // JSON array: ["School", "Center", "Madrasa"]
  salary:       real("salary"),
  address:      text("address"),
  joiningDate:  text("joining_date"),
  image:        text("image"),      // Profile image path
  notes:        text("notes"),
  status:       text("status").notNull().default("active"),  // active | inactive
  ...timestamps,
}, (t) => [
  index("idx_staff_position").on(t.position),
  index("idx_staff_status").on(t.status),
]);

// ─── TEACHERS ──────────────────────────────────────────────────────────────────

export const teachers = sqliteTable("teachers", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  name:         text("name").notNull(),
  fatherName:   text("father_name"),
  phone:        text("phone"),
  idCardNumber: text("id_card_number"),
  education:    text("education"),  // grade12 | grade14 | bachelor | master | phd
  teacherType:  text("teacher_type").notNull().default("School"), // JSON array: ["School", "Center", "Madrasa"]
  salary:       real("salary"),
  skills:       text("skills"),
  address:      text("address"),
  joiningDate:  text("joining_date"),
  image:        text("image"),      // Profile image path
  notes:        text("notes"),
  ...timestamps,
});

// ─── TEACHER APPLICANTS ────────────────────────────────────────────────────────

export const teacherApplicants = sqliteTable("teacher_applicants", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  name:        text("name").notNull(),
  fatherName:  text("father_name"),
  phone:       text("phone").unique(),  // Make phone unique
  education:   text("education"),
  skills:      text("skills"),
  address:     text("address"),
  appliedAt:   text("applied_at"),
  image:       text("image"),      // Profile image path
  notes:       text("notes"),
  ...timestamps,
});

// ─── CLASSES ───────────────────────────────────────────────────────────────────

export const classes = sqliteTable("classes", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  name:         text("name").notNull(),
  section:      text("section"),
  type:         text("type").notNull().default("School"), // School | Center | Madrasa
  academicYear: text("academic_year").notNull(),
  monthlyFee:   real("monthly_fee"),
  supervisorId: integer("supervisor_id").references(() => teachers.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  index("idx_classes_year").on(t.academicYear),
  index("idx_classes_type").on(t.type),
  uniqueIndex("idx_classes_unique").on(t.name, t.section, t.type, t.academicYear),
]);

// ─── SUBJECTS ──────────────────────────────────────────────────────────────────

export const subjects = sqliteTable("subjects", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  name:         text("name").notNull(),
  type:         text("type").notNull().default("School"), // School | Center | Madrasa
  academicYear: text("academic_year").notNull(),
  ...timestamps,
}, (t) => [
  index("idx_subjects_type").on(t.type),
  index("idx_subjects_year").on(t.academicYear),
  uniqueIndex("idx_subjects_unique").on(t.name, t.type, t.academicYear),
]);

// ─── SUBJECT ↔ CLASS (M2M) ─────────────────────────────────────────────────────

export const subjectClasses = sqliteTable("subject_classes", {
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  classId:   integer("class_id").notNull().references(() => classes.id,   { onDelete: "cascade" }),
}, (t) => [
  uniqueIndex("idx_subject_classes_unique").on(t.subjectId, t.classId),
  index("idx_subject_classes_class").on(t.classId),
]);

// ─── STUDENTS ──────────────────────────────────────────────────────────────────

export const students = sqliteTable("students", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  rollNumber:       text("roll_number"),
  fullName:         text("full_name").notNull(),
  fatherName:       text("father_name").notNull(),
  grandFatherName:  text("grand_father_name"),
  gender:           text("gender").notNull().default("Male"),
  dob:              text("dob"),
  phone:            text("phone"),
  emergencyContact: text("emergency_contact"),
  address:          text("address"),
  idCardNumber:     text("id_card_number"),
  classId:          integer("class_id").references(() => classes.id, { onDelete: "set null" }),
  section:          text("section"),
  academicYear:     text("academic_year").notNull(),
  registrationFee:  real("registration_fee"),
  image:            text("image"),      // Profile image path
  ...timestamps,
}, (t) => [
  index("idx_students_class").on(t.classId),
  index("idx_students_year").on(t.academicYear),
  index("idx_students_name").on(t.fullName),
]);

// ─── STUDENT ENROLLMENTS ───────────────────────────────────────────────────────
// A student can be enrolled in School, Center, and/or Madrasa with different fees

export const studentEnrollments = sqliteTable("student_enrollments", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  studentId:      integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  enrollmentType: text("enrollment_type").notNull(), // School | Center | Madrasa
  monthlyFee:     real("monthly_fee"),
}, (t) => [
  uniqueIndex("idx_enrollment_unique").on(t.studentId, t.enrollmentType),
  index("idx_enrollment_student").on(t.studentId),
]);

// ─── PARENTS ───────────────────────────────────────────────────────────────────

export const parents = sqliteTable("parents", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  name:          text("name").notNull(),
  phone:         text("phone").notNull(),
  idCardNumber:  text("id_card_number"),
  instituteType: text("institute_type").notNull().default("School"), // School | Center | Madrasa | Both
  classId:       integer("class_id").references(() => classes.id, { onDelete: "set null" }),
  username:      text("username").unique(),
  password:      text("password"),
  registeredAt:  text("registered_at"),
  notes:         text("notes"),
  ...timestamps,
}, (t) => [
  index("idx_parents_class").on(t.classId),
]);

// ─── PARENT ↔ STUDENT (M2M) ────────────────────────────────────────────────────

export const parentStudents = sqliteTable("parent_students", {
  parentId:  integer("parent_id").notNull().references(() => parents.id,  { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
}, (t) => [
  uniqueIndex("idx_parent_students_unique").on(t.parentId, t.studentId),
  index("idx_parent_students_student").on(t.studentId),
]);

// ─── ATTENDANCE ────────────────────────────────────────────────────────────────
// Unified attendance system for Students and Staff

export const attendance = sqliteTable("attendance", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  attendanceType:  text("attendance_type").notNull(), // Student | Staff
  personId:        integer("person_id").notNull(),    // ID of student/staff
  institutionType: text("institution_type"),          // School | Center | Madrasa (for students)
  classId:         integer("class_id").references(() => classes.id, { onDelete: "set null" }), // For students
  attendanceDate:  text("attendance_date").notNull(), // YYYY-MM-DD
  status:          text("status"),                    // Present | Absent | Leave | null (undefined)
  attendanceMethod: text("attendance_method").notNull().default("Manual"), // Manual | QR
  scannedAt:       text("scanned_at"),                // Timestamp for QR scans
  notes:           text("notes"),                     // Optional notes
  takenBy:         integer("taken_by").references(() => users.id, { onDelete: "set null" }),
  // Audit trail fields
  updatedBy:       integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  changeReason:    text("change_reason"),             // Reason for attendance change
  originalStatus:  text("original_status"),           // Track status changes
  ...timestamps,
}, (t) => [
  // Prevent duplicate attendance for same person on same date
  uniqueIndex("idx_attendance_unique").on(t.attendanceType, t.personId, t.attendanceDate),
  index("idx_attendance_type").on(t.attendanceType),
  index("idx_attendance_date").on(t.attendanceDate),
  index("idx_attendance_person").on(t.personId),
  index("idx_attendance_class").on(t.classId),
  index("idx_attendance_method").on(t.attendanceMethod),
  index("idx_attendance_status").on(t.status),
  index("idx_attendance_updated_by").on(t.updatedBy),
]);

// ─── EXAMS ─────────────────────────────────────────────────────────────────────

export const exams = sqliteTable("exams", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  examTitle:      text("exam_title").notNull(),
  examType:       text("exam_type").notNull().default("Custom"), // FirstTerm | Annual | Custom
  institutionType: text("institution_type").notNull().default("School"), // School | Center | Madrasa
  assignedClasses: text("assigned_classes").notNull(), // JSON array of class IDs
  startDate:      text("start_date").notNull(),
  endDate:        text("end_date").notNull(),
  status:         text("status").notNull().default("فعال"), // فعال | غیر فعال
  academicYear:   text("academic_year").notNull(),
  createdAt:      text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt:      text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index("idx_exams_institution").on(t.institutionType),
  index("idx_exams_year").on(t.academicYear),
  index("idx_exams_status").on(t.status),
  index("idx_exams_start_date").on(t.startDate),
  index("idx_exams_type").on(t.examType),
]);

// ─── EXAM RESULTS (legacy aggregate) ───────────────────────────────────────────

export const examResults = sqliteTable("exam_results", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  examId:    integer("exam_id").notNull().references(() => exams.id,    { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  marks:     real("marks"),
  notes:     text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  uniqueIndex("idx_exam_results_unique").on(t.examId, t.studentId),
  index("idx_exam_results_student").on(t.studentId),
]);

// ─── EXAM SUBJECT CONFIG ───────────────────────────────────────────────────────
// Per exam + class + subject: total marks and passing marks

export const examSubjectConfig = sqliteTable("exam_subject_config", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  examId:          integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  classId:         integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId:       integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  institutionType: text("institution_type").notNull(), // School | Center | Madrasa
  totalMarks:      real("total_marks").notNull(),
  passingMarks:    real("passing_marks").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("idx_exam_subject_config_unique").on(t.examId, t.classId, t.subjectId),
  index("idx_exam_subject_config_exam").on(t.examId),
  index("idx_exam_subject_config_class").on(t.classId),
]);

// ─── STUDENT MARKS ─────────────────────────────────────────────────────────────
// One row per student per subject per exam

export const studentMarks = sqliteTable("student_marks", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  examId:          integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  classId:         integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId:       integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  studentId:       integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  institutionType: text("institution_type").notNull(),
  obtainedMarks:   real("obtained_marks"),
  status:          text("status").notNull().default("Pass"), // Pass | Fail | Absent
  remarks:         text("remarks"),
  ...timestamps,
}, (t) => [
  uniqueIndex("idx_student_marks_unique").on(t.examId, t.classId, t.subjectId, t.studentId),
  index("idx_student_marks_exam").on(t.examId),
  index("idx_student_marks_class").on(t.classId),
  index("idx_student_marks_subject").on(t.subjectId),
  index("idx_student_marks_student").on(t.studentId),
  index("idx_student_marks_status").on(t.status),
]);

// ─── EXAM RESULT PREP ──────────────────────────────────────────────────────────
// Prepared aggregates for future report cards (decoupled from marks entry)

export const examResultPrep = sqliteTable("exam_result_prep", {
  id:                integer("id").primaryKey({ autoIncrement: true }),
  examId:            integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  classId:           integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId:         integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  institutionType:   text("institution_type").notNull(),
  totalObtained:     real("total_obtained").default(0),
  totalPossible:     real("total_possible").default(0),
  percentage:        real("percentage").default(0),
  grade:             text("grade"),
  rank:              integer("rank"),
  gpa:               real("gpa"),
  overallStatus:     text("overall_status"), // Pass | Fail
  subjectDetails:    text("subject_details"), // JSON array of per-subject breakdown
  calculationStatus: text("calculation_status").notNull().default("pending"), // pending | ready | finalized
  ...timestamps,
}, (t) => [
  uniqueIndex("idx_exam_result_prep_unique").on(t.examId, t.classId, t.studentId),
  index("idx_exam_result_prep_exam").on(t.examId),
  index("idx_exam_result_prep_class").on(t.classId),
]);

// ─── EXPENSE CATEGORIES ────────────────────────────────────────────────────────

export const expenseCategories = sqliteTable("expense_categories", {
  id:     integer("id").primaryKey({ autoIncrement: true }),
  name:   text("name").notNull().unique(),
  nameEn: text("name_en"),
  ...timestamps,
});

// ─── EXPENSES ──────────────────────────────────────────────────────────────────

export const expenses = sqliteTable("expenses", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  title:         text("title").notNull(),
  categoryId:    integer("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  instituteType: text("institute_type").notNull().default("School"),
  periodType:    text("period_type").notNull().default("daily"), // daily | monthly | yearly
  amount:        real("amount").notNull(),
  date:          text("date").notNull(),
  description:   text("description"),
  addedBy:       integer("added_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  index("idx_expenses_date").on(t.date),
  index("idx_expenses_category").on(t.categoryId),
  index("idx_expenses_type").on(t.instituteType),
  index("idx_expenses_period").on(t.periodType),
]);

// ─── FEE PAYMENTS (Revenue) ────────────────────────────────────────────────────

export const feePayments = sqliteTable("fee_payments", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  receiptNo:     text("receipt_no").notNull().unique(),
  studentId:     integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  enrollmentType:text("enrollment_type").notNull(), // School | Center | Madrasa
  month:         text("month").notNull(),           // YYYY-MM (Shamsi)
  academicYear:  text("academic_year").notNull(),
  amount:        real("amount").notNull(),
  paid:          real("paid").notNull().default(0),
  status:        text("status").notNull().default("Unpaid"), // Paid | Partial | Unpaid
  date:          text("date").notNull(),
  collectedBy:   integer("collected_by").references(() => users.id, { onDelete: "set null" }),
  notes:         text("notes"),
  ...timestamps,
}, (t) => [
  index("idx_fees_student").on(t.studentId),
  index("idx_fees_month").on(t.month),
  index("idx_fees_status").on(t.status),
  index("idx_fees_year").on(t.academicYear),
  uniqueIndex("idx_fee_payments_unique").on(t.studentId, t.enrollmentType, t.month, t.academicYear),
]);

// ─── RELATIONS ─────────────────────────────────────────────────────────────────

export const classesRelations = relations(classes, ({ one, many }) => ({
  supervisor:   one(teachers, { fields: [classes.supervisorId], references: [teachers.id] }),
  students:     many(students),
  subjectLinks: many(subjectClasses),
  attendance:   many(attendance),
  exams:        many(exams),
  parents:      many(parents),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classLinks: many(subjectClasses),
  exams:      many(exams),
}));

export const subjectClassesRelations = relations(subjectClasses, ({ one }) => ({
  subject: one(subjects, { fields: [subjectClasses.subjectId], references: [subjects.id] }),
  class:   one(classes,  { fields: [subjectClasses.classId],   references: [classes.id]  }),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  supervisedClasses: many(classes),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class:       one(classes, { fields: [students.classId], references: [classes.id] }),
  enrollments: many(studentEnrollments),
  parentLinks: many(parentStudents),
  attendance:  many(attendance),
  examResults: many(examResults),
  marks:       many(studentMarks),
  resultPrep:  many(examResultPrep),
  feePayments: many(feePayments),
}));

export const studentEnrollmentsRelations = relations(studentEnrollments, ({ one }) => ({
  student: one(students, { fields: [studentEnrollments.studentId], references: [students.id] }),
}));

export const parentsRelations = relations(parents, ({ one, many }) => ({
  class:        one(classes, { fields: [parents.classId], references: [classes.id] }),
  studentLinks: many(parentStudents),
}));

export const parentStudentsRelations = relations(parentStudents, ({ one }) => ({
  parent:  one(parents,  { fields: [parentStudents.parentId],  references: [parents.id]  }),
  student: one(students, { fields: [parentStudents.studentId], references: [students.id] }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  class:     one(classes, { fields: [attendance.classId],   references: [classes.id] }),
  takenBy:   one(users,   { fields: [attendance.takenBy],  references: [users.id]   }),
  updatedBy: one(users,   { fields: [attendance.updatedBy], references: [users.id]  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  results:        many(examResults),
  subjectConfigs: many(examSubjectConfig),
  studentMarks:   many(studentMarks),
  resultPrep:     many(examResultPrep),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  exam:    one(exams,    { fields: [examResults.examId],    references: [exams.id]    }),
  student: one(students, { fields: [examResults.studentId], references: [students.id] }),
}));

export const examSubjectConfigRelations = relations(examSubjectConfig, ({ one }) => ({
  exam:    one(exams,    { fields: [examSubjectConfig.examId],    references: [exams.id]    }),
  class:   one(classes,  { fields: [examSubjectConfig.classId],   references: [classes.id]  }),
  subject: one(subjects, { fields: [examSubjectConfig.subjectId], references: [subjects.id] }),
}));

export const studentMarksRelations = relations(studentMarks, ({ one }) => ({
  exam:    one(exams,    { fields: [studentMarks.examId],    references: [exams.id]    }),
  class:   one(classes,  { fields: [studentMarks.classId],   references: [classes.id]  }),
  subject: one(subjects, { fields: [studentMarks.subjectId], references: [subjects.id] }),
  student: one(students, { fields: [studentMarks.studentId], references: [students.id] }),
}));

export const examResultPrepRelations = relations(examResultPrep, ({ one }) => ({
  exam:    one(exams,    { fields: [examResultPrep.examId],    references: [exams.id]    }),
  class:   one(classes,  { fields: [examResultPrep.classId],   references: [classes.id]  }),
  student: one(students, { fields: [examResultPrep.studentId], references: [students.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, { fields: [expenses.categoryId], references: [expenseCategories.id] }),
  addedBy:  one(users,             { fields: [expenses.addedBy],    references: [users.id]             }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  student:     one(students, { fields: [feePayments.studentId],   references: [students.id] }),
  collectedBy: one(users,    { fields: [feePayments.collectedBy], references: [users.id]   }),
}));

// ─── SALARIES ──────────────────────────────────────────────────────────────────

export const salaries = sqliteTable("salaries", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  personType:      text("person_type").notNull(), // Teacher | Staff
  personId:        integer("person_id").notNull(),
  month:           text("month").notNull(),        // YYYY-MM (Shamsi: 1403-01)
  academicYear:    text("academic_year").notNull(),
  
  // Salary Components
  baseSalary:      real("base_salary").notNull(),
  allowances:      real("allowances").default(0),
  bonuses:         real("bonuses").default(0),
  deductions:      real("deductions").default(0),
  
  // Calculated
  grossSalary:     real("gross_salary").notNull(), // base + allowances + bonuses
  netSalary:       real("net_salary").notNull(),   // gross - deductions
  
  // Payment
  paidAmount:      real("paid_amount").default(0),
  paymentStatus:   text("payment_status").notNull().default("Pending"), // Pending | Partial | Paid
  paymentDate:     text("payment_date"),
  paymentMethod:   text("payment_method"),         // Cash | Bank | Check
  
  // Attendance-based
  workingDays:     integer("working_days").default(26),
  presentDays:     integer("present_days").default(0),
  absentDays:      integer("absent_days").default(0),
  leaveDays:       integer("leave_days").default(0),
  
  notes:           text("notes"),
  generatedBy:     integer("generated_by").references(() => users.id, { onDelete: "set null" }),
  paidBy:          integer("paid_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  uniqueIndex("idx_salary_unique").on(t.personType, t.personId, t.month),
  index("idx_salary_person").on(t.personType, t.personId),
  index("idx_salary_month").on(t.month),
  index("idx_salary_status").on(t.paymentStatus),
  index("idx_salary_year").on(t.academicYear),
]);

// ─── SALARY COMPONENTS ─────────────────────────────────────────────────────────

export const salaryComponents = sqliteTable("salary_components", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  salaryId:    integer("salary_id").notNull().references(() => salaries.id, { onDelete: "cascade" }),
  type:        text("type").notNull(),        // Allowance | Bonus | Deduction
  category:    text("category").notNull(),    // Housing | Transport | Advance | Loan | Absence
  amount:      real("amount").notNull(),
  description: text("description"),
  ...timestamps,
}, (t) => [
  index("idx_salary_components_salary").on(t.salaryId),
  index("idx_salary_components_type").on(t.type),
]);

// ─── ADVANCES & LOANS ──────────────────────────────────────────────────────────

export const advances = sqliteTable("advances", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  personType:      text("person_type").notNull(), // Teacher | Staff
  personId:        integer("person_id").notNull(),
  advanceType:     text("advance_type").notNull(), // Advance | Loan
  amount:          real("amount").notNull(),
  paidAmount:      real("paid_amount").default(0),
  remainingAmount: real("remaining_amount").notNull(),
  requestDate:     text("request_date").notNull(),
  approvalDate:    text("approval_date"),
  status:          text("status").notNull().default("Pending"), // Pending | Approved | Rejected | Completed | Cancelled
  installments:    integer("installments").default(1),
  monthlyDeduction: real("monthly_deduction").default(0),
  reason:          text("reason"),
  notes:           text("notes"),
  requestedBy:     integer("requested_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy:      integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  index("idx_advances_person").on(t.personType, t.personId),
  index("idx_advances_status").on(t.status),
  index("idx_advances_type").on(t.advanceType),
]);

// ─── ADVANCE PAYMENTS ──────────────────────────────────────────────────────────

export const advancePayments = sqliteTable("advance_payments", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  advanceId:     integer("advance_id").notNull().references(() => advances.id, { onDelete: "cascade" }),
  salaryId:      integer("salary_id").references(() => salaries.id, { onDelete: "set null" }),
  amount:        real("amount").notNull(),
  paymentDate:   text("payment_date").notNull(),
  paymentMethod: text("payment_method"),
  notes:         text("notes"),
  recordedBy:    integer("recorded_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  index("idx_advance_payments_advance").on(t.advanceId),
  index("idx_advance_payments_salary").on(t.salaryId),
]);

// ─── RELATIONS ─────────────────────────────────────────────────────────────────

export const salariesRelations = relations(salaries, ({ one, many }) => ({
  generatedByUser: one(users, { fields: [salaries.generatedBy], references: [users.id] }),
  paidByUser:      one(users, { fields: [salaries.paidBy],      references: [users.id] }),
  components:      many(salaryComponents),
  advancePayments: many(advancePayments),
}));

export const salaryComponentsRelations = relations(salaryComponents, ({ one }) => ({
  salary: one(salaries, { fields: [salaryComponents.salaryId], references: [salaries.id] }),
}));

export const advancesRelations = relations(advances, ({ one, many }) => ({
  requestedByUser: one(users, { fields: [advances.requestedBy], references: [users.id] }),
  approvedByUser:  one(users, { fields: [advances.approvedBy],  references: [users.id] }),
  payments:        many(advancePayments),
}));

export const advancePaymentsRelations = relations(advancePayments, ({ one }) => ({
  advance:       one(advances, { fields: [advancePayments.advanceId], references: [advances.id] }),
  salary:        one(salaries, { fields: [advancePayments.salaryId],  references: [salaries.id] }),
  recordedByUser: one(users,   { fields: [advancePayments.recordedBy], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  attendanceTaken:   many(attendance),
  expensesAdded:     many(expenses),
  feesCollected:     many(feePayments),
  salariesGenerated: many(salaries),
  advancesRequested: many(advances),
}));

// ─── ATTENDANCE SETTINGS ───────────────────────────────────────────────────────
// Configure attendance timing and off days for each institution type

export const attendanceSettings = sqliteTable("attendance_settings", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  institutionType: text("institution_type").notNull().unique(), // School | Center | Madrasa
  cutoffTime:      text("cutoff_time").notNull(), // HH:MM format (e.g., "09:00")
  offDays:         text("off_days").notNull().default("[]"), // JSON array of day numbers [0=Sunday, 5=Friday]
  isActive:        integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (t) => [
  index("idx_attendance_settings_type").on(t.institutionType),
]);

// ─── STUDENT PROMOTIONS ────────────────────────────────────────────────────────
// Track student promotions from one class to another

export const studentPromotions = sqliteTable("student_promotions", {
  id:                   integer("id").primaryKey({ autoIncrement: true }),
  studentId:            integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  
  // From (Current)
  fromClassId:          integer("from_class_id").notNull().references(() => classes.id),
  fromSection:          text("from_section"),
  fromAcademicYear:     text("from_academic_year").notNull(),
  fromInstitutionType:  text("from_institution_type").notNull(), // School | Center | Madrasa
  
  // To (New)
  toClassId:            integer("to_class_id").notNull().references(() => classes.id),
  toSection:            text("to_section"),
  toAcademicYear:       text("to_academic_year").notNull(),
  toInstitutionType:    text("to_institution_type").notNull(),
  
  // Promotion Details
  promotionType:        text("promotion_type").notNull(), // Individual | Bulk | YearEnd
  promotionStatus:      text("promotion_status").notNull(), // Promoted | Repeated | Detained | Transferred
  promotionDate:        text("promotion_date").notNull(), // YYYY-MM-DD
  
  // Criteria
  basedOn:              text("based_on"), // Marks | Manual | Attendance
  totalMarks:           real("total_marks"),
  obtainedMarks:        real("obtained_marks"),
  percentage:           real("percentage"),
  attendancePercentage: real("attendance_percentage"),
  
  // Metadata
  remarks:              text("remarks"),
  promotedBy:           integer("promoted_by").references(() => users.id, { onDelete: "set null" }),
  isActive:             integer("is_active", { mode: "boolean" }).notNull().default(true), // For rollback
  
  ...timestamps,
}, (t) => [
  index("idx_student_promotions_student").on(t.studentId),
  index("idx_student_promotions_from_class").on(t.fromClassId),
  index("idx_student_promotions_to_class").on(t.toClassId),
  index("idx_student_promotions_year").on(t.fromAcademicYear, t.toAcademicYear),
  index("idx_student_promotions_date").on(t.promotionDate),
  index("idx_student_promotions_status").on(t.promotionStatus),
  index("idx_student_promotions_active").on(t.isActive),
]);

// ─── PROMOTION BATCHES ─────────────────────────────────────────────────────────
// Track bulk promotion operations

export const promotionBatches = sqliteTable("promotion_batches", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  batchName:        text("batch_name").notNull(),
  batchType:        text("batch_type").notNull(), // ClassPromotion | YearEndPromotion
  
  fromClassId:      integer("from_class_id").references(() => classes.id),
  toClassId:        integer("to_class_id").references(() => classes.id),
  fromAcademicYear: text("from_academic_year").notNull(),
  toAcademicYear:   text("to_academic_year").notNull(),
  institutionType:  text("institution_type").notNull(),
  
  totalStudents:    integer("total_students").default(0),
  promotedCount:    integer("promoted_count").default(0),
  repeatedCount:    integer("repeated_count").default(0),
  failedCount:      integer("failed_count").default(0),
  
  status:           text("status").notNull().default("Pending"), // Pending | InProgress | Completed | Failed | RolledBack
  startedAt:        text("started_at"),
  completedAt:      text("completed_at"),
  
  promotedBy:       integer("promoted_by").references(() => users.id, { onDelete: "set null" }),
  remarks:          text("remarks"),
  
  ...timestamps,
}, (t) => [
  index("idx_promotion_batches_year").on(t.fromAcademicYear, t.toAcademicYear),
  index("idx_promotion_batches_status").on(t.status),
  index("idx_promotion_batches_type").on(t.batchType),
]);

// ─── PROMOTION RULES ───────────────────────────────────────────────────────────
// Define promotion criteria and rules

export const promotionRules = sqliteTable("promotion_rules", {
  id:                      integer("id").primaryKey({ autoIncrement: true }),
  ruleName:                text("rule_name").notNull(),
  institutionType:         text("institution_type").notNull(),
  fromClassId:             integer("from_class_id").references(() => classes.id),
  academicYear:            text("academic_year").notNull(),
  
  // Criteria
  minPercentage:           real("min_percentage"), // Minimum percentage to pass
  minAttendance:           real("min_attendance"), // Minimum attendance percentage
  requireAllSubjectsPass:  integer("require_all_subjects_pass", { mode: "boolean" }).default(false),
  
  // Actions
  autoPromote:             integer("auto_promote", { mode: "boolean" }).default(false),
  
  isActive:                integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy:               integer("created_by").references(() => users.id, { onDelete: "set null" }),
  
  ...timestamps,
}, (t) => [
  index("idx_promotion_rules_class").on(t.fromClassId),
  index("idx_promotion_rules_year").on(t.academicYear),
  index("idx_promotion_rules_active").on(t.isActive),
]);

// ─── PROMOTION RELATIONS ───────────────────────────────────────────────────────

export const studentPromotionsRelations = relations(studentPromotions, ({ one }) => ({
  student:    one(students, { fields: [studentPromotions.studentId],   references: [students.id] }),
  fromClass:  one(classes,  { fields: [studentPromotions.fromClassId], references: [classes.id] }),
  toClass:    one(classes,  { fields: [studentPromotions.toClassId],   references: [classes.id] }),
  promotedBy: one(users,    { fields: [studentPromotions.promotedBy],  references: [users.id]   }),
}));

export const promotionBatchesRelations = relations(promotionBatches, ({ one }) => ({
  fromClass:  one(classes, { fields: [promotionBatches.fromClassId], references: [classes.id] }),
  toClass:    one(classes, { fields: [promotionBatches.toClassId],   references: [classes.id] }),
  promotedBy: one(users,   { fields: [promotionBatches.promotedBy],  references: [users.id]   }),
}));

export const promotionRulesRelations = relations(promotionRules, ({ one }) => ({
  fromClass: one(classes, { fields: [promotionRules.fromClassId], references: [classes.id] }),
  createdBy: one(users,   { fields: [promotionRules.createdBy],   references: [users.id]   }),
}));

// ─── SMS SETTINGS ──────────────────────────────────────────────────────────────
// SMS API configuration and credentials

export const smsSettings = sqliteTable("sms_settings", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  providerName:    text("provider_name").notNull().default("Custom API"),
  apiUrl:          text("api_url").notNull(),
  apiPort:         text("api_port"),
  apiToken:        text("api_token"),
  apiUsername:     text("api_username"),
  apiPassword:     text("api_password"),
  authMethod:      text("auth_method").notNull().default("token"), // token | basic | bearer
  tokenPlacement:  text("token_placement").notNull().default("header"), // header | query | body
  requestMethod:   text("request_method").notNull().default("POST"), // POST | GET
  phoneField:      text("phone_field").notNull().default("phone"), // API field name for phone
  messageField:    text("message_field").notNull().default("message"), // API field name for message
  isActive:        integer("is_active", { mode: "boolean" }).notNull().default(true),
  smsBalance:      integer("sms_balance").default(0),
  lastTestedAt:    text("last_tested_at"),
  ...timestamps,
});

// ─── SMS TEMPLATES ─────────────────────────────────────────────────────────────
// Message templates with variables

export const smsTemplates = sqliteTable("sms_templates", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  templateType: text("template_type").notNull(), // Absent | Fee | ExamPass | ExamFail | Homework | Custom
  templateName: text("template_name").notNull(),
  messagePs:    text("message_ps").notNull(), // Pashto message
  messageDa:    text("message_da"), // Dari message (optional)
  variables:    text("variables").notNull().default("[]"), // JSON array: ["studentName", "className"]
  isActive:     integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (t) => [
  index("idx_sms_templates_type").on(t.templateType),
]);

// ─── SMS LOGS ──────────────────────────────────────────────────────────────────
// Track all sent SMS messages

export const smsLogs = sqliteTable("sms_logs", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  batchId:         text("batch_id").notNull(), // Group related SMS
  recipientType:   text("recipient_type").notNull(), // Parent | Staff
  recipientId:     integer("recipient_id").notNull(),
  recipientName:   text("recipient_name").notNull(),
  recipientPhone:  text("recipient_phone").notNull(),
  studentId:       integer("student_id").references(() => students.id, { onDelete: "set null" }),
  studentName:     text("student_name"),
  institutionType: text("institution_type"), // School | Center | Madrasa
  messageType:     text("message_type").notNull(), // Absent | Fee | ExamPass | ExamFail | Homework | Custom
  messageContent:  text("message_content").notNull(),
  status:          text("status").notNull().default("Pending"), // Pending | Sent | Failed
  sentAt:          text("sent_at"),
  failureReason:   text("failure_reason"),
  retryCount:      integer("retry_count").notNull().default(0),
  apiResponse:     text("api_response"), // Store API response for debugging
  sentBy:          integer("sent_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  index("idx_sms_logs_batch").on(t.batchId),
  index("idx_sms_logs_status").on(t.status),
  index("idx_sms_logs_type").on(t.messageType),
  index("idx_sms_logs_date").on(t.createdAt),
  index("idx_sms_logs_recipient").on(t.recipientType, t.recipientId),
]);

// ─── PARENT SMS PREFERENCES ────────────────────────────────────────────────────
// Parent opt-in/opt-out preferences

export const parentSmsPreferences = sqliteTable("parent_sms_preferences", {
  id:                 integer("id").primaryKey({ autoIncrement: true }),
  parentId:           integer("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
  receiveAbsentSms:   integer("receive_absent_sms", { mode: "boolean" }).notNull().default(true),
  receiveFeeSms:      integer("receive_fee_sms", { mode: "boolean" }).notNull().default(true),
  receiveExamSms:     integer("receive_exam_sms", { mode: "boolean" }).notNull().default(true),
  receiveHomeworkSms: integer("receive_homework_sms", { mode: "boolean" }).notNull().default(true),
  isBlocked:          integer("is_blocked", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
}, (t) => [
  uniqueIndex("idx_parent_sms_prefs_unique").on(t.parentId),
]);

// ─── SMS RELATIONS ─────────────────────────────────────────────────────────────

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  student: one(students, { fields: [smsLogs.studentId], references: [students.id] }),
  sentBy:  one(users,    { fields: [smsLogs.sentBy],    references: [users.id]   }),
}));

export const parentSmsPreferencesRelations = relations(parentSmsPreferences, ({ one }) => ({
  parent: one(parents, { fields: [parentSmsPreferences.parentId], references: [parents.id] }),
}));

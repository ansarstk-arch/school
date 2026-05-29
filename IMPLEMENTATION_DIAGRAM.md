# Implementation Diagram - School Management System Fixes

## Issue 1: Dashboard Year Filtering

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD COMPONENT                       │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Year Picker  │ ──────┐                                   │
│  │   (1403)     │       │                                   │
│  └──────────────┘       │                                   │
│                         │                                   │
│  ┌──────────────┐       │  Pass year parameter             │
│  │  Type Tabs   │       │  to all API calls                │
│  │ All/School/  │       │                                   │
│  │ Center/      │       │                                   │
│  │ Madrasa      │       │                                   │
│  └──────────────┘       │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────┐           │
│  │         API Calls (with year param)         │           │
│  │  • getDashboardCards(type, year)            │           │
│  │  • getRevenueExpenseChart(type, months, year)│          │
│  │  • getAttendanceChart(type, year)           │           │
│  │  • getStudentGrowthChart(type, months, year)│           │
│  │  • getMonthlyExpensesChart(type, months, year)│         │
│  │  • getYearlyStudentComparisonChart(type, year)│         │
│  │  • getFinancialSummaryChart(type, months, year)│        │
│  │  • getRecentAdmissions(type, limit, year)   │           │
│  │  • getUpcomingExams(type, limit, year)      │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND CONTROLLERS                         │
│                                                              │
│  getDashboardCards(req, res)                                │
│  ├─ Extract year from req.query.year                        │
│  ├─ Calculate date ranges (yearStart, yearEnd)              │
│  ├─ Filter students by academicYear                         │
│  ├─ Filter classes by academicYear                          │
│  ├─ Filter subjects by academicYear                         │
│  ├─ Filter feePayments by academicYear + date range        │
│  ├─ Filter expenses by date range                           │
│  ├─ Filter salaries by month range                          │
│  └─ Return filtered data                                    │
│                                                              │
│  All Chart APIs follow same pattern:                        │
│  ├─ Extract year parameter                                  │
│  ├─ Calculate date/month ranges                             │
│  ├─ Filter queries by year/date ranges                      │
│  └─ Return filtered chart data                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Issue 2.1: Marks Entry - Institution Type Filtering

### OLD FLOW (Before Fix):
```
┌──────────────────────────────────────────────────────────┐
│              MARKS ENTRY - OLD FLOW                       │
│                                                           │
│  Step 1: Select Year (1403)                              │
│           ▼                                               │
│  Step 2: Select Exam (Shows ALL exams - confusing!)      │
│           │                                               │
│           │  ┌─────────────────────────────┐             │
│           └─▶│ • څلور نیمه (School)        │             │
│              │ • سالانه (School)            │             │
│              │ • Center Exam 1 (Center)     │             │
│              │ • Madrasa Exam 1 (Madrasa)   │             │
│              └─────────────────────────────┘             │
│           ▼                                               │
│  Step 3: Select Type (School/Center/Madrasa)             │
│           ▼                                               │
│  Step 4: Select Class                                     │
│           ▼                                               │
│  Step 5: Select Subject                                   │
└──────────────────────────────────────────────────────────┘
```

### NEW FLOW (After Fix):
```
┌──────────────────────────────────────────────────────────┐
│              MARKS ENTRY - NEW FLOW                       │
│                                                           │
│  Step 1: Select Year (1403)                              │
│           ▼                                               │
│  Step 2: Select Type (School/Center/Madrasa)             │
│           │                                               │
│           │  Type = "School"                              │
│           ▼                                               │
│  Step 3: Select Exam (Shows ONLY School exams)           │
│           │                                               │
│           │  ┌─────────────────────────────┐             │
│           └─▶│ • څلور نیمه (School)        │             │
│              │ • سالانه (School)            │             │
│              └─────────────────────────────┘             │
│           ▼                                               │
│  Step 4: Select Class (Filtered by School type)          │
│           ▼                                               │
│  Step 5: Select Subject (Filtered by class)              │
│           ▼                                               │
│  Step 6: Enter Marks                                      │
└──────────────────────────────────────────────────────────┘
```

### API Flow:
```
Frontend                          Backend
   │                                 │
   │  GET /exams?                    │
   │  academicYear=1403&             │
   │  institutionType=School         │
   ├────────────────────────────────▶│
   │                                 │
   │                                 │  SELECT * FROM exams
   │                                 │  WHERE academicYear = '1403'
   │                                 │  AND institutionType = 'School'
   │                                 │
   │  Response: [                    │
   │    { id: 1, examTitle: "څلور نیمه" },
   │    { id: 2, examTitle: "سالانه" }
   │  ]                              │
   │◀────────────────────────────────┤
   │                                 │
```

---

## Issue 2.2: School Marks Total Validation

### Validation Flow:
```
┌─────────────────────────────────────────────────────────────┐
│         ADMIN CONFIGURES EXAM SUBJECT                        │
│                                                              │
│  Year: 1403                                                  │
│  Exam: څلور نیمه (4.5 Month)                                │
│  Type: School                                                │
│  Class: 1st Grade                                            │
│  Subject: Math                                               │
│  Total Marks: 40                                             │
│  Passing Marks: 16                                           │
│                                                              │
│  Click "Save" ──────────────────────────────────────┐       │
└─────────────────────────────────────────────────────│───────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND VALIDATION PROCESS                      │
│                                                              │
│  1. Validate basic marks (0 < total ≤ 100, passing ≤ total) │
│     ✓ 40 is valid                                            │
│                                                              │
│  2. Check if exam is School type                            │
│     ✓ Yes, it's School                                       │
│                                                              │
│  3. Calculate current total for Math in 1403                │
│     ┌──────────────────────────────────────┐                │
│     │ Find all School exams in year 1403   │                │
│     │ • څلور نیمه (id: 1)                  │                │
│     │ • سالانه (id: 2)                      │                │
│     └──────────────────────────────────────┘                │
│                                                              │
│     ┌──────────────────────────────────────┐                │
│     │ Get configs for Math in these exams  │                │
│     │ (excluding current exam if updating) │                │
│     │                                       │                │
│     │ Exam: سالانه                          │                │
│     │ Subject: Math                         │                │
│     │ Total Marks: 60                       │                │
│     └──────────────────────────────────────┘                │
│                                                              │
│     Current Total = 60                                       │
│                                                              │
│  4. Calculate new total                                      │
│     New Total = Current (60) + New (40) = 100               │
│                                                              │
│  5. Validate: New Total ≤ 100?                               │
│     100 ≤ 100 ✓ VALID                                        │
│                                                              │
│  6. Save configuration                                       │
│     ✓ Success                                                │
└─────────────────────────────────────────────────────────────┘
```

### Validation Failure Example:
```
┌─────────────────────────────────────────────────────────────┐
│         ADMIN TRIES TO EXCEED LIMIT                          │
│                                                              │
│  Year: 1403                                                  │
│  Exam: New Exam                                              │
│  Type: School                                                │
│  Class: 1st Grade                                            │
│  Subject: Math                                               │
│  Total Marks: 10  ← Would exceed limit!                     │
│  Passing Marks: 4                                            │
│                                                              │
│  Click "Save" ──────────────────────────────────────┐       │
└─────────────────────────────────────────────────────│───────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND VALIDATION PROCESS                      │
│                                                              │
│  1. Validate basic marks ✓                                   │
│                                                              │
│  2. Check if exam is School type ✓                           │
│                                                              │
│  3. Calculate current total for Math in 1403                │
│     Existing configs:                                        │
│     • څلور نیمه: 40 marks                                    │
│     • سالانه: 60 marks                                       │
│     Current Total = 100                                      │
│                                                              │
│  4. Calculate new total                                      │
│     New Total = 100 + 10 = 110                               │
│                                                              │
│  5. Validate: 110 ≤ 100?                                     │
│     ✗ INVALID - Exceeds limit!                               │
│                                                              │
│  6. Return error response                                    │
│     Status: 400                                              │
│     Message: "د ښوونځي امتحانونو لپاره د دې مضمون           │
│              ټولټال نمرې د 100 څخه زیاتې نشي کیدای.         │
│              اوسنی: 100، نوی به: 110 وي (پاتې: -10)"        │
└─────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND DISPLAYS ERROR                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ⚠️ Error                                           │     │
│  │                                                     │     │
│  │  د ښوونځي امتحانونو لپاره د دې مضمون ټولټال نمرې  │     │
│  │  د 100 څخه زیاتې نشي کیدای.                        │     │
│  │  اوسنی: 100، نوی به: 110 وي (پاتې: -10)           │     │
│  │                                                     │     │
│  │  [OK]                                               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Configuration NOT saved                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                           │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │    exams     │         │   classes    │                  │
│  ├──────────────┤         ├──────────────┤                  │
│  │ id           │         │ id           │                  │
│  │ examTitle    │         │ name         │                  │
│  │ institutionType ◀──┐   │ type         │                  │
│  │ academicYear │      │   │ academicYear │                  │
│  │ assignedClasses│    │   │ section      │                  │
│  │ startDate    │      │   └──────────────┘                  │
│  │ endDate      │      │                                     │
│  │ status       │      │                                     │
│  └──────┬───────┘      │   ┌──────────────┐                  │
│         │              │   │   subjects   │                  │
│         │              │   ├──────────────┤                  │
│         │              │   │ id           │                  │
│         │              │   │ name         │                  │
│         │              └───│ type         │                  │
│         │                  │ academicYear │                  │
│         │                  └──────┬───────┘                  │
│         │                         │                          │
│         │                         │                          │
│         ▼                         ▼                          │
│  ┌────────────────────────────────────────┐                  │
│  │      examSubjectConfig                 │                  │
│  ├────────────────────────────────────────┤                  │
│  │ id                                     │                  │
│  │ examId          (FK → exams.id)        │                  │
│  │ classId         (FK → classes.id)      │                  │
│  │ subjectId       (FK → subjects.id)     │                  │
│  │ institutionType                        │                  │
│  │ totalMarks      ← VALIDATED!           │                  │
│  │ passingMarks                           │                  │
│  │ createdAt                              │                  │
│  │ updatedAt                              │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
│  VALIDATION QUERY:                                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │ SELECT SUM(totalMarks)                             │     │
│  │ FROM examSubjectConfig                             │     │
│  │ WHERE subjectId = ?                                │     │
│  │   AND classId = ?                                  │     │
│  │   AND examId IN (                                  │     │
│  │     SELECT id FROM exams                           │     │
│  │     WHERE institutionType = 'School'               │     │
│  │       AND academicYear = ?                         │     │
│  │   )                                                │     │
│  │   AND examId != ? (exclude current if updating)    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Rules Summary

```
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION RULES BY INSTITUTION TYPE            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  SCHOOL (ښوونځی)                                   │     │
│  │  ─────────────────────────────────────────────────  │     │
│  │  • Total marks per subject per class per year:     │     │
│  │    MUST NOT EXCEED 100                             │     │
│  │                                                     │     │
│  │  • Validation applies across ALL School exams      │     │
│  │    in the same academic year                       │     │
│  │                                                     │     │
│  │  • Example:                                        │     │
│  │    Math in 1st Grade for year 1403:               │     │
│  │    ├─ څلور نیمه: 40 marks                          │     │
│  │    ├─ سالانه: 60 marks                             │     │
│  │    └─ Total: 100 marks ✓                           │     │
│  │                                                     │     │
│  │  • Cannot add more exams if total = 100            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  CENTER (مرکز)                                      │     │
│  │  ─────────────────────────────────────────────────  │     │
│  │  • NO LIMIT on total marks                         │     │
│  │  • Can have any total marks per subject            │     │
│  │  • Validation only checks:                         │     │
│  │    - Total marks > 0                               │     │
│  │    - Passing marks ≤ Total marks                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  MADRASA (مدرسه)                                    │     │
│  │  ─────────────────────────────────────────────────  │     │
│  │  • NO LIMIT on total marks                         │     │
│  │  • Can have any total marks per subject            │     │
│  │  • Validation only checks:                         │     │
│  │    - Total marks > 0                               │     │
│  │    - Passing marks ≤ Total marks                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CODE EXECUTION FLOW                       │
│                                                              │
│  Frontend (marks-entry.jsx)                                 │
│  ├─ User selects Year                                       │
│  ├─ User selects Type (School/Center/Madrasa)               │
│  ├─ fetchExams(year, type) called                           │
│  │  └─ marksApi.getExamsByYear(year, type)                  │
│  │     └─ GET /api/v1/exams?academicYear=1403&              │
│  │                          institutionType=School          │
│  │                                                           │
│  Backend (exam.controller.js)                               │
│  ├─ getAllExams() receives request                          │
│  ├─ Extracts academicYear and institutionType from query    │
│  ├─ Queries database with filters                           │
│  └─ Returns filtered exams                                  │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Frontend (marks-exam-config.jsx)                           │
│  ├─ User configures subject marks                           │
│  ├─ Clicks "Save"                                            │
│  ├─ bulkUpsertExamSubjectConfig() called                    │
│  │  └─ POST /api/v1/exam-subject-config/bulk-upsert         │
│  │     Body: { examId, classId, institutionType, configs }  │
│  │                                                           │
│  Backend (exam-subject-config.controller.js)                │
│  ├─ bulkUpsertExamSubjectConfig() receives request          │
│  ├─ For each config:                                        │
│  │  ├─ validateMarksConfig(totalMarks, passingMarks)        │
│  │  ├─ validateSchoolYearlyTotal()                          │
│  │  │  └─ marksHelpers.validateSchoolYearlyTotal()          │
│  │  │     ├─ Check if exam is School type                   │
│  │  │     ├─ If School:                                     │
│  │  │     │  ├─ calculateSchoolYearlyTotalMarks()           │
│  │  │     │  │  ├─ Find all School exams in year            │
│  │  │     │  │  ├─ Get configs for subject in those exams   │
│  │  │     │  │  └─ Sum total marks                          │
│  │  │     │  ├─ Add new total marks                         │
│  │  │     │  ├─ Check if sum ≤ 100                          │
│  │  │     │  └─ Return validation result                    │
│  │  │     └─ If not School: return valid                    │
│  │  ├─ If valid: Save config                                │
│  │  └─ If invalid: Add to errors array                      │
│  └─ Return response with saved configs and errors           │
│                                                              │
│  Frontend                                                    │
│  ├─ Receives response                                        │
│  ├─ Shows success message for saved configs                 │
│  └─ Shows error messages for failed configs                 │
└─────────────────────────────────────────────────────────────┘
```

This diagram provides a visual representation of how the fixes work together to solve both issues!

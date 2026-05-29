# اطلاع نامه (Report Card) Implementation Roadmap

## ✅ **COMPLETED:**

### 1. Database Schema Update
- ✅ Added `examType` field to exams table (FirstTerm | Annual | Custom)
- ✅ Created migration file: `0016_add_exam_type.sql`
- ✅ Applied migration successfully
- ✅ Created index on exam_type

---

## 🚧 **REMAINING TASKS:**

### 2. Backend - Auto-Create School Exams
**File**: `backend/src/controllers/class/class.controller.js`
- When a School class is created for a new academic year
- Auto-create 2 exams:
  - First Exam (examType: "FirstTerm")
  - Annual Exam (examType: "Annual")

### 3. Backend - Exam Validation
**File**: `backend/src/controllers/exam/exam.controller.js`
- Validate: For School, only FirstTerm and Annual allowed
- Validate: Total marks per subject across all exams ≤ 100
- Update exam creation/update logic

### 4. Backend - Report Card API
**File**: `backend/src/controllers/marks/reportCard.controller.js` (NEW)
- `GET /marks/report-card/:studentId/:examId` - Single exam report
- `GET /marks/annual-report/:studentId/:academicYear` - Combined report
- Calculate grades (الف، ب، ج، د، ه)
- Calculate ranks per class

### 5. Backend - PDF Generation
**File**: `backend/src/utils/reportCardPdf.util.js` (NEW)
- Use PDFKit (like ID cards)
- Use Amiri fonts
- Match exact layout from image
- Support both exam types

### 6. Frontend - اطلاع نامه Page
**File**: `Client/src/routes/marks-itla-nama.jsx`
- Filter: Academic Year, Exam Type, Class
- Show only students with marks
- Checkboxes for selection
- "Download Selected" button
- "Download All Class" button

### 7. Frontend - API Integration
**File**: `Client/src/data/marksApi.js`
- Add report card API functions
- Add PDF download functions

---

## 📋 **NEXT STEPS:**

1. Create auto-exam creation logic
2. Build report card API endpoints
3. Create PDF generation utility
4. Update frontend page
5. Test complete flow

---

## 🎯 **GRADING SCALE:**

### First Exam (40 marks):
- الف (A): 36-40
- ب (B): 30-35.99
- ج (C): 24-29.99
- د (D): 20-23.99
- ه (F): Below 20

### Annual Exam (100 marks total):
- الف (A): 90-100
- ب (B): 75-89.99
- ج (C): 60-74.99
- د (D): 50-59.99
- ه (F): Below 50

---

**Status**: Schema updated, ready for backend implementation.

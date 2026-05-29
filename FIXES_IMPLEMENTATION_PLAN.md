# School Management System - Fixes Implementation Plan

## Issue 1: Dashboard Year Filtering

### Problem
Dashboard data should be completely filtered when the year is changed. Currently, some queries don't properly filter by the selected academic year.

### Solution
1. **Salary Queries**: Add academic year filtering to salary queries in dashboard
2. **Staff Queries**: Ensure staff counts are filtered by academic year
3. **Chart APIs**: Ensure all chart APIs properly use the year parameter

### Files to Modify
- `backend/src/controllers/dashboard/dashboard.controller.js`
  - Update salary queries to filter by academic year
  - Update staff queries to consider academic year
  - Ensure all chart functions use year parameter correctly

---

## Issue 2: Marks Module Improvements

### Problem 1: Exam Type Filtering
After selecting year, admin should select institution type (School/Center/Madrasa), and only exams of that type should be shown.

### Solution
1. Add institution type selection BEFORE exam selection
2. Filter exams by both academic year AND institution type
3. Update marks entry flow: Year → Type → Exam → Class → Subject

### Files to Modify
- `Client/src/routes/marks-entry.jsx`
  - Reorder selection: Year → Type → Exam → Class → Subject
  - Filter exams by institution type
- `Client/src/routes/marks-exam-config.jsx`
  - Same reordering of selection flow
- `backend/src/controllers/exam/exam.controller.js`
  - Ensure exam queries support institution type filtering

### Problem 2: Total Marks Validation for School Exams
For School type exams in one academic year, the total marks across ALL school exams should equal 100 (not more).

Example:
- 4.5 Month Exam (څلور نیمه): 40 marks
- Yearly Exam (سالانه): 60 marks
- Total: 100 marks ✓

If admin tries to set:
- 4.5 Month Exam: 40 marks
- Yearly Exam: 70 marks
- Total: 110 marks ✗ (Should show error)

### Solution
1. Create validation function to check total marks for School exams
2. When saving exam subject config for School type:
   - Calculate sum of total marks for this subject across all School exams in the year
   - Ensure sum ≤ 100
   - Show clear error message if validation fails
3. Add backend validation in exam-subject-config controller
4. Add frontend validation before submission

### Files to Modify
- `backend/src/controllers/exam-subject-config/exam-subject-config.controller.js`
  - Add `validateSchoolYearlyTotalMarks()` function
  - Check total marks across all School exams for the subject
  - Return error if total > 100
- `backend/src/utils/marksHelpers.util.js`
  - Add helper function to calculate yearly total marks
- `Client/src/routes/marks-exam-config.jsx`
  - Add frontend validation before save
  - Show warning if approaching 100 marks limit
  - Display current total marks for School subjects

---

## Implementation Steps

### Step 1: Fix Dashboard Year Filtering
1. Update salary queries to include academic year filter
2. Update staff queries to include academic year filter
3. Test all dashboard cards and charts with different years

### Step 2: Add Exam Type Filtering in Marks Module
1. Update marks entry page to add type selection before exam
2. Update marks config page to add type selection before exam
3. Update exam API to filter by institution type
4. Test the flow: Year → Type → Exam → Class → Subject

### Step 3: Implement School Marks Total Validation
1. Create validation helper function
2. Add backend validation in create/update config endpoints
3. Add frontend validation and UI feedback
4. Test with various scenarios (40+60=100 ✓, 40+70=110 ✗)

---

## Testing Checklist

### Dashboard
- [ ] Change year and verify all cards update
- [ ] Change year and verify all charts update
- [ ] Change year and verify staff count updates
- [ ] Change year and verify salary totals update
- [ ] Test with different institution types (all/school/center/madrasa)

### Marks Module - Type Filtering
- [ ] Select year, then type, verify only matching exams show
- [ ] Select School type, verify only School exams appear
- [ ] Select Center type, verify only Center exams appear
- [ ] Select Madrasa type, verify only Madrasa exams appear
- [ ] Verify classes filter by selected type

### Marks Module - Total Validation
- [ ] Create School exam config with 40 marks for subject
- [ ] Try to create another School exam config with 70 marks (should fail)
- [ ] Create another School exam config with 60 marks (should succeed)
- [ ] Verify Center and Madrasa exams are not affected by this validation
- [ ] Verify error messages are clear and helpful
- [ ] Verify frontend shows current total marks

---

## Database Schema Notes

### Relevant Tables
- `exams`: Has `institutionType` and `academicYear` columns
- `examSubjectConfig`: Links exam, class, subject with totalMarks
- `students`: Has `academicYear` column
- `classes`: Has `academicYear` and `type` columns
- `subjects`: Has `academicYear` and `type` columns
- `salaries`: Has `academicYear` column (needs to be added if missing)
- `staff`: May need `academicYear` column

### Schema Changes Needed
Check if `salaries` table has `academicYear` column. If not, add it.
Check if `staff` table needs `academicYear` tracking.

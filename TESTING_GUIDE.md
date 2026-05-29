# Testing Guide - School Management System Fixes

## Quick Start

### Prerequisites
1. Backend server running on port 3000
2. Frontend running on port 5173
3. Database with sample data (students, classes, subjects, exams)

---

## Test 1: Dashboard Year Filtering

### Steps:
1. Navigate to Dashboard (`/`)
2. Note the current year displayed
3. Click on the year picker
4. Select a different year (e.g., if current is 1403, select 1402)
5. Wait for data to load

### Expected Results:
- ✅ All cards should update with data from selected year
- ✅ Student counts should reflect selected year
- ✅ Class and subject counts should update
- ✅ Revenue and expense charts should show selected year data
- ✅ Recent admissions should show students from selected year
- ✅ Upcoming exams should show exams from selected year

### Test Different Views:
1. Select "ټول" (All) view
2. Change year - verify all data updates
3. Select "ښوونځي" (School) view
4. Change year - verify school-specific data updates
5. Repeat for "مرکز" (Center) and "مدرسه" (Madrasa)

---

## Test 2: Marks Entry - Institution Type Filtering

### Steps:
1. Navigate to Marks Entry (`/marks-entry`)
2. Select Academic Year: **1403**
3. Select Institution Type: **ښوونځی** (School)
4. Check the Exam dropdown

### Expected Results:
- ✅ Only School exams should appear (e.g., څلور نیمه, سالانه)
- ✅ Center and Madrasa exams should NOT appear

### Repeat for Other Types:
1. Select Institution Type: **مرکز** (Center)
   - ✅ Only Center exams should appear
2. Select Institution Type: **مدرسه** (Madrasa)
   - ✅ Only Madrasa exams should appear

### Test Complete Flow:
1. Year: **1403**
2. Type: **ښوونځی** (School)
3. Exam: **څلور نیمه** (4.5 Month)
4. Class: Select any school class
5. Subject: Select any subject
6. Click "زده کوونکي ښکاره کړئ" (Show Students)
7. ✅ Students list should appear
8. Enter marks and save
9. ✅ Should save successfully

---

## Test 3: School Marks Total Validation (100 Mark Limit)

### Setup:
1. Navigate to Marks Config (`/marks-exam-config`)
2. Select Year: **1403**
3. Select Exam: **څلور نیمه** (4.5 Month)
4. Select Type: **ښوونځی** (School)
5. Select Class: **1st Grade**
6. Click "مضامین ښکاره کړئ" (Show Subjects)

### Test Case 1: First Exam (Should Succeed)
1. Find subject "ریاضی" (Math)
2. Enter Total Marks: **40**
3. Enter Passing Marks: **16**
4. Click "ټول خوندي کړئ" (Save All)

**Expected Result:**
- ✅ Should save successfully
- ✅ Success message: "1 مضامین بریالي تنظیم شول"

### Test Case 2: Second Exam Within Limit (Should Succeed)
1. Select Exam: **سالانه** (Yearly)
2. Select Type: **ښوونځی** (School)
3. Select Class: **1st Grade**
4. Click "مضامین ښکاره کړئ"
5. Find subject "ریاضی" (Math)
6. Enter Total Marks: **60**
7. Enter Passing Marks: **24**
8. Click "ټول خوندي کړئ"

**Expected Result:**
- ✅ Should save successfully
- ✅ Total for Math is now 40 + 60 = 100 (exactly at limit)

### Test Case 3: Exceeding Limit (Should Fail)
1. Create a new School exam or select another existing one
2. Select Type: **ښوونځی** (School)
3. Select Class: **1st Grade**
4. Try to configure "ریاضی" (Math)
5. Enter Total Marks: **10** (would make total 110)
6. Enter Passing Marks: **4**
7. Click "ټول خوندي کړئ"

**Expected Result:**
- ✅ Should show error message
- ✅ Error should mention: "د 100 څخه زیاتې نشي کیدای"
- ✅ Error should show current total: 100
- ✅ Error should show new total would be: 110
- ✅ Config should NOT be saved

### Test Case 4: Update Existing Config (Should Validate)
1. Go back to **څلور نیمه** exam config
2. Find the Math subject (currently 40 marks)
3. Try to change Total Marks to **50**
4. Click Save

**Expected Result:**
- ✅ Should show error (would make total 50 + 60 = 110)
- ✅ Should not allow update

### Test Case 5: Update Within Limit (Should Succeed)
1. In **څلور نیمه** exam config
2. Change Math Total Marks from **40** to **35**
3. Click Save

**Expected Result:**
- ✅ Should save successfully (new total: 35 + 60 = 95)

### Test Case 6: Center/Madrasa Not Restricted
1. Select Exam: Any Center exam
2. Select Type: **مرکز** (Center)
3. Select Class: Any center class
4. Configure any subject with Total Marks: **150**
5. Click Save

**Expected Result:**
- ✅ Should save successfully
- ✅ No 100-mark limit for Center/Madrasa

---

## Test 4: Bulk Save with Validation

### Steps:
1. Navigate to Marks Config
2. Select Year: **1403**
3. Select Exam: **څلور نیمه**
4. Select Type: **ښوونځی** (School)
5. Select Class: **1st Grade**
6. Click "مضامین ښکاره کړئ"

### Configure Multiple Subjects:
1. **ریاضی** (Math): Total = 40, Passing = 16
2. **پښتو** (Pashto): Total = 40, Passing = 16
3. **انګلیسي** (English): Total = 40, Passing = 16
4. Click "ټول خوندي کړئ"

**Expected Result:**
- ✅ All three should save successfully

### Now Configure Yearly Exam:
1. Select Exam: **سالانه**
2. Same class and type
3. Configure:
   - **ریاضی**: Total = 60, Passing = 24 ✓
   - **پښتو**: Total = 70, Passing = 28 ✗ (would exceed 100)
   - **انګلیسي**: Total = 60, Passing = 24 ✓
4. Click "ټول خوندي کړئ"

**Expected Result:**
- ✅ Math and English should save (within limit)
- ✅ Pashto should show error (exceeds limit)
- ✅ Success message should show: "2 مضامین بریالي تنظیم شول"
- ✅ Errors array should show Pashto error

---

## Test 5: Edge Cases

### Edge Case 1: No Exams for Selected Type
1. Select Year: **1403**
2. Select Type: **مدرسه** (Madrasa)
3. Check Exam dropdown

**Expected Result:**
- ✅ If no Madrasa exams exist, dropdown should be empty or show "امتحان غوره کړئ"

### Edge Case 2: Delete and Re-add
1. Configure Math with 40 marks in څلور نیمه
2. Configure Math with 60 marks in سالانه (total = 100)
3. Delete the څلور نیمه config
4. Try to add Math with 50 marks in a new exam

**Expected Result:**
- ✅ Should succeed (total would be 60 + 50 = 110, but after deletion it's just 60 + 50 = 110)
- Wait, this should still fail! Let me reconsider...
- After deleting څلور نیمه (40), only سالانه (60) remains
- Adding 50 would make total 60 + 50 = 110
- ✅ Should fail with error

### Edge Case 3: Same Subject, Different Classes
1. Configure Math for **1st Grade** with 40 + 60 = 100
2. Configure Math for **2nd Grade** with 40 + 60 = 100

**Expected Result:**
- ✅ Both should succeed
- ✅ Validation is per subject per class, not global

---

## Test 6: Error Messages

### Verify Error Message Content:
When validation fails, check that error message includes:
- ✅ Mention of 100-mark limit
- ✅ Current total marks
- ✅ What new total would be
- ✅ Remaining marks available
- ✅ Message in Pashto

Example error:
```
د ښوونځي امتحانونو لپاره د دې مضمون ټولټال نمرې د 100 څخه زیاتې نشي کیدای. 
اوسنی: 40، نوی به: 110 وي (پاتې: -10)
```

---

## Test 7: API Testing (Optional)

### Using Postman/Thunder Client:

#### Test 1: Get Exams by Type
```
GET http://localhost:3000/api/v1/exams?academicYear=1403&institutionType=School
```
**Expected:** Only School exams returned

#### Test 2: Create Config (Should Fail)
```
POST http://localhost:3000/api/v1/exam-subject-config
Content-Type: application/json

{
  "examId": 1,
  "classId": 1,
  "subjectId": 1,
  "institutionType": "School",
  "totalMarks": 70,
  "passingMarks": 28
}
```
**Expected:** 400 error if total would exceed 100

#### Test 3: Bulk Upsert
```
POST http://localhost:3000/api/v1/exam-subject-config/bulk-upsert
Content-Type: application/json

{
  "examId": 1,
  "classId": 1,
  "institutionType": "School",
  "configs": [
    { "subjectId": 1, "totalMarks": 40, "passingMarks": 16 },
    { "subjectId": 2, "totalMarks": 40, "passingMarks": 16 }
  ]
}
```
**Expected:** Success with saved configs

---

## Troubleshooting

### Issue: Exams not filtering by type
**Check:**
1. Browser console for errors
2. Network tab - verify API call includes `institutionType` parameter
3. Backend logs - verify query is filtering correctly

### Issue: Validation not working
**Check:**
1. Verify exam is School type (validation only applies to School)
2. Check backend logs for validation function calls
3. Verify database has correct `institutionType` in exams table

### Issue: Error messages not showing
**Check:**
1. Browser console for errors
2. Network tab - check API response
3. Verify frontend is displaying error from API response

---

## Success Criteria

All tests should pass with these results:
- ✅ Dashboard filters by year correctly
- ✅ Marks entry shows only matching exam types
- ✅ School exams cannot exceed 100 total marks per subject per class
- ✅ Center and Madrasa exams have no mark limits
- ✅ Error messages are clear and helpful
- ✅ Bulk operations validate each subject
- ✅ Updates respect the 100-mark limit

---

## Reporting Issues

If any test fails, please report:
1. Which test failed
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots if applicable
5. Browser console errors
6. Backend log errors

---

## Notes

- The 100-mark limit only applies to **School** institution type
- Validation is per **subject per class per year**
- Different classes can have different mark distributions
- Center and Madrasa have no restrictions
- Validation happens on both create and update operations

# Attendance System - Testing Checklist

## Pre-Testing Setup

### 1. Verify Backend is Running
```bash
cd backend
npm run dev
```
✅ Server should start on configured port (default: 3000)

### 2. Verify Frontend is Running
```bash
cd Client
npm run dev
```
✅ Client should start on configured port (default: 5173)

### 3. Check Database
✅ `backend/database/school.db` exists
✅ Tables created (attendance, attendance_settings, students, staff, teachers)

---

## Testing Checklist

### A. Attendance Settings Page

#### Test 1: Load Settings Page
- [ ] Navigate to Attendance → Settings
- [ ] Page loads without errors
- [ ] Default times display correctly
  - Check-in Time: 08:00 (or existing value)
  - Check-out Time: 15:00 (or existing value)
  - Absence Marking Time: 09:00 (or existing value)

**Expected**: No console errors, all fields populated

#### Test 2: Save Settings (First Time)
- [ ] Open Settings page (if no settings exist)
- [ ] Verify all time fields have default values
- [ ] Change Check-in Time to 08:30
- [ ] Click "Save Settings"
- [ ] Success message appears

**Expected**: "ترتیبات ثبت شول" (Settings saved)

#### Test 3: Save Settings (Update)
- [ ] Open Settings page again
- [ ] Verify previous values loaded (08:30)
- [ ] Change Absence Marking Time to 09:30
- [ ] Click "Save Settings"
- [ ] Success message appears

**Expected**: Settings update successfully

#### Test 4: Settings Validation
- [ ] Clear Check-in Time field
- [ ] Try to save
- [ ] Error message should appear

**Expected**: Validation prevents save with empty fields

---

### B. Student Attendance - Manual Method

#### Test 5: Load Students for Attendance
- [ ] Navigate to Attendance → Students
- [ ] Select:
  - Method: Manual
  - Institution: School
  - Class: Any class with students
  - Date: Today
- [ ] Click "Manage Attendance"

**Expected**: Table loads with all students in class

#### Test 6: Mark Individual Student
- [ ] Click "Present" for one student (green button)
- [ ] Button should highlight
- [ ] Statistics should update (Present: 1)

**Expected**: Button turns green, stats update

#### Test 7: Bulk Mark All Present
- [ ] Click "ټولو لپاره: حاضر" (Mark All Present)
- [ ] All student buttons turn green
- [ ] Statistics update (Present: all students)

**Expected**: All students marked present

#### Test 8: Mark Exceptions
- [ ] Mark 2 students as "Absent" (red)
- [ ] Mark 1 student as "Leave" (yellow)
- [ ] Statistics update accordingly

**Expected**: 
- Present: Total - 3
- Absent: 2
- Leave: 1

#### Test 9: Save Attendance
- [ ] Click "حاضرۍ ثبت کړئ" (Save Attendance)
- [ ] Success message appears
- [ ] Page refreshes with saved data

**Expected**: "حاضرۍ بریالۍ ثبت شوه" (Attendance saved successfully)

#### Test 10: Reload and Verify
- [ ] Refresh the page
- [ ] Select same class and date
- [ ] Click "Manage Attendance"
- [ ] Previous attendance should display

**Expected**: All previous marks display correctly

---

### C. Student Attendance - QR Code Method

#### Test 11: Open QR Scanner
- [ ] Select:
  - Method: QR Code
  - Class: Any class
  - Date: Today
- [ ] Click "Manage Attendance"
- [ ] QR Scanner modal opens

**Expected**: Camera preview appears

#### Test 12: Scan Student QR (First Time)
- [ ] Get a student QR code
- [ ] Scan it with the scanner
- [ ] Success message appears
- [ ] Student marked present

**Expected**: "حاضر ثبت شو ✓" (Marked present)

#### Test 13: Scan Same Student Again
- [ ] Scan same student QR again
- [ ] Message says already marked

**Expected**: "د نن ورځې حاضري مخکې ثبت شوې ده" (Already marked today)

#### Test 14: Scan After Auto-Absence
- [ ] Manually mark a student as "Absent"
- [ ] Save attendance
- [ ] Open QR scanner again
- [ ] Scan that student's QR code
- [ ] Status should change to "Present"

**Expected**: "غیر حاضر څخه حاضر ته بدل شو ✓" (Changed from absent to present)

---

### D. Auto-Absence Functionality

#### Test 15: Verify Auto-Absence Settings
- [ ] Go to Settings
- [ ] Check "Absence Marking Time" is set (e.g., 09:00)
- [ ] Note the time

**Expected**: Time is configured

#### Test 16: Test Auto-Absence Manually
*Note: This requires backend access to trigger cron*

Option A - Wait for scheduled time:
- [ ] Don't mark attendance before absence time
- [ ] Wait until configured absence time passes
- [ ] Check attendance - all should be marked absent

Option B - Trigger manually in backend:
- [ ] Open backend console
- [ ] Call the auto-absence utility function
- [ ] Check attendance records

**Expected**: All students without attendance marked as "Absent" with method "Auto"

---

### E. Staff Attendance

#### Test 17: Mark Staff Attendance
- [ ] Navigate to Attendance → Staff
- [ ] Select:
  - Method: Manual
  - Date: Today
- [ ] Click "Manage Attendance"
- [ ] Mark some staff Present, some Absent
- [ ] Save

**Expected**: Staff attendance saves successfully

#### Test 18: QR Scan for Staff
- [ ] Select QR Code method
- [ ] Open scanner
- [ ] Scan staff QR code
- [ ] Staff marked present

**Expected**: Works same as student QR

---

### F. Excel Report Download

#### Test 19: Daily Report - Students
- [ ] Go to Attendance → Students
- [ ] Scroll to "Download Report" section
- [ ] Select:
  - Institution: School
  - Class: Class with attendance data
  - Period: Daily (ورځنی)
  - Date: Today
- [ ] Click "Excel راپور ډاونلوډ"

**Expected**: 
- Excel file downloads
- Filename: `attendance_YYYY-MM-DD_YYYY-MM-DD.xlsx`

#### Test 20: Verify Excel File Content
Open the downloaded Excel file and verify:
- [ ] Row 1: School name in blue header
- [ ] Row 2: Ministry/Department info
- [ ] Row 3: Report type (د زده کوونکو حاضری راپور)
- [ ] Row 5: Date range and class name
- [ ] Row 6: Statistics (Total, Present, Absent, Leave with percentages)
- [ ] Row 8: Table headers with auto-filter arrows
- [ ] Data rows: Students with attendance
- [ ] Status colors:
  - Present = Green background
  - Absent = Red background
  - Leave = Yellow background
- [ ] Last row: Footer with generation date

**Expected**: Professional formatted Excel with all details

#### Test 21: Monthly Report
- [ ] Select Period: Monthly (میاشتنی)
- [ ] Date range auto-fills to current month
- [ ] Download report

**Expected**: 
- Excel includes all days of month
- Monthly statistics calculated
- Attendance percentage per student

#### Test 22: Yearly Report
- [ ] Select Period: Yearly (کلنی)
- [ ] Date range auto-fills to current year
- [ ] Download report

**Expected**: Annual report with yearly statistics

#### Test 23: Custom Date Range
- [ ] Select Period: Custom
- [ ] Set Start Date: 7 days ago
- [ ] Set End Date: Today
- [ ] Download report

**Expected**: Report for selected date range

#### Test 24: Staff Report Download
- [ ] Go to Attendance → Staff
- [ ] Select report period
- [ ] Download Excel

**Expected**: Staff attendance report downloads

---

### G. PDF Download Removal Verification

#### Test 25: Check Students Page
- [ ] Go to Attendance → Students
- [ ] Scroll to Download section
- [ ] Look for PDF button

**Expected**: ❌ NO PDF button visible

#### Test 26: Check Staff Page
- [ ] Go to Attendance → Staff
- [ ] Scroll to Download section
- [ ] Look for PDF button

**Expected**: ❌ NO PDF button visible

#### Test 27: Check Excel Button Only
- [ ] Only ONE download button should exist
- [ ] Button says "Excel راپور ډاونلوډ"
- [ ] Button has FileSpreadsheet icon

**Expected**: ✅ Single prominent Excel button

---

### H. Edge Cases & Error Handling

#### Test 28: No Class Selected
- [ ] Try to manage attendance without selecting class
- [ ] Error message should appear

**Expected**: "مهرباني وکړئ ټولګی غوره کړئ" (Please select class)

#### Test 29: Future Date
- [ ] Try to mark attendance for tomorrow
- [ ] Should either prevent or allow based on requirements

**Expected**: Behavior is consistent

#### Test 30: Empty Class
- [ ] Select a class with no students
- [ ] Click "Manage Attendance"

**Expected**: "هیڅ زده کوونکی ونه موندل شو" (No students found)

#### Test 31: No Attendance Data for Report
- [ ] Try to download report for date with no attendance
- [ ] Excel should still generate

**Expected**: Excel with headers but no data rows

#### Test 32: Internet Offline (If applicable)
- [ ] Disconnect internet
- [ ] Try to mark attendance
- [ ] Should work if local-first

**Expected**: Offline indicator shows, but attendance works

---

### I. User Interface & Experience

#### Test 33: Search Functionality
- [ ] Open attendance table
- [ ] Use search box
- [ ] Type student name or ID
- [ ] Results filter

**Expected**: Search works in real-time

#### Test 34: Pagination
- [ ] Open attendance for class with >30 students
- [ ] Pagination controls appear
- [ ] Click next page
- [ ] Navigate through pages

**Expected**: Pagination works smoothly

#### Test 35: Statistics Display
- [ ] Mark various statuses
- [ ] Watch statistics update in real-time
- [ ] Total, Present, Absent, Leave counts update

**Expected**: Live statistics update

#### Test 36: Responsive Design
- [ ] Test on mobile device or resize browser
- [ ] All buttons accessible
- [ ] Tables scroll horizontally
- [ ] Forms remain usable

**Expected**: Works on all screen sizes

---

## Performance Testing

### Test 37: Large Class (100+ Students)
- [ ] Load class with 100+ students
- [ ] Page loads in < 3 seconds
- [ ] Bulk actions work quickly
- [ ] Save completes in < 5 seconds

**Expected**: Good performance even with large data

### Test 38: Large Report (1 Year)
- [ ] Generate yearly report
- [ ] Download completes in < 10 seconds
- [ ] Excel file opens correctly
- [ ] All data present

**Expected**: Report generates successfully

---

## Security Testing

### Test 39: Login Required
- [ ] Logout
- [ ] Try to access attendance page
- [ ] Should redirect to login

**Expected**: Authentication enforced

### Test 40: QR Code Validation
- [ ] Try scanning invalid QR code
- [ ] Should show error

**Expected**: "د QR کوډ فارمټ سم نه دی" (Invalid QR format)

---

## Final Verification

### Test 41: Full Workflow Test
Complete workflow from start to finish:
1. [ ] Configure settings
2. [ ] Mark morning attendance (some present)
3. [ ] Wait for or trigger auto-absence
4. [ ] Scan late arrival QR code
5. [ ] Download daily report
6. [ ] Verify report has all data
7. [ ] Download monthly report
8. [ ] Check statistics are correct

**Expected**: Complete workflow works end-to-end

### Test 42: Multi-Day Test
- [ ] Mark attendance for 3 different days
- [ ] Each day should be independent
- [ ] No carryover between days
- [ ] Monthly report shows all 3 days

**Expected**: Daily reset works, monthly aggregation correct

---

## Bug Reporting Template

If you find any issues, report with this format:

```
**Issue Title**: Brief description

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Screenshots**: (if applicable)

**Console Errors**: (check browser console)

**Environment**:
- Browser: Chrome/Firefox/Safari
- OS: Windows/Mac/Linux
- Backend logs: Any errors?
```

---

## Testing Summary

- [ ] All A tests passed (Settings)
- [ ] All B tests passed (Manual Attendance)
- [ ] All C tests passed (QR Attendance)
- [ ] All D tests passed (Auto-Absence)
- [ ] All E tests passed (Staff Attendance)
- [ ] All F tests passed (Excel Reports)
- [ ] All G tests passed (PDF Removal)
- [ ] All H tests passed (Edge Cases)
- [ ] All I tests passed (UI/UX)
- [ ] Performance tests passed
- [ ] Security tests passed
- [ ] Full workflow test passed

---

## Sign-Off

**Tester Name**: _________________

**Date**: _________________

**Overall Status**: ✅ PASS / ❌ FAIL

**Notes**: 
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**Total Tests**: 42
**Time Required**: ~2-3 hours for complete testing
**Priority Tests**: 1-10, 19-27 (Core functionality)

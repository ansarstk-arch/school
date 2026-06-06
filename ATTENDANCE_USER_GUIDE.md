# Attendance System - User Guide

## Quick Start Guide

### 1. Configure Attendance Settings

**Navigate to**: Attendance → Settings

**Configure**:
- ✅ Default Check-in Time: `08:00` (when staff should arrive)
- ✅ Default Check-out Time: `15:00` (when staff should leave)
- ✅ Absence Marking Time: `09:00` (when auto-absence runs)
- ✅ QR Code Validity: `24` hours

**Click**: Save Settings

> ⚠️ **Important**: Settings are now properly initialized. Default times will load correctly on page open.

---

### 2. Daily Attendance - Manual Method

**For Students**:
1. Go to **Attendance → Students**
2. Select:
   - Method: **Manual**
   - Institution Type: **School/Center/Madrasa**
   - Class: Select from dropdown
   - Date: Select date (default is today)
3. Click **Manage Attendance**
4. Mark each student: **Present** / **Absent** / **Leave**
5. Click **Save Attendance**

**For Staff/Teachers**:
1. Go to **Attendance → Staff**
2. Select:
   - Method: **Manual**
   - Date: Select date
3. Click **Manage Attendance**
4. Mark each person: **Present** / **Absent** / **Leave**
5. Click **Save Attendance**

---

### 3. Daily Attendance - QR Code Method

**Setup QR Codes**:
1. Go to **Students** or **Staff** management
2. Click on a person's QR code icon
3. Print or download QR codes

**Scanning Process**:
1. Go to **Attendance → Students/Staff**
2. Select:
   - Method: **QR Code**
   - Class (for students)
   - Date
3. Click **Manage Attendance**
4. QR Scanner opens automatically
5. Students/staff scan their QR codes
6. System marks them **Present** automatically

**Late Arrival Scenario**:
- ❌ Student marked **Absent** at 9:00 AM (auto-absence)
- ✅ Student scans QR code at 10:00 AM
- ✅ Status changes to **Present** automatically
- ✅ System logs: "QR scan after auto-absence"

---

### 4. Auto-Absence Feature

**How it Works**:
1. System runs daily at configured "Absence Marking Time" (default 9:00 AM)
2. Finds all students/staff without attendance for today
3. Automatically marks them as **Absent**
4. They can still scan QR later to become **Present**

**Benefits**:
- ✅ No manual marking of absent students
- ✅ Only mark who's present
- ✅ Saves time every day
- ✅ Automatic daily reset

---

### 5. Download Attendance Reports

**Steps**:
1. Go to **Attendance → Students/Staff**
2. Scroll to **Download Report** section
3. Select:
   - Institution Type (for students)
   - Class (for students)
   - Report Period:
     - **Daily**: Single day report
     - **Monthly**: Full month with statistics
     - **Yearly**: Annual report
   - Date Range: Auto-fills based on period, or customize
4. Click **Excel Report Download** button

**Excel Report Features**:
- ✅ School name and ministry header
- ✅ Report type and date range
- ✅ Summary statistics (Total, Present, Absent, Leave, Percentages)
- ✅ Detailed attendance table
- ✅ Color-coded status (Green=Present, Red=Absent, Yellow=Leave)
- ✅ Auto-filter on all columns
- ✅ Professional formatting
- ✅ Right-to-left text support

**Monthly Report Includes**:
- Total attendance days in month
- Days present per student
- Days absent per student
- Days on leave per student
- Attendance percentage per student

**Note**: PDF download has been removed. Only Excel format is available.

---

## Daily Workflow Examples

### Example 1: Morning Attendance with QR

**8:00 AM - Students Arrive**
1. Teacher opens QR scanner
2. Students scan as they enter
3. System marks them **Present** immediately

**9:00 AM - Auto-Absence Runs**
- System marks all non-scanned students as **Absent**

**9:30 AM - Late Student Arrives**
- Student scans QR code
- Status changes from **Absent** to **Present**
- System shows: "غیر حاضر څخه حاضر ته بدل شو" (Changed from absent to present)

---

### Example 2: Manual Attendance for Staff

**Morning**
1. Admin opens Staff Attendance
2. Selects today's date
3. Clicks **Manage Attendance**
4. Marks all present staff
5. Saves attendance

**End of Day**
- Auto-absence already marked absent staff at 9 AM
- No further action needed

---

### Example 3: Monthly Report Generation

**End of Month**
1. Go to Attendance → Students
2. Scroll to Download section
3. Select:
   - Institution Type: **School**
   - Class: **Grade 10 - A**
   - Period: **Monthly**
   - Date Range: Automatically shows current month
4. Click **Excel Report Download**

**Excel File Contains**:
- School header with logo/name
- Month: October 2024
- Class: Grade 10 - A
- Total Students: 35
- Statistics:
  - Present: 630 (90%)
  - Absent: 50 (7%)
  - Leave: 20 (3%)
- Detailed daily attendance for each student
- Attendance percentage per student

---

## Features Summary

### ✅ Implemented Features

1. **Attendance Management**
   - Manual marking
   - QR code scanning
   - Bulk actions (mark all present/absent)
   - Individual student marking

2. **Auto-Absence**
   - Runs daily at configured time
   - Marks non-present as absent
   - Configurable timing
   - Automatic daily reset

3. **QR Code Functionality**
   - Generate QR codes for all students/staff
   - Scan to mark present
   - Update absent to present
   - Prevent duplicate scanning
   - Track scan time

4. **Excel Reports**
   - Daily reports
   - Monthly reports with statistics
   - Yearly reports
   - Professional formatting
   - Auto-filter enabled
   - Color-coded status
   - School branding

5. **Settings Management**
   - Configure check-in/check-out times
   - Set auto-absence time
   - QR code validity period
   - Proper state initialization

### ❌ Removed Features

1. **PDF Export**
   - Completely removed
   - Only Excel available now

---

## Troubleshooting

### Issue: Settings won't save
**Solution**: 
- Refresh the page
- Default times should load automatically
- If still fails, check console for errors

### Issue: QR code doesn't update absent students
**Solution**:
- Verify attendance date matches
- Check that student has been marked absent first
- Try refreshing and scanning again

### Issue: Auto-absence not running
**Solution**:
- Check attendance settings are configured
- Verify "Absence Marking Time" is set
- Check backend cron jobs are running
- Look in `backend/logs/combined.log`

### Issue: Excel download is empty
**Solution**:
- Verify date range has attendance data
- Check class/institution filters are correct
- Ensure at least one attendance record exists

### Issue: Can't mark attendance today
**Solution**:
- Check date is not in the future
- Verify class selection
- Refresh page and try again

---

## Best Practices

### Daily Operations

1. **Morning Routine**
   - Open QR scanner before students arrive
   - Let students scan as they enter
   - Wait for auto-absence to run
   - Check for late arrivals

2. **Manual Marking**
   - Use bulk actions to mark all present first
   - Then mark exceptions (absent/leave)
   - Always save before leaving page

3. **Report Generation**
   - Generate reports at end of week/month
   - Archive important reports
   - Share with management

### Settings Configuration

1. **Absence Marking Time**
   - Set after normal arrival time
   - Account for late arrivals
   - Recommended: 30-60 minutes after start

2. **QR Code Validity**
   - Default 24 hours works for most cases
   - Increase for multi-shift schools
   - Decrease for tighter security

---

## Keyboard Shortcuts

- **Tab**: Navigate between form fields
- **Enter**: Submit form / Save attendance
- **Space**: Toggle status buttons
- **Esc**: Close QR scanner modal

---

## Mobile Usage

The system works on mobile devices:
- ✅ Responsive design
- ✅ QR scanner works on phone camera
- ✅ Touch-friendly buttons
- ✅ Swipe to navigate

---

## Data Retention

- Attendance records stored permanently
- Reports can be generated for any historical date
- No automatic deletion
- Manual cleanup required if needed

---

## Security Features

1. **QR Code Encryption**
   - Codes are encrypted
   - Time-based expiry
   - One-time use per day

2. **Audit Trail**
   - Original status logged
   - Change reason recorded
   - Timestamp for all actions

3. **Access Control**
   - Login required
   - Role-based permissions
   - Session management

---

## Support & Help

For technical support:
- Check backend logs: `backend/logs/combined.log`
- Check browser console for frontend errors
- Verify database is accessible
- Ensure all services are running

---

**Last Updated**: June 1, 2026
**Version**: 2.0.0
**Status**: Production Ready

# Attendance Timing Configuration Implementation

## Overview
Implemented a comprehensive attendance timing configuration system that allows admins to set cutoff times and off days for each institution type (School, Center, Madrasa). The system automatically marks students and staff as absent after the cutoff time if their attendance hasn't been taken.

## Features Implemented

### 1. Database Schema
- **Table**: `attendance_settings`
  - `id`: Primary key
  - `institution_type`: School | Center | Madrasa (unique)
  - `cutoff_time`: Time in HH:MM format (e.g., "09:00")
  - `off_days`: JSON array of day numbers [0=Sunday, 5=Friday, 6=Saturday]
  - `is_active`: Boolean flag
  - `created_at`, `updated_at`: Timestamps

- **Default Settings**:
  - School: 09:00, Friday off
  - Center: 10:00, Friday off
  - Madrasa: 08:00, Friday off

### 2. Backend Implementation

#### Controllers
- **`attendance-settings.controller.js`**:
  - `getAllSettings()`: Get all attendance settings
  - `getSettingsByType()`: Get settings for specific institution
  - `updateSettings()`: Update cutoff time and off days

#### Routes
- `GET /api/v1/attendance/settings` - Get all settings
- `GET /api/v1/attendance/settings/:institutionType` - Get specific settings
- `PATCH /api/v1/attendance/settings/:institutionType` - Update settings (protected)

#### Auto-Absence System
- **`autoAbsence.util.js`**:
  - `markAbsentStudents()`: Marks students absent after cutoff time
  - `markAbsentStaff()`: Marks staff/teachers absent after cutoff time
  - `runAutoAbsence()`: Runs both jobs
  - Checks off days before marking absent
  - Only marks if no attendance record exists
  - Adds note: "Auto-marked absent after cutoff time"

#### Cron Job
- Runs every 30 minutes: `*/30 * * * *`
- Automatically checks and marks absences
- Respects institution-specific cutoff times and off days

#### QR Attendance Enhancement
- **Updated behavior**: If a student/staff is marked absent and scans QR code:
  - Status changes from "Absent" to "Present"
  - Updates `attendanceMethod` to "QR"
  - Records `scannedAt` timestamp
  - Adds change reason: "QR scan after auto-absence"
  - Returns success message: "غیر حاضر څخه حاضر ته بدل شو ✓"

### 3. Frontend Implementation

#### API Client
- **`attendanceSettingsApi.js`**:
  - `getAllAttendanceSettings()`
  - `getAttendanceSettingsByType(institutionType)`
  - `updateAttendanceSettings(institutionType, data)`

#### Settings Page
- **`attendance-settings.jsx`**:
  - Three cards for School, Center, Madrasa
  - Time picker for cutoff time
  - Checkboxes for off days (all 7 days of week)
  - Save button for each institution
  - Important notes section explaining behavior
  - Real-time validation

#### Navigation
- Added to sidebar under "حاضري" dropdown
- Route: `/attendance/settings`
- Label: "د حاضرۍ تنظیمات"

## How It Works

### Auto-Absence Flow
1. Cron job runs every 30 minutes
2. For each active institution setting:
   - Check if today is an off day → Skip if yes
   - Check if current time >= cutoff time → Skip if no
   - Get all enrolled students/staff
   - For each person without attendance record:
     - Create attendance record with status "Absent"
     - Set method to "Manual"
     - Add note about auto-marking

### QR Scan After Absence
1. Student/staff scans QR code
2. System checks existing attendance:
   - If status is "Absent":
     - Update to "Present"
     - Change method to "QR"
     - Record scan time
     - Log change reason
   - If already "Present":
     - Return "already marked" message
   - If no record:
     - Create new "Present" record

### Off Days Handling
- Friday (day 5) is default off day for all institutions
- Admin can add/remove any day of week
- Multiple off days supported (e.g., Friday + Saturday for Center)
- No attendance taken on off days
- Auto-absence job skips off days

## Files Created/Modified

### Backend
- ✅ `backend/src/db/schema.js` - Added attendanceSettings table
- ✅ `backend/create-attendance-settings-table.js` - Migration script
- ✅ `backend/src/controllers/attendance/attendance-settings.controller.js` - New controller
- ✅ `backend/src/routes/attendance/attendance.route.js` - Added settings routes
- ✅ `backend/src/utils/autoAbsence.util.js` - Auto-absence logic
- ✅ `backend/app.js` - Added cron job
- ✅ `backend/src/controllers/attendance/attendance.controller.js` - Updated QR logic
- ✅ `backend/package.json` - Added node-cron dependency

### Frontend
- ✅ `Client/src/data/attendanceSettingsApi.js` - API client
- ✅ `Client/src/routes/attendance-settings.jsx` - Settings page
- ✅ `Client/src/App.jsx` - Added route
- ✅ `Client/src/components/layout/Sidebar.jsx` - Added menu item

## Testing Checklist

### Backend Testing
- [ ] Test GET /api/v1/attendance/settings
- [ ] Test GET /api/v1/attendance/settings/School
- [ ] Test PATCH /api/v1/attendance/settings/School with valid data
- [ ] Test PATCH with invalid time format
- [ ] Test PATCH with invalid off days
- [ ] Verify cron job runs every 30 minutes
- [ ] Test auto-absence marking after cutoff time
- [ ] Test off day skipping
- [ ] Test QR scan updating absent status

### Frontend Testing
- [ ] Navigate to /attendance/settings
- [ ] Verify all three institution cards load
- [ ] Change cutoff time and save
- [ ] Toggle off days and save
- [ ] Verify success/error toasts
- [ ] Test with different time zones
- [ ] Verify responsive design

### Integration Testing
- [ ] Set cutoff time to 5 minutes from now
- [ ] Wait for cron job to run
- [ ] Verify students marked absent
- [ ] Scan QR code for absent student
- [ ] Verify status changes to present
- [ ] Check attendance history shows change
- [ ] Test on off day (no auto-absence)

## Configuration

### Cron Schedule
Current: Every 30 minutes (`*/30 * * * *`)

To change frequency, edit `backend/app.js`:
```javascript
// Every 15 minutes
cron.schedule('*/15 * * * *', async () => { ... });

// Every hour
cron.schedule('0 * * * *', async () => { ... });

// Every day at 9:00 AM
cron.schedule('0 9 * * *', async () => { ... });
```

### Default Settings
To change defaults, edit `backend/create-attendance-settings-table.js`:
```javascript
insert.run('School', '09:00', '[5]'); // Friday off
insert.run('Center', '10:00', '[5,6]'); // Friday + Saturday off
insert.run('Madrasa', '08:00', '[5]'); // Friday off
```

## Important Notes

1. **Time Format**: Always use 24-hour format (HH:MM)
2. **Day Numbers**: 0=Sunday, 1=Monday, ..., 6=Saturday
3. **Cron Job**: Runs automatically when server starts
4. **QR Override**: Absent students can become present via QR scan
5. **Manual Override**: Admin can manually change any attendance status
6. **Off Days**: No attendance records created on off days
7. **Timezone**: Uses server timezone for time comparisons

## Future Enhancements

1. Add email/SMS notifications for absences
2. Add attendance reports by institution
3. Add grace period before marking absent
4. Add holiday calendar integration
5. Add parent notifications
6. Add attendance analytics dashboard
7. Add bulk attendance import/export
8. Add attendance rules per class

## Support

For issues or questions:
1. Check server logs for cron job execution
2. Verify database has attendance_settings table
3. Check time format in settings
4. Verify cron job is running (check console logs)
5. Test with manual API calls using Postman

---

**Implementation Date**: 2024
**Status**: ✅ Complete and Ready for Testing

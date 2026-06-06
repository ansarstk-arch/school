# Student Module Enhancement - Migration Guide

## Changes Made

### 1. Database Schema Updates
- Added `maternal_uncle_name` field to students table (after `grand_father_name`)
- Field is optional (TEXT, nullable)

### 2. Backend Updates
- Updated `schema.js` to include `maternalUncleName` field
- Modified `student.controller.js`:
  - Added `maternalUncleName` to getAllStudents query
  - Enhanced getStudentById to calculate age from DOB
  - Added current month attendance statistics (total, present, absent, leave)
  - Updated createStudent and updateStudent to handle `maternalUncleName`

### 3. Frontend Updates
- Added "د ماما نوم" (Maternal Uncle Name) input field in student form (after grandfather name)
- Enlarged view modal from "md" to "lg" size
- Added age display (calculated from DOB) in view modal
- Added attendance statistics card showing:
  - Total days recorded this month
  - Present days
  - Absent days  
  - Leave days
- Improved view modal layout with sections

## How to Apply Migration

### Step 1: Run the Migration Script
```bash
cd backend
node add-maternal-uncle-field.js
```

This will add the `maternal_uncle_name` column to your existing `students` table.

### Step 2: Restart Backend Server
```bash
npm run dev
```

### Step 3: Restart Frontend Server
```bash
cd ../Client
npm run dev
```

## Features Added

### 1. Maternal Uncle Name Field
- Optional field in student form
- Appears after "Grand Father Name"
- Stored in database as `maternal_uncle_name`
- Displayed in student view modal

### 2. Age Calculation
- Automatically calculated from Date of Birth (DOB)
- Displayed in years in the view modal
- Only shown if DOB is provided

### 3. Monthly Attendance Statistics
- Shows attendance for current month only
- Displays 4 metrics:
  - **Total Days**: Total attendance records
  - **Present**: Days marked present (green)
  - **Absent**: Days marked absent (red)
  - **Leave**: Days marked as leave (blue)
- Color-coded for easy understanding

## Database Field Details

```sql
-- New field added to students table
maternal_uncle_name TEXT NULL
```

## API Response Changes

### getStudentById Response (Enhanced)
```json
{
  "status": 200,
  "message": "زده کوونکی ترلاسه شو",
  "data": {
    "student": {
      "id": 1,
      "fullName": "...",
      "fatherName": "...",
      "grandFatherName": "...",
      "maternalUncleName": "...",  // NEW
      "age": 15,                    // NEW (calculated)
      "attendanceStats": {          // NEW
        "totalDays": 20,
        "present": 18,
        "absent": 1,
        "leave": 1
      },
      "enrollments": [...],
      ...
    }
  }
}
```

## Testing Checklist

- [ ] Migration script runs successfully
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can create new student with maternal uncle name
- [ ] Can update existing student and add maternal uncle name
- [ ] Can view student and see maternal uncle name
- [ ] Age displays correctly when DOB is provided
- [ ] Age is hidden when DOB is not provided
- [ ] Attendance stats show correctly for current month
- [ ] Attendance stats display with proper colors
- [ ] View modal is larger and shows all information properly

## Rollback (If Needed)

If you need to remove the field:

```sql
-- SQLite doesn't support DROP COLUMN directly
-- You would need to recreate the table without the field
-- It's recommended to keep the field as it's nullable and optional
```

---

**Note**: All changes are backward compatible. Existing students without maternal uncle name will display "—" in the view modal.

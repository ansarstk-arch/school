# Attendance System - Flow Diagrams

## 1. Daily Attendance Flow (QR Method)

```
┌─────────────────────────────────────────────────────────────┐
│                     START OF DAY                             │
│                      08:00 AM                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │  Teacher Opens QR Scanner               │
    │  Selects: Date, Class, QR Method       │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Students Arrive & Scan QR Codes       │
    │  Each scan → Status: "Present"         │
    │  Timestamp recorded                    │
    └────────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  09:00 AM      │
        │  AUTO-ABSENCE  │
        │  RUNS          │
        └────────┬───────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  System finds all students without     │
    │  attendance record for today           │
    │  Marks them ALL as "Absent"            │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │         Late Student Arrives            │
    │           (09:30 AM)                    │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Student Scans QR Code                 │
    │  System checks existing record         │
    │  Status: "Absent" → "Present"          │
    │  Log: "QR scan after auto-absence"     │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Another Student Scans Again           │
    │  Already marked "Present"              │
    │  Message: "د نن ورځې حاضري مخکې ثبت شوې"│
    │  No duplicate entry                    │
    └────────────────────────────────────────┘
```

---

## 2. Manual Attendance Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Teacher Opens Attendance Page                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │  Select:                                │
    │  • Method: Manual                       │
    │  • Institution: School                  │
    │  • Class: Grade 10-A                    │
    │  • Date: Today                          │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Click "Manage Attendance"              │
    │  System loads all students in class    │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Display Students Table                 │
    │  Shows previous attendance if exists   │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Teacher Options:                       │
    │  A. Individual: Click P/A/L per student│
    │  B. Bulk: Mark all Present → exceptions│
    │  C. Search: Find specific student      │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Mark Student Status:                   │
    │  • Present (Green)                      │
    │  • Absent (Red)                         │
    │  • Leave (Yellow)                       │
    │  • Clear (Remove mark)                  │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Review Statistics:                     │
    │  Total: 35 | Present: 30               │
    │  Absent: 4 | Leave: 1                   │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Click "Save Attendance"                │
    │  System validates and saves to DB      │
    │  Success message shown                 │
    └────────────────────────────────────────┘
```

---

## 3. QR Code Scanning Logic

```
┌─────────────────────────────────────────────────────────────┐
│                  Student Scans QR Code                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │  Decode & Validate QR Code              │
    │  Extract: StudentID, Date, Type        │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Check: Attendance record exists       │
    │  for this student + today?             │
    └────────────┬───────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    NO RECORD       HAS RECORD
         │               │
         │               └──────┬──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐         ┌──────────┐         ┌─────────────┐
    │ CREATE  │         │ ABSENT?  │         │  PRESENT?   │
    │ NEW     │         │          │         │             │
    │ RECORD  │         │   YES    │         │    YES      │
    │         │         │   ↓      │         │    ↓        │
    │ Status: │         │ UPDATE   │         │  REJECT     │
    │ Present │         │ to       │         │  "Already   │
    │         │         │ Present  │         │   marked"   │
    │ Method: │         │          │         │             │
    │ QR      │         │ Log:     │         │             │
    │         │         │ "After   │         │             │
    │ Time:   │         │ auto-    │         │             │
    │ Now     │         │ absence" │         │             │
    └─────────┘         └──────────┘         └─────────────┘
         │                      │                      │
         └──────────┬───────────┴──────────────────────┘
                    │
                    ▼
    ┌────────────────────────────────────────┐
    │  Return Response to Frontend            │
    │  • Success/Error message                │
    │  • Updated attendance record            │
    │  • Action type (created/updated/reject) │
    └────────────────────────────────────────┘
```

---

## 4. Auto-Absence Cron Job Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Cron Job Scheduler                              │
│        Runs at configured time (default 09:00)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │  Load Attendance Settings               │
    │  Get: absenceMarkingTime                │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Get Today's Date (Afghan/Gregorian)   │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Query Database:                        │
    │  FOR STUDENTS:                          │
    │  • Get all students from all classes   │
    │  • Check attendance record for today   │
    │  • Identify students without record    │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Query Database:                        │
    │  FOR STAFF/TEACHERS:                    │
    │  • Get all active staff & teachers     │
    │  • Check attendance record for today   │
    │  • Identify staff without record       │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  For each person without record:        │
    │  CREATE attendance record with:         │
    │  • Status: "Absent"                     │
    │  • Method: "Auto"                       │
    │  • Date: Today                          │
    │  • Timestamp: Now                       │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Log Results:                           │
    │  • Total processed                      │
    │  • Students marked absent               │
    │  • Staff marked absent                  │
    │  • Any errors encountered               │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Schedule Next Run:                     │
    │  Tomorrow at same time                  │
    └────────────────────────────────────────┘
```

---

## 5. Excel Report Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│         User Clicks "Excel Report Download"                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │  Collect Parameters:                    │
    │  • Attendance Type (Student/Staff)     │
    │  • Institution Type (for students)     │
    │  • Class ID (for students)             │
    │  • Start Date                           │
    │  • End Date                             │
    │  • Format: excel                        │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  API Request to Backend:                │
    │  GET /attendance/download/report        │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Backend Controller:                    │
    │  1. Validate parameters                │
    │  2. Query attendance records           │
    │  3. Get person details                 │
    │  4. Calculate statistics               │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Prepare Report Data:                   │
    │  • Records array                        │
    │  • Filters object                       │
    │  • Statistics (total/present/absent)   │
    │  • School information                   │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Call generateExcelReport():            │
    │  • Create workbook                      │
    │  • Add worksheet with RTL              │
    │  • Build header section                │
    │  • Add school details                  │
    │  • Insert filter info                  │
    │  • Add statistics summary              │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Format Excel File:                     │
    │  • Create table headers                │
    │  • Add data rows with color coding     │
    │  • Apply borders and styling           │
    │  • Set column widths                   │
    │  • Enable auto-filter                  │
    │  • Freeze header rows                  │
    │  • Add footer                           │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Generate Buffer:                       │
    │  workbook.xlsx.writeBuffer()           │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Send Response:                         │
    │  • Content-Type: xlsx                  │
    │  • Content-Disposition: attachment     │
    │  • Filename with date range            │
    │  • Buffer data                          │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Frontend Receives Blob:                │
    │  • Create download URL                 │
    │  • Create temporary link               │
    │  • Trigger download                     │
    │  • Cleanup URL and link                │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  User Receives File:                    │
    │  attendance_YYYY-MM-DD_YYYY-MM-DD.xlsx │
    │  Saved to Downloads folder             │
    └────────────────────────────────────────┘
```

---

## 6. Settings Save Flow

```
┌─────────────────────────────────────────────────────────────┐
│           User Opens Attendance Settings                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │  Load Existing Settings from API        │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Initialize State with Defaults:        │
    │  • defaultCheckInTime: "08:00"         │
    │  • defaultCheckOutTime: "15:00"        │
    │  • absenceMarkingTime: "09:00"         │
    │  • qrCodeValidity: 24                   │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  If Settings Exist:                     │
    │  Override defaults with DB values      │
    │  Ensure all time fields populated      │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Display Form with Values               │
    │  User can modify:                       │
    │  • Check-in time picker                │
    │  • Check-out time picker               │
    │  • Absence marking time picker         │
    │  • QR validity number input            │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  User Clicks "Save Settings"            │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Validate Form:                         │
    │  • All time fields have values?        │
    │  • Times in HH:MM format?              │
    │  • QR validity is number > 0?          │
    └────────────┬───────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    VALIDATION      VALIDATION
       PASS            FAIL
         │               │
         │               ▼
         │      ┌────────────────┐
         │      │ Show Error     │
         │      │ "فیلډونه اړین"│
         │      └────────────────┘
         │
         ▼
    ┌────────────────────────────────────────┐
    │  Send API Request:                      │
    │  POST /attendance/settings              │
    │  Body: All setting values              │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Backend Creates/Updates Settings:      │
    │  • Upsert to database                  │
    │  • Validate time formats               │
    │  • Update cron schedule                │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │  Return Success Response                │
    │  Show toast: "ترتیبات ثبت شول"        │
    └────────────────────────────────────────┘
```

---

## 7. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Attendance  │  │  Attendance  │  │   QR Code    │            │
│  │   Students   │  │    Staff     │  │   Scanner    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                         │
│                  ┌────────▼────────┐                               │
│                  │  Attendance API │                               │
│                  │   (attendanceApi)│                              │
│                  └────────┬────────┘                               │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                   HTTP/HTTPS (REST API)
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      BACKEND (Express.js)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    API Routes                                │  │
│  │  /attendance/*                                               │  │
│  └─────────────┬────────────────────────────────────────────────┘  │
│                │                                                    │
│  ┌─────────────▼────────────────────────────────────────────────┐  │
│  │              Controllers                                      │  │
│  │  • attendance.controller.js                                  │  │
│  │  • attendance-settings.controller.js                         │  │
│  └─────────────┬────────────────────────────────────────────────┘  │
│                │                                                    │
│  ┌─────────────▼────────────────────────────────────────────────┐  │
│  │              Utilities                                        │  │
│  │  • attendanceExport.util.js (Excel generation)              │  │
│  │  • autoAbsence.util.js (Cron job)                           │  │
│  │  • attendanceQr.util.js (QR encoding/decoding)              │  │
│  └─────────────┬────────────────────────────────────────────────┘  │
│                │                                                    │
│  ┌─────────────▼────────────────────────────────────────────────┐  │
│  │           Database Layer (Drizzle ORM)                        │  │
│  │  • schema.js (attendance table)                              │  │
│  │  • schema.js (attendance_settings table)                     │  │
│  └─────────────┬────────────────────────────────────────────────┘  │
└────────────────┼─────────────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐       ┌──────────────────────┐              │
│  │   attendance     │       │  attendance_settings │              │
│  ├──────────────────┤       ├──────────────────────┤              │
│  │ id               │       │ id                   │              │
│  │ attendanceType   │       │ defaultCheckInTime   │              │
│  │ personId         │       │ defaultCheckOutTime  │              │
│  │ institutionType  │       │ absenceMarkingTime   │              │
│  │ classId          │       │ qrCodeValidity       │              │
│  │ attendanceDate   │       │ createdAt            │              │
│  │ status           │       │ updatedAt            │              │
│  │ attendanceMethod │       └──────────────────────┘              │
│  │ scannedAt        │                                              │
│  │ notes            │       ┌──────────────────────┐              │
│  │ takenBy          │       │     students         │              │
│  │ updatedBy        │       ├──────────────────────┤              │
│  │ originalStatus   │       │ id                   │              │
│  │ changeReason     │◄──────┤ fullName             │              │
│  │ createdAt        │       │ fatherName           │              │
│  │ updatedAt        │       │ classId              │              │
│  └──────────────────┘       │ rollNumber           │              │
│                              └──────────────────────┘              │
│                                                                     │
│  ┌──────────────────┐       ┌──────────────────────┐              │
│  │      staff       │       │      teachers        │              │
│  ├──────────────────┤       ├──────────────────────┤              │
│  │ id               │       │ id                   │              │
│  │ name             │       │ name                 │              │
│  │ fatherName       │       │ fatherName           │              │
│  │ position         │       │ education            │              │
│  │ staffType        │       │ ...                  │              │
│  │ ...              │       └──────────────────────┘              │
│  └──────────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOBS (Node-Cron)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Auto-Absence Cron Job                                        │  │
│  │  • Runs daily at configured time                             │  │
│  │  • Marks absent all without attendance                       │  │
│  │  • Logs execution results                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components Interaction

### 1. QR Scanner → Backend
```
Scanner → Decode QR → Extract Data → API Call → Validate → Update DB → Response
```

### 2. Manual Entry → Backend
```
Form → Collect Status → Bulk Array → API Call → Validate → Insert/Update → Response
```

### 3. Auto-Absence → Database
```
Cron Trigger → Load Settings → Query People → Check Records → Mark Absent → Log
```

### 4. Excel Download → File
```
Request → Query DB → Format Data → Generate Excel → Create Buffer → Send File
```

---

**Last Updated**: June 1, 2026
**Document Version**: 1.0.0

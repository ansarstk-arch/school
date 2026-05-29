# Attendance System - Visual Flow Diagram

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                     http://localhost:5173                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Sidebar Navigation                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  حاضري (Attendance)                                  │  │  │
│  │  │    ├─ د زده کوونکو حاضري (Student Attendance)       │  │  │
│  │  │    └─ د کارمندانو حاضري (Staff Attendance)          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Student Attendance Page                            │  │
│  │  (attendance-students.jsx)                                 │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Selection Form                                      │  │  │
│  │  │  • Attendance Method (Manual/QR)                     │  │  │
│  │  │  • Institution Type (School/Madrasa/Center)          │  │  │
│  │  │  • Class (auto-fetch by institution)                 │  │  │
│  │  │  • Date (default: today)                             │  │  │
│  │  │  [د حاضرۍ مدیریت] Button                             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Statistics Dashboard                                │  │  │
│  │  │  [Total] [Present] [Absent] [Leave] [Undefined]     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Actions Bar                                         │  │  │
│  │  │  [Search] [Bulk Actions] [Save Button]              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Attendance Table                                    │  │  │
│  │  │  ┌────┬────┬──────┬────────┬──────────────────────┐ │  │  │
│  │  │  │ #  │ ID │ Name │ Father │ Status Buttons       │ │  │  │
│  │  │  ├────┼────┼──────┼────────┼──────────────────────┤ │  │  │
│  │  │  │ 1  │ 01 │ احمد │ محمد   │ [P] [A] [L] [X]     │ │  │  │
│  │  │  │ 2  │ 02 │ علی  │ حسن    │ [P] [A] [L] [X]     │ │  │  │
│  │  │  │... │... │ ...  │ ...    │ ...                  │ │  │  │
│  │  │  └────┴────┴──────┴────────┴──────────────────────┘ │  │  │
│  │  │  30 students per page                                │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Pagination                                          │  │  │
│  │  │  [پخوانی] Page 1 of 5 [راتلونکی]                    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Staff Attendance Page                              │  │
│  │  (attendance-staff.jsx)                                    │  │
│  │  [Same structure as Student Attendance]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         QR Scanner Modal                                   │  │
│  │  (QRAttendanceScanner.jsx)                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Camera View                                         │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │  [Video Feed with Scanning Overlay]           │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  │  Manual Input: [QR Code] [سکین]                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                 │
│                     http://localhost:3000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              API Routes                                    │  │
│  │  /api/v1/attendance/                                       │  │
│  │    ├─ GET  /people/list      (Get students/staff)         │  │
│  │    ├─ POST /bulk             (Bulk save attendance)       │  │
│  │    ├─ POST /qr               (QR attendance)              │  │
│  │    ├─ GET  /stats/summary    (Get statistics)             │  │
│  │    └─ GET  /                 (Get all attendance)         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Controllers                                   │  │
│  │  (attendance.controller.js)                                │  │
│  │    ├─ getAllAttendance()                                   │  │
│  │    ├─ getPeopleForAttendance()                             │  │
│  │    ├─ bulkCreateAttendance()                               │  │
│  │    ├─ qrAttendance()                                       │  │
│  │    └─ getAttendanceStats()                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Validators                                    │  │
│  │  (attendance.validator.js)                                 │  │
│  │    ├─ bulkAttendanceValidator                              │  │
│  │    └─ qrAttendanceValidator                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Middlewares                                   │  │
│  │    ├─ authMiddleware (JWT verification)                    │  │
│  │    ├─ validate (Input validation)                          │  │
│  │    └─ ErrorMiddleware (Error handling)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ SQL
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite)                           │
│                  backend/database/school.db                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  attendance Table                                          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  id (PK)                                              │ │  │
│  │  │  attendanceType (Student/Staff)                       │ │  │
│  │  │  personId (FK to students/staff)                      │ │  │
│  │  │  institutionType (School/Center/Madrasa)              │ │  │
│  │  │  classId (FK to classes)                              │ │  │
│  │  │  attendanceDate (YYYY-MM-DD)                          │ │  │
│  │  │  status (Present/Absent/Leave/NULL)                   │ │  │
│  │  │  attendanceMethod (Manual/QR)                         │ │  │
│  │  │  scannedAt (timestamp)                                │ │  │
│  │  │  notes                                                 │ │  │
│  │  │  takenBy (FK to users)                                │ │  │
│  │  │  updatedBy (FK to users)                              │ │  │
│  │  │  changeReason                                          │ │  │
│  │  │  originalStatus                                        │ │  │
│  │  │  createdAt                                             │ │  │
│  │  │  updatedAt                                             │ │  │
│  │  │  UNIQUE(attendanceType, personId, attendanceDate)     │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  students Table                                            │  │
│  │  (id, rollNumber, fullName, fatherName, classId, ...)     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  staff Table                                               │  │
│  │  (id, name, fatherName, position, status, ...)            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  classes Table                                             │  │
│  │  (id, name, section, type, academicYear, ...)             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  users Table                                               │  │
│  │  (id, name, email, password, role, ...)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Manual Attendance Flow

```
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 1. Selects filters
     │    (Method, Institution, Class, Date)
     ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 2. GET /attendance/people/list
         │    ?attendanceType=Student
         │    &institutionType=School
         │    &classId=5
         │    &attendanceDate=2024-01-15
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 3. Query database
         │    - Get students from class
         │    - Get existing attendance
         ↓
┌────────────────────┐
│  Database (SQLite) │
└────────┬───────────┘
         │
         │ 4. Return data
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 5. Response with students + attendance
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 6. Display table with students
         │    and existing attendance status
         ↓
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 7. Marks attendance
     │    (Click Present/Absent/Leave buttons)
     ↓
┌────────────────────┐
│  Frontend (React)  │
│  (State updated)   │
└────────┬───────────┘
         │
         │ 8. Admin clicks "Save"
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 9. POST /attendance/bulk
         │    {
         │      attendanceType: "Student",
         │      institutionType: "School",
         │      classId: 5,
         │      attendanceDate: "2024-01-15",
         │      attendanceData: [
         │        { personId: 1, status: "Present" },
         │        { personId: 2, status: "Absent" },
         │        ...
         │      ]
         │    }
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 10. Validate input
         │     Check authentication
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 11. For each student:
         │     - Check if attendance exists
         │     - If exists: UPDATE
         │     - If not: INSERT
         ↓
┌────────────────────┐
│  Database (SQLite) │
└────────┬───────────┘
         │
         │ 12. Save attendance records
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 13. Response: Success
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 14. Show success toast
         │     Reload table with saved data
         ↓
┌──────────┐
│  Admin   │
└──────────┘
```

---

### 2. QR Attendance Flow

```
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 1. Selects QR method
     │    Clicks "Manage Attendance"
     ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 2. Open QR Scanner Modal
         │    Request camera permission
         ↓
┌────────────────────┐
│  QR Scanner        │
│  (Camera/USB)      │
└────────┬───────────┘
         │
         │ 3. Scan QR Code
         │    Format: "Student:123:5"
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 4. Parse QR Code
         │    Extract: Type, PersonId, ClassId
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 5. POST /attendance/qr
         │    {
         │      qrCode: "Student:123:5",
         │      attendanceDate: "2024-01-15"
         │    }
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 6. Validate QR format
         │    Check authentication
         │    Parse QR code
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 7. Check if person exists
         │    Check if attendance exists
         ↓
┌────────────────────┐
│  Database (SQLite) │
└────────┬───────────┘
         │
         │ 8. If attendance exists:
         │    - Check if scanned < 5 sec ago
         │    - If yes: Return "Already scanned"
         │    - If no: UPDATE status to Present
         │    If not exists:
         │    - INSERT new attendance (Present)
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 9. Response with result
         │    - "حاضر ثبت شو ✓" (New)
         │    - "دمخه حاضر دی" (Already present)
         │    - "دمخه سکین شوی" (Duplicate scan)
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 10. Show toast notification
         │     Display person name + status
         ↓
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 11. Continue scanning
     │     (Repeat from step 3)
     ↓
```

---

## 🎯 Component Hierarchy

```
App.jsx
│
├─ Sidebar
│  └─ حاضري (Attendance)
│     ├─ د زده کوونکو حاضري → /attendance/students
│     └─ د کارمندانو حاضري → /attendance/staff
│
├─ attendance-students.jsx
│  ├─ PageHeader
│  ├─ Selection Form
│  │  ├─ Attendance Method Select
│  │  ├─ Institution Type Select
│  │  ├─ Class Select
│  │  ├─ Date Input
│  │  └─ Manage Button
│  ├─ Statistics Dashboard
│  │  ├─ Total Card
│  │  ├─ Present Card
│  │  ├─ Absent Card
│  │  ├─ Leave Card
│  │  └─ Undefined Card
│  ├─ Actions Bar
│  │  ├─ Search Input
│  │  ├─ Bulk Action Buttons
│  │  └─ Save Button
│  ├─ Attendance Table
│  │  ├─ Table Header
│  │  └─ Table Rows
│  │     └─ Status Buttons
│  ├─ Pagination
│  │  ├─ Previous Button
│  │  ├─ Page Indicator
│  │  └─ Next Button
│  ├─ QRAttendanceScanner (Modal)
│  │  ├─ Camera View
│  │  ├─ Scanning Overlay
│  │  └─ Manual Input
│  └─ Offline Indicator
│
└─ attendance-staff.jsx
   └─ [Same structure as attendance-students.jsx]
```

---

## 🔐 Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Login with credentials
     ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 2. POST /auth/login
         │    { email, password }
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 3. Verify credentials
         │    Generate JWT tokens
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 4. Response with tokens
         │    { accessToken, refreshToken, user }
         ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 5. Store tokens in localStorage
         │    Store user in state
         ↓
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 6. Navigate to attendance page
     ↓
┌────────────────────┐
│  Frontend (React)  │
└────────┬───────────┘
         │
         │ 7. API request with token
         │    Headers: {
         │      Authorization: "Bearer {accessToken}"
         │    }
         ↓
┌────────────────────┐
│  Backend (API)     │
└────────┬───────────┘
         │
         │ 8. authMiddleware verifies token
         │    If valid: Continue
         │    If expired: Refresh token
         │    If invalid: Return 401
         ↓
```

---

## 📊 State Management

```
Frontend State (React useState)
│
├─ Form State
│  ├─ attendanceMethod: "Manual" | "QR"
│  ├─ institutionType: "School" | "Center" | "Madrasa"
│  ├─ classId: number
│  └─ attendanceDate: "YYYY-MM-DD"
│
├─ Data State
│  ├─ classes: Class[]
│  ├─ students: Student[]
│  └─ attendanceData: { [studentId]: status }
│
├─ UI State
│  ├─ loading: boolean
│  ├─ showTable: boolean
│  ├─ showQRScanner: boolean
│  ├─ saving: boolean
│  ├─ searchTerm: string
│  ├─ currentPage: number
│  └─ isOnline: boolean
│
└─ Computed State
   ├─ filteredStudents (from students + searchTerm)
   ├─ paginatedStudents (from filteredStudents + currentPage)
   └─ stats (from attendanceData)
```

---

**This visual guide helps understand the complete system architecture and data flow!** 📊✨

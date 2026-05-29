# Attendance System - Quick Reference

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm run dev
```
✅ Server should start on `http://localhost:3000`

### 2. Start Frontend
```bash
cd Client
npm run dev
```
✅ App should start on `http://localhost:5173`

### 3. Login
- Email: `admin@school.af`
- Password: `admin123`

### 4. Navigate to Attendance
- Sidebar → "حاضري" → "د زده کوونکو حاضري" (Student Attendance)
- OR
- Sidebar → "حاضري" → "د کارمندانو حاضري" (Staff Attendance)

---

## 📋 Student Attendance Workflow

1. **Select Method**: Manual or QR
2. **Select Institution**: School, Madrasa, or Center
3. **Select Class**: From dropdown (current year only)
4. **Select Date**: Default is today
5. **Click**: "د حاضرۍ مدیریت" (Manage Attendance)
6. **Mark Attendance**: Click Present/Absent/Leave for each student
7. **Save**: Click "حاضرۍ ثبت کړئ" (Save Attendance)

---

## 📋 Staff Attendance Workflow

1. **Select Method**: Manual or QR
2. **Select Date**: Default is today
3. **Click**: "د حاضرۍ مدیریت" (Manage Attendance)
4. **Mark Attendance**: Click Present/Absent/Leave for each staff
5. **Save**: Click "حاضرۍ ثبت کړئ" (Save Attendance)

---

## 🎯 Features

### Manual Attendance
- ✅ Table with 30 students/staff per page
- ✅ Status buttons: Present (Green), Absent (Red), Leave (Yellow)
- ✅ Real-time statistics
- ✅ Search by name, father name, or ID
- ✅ Bulk actions (mark all as Present/Absent/Leave)
- ✅ Pagination
- ✅ Save all at once

### QR Attendance
- ✅ Camera scanner
- ✅ USB scanner support
- ✅ Manual QR input
- ✅ Auto-save on scan
- ✅ Duplicate prevention
- ✅ "Already present" message
- ✅ Offline support

---

## 🔧 API Endpoints

### Get People for Attendance
```
GET /api/v1/attendance/people/list
Query Params:
  - attendanceType: "Student" | "Staff"
  - institutionType: "School" | "Center" | "Madrasa" (for students)
  - classId: number (for students)
  - attendanceDate: "YYYY-MM-DD"
```

### Bulk Save Attendance
```
POST /api/v1/attendance/bulk
Headers:
  - Authorization: Bearer {token}
Body:
  {
    "attendanceType": "Student" | "Staff",
    "institutionType": "School" | "Center" | "Madrasa" (for students),
    "classId": number (for students),
    "attendanceDate": "YYYY-MM-DD",
    "attendanceData": [
      { "personId": number, "status": "Present" | "Absent" | "Leave" | null }
    ]
  }
```

### QR Attendance
```
POST /api/v1/attendance/qr
Headers:
  - Authorization: Bearer {token}
Body:
  {
    "qrCode": "Student:123:5" or "Staff:67",
    "attendanceDate": "YYYY-MM-DD"
  }
```

### Get Attendance Stats
```
GET /api/v1/attendance/stats/summary
Query Params:
  - attendanceType: "Student" | "Staff"
  - institutionType: "School" | "Center" | "Madrasa"
  - classId: number
  - startDate: "YYYY-MM-DD"
  - endDate: "YYYY-MM-DD"
```

---

## 🎨 UI Components

### Status Buttons
- **Present**: Green background, white text
- **Absent**: Red background, white text
- **Leave**: Yellow background, dark text
- **Clear (X)**: Gray background, removes status

### Statistics Cards
- **Total**: Gray with Users icon
- **Present**: Green with CheckCircle icon
- **Absent**: Red with XCircle icon
- **Leave**: Yellow with Timer icon
- **Undefined**: Gray with Clock icon

### Bulk Actions
- **ټول حاضر**: Mark all as Present
- **ټول غیر حاضر**: Mark all as Absent
- **ټول رخصتي**: Mark all as Leave
- **ټول پاک**: Clear all selections

---

## 🔐 Security

- ✅ Authentication required for save operations
- ✅ User ID tracked (takenBy, updatedBy)
- ✅ Audit trail (originalStatus, changeReason)
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS protection
- ✅ Rate limiting

---

## 📊 Database Schema

### attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendanceType TEXT NOT NULL, -- "Student" | "Staff"
  personId INTEGER NOT NULL,
  institutionType TEXT, -- "School" | "Center" | "Madrasa"
  classId INTEGER,
  attendanceDate TEXT NOT NULL, -- "YYYY-MM-DD"
  status TEXT, -- "Present" | "Absent" | "Leave" | NULL
  attendanceMethod TEXT NOT NULL DEFAULT 'Manual', -- "Manual" | "QR"
  scannedAt TEXT,
  notes TEXT,
  takenBy INTEGER,
  updatedBy INTEGER,
  changeReason TEXT,
  originalStatus TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(attendanceType, personId, attendanceDate)
);
```

---

## 🐛 Quick Fixes

### Classes not loading?
```bash
# Check backend is running
curl http://localhost:3000/health

# Check database has classes
cd backend
npm run db:studio
# Browse to classes table
```

### Students not loading?
```bash
# Check students exist in database
cd backend
npm run db:studio
# Browse to students table
# Verify classId matches selected class
```

### Cannot save attendance?
```javascript
// Check you're logged in
// In browser console:
localStorage.getItem('accessToken')
// Should return a token
// If null, login again
```

### QR scanner not working?
- Grant camera permission in browser
- Or use manual QR input as fallback
- Format: `Student:123:5` or `Staff:67`

---

## 📱 Responsive Design

### Desktop (1024px+)
- 4-column form layout
- 5-column statistics
- Full table width

### Tablet (768px - 1023px)
- 2-column form layout
- 5-column statistics
- Scrollable table

### Mobile (< 768px)
- 1-column form layout
- 2-column statistics
- Scrollable table
- Stacked buttons

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (not supported)

---

## 📝 QR Code Format

### Student QR Code
```
Student:123:5
```
- Type: "Student"
- Student ID: 123
- Class ID: 5

### Staff QR Code
```
Staff:67
```
- Type: "Staff"
- Staff ID: 67

---

## 🎯 Keyboard Shortcuts

### USB QR Scanner
- Scans automatically
- Sends QR code + Enter key
- No manual input needed

### Manual Input
- Type QR code
- Press Enter to submit
- Or click "سکین" button

---

## 💡 Tips & Tricks

### 1. Fast Attendance Marking
- Use bulk actions for common scenarios
- Example: Mark all present, then change exceptions

### 2. Search Efficiency
- Search by roll number for quick access
- Search by name for unknown roll numbers

### 3. QR Scanner Speed
- USB scanner is faster than camera
- Position QR code 10-15cm from scanner
- Ensure good lighting

### 4. Offline Mode
- QR scans stored locally when offline
- Auto-sync when back online
- Check localStorage for pending scans

### 5. Date Selection
- Default is today (most common)
- Can mark past attendance
- Cannot mark future attendance (security)

---

## 🔄 Data Flow

### Manual Attendance
1. User selects filters
2. Frontend fetches people + existing attendance
3. User marks attendance in UI
4. User clicks save
5. Frontend sends bulk update to backend
6. Backend validates and saves
7. Frontend shows success message
8. Table reloads with saved data

### QR Attendance
1. User opens QR scanner
2. QR code scanned (camera or USB)
3. Frontend sends to backend immediately
4. Backend validates and saves
5. Frontend shows success message
6. Duplicate scans prevented (5 second window)

---

## 📈 Performance

### Optimization
- ✅ Pagination (30 items per page)
- ✅ Client-side filtering
- ✅ Bulk save (one API call)
- ✅ Cached data in state
- ✅ Debounced search
- ✅ Lazy loading

### Benchmarks
- Load 100 students: < 1 second
- Mark attendance: Instant (client-side)
- Save attendance: < 2 seconds
- QR scan: < 1 second

---

## 🎉 Success Checklist

Before going live, verify:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login successfully
- [ ] Classes load correctly
- [ ] Students/Staff load correctly
- [ ] Can mark attendance
- [ ] Statistics update correctly
- [ ] Can save attendance
- [ ] QR scanner works
- [ ] Duplicate prevention works
- [ ] Search works
- [ ] Pagination works
- [ ] Bulk actions work
- [ ] Offline mode works
- [ ] Mobile responsive
- [ ] All toast notifications work

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Check ATTENDANCE_TESTING_GUIDE.md
3. Check ATTENDANCE_IMPLEMENTATION.md
4. Check browser console for errors
5. Check backend logs for errors

---

**Built with ❤️ for Afghan Schools**

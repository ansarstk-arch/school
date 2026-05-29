# Attendance System - Testing & Troubleshooting Guide

## 🧪 Testing Checklist

### Backend Testing

#### 1. **Start Backend Server**
```bash
cd backend
npm run dev
```
Expected output: `Server running on port 3000`

#### 2. **Test Health Endpoint**
```bash
curl http://localhost:3000/health
```
Expected: `{ "success": true, "status": 200, "message": "Server is running" }`

#### 3. **Test Attendance Endpoints**

**Get People for Attendance (Students):**
```bash
curl "http://localhost:3000/api/v1/attendance/people/list?attendanceType=Student&institutionType=School&classId=1&attendanceDate=2024-01-15"
```

**Get People for Attendance (Staff):**
```bash
curl "http://localhost:3000/api/v1/attendance/people/list?attendanceType=Staff&attendanceDate=2024-01-15"
```

**Bulk Create Attendance (requires auth):**
```bash
curl -X POST http://localhost:3000/api/v1/attendance/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "attendanceType": "Student",
    "institutionType": "School",
    "classId": 1,
    "attendanceDate": "2024-01-15",
    "attendanceData": [
      { "personId": 1, "status": "Present" },
      { "personId": 2, "status": "Absent" }
    ]
  }'
```

**QR Attendance (requires auth):**
```bash
curl -X POST http://localhost:3000/api/v1/attendance/qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "qrCode": "Student:1:5",
    "attendanceDate": "2024-01-15"
  }'
```

---

### Frontend Testing

#### 1. **Start Frontend Server**
```bash
cd Client
npm run dev
```
Expected output: `Local: http://localhost:5173`

#### 2. **Login**
- Navigate to `http://localhost:5173`
- Login with: `admin@school.af` / `admin123`

#### 3. **Test Student Attendance**

**Step 1: Navigate**
- Click "حاضري" in sidebar
- Click "د زده کوونکو حاضري"

**Step 2: Select Options**
- Attendance Method: "لاسي" (Manual)
- Institution Type: "ښوونځی" (School)
- Class: Select any class
- Date: Keep today's date
- Click "د حاضرۍ مدیریت"

**Expected Results:**
- ✅ Table appears with students
- ✅ Statistics show: Total, Present (0), Absent (0), Leave (0), Undefined (all)
- ✅ Search box works
- ✅ Bulk action buttons visible
- ✅ Save button visible

**Step 3: Mark Attendance**
- Click "حاضر" (Present) for a few students
- Click "غیر حاضر" (Absent) for a few students
- Click "رخصتي" (Leave) for a few students

**Expected Results:**
- ✅ Buttons change color when selected
- ✅ Statistics update in real-time
- ✅ Can change status by clicking different button

**Step 4: Test Bulk Actions**
- Click "ټول حاضر" (Mark all Present)

**Expected Results:**
- ✅ All students marked as Present
- ✅ Statistics update: Present = Total
- ✅ All buttons show green

**Step 5: Test Search**
- Type a student name in search box

**Expected Results:**
- ✅ Table filters to matching students
- ✅ Pagination resets to page 1
- ✅ Statistics remain for all students (not filtered)

**Step 6: Save Attendance**
- Click "حاضرۍ ثبت کړئ" (Save Attendance)

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Success toast notification
- ✅ Table reloads with saved data
- ✅ Previously marked attendance persists

**Step 7: Test Pagination**
- If more than 30 students, test pagination

**Expected Results:**
- ✅ "راتلونکی" (Next) button works
- ✅ "پخوانی" (Previous) button works
- ✅ Page indicator updates
- ✅ Buttons disable at first/last page

#### 4. **Test QR Scanner**

**Step 1: Select QR Method**
- Change Attendance Method to "QR کوډ"
- Click "د حاضرۍ مدیریت"

**Expected Results:**
- ✅ Camera modal opens
- ✅ Camera permission requested
- ✅ Video feed appears
- ✅ Scanning overlay visible

**Step 2: Test Manual QR Input**
- Type in manual input: `Student:1:5`
- Press Enter or click "سکین"

**Expected Results:**
- ✅ Success toast appears
- ✅ Shows student name
- ✅ "حاضر ثبت شو ✓" message

**Step 3: Test Duplicate Prevention**
- Enter same QR code again immediately

**Expected Results:**
- ✅ "دمخه سکین شوی" message
- ✅ No duplicate attendance created

**Step 4: Test Invalid QR**
- Enter invalid QR: `InvalidFormat`

**Expected Results:**
- ✅ Error toast appears
- ✅ "د QR کوډ فارمټ سم نه دی" message

#### 5. **Test Staff Attendance**

**Step 1: Navigate**
- Click "حاضري" in sidebar
- Click "د کارمندانو حاضري"

**Step 2: Select Options**
- Attendance Method: "لاسي" (Manual)
- Date: Keep today's date
- Click "د حاضرۍ مدیریت"

**Expected Results:**
- ✅ Table appears with all active staff
- ✅ Shows: ID, Name, Father Name, Position, Status
- ✅ All features work same as student attendance

**Step 3: Test All Features**
- Mark attendance
- Use bulk actions
- Search staff
- Save attendance
- Test QR scanner

**Expected Results:**
- ✅ All features work identically to student attendance

---

## 🐛 Common Issues & Solutions

### Issue 1: "Classes not loading"

**Symptoms:**
- Class dropdown is empty
- Console error: "Failed to fetch classes"

**Solutions:**
1. Check backend is running: `http://localhost:3000/health`
2. Check database has classes for current year
3. Check browser console for errors
4. Verify API URL in `.env`: `VITE_API_URL=http://localhost:3000/api/v1`

**Fix:**
```bash
# Add test classes
cd backend
npm run db:studio
# Add classes with academicYear = current Shamsi year (1405)
```

---

### Issue 2: "Students not loading"

**Symptoms:**
- Table doesn't appear after clicking "Manage Attendance"
- Console error: "Failed to load students"

**Solutions:**
1. Verify class has students enrolled
2. Check students have correct classId
3. Check backend logs for errors

**Fix:**
```bash
# Check database
cd backend
npm run db:studio
# Verify students table has records with matching classId
```

---

### Issue 3: "Cannot save attendance"

**Symptoms:**
- Save button doesn't work
- Error: "Authentication required"

**Solutions:**
1. Check you're logged in
2. Check access token in localStorage
3. Check backend auth middleware

**Fix:**
```javascript
// In browser console
localStorage.getItem('accessToken')
// Should return a token, if null, login again
```

---

### Issue 4: "QR Scanner not opening"

**Symptoms:**
- Camera modal doesn't appear
- Console error: "Camera permission denied"

**Solutions:**
1. Grant camera permission in browser
2. Use HTTPS (camera requires secure context)
3. Check browser supports camera API

**Fix:**
- Chrome: Settings → Privacy → Camera → Allow
- Firefox: Preferences → Privacy → Permissions → Camera → Allow
- Or use manual QR input as fallback

---

### Issue 5: "Duplicate attendance error"

**Symptoms:**
- Error: "Attendance already exists"
- Cannot save attendance

**Expected Behavior:**
- This is correct! System prevents duplicates
- Update existing attendance instead

**Solution:**
- System automatically updates existing records
- No action needed

---

### Issue 6: "Date validation error"

**Symptoms:**
- Cannot select future dates
- Error: "Invalid attendance date"

**Expected Behavior:**
- This is correct! Cannot mark attendance for future dates
- Can only mark for today or past dates

**Solution:**
- Select today's date or earlier
- This is a security feature

---

### Issue 7: "Offline mode not working"

**Symptoms:**
- QR scans fail when offline
- No offline indicator appears

**Solutions:**
1. Check browser supports localStorage
2. Check service worker is registered
3. Verify offline detection

**Fix:**
```javascript
// In browser console
navigator.onLine // Should return false when offline
localStorage.getItem('offlineAttendanceScans') // Should show stored scans
```

---

### Issue 8: "Statistics not updating"

**Symptoms:**
- Numbers don't change when marking attendance
- Stats show 0 for everything

**Solutions:**
1. Check React state is updating
2. Check browser console for errors
3. Refresh page

**Fix:**
- This should work automatically
- If not, it's a React state issue
- Check browser console for errors

---

### Issue 9: "Search not working"

**Symptoms:**
- Typing in search box doesn't filter
- All students still visible

**Solutions:**
1. Check search term is being set
2. Check filter logic
3. Check browser console

**Fix:**
- Should work automatically
- Clear search box and try again
- Refresh page if needed

---

### Issue 10: "Pagination broken"

**Symptoms:**
- Next/Previous buttons don't work
- Page number doesn't change

**Solutions:**
1. Check total pages calculation
2. Check currentPage state
3. Check browser console

**Fix:**
- Should work automatically
- Refresh page if needed

---

## 🔍 Debugging Tips

### 1. **Check Browser Console**
```javascript
// Open DevTools (F12)
// Check Console tab for errors
// Look for red error messages
```

### 2. **Check Network Tab**
```javascript
// Open DevTools (F12)
// Go to Network tab
// Filter by "Fetch/XHR"
// Check API requests and responses
```

### 3. **Check Backend Logs**
```bash
# Backend terminal shows all requests
# Look for errors in red
# Check SQL queries
```

### 4. **Check Database**
```bash
cd backend
npm run db:studio
# Opens Drizzle Studio at http://localhost:4983
# Browse tables: students, staff, classes, attendance
```

### 5. **Check localStorage**
```javascript
// In browser console
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
localStorage.getItem('user')
localStorage.getItem('offlineAttendanceScans')
```

---

## 📊 Database Queries for Testing

### Check Students in Class
```sql
SELECT * FROM students WHERE classId = 1;
```

### Check Active Staff
```sql
SELECT * FROM staff WHERE status = 'active';
```

### Check Today's Attendance
```sql
SELECT * FROM attendance 
WHERE attendanceDate = '2024-01-15' 
AND attendanceType = 'Student';
```

### Check Duplicate Attendance
```sql
SELECT personId, COUNT(*) as count 
FROM attendance 
WHERE attendanceDate = '2024-01-15' 
GROUP BY personId 
HAVING count > 1;
```

### Clear Today's Attendance (for testing)
```sql
DELETE FROM attendance WHERE attendanceDate = '2024-01-15';
```

---

## ✅ Success Indicators

### Everything is working if:
1. ✅ Backend starts without errors
2. ✅ Frontend starts without errors
3. ✅ Can login successfully
4. ✅ Classes load in dropdown
5. ✅ Students/Staff load in table
6. ✅ Can mark attendance
7. ✅ Statistics update in real-time
8. ✅ Can save attendance
9. ✅ Success toast appears
10. ✅ QR scanner opens
11. ✅ Can scan QR codes
12. ✅ Duplicate prevention works
13. ✅ Search filters correctly
14. ✅ Pagination works
15. ✅ Bulk actions work
16. ✅ Offline mode works

---

## 🚀 Performance Tips

### 1. **Optimize Large Classes**
- Pagination set to 30 students per page
- Increase if needed in code: `itemsPerPage = 50`

### 2. **Improve QR Scanning Speed**
- Use USB QR scanner instead of camera
- Faster and more reliable
- No camera permission needed

### 3. **Reduce Network Requests**
- Attendance data cached in state
- Only saves when clicking "Save" button
- Bulk save reduces API calls

### 4. **Offline Support**
- QR scans stored locally when offline
- Auto-sync when back online
- No data loss

---

## 📝 Notes

1. **Academic Year**: System uses Shamsi calendar year (1405)
2. **Date Format**: YYYY-MM-DD (Gregorian calendar)
3. **QR Format**: `Type:PersonId:ClassId` (e.g., `Student:123:5`)
4. **Status Options**: Present, Absent, Leave, null (undefined)
5. **Attendance Method**: Manual or QR
6. **Duplicate Prevention**: One attendance per person per day
7. **Audit Trail**: Tracks who created/updated attendance
8. **Offline Support**: QR scans stored locally when offline

---

## 🎉 Ready for Production!

If all tests pass, the system is ready for production use!

**Built with ❤️ for Afghan Schools**

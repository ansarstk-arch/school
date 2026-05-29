# Student Management - Quick Testing Guide

## Prerequisites
- ✅ Backend server is running on port 3000
- ✅ Frontend is running on port 5173
- ✅ You have a valid authentication token

## Quick Test Steps

### 1. Access the Students Page
```
http://localhost:5173/students
```

### 2. Test Filters

**Academic Year Filter:**
- Should show current year (1404) as default with "(اوسنی)" label
- Should show last 5 years in dropdown
- Selecting a year should filter students

**Enrollment Type Filter:**
- Options: ښوونځی (School), مرکز (Center), مدرسه (Madrasa)
- Selecting a type should filter students by enrollment

**Name Search:**
- Type student name or father name
- Should filter results in real-time

### 3. Test Create Student

**Click "نوی زده کوونکی" button:**

1. **Fill Required Fields:**
   - بشپړ نوم (Full Name): احمد کریمي
   - د پلار نوم (Father Name): محمد کریم

2. **Select Enrollment Types:**
   - Click on ښوونځی (School) - should turn blue
   - Click on مرکز (Center) - should turn blue
   - Both should now show class selection sections

3. **Select Classes:**
   - For School: Select a class from dropdown (fetched from backend)
   - For Center: Select a class from dropdown (fetched from backend)
   - Enter monthly fees for each

4. **Upload Image (Optional):**
   - Click "انځور غوره کول"
   - Select a JPG/PNG/WEBP image
   - Preview should appear
   - Can remove by clicking X button

5. **Fill Optional Fields:**
   - Phone: +93 700 111 222
   - Emergency Contact: +93 700 222 333
   - Address: کابل، افغانستان
   - Registration Fee: 500

6. **Submit:**
   - Click "ثبتول" button
   - Should show loading state: "...په ثبتیدو کې"
   - Success toast: "زده کوونکی بریالیتوب سره ثبت شو"
   - Table should refresh with new student

### 4. Test Validation

**Try submitting without required fields:**
- Leave Full Name empty → Should show: "بشپړ نوم اړین دی"
- Leave Father Name empty → Should show: "د پلار نوم اړین دی"
- Select enrollment but no class → Should show: "د ښوونځی لپاره ټولګی وټاکئ"
- Invalid phone format → Should show: "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي"

### 5. Test View Student

**Click the eye icon on any student:**
- Modal should open
- Should show all student details
- Should show enrollments with badges
- Should show fees for each enrollment
- Should show registration fee

### 6. Test Edit Student

**Click the pencil icon on any student:**
- Modal should open with pre-filled data
- Enrollments should be pre-selected
- Classes should be pre-selected
- Image should show if exists
- Can modify any field
- Can change enrollments
- Can update image
- Can remove image
- Click "ثبتول" to save
- Success toast: "زده کوونکی بریالیتوب سره تازه شو"

### 7. Test Delete Student

**Click the trash icon on any student:**
- Confirmation modal should open
- Shows student name and father name
- Click confirm
- Success toast: "زده کوونکی بریالیتوب سره ړنګ شو"
- Student removed from table

### 8. Test Pagination

**If you have more than 12 students:**
- Pagination controls should appear at bottom
- Shows current page / total pages
- Shows total records
- Click next/previous page
- Table should load new data
- Loading state should show

### 9. Test AG Grid Features

**Search:**
- Type in search box at top of table
- Should filter visible rows

**Sorting:**
- Click on column headers
- Should sort by that column

**Column Resizing:**
- Drag column borders to resize

### 10. Test Image Upload

**Backend Verification:**
```bash
# Check if image was uploaded
ls backend/uploads/students/School/
ls backend/uploads/students/Center/
ls backend/uploads/students/Madrasa/

# Check image size (should be ~200KB or less)
ls -lh backend/uploads/students/School/compressed-*
```

**Frontend Verification:**
- Image should display in view modal
- Image URL should be accessible: `http://localhost:3000/uploads/students/School/compressed-student-xxx.jpg`

### 11. Test Multi-Enrollment

**Create student with all three types:**
1. Select School, Center, and Madrasa
2. Select different classes for each
3. Enter different fees for each
4. Submit
5. View the student
6. Should show 3 badges with 3 different fees

### 12. Test Class Fetching

**Open browser console:**
```javascript
// Should see API calls to:
GET /api/v1/classes?type=School&limit=100
GET /api/v1/classes?type=Center&limit=100
GET /api/v1/classes?type=Madrasa&limit=100
```

**Verify dropdowns:**
- School dropdown should only show School classes
- Center dropdown should only show Center classes
- Madrasa dropdown should only show Madrasa classes

## Expected API Calls

### On Page Load:
```
GET /api/v1/classes?type=School&limit=100
GET /api/v1/classes?type=Center&limit=100
GET /api/v1/classes?type=Madrasa&limit=100
GET /api/v1/students?academicYear=1404&page=1&limit=12
```

### On Create:
```
POST /api/v1/students
Content-Type: multipart/form-data
Body: {
  fullName, fatherName, gender, academicYear,
  enrollments: ["School","Center"],
  classes: {"School":"1","Center":"2"},
  fees: {"School":"1500","Center":"1200"},
  registrationFee: 500,
  image: <File>
}
```

### On Update:
```
PUT /api/v1/students/:id
Content-Type: multipart/form-data
Body: { ...updated fields }
```

### On Delete:
```
DELETE /api/v1/students/:id
```

### On Filter Change:
```
GET /api/v1/students?fullName=احمد&enrollmentType=School&academicYear=1404&page=1&limit=12
```

## Common Issues & Solutions

### Issue: Classes not loading in dropdown
**Solution:** Check if classes exist in database for that type
```sql
SELECT * FROM classes WHERE type = 'School';
```

### Issue: Image not uploading
**Solution:** 
- Check file size (max 5MB)
- Check file format (JPG, PNG, WEBP only)
- Check uploads folder permissions
- Check Sharp library is installed

### Issue: Validation not working
**Solution:**
- Check browser console for errors
- Verify validation messages in Pashto
- Check if errors state is being set

### Issue: Pagination not working
**Solution:**
- Check if backend returns pagination object
- Verify page state is being updated
- Check if API call includes page parameter

### Issue: Table not refreshing after create/update/delete
**Solution:**
- Check if fetchStudents() is being called
- Verify page is reset to 1 after operations
- Check if loading state is being managed

## Success Criteria

✅ All filters work correctly
✅ Create student with image works
✅ Edit student works
✅ Delete student works
✅ View student shows all details
✅ Multi-enrollment works
✅ Classes are fetched from backend
✅ Validation shows proper errors
✅ Pagination works
✅ Loading states work
✅ AG Grid table displays correctly
✅ Image upload and compression works
✅ Toast notifications appear

## Performance Checks

- Page load time: < 2 seconds
- API response time: < 500ms
- Image upload time: < 3 seconds
- Table rendering: < 1 second
- Filter response: Immediate

## Browser Compatibility

Test in:
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (if available)

## Mobile Responsiveness

Test on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

All features should work on all screen sizes.

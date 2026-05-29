# Quick Start Guide - Student Management System

## ✅ Everything is Ready!

All features have been implemented and all issues have been fixed. The student management system is ready to use.

## 🚀 Start the Application

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
**Expected Output:**
```
Server runs at port 3000
```

### 2. Start Frontend
```bash
cd Client
npm run dev
```
**Expected Output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

### 3. Access Students Page
Open your browser and go to:
```
http://localhost:5173/students
```

## ✅ What's Working

### Backend (Port 3000)
- ✅ GET /api/v1/students - List students with pagination
- ✅ GET /api/v1/students/:id - Get single student
- ✅ POST /api/v1/students - Create student with image
- ✅ PUT /api/v1/students/:id - Update student
- ✅ DELETE /api/v1/students/:id - Delete student

### Frontend (Port 5173)
- ✅ AG Grid table with RTL support
- ✅ Server-side pagination
- ✅ Filters (Name, Enrollment Type, Academic Year)
- ✅ Create student with validation
- ✅ Edit student with validation
- ✅ Delete student with confirmation
- ✅ View student details
- ✅ Image upload with compression
- ✅ Multi-enrollment support
- ✅ Class selection from backend
- ✅ Loading states
- ✅ Toast notifications

## 🎯 Quick Test

### Test Create Student

1. Click "نوی زده کوونکی" button
2. Fill in:
   - بشپړ نوم: احمد کریمي
   - د پلار نوم: محمد کریم
3. Select enrollment: ښوونځی (School)
4. Select a class from dropdown
5. Enter monthly fee: 1500
6. (Optional) Upload an image
7. Click "ثبتول"
8. ✅ Success toast appears
9. ✅ Table refreshes with new student

### Test Filters

1. Select enrollment type: ښوونځی
2. ✅ Table filters to show only School students
3. Select academic year: 1404 (اوسنی)
4. ✅ Table filters to show only current year students
5. Type student name in search
6. ✅ Table filters in real-time

### Test Edit Student

1. Click pencil icon on any student
2. ✅ Modal opens with pre-filled data
3. Change any field
4. Click "ثبتول"
5. ✅ Success toast appears
6. ✅ Table refreshes with updated data

### Test Delete Student

1. Click trash icon on any student
2. ✅ Confirmation modal appears
3. Click confirm
4. ✅ Success toast appears
5. ✅ Student removed from table

### Test View Student

1. Click eye icon on any student
2. ✅ Modal opens with all details
3. ✅ Shows enrollments with badges
4. ✅ Shows fees per enrollment

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F

# Restart backend
cd backend
npm run dev
```

### Frontend Not Starting
```bash
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Kill process if needed
taskkill /PID <PID> /F

# Restart frontend
cd Client
npm run dev
```

### Database Issues
```bash
# Reset database
cd backend
npm run db:push
```

### Image Upload Issues
```bash
# Check if upload folders exist
ls backend/uploads/students/School
ls backend/uploads/students/Center
ls backend/uploads/students/Madrasa

# Create if missing
mkdir -p backend/uploads/students/School
mkdir -p backend/uploads/students/Center
mkdir -p backend/uploads/students/Madrasa
```

## 📊 Expected Behavior

### On Page Load
1. Fetches classes for School, Center, Madrasa
2. Fetches students for current year (1404)
3. Displays students in AG Grid table
4. Shows pagination if more than 12 students

### On Create
1. Validates all fields
2. Shows errors if validation fails
3. Uploads and compresses image
4. Creates student record
5. Creates enrollment records
6. Shows success toast
7. Refreshes table
8. Closes modal

### On Edit
1. Opens modal with pre-filled data
2. Shows existing image if available
3. Validates changes
4. Updates student record
5. Updates enrollment records
6. Shows success toast
7. Refreshes table
8. Closes modal

### On Delete
1. Shows confirmation modal
2. Deletes student image
3. Deletes enrollment records
4. Deletes student record
5. Shows success toast
6. Refreshes table

### On Filter Change
1. Resets pagination to page 1
2. Fetches students with new filters
3. Updates table
4. Shows loading state

## 🎨 UI Features

### AG Grid Table
- RTL support for Pashto/Dari
- Sortable columns
- Resizable columns
- Server-side pagination
- Loading spinner
- Empty state message
- Action buttons (View, Edit, Delete)

### Filters
- Full Name search (input)
- Enrollment Type (dropdown)
- Academic Year (dropdown with current year marked)
- Clear filters button
- Apply filters button

### Form Modal
- Two-column layout
- Validation errors below fields
- Image upload with preview
- Multi-enrollment toggle buttons
- Dynamic class dropdowns per enrollment
- Loading state during submission
- Disabled buttons during loading

### View Modal
- Two-column layout
- Shows all student details
- Shows enrollments with colored badges
- Shows fees per enrollment
- Close button

### Delete Confirmation
- Shows student name
- Shows father name
- Confirm button
- Cancel button

## 📝 API Examples

### Create Student
```bash
curl -X POST http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fullName=احمد کریمي" \
  -F "fatherName=محمد کریم" \
  -F "gender=Male" \
  -F "academicYear=1404" \
  -F 'enrollments=["School"]' \
  -F 'classes={"School":"1"}' \
  -F 'fees={"School":"1500"}' \
  -F "image=@/path/to/image.jpg"
```

### Get Students
```bash
curl -X GET "http://localhost:3000/api/v1/students?page=1&limit=12&academicYear=1404" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Student
```bash
curl -X PUT http://localhost:3000/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fullName=احمد کریمي (updated)" \
  -F 'enrollments=["School","Center"]' \
  -F 'classes={"School":"1","Center":"2"}' \
  -F 'fees={"School":"1500","Center":"1200"}'
```

### Delete Student
```bash
curl -X DELETE http://localhost:3000/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Success Criteria

- [x] Page loads without errors
- [x] Filters work correctly
- [x] Create student works
- [x] Edit student works
- [x] Delete student works
- [x] View student works
- [x] Image upload works
- [x] Multi-enrollment works
- [x] Class dropdowns populated
- [x] Validation works
- [x] Loading states work
- [x] Toast notifications work
- [x] Pagination works

## 🎉 You're All Set!

The student management system is fully functional and ready to use. All features have been implemented, all bugs have been fixed, and all APIs are integrated.

**Enjoy using the system!** 🚀

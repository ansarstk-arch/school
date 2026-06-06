# API Testing Guide - Postman Collection

## Base URL
```
http://localhost:3000/api/v1
```

---

## 🔐 AUTHENTICATION

### 1. Login
**POST** `/auth/login`

**Body (JSON)**:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response**:
```json
{
  "success": true,
  "message": "ننوتل بریالی شو",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

**Note**: Copy the token and add to all subsequent requests as:
- Header: `Authorization: Bearer <token>`

---

## 👨‍🎓 STUDENTS API

### 1. Get All Students (LIST)
**GET** `/students`

**Query Parameters**:
```
academicYear=1403
page=1
limit=12
fullName=احمد           (optional - search by name)
fatherName=محمد         (optional)
classId=1              (optional)
enrollmentType=School  (optional - School/Center/Madrasa)
gender=Male            (optional - Male/Female)
```

**Full Example**:
```
GET http://localhost:3000/api/v1/students?academicYear=1403&page=1&limit=12
```

**Expected Response**:
```json
{
  "success": true,
  "message": "زده کوونکي بریالیتوب سره ترلاسه شول",
  "data": {
    "students": [
      {
        "id": 1,
        "fullName": "احمد رحیمی",
        "fatherName": "محمد",
        "academicYear": "1403",
        "className": "ډهمه ټولګی",
        "classSection": "الف",
        "classType": "School",
        "parentNumber1": "+93701234567",
        "imageUrl": "http://localhost:3000/uploads/students/2024/image.jpg"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 12,
      "totalPages": 5
    }
  }
}
```

---

### 2. Get Student by ID
**GET** `/students/:id`

**Example**:
```
GET http://localhost:3000/api/v1/students/1
```

**Expected Response**:
```json
{
  "success": true,
  "message": "زده کوونکی بریالیتوب سره ترلاسه شو",
  "data": {
    "student": {
      "id": 1,
      "fullName": "احمد رحیمی",
      "fatherName": "محمد رحیمی",
      "grandFatherName": "عبدالله",
      "maternalUncleName": "کریم",
      "parentNumber1": "+93701234567",
      "parentNumber2": "+93702345678",
      "rollNumber": "001",
      "idCardNumber": "12345678",
      "dob": "1403-01-01",
      "gender": "Male",
      "address": "کابل، افغانستان",
      "academicYear": "1403",
      "registrationFee": 1000,
      "image": "students/2024/image.jpg",
      "imageUrl": "http://localhost:3000/uploads/students/2024/image.jpg",
      "enrollments": [
        {
          "enrollmentType": "School",
          "classId": 1,
          "className": "ډهمه ټولګی",
          "classSection": "الف",
          "feePerMonth": 500
        }
      ]
    }
  }
}
```

---

### 3. Create Student
**POST** `/students`

**Body (form-data)**:
```
fullName: احمد رحیمی
fatherName: محمد رحیمی
grandFatherName: عبدالله
maternalUncleName: کریم
parentNumber1: +93701234567
parentNumber2: +93702345678
rollNumber: 001
idCardNumber: 12345678
dob: 1403-01-01
gender: Male
address: کابل، افغانستان
academicYear: 1403
registrationFee: 1000
enrollments: ["School"]
classes: {"School":"1"}
fees: {"School":"500"}
image: [file upload - optional]
```

**Note**: Use `form-data` not JSON because of file upload

**Expected Response**:
```json
{
  "success": true,
  "message": "زده کوونکی بریالیتوب سره ثبت شو",
  "data": {
    "student": { ... }
  }
}
```

---

### 4. Update Student
**PUT** `/students/:id`

**Body (form-data)** - same as create

**Example**:
```
PUT http://localhost:3000/api/v1/students/1
```

---

### 5. Delete Student
**DELETE** `/students/:id`

**Example**:
```
DELETE http://localhost:3000/api/v1/students/1
```

---

### 6. Get Classes by Type
**GET** `/students/classes-by-type`

**Query Parameters**:
```
type=School
academicYear=1403
```

**Example**:
```
GET http://localhost:3000/api/v1/students/classes-by-type?type=School&academicYear=1403
```

**Expected Response**:
```json
{
  "success": true,
  "message": "ټولګي ترلاسه شول",
  "data": {
    "classes": [
      {
        "id": 1,
        "name": "ډهمه ټولګی",
        "section": "الف",
        "type": "School"
      }
    ]
  }
}
```

---

### 7. Get Parent Numbers
**GET** `/students/parent-numbers`

**Query Parameters**:
```
academicYear=1403
page=1
limit=20
enrollmentType=School   (optional)
classId=1              (optional)
absentOnly=absent      (optional - absent/present/empty for all)
```

**Example**:
```
GET http://localhost:3000/api/v1/students/parent-numbers?academicYear=1403&page=1&limit=20
```

---

## 📊 DASHBOARD API

### 1. Get Dashboard Cards
**GET** `/dashboard/cards`

**Query Parameters**:
```
type=all     (all/school/center/madrasa)
year=1403
```

**Example**:
```
GET http://localhost:3000/api/v1/dashboard/cards?type=all&year=1403
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "students": {
      "total": 500,
      "school": 300,
      "center": 150,
      "madrasa": 50
    },
    "teachers": 50,
    "classes": 25,
    "subjects": 15,
    "revenue": {
      "daily": 5000,
      "monthly": 150000,
      "yearly": 1800000,
      "inventory": 25000
    },
    "expenses": {
      "daily": 2000,
      "monthly": 60000,
      "yearly": 720000
    },
    "unpaidFees": 45,
    "lowStockItems": 5,
    "staff": 10,
    "attendancePercentage": 85,
    "salaries": {
      "total": 500000,
      "staff": 150000,
      "teachers": 350000
    }
  }
}
```

---

### 2. Get Recent Admissions
**GET** `/dashboard/recent-admissions`

**Query Parameters**:
```
type=all     (all/school/center/madrasa)
limit=10
year=1403
```

**Example**:
```
GET http://localhost:3000/api/v1/dashboard/recent-admissions?type=all&limit=10&year=1403
```

---

### 3. Get Upcoming Exams
**GET** `/dashboard/upcoming-exams`

**Query Parameters**:
```
type=all     (all/school/center/madrasa)
limit=5
year=1403
```

**Example**:
```
GET http://localhost:3000/api/v1/dashboard/upcoming-exams?type=all&limit=5&year=1403
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "examTitle": "لومړۍ ترمه ازموینه",
      "institutionType": "School",
      "startDate": "1403-06-15",
      "endDate": "1403-06-25",
      "status": "فعال"
    }
  ]
}
```

---

### 4. Get System Status
**GET** `/dashboard/system-status`

**Example**:
```
GET http://localhost:3000/api/v1/dashboard/system-status
```

---

## 📦 INVENTORY API

### 1. Get Inventory Stats
**GET** `/inventory/stats`

**Query Parameters**:
```
academicYear=1403
```

**Example**:
```
GET http://localhost:3000/api/v1/inventory/stats?academicYear=1403
```

---

### 2. Get Inventory Items
**GET** `/inventory/items`

**Query Parameters**:
```
academicYear=1403
page=1
limit=20
name=قلم             (optional)
lowStock=true       (optional)
```

**Example**:
```
GET http://localhost:3000/api/v1/inventory/items?academicYear=1403&page=1&limit=20
```

---

### 3. Get Inventory Sales
**GET** `/inventory/sales`

**Query Parameters**:
```
academicYear=1403
page=1
limit=20
itemName=قلم        (optional)
startDate=1403-01-01 (optional)
endDate=1403-12-30   (optional)
```

**Example**:
```
GET http://localhost:3000/api/v1/inventory/sales?academicYear=1403&page=1&limit=20
```

---

## 🔍 TROUBLESHOOTING STUDENTS FETCH ISSUE

### Step 1: Test Basic Endpoint
```
GET http://localhost:3000/api/v1/students
```

If this works, students API is fine.

---

### Step 2: Test with Academic Year
```
GET http://localhost:3000/api/v1/students?academicYear=1403
```

---

### Step 3: Test with Pagination
```
GET http://localhost:3000/api/v1/students?academicYear=1403&page=1&limit=12
```

---

### Step 4: Check if Students Exist in Database
Run this SQL query directly on database:
```sql
SELECT * FROM students LIMIT 10;
```

---

### Step 5: Check Backend Logs
Look for any errors when making the request. The backend should log:
```
[GET] /api/v1/students
```

---

### Step 6: Test Creating a Student
```
POST http://localhost:3000/api/v1/students
```

With minimal body (form-data):
```
fullName: احمد
fatherName: محمد
parentNumber1: 0701234567
academicYear: 1403
enrollments: ["School"]
classes: {"School":"1"}
fees: {"School":"500"}
gender: Male
```

Then test GET again.

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Students add successfully but don't fetch
**Possible Causes**:
1. Academic year mismatch
2. Pagination issue
3. Filter not matching any records
4. Database connection issue

**Test**:
```
GET http://localhost:3000/api/v1/students?academicYear=1403&page=1&limit=100
```

Try without filters:
```
GET http://localhost:3000/api/v1/students
```

---

### Issue 2: No error but empty response
**Check**:
- Is `students` array empty in response?
- Is `pagination.total` = 0?
- Check database for records

---

### Issue 3: 401 Unauthorized
**Solution**:
- Add Authorization header: `Bearer <your_token>`
- Login again to get fresh token

---

### Issue 4: 500 Internal Server Error
**Check**:
- Backend console logs
- Database connection
- Required fields validation

---

## 📝 POSTMAN COLLECTION SETUP

### Headers for All Requests
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json  (for JSON requests)
```

### Environment Variables
Create these in Postman:
```
BASE_URL: http://localhost:3000/api/v1
TOKEN: <your_jwt_token>
ACADEMIC_YEAR: 1403
```

Then use: `{{BASE_URL}}/students?academicYear={{ACADEMIC_YEAR}}`

---

## ✅ QUICK TEST SEQUENCE

1. **Login** → Get token
2. **GET /students** → Should return list (might be empty)
3. **POST /students** → Create one student
4. **GET /students** → Should return the created student
5. **GET /students/:id** → Get specific student
6. **GET /dashboard/cards** → Should show student count

If step 2 returns empty but step 3-4 work, then:
- Check if academicYear filter matches your created student
- Check if you have old students in database with different academic year

---

## 📧 SUPPORT

If issues persist after testing:
1. Check backend console for errors
2. Check browser console (Network tab)
3. Verify database has records: `SELECT COUNT(*) FROM students;`
4. Check if filters are being applied correctly
5. Test without any query parameters first

**Most Common Fix**: Remove academicYear filter and test:
```
GET http://localhost:3000/api/v1/students?page=1&limit=12
```

This will show ALL students regardless of year.

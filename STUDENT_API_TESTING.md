# Student API Testing Guide

## Prerequisites

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Ensure you have an authentication token (login first)

## API Endpoints

### 1. Create Student

**Endpoint:** `POST /api/v1/students`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
fullName: احمد کریمي
fatherName: محمد کریم
grandFatherName: کریم خان
gender: Male
phone: +93 700 111 222
emergencyContact: +93 700 222 333
idCardNumber: 1234567
address: کابل، افغانستان
dob: 2010-01-15
academicYear: 1404
enrollments: ["School","Center"]
classes: {"School":"1","Center":"2"}
fees: {"School":"1500","Center":"1200"}
registrationFee: 500
rollNumber: 001
section: A
image: <select image file>
```

**Note:** For JSON fields (enrollments, classes, fees), you can either:
- Send as JSON string: `["School","Center"]`
- Or let the frontend handle serialization

**Expected Response (201):**
```json
{
  "success": true,
  "status": 201,
  "message": "زده کوونکی بریالیتوب سره ثبت شو",
  "data": {
    "student": {
      "id": 1,
      "fullName": "احمد کریمي",
      "fatherName": "محمد کریم",
      "grandFatherName": "کریم خان",
      "gender": "Male",
      "phone": "+93 700 111 222",
      "emergencyContact": "+93 700 222 333",
      "idCardNumber": "1234567",
      "address": "کابل، افغانستان",
      "dob": "2010-01-15",
      "academicYear": "1404",
      "classId": 1,
      "section": "A",
      "rollNumber": "001",
      "registrationFee": 500,
      "image": "students/School/compressed-student-1234567890-123456789.jpg",
      "imageUrl": "http://localhost:3000/uploads/students/School/compressed-student-1234567890-123456789.jpg",
      "createdAt": "2026-05-17T...",
      "updatedAt": "2026-05-17T...",
      "enrollments": [
        {
          "type": "School",
          "fee": 1500
        },
        {
          "type": "Center",
          "fee": 1200
        }
      ]
    }
  }
}
```

### 2. Get All Students

**Endpoint:** `GET /api/v1/students`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Query Parameters (all optional):**
```
?page=1
&limit=12
&fullName=احمد
&fatherName=محمد
&classId=1
&gender=Male
&academicYear=1404
&enrollmentType=School
```

**Example:**
```
GET /api/v1/students?page=1&limit=12&enrollmentType=School
```

**Expected Response (200):**
```json
{
  "success": true,
  "status": 200,
  "message": "زده کوونکي ترلاسه شول",
  "data": {
    "students": [
      {
        "id": 1,
        "fullName": "احمد کریمي",
        "fatherName": "محمد کریم",
        "gender": "Male",
        "phone": "+93 700 111 222",
        "academicYear": "1404",
        "classId": 1,
        "rollNumber": "001",
        "registrationFee": 500,
        "image": "students/School/compressed-student-xxx.jpg",
        "imageUrl": "http://localhost:3000/uploads/students/School/compressed-student-xxx.jpg",
        "enrollments": [
          { "type": "School", "fee": 1500 },
          { "type": "Center", "fee": 1200 }
        ]
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 12,
      "totalPages": 1
    }
  }
}
```

### 3. Get Student by ID

**Endpoint:** `GET /api/v1/students/:id`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Example:**
```
GET /api/v1/students/1
```

**Expected Response (200):**
```json
{
  "success": true,
  "status": 200,
  "message": "زده کوونکی ترلاسه شو",
  "data": {
    "student": {
      "id": 1,
      "fullName": "احمد کریمي",
      "fatherName": "محمد کریم",
      "grandFatherName": "کریم خان",
      "gender": "Male",
      "phone": "+93 700 111 222",
      "emergencyContact": "+93 700 222 333",
      "idCardNumber": "1234567",
      "address": "کابل، افغانستان",
      "dob": "2010-01-15",
      "academicYear": "1404",
      "classId": 1,
      "section": "A",
      "rollNumber": "001",
      "registrationFee": 500,
      "image": "students/School/compressed-student-xxx.jpg",
      "imageUrl": "http://localhost:3000/uploads/students/School/compressed-student-xxx.jpg",
      "createdAt": "2026-05-17T...",
      "updatedAt": "2026-05-17T...",
      "enrollments": [
        { "type": "School", "fee": 1500 },
        { "type": "Center", "fee": 1200 }
      ]
    }
  }
}
```

### 4. Update Student

**Endpoint:** `PUT /api/v1/students/:id`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: multipart/form-data
```

**Body (form-data) - all fields optional:**
```
fullName: احمد کریمي (updated)
phone: +93 700 111 333
enrollments: ["School","Madrasa"]
classes: {"School":"1","Madrasa":"3"}
fees: {"School":"1500","Madrasa":"800"}
image: <new image file>
removeImage: false
```

**To remove image without uploading new one:**
```
removeImage: true
```

**Expected Response (200):**
```json
{
  "success": true,
  "status": 200,
  "message": "زده کوونکی بریالیتوب سره تازه شو",
  "data": {
    "student": {
      "id": 1,
      "fullName": "احمد کریمي (updated)",
      "phone": "+93 700 111 333",
      "image": "students/School/compressed-student-new-xxx.jpg",
      "imageUrl": "http://localhost:3000/uploads/students/School/compressed-student-new-xxx.jpg",
      "updatedAt": "2026-05-17T...",
      "enrollments": [
        { "type": "School", "fee": 1500 },
        { "type": "Madrasa", "fee": 800 }
      ]
    }
  }
}
```

### 5. Delete Student

**Endpoint:** `DELETE /api/v1/students/:id`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Example:**
```
DELETE /api/v1/students/1
```

**Expected Response (200):**
```json
{
  "success": true,
  "status": 200,
  "message": "زده کوونکی بریالیتوب سره ړنګ شو",
  "data": null
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "fullName",
      "message": "بشپړ نوم اړین دی"
    },
    {
      "field": "class_School",
      "message": "د ښوونځی لپاره ټولګی اړین دی"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "status": 404,
  "message": "زده کوونکی ونه موندل شو"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "status": 401,
  "message": "Unauthorized"
}
```

## Testing with cURL

### Create Student
```bash
curl -X POST http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fullName=احمد کریمي" \
  -F "fatherName=محمد کریم" \
  -F "gender=Male" \
  -F "academicYear=1404" \
  -F 'enrollments=["School","Center"]' \
  -F 'classes={"School":"1","Center":"2"}' \
  -F 'fees={"School":"1500","Center":"1200"}' \
  -F "registrationFee=500" \
  -F "image=@/path/to/image.jpg"
```

### Get All Students
```bash
curl -X GET "http://localhost:3000/api/v1/students?page=1&limit=12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Student by ID
```bash
curl -X GET http://localhost:3000/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Student
```bash
curl -X PUT http://localhost:3000/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fullName=احمد کریمي (updated)" \
  -F "phone=+93 700 111 333" \
  -F 'enrollments=["School","Madrasa"]' \
  -F 'classes={"School":"1","Madrasa":"3"}' \
  -F 'fees={"School":"1500","Madrasa":"800"}'
```

### Delete Student
```bash
curl -X DELETE http://localhost:3000/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing with Postman

1. **Import Collection:**
   - Create a new collection "Students API"
   - Add environment variable for `baseUrl` and `token`

2. **Create Student Request:**
   - Method: POST
   - URL: `{{baseUrl}}/api/v1/students`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: form-data
   - Add all fields as shown above
   - For image: select "File" type and choose image

3. **Test Scenarios:**
   - ✅ Create student with single enrollment
   - ✅ Create student with multiple enrollments
   - ✅ Create student with image
   - ✅ Create student without image
   - ✅ Update student enrollments
   - ✅ Update student image
   - ✅ Remove student image
   - ✅ Filter students by enrollment type
   - ✅ Delete student

## Common Issues

### 1. Image not uploading
- Ensure Content-Type is `multipart/form-data`
- Check file size (max 5MB)
- Verify file format (JPG, PNG, WEBP only)

### 2. Validation errors
- Check that enrollments is an array
- Ensure classes object has keys for all enrollments
- Verify phone number format: `+93 7XX XXX XXX`

### 3. Class validation fails
- Ensure class IDs exist in database
- Verify class type matches enrollment type
- Check that classId is a number

### 4. Image path issues
- Verify uploads folder exists
- Check folder permissions
- Ensure Sharp library is installed

## Database Verification

After creating a student, verify in database:

```sql
-- Check student record
SELECT * FROM students WHERE id = 1;

-- Check enrollments
SELECT * FROM student_enrollments WHERE student_id = 1;

-- Check image file exists
-- Look in: backend/uploads/students/School/ (or Center/Madrasa)
```

## Success Criteria

- ✅ Student created with image compressed to ~200KB
- ✅ Image stored in correct enrollment folder
- ✅ Multiple enrollment records created
- ✅ Student retrieved with enrollments array
- ✅ Image URL accessible via browser
- ✅ Update changes enrollments correctly
- ✅ Delete removes image and enrollments
- ✅ Validation errors in Pashto

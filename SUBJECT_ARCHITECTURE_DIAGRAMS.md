# Subject Module - Architecture & Flow Diagrams

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUBJECT MANAGEMENT MODULE                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           subjects.jsx (Main Page)                      │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ PageHeader (Title & Add Button)                 │  │   │
│  │  ├──────────────────────────────────────────────────┤  │   │
│  │  │ FilterBar (Name, Type Filters)                  │  │   │
│  │  ├──────────────────────────────────────────────────┤  │   │
│  │  │ AgGridTable (Subject List with Pagination)      │  │   │
│  │  │  - View Action                                  │  │   │
│  │  │  - Edit Action                                  │  │   │
│  │  │  - Delete Action                                │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ ErpModal (View Subject)                         │  │   │
│  │  │  - Display subject details                      │  │   │
│  │  │  - Show assigned classes                        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ ErpModal (Add/Edit Subject)                     │  │   │
│  │  │  ┌──────────────────────────────────────────┐   │  │   │
│  │  │  │ SubjectForm Component                    │   │  │   │
│  │  │  │  - Subject Name Input                    │   │  │   │
│  │  │  │  - Institution Type Dropdown             │   │  │   │
│  │  │  │  - Class Multi-Select                    │   │  │   │
│  │  │  │  - Error Display                         │   │  │   │
│  │  │  └──────────────────────────────────────────┘   │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ ConfirmDelete (Delete Confirmation)             │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           subjectApi.js (API Client)                    │   │
│  │  - getAllSubjects()                                     │   │
│  │  - getSubjectById()                                     │   │
│  │  - createSubject()                                      │   │
│  │  - updateSubject()                                      │   │
│  │  - deleteSubject()                                      │   │
│  │  - getClassesByType()                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      subjectValidation.js (Validation Logic)            │   │
│  │  - validateSubject()                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         subject.route.js (API Routes)                   │   │
│  │  GET    /subjects                                       │   │
│  │  GET    /subjects/:id                                   │   │
│  │  POST   /subjects                                       │   │
│  │  PUT    /subjects/:id                                   │   │
│  │  DELETE /subjects/:id                                   │   │
│  │  GET    /subjects/classes-by-type                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │    subject.validator.js (Request Validation)            │   │
│  │  - createSubjectValidator                               │   │
│  │  - updateSubjectValidator                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │    subject.controller.js (Business Logic)               │   │
│  │  - getAllSubjects()                                     │   │
│  │  - getSubjectById()                                     │   │
│  │  - createSubject()                                      │   │
│  │  - updateSubject()                                      │   │
│  │  - deleteSubject()                                      │   │
│  │  - getClassesByTypeAndYear()                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Database (SQLite)                               │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ subjects table                                   │   │   │
│  │  │  - id (PK)                                       │   │   │
│  │  │  - name                                          │   │   │
│  │  │  - type (School|Center|Madrasa)                 │   │   │
│  │  │  - academicYear                                 │   │   │
│  │  │  - createdAt, updatedAt                         │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ subject_classes table (M2M)                      │   │   │
│  │  │  - subjectId (FK)                                │   │   │
│  │  │  - classId (FK)                                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ classes table (Referenced)                       │   │   │
│  │  │  - id (PK)                                       │   │   │
│  │  │  - name                                          │   │   │
│  │  │  - section                                       │   │   │
│  │  │  - type                                          │   │   │
│  │  │  - academicYear                                 │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Data Flow Diagram

### Create Subject Flow
```
User Input
    ↓
SubjectForm Component
    ↓
Frontend Validation (validateSubject)
    ↓ (if valid)
API Call (createSubject)
    ↓
Backend Route (POST /subjects)
    ↓
Backend Validation (createSubjectValidator)
    ↓ (if valid)
Controller (createSubject)
    ↓
Check Duplicate
    ↓ (if not duplicate)
Validate Classes
    ↓ (if valid)
Insert Subject
    ↓
Insert Subject-Class Relationships
    ↓
Return Success Response
    ↓
Frontend Toast Notification
    ↓
Refresh Subject List
    ↓
Close Modal
```

### Read Subject Flow
```
User Clicks View/Edit
    ↓
Fetch Subject (getSubjectById)
    ↓
Backend Route (GET /subjects/:id)
    ↓
Controller (getSubjectById)
    ↓
Query Subject
    ↓
Query Assigned Classes
    ↓
Return Subject with Classes
    ↓
Display in Modal
    ↓
If Edit: Load Form with Data
    ↓
If View: Display Read-Only Details
```

### Update Subject Flow
```
User Modifies Form
    ↓
Frontend Validation
    ↓ (if valid)
API Call (updateSubject)
    ↓
Backend Route (PUT /subjects/:id)
    ↓
Backend Validation
    ↓ (if valid)
Controller (updateSubject)
    ↓
Check Duplicate (exclude self)
    ↓ (if not duplicate)
Validate Classes
    ↓ (if valid)
Update Subject
    ↓
Delete Old Class Assignments
    ↓
Insert New Class Assignments
    ↓
Return Success Response
    ↓
Frontend Toast Notification
    ↓
Refresh Subject List
    ↓
Close Modal
```

### Delete Subject Flow
```
User Clicks Delete
    ↓
Show Confirmation Dialog
    ↓
User Confirms
    ↓
API Call (deleteSubject)
    ↓
Backend Route (DELETE /subjects/:id)
    ↓
Controller (deleteSubject)
    ↓
Check Subject Exists
    ↓ (if exists)
Delete Subject
    ↓ (cascade deletes subject_classes)
Return Success Response
    ↓
Frontend Toast Notification
    ↓
Refresh Subject List
    ↓
Close Dialog
```

## 3. Component Hierarchy

```
SubjectsPage (Main)
├── PageHeader
│   └── Add Button
├── FilterBar
│   ├── Name Filter
│   └── Type Filter
├── AgGridTable
│   ├── Subject Rows
│   │   ├── Name Column
│   │   ├── Type Column (Badge)
│   │   ├── Date Column
│   │   └── Actions Column
│   │       ├── View Button
│   │       ├── Edit Button
│   │       └── Delete Button
│   └── Pagination
│       ├── Previous Button
│       ├── Page Numbers
│       └── Next Button
├── ViewModal
│   └── Subject Details
│       ├── Name
│       ├── Type
│       ├── Date
│       └── Classes List
├── AddEditModal
│   └── SubjectForm
│       ├── Name Input
│       ├── Type Dropdown
│       ├── Class Multi-Select
│       └── Error Messages
└── DeleteConfirmDialog
    └── Confirmation Message
```

## 4. State Management Flow

```
SubjectsPage State
├── subjects (array)
│   └── Fetched from API
├── open (boolean)
│   └── Add/Edit modal visibility
├── viewOpen (boolean)
│   └── View modal visibility
├── deleteOpen (boolean)
│   └── Delete confirmation visibility
├── selected (object)
│   └── Currently selected subject
├── filters (object)
│   ├── name (string)
│   └── type (string)
├── isEditing (boolean)
│   └── Form mode (create vs edit)
├── errors (object)
│   └── Validation errors
├── loading (boolean)
│   └── API call state
├── page (number)
│   └── Current page
└── pagination (object)
    ├── total
    ├── page
    ├── limit
    └── totalPages

SubjectForm State
├── form (object)
│   ├── name (string)
│   ├── type (string)
│   └── classIds (array)
├── classes (array)
│   └── Available classes for type
└── loadingClasses (boolean)
    └── Class fetching state
```

## 5. API Request/Response Flow

### Create Subject Request
```
POST /api/v1/subjects
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "name": "ریاضي",
  "type": "School",
  "academicYear": "1404",
  "classIds": [1, 2, 3]
}

Response (201):
{
  "success": true,
  "message": "مضمون بریالیتوب سره ثبت شو",
  "status": 201,
  "data": {
    "subject": {
      "id": 1,
      "name": "ریاضي",
      "type": "School",
      "academicYear": "1404",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Get All Subjects Request
```
GET /api/v1/subjects?page=1&limit=12&type=School&name=ریاضي&academicYear=1404
Authorization: Bearer TOKEN

Response (200):
{
  "success": true,
  "message": "مضامین ترلاسه شول",
  "status": 200,
  "data": {
    "subjects": [
      {
        "id": 1,
        "name": "ریاضي",
        "type": "School",
        "academicYear": "1404",
        "classes": [
          {"id": 1, "name": "ټولګی ۸", "section": "الف"}
        ],
        "classIds": [1],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 12,
      "totalPages": 2
    }
  }
}
```

## 6. Validation Flow

### Frontend Validation
```
User Input
    ↓
validateSubject(data)
    ├── Check name
    │   ├── Required?
    │   ├── Length 2-100?
    │   └── Valid characters?
    ├── Check type
    │   └── School|Center|Madrasa?
    └── Check classIds
        └── At least 1?
    ↓
Return errors object
    ↓
If errors: Display inline
If no errors: Submit to API
```

### Backend Validation
```
Request Received
    ↓
createSubjectValidator middleware
    ├── body("name").trim().notEmpty()...
    ├── body("type").notEmpty()...
    ├── body("academicYear").notEmpty()...
    └── body("classIds").isArray({min:1})...
    ↓
If validation fails: Return 400 error
If validation passes: Continue to controller
    ↓
Controller validation
    ├── Check duplicate
    ├── Validate classes exist
    └── Validate class type/year match
    ↓
If validation fails: Return 400 error
If validation passes: Create subject
```

## 7. Database Query Flow

### Create Subject with Classes
```
BEGIN TRANSACTION
    ↓
INSERT INTO subjects (name, type, academicYear)
    ↓
GET inserted subject ID
    ↓
INSERT INTO subject_classes (subjectId, classId)
    FOR EACH classId
    ↓
COMMIT TRANSACTION
    ↓
Return subject with classes
```

### Get Subject with Classes
```
SELECT * FROM subjects WHERE id = ?
    ↓
SELECT * FROM subject_classes WHERE subjectId = ?
    ↓
SELECT * FROM classes WHERE id IN (classIds)
    ↓
Combine results
    ↓
Return subject with classes array
```

### Update Subject with Classes
```
BEGIN TRANSACTION
    ↓
UPDATE subjects SET name, type, academicYear
    ↓
DELETE FROM subject_classes WHERE subjectId = ?
    ↓
INSERT INTO subject_classes (subjectId, classId)
    FOR EACH classId
    ↓
COMMIT TRANSACTION
    ↓
Return updated subject
```

---

## Summary

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Modular and reusable components
- ✅ Proper data flow
- ✅ Efficient database queries
- ✅ Comprehensive validation
- ✅ Error handling at each layer
- ✅ Scalable design

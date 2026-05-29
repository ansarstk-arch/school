# Subject Management Module - Implementation Guide

## Overview
Complete production-ready Subject Management Module with full CRUD operations, filtering, pagination, and validation.

## Architecture

### Frontend Structure
```
Client/src/
├── components/erp/
│   └── SubjectForm.jsx          # Reusable form component
├── data/
│   └── subjectApi.js            # API client methods
├── routes/
│   └── subjects.jsx             # Main page component
└── utils/
    └── subjectValidation.js     # Frontend validation logic
```

### Backend Structure
```
backend/src/
├── controllers/subject/
│   └── subject.controller.js    # Business logic
├── routes/subject/
│   └── subject.route.js         # API routes
└── validator/subject/
    └── subject.validator.js     # Request validation
```

## Features Implemented

### 1. Subject Form Component
- **Location**: `Client/src/components/erp/SubjectForm.jsx`
- **Features**:
  - Subject name input with validation
  - Institution type dropdown (School, Center, Madrasa)
  - Dynamic class multi-select based on type
  - Real-time error display
  - Loading states for class fetching

### 2. Frontend Validation
- **Location**: `Client/src/utils/subjectValidation.js`
- **Rules**:
  - Subject name: Required, 2-100 characters, Pashto/Dari/English only
  - Institution type: Required
  - Classes: At least one class must be selected
  - Inline error messages in Pashto

### 3. Main Subject Page
- **Location**: `Client/src/routes/subjects.jsx`
- **Features**:
  - AG Grid table with RTL support
  - Server-side pagination (12 items per page)
  - Advanced filtering (name, type)
  - View/Edit/Delete actions
  - Modal dialogs for CRUD operations
  - Loading states and error handling
  - Toast notifications

### 4. Backend API
- **Base URL**: `/api/v1/subjects`
- **Endpoints**:
  - `GET /` - Get all subjects with pagination
  - `GET /:id` - Get subject by ID
  - `POST /` - Create new subject
  - `PUT /:id` - Update subject
  - `DELETE /:id` - Delete subject
  - `GET /classes-by-type` - Get classes by type and year

### 5. Backend Validation
- **Location**: `backend/src/validator/subject/subject.validator.js`
- **Validators**:
  - `createSubjectValidator` - Validates new subject creation
  - `updateSubjectValidator` - Validates subject updates
  - All error messages in Pashto

### 6. Database Schema
- **Subjects Table**: name, type, academicYear, createdAt, updatedAt
- **SubjectClasses Table**: M2M relationship between subjects and classes
- **Indexes**: type, academicYear, unique constraint on (name, type, academicYear)

## API Response Format

### Success Response
```json
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
          { "id": 1, "name": "ټولګی ۸", "section": "الف" }
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

### Error Response
```json
{
  "success": false,
  "message": "د مضمون نوم اړین دی",
  "status": 400,
  "data": null
}
```

## Testing Guide

### 1. Create Subject
**Request**:
```bash
POST /api/v1/subjects
Content-Type: application/json

{
  "name": "ریاضي",
  "type": "School",
  "academicYear": "1404",
  "classIds": [1, 2, 3]
}
```

**Expected Response**: 201 Created

### 2. Get All Subjects
**Request**:
```bash
GET /api/v1/subjects?page=1&limit=12&type=School&name=ریاضي&academicYear=1404
```

**Expected Response**: 200 OK with paginated subjects

### 3. Get Subject by ID
**Request**:
```bash
GET /api/v1/subjects/1
```

**Expected Response**: 200 OK with subject details and assigned classes

### 4. Update Subject
**Request**:
```bash
PUT /api/v1/subjects/1
Content-Type: application/json

{
  "name": "ریاضي (تازه شده)",
  "classIds": [1, 2]
}
```

**Expected Response**: 200 OK

### 5. Delete Subject
**Request**:
```bash
DELETE /api/v1/subjects/1
```

**Expected Response**: 200 OK

### 6. Get Classes by Type
**Request**:
```bash
GET /api/v1/subjects/classes-by-type?type=School&academicYear=1404
```

**Expected Response**: 200 OK with list of classes

## Frontend Testing Checklist

- [ ] Create new subject with valid data
- [ ] Validate subject name (required, length, characters)
- [ ] Validate institution type selection
- [ ] Validate class selection (at least one required)
- [ ] Classes update when institution type changes
- [ ] Edit existing subject
- [ ] Delete subject with confirmation
- [ ] View subject details
- [ ] Filter by subject name
- [ ] Filter by institution type
- [ ] Pagination works correctly
- [ ] Error messages display in Pashto
- [ ] Loading states show during API calls
- [ ] Toast notifications appear on success/error

## Backend Testing Checklist

- [ ] Create subject with valid data
- [ ] Prevent duplicate subjects (same name, type, year)
- [ ] Validate class IDs belong to same type and year
- [ ] Update subject with partial data
- [ ] Delete subject and cascade delete subject-class relationships
- [ ] Get classes filtered by type and year
- [ ] Pagination works with correct offset/limit
- [ ] Filtering by name, type works
- [ ] All error messages in Pashto
- [ ] Proper HTTP status codes returned

## Validation Rules

### Subject Name
- Required field
- 2-100 characters
- Only Pashto, Dari, or English characters
- Whitespace trimmed

### Institution Type
- Required field
- Must be: School, Center, or Madrasa

### Classes
- At least one class must be selected
- All classes must belong to same type and academic year
- Class IDs must be valid integers

## Error Handling

### Frontend
- Inline validation errors below each field
- Toast notifications for API errors
- Loading states prevent duplicate submissions
- Proper error messages in Pashto

### Backend
- Validation middleware catches invalid requests
- Async handler wraps all controllers
- Consistent error response format
- Proper HTTP status codes (400, 404, 500)

## Performance Considerations

1. **Pagination**: 12 items per page to balance performance
2. **Indexes**: Database indexes on type, academicYear for fast filtering
3. **Unique Constraint**: Prevents duplicate subjects
4. **Cascade Delete**: Automatically removes subject-class relationships
5. **Lazy Loading**: Classes fetched only when type changes

## Security Features

1. **Authentication**: All endpoints require JWT token
2. **Input Validation**: Both frontend and backend validation
3. **SQL Injection Protection**: Drizzle ORM parameterized queries
4. **XSS Protection**: React escapes all user input
5. **CSRF Protection**: Standard Express middleware

## Deployment Notes

1. Ensure database migrations are run: `npm run db:push`
2. Verify ACTIVE_SESSION constant matches current academic year
3. Test with multiple institution types
4. Verify RTL layout on different screen sizes
5. Test pagination with large datasets

## Future Enhancements

1. Bulk import subjects from CSV
2. Subject templates for quick creation
3. Subject-teacher assignment
4. Subject-exam linking
5. Subject performance analytics
6. Export subjects to PDF/Excel

# Subject Module - Quick Reference

## File Locations

### Frontend
| File | Purpose |
|------|---------|
| `Client/src/routes/subjects.jsx` | Main page component |
| `Client/src/components/erp/SubjectForm.jsx` | Form component |
| `Client/src/data/subjectApi.js` | API client |
| `Client/src/utils/subjectValidation.js` | Validation logic |

### Backend
| File | Purpose |
|------|---------|
| `backend/src/routes/subject/subject.route.js` | API routes |
| `backend/src/controllers/subject/subject.controller.js` | Business logic |
| `backend/src/validator/subject/subject.validator.js` | Request validation |

## Key Components

### SubjectForm Component
```jsx
<SubjectForm
  subject={selectedSubject}
  onSave={handleSave}
  loading={isLoading}
  errors={validationErrors}
  setErrors={setErrors}
/>
```

### API Methods
```javascript
// Get all subjects with filters
getAllSubjects({ name, type, academicYear, page, limit })

// Get single subject
getSubjectById(id)

// Create subject
createSubject({ name, type, academicYear, classIds })

// Update subject
updateSubject(id, { name, type, academicYear, classIds })

// Delete subject
deleteSubject(id)

// Get classes by type
getClassesByType(type, academicYear)
```

## State Management

### Main Page State
```javascript
const [subjects, setSubjects] = useState([])
const [open, setOpen] = useState(false)
const [viewOpen, setViewOpen] = useState(false)
const [deleteOpen, setDeleteOpen] = useState(false)
const [selected, setSelected] = useState(null)
const [filters, setFilters] = useState({})
const [isEditing, setIsEditing] = useState(false)
const [errors, setErrors] = useState({})
const [loading, setLoading] = useState(false)
const [page, setPage] = useState(1)
const [pagination, setPagination] = useState({})
```

### Form State
```javascript
const [form, setForm] = useState({
  name: "",
  type: "School",
  classIds: []
})
const [classes, setClasses] = useState([])
const [loadingClasses, setLoadingClasses] = useState(false)
```

## Validation Rules

### Frontend Validation
```javascript
validateSubject(data) {
  // name: required, 2-100 chars, Pashto/Dari/English
  // type: required, must be School/Center/Madrasa
  // classIds: required, at least 1 class
}
```

### Backend Validation
```javascript
createSubjectValidator = [
  body("name").trim().notEmpty().matches(/regex/).isLength({min:2, max:100})
  body("type").notEmpty().isIn(["School", "Center", "Madrasa"])
  body("academicYear").notEmpty().isLength({min:4, max:4})
  body("classIds").isArray({min:1})
]
```

## Database Schema

### Subjects Table
```sql
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  academicYear TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, type, academicYear)
)
```

### SubjectClasses Table (M2M)
```sql
CREATE TABLE subject_classes (
  subjectId INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  classId INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(subjectId, classId)
)
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/subjects` | List all subjects |
| GET | `/subjects/:id` | Get subject details |
| POST | `/subjects` | Create subject |
| PUT | `/subjects/:id` | Update subject |
| DELETE | `/subjects/:id` | Delete subject |
| GET | `/subjects/classes-by-type` | Get classes by type |

## Common Tasks

### Add New Subject
1. Click "نوی مضمون" button
2. Fill form fields
3. Select institution type
4. Select classes (auto-filtered by type)
5. Click "ثبتول"

### Edit Subject
1. Click pencil icon in table
2. Modify fields
3. Update class selection
4. Click "ثبتول"

### Delete Subject
1. Click trash icon in table
2. Confirm deletion
3. Subject and all class assignments deleted

### Filter Subjects
1. Use FilterBar at top
2. Enter subject name or select type
3. Results update automatically
4. Click "صاف کول" to clear filters

## Error Messages (Pashto)

| Error | Message |
|-------|---------|
| Name required | د مضمون نوم اړین دی |
| Invalid name | د مضمون نوم یوازې پښتو، دري یا انګلیسي توري ولري |
| Name length | د مضمون نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي |
| Type required | ډول اړین دی |
| No classes | لږترلږه یو ټولګی وټاکئ |
| Duplicate | دا مضمون دمخه شتون لري |

## Performance Tips

1. **Pagination**: Always use limit=12 for optimal performance
2. **Filtering**: Use name or type filters to reduce data
3. **Caching**: Classes are fetched fresh when type changes
4. **Indexes**: Database has indexes on type and academicYear

## Debugging

### Frontend Issues
- Check browser console for errors
- Verify API_URL in .env
- Check localStorage for tokens
- Inspect network requests in DevTools

### Backend Issues
- Check server logs for errors
- Verify database connection
- Test endpoints with Postman
- Check validation middleware

## Testing Commands

```bash
# Backend tests
npm run test

# Frontend tests
npm run test:ui

# API testing
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/subjects

# Database check
npm run db:studio
```

## Related Modules

- **Classes**: Subject is assigned to classes
- **Exams**: Exams are linked to subjects
- **Teachers**: Teachers teach subjects
- **Students**: Students take subjects

## Support

For issues or questions:
1. Check SUBJECT_MODULE_GUIDE.md for detailed documentation
2. Review error messages in Pashto
3. Check browser console and server logs
4. Test with sample data first

# Subject Module - Setup & Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- SQLite database
- Backend running on port 3000
- Frontend running on port 5173

## Installation Steps

### 1. Backend Setup

#### Step 1.1: Verify Database Schema
The subject tables should already exist. Verify by running:

```bash
cd backend
npm run db:studio
```

Check for:
- `subjects` table
- `subject_classes` table

If tables don't exist, run migrations:
```bash
npm run db:push
```

#### Step 1.2: Verify Routes
Check that subject routes are registered in `backend/src/routes/routes.js`:

```javascript
import subjectRoutes from "./subject/subject.route.js";
router.use("/subjects", subjectRoutes);
```

#### Step 1.3: Start Backend
```bash
cd backend
npm run dev
```

Backend should be running on `http://localhost:3000`

### 2. Frontend Setup

#### Step 2.1: Verify Environment
Check `Client/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

#### Step 2.2: Install Dependencies
```bash
cd Client
npm install
```

#### Step 2.3: Start Frontend
```bash
npm run dev
```

Frontend should be running on `http://localhost:5173`

### 3. Verify Installation

#### Test Backend API
```bash
# Get all subjects
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/subjects

# Get classes by type
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/subjects/classes-by-type?type=School&academicYear=1404
```

#### Test Frontend
1. Navigate to `http://localhost:5173`
2. Login with credentials
3. Go to "مضامین" section
4. Verify page loads without errors

## Configuration

### Academic Year
The module uses `ACTIVE_SESSION` from constants. Update if needed:

**File**: `Client/src/constants/index.js`
```javascript
export const ACTIVE_SESSION = String(currentShamsiYear());
```

### Pagination
Default page size is 12 items. To change:

**Frontend**: `Client/src/routes/subjects.jsx`
```javascript
const response = await subjectApi.getAllSubjects({
  ...filters,
  academicYear: ACTIVE_SESSION,
  page,
  limit: 12,  // Change this
});
```

**Backend**: `backend/src/controllers/subject/subject.controller.js`
```javascript
const { page = 1, limit = 12 } = req.query;  // Change default limit
```

### Validation Rules
To modify validation rules:

**Frontend**: `Client/src/utils/subjectValidation.js`
```javascript
// Modify validation logic here
```

**Backend**: `backend/src/validator/subject/subject.validator.js`
```javascript
// Modify validators here
```

## Database Backup

### Before Deployment
```bash
# Backup database
cp backend/database/school.db backend/database/school.db.backup

# Or use SQLite backup
sqlite3 backend/database/school.db ".backup backup.db"
```

### After Deployment
```bash
# Verify data integrity
npm run db:studio

# Check subject count
sqlite3 backend/database/school.db "SELECT COUNT(*) FROM subjects;"
```

## Troubleshooting

### Issue: "مضامین" page not loading

**Solution**:
1. Check browser console for errors
2. Verify API URL in `.env`
3. Check backend is running
4. Verify authentication token

### Issue: Classes not loading in form

**Solution**:
1. Verify classes exist in database
2. Check academic year matches
3. Check institution type is correct
4. Look at network tab in DevTools

### Issue: Cannot create subject

**Solution**:
1. Check validation errors in form
2. Verify all required fields filled
3. Check at least one class selected
4. Look at browser console for API errors

### Issue: Duplicate subject error

**Solution**:
1. Subject with same name, type, year exists
2. Change subject name or type
3. Or delete existing subject first

### Issue: Database locked error

**Solution**:
```bash
# Restart backend
npm run dev

# Or reset database
rm backend/database/school.db
npm run db:push
npm run db:seed
```

## Performance Optimization

### Database Optimization
```bash
# Analyze database
sqlite3 backend/database/school.db "ANALYZE;"

# Vacuum database
sqlite3 backend/database/school.db "VACUUM;"
```

### Frontend Optimization
1. Use pagination (12 items/page)
2. Filter before loading large datasets
3. Clear filters when not needed

### Backend Optimization
1. Indexes are already created
2. Queries are optimized
3. Pagination prevents large data transfers

## Monitoring

### Check Subject Count
```bash
sqlite3 backend/database/school.db "SELECT COUNT(*) FROM subjects;"
```

### Check Subject-Class Relationships
```bash
sqlite3 backend/database/school.db \
  "SELECT s.name, COUNT(sc.classId) as class_count 
   FROM subjects s 
   LEFT JOIN subject_classes sc ON s.id = sc.subjectId 
   GROUP BY s.id;"
```

### Check Database Size
```bash
ls -lh backend/database/school.db
```

## Backup & Recovery

### Daily Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp backend/database/school.db "backups/school_$DATE.db"
```

### Restore from Backup
```bash
# Stop backend
# Restore database
cp backups/school_YYYYMMDD_HHMMSS.db backend/database/school.db
# Start backend
```

## Deployment Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Database migrations applied
- [ ] Subject tables exist
- [ ] API endpoints responding
- [ ] Frontend loads without errors
- [ ] Can create subject
- [ ] Can edit subject
- [ ] Can delete subject
- [ ] Filtering works
- [ ] Pagination works
- [ ] Error messages display
- [ ] Pashto text displays correctly
- [ ] RTL layout correct
- [ ] Mobile responsive
- [ ] Database backup created

## Production Deployment

### Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=3000
DB_MODE=local
LOCAL_DATABASE_URL=file:./database/school.db
JWT_SECRET=your-secure-secret-key
FRONTEND_URL=https://yourdomain.com

# Frontend
VITE_API_URL=https://yourdomain.com/api/v1
```

### Build Frontend
```bash
cd Client
npm run build
```

### Start Production Server
```bash
# Backend
NODE_ENV=production npm start

# Frontend (serve dist folder)
npm install -g serve
serve -s dist -l 5173
```

### SSL/HTTPS
Use reverse proxy (nginx, Apache) for SSL

### Database
- Use production database path
- Regular backups
- Monitor disk space
- Check query performance

## Rollback Procedure

If issues occur:

1. Stop backend and frontend
2. Restore database backup
3. Revert code changes
4. Restart services
5. Verify functionality

```bash
# Rollback database
cp backups/school_backup.db backend/database/school.db

# Restart backend
npm run dev
```

## Support & Maintenance

### Regular Maintenance
- Weekly database backups
- Monthly performance review
- Quarterly security audit
- Annual data cleanup

### Monitoring
- Check error logs daily
- Monitor database size
- Track API response times
- Monitor user feedback

### Updates
- Keep Node.js updated
- Update dependencies regularly
- Apply security patches
- Test updates in staging first

## Documentation

- `SUBJECT_MODULE_GUIDE.md` - Detailed documentation
- `SUBJECT_QUICK_REFERENCE.md` - Quick reference
- `SUBJECT_IMPLEMENTATION_COMPLETE.md` - Implementation status

## Contact & Support

For issues:
1. Check documentation
2. Review error messages
3. Check logs
4. Test with sample data
5. Contact development team

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready

# Marks Subject Configuration - Quick Reference Guide

## What Was Implemented

A complete subject management system for configuring marks before entering student grades.

## Key Changes

### 1. Modal-Based Interface ✅
- Subjects now appear in a **modal** (not inline)
- Modal opens when clicking "مضامین ښکاره کړئ" (Show Subjects)
- Matches your existing student/teacher modal design

### 2. Validation Rules ✅

**Total Marks:**
- Required
- Must be 0-100 (max 100 enforced)
- Client & server validation

**Passing Marks:**
- Required
- Must be positive
- Cannot exceed total marks
- Client & server validation

### 3. User Flow

```
1. Select Year → Exam → Type → Class
2. Click "Show Subjects" button
3. Modal opens with all subjects
4. Enter total marks (0-100) and passing marks for each
5. Click "Save All"
6. Subjects saved to table
7. Can view/edit/delete from table
```

## Files Changed

### Frontend
- `Client/src/routes/marks-exam-config.jsx` - Main page with modal

### Backend
- `backend/src/utils/marksHelpers.util.js` - Validation helper
- `backend/src/validator/exam-subject-config/exam-subject-config.validator.js` - Express validators

## Validation Messages (Pashto)

| Error | Message |
|-------|---------|
| Total marks required | ټولټال نمرې اړینې دي |
| Total marks > 100 | ټولټال نمرې باید د 0 او 100 تر منځ وي |
| Passing marks required | د بریالیتوب نمرې اړینې دي |
| Passing marks negative | د بریالیتوب نمرې باید مثبتې وي |
| Passing > Total | بریالیتوب نمرې د ټولټال څخه زیاتې نشي |

## Features

✅ Filter by year, exam, type, class
✅ Modal opens with subjects
✅ Input fields for total & passing marks
✅ Real-time validation with error messages
✅ Bulk save all subjects
✅ View all configurations in table
✅ Edit individual configurations
✅ Delete with confirmation
✅ Pagination & filtering
✅ Consistent UI/UX with existing system

## Testing

Start the backend and frontend:

```bash
# Backend
cd backend
npm start

# Frontend
cd Client
npm run dev
```

Navigate to the marks configuration page and test:
1. Select filters and click "Show Subjects"
2. Try entering invalid values (>100, negative, etc.)
3. Verify error messages appear
4. Save valid configurations
5. Test edit and delete operations

## Notes

- **No UI/UX changes** - Follows existing design patterns exactly
- **Bilingual** - All text in Pashto
- **Validation** - Both client and server-side
- **Modal-based** - Subjects only appear in modal
- **Bulk operations** - Save multiple subjects at once

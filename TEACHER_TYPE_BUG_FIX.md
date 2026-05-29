# Teacher Type Bug Fix

## Problem
The teacher module was not storing "Center" and "Madrasa" types - only "School" was being saved. The validation was throwing an error: "د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي" (Teacher type must be School, Center, or Madrasa).

## Root Cause
In the `createTeacher` function in `backend/src/controllers/teacher/teacher.controller.js`, there was a variable naming bug:

**Line 93:** The teacherType was destructured and renamed to `teacherTypeRaw`:
```javascript
const { ..., teacherType: teacherTypeRaw, ... } = req.body;
```

**Line 102 (BEFORE FIX):** The code was trying to parse `teacherType` instead of `teacherTypeRaw`:
```javascript
teacherType = typeof teacherType === 'string' ? JSON.parse(teacherType) : teacherType;
```

This caused `teacherType` to be `undefined`, which then failed validation because it was checking an undefined variable against the valid types array.

## Solution
Changed line 102 to correctly reference `teacherTypeRaw`:

```javascript
teacherType = typeof teacherTypeRaw === 'string' ? JSON.parse(teacherTypeRaw) : teacherTypeRaw;
```

## Changes Made

### File: `backend/src/controllers/teacher/teacher.controller.js`

#### In `createTeacher` function (lines 98-118):
- Fixed the parsing to use `teacherTypeRaw` instead of `teacherType`
- Added better error logging to help debug similar issues in the future
- Changed `console.log` to `console.error` for better error tracking

**Before:**
```javascript
try {
  teacherType = typeof teacherType === 'string' ? JSON.parse(teacherType) : teacherType;
} catch (e) {
  throw new ApiError(400, "د ښوونکي ډول په سمه توګه نه دی لیږل شوی");
}
```

**After:**
```javascript
try {
  teacherType = typeof teacherTypeRaw === 'string' ? JSON.parse(teacherTypeRaw) : teacherTypeRaw;
} catch (e) {
  console.error("Failed to parse teacherType:", teacherTypeRaw);
  throw new ApiError(400, "د ښوونکي ډول په سمه توګه نه دی لیږل شوی");
}
```

Also improved error logging in validation:
```javascript
if (invalidTypes.length > 0) {
  console.error("Invalid teacher types received:", teacherType);
  console.error("Invalid types:", invalidTypes);
  throw new ApiError(400, "د ښوونکي ډول باید ښوونځی، مرکز یا مدرسه وي");
}
```

#### In `updateTeacher` function:
- Already had the correct implementation using `teacherTypeRaw`
- Added the same improved error logging for consistency

## Testing
To test the fix:

1. **Create a new teacher with Center type:**
   - Open the teacher form
   - Fill in required fields
   - Select "مرکز" (Center) as the teacher type
   - Save and verify it's stored correctly

2. **Create a teacher with Madrasa type:**
   - Select "مدرسه" (Madrasa) as the teacher type
   - Save and verify it's stored correctly

3. **Create a teacher with multiple types:**
   - Select both "ښوونځی" (School) and "مرکز" (Center)
   - Save and verify both are stored correctly

4. **Update an existing teacher:**
   - Edit a teacher
   - Change their type to "مدرسه" (Madrasa)
   - Save and verify the update works

## Expected Behavior After Fix
- Teachers can now be assigned to School, Center, Madrasa, or any combination
- The teacherType array is correctly parsed from the FormData JSON string
- Validation properly checks against the valid types: ["School", "Center", "Madrasa"]
- Better error messages in the console for debugging

## Client-Side (No Changes Needed)
The client-side code in `Client/src/routes/teachers.jsx` was already correct:
- TEACHER_TYPES array has the correct values: "School", "Center", "Madrasa"
- The form correctly sends teacherType as a JSON array
- The API client correctly stringifies arrays in FormData

## Database Schema (No Changes Needed)
The database schema already supports storing multiple teacher types as a JSON string, so no migration is required.

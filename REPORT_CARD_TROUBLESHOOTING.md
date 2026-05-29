# Report Card Implementation - Troubleshooting Guide

## Issues Fixed

### 1. ✅ JSX Syntax Error
- **Problem**: `reportCardPdf.js` contained JSX but had `.js` extension
- **Solution**: File was already created as `reportCardPdf.jsx`
- **Fix**: Updated all imports to use correct path without extension

### 2. ✅ API Parameter Issue
- **Problem**: Query parameters weren't being sent to backend
- **Solution**: Updated `reportCardApi.js` to manually build query strings using `URLSearchParams`

### 3. ✅ Backend Routes
- **Problem**: Routes might not be loaded
- **Solution**: Verified routes are properly registered in `backend/src/routes/routes.js`

## Required Steps to Make It Work

### Step 1: Restart Backend Server
The backend needs to be restarted to load the new report-card routes:

```bash
cd backend
# Stop the current server (Ctrl+C if running)
npm start
# or
node server.js
```

### Step 2: Clear Browser Cache
The frontend might be using cached JavaScript:

**Option A: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Option B: Clear Cache in DevTools**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Restart Vite Dev Server**
```bash
cd Client
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 3: Verify API Endpoint
Once backend is restarted, test the endpoint:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try downloading a report card
4. Check the request URL - it should be:
   ```
   GET http://localhost:3000/api/v1/report-cards/student?studentId=X&examType=Annual&academicYear=1403
   ```

## Current Implementation Status

### ✅ Backend (Complete)
- `/api/v1/report-cards/student` - Get single student report card
- `/api/v1/report-cards/class` - Get all students in class
- Controllers properly fetch marks from both exams
- Calculates totals, percentage, grade, status

### ✅ Frontend Components (Complete)
- `ReportCard.jsx` - Beautiful report card component
- `reportCardPdf.jsx` - PDF generation utilities
- `reportCardApi.js` - API client functions (FIXED)
- `marks-itla-nama.jsx` - Updated to use new system
- `report-cards.jsx` - Standalone page (alternative)

### ✅ Features Working
- Single student download
- Multiple selected students download
- Entire class download
- First Term vs Annual exam selection
- Professional Afghan school format
- Logos, photos, signatures

## Testing Checklist

After restarting servers and clearing cache:

1. [ ] Navigate to `/marks/itla-nama`
2. [ ] Select Academic Year (e.g., 1403)
3. [ ] Select Institution Type (School)
4. [ ] Select an Exam
5. [ ] Select a Class
6. [ ] Select Exam Type (First Term or Annual)
7. [ ] Click "PDF" button next to a student
8. [ ] Verify PDF downloads successfully
9. [ ] Check PDF content is correct
10. [ ] Test "Selected" download (check multiple students)
11. [ ] Test "All Class" download

## Common Errors and Solutions

### Error: "400 Bad Request - د زده کوونکي پېژندنه، د امتحان ډول او تعلیمي کال اړین دي"
**Cause**: Parameters not being sent to backend
**Solution**: 
1. Restart backend server
2. Clear browser cache
3. Verify `reportCardApi.js` is using the updated version

### Error: "Unexpected token '<'"
**Cause**: Browser loading old cached JavaScript
**Solution**: Hard refresh browser (Ctrl+Shift+R)

### Error: "404 Not Found"
**Cause**: Backend routes not loaded
**Solution**: Restart backend server

### Error: "Cannot find module '@/utils/reportCardPdf'"
**Cause**: Import path issue
**Solution**: Imports should be `from "@/utils/reportCardPdf"` (no extension)

## File Locations

### Backend Files
- `backend/src/controllers/report-card/report-card.controller.js`
- `backend/src/routes/report-card/report-card.routes.js`
- `backend/src/routes/routes.js` (updated)

### Frontend Files
- `Client/src/components/erp/ReportCard.jsx`
- `Client/src/utils/reportCardPdf.jsx`
- `Client/src/data/reportCardApi.js`
- `Client/src/routes/marks-itla-nama.jsx` (updated)
- `Client/src/routes/report-cards.jsx` (new standalone page)
- `Client/src/App.jsx` (updated)

### Required Assets
- `Client/public/pic1.jpg` - Left logo
- `Client/public/pic2.jpg` - Right logo
- `Client/public/Amiri-Bold.ttf` - Font
- `Client/public/Amiri-Regular.ttf` - Font

## Next Steps

1. **Restart both servers** (backend and frontend)
2. **Clear browser cache** completely
3. **Test the download** functionality
4. If still not working, check browser console for specific errors
5. Check Network tab to see actual API requests being made

## Support

If issues persist after following all steps:
1. Check backend logs: `backend/logs/combined.log`
2. Check browser console for JavaScript errors
3. Check Network tab for failed API calls
4. Verify all files were saved correctly
5. Ensure no TypeScript/build errors in terminal

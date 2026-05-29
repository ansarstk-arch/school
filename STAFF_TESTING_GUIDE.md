# Staff Module - Quick Testing Guide

## 🚀 How to Test the Staff Module

### Step 1: Start Backend Server

```bash
cd backend
npm run dev
```

Backend should be running on: `http://localhost:3000`

### Step 2: Start Frontend Server

```bash
cd Client
npm run dev
```

Frontend should be running on: `http://localhost:5173`

### Step 3: Login

1. Open browser: `http://localhost:5173`
2. Login with:
   - Email: `admin@school.af`
   - Password: `admin123`

### Step 4: Navigate to Staff Page

1. Click on "کارمندان" (Staff) in the sidebar
2. You should see the Staff Management page with AG Grid table

---

## 🧪 Test Cases

### Test 1: View Staff List
- ✅ Should see empty table or existing staff
- ✅ Should see pagination controls
- ✅ Should see filter bar
- ✅ Should see "نوی کارمند" button

### Test 2: Create New Staff

1. Click "نوی کارمند" (New Staff) button
2. Fill in the form:
   - **نوم** (Name): احمد نادر
   - **د پلار نوم** (Father Name): نادر خان (optional)
   - **ټېلیفون** (Phone): +93 700 100 200
   - **تذکیره نمبر** (ID Card): 1234567 (optional)
   - **مسئولیت** (Responsibility): مدیر اداري
   - **معاش** (Salary): 15000
   - **یادښتونه** (Notes): Test staff member (optional)
3. Click "ثبتول" (Save)
4. ✅ Should see success toast: "کارمند بریالیتوب سره ثبت شو"
5. ✅ Should see new staff in the table

### Test 3: Validation Testing

1. Click "نوی کارمند"
2. Leave all fields empty
3. Click "ثبتول"
4. ✅ Should see Pashto error messages:
   - "نوم اړین دی"
   - "ټېلیفون نمبر اړین دی"
   - "مسئولیت اړین دی"
   - "معاش اړین دی"

5. Enter invalid phone: `123456`
6. ✅ Should see: "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي"

7. Enter negative salary: `-1000`
8. ✅ Should see: "معاش باید له صفر څخه زیات وي"

### Test 4: View Staff Details

1. Click the "کتل" (Eye) icon on any staff row
2. ✅ Should open view modal
3. ✅ Should display all staff information
4. Click "بندول" (Close)
5. ✅ Modal should close

### Test 5: Edit Staff

1. Click the "سمول" (Pencil) icon on any staff row
2. ✅ Should open edit modal with pre-filled data
3. Change the salary to: `18000`
4. Click "ثبتول" (Save)
5. ✅ Should see success toast: "کارمند بریالیتوب سره تازه شو"
6. ✅ Should see updated salary in the table

### Test 6: Delete Staff

1. Click the "ړنګول" (Trash) icon on any staff row
2. ✅ Should open confirmation modal
3. ✅ Should show staff name in modal
4. Click "ړنګول" (Delete)
5. ✅ Should see success toast: "کارمند بریالیتوب سره ړنګ شو"
6. ✅ Staff should be removed from table

### Test 7: Pagination

1. Create multiple staff members (at least 13)
2. ✅ Should see pagination controls
3. Click "Next" page
4. ✅ Should load next page of staff
5. ✅ Page number should update

### Test 8: Filtering

1. Enter staff name in "د نوم لټون" filter
2. Click "پلي کول" (Apply)
3. ✅ Should filter staff by name
4. Click "پاکول" (Clear)
5. ✅ Should show all staff again

### Test 9: Excel Export

1. Click the Excel export button (if visible in AG Grid)
2. ✅ Should download Excel file: `staff_YYYY-MM-DD.xlsx`
3. Open the Excel file
4. ✅ Should contain all staff data in Pashto headers

### Test 10: Responsive Design

1. Resize browser window to mobile size
2. ✅ Table should remain usable with horizontal scroll
3. ✅ Modals should be responsive
4. ✅ Buttons should be accessible

---

## 🐛 Common Issues & Solutions

### Issue 1: "کارمند ونه موندل شو" (Staff not found)
**Solution**: Make sure backend is running and database is accessible

### Issue 2: Validation errors not showing
**Solution**: Check browser console for errors, ensure validation is working

### Issue 3: Table not loading
**Solution**: 
- Check backend logs
- Verify API endpoint: `http://localhost:3000/api/v1/staff`
- Check authentication token

### Issue 4: Excel export not working
**Solution**: 
- Check if ExcelJS is installed: `npm list exceljs`
- Check browser console for errors

### Issue 5: Pagination not working
**Solution**: 
- Verify backend returns pagination data
- Check network tab for API response

---

## 📊 API Testing with Postman/Thunder Client

### 1. Get All Staff
```
GET http://localhost:3000/api/v1/staff
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 2. Get Staff with Pagination
```
GET http://localhost:3000/api/v1/staff?page=1&limit=10
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 3. Get Staff with Filter
```
GET http://localhost:3000/api/v1/staff?name=احمد
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 4. Create Staff
```
POST http://localhost:3000/api/v1/staff
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
Body:
{
  "name": "احمد نادر",
  "fatherName": "نادر خان",
  "phone": "+93 700 100 200",
  "idCardNumber": "1234567",
  "responsibility": "مدیر اداري",
  "salary": 15000,
  "notes": "Test staff"
}
```

### 5. Update Staff
```
PUT http://localhost:3000/api/v1/staff/1
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
Body:
{
  "salary": 18000
}
```

### 6. Delete Staff
```
DELETE http://localhost:3000/api/v1/staff/1
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## ✅ Expected Results Summary

After completing all tests, you should have:

- ✅ Created multiple staff members
- ✅ Viewed staff details
- ✅ Edited staff information
- ✅ Deleted staff members
- ✅ Tested pagination
- ✅ Tested filtering
- ✅ Exported to Excel
- ✅ Verified all validation messages in Pashto
- ✅ Confirmed responsive design works

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Test Results:
[ ] View Staff List - PASS / FAIL
[ ] Create Staff - PASS / FAIL
[ ] Validation - PASS / FAIL
[ ] View Details - PASS / FAIL
[ ] Edit Staff - PASS / FAIL
[ ] Delete Staff - PASS / FAIL
[ ] Pagination - PASS / FAIL
[ ] Filtering - PASS / FAIL
[ ] Excel Export - PASS / FAIL
[ ] Responsive Design - PASS / FAIL

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## 🎉 Success Criteria

The Staff module is working correctly if:

✅ All CRUD operations work without errors
✅ All validation messages appear in Pashto
✅ Pagination works correctly
✅ Filtering works correctly
✅ Excel export generates valid file
✅ UI matches Teacher module exactly
✅ No console errors
✅ Responsive on all screen sizes

---

**Happy Testing! 🚀**

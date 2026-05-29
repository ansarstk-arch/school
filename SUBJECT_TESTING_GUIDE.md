# 🧪 SUBJECT MODULE - QUICK TESTING GUIDE

## ⚡ Quick Start (5 minutes)

### Step 1: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd Client
npm run dev
```

### Step 2: Navigate to Subjects
1. Open http://localhost:5173
2. Login with your credentials
3. Click "مضامین" in sidebar

### Step 3: Test Create Subject
1. Click "نوی مضمون" button
2. Fill form:
   - **Name**: ریاضي
   - **Type**: ښوونځی
   - **Classes**: Click "ټول" to select all
3. Click "ثبتول"
4. ✅ Subject should appear in table

---

## ✅ Validation Testing

### Test 1: Empty Name
1. Click "نوی مضمون"
2. Leave name empty
3. Click "ثبتول"
4. ✅ Error: "د مضمون نوم اړین دی"

### Test 2: Short Name
1. Click "نوی مضمون"
2. Enter: "ر"
3. Click "ثبتول"
4. ✅ Error: "د مضمون نوم باید لږترلږه ۲ توري وي"

### Test 3: Invalid Characters
1. Click "نوی مضمون"
2. Enter: "Math123!@#"
3. Click "ثبتول"
4. ✅ Error: "د مضمون نوم یوازې پښتو، دري یا انګلیسي توري ولري"

### Test 4: No Classes Selected
1. Click "نوی مضمون"
2. Enter name: "ریاضي"
3. Don't select any classes
4. Click "ثبتول"
5. ✅ Error: "لږترلږه یو ټولګی وټاکئ"

### Test 5: Valid Data
1. Click "نوی مضمون"
2. Enter name: "ریاضي"
3. Select type: "ښوونځی"
4. Click "ټول" to select all classes
5. Click "ثبتول"
6. ✅ Success: Subject created

---

## 🎯 Select All / Deselect All Testing

### Test 1: Select All Button
1. Click "نوی مضمون"
2. Click "ټول" button
3. ✅ All classes should be checked
4. ✅ Count should show total classes

### Test 2: Deselect All Button
1. Click "نوی مضمون"
2. Click "ټول" to select all
3. Click "هیچ یک نه" button
4. ✅ All classes should be unchecked
5. ✅ Count should show 0

### Test 3: Header Checkbox
1. Click "نوی مضمون"
2. Click header checkbox
3. ✅ All classes should be checked
4. Click header checkbox again
5. ✅ All classes should be unchecked

### Test 4: Manual Selection
1. Click "نوی مضمون"
2. Manually check 2-3 classes
3. ✅ Count should show selected number
4. Click "ټول"
5. ✅ All should be selected

---

## 📅 Academic Year Testing

### Test 1: Year Auto-Set
1. Click "نوی مضمون"
2. ✅ Academic year should show current year (1404 or similar)
3. ✅ Field should be disabled (read-only)

### Test 2: Year in Table
1. Create a subject
2. ✅ Academic year should appear in table
3. ✅ Should match the year you set

### Test 3: Filter by Year
1. Use FilterBar
2. Enter academic year: "1404"
3. ✅ Only subjects from that year should show
4. Clear filter
5. ✅ All subjects should show again

---

## 📊 Pagination Testing

### Test 1: Page Size
1. Create multiple subjects (15+)
2. ✅ Table should show 12 items per page
3. ✅ Pagination buttons should appear

### Test 2: Next Page
1. Click next page button (→)
2. ✅ Should show next 12 items
3. ✅ Page number should update

### Test 3: Previous Page
1. Go to page 2
2. Click previous page button (←)
3. ✅ Should go back to page 1

### Test 4: Page Numbers
1. Create 30+ subjects
2. ✅ Should show page numbers
3. Click page 2
4. ✅ Should jump to page 2

### Test 5: Filter Reset
1. Go to page 2
2. Apply filter
3. ✅ Should reset to page 1
4. ✅ Should show filtered results

---

## 🔍 Filtering Testing

### Test 1: Filter by Name
1. Create subjects: "ریاضي", "فزیک", "انګلیسي"
2. Use FilterBar
3. Enter name: "ریاضي"
4. ✅ Only "ریاضي" should show
5. Clear filter
6. ✅ All should show again

### Test 2: Filter by Type
1. Create subjects with different types
2. Use FilterBar
3. Select type: "ښوونځی"
4. ✅ Only School subjects should show
5. Select type: "مرکز"
6. ✅ Only Center subjects should show

### Test 3: Filter by Year
1. Create subjects with different years
2. Use FilterBar
3. Enter year: "1404"
4. ✅ Only 1404 subjects should show

### Test 4: Combine Filters
1. Use FilterBar
2. Enter name: "ریاضي"
3. Select type: "ښوونځی"
4. Enter year: "1404"
5. ✅ Should show only matching subjects

---

## ✏️ Edit Testing

### Test 1: Edit Subject
1. Click pencil icon on subject
2. Change name to "ریاضي (تازه شده)"
3. Click "ثبتول"
4. ✅ Subject should update
5. ✅ Table should refresh

### Test 2: Edit Classes
1. Click pencil icon
2. Click "هیچ یک نه" to deselect all
3. Select 2-3 classes
4. Click "ثبتول"
5. ✅ Classes should update

### Test 3: Edit Type
1. Click pencil icon
2. Change type
3. ✅ Classes should auto-update
4. Click "ثبتول"
5. ✅ Type should change

---

## 🗑️ Delete Testing

### Test 1: Delete Subject
1. Click trash icon
2. Confirm deletion
3. ✅ Subject should disappear
4. ✅ Table should refresh

### Test 2: Delete and Pagination
1. Go to page 2
2. Delete a subject
3. ✅ Should stay on page 2 (or go to page 1 if last item)
4. ✅ Count should decrease

---

## 👁️ View Testing

### Test 1: View Subject
1. Click eye icon
2. ✅ Modal should show subject details
3. ✅ Should show name, type, year, classes
4. Click "بندول"
5. ✅ Modal should close

---

## 🐛 Error Handling Testing

### Test 1: Network Error
1. Stop backend
2. Try to create subject
3. ✅ Should show error message
4. Start backend
5. ✅ Should work again

### Test 2: Duplicate Subject
1. Create subject: "ریاضي" (School, 1404)
2. Try to create same subject again
3. ✅ Should show error: "دا مضمون دمخه شتون لري"

### Test 3: Invalid Class Type
1. Create subject with School type
2. Select classes from different type
3. ✅ Should show error on submit

---

## 📋 Complete Test Checklist

### Validation
- [ ] Empty name shows error
- [ ] Short name shows error
- [ ] Invalid characters show error
- [ ] No classes shows error
- [ ] Valid data submits successfully

### Select All/Deselect All
- [ ] "ټول" button selects all
- [ ] "هیچ یک نه" button deselects all
- [ ] Header checkbox works
- [ ] Count updates correctly

### Academic Year
- [ ] Year auto-sets to current
- [ ] Year field is read-only
- [ ] Year appears in table
- [ ] Can filter by year

### Pagination
- [ ] Shows 12 items per page
- [ ] Next button works
- [ ] Previous button works
- [ ] Page numbers work
- [ ] Filter resets page

### Filtering
- [ ] Filter by name works
- [ ] Filter by type works
- [ ] Filter by year works
- [ ] Combine filters works
- [ ] Clear filter works

### CRUD
- [ ] Can create subject
- [ ] Can edit subject
- [ ] Can delete subject
- [ ] Can view subject

### Error Handling
- [ ] Shows validation errors
- [ ] Shows network errors
- [ ] Shows duplicate errors
- [ ] Error messages are clear

---

## 🎉 Success Criteria

All tests pass when:
- ✅ Form validation works
- ✅ Select all/deselect all works
- ✅ Academic year works
- ✅ Pagination works
- ✅ Filtering works
- ✅ CRUD operations work
- ✅ Error handling works
- ✅ No console errors

---

## 📞 Troubleshooting

### "Validation error even with valid data"
- Check browser console for errors
- Verify all required fields are filled
- Try refreshing page

### "Select all button not working"
- Check if classes are loaded
- Try clicking individual classes first
- Refresh page

### "Pagination not showing"
- Create more than 12 subjects
- Check if data is loading
- Verify backend is running

### "Filter not working"
- Check if data exists for filter
- Try clearing and reapplying filter
- Verify backend is running

---

**All tests should pass! 🚀**

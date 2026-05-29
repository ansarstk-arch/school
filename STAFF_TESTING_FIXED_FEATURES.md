# Staff Module - Testing Guide for Fixed Features

## 🧪 Test All Fixed Features

### Test 1: Verify No Default Staff ✅

**Steps:**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd Client && npm run dev`
3. Login with admin credentials
4. Navigate to Staff page (کارمندان)

**Expected Result:**
- ✅ Table should be empty
- ✅ Should show "هیڅ کارمند ونه موندل شو" (No staff found)
- ✅ Total count should be 0

---

### Test 2: Client-Side Validation (Pashto Messages) ✅

**Steps:**
1. Click "نوی کارمند" (New Staff)
2. Leave all fields empty
3. Click "ثبتول" (Save)

**Expected Errors (in Pashto):**
- ✅ "نوم اړین دی" (Name is required)
- ✅ "ټېلیفون نمبر اړین دی" (Phone is required)
- ✅ "مسئولیت اړین دی" (Responsibility is required)
- ✅ "معاش اړین دی" (Salary is required)

**Test Invalid Phone:**
1. Enter name: "احمد نادر"
2. Enter phone: "123456" (invalid)
3. Enter responsibility: "مدیر"
4. Enter salary: "15000"
5. Click "ثبتول"

**Expected Error:**
- ✅ "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)"

**Test Negative Salary:**
1. Fill all required fields correctly
2. Enter salary: "-1000"
3. Click "ثبتول"

**Expected Error:**
- ✅ "معاش باید له صفر څخه زیات وي"

---

### Test 3: Image Upload Functionality ✅

**Test 3.1: Upload Image**

**Steps:**
1. Click "نوی کارمند"
2. Fill all required fields:
   - Name: "احمد نادر"
   - Phone: "+93 700 100 200"
   - Responsibility: "مدیر اداري"
   - Salary: "15000"
3. Click "انځور غوره کول" (Select Image)
4. Choose a JPG/PNG image (any size)
5. Verify preview shows
6. Click "ثبتول"

**Expected Results:**
- ✅ Image preview appears immediately
- ✅ Staff created successfully
- ✅ Image saved in `backend/uploads/staff/2024/` (current year)
- ✅ Image compressed to ~200KB or less
- ✅ Success toast: "کارمند بریالیتوب سره ثبت شو"

**Test 3.2: Remove Image Before Save**

**Steps:**
1. Click "نوی کارمند"
2. Select an image
3. Click X button on image preview
4. Verify preview disappears
5. Fill other fields and save

**Expected Results:**
- ✅ Image preview removed
- ✅ Staff created without image
- ✅ No image file saved

**Test 3.3: Update Image**

**Steps:**
1. Click Edit (pencil icon) on existing staff
2. Click "انځور غوره کول"
3. Select a different image
4. Click "ثبتول"

**Expected Results:**
- ✅ Old image deleted from server
- ✅ New image uploaded and compressed
- ✅ New image saved in year folder
- ✅ Success toast shown

**Test 3.4: Remove Image on Update**

**Steps:**
1. Edit staff member with image
2. Click X on image preview
3. Click "ثبتول"

**Expected Results:**
- ✅ Image removed from server
- ✅ Database updated (image = null)
- ✅ View modal shows no image

---

### Test 4: View Modal Shows Salary & Image ✅

**Test 4.1: View Staff with Image**

**Steps:**
1. Create staff with image (use Test 3.1)
2. Click View (eye icon) on the staff

**Expected Results:**
- ✅ Modal opens with title "د کارمند معلومات"
- ✅ Shows all fields:
  - بشپړ نوم (Full Name)
  - د پلار نوم (Father Name)
  - ټېلیفون (Phone)
  - تذکیره نمبر (ID Card)
  - مسئولیت (Responsibility)
  - **معاش (Salary)** - Formatted as "AFN 15,000"
  - د شمولیت نېټه (Joined Date)
  - حالت (Status)
  - یادښتونه (Notes if any)
- ✅ **Image displayed on right side** (32x40 size)
- ✅ Image has hover effect
- ✅ Cursor changes to pointer on image

**Test 4.2: Image Lightbox**

**Steps:**
1. In view modal, click on the staff image

**Expected Results:**
- ✅ Lightbox opens with full-size image
- ✅ Dark overlay background
- ✅ Close button (X) visible
- ✅ Click outside or X closes lightbox
- ✅ Image centered and responsive

**Test 4.3: View Staff without Image**

**Steps:**
1. Create staff without image
2. Click View on that staff

**Expected Results:**
- ✅ All fields shown correctly
- ✅ Salary formatted properly
- ✅ No image section (gracefully hidden)
- ✅ Layout adjusts to full width

---

### Test 5: Server-Side & Client-Side Pagination ✅

**Test 5.1: Create Multiple Staff**

**Steps:**
1. Create 15 staff members (use different phones)
2. Verify all created successfully

**Test 5.2: Server-Side Pagination**

**Steps:**
1. Open browser DevTools → Network tab
2. Navigate to Staff page
3. Check the API request to `/api/v1/staff`

**Expected Results:**
- ✅ Request includes: `?page=1&limit=12`
- ✅ Response includes:
  ```json
  {
    "data": {
      "staff": [...],
      "pagination": {
        "total": 15,
        "page": 1,
        "limit": 12,
        "totalPages": 2
      }
    }
  }
  ```
- ✅ Only 12 staff returned (not all 15)

**Test 5.3: Client-Side Pagination UI**

**Steps:**
1. Verify pagination controls visible at bottom
2. Check total count shows "15"
3. Check page shows "1 of 2"
4. Click "Next" or page 2

**Expected Results:**
- ✅ Pagination controls visible
- ✅ Total count correct
- ✅ Page indicator correct
- ✅ Clicking next loads page 2
- ✅ API called with `?page=2&limit=12`
- ✅ Remaining 3 staff shown
- ✅ Previous button now enabled

**Test 5.4: Pagination with Filters**

**Steps:**
1. Apply filter (e.g., name contains "احمد")
2. Verify pagination resets to page 1
3. Check total count updates

**Expected Results:**
- ✅ Page resets to 1
- ✅ Total count shows filtered count
- ✅ Pagination works with filtered data

---

## 🔍 Additional Integration Tests

### Test 6: Complete CRUD with Image

**Steps:**
1. **Create** staff with image
2. **View** staff - verify image shows
3. **Edit** staff - change salary and image
4. **View** again - verify changes
5. **Delete** staff

**Expected Results:**
- ✅ All operations successful
- ✅ Images handled correctly at each step
- ✅ Old images deleted on update/delete
- ✅ No orphaned files in uploads folder

---

### Test 7: Server-Side Validation

**Steps:**
1. Use Postman/Thunder Client
2. Send POST to `/api/v1/staff` with invalid data:
   ```json
   {
     "name": "A",
     "phone": "123",
     "responsibility": "X",
     "salary": -100
   }
   ```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Errors returned in Pashto
- ✅ Frontend validation cannot be bypassed

---

### Test 8: Image Compression

**Steps:**
1. Find a large image (>2MB)
2. Upload it for a staff member
3. Check the saved file in `backend/uploads/staff/2024/`

**Expected Results:**
- ✅ Original image not saved
- ✅ Compressed image saved
- ✅ File size ≤ 200KB
- ✅ Image quality acceptable
- ✅ Filename starts with "compressed-"

---

### Test 9: Year-Based Folders

**Steps:**
1. Create staff with image in 2024
2. Check folder structure

**Expected Results:**
- ✅ Folder exists: `backend/uploads/staff/2024/`
- ✅ Image saved in year folder
- ✅ Folder created automatically if not exists

---

### Test 10: Excel Export with Images

**Steps:**
1. Create several staff (some with images, some without)
2. Click Excel export button
3. Open downloaded file

**Expected Results:**
- ✅ Excel file downloads
- ✅ All staff included
- ✅ Salary column formatted
- ✅ All fields present
- ✅ Pashto headers correct

---

## 📋 Final Verification Checklist

### Backend
- [ ] No default staff in database
- [ ] Server-side validation working (Pashto)
- [ ] Image upload endpoint working
- [ ] Image compression working
- [ ] Year folders created automatically
- [ ] Old images deleted on update/delete
- [ ] Pagination query parameters working
- [ ] Response includes pagination info

### Frontend
- [ ] No demo data displayed
- [ ] Client-side validation working (Pashto)
- [ ] Image upload UI working
- [ ] Image preview working
- [ ] Image remove working
- [ ] View modal shows salary
- [ ] View modal shows image
- [ ] Image lightbox working
- [ ] Pagination UI working
- [ ] Page navigation working
- [ ] Filter + pagination working
- [ ] Excel export working

### Integration
- [ ] Create with image works end-to-end
- [ ] Update with image works end-to-end
- [ ] Delete removes image from server
- [ ] Validation prevents invalid data
- [ ] Pagination loads correct data
- [ ] All Pashto messages display correctly

---

## 🎯 Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ All Pashto messages correct
- ✅ Images compressed and saved properly
- ✅ Pagination working smoothly
- ✅ Validation preventing bad data
- ✅ UI matching teacher module exactly

---

## 🐛 Common Issues & Solutions

### Issue: Image not uploading
**Solution**: Check multer middleware is applied to route

### Issue: Image not compressed
**Solution**: Verify sharp library installed: `npm list sharp`

### Issue: Pagination not working
**Solution**: Check API response includes pagination object

### Issue: Validation messages in English
**Solution**: Verify validator file has Pashto messages

### Issue: Year folder not created
**Solution**: Check folder permissions and fs.mkdirSync recursive option

---

**Testing Status**: Ready for comprehensive testing
**Expected Duration**: 30-45 minutes for complete test suite

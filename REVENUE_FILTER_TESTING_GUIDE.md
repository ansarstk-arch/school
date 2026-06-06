# Revenue Filter Testing Guide

## Quick Test Checklist

Follow these steps to verify the revenue filter update works correctly:

---

## 1. Initial Load Test ✓
**What to check:**
- [ ] Revenue page loads without errors
- [ ] Default filter shows current month (e.g., 1403-10)
- [ ] Default status filter is "Unpaid"
- [ ] Statistics cards display correctly
- [ ] Fee payments table loads with data

**Expected Result:** Page loads with current month's unpaid fees by default

---

## 2. Month Picker Test ✓
**Steps:**
1. Click on the "میاشت او کال" (Month & Year) filter
2. Select a different month (e.g., 1403-09)
3. Click "Apply Filter"

**What to check:**
- [ ] Month picker opens correctly
- [ ] Both year and month are selectable together
- [ ] Selected value shows in format: YYYY-MM
- [ ] Table updates after applying filter
- [ ] Statistics update for selected month

**Expected Result:** Data filters by selected month and year

---

## 3. Combined Filters Test ✓
**Steps:**
1. Select Month: 1403-08
2. Select Status: Paid
3. Select Type: School
4. Click "Apply Filter"

**What to check:**
- [ ] All filters work together
- [ ] Table shows only paid school fees from month 1403-08
- [ ] Statistics reflect the filtered data
- [ ] Pagination works correctly

**Expected Result:** Multiple filters combine correctly

---

## 4. Clear Filters Test ✓
**Steps:**
1. Apply some filters
2. Click "Clear" button

**What to check:**
- [ ] All filters reset
- [ ] Month resets to current month
- [ ] Status resets to "Unpaid"
- [ ] Other filters clear
- [ ] Table reloads with default data

**Expected Result:** Filters reset to defaults

---

## 5. Search Test ✓
**Steps:**
1. Enter a student name or receipt number in search
2. Optionally set month filter
3. Click "Apply Filter"

**What to check:**
- [ ] Search works with month filter
- [ ] Results match search term
- [ ] Pagination adjusts to search results

**Expected Result:** Search combines with month filter

---

## 6. Statistics Accuracy Test ✓
**Steps:**
1. Select month: 1403-10
2. Check statistics cards
3. Manually verify one or two numbers

**What to check:**
- [ ] "د دې میاشتې ټول فیس" (Total Due) is accurate
- [ ] "راټول شوی فیس" (Total Collected) matches
- [ ] "پاتې فیس" (Remaining) = Total Due - Total Collected
- [ ] "ټول پیسې" (Total Payments) count is correct

**Expected Result:** Statistics accurately reflect the selected month

---

## 7. Pagination Test ✓
**Steps:**
1. Set a month filter
2. Navigate through pages

**What to check:**
- [ ] Page navigation works
- [ ] Filter persists across pages
- [ ] URL updates with page parameter
- [ ] Data loads correctly on each page

**Expected Result:** Pagination maintains filter state

---

## 8. Export Test ✓
**Steps:**
1. Set month filter: 1403-10
2. Click Excel export button
3. Click PDF export button

**What to check:**
- [ ] Excel file downloads
- [ ] PDF file downloads
- [ ] Exported data matches filtered results
- [ ] Month is reflected in exported data

**Expected Result:** Export includes filtered data

---

## 9. Backend Compatibility Test ✓
**Steps:**
1. Open browser developer tools (F12)
2. Go to Network tab
3. Apply a month filter (e.g., 1403-09)
4. Check the API request

**What to check:**
- [ ] API request includes `month=1403-09`
- [ ] API request includes `academicYear=1403`
- [ ] Backend responds successfully
- [ ] No console errors

**Expected Result:** Backend receives both parameters correctly

**Example Request:**
```
GET /api/fees?month=1403-09&academicYear=1403&status=Unpaid&page=1&limit=50
```

---

## 10. Edge Cases Test ✓

### Test A: No Month Selected
**Steps:**
1. Clear all filters
2. Remove month value manually (if possible)
3. Apply filter

**Expected:** Should use current month as default

### Test B: Future Month
**Steps:**
1. Select a future month (e.g., 1403-12)
2. Apply filter

**Expected:** Should work, may show no data

### Test C: Past Year
**Steps:**
1. Select month from previous year (e.g., 1402-12)
2. Apply filter

**Expected:** Should show historical data correctly

---

## 11. Consistency Check ✓
**Steps:**
1. Go to Salary module
2. Compare filter layout
3. Go back to Revenue module

**What to check:**
- [ ] Revenue filter looks similar to Salary filter
- [ ] Month picker behaves the same way
- [ ] User experience is consistent

**Expected Result:** Consistent UX across modules

---

## 12. Form vs Filter Test ✓
**Purpose:** Verify that fee creation form still works independently

**Steps:**
1. Click "نوی فیس" (New Fee) button
2. Check the form fields

**What to check:**
- [ ] Form still has separate month field
- [ ] Form still has separate academic year field
- [ ] Form month picker works
- [ ] Fee creation works normally

**Expected Result:** Form fields are unchanged (only filter was updated)

---

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari (if available)

---

## Performance Check

**What to monitor:**
- [ ] Filter response time < 2 seconds
- [ ] No memory leaks when changing filters
- [ ] No duplicate API calls
- [ ] Smooth UI updates

---

## Common Issues & Solutions

### Issue 1: Month picker not showing
**Solution:** Check if ShamsiMonthPicker component is imported correctly

### Issue 2: Year not sent to backend
**Solution:** Verify the year extraction logic in `loadPayments` function

### Issue 3: Statistics not updating
**Solution:** Check useEffect dependencies include `filters.month`

### Issue 4: Default month not working
**Solution:** Verify `currentShamsiYearMonth()` returns correct format

---

## Test Data Scenarios

### Scenario 1: Student with multiple fees
- Select month where student has multiple payments
- Verify all show up

### Scenario 2: Empty month
- Select a month with no fee data
- Should show empty state

### Scenario 3: Mixed statuses
- Filter by month with Paid, Unpaid, and Partial fees
- Test status filter combinations

---

## Rollback Plan

If issues are found:

1. **Quick Fix:** Revert import and add back ShamsiYearPicker
2. **Restore:** Git revert the commit
3. **Alternative:** Keep separate pickers but update styling

---

## Success Criteria

✅ All 12 tests pass  
✅ No console errors  
✅ Backend compatibility maintained  
✅ UX improved from previous version  
✅ Consistent with Salary module  

---

## Report Template

```
Revenue Filter Update - Test Results
=====================================

Date: __________
Tester: __________

[ ] Initial Load: PASS / FAIL
[ ] Month Picker: PASS / FAIL
[ ] Combined Filters: PASS / FAIL
[ ] Clear Filters: PASS / FAIL
[ ] Search: PASS / FAIL
[ ] Statistics: PASS / FAIL
[ ] Pagination: PASS / FAIL
[ ] Export: PASS / FAIL
[ ] Backend: PASS / FAIL
[ ] Edge Cases: PASS / FAIL
[ ] Consistency: PASS / FAIL
[ ] Form: PASS / FAIL

Notes:
_________________________________________________
_________________________________________________
_________________________________________________

Overall Status: APPROVED / NEEDS FIXES
```

---

**Ready to Test!** 🚀

Start with Test #1 and work through the checklist. Report any issues found.

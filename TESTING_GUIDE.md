# Testing Guide - Critical Fixes

## Quick Testing Steps

### 1. INVENTORY MODULE

#### Test Purchase Price (Required)
1. Go to Inventory page
2. Click "نوی توکی" (New Item)
3. Try to save without entering purchase price
4. ✅ Should show error: "د اخیستلو بیه اړینه ده"
5. Enter purchase price and save
6. ✅ Should save successfully

#### Test Monthly Revenue
1. Add a sale in current month
2. Check the "میاشتنی عاید" (Monthly Revenue) stat card
3. ✅ Should show the sale amount immediately
4. Wait for next month (or manually change date in backend for testing)
5. ✅ Revenue should reset to 0 for the new month

#### Test Pagination
1. Items Table:
   - Create more than 20 items
   - ✅ Should show pagination controls at bottom
   - ✅ Should display "Page 1 of X"
   - Click next page
   - ✅ Should load next 20 items

2. Sales Table:
   - Create more than 20 sales
   - ✅ Should show pagination controls
   - ✅ Navigation should work properly

---

### 2. PARENT NUMBERS MODULE

#### Test Cascading Filter
1. Go to Parent Numbers page
2. In filter, select "ډول" (Type): Choose "ښوونځی" (School)
3. ✅ "ټولګی" (Class) dropdown should populate with school classes only
4. Select a specific class
5. Click "پلي کول" (Apply)
6. ✅ Should show only students from that class

#### Test Absence Filter
1. In filter, find "حاضري حالت" (Attendance Status)
2. ✅ Should have 3 options:
   - "ټول" (All)
   - "غیر حاضر" (Absent)
   - "حاضر" (Present)
3. Select "غیر حاضر"
4. ✅ Should show only absent students

#### Test Type Column Removed
1. Look at the table columns
2. ✅ Should NOT see "ډول" (Type) column
3. ✅ Should see: ID, Name, Father Name, Class, Parent Numbers, Attendance, Call Status

#### Test Toggle Switch Styling
1. Find the "زنګ وهل شوی" (Call Status) column
2. Click on a toggle switch
3. ✅ Toggle should animate smoothly
4. ✅ White circle should move from left to right
5. ✅ Background should change color
6. ✅ No positioning issues or jumping

#### Test Daily Reset (CRITICAL) ⚠️
**Method 1 - Wait for Midnight:**
1. Before midnight, mark some students as "called" (toggle ON)
2. Note which students are marked
3. Wait until after midnight (00:00)
4. Refresh the page
5. ✅ All "زنګ وهل شوی" toggles should be OFF (reset to 0)

**Method 2 - Check Logs:**
1. Check backend console logs after midnight
2. ✅ Should see: `[Cron] Running daily parent call status reset at midnight`
3. ✅ Should see: `[Cron] Parent call status reset completed`

**Method 3 - Database Check:**
```sql
-- Check the table before and after midnight
SELECT * FROM absent_parent_calls WHERE attendance_date < date('now', '-1 day');
-- After cron runs, this should return 0 rows
```

#### Test Pagination
1. Have more than 20 students
2. ✅ Should see pagination controls
3. ✅ Should show 20 items per page
4. Click through pages
5. ✅ Should load correctly

---

### 3. STAFF MODULE

#### Test Academic Year in Registration
1. Go to Staff page
2. Click "نوی کارمند" (New Staff)
3. ✅ Should see "تعلیمي کال" (Academic Year) field
4. ✅ Should default to current year (e.g., 1403 or 2024)
5. Fill other required fields
6. Change academic year to different year
7. Click "ثبتول" (Save)
8. ✅ Should save successfully

#### Test Academic Year in Filter
1. On Staff page, click filter button
2. ✅ Should see "تعلیمي کال" filter option
3. Select a specific year
4. Click "پلي کول" (Apply)
5. ✅ Should show only staff from that academic year

#### Test Academic Year in View
1. Click "کتل" (View) on any staff member
2. ✅ View modal should show "تعلیمي کال" field
3. ✅ Should display the academic year value

#### Test Pagination
1. ✅ Already exists - verify it works
2. Should show 12 items per page
3. ✅ Navigation should be smooth

---

## Expected Behavior Summary

### What Should Work:
✅ Purchase price cannot be empty in inventory
✅ Monthly revenue shows current month's sales
✅ All tables have working pagination
✅ Parent numbers filter cascades from type to class
✅ Absence filter has 3 options (all/absent/present)
✅ Type column is hidden in parent numbers table
✅ Toggle switches look professional and animate smoothly
✅ Call status resets to 0 every midnight automatically
✅ Staff registration includes academic year
✅ Staff can be filtered by academic year
✅ Academic year shows in staff details

### What Should NOT Happen:
❌ Cannot save inventory item without purchase price
❌ Type column should not appear in parent numbers table
❌ Toggle switch should not have positioning issues
❌ Old call status should not persist to next day
❌ Staff form should not be missing academic year field

---

## Troubleshooting

### If Monthly Revenue Shows 0:
- Check if sales exist in current month
- Verify sale dates match current Afghan date format
- Check backend logs for date calculation

### If Daily Reset Doesn't Work:
- Check if cron job is running: Look for log at midnight
- Verify server timezone settings
- Check if `absent_parent_calls` table exists
- Manually run: `DELETE FROM absent_parent_calls WHERE attendance_date < date('now', '-1 day')`

### If Cascading Filter Doesn't Work:
- Check browser console for errors
- Verify type is selected before expecting classes
- Check network tab for API call to get classes
- Ensure `getClassesByType` API is working

### If Academic Year Not Saving:
- Check if database column exists: `SELECT academic_year FROM staff LIMIT 1`
- Verify backend is receiving the field in request
- Check backend logs for errors

---

## Manual Database Verification

### Check Staff Academic Year Column:
```sql
PRAGMA table_info(staff);
-- Should include academic_year column
```

### Check Cron Job Execution:
```sql
-- Check if old call records are deleted after midnight
SELECT COUNT(*) FROM absent_parent_calls 
WHERE attendance_date < date('now', '-1 day');
-- Should be 0 after cron runs
```

### Check Inventory Monthly Revenue:
```sql
SELECT SUM(total_amount) 
FROM inventory_sales 
WHERE academic_year = '1403' 
AND sale_date LIKE '1403-06%';  -- Current month
-- Should match the displayed monthly revenue
```

---

## Performance Testing

1. **Inventory with 100+ items**: Should still paginate smoothly
2. **Parent numbers with 500+ students**: Should load within 2-3 seconds
3. **Staff with 50+ members**: Should filter and paginate quickly
4. **Cron job at midnight**: Should complete within 1 second

---

## Success Criteria

All tests pass = Ready for production! 🎉

# Fee Management System - Installation & Testing Guide

## 📦 Installation

### Step 1: Install AG-Grid Packages

Navigate to the Client directory and install AG-Grid:

```bash
cd "d:\Projects\School Managment System Offline First\Client"
npm install ag-grid-react ag-grid-community
```

### Step 2: Verify Installation

Check that the packages are installed:

```bash
npm list ag-grid-react ag-grid-community
```

You should see:
```
├── ag-grid-community@31.x.x
└── ag-grid-react@31.x.x
```

---

## 🚀 Starting the Application

### Terminal 1 - Backend:
```bash
cd "d:\Projects\School Managment System Offline First\backend"
npm run dev
```

Expected output:
```
Server running on port 3000
Database connected
```

### Terminal 2 - Frontend:
```bash
cd "d:\Projects\School Managment System Offline First\Client"
npm run dev
```

Expected output:
```
VITE ready in XXX ms
Local: http://localhost:5173
```

---

## 🧪 Testing Guide

### 1. Login
- Open: http://localhost:5173
- Email: `admin@school.af`
- Password: `admin123`
- Click: ننوتل

### 2. Navigate to Fee Management
**Option A**: From Sidebar
- Click: "عاید او فیسونه" in the sidebar

**Option B**: From Dashboard
- Click any revenue stat card on dashboard
- Should navigate to `/revenue`

### 3. Test Statistics Cards
You should see 4 cards showing THIS MONTH data:
- د دې میاشتې ټول فیس (Total Fee This Month)
- راټول شوی فیس (Collected This Month)
- پاتې فیس (Remaining This Month)
- ټول پیسې (Total Payments This Month)

### 4. Test Filters

#### Search:
1. Type student name in search box
2. Table should filter in real-time
3. Try receipt number (e.g., RCP-20240115-0001)

#### Academic Year:
1. Click year picker
2. Select different year
3. Table should reload with filtered data

#### Status:
1. Select "ورکړل شوی" (Paid)
2. Table shows only paid fees
3. Try "نیمګړی" (Partial) and "نه ورکړل شوی" (Unpaid)

#### Clear Filters:
1. Click "پاکول" button
2. All filters should reset

### 5. Test Export

#### Excel Export:
1. Apply some filters (optional)
2. Click "Excel" button
3. Should show loader
4. File should download: `fee-payments-[timestamp].xlsx`
5. Open file and verify data matches filters

#### PDF Export:
1. Apply some filters (optional)
2. Click "PDF" button
3. Should show loader
4. File should download: `fee-payments-[timestamp].pdf`
5. Open file and verify data matches filters

### 6. Test Add Fee - By ID

1. Click "نوی فیس" button
2. Modal should open
3. Select "د ID په واسطه" radio button
4. Enter a student ID (e.g., 1)
5. Student details should auto-fill:
   - Name
   - Father name
   - Class
   - Monthly fee
6. Fill remaining fields:
   - Enrollment type: ښوونځی
   - Month: 1403-01
   - Academic year: 1403
   - Paid amount: 1000
   - Date: (today's date)
   - Notes: (optional)
7. Click "خوندي کول"
8. Should show success message
9. Receipt should auto-print
10. Table should reload with new payment

### 7. Test Add Fee - Manual Selection

1. Click "نوی فیس" button
2. Select "په لاسي ډول" radio button
3. Select type: ښوونځی
4. Select class from dropdown
5. Click "زده کوونکي ښکاره کړئ"
6. List of students should appear
7. Select 2-3 students (checkbox)
8. Should show "غوره شوي: 2 / 4"
9. Try selecting 5th student - should show error
10. Fill remaining fields
11. Click "خوندي کول"
12. Should create payments for all selected students
13. Success message shows count

### 8. Test Edit Fee

1. Find a payment in table
2. Click edit icon (pencil)
3. Modal should open with current data
4. Change paid amount
5. Add/edit notes
6. Click "تازه کول"
7. Should show success message
8. Table should update
9. Status should update if amount changed

### 9. Test Print Receipt

1. Find a payment in table
2. Click print icon (printer)
3. Print dialog should open
4. Receipt should show:
   - Receipt number
   - Student name
   - Father name
   - Amount
   - Paid
   - Remaining
   - Month
   - Date
   - Collector name

### 10. Test Delete Fee

1. Find a payment in table
2. Click delete icon (trash)
3. Confirmation dialog should appear
4. Click OK
5. Should show success message
6. Payment should disappear from table
7. Statistics should update

### 11. Test Pagination

1. If you have more than 50 payments:
   - Should see pagination controls at bottom
   - Shows: "ټول: X | پاڼه: 1 / Y"
   - Click "بل" (Next) button
   - Should load next page
   - Click "مخکینی" (Previous) button
   - Should go back

2. If less than 50 payments:
   - All payments shown on one page
   - Pagination buttons disabled

### 12. Test AG-Grid Features

#### Sorting:
1. Click any column header
2. Should sort ascending
3. Click again for descending
4. Click again to remove sort

#### Resizing:
1. Hover over column border
2. Cursor should change
3. Drag to resize column
4. Column width should change

#### RTL:
1. All text should be right-aligned
2. Action buttons should be on left (pinned right)
3. Scrollbar should be on left

---

## 🐛 Troubleshooting

### Issue: AG-Grid not showing
**Solution**: 
```bash
cd Client
npm install ag-grid-react ag-grid-community
npm run dev
```

### Issue: Styles not applied
**Solution**: 
- Check that `fee-grid.css` exists in `Client/src/styles/`
- Check import in `revenue.jsx`
- Clear browser cache (Ctrl+Shift+R)

### Issue: API errors
**Solution**:
- Check backend is running on port 3000
- Check `.env` file has correct API URL
- Check browser console for errors
- Check backend logs

### Issue: Statistics not showing
**Solution**:
- Check that you have payments for current month
- Current month format: YYYY-MM (e.g., 2024-01)
- Add a test payment for current month

### Issue: Export not working
**Solution**:
- Check browser allows downloads
- Check backend has export utilities
- Check file permissions
- Try different browser

### Issue: Print not working
**Solution**:
- Check browser allows popups
- Check print dialog settings
- Try different browser
- Check PDF generation utility

---

## ✅ Expected Results

After all tests, you should have:
- ✅ Fee management page loads without errors
- ✅ Statistics show current month data
- ✅ Filters work correctly
- ✅ Search works with name and receipt number
- ✅ Export generates files with correct data
- ✅ Add fee works with both methods
- ✅ Multi-student selection works (max 4)
- ✅ Edit updates payment correctly
- ✅ Print generates receipt
- ✅ Delete removes payment
- ✅ Pagination works
- ✅ AG-Grid features work (sort, resize, RTL)
- ✅ Validation shows Pashto messages
- ✅ UI matches other sections

---

## 📊 Test Data

If you need test data, you can:

1. **Add students first** (if not already):
   - Go to زده کونکي (Students)
   - Add 5-10 students
   - Assign them to classes

2. **Add fee payments**:
   - Use the fee form
   - Add payments for different months
   - Add payments with different statuses
   - Add payments for multiple students

3. **Test with real scenarios**:
   - Full payment (paid = amount)
   - Partial payment (paid < amount)
   - Unpaid (paid = 0)
   - Family payment (multiple students)

---

## 🎯 Success Criteria

The fee management system is working correctly if:
- [x] All features work without errors
- [x] Data loads and displays correctly
- [x] Filters apply correctly
- [x] Export generates correct files
- [x] Forms validate properly
- [x] CRUD operations work
- [x] Pagination works
- [x] AG-Grid features work
- [x] UI is consistent with other sections
- [x] Pashto messages display correctly
- [x] RTL layout works properly

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs
3. Check network tab in DevTools
4. Verify all packages installed
5. Verify backend is running
6. Clear browser cache
7. Try different browser

---

**Installation Time**: 5 minutes
**Testing Time**: 15-20 minutes
**Total Time**: ~25 minutes

---

**Ready to Test!** 🚀

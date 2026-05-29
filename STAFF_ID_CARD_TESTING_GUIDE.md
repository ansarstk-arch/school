# Staff ID Card - Quick Testing Guide

## Prerequisites
1. Backend server running on `http://localhost:3000`
2. Frontend server running on `http://localhost:5173`
3. At least one staff member in the database

## Test Steps

### 1. Navigate to ID Cards Page
- Login to the system
- Go to ID Cards module (د پېژندنې کارتونه)
- You should see three tabs: زده کوونکي (Students), ښوونکي (Teachers), کارمندان (Staff)

### 2. Click on Staff Tab (کارمندان)
- Click the "کارمندان" button
- System should fetch and display staff members
- Each card should show:
  - Staff photo (if available)
  - Staff name
  - Father name
  - Role/Responsibility
  - Checkbox for selection
  - View button (eye icon)
  - Download button (download icon)

### 3. Test Preview Modal
- Click the "View" (eye icon) button on any staff card
- Modal should open with title "د کارت مخکتنه"
- Card preview should display:
  - Background image
  - School logo
  - Staff photo
  - Full name (نوم)
  - Father name (د پلار نوم)
  - ID number (ایډیکارډ نمبر)
  - Role (مسئولیت)
  - QR code at bottom
  - Card title: "کارمند پیژند کارډ"
- Close button should work

### 4. Test Single Card Download
- Click the "Download" button on any staff card
- PDF should download with filename: `ID_Card_[StaffName]_[Date].pdf`
- Open PDF and verify:
  - Card layout matches preview
  - All text is readable
  - QR code is present
  - Photo displays correctly (if available)
  - Pashto text renders correctly

### 5. Test Multiple Card Selection
- Select 2-3 staff cards using checkboxes
- "غوره شوي ډاونلوډ" button should show count
- Click "غوره شوي ډاونلوډ ([count])" button
- PDF should download with filename: `ID_Cards_[count]_[Date].pdf`
- Open PDF and verify:
  - All selected cards are present
  - Each card is on a separate page
  - All cards render correctly

### 6. Test Select All
- Click "ټول غوره کول" checkbox
- All visible staff cards should be selected
- Stats should show: "غوره شوي: [total count]"
- Click again to deselect all

### 7. Test Download All
- Click "ټول ډاونلوډ" button
- PDF should download with all staff cards on current page
- Verify all cards are included

### 8. Test Pagination (if more than 12 staff)
- If total staff > 12, pagination controls should appear
- Click "→" to go to next page
- Click "←" to go to previous page
- Page counter should update: "1 / 2", "2 / 2", etc.

### 9. Test Empty State
- If no staff members exist, should show:
  - "هیڅ کارت ونه موندل شو"
  - "کارمندان اضافه کړئ"

### 10. Test Loading States
- When fetching data, should show:
  - Spinner icon
  - "په بارولو کې..." message

### 11. Test Error Handling
- Stop backend server
- Try to download a card
- Should show error toast: "د کارت په ډاونلوډ کې تېروتنه"

### 12. Test with Missing Data
- Test with staff member that has:
  - No photo → Should not break layout
  - No father name → Should show "—"
  - No role → Should show "—"

## Expected Results

### ✅ Visual Consistency
- Staff cards look identical to Student/Teacher cards
- Same layout, colors, fonts, and spacing
- Same card dimensions and proportions

### ✅ Functional Consistency
- All features work the same as Student/Teacher cards
- Same modal behavior
- Same download functionality
- Same selection behavior

### ✅ Data Accuracy
- Staff ID displays correctly
- Staff name displays correctly
- Father name displays correctly
- Role displays correctly with "مسئولیت:" label
- QR code contains correct staff data

### ✅ PDF Quality
- PDF matches screen preview
- Text is sharp and readable
- Images are clear
- QR code is scannable
- Pashto text renders correctly

## Common Issues & Solutions

### Issue: Staff tab shows "په بارولو کې..." forever
**Solution:** Check backend is running and staff API endpoint is working

### Issue: Staff photo not displaying
**Solution:** 
- Check image path: `/uploads/staff/[filename]`
- Verify image file exists in backend uploads folder
- Check CORS settings

### Issue: QR code not generating
**Solution:** Check browser console for errors, ensure qrcode.react library is installed

### Issue: PDF download fails
**Solution:** 
- Check browser console for errors
- Verify jsPDF library is working
- Check image loading (CORS issues)

### Issue: Pashto text not rendering in PDF
**Solution:** 
- Verify Amiri fonts are loaded
- Check `/Amiri-Regular.ttf` and `/Amiri-Bold.ttf` exist in public folder

### Issue: Card layout different from Student/Teacher
**Solution:** This should not happen as all use same IdCardGenerator component

## Performance Testing

### Test with Large Dataset
1. Create 50+ staff members
2. Navigate to staff tab
3. Verify:
   - Page loads within 2 seconds
   - Pagination works smoothly
   - Download all doesn't freeze browser
   - Memory usage is reasonable

### Test Concurrent Downloads
1. Select multiple cards
2. Click download
3. While downloading, try to:
   - Select other cards
   - Navigate to other tabs
   - Open preview modal
4. Verify no conflicts or errors

## Browser Compatibility

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

## Mobile Responsiveness

Test on mobile/tablet:
- Cards should stack in single column
- Buttons should be touch-friendly
- Modal should be scrollable
- PDF download should work

---

## Quick Verification Checklist

- [ ] Staff tab displays
- [ ] Staff cards render correctly
- [ ] Preview modal works
- [ ] Single download works
- [ ] Multiple download works
- [ ] Download all works
- [ ] Selection works
- [ ] Pagination works
- [ ] QR code generates
- [ ] PDF matches preview
- [ ] Pashto text renders
- [ ] Photos display
- [ ] Error handling works
- [ ] Loading states work
- [ ] Empty state works

---

**Testing Status:** ⏳ Ready for Testing
**Estimated Testing Time:** 15-20 minutes

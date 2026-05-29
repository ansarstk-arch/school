# PDF Download Fix - Font Loading Issue

## Problem

**Error**: `File 'Amiri-Bold.ttf' not found in virtual file system`

**Symptoms**:
- Toast shows "PDF downloaded successfully"
- No PDF file actually downloads
- Console shows font loading error
- Affects all sections (teachers, applicants, classes)

## Root Cause

The font loading was using `new URL("/Amiri-Regular.ttf", import.meta.url).href` which doesn't work correctly in production builds. The fonts need to be loaded using absolute paths from the public folder.

## Solution Applied

### Files Modified

1. **Client/src/utils/pdfDownload.js** - New PDF system
2. **Client/src/utils/pdfExport.js** - Old PDF system (for backward compatibility)

### Changes Made

#### Before (Broken)
```javascript
const [regular, bold] = await Promise.all([
  toBase64(new URL("/Amiri-Regular.ttf", import.meta.url).href),
  toBase64(new URL("/Amiri-Bold.ttf", import.meta.url).href),
]);
```

#### After (Fixed)
```javascript
const [regular, bold] = await Promise.all([
  toBase64("/Amiri-Regular.ttf"),
  toBase64("/Amiri-Bold.ttf"),
]);
```

### Additional Improvements

1. **Better Error Handling**
   - Added try-catch blocks
   - Console logging for debugging
   - User-friendly error messages in Pashto

2. **VFS Initialization**
   - Ensures `pdfMake.vfs` exists before adding fonts
   - Prevents undefined errors

3. **Success Logging**
   - Console log when fonts load successfully
   - Helps with debugging

## How to Test

### 1. Clear Browser Cache
```
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)
```
Or hard refresh: `Ctrl + F5` / `Cmd + Shift + R`

### 2. Test Teachers PDF Export

1. Go to Teachers page
2. Apply some filters (optional)
3. Click "PDF ډاونلوډ" button
4. Check:
   - ✅ Button shows loading state
   - ✅ Console shows "PDF fonts loaded successfully"
   - ✅ PDF file downloads
   - ✅ PDF opens correctly
   - ✅ Pashto text displays properly
   - ✅ Headers appear on all pages

### 3. Test Applicants PDF Export

1. Go to Teachers page → Applicants tab
2. Click "PDF ډاونلوډ" button
3. Verify PDF downloads and displays correctly

### 4. Test Classes PDF Export

1. Go to Classes page
2. Click "PDF ډاونلوډ" button
3. Verify PDF downloads and displays correctly

## Verification Checklist

### Browser Console
- [ ] No font loading errors
- [ ] See "PDF fonts loaded successfully" message
- [ ] No other errors during PDF generation

### PDF File
- [ ] File downloads to Downloads folder
- [ ] File name format: `teachers_YYYY-MM-DD.pdf`
- [ ] File opens in PDF viewer
- [ ] School name appears on all pages
- [ ] Title appears on all pages
- [ ] Pashto text is readable (not boxes/squares)
- [ ] Table has proper borders and colors
- [ ] Page numbers in footer

### Functionality
- [ ] Loading button works (shows spinner)
- [ ] Success toast appears
- [ ] Filtered data exports correctly
- [ ] Filter info shows in PDF header
- [ ] Multiple exports work (fonts cached)

## Troubleshooting

### Still Getting Font Error

**Check 1**: Verify fonts exist
```bash
# In Client folder
ls public/Amiri*.ttf
```
Should show:
- `Amiri-Regular.ttf`
- `Amiri-Bold.ttf`

**Check 2**: Clear browser cache completely
- Close all browser tabs
- Clear cache and cookies
- Restart browser
- Try again

**Check 3**: Check browser console
```javascript
// In browser console, check if fonts are accessible
fetch('/Amiri-Regular.ttf').then(r => console.log('Font accessible:', r.ok))
```

### PDF Downloads But Text is Blank

**Issue**: Fonts loaded but not applied correctly

**Solution**: Check that `defaultStyle` includes font:
```javascript
defaultStyle: { font: "Amiri", fontSize: 9.5 }
```

### PDF Downloads But Text Shows Boxes

**Issue**: Font files are corrupted or wrong format

**Solution**: 
1. Re-download Amiri fonts from [Google Fonts](https://fonts.google.com/specimen/Amiri)
2. Replace files in `Client/public/`
3. Clear cache and try again

### Loading State Stuck

**Issue**: Error thrown but not caught

**Check**: Browser console for errors

**Solution**: Ensure try-catch blocks are in place:
```javascript
try {
  await exportTeachersPDF(teachers, filters, EDU_LABEL);
  toast.success("Success");
} catch (error) {
  toast.error(error.message);
} finally {
  setPdfLoading(false); // Always runs
}
```

## Technical Details

### Font Loading Process

1. **First PDF Export**:
   ```
   User clicks button
   → ensureFonts() called
   → Fetch font files from /public
   → Convert to base64
   → Add to pdfMake.vfs
   → Configure pdfMake.fonts
   → Set fontsReady = true
   → Generate PDF
   ```

2. **Subsequent Exports**:
   ```
   User clicks button
   → ensureFonts() called
   → Check fontsReady === true
   → Skip loading (use cached fonts)
   → Generate PDF immediately
   ```

### Font File Requirements

- **Format**: TrueType Font (.ttf)
- **Encoding**: Must support Arabic/Pashto characters
- **Size**: ~100-200KB each
- **Location**: Must be in `Client/public/` folder
- **Access**: Must be publicly accessible (not in src/)

### Why Public Folder?

Files in `public/` folder are:
- ✅ Served at root URL (`/filename.ttf`)
- ✅ Accessible via fetch API
- ✅ Not processed by Vite bundler
- ✅ Available in both dev and production

Files in `src/` folder are:
- ❌ Bundled by Vite
- ❌ URL changes in production
- ❌ May not be accessible via fetch

## Performance Notes

### First Export
- Takes 2-3 seconds (font loading + PDF generation)
- Fonts are ~200KB total
- One-time cost per session

### Subsequent Exports
- Takes <1 second (PDF generation only)
- Fonts cached in memory
- Much faster

### Optimization Tips

1. **Preload Fonts** (Optional)
   ```javascript
   // In App.jsx or main component
   useEffect(() => {
     // Preload fonts on app start
     import('@/utils/pdfDownload').then(module => {
       module.ensureFonts?.();
     });
   }, []);
   ```

2. **Reduce PDF Size**
   - Limit data to 1000 records
   - Use pagination for large datasets
   - Compress images if included

3. **User Feedback**
   - Show "Loading fonts..." on first export
   - Show "Generating PDF..." on subsequent exports

## Related Files

### Font Files
- `Client/public/Amiri-Regular.ttf` - Regular weight
- `Client/public/Amiri-Bold.ttf` - Bold weight

### PDF Utilities
- `Client/src/utils/pdfDownload.js` - New reusable system
- `Client/src/utils/pdfExport.js` - Old system (legacy)

### Components
- `Client/src/components/erp/PdfDownloadButton.jsx` - Button with loader
- `Client/src/routes/teachers.jsx` - Teachers page
- `Client/src/routes/classes.jsx` - Classes page

## Success Indicators

When working correctly, you should see:

### Console Output
```
PDF fonts loaded successfully
```

### User Experience
1. Click "PDF ډاونلوډ"
2. Button shows "ډاونلوډ کیږي..." with spinner
3. After 1-3 seconds, PDF downloads
4. Toast shows success message with count
5. PDF opens with proper Pashto text

### PDF Content
- School name in header (all pages)
- Title and count badge
- Filter information (if filters applied)
- Table with data
- Proper Pashto text rendering
- Page numbers in footer

## Conclusion

The font loading issue has been fixed by:
1. ✅ Using absolute paths instead of URL imports
2. ✅ Adding proper error handling
3. ✅ Initializing VFS correctly
4. ✅ Adding success logging

The PDF download should now work correctly in all sections (teachers, applicants, classes) with proper Pashto text rendering.

If issues persist after clearing cache, check:
1. Font files exist in `Client/public/`
2. Browser console for errors
3. Network tab shows fonts loading (200 status)
4. Try in incognito/private mode

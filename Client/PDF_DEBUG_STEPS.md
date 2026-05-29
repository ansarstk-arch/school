# PDF Download Debug Steps

## Issue
PDF shows success message but file doesn't download.

## Debug Steps

### Step 1: Check Browser Console

Open browser console (F12) and look for these messages:

**Expected Output:**
```
Starting PDF generation...
PDF fonts loaded successfully
Fonts loaded, generating PDF...
PDF definition created, generating file...
Downloading PDF: teachers_2024-01-15.pdf
PDF download triggered successfully
```

**If you see errors**, note them and check below.

### Step 2: Check Browser Download Settings

1. **Check if downloads are blocked:**
   - Chrome: Settings → Privacy and security → Site Settings → Additional permissions → Automatic downloads
   - Firefox: Settings → Privacy & Security → Permissions → Block pop-up windows
   - Edge: Settings → Cookies and site permissions → Pop-ups and redirects

2. **Check download location:**
   - Make sure you have a default download folder set
   - Check if the folder has write permissions

3. **Check if browser is asking for permission:**
   - Look for a download icon in the address bar
   - Look for a notification asking to allow downloads

### Step 3: Test with Simple PDF

Open browser console and paste this code:

```javascript
// Test 1: Check if pdfMake is loaded
console.log('pdfMake loaded:', typeof pdfMake !== 'undefined');

// Test 2: Try simple PDF without fonts
const testDoc = {
  content: [
    { text: 'Test PDF', fontSize: 20 },
    { text: 'If you see this, basic PDF works', fontSize: 12 }
  ]
};

pdfMake.createPdf(testDoc).download('test.pdf');
console.log('Simple PDF download triggered');
```

**Result:**
- ✅ If PDF downloads → Font loading is the issue
- ❌ If PDF doesn't download → Browser/pdfMake issue

### Step 4: Test Font Loading

```javascript
// Test font loading
fetch('/Amiri-Regular.ttf')
  .then(r => console.log('Amiri-Regular accessible:', r.ok, r.status))
  .catch(e => console.error('Font fetch error:', e));

fetch('/Amiri-Bold.ttf')
  .then(r => console.log('Amiri-Bold accessible:', r.ok, r.status))
  .catch(e => console.error('Font fetch error:', e));
```

**Expected:**
```
Amiri-Regular accessible: true 200
Amiri-Bold accessible: true 200
```

### Step 5: Check Network Tab

1. Open DevTools → Network tab
2. Click PDF download button
3. Look for:
   - `Amiri-Regular.ttf` - Should show 200 status
   - `Amiri-Bold.ttf` - Should show 200 status
   - Check file sizes (should be ~100-200KB each)

### Step 6: Try Alternative Download Method

If the automatic download doesn't work, try opening in new tab:

```javascript
// In browser console after clicking download
// This will open PDF in new tab instead of downloading
const pdfDoc = pdfMake.createPdf(docDef);
pdfDoc.open();
```

## Common Issues & Solutions

### Issue 1: Popup Blocker

**Symptoms:**
- No error in console
- No download happens
- No notification

**Solution:**
1. Check address bar for blocked popup icon
2. Allow popups for your site
3. Try again

### Issue 2: Download Permission

**Symptoms:**
- Browser asks for permission
- Download blocked notification

**Solution:**
1. Click "Allow" when browser asks
2. Or go to site settings and allow automatic downloads

### Issue 3: Font Loading Fails

**Symptoms:**
```
Font loading error for /Amiri-Regular.ttf: 404
```

**Solution:**
1. Verify fonts exist:
   ```bash
   ls Client/public/Amiri*.ttf
   ```
2. If missing, download from [Google Fonts](https://fonts.google.com/specimen/Amiri)
3. Place in `Client/public/` folder

### Issue 4: CORS Error

**Symptoms:**
```
Access to fetch at 'file:///...' from origin 'null' has been blocked by CORS
```

**Solution:**
- Make sure you're running dev server (`npm run dev`)
- Don't open HTML file directly in browser

### Issue 5: Memory Issue (Large Dataset)

**Symptoms:**
- Browser freezes
- "Out of memory" error
- Very slow generation

**Solution:**
Limit data size:
```javascript
// In your export handler
const dataToExport = allData.slice(0, 1000); // Limit to 1000 records
await downloadPDF({ data: dataToExport, ... });
```

## Manual Test Function

Add this to your component for testing:

```javascript
const testPDFDownload = async () => {
  try {
    console.log("=== PDF TEST START ===");
    
    // Test data
    const testData = [
      { id: 1, name: "احمد", phone: "0700111222" },
      { id: 2, name: "فاطمه", phone: "0700222333" },
    ];
    
    const testColumns = [
      { header: "#", field: "id", width: 30, align: "center" },
      { header: "نوم", field: "name", width: "*" },
      { header: "ټېلیفون", field: "phone", width: 100 },
    ];
    
    console.log("Test data:", testData);
    console.log("Test columns:", testColumns);
    
    await downloadPDF({
      data: testData,
      columns: testColumns,
      title: "ټیسټ لیست",
      filename: "test",
      orientation: "portrait",
    });
    
    console.log("=== PDF TEST END ===");
    
  } catch (error) {
    console.error("=== PDF TEST FAILED ===", error);
  }
};

// Add button to UI
<button onClick={testPDFDownload}>Test PDF</button>
```

## Browser-Specific Issues

### Chrome/Edge
- Check: `chrome://settings/content/automaticDownloads`
- Allow for your localhost

### Firefox
- Check: `about:preferences#privacy`
- Scroll to Permissions → Block pop-up windows
- Add exception for localhost

### Safari
- Preferences → Websites → Downloads
- Allow for localhost

## Check Browser Console for These Specific Errors

### Error 1: "File 'Amiri-Bold.ttf' not found"
**Cause:** Font not loaded into pdfMake.vfs
**Fix:** Already fixed in latest code, clear cache

### Error 2: "Cannot read property 'download' of undefined"
**Cause:** pdfMake not loaded
**Fix:** Check if pdfmake is in package.json and installed

### Error 3: "Failed to fetch"
**Cause:** Font files not accessible
**Fix:** Verify files in public folder

### Error 4: No error, just nothing happens
**Cause:** Download blocked by browser
**Fix:** Check browser download settings

## Final Checklist

Before reporting issue, verify:

- [ ] Browser console shows no errors
- [ ] Fonts load successfully (check Network tab)
- [ ] "PDF download triggered successfully" appears in console
- [ ] Browser downloads are not blocked
- [ ] Download folder has write permissions
- [ ] Tried in incognito/private mode
- [ ] Tried different browser
- [ ] Cleared browser cache completely
- [ ] Dev server is running (not opening file directly)

## Get More Info

Add this to see detailed PDF generation info:

```javascript
// In pdfDownload.js, add before pdfDoc.download():
console.log("PDF Document Definition:", JSON.stringify(docDef, null, 2));
console.log("PDF Fonts:", pdfMake.fonts);
console.log("PDF VFS Keys:", Object.keys(pdfMake.vfs || {}));
```

## Still Not Working?

If none of the above helps:

1. **Share console output** - Copy all console messages
2. **Share Network tab** - Screenshot of Network tab during download
3. **Share browser info** - Browser name and version
4. **Try this test:**
   ```javascript
   // Simplest possible PDF
   pdfMake.createPdf({ content: 'Test' }).download('test.pdf');
   ```
   If this works, the issue is with our PDF generation code.
   If this doesn't work, the issue is with browser/pdfMake setup.

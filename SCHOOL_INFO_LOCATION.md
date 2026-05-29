# School Information - Hardcoded Location

## Where to Update School Info

The school information is now **hardcoded** in the backend controller for easy access and modification.

### Location:
**File:** `backend/src/controllers/attendance/attendance.controller.js`

**Function:** `downloadAttendanceReport`

**Lines:** Around line 550-560

### Current Values:
```javascript
const schoolInfo = {
  name: 'د امیرالمومنین ښوونځی',
  nameDari: 'مکتب امیرالمومنین',
  address: 'جوزجان، افغانستان',
  phone: '0799999999',
  ministry: 'وزارت معارف',
  department: 'ریاست معارف جوزجان',
};
```

### How to Change:

1. Open: `backend/src/controllers/attendance/attendance.controller.js`

2. Find the `downloadAttendanceReport` function

3. Locate the `schoolInfo` object

4. Update the values:

```javascript
const schoolInfo = {
  name: 'YOUR_SCHOOL_NAME_PASHTO',           // د ښوونځي نوم
  nameDari: 'YOUR_SCHOOL_NAME_DARI',         // نام مکتب
  address: 'YOUR_ADDRESS',                    // آدرس
  phone: 'YOUR_PHONE',                        // تلفن
  ministry: 'وزارت معارف',                   // Ministry name
  department: 'ریاست معارف جوزجان',          // Department name
};
```

5. Save the file

6. Restart the backend server

### Where It's Used:

1. **Yearly Excel Report Header:**
   - Shows ministry name
   - Shows department name
   - Shows school name

2. **PDF Report Header:**
   - Shows school name

3. **All Generated Reports:**
   - School info appears in headers
   - Professional appearance

### Example Output:

**Yearly Report Header:**
```
┌─────────────────────────────────────┐
│ [LOGO]  وزارت معارف  [LOGO]         │
│      ریاست معارف جوزجان              │
│      د امیرالمومنین ښوونځی          │
└─────────────────────────────────────┘
```

**PDF Report Header:**
```
د حاضرۍ راپور
د امیرالمومنین ښوونځی
```

### Benefits of Hardcoding:

✅ **Easy to find** - All in one place
✅ **No .env needed** - No environment variables
✅ **Quick updates** - Just edit and restart
✅ **No configuration** - Works out of the box
✅ **Version controlled** - Changes tracked in git

### Note:

If you want to make school info editable from the frontend (admin panel), you would need to:
1. Create a settings table in database
2. Add settings API endpoints
3. Create settings page in frontend
4. Fetch school info from database instead of hardcoding

But for now, hardcoding is the simplest and most direct approach!

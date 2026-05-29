# 🏫 HOW TO UPDATE SCHOOL INFORMATION

## 📍 **LOCATIONS WHERE SCHOOL INFO IS USED**

### **1. Salary Slip PDF** ⭐ MAIN LOCATION

**File:** `backend/src/utils/salarySlipSimple.util.js`

**Lines:** 4-8

```javascript
const SCHOOL_INFO = {
  name: 'د امیرالمومنین ښوونځی',
  address: 'جوزجان، افغانستان',
  phone: '0799999999',
};
```

**What appears in PDF:**
- School name (header)
- School address (header)
- School phone (header and footer)

---

### **2. Attendance Reports**

**File:** `backend/src/controllers/attendance/attendance.controller.js`

**Function:** `downloadAttendanceReport`

**Lines:** ~550-560

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

**What appears in reports:**
- Ministry name
- Department name
- School name (Pashto & Dari)
- Address
- Phone

---

## 🔧 **STEP-BY-STEP UPDATE GUIDE**

### **Step 1: Update Salary Slip Info**

1. Open file: `backend/src/utils/salarySlipSimple.util.js`

2. Find lines 4-8:
```javascript
const SCHOOL_INFO = {
  name: 'د امیرالمومنین ښوونځی',
  address: 'جوزجان، افغانستان',
  phone: '0799999999',
};
```

3. Replace with your school info:
```javascript
const SCHOOL_INFO = {
  name: 'YOUR_SCHOOL_NAME_IN_PASHTO',
  address: 'YOUR_CITY, YOUR_PROVINCE',
  phone: 'YOUR_PHONE_NUMBER',
};
```

4. Save the file

---

### **Step 2: Update Attendance Report Info**

1. Open file: `backend/src/controllers/attendance/attendance.controller.js`

2. Find the `downloadAttendanceReport` function (around line 550)

3. Find the `schoolInfo` object:
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

4. Replace with your info:
```javascript
const schoolInfo = {
  name: 'YOUR_SCHOOL_NAME_PASHTO',
  nameDari: 'YOUR_SCHOOL_NAME_DARI',
  address: 'YOUR_ADDRESS',
  phone: 'YOUR_PHONE',
  ministry: 'وزارت معارف',
  department: 'YOUR_DEPARTMENT',
};
```

5. Save the file

---

### **Step 3: Restart Backend Server**

```bash
cd backend
npm run dev
```

Or if using PM2:
```bash
pm2 restart backend
```

---

## 📋 **QUICK COPY-PASTE TEMPLATE**

### **For Salary Slips:**
```javascript
const SCHOOL_INFO = {
  name: 'د [ښوونځي نوم] ښوونځی',
  address: '[ښار]، [ولایت]',
  phone: '07XXXXXXXXX',
};
```

### **For Attendance Reports:**
```javascript
const schoolInfo = {
  name: 'د [ښوونځي نوم] ښوونځی',
  nameDari: 'مکتب [نام مکتب]',
  address: '[ښار]، [ولایت]',
  phone: '07XXXXXXXXX',
  ministry: 'وزارت معارف',
  department: 'ریاست معارف [ولایت]',
};
```

---

## 🎯 **EXAMPLES**

### **Example 1: Kabul School**

**Salary Slip:**
```javascript
const SCHOOL_INFO = {
  name: 'د احمد شاه بابا ښوونځی',
  address: 'کابل، افغانستان',
  phone: '0799123456',
};
```

**Attendance Report:**
```javascript
const schoolInfo = {
  name: 'د احمد شاه بابا ښوونځی',
  nameDari: 'مکتب احمد شاه بابا',
  address: 'کابل، افغانستان',
  phone: '0799123456',
  ministry: 'وزارت معارف',
  department: 'ریاست معارف کابل',
};
```

---

### **Example 2: Herat School**

**Salary Slip:**
```javascript
const SCHOOL_INFO = {
  name: 'د خواجه عبدالله انصاري ښوونځی',
  address: 'هرات، افغانستان',
  phone: '0799654321',
};
```

**Attendance Report:**
```javascript
const schoolInfo = {
  name: 'د خواجه عبدالله انصاري ښوونځی',
  nameDari: 'مکتب خواجه عبدالله انصاری',
  address: 'هرات، افغانستان',
  phone: '0799654321',
  ministry: 'وزارت معارف',
  department: 'ریاست معارف هرات',
};
```

---

## ✅ **VERIFICATION CHECKLIST**

After updating, verify:

- [ ] Salary slip PDF shows correct school name
- [ ] Salary slip PDF shows correct address
- [ ] Salary slip PDF shows correct phone
- [ ] Attendance reports show correct info
- [ ] All Pashto text displays correctly
- [ ] Phone number format is correct
- [ ] No typos in school name

---

## 🚨 **COMMON MISTAKES TO AVOID**

1. **Don't forget the comma** after each line
2. **Keep the quotes** around text values
3. **Use Pashto/Dari script** for names
4. **Restart server** after changes
5. **Test immediately** after updating

---

## 📞 **PHONE NUMBER FORMATS**

**Correct formats:**
- `0799999999` (10 digits)
- `+93799999999` (with country code)
- `079-999-9999` (with dashes)

**Incorrect formats:**
- `799999999` (missing leading 0)
- `07999999999` (too many digits)

---

## 🎨 **PASHTO TEXT TIPS**

### **Common School Name Patterns:**

**Pattern 1:** د [نوم] ښوونځی
- Example: د امیرالمومنین ښوونځی

**Pattern 2:** د [نوم] لیسه
- Example: د احمد شاه بابا لیسه

**Pattern 3:** د [نوم] ښوونځی او روزنځی
- Example: د خواجه عبدالله انصاري ښوونځی او روزنځی

### **Province Names in Pashto:**
- کابل (Kabul)
- هرات (Herat)
- قندهار (Kandahar)
- بلخ (Balkh)
- جوزجان (Jowzjan)
- ننګرهار (Nangarhar)
- بدخشان (Badakhshan)

---

## 💡 **PRO TIPS**

1. **Keep a backup** of original values before changing
2. **Test in development** before production
3. **Use consistent formatting** across all locations
4. **Document your changes** in a separate file
5. **Update all locations** at the same time

---

## 📝 **CHANGE LOG TEMPLATE**

Keep track of your changes:

```
Date: 2025-01-20
Changed by: [Your Name]
Old School Name: د امیرالمومنین ښوونځی
New School Name: [New Name]
Old Phone: 0799999999
New Phone: [New Phone]
Reason: [Why changed]
```

---

## 🔄 **FUTURE IMPROVEMENTS**

If you want to make school info editable from admin panel:

1. Create `school_settings` table in database
2. Add settings API endpoints
3. Create settings page in frontend
4. Fetch school info from database
5. Update PDF generators to use database values

**For now, hardcoding is the simplest approach!**

---

## ✨ **SUMMARY**

**Two files to update:**
1. `backend/src/utils/salarySlipSimple.util.js` (Salary slips)
2. `backend/src/controllers/attendance/attendance.controller.js` (Attendance reports)

**Three values to change:**
1. School name
2. Address
3. Phone number

**One step after updating:**
1. Restart backend server

**That's it! Simple and straightforward! 🎉**

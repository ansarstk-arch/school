# Marks List - Quick Reference Guide

## 🎯 Feature Overview

A comprehensive marks management page with table view, filters, and CRUD operations.

---

## 📍 Navigation

**Sidebar Path:**
```
نمرې (Marks)
  └── د نمرو لیست (Marks List)
```

**URL:** `/marks/list`

---

## 🎨 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  د نمرو لیست                                    [نمرې Badge] │
│  د زده کوونکو نمرې کتل، سمول او ړنګول                      │
├─────────────────────────────────────────────────────────────┤
│  FILTERS:                                                   │
│  [تعلیمي کال] [امتحان] [اداره] [ټولګی] [حالت] [لټون]      │
│  [فلټر کول] [پاکول]                                        │
├─────────────────────────────────────────────────────────────┤
│  AG GRID TABLE:                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ زده کوونکی │ د پلار نوم │ رول │ امتحان │ ... │ Actions││
│  ├───────────────────────────────────────────────────────┤  │
│  │ احمد       │ محمد      │ 101 │ نیمایی  │ ... │ 👁️✏️🗑️ ││
│  │ علی        │ حسن       │ 102 │ نیمایی  │ ... │ 👁️✏️🗑️ ││
│  └───────────────────────────────────────────────────────┘  │
│  [< Previous] Page 1 of 10 [Next >]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Table Columns

| Column | Description | Width |
|--------|-------------|-------|
| زده کوونکی | Student Name | Flex 1.2 |
| د پلار نوم | Father Name | Flex 1 |
| رول نمبر | Roll Number | 90px |
| امتحان | Exam Title | Flex 1 |
| ټولګی | Class Name | 90px |
| مضمون | Subject Name | 110px |
| اداره | Institution Type (Badge) | 85px |
| ټولټال | Total Marks | 80px |
| ترلاسه | Obtained Marks | 80px |
| حالت | Status (Badge) | 90px |
| Actions | View/Edit/Delete | 120px |

---

## 🎛️ Filters

### Available Filters:
1. **تعلیمي کال** (Academic Year)
   - Type: Shamsi Year Picker
   - Default: Current year

2. **امتحان** (Exam)
   - Type: Dropdown
   - Options: All exams for selected year

3. **اداره** (Institution Type)
   - Type: Dropdown
   - Options: School, Center, Madrasa

4. **ټولګی** (Class)
   - Type: Dropdown
   - Options: All classes for selected type

5. **حالت** (Status)
   - Type: Dropdown
   - Options: Pass, Fail, Absent

6. **لټون** (Search)
   - Type: Text input
   - Searches: Student name, exam title, subject name

---

## 👁️ View Modal

### Layout:
```
┌─────────────────────────────────────┐
│  د نمرو معلومات                     │
├─────────────────────────────────────┤
│  زده کوونکی: احمد    د پلار نوم: محمد│
│  رول نمبر: 101       تعلیمي کال: 1403│
│  ─────────────────────────────────  │
│  امتحان: نیمایی      نېټه: 1403/06/15│
│  ټولګی: دوولسم       مضمون: ریاضی    │
│  اداره: [ښوونځی]    حالت: [بریالی]  │
│  ─────────────────────────────────  │
│  ┌─────────────┬─────────────┐      │
│  │ ټولټال نمرې │ ترلاسه شوې  │      │
│  │     100     │     85      │      │
│  └─────────────┴─────────────┘      │
│  یادښت: ښه کار کړی                 │
│  ─────────────────────────────────  │
│  جوړ شوی: 2024-01-15 10:30 AM      │
│  تازه شوی: 2024-01-15 11:45 AM     │
├─────────────────────────────────────┤
│                        [بندول]      │
└─────────────────────────────────────┘
```

---

## ✏️ Edit Modal

### Layout:
```
┌─────────────────────────────────────┐
│  نمرې سمول                          │
├─────────────────────────────────────┤
│  حالت:                              │
│  [بریالی ▼]                         │
│                                     │
│  ترلاسه شوې نمرې:                   │
│  [85]                               │
│  ټولټال: 100                        │
│                                     │
│  یادښت (اختیاري):                   │
│  [ښه کار کړی]                      │
│                                     │
├─────────────────────────────────────┤
│              [لغوه] [خوندي کړئ]     │
└─────────────────────────────────────┘
```

### Validation:
- ✅ Marks required for Pass/Fail
- ✅ Marks must be ≥ 0
- ✅ Marks must be ≤ Total Marks
- ✅ Marks disabled for Absent

---

## 🗑️ Delete Confirmation

### Layout:
```
┌─────────────────────────────────────┐
│  ⚠️ تایید                           │
├─────────────────────────────────────┤
│  آیا تاسو ډاډه یاست چې غواړئ       │
│  نمرې ړنګ کړئ؟                     │
│                                     │
│  دا عمل بیرته نشي راګرځیدلی.       │
├─────────────────────────────────────┤
│              [لغوه] [ړنګول]         │
└─────────────────────────────────────┘
```

---

## 🎨 Badge Colors

### Institution Type:
- **ښوونځی** (School): Blue
- **مرکز** (Center): Gray
- **مدرسه** (Madrasa): Yellow

### Status:
- **بریالی** (Pass): Green
- **ناکام** (Fail): Red
- **غیرحاضر** (Absent): Gray

---

## 🔔 Toast Notifications

### Success Messages:
- ✅ "نمرې بریالي تازه شوې" (Marks updated successfully)
- ✅ "نمرې بریالي ړنګ شوې" (Marks deleted successfully)

### Error Messages:
- ❌ "د نمرو په ترلاسه کولو کې ستونزه" (Error fetching marks)
- ❌ "د تازه کولو کې ستونزه" (Error updating marks)
- ❌ "د ړنګولو کې ستونزه" (Error deleting marks)

### Validation Messages:
- ⚠️ "نمرې اړینې دي" (Marks required)
- ⚠️ "نمرې باید مثبت عدد وي" (Marks must be positive)
- ⚠️ "نمرې د X څخه زیاتې نشي" (Marks cannot exceed X)

---

## 🔄 User Workflows

### 1. View Marks:
```
1. Open /marks/list
2. Apply filters (optional)
3. Click 👁️ icon on any row
4. View complete details
5. Click "بندول" to close
```

### 2. Edit Marks:
```
1. Open /marks/list
2. Find the mark to edit
3. Click ✏️ icon
4. Modify marks/status/remarks
5. Click "خوندي کړئ"
6. See success toast
```

### 3. Delete Marks:
```
1. Open /marks/list
2. Find the mark to delete
3. Click 🗑️ icon
4. Confirm deletion
5. See success toast
```

### 4. Filter Marks:
```
1. Open /marks/list
2. Select filters (year, exam, class, etc.)
3. Click "فلټر کول"
4. View filtered results
5. Click "پاکول" to reset
```

---

## 📊 Pagination

- **Items per page:** 12
- **Server-side:** Yes
- **Controls:** Previous/Next buttons + Page info
- **Display:** "Page X of Y"

---

## 🎯 Key Features

✅ AG Grid table with sorting  
✅ Advanced filters  
✅ Server-side pagination  
✅ View modal with complete details  
✅ Edit modal with validation  
✅ Delete confirmation  
✅ RTL support  
✅ Responsive design  
✅ Toast notifications  
✅ Loading states  
✅ Empty states  
✅ Consistent UI/UX  

---

## 🔗 Related Pages

- **د نمرو داخلول** (`/marks/entry`) - Bulk marks entry
- **د مضامینو تنظیم** (`/marks/config`) - Subject configuration
- **د پایلو چمتووالی** (`/marks/result-prep`) - Result preparation

---

**Quick Tip:** Use this page to manage individual marks after bulk entry!

# Marks Subject Management - Visual Workflow

## 📋 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKS SUBJECT MANAGEMENT                      │
│                   د امتحان مضامین تنظیم                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: SETUP FORM (Top of Page)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Year: 1403 ▼] [Exam: Mid-Term ▼] [Type: School ▼]            │
│  [Class: Grade 10-A ▼] [Show Subjects Button]                   │
│                                                                  │
│  Selected: Mid-Term Exam · Start: 1403/06/15 · End: 1403/06/25 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Click "Show Subjects"]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  MODAL: Subject Configuration                                    │
│  د مضامینو تنظیم - Mid-Term - Grade 10-A                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │ Subject      │ Total Marks  │ Passing Marks│                │
│  ├──────────────┼──────────────┼──────────────┤                │
│  │ Mathematics  │ [100]        │ [40]         │ ← Editable     │
│  │ Physics      │ [100]        │ [40]         │ ← Editable     │
│  │ Chemistry    │ [100]        │ [40]         │ ← Editable     │
│  │ Biology      │ [100]        │ [40]         │ ← Editable     │
│  │ English      │ [100]        │ [40]         │ ← Editable     │
│  └──────────────┴──────────────┴──────────────┘                │
│                                                                  │
│  [Cancel]                              [💾 Save All]            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        [Save Success]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: FILTER BAR                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Year ▼] [Exam ▼] [Type ▼] [Class ▼] [From Date] [To Date]   │
│  [Search: ___________] [Apply] [Clear]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: CONFIGURATIONS TABLE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Exam      │ Start  │ Class │ Subject │ Type │ Total │ Pass │ Actions │
│  ──────────┼────────┼───────┼─────────┼──────┼───────┼──────┼─────────│
│  Mid-Term  │ 06/15  │ 10-A  │ Math    │ Sch  │ 100   │ 40   │ 👁 ✏ 🗑 │
│  Mid-Term  │ 06/15  │ 10-A  │ Physics │ Sch  │ 100   │ 40   │ 👁 ✏ 🗑 │
│  Mid-Term  │ 06/15  │ 10-A  │ Chem    │ Sch  │ 100   │ 40   │ 👁 ✏ 🗑 │
│  Final     │ 10/20  │ 10-A  │ Math    │ Sch  │ 100   │ 40   │ 👁 ✏ 🗑 │
│                                                                  │
│  Showing 1-4 of 24 | [< 1 2 3 >]                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Action Buttons Explained

### 1. View Button (👁 کتل)
```
Click → Opens Modal
         ↓
┌─────────────────────────────────┐
│  Configuration Details           │
│  د تنظیم معلومات                │
├─────────────────────────────────┤
│                                  │
│  Exam: Mid-Term Exam            │
│  Academic Year: 1403            │
│  Class: Grade 10-A              │
│  Institution: School            │
│  Subject: Mathematics           │
│  Exam Start: 1403/06/15         │
│  Total Marks: 100               │
│  Passing Marks: 40              │
│                                  │
│  [Close]                         │
└─────────────────────────────────┘
```

### 2. Edit Button (✏ سمول)
```
Click → Opens Modal
         ↓
┌─────────────────────────────────┐
│  Edit Configuration              │
│  تنظیم سمول                     │
├─────────────────────────────────┤
│                                  │
│  Total Marks:    [100]          │
│  Passing Marks:  [40]           │
│                                  │
│  [Cancel]  [Save]               │
└─────────────────────────────────┘
         ↓
    [Save Success]
         ↓
    Table Refreshes
```

### 3. Delete Button (🗑 ړنګول)
```
Click → Opens Confirmation
         ↓
┌─────────────────────────────────┐
│  ⚠️ Confirm Delete               │
│                                  │
│  Are you sure you want to       │
│  delete this configuration?     │
│                                  │
│  [Cancel]  [Delete]             │
└─────────────────────────────────┘
         ↓
    [Delete Success]
         ↓
    Table Refreshes
```

## 📊 Data Flow Diagram

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │ 1. Selects Year
       ↓
┌──────────────┐
│  Frontend    │──→ GET /exams?academicYear=1403
└──────┬───────┘
       │ 2. Selects Exam & Type
       ↓
┌──────────────┐
│  Frontend    │──→ GET /classes?type=School&academicYear=1403
└──────┬───────┘
       │ 3. Selects Class
       │ 4. Clicks "Show Subjects"
       ↓
┌──────────────┐
│  Frontend    │──→ GET /exam-subject-config/subjects-for-class
└──────┬───────┘      ?examId=1&classId=5&institutionType=School
       │
       ↓
┌──────────────┐
│  Backend     │──→ Returns subjects with existing configs
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Modal Opens │──→ Shows subjects in editable table
└──────┬───────┘
       │ 5. User enters marks
       │ 6. Clicks "Save All"
       ↓
┌──────────────┐
│  Frontend    │──→ POST /exam-subject-config/bulk-upsert
└──────┬───────┘      { examId, classId, institutionType, configs[] }
       │
       ↓
┌──────────────┐
│  Backend     │──→ Validates & saves configurations
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Success     │──→ Modal closes, table refreshes
└──────────────┘
```

## 🎯 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Component State                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Setup Form State:                                           │
│  ├─ academicYear: "1403"                                    │
│  ├─ setup: { examId, institutionType, classId }            │
│  └─ subjectRows: [{ subjectId, totalMarks, passingMarks }] │
│                                                              │
│  List State:                                                 │
│  ├─ listFilters: { academicYear, examId, ... }             │
│  ├─ configs: [...]                                          │
│  ├─ page: 1                                                 │
│  └─ pagination: { total, totalPages, ... }                 │
│                                                              │
│  Modal States:                                               │
│  ├─ manageOpen: boolean                                     │
│  ├─ viewOpen: boolean                                       │
│  ├─ editOpen: boolean                                       │
│  └─ deleteOpen: boolean                                     │
│                                                              │
│  Loading States:                                             │
│  ├─ loading: boolean                                        │
│  ├─ manageLoading: boolean                                  │
│  ├─ saving: boolean                                         │
│  ├─ editLoading: boolean                                    │
│  └─ deleteLoading: boolean                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Lookup Hooks Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  useMarksLookups Hook (Setup Form)                          │
├─────────────────────────────────────────────────────────────┤
│  Input: { academicYear, examId, institutionType }          │
│  Output: { exams, classes, selectedExam }                  │
│                                                              │
│  Flow:                                                       │
│  1. Fetch exams for academicYear                           │
│  2. Fetch classes for institutionType & academicYear       │
│  3. Filter classes by exam's assignedClasses               │
│  4. Return filtered data                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  useMarksLookups Hook (Filter Bar)                          │
├─────────────────────────────────────────────────────────────┤
│  Input: { academicYear, examId, institutionType }          │
│  Output: { exams, classes }                                │
│                                                              │
│  Flow:                                                       │
│  1. Fetch exams for filter academicYear                    │
│  2. Fetch classes for filter institutionType               │
│  3. Return data for filter dropdowns                       │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Component Tree

```
MarksExamConfigPage
│
├─ PageHeader
│  ├─ Title: "د امتحان مضامین تنظیم"
│  ├─ Subtitle: "تعلیمي کال 1403 — ..."
│  └─ Badge: "تنظیم"
│
├─ Setup Form Section (Card)
│  ├─ Label: "۱ — امتحان، ادارې ډول او ټولګی وټاکئ"
│  ├─ Grid Layout (5 columns)
│  │  ├─ Year Selector
│  │  ├─ Exam Dropdown
│  │  ├─ Type Dropdown
│  │  ├─ Class Dropdown
│  │  └─ Show Subjects Button
│  └─ Exam Info Display
│
├─ FilterBar
│  ├─ Year Filter
│  ├─ Exam Filter
│  ├─ Type Filter
│  ├─ Class Filter
│  ├─ Date Range Filters
│  ├─ Search Input
│  ├─ Apply Button
│  └─ Clear Button
│
├─ AgGridTable (Configs List)
│  ├─ Columns: Exam, Start, Class, Subject, Type, Total, Pass, Actions
│  ├─ Pagination Controls
│  └─ Loading Indicator
│
├─ ErpModal (Manage Subjects)
│  ├─ Title: "د مضامینو تنظیم - {exam} - {class}"
│  ├─ AgGridTable (Inline Edit)
│  │  ├─ Subject Column (read-only)
│  │  ├─ Total Marks Column (editable)
│  │  └─ Passing Marks Column (editable)
│  └─ Footer: Cancel, Save All
│
├─ ErpModal (View Details)
│  ├─ Title: "د تنظیم معلومات"
│  ├─ Grid Layout (2 columns)
│  │  ├─ Exam, Year, Class, Type
│  │  └─ Subject, Start Date, Total, Passing
│  └─ Footer: Close
│
├─ ErpModal (Edit Marks)
│  ├─ Title: "تنظیم سمول"
│  ├─ Form Fields
│  │  ├─ Total Marks Input
│  │  └─ Passing Marks Input
│  └─ Footer: Cancel, Save
│
└─ ConfirmDelete Dialog
   ├─ Warning Message
   └─ Footer: Cancel, Delete
```

## 📱 Responsive Behavior

```
Desktop (lg+):
┌─────────────────────────────────────────────────────────┐
│ [Year] [Exam] [Type] [Class] [Button]                   │
└─────────────────────────────────────────────────────────┘

Tablet (sm-md):
┌─────────────────────────────────────────────────────────┐
│ [Year]        [Exam]                                     │
│ [Type]        [Class]        [Button]                    │
└─────────────────────────────────────────────────────────┘

Mobile (xs):
┌─────────────────────────────────────────────────────────┐
│ [Year]                                                   │
│ [Exam]                                                   │
│ [Type]                                                   │
│ [Class]                                                  │
│ [Button]                                                 │
└─────────────────────────────────────────────────────────┘
```

## ✅ Validation Flow

```
User Input
    ↓
┌─────────────────┐
│ Validate Total  │ → Must be > 0
└────────┬────────┘
         ↓
┌─────────────────┐
│ Validate Pass   │ → Must be >= 0
└────────┬────────┘
         ↓
┌─────────────────┐
│ Compare Values  │ → Pass <= Total
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┴────┐
    │   Yes   │   No
    ↓         ↓
  Save    Show Error
```

## 🚀 Performance Optimizations

1. **Separate Lookup Hooks**
   - Setup form and filter bar use independent hooks
   - Prevents unnecessary re-fetches

2. **Server-Side Pagination**
   - Only loads 12 records at a time
   - Reduces initial load time

3. **Server-Side Filtering**
   - Filters applied in backend
   - Reduces data transfer

4. **Lazy Modal Loading**
   - Subjects loaded only when modal opens
   - Reduces initial page load

5. **Memoized Column Definitions**
   - useMemo prevents re-renders
   - Improves table performance

## 🎓 Key Learnings

1. **Modal-based approach** keeps UI clean and focused
2. **Separate state** for setup and filtering prevents conflicts
3. **Inline editing** in AG Grid provides smooth UX
4. **Bulk operations** reduce API calls
5. **Comprehensive validation** prevents data errors

---

**This workflow ensures a smooth, intuitive user experience for managing exam subject configurations!** ✨

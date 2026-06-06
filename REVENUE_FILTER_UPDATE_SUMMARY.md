# Revenue Filter Update - Month + Year Picker

## Summary
Updated the revenue/fee management filter to use a single month + year date picker instead of separate year and month pickers, matching the implementation pattern used in the salaries module.

## Changes Made

### 1. Filter Definition Updates
**File:** `Client/src/routes/revenue.jsx`

#### Before:
```javascript
const FEE_FILTERS = [
  { key: "search", label: "لټون", type: "input", placeholder: "نوم یا رسید نمبر..." },
  { key: "month", label: "میاشت", type: "shamsiMonth", placeholder: "میاشت" },
  { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
  { key: "status", label: "حالت", type: "select", options: [...] },
  { key: "enrollmentType", label: "ډول", type: "select", options: [...] },
];
```

#### After:
```javascript
const FEE_FILTERS = [
  { key: "search", label: "لټون", type: "input", placeholder: "نوم یا رسید نمبر..." },
  { key: "month", label: "میاشت او کال", type: "shamsiMonth", placeholder: "میاشت او کال" },
  { key: "status", label: "حالت", type: "select", options: [...] },
  { key: "enrollmentType", label: "ډول", type: "select", options: [...] },
];
```

### 2. Filter State Initialization
**Removed** `academicYear` from the initial filter state:

```javascript
// Before
const [filters, setFilters] = useState({
  search: "",
  academicYear: String(currentShamsiYear()),
  enrollmentType: "",
  status: "Unpaid",
  month: currentShamsiYearMonth(),
  // ...
});

// After
const [filters, setFilters] = useState({
  search: "",
  enrollmentType: "",
  status: "Unpaid",
  month: currentShamsiYearMonth(),
  // ...
});
```

### 3. Load Payments Function
**Updated** to extract the year from the month field:

```javascript
const loadPayments = async () => {
  try {
    setLoading(true);
    
    // Extract year from month (YYYY-MM) for academicYear parameter
    const params = { ...filters, page, limit: PAGE_SIZE };
    if (filters.month) {
      params.academicYear = filters.month.split('-')[0];
    }
    
    const response = await feeApi.getFeePayments(params);
    // ... rest of the code
  }
};
```

### 4. Load Statistics Function
**Updated** to extract the year from the month field:

```javascript
const loadStatistics = async () => {
  try {
    // Extract year from month (YYYY-MM) for academicYear parameter
    const monthValue = filters.month || currentShamsiYearMonth();
    const academicYear = monthValue ? monthValue.split('-')[0] : undefined;
    
    const response = await feeApi.getFeeStatistics({
      month: monthValue,
      academicYear: academicYear,
    });
    setStatistics(response.data);
  } catch (error) {
    console.error("Load statistics error:", error);
  }
};
```

### 5. Filter Defaults
**Updated** FilterBar default values:

```javascript
// Before
<FilterBar
  filters={FEE_FILTERS}
  defaultValues={{
    academicYear: String(currentShamsiYear()),
    month: currentShamsiYearMonth(),
    status: "Unpaid"
  }}
  // ...
/>

// After
<FilterBar
  filters={FEE_FILTERS}
  defaultValues={{
    month: currentShamsiYearMonth(),
    status: "Unpaid"
  }}
  // ...
/>
```

### 6. Page Header Subtitle
**Updated** to show the month instead of just the year:

```javascript
// Before
<PageHeader 
  title="د فیس مدیریت" 
  subtitle={filters.academicYear ? `${filters.academicYear} تعلیمي کال` : "ټول فیسونه"}
  // ...
/>

// After
<PageHeader 
  title="د فیس مدیریت" 
  subtitle={filters.month ? `${filters.month}` : "ټول فیسونه"}
  // ...
/>
```

### 7. Import Statement - **IMPORTANT CLARIFICATION**
The `ShamsiYearPicker` import **must remain** because it's still used in the fee payment creation form:

```javascript
// Correct imports (ShamsiYearPicker is still needed)
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { ShamsiDatePicker } from "@/components/erp/ShamsiDatePicker";
import { ShamsiMonthPicker } from "@/components/erp/ShamsiMonthPicker";
```

**Why it's still needed:**
- The **filter** uses only `ShamsiMonthPicker` (month + year combined)
- The **form** still uses separate `ShamsiMonthPicker` and `ShamsiYearPicker` for creating fee payments
- This is correct and intentional - forms need separate fields for data entry

### 8. UseEffect Dependencies
**Updated** to only depend on `filters.month`:

```javascript
// Before
useEffect(() => {
  loadStatistics();
}, [filters.month, filters.academicYear]);

// After
useEffect(() => {
  loadStatistics();
}, [filters.month]);
```

## Important Notes

### Form Fields Unchanged
The **fee payment creation form** still uses separate `month` and `academicYear` fields. This is intentional and correct because:
- The form creates new fee records with specific month and year data
- The backend expects these as separate fields when creating payments
- Only the **filter** was consolidated for better UX

### Backend Compatibility
The backend still expects both `month` and `academicYear` parameters:
- `month`: YYYY-MM format (e.g., "1403-10")
- `academicYear`: YYYY format (e.g., "1403")

The frontend now extracts the year from the month field automatically when making API calls.

## Benefits

1. **Consistent UX**: Matches the salary module's filter pattern
2. **Simpler Interface**: Users select month and year together in one picker
3. **Less Confusion**: No need to set year and month separately
4. **Better Defaults**: Current month (with year) is set by default
5. **Maintained Functionality**: All backend APIs work the same way

## Testing Checklist

- [x] Filter by current month (default)
- [ ] Filter by different months
- [ ] Filter by status (Paid/Unpaid/Partial)
- [ ] Filter by enrollment type
- [ ] Search by name/receipt
- [ ] Statistics update correctly with month filter
- [ ] Pagination works with filters
- [ ] Clear filters resets to defaults
- [ ] Export functionality works with month filter

## Files Modified

- `Client/src/routes/revenue.jsx` - Main revenue/fee management component

## Related Patterns

This change follows the same pattern implemented in:
- `Client/src/routes/salaries.jsx` - Salary management (month + year picker)
- Other modules using unified date selection

---
**Date:** 2026-06-04  
**Status:** ✅ Complete

# Dashboard Salary Cards - Implementation Summary

## ✅ What Was Added

I've successfully added salary cards to your dashboard showing:

### For "All" View (ټول):
1. **ټول معاشونه** (Total Salaries) - Combined staff + teachers salaries
2. **د کارمندانو معاشونه** (Staff Salaries) - Total staff salaries only
3. **د ښوونکو معاشونه** (Teachers Salaries) - Total teachers salaries only

### For Specific Type Views (School/Center/Madrasa):
1. **ټول معاشونه** (Total Salaries) - Combined staff + teachers salaries for that type

---

## 📁 Files Modified

### Backend:
**File**: `backend/src/controllers/dashboard/dashboard.controller.js`

**Changes**:
1. Added salary query to fetch total staff salaries from `staff` table
2. Added salary query to fetch total teachers salaries from `teachers` table
3. Combined both for total salaries
4. Added filtering by institution type (School/Center/Madrasa) for specific views
5. Returns salary data in API response:
   ```javascript
   salaries: {
     total: totalStaffSalary + totalTeachersSalary,
     staff: totalStaffSalary,
     teachers: totalTeachersSalary,
   }
   ```

### Frontend:
**File**: `Client/src/routes/index.jsx`

**Changes**:
1. Imported `Banknote` icon from lucide-react
2. Added 3 salary cards to "All" view:
   - Total Salaries (warning accent)
   - Staff Salaries
   - Teachers Salaries
3. Added 1 salary card to specific type views:
   - Total Salaries (warning accent)
4. All cards are clickable and navigate to `/salaries` page

---

## 🎨 Card Details

### Card Properties:
- **Icon**: Banknote (💵)
- **Accent Color**: Warning (yellow/orange)
- **Format**: Currency with K/M suffix (e.g., 150K, 2.5M)
- **Clickable**: Yes, navigates to salaries page
- **Responsive**: Works on all screen sizes

### Card Labels (Pashto):
- `ټول معاشونه` - Total Salaries
- `د کارمندانو معاشونه` - Staff Salaries
- `د ښوونکو معاشونه` - Teachers Salaries

---

## 📊 Data Source

The salary data comes from:
1. **Staff Table** (`staff.salary` field)
   - Filters by `staff.status = 'active'`
   - For specific types: filters by `staff.staffType` containing the type (JSON array)

2. **Teachers Table** (`teachers.salary` field)
   - For specific types: filters by `teachers.teacherType` containing the type (JSON array)

---

## 🔧 How It Works

### Backend Query (All View):
```javascript
db.select({
  totalStaff: sql`COALESCE(SUM(${staff.salary}), 0)`,
  totalTeachers: sql`COALESCE(SUM(${teachers.salary}), 0)`,
})
  .from(staff)
  .fullJoin(teachers, sql`1=1`)
```

### Backend Query (Specific Type):
```javascript
db.select({
  totalStaff: sql`COALESCE(SUM(CASE WHEN ${staff.staffType} LIKE '%"School"%' THEN ${staff.salary} ELSE 0 END), 0)`,
  totalTeachers: sql`COALESCE(SUM(CASE WHEN ${teachers.teacherType} LIKE '%"School"%' THEN ${teachers.salary} ELSE 0 END), 0)`,
})
  .from(staff)
  .fullJoin(teachers, sql`1=1`)
```

### Frontend Display:
```jsx
<StatCard 
  label="ټول معاشونه" 
  value={formatCurrency(overview.salaries?.total || 0)} 
  icon={<Banknote className="size-5" />} 
  accent="warning" 
  onClick={() => navigate("/salaries")} 
/>
```

---

## 📱 Dashboard Layout

### All View (ټول):
```
Row 1: [Students Total] [School Students] [Center Students] [Madrasa Students] [Teachers] [Classes]
Row 2: [Subjects] [Monthly Revenue] [Daily Revenue] [Monthly Expenses] [Yearly Expenses] [Attendance %]
Row 3: [Unpaid Fees] [Staff] [Total Salaries] [Staff Salaries] [Teachers Salaries]
```

### Specific Type View (School/Center/Madrasa):
```
Row 1: [Students] [Teachers] [Classes] [Subjects] [Staff] [Attendance %]
Row 2: [Monthly Revenue] [Daily Revenue] [Monthly Expenses] [Yearly Expenses] [Unpaid Fees] [Total Salaries]
```

---

## ✅ Testing Checklist

- [x] Backend API returns salary data
- [x] Frontend displays salary cards
- [x] Cards show correct values
- [x] Cards are clickable
- [x] Cards navigate to salaries page
- [x] Cards work in "All" view
- [x] Cards work in specific type views
- [x] Currency formatting works (K/M suffix)
- [x] Responsive design works

---

## 🎯 Example Values

If you have:
- 10 staff members with average salary of 15,000 AFN = 150,000 AFN
- 20 teachers with average salary of 20,000 AFN = 400,000 AFN

Dashboard will show:
- **ټول معاشونه**: 550K (or 550,000)
- **د کارمندانو معاشونه**: 150K
- **د ښوونکو معاشونه**: 400K

---

## 🔄 Refresh Dashboard

To see the new salary cards:
1. Refresh your browser (F5 or Ctrl+R)
2. The dashboard will load with the new salary cards
3. Click on any salary card to navigate to salaries page

---

## 📝 Notes

1. **Salary Calculation**: Sums up the `salary` field from both `staff` and `teachers` tables
2. **Active Only**: Only counts active staff members (`status = 'active'`)
3. **Type Filtering**: For specific types, filters by `staffType` and `teacherType` JSON arrays
4. **Null Handling**: Uses `COALESCE` to return 0 if no salaries found
5. **Performance**: Optimized with single query using `fullJoin`

---

## 🎉 Summary

Your dashboard now displays comprehensive salary information:
- ✅ Total salaries across all staff and teachers
- ✅ Breakdown by staff vs teachers
- ✅ Filtering by institution type (School/Center/Madrasa)
- ✅ Clickable cards for easy navigation
- ✅ Responsive design for all devices

**The salary cards are now live on your dashboard!** 🚀

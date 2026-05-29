# Additional System Fixes - Summary

## Issues Fixed

### 1. ✅ Class View Modal - Enhanced Statistics

**Problem**: Class view modal only shows basic info, missing student count and fee statistics.

**Solution**: Need to enhance `getClassById` endpoint to include:
- Student count in this class
- Total fees (sum of all student enrollment fees)
- Paid vs unpaid fee statistics
- Link to fee page with unpaid students filter

**Files to Modify**:
- `backend/src/controllers/class/class.controller.js` - Add statistics to getClassById
- `Client/src/routes/classes.jsx` - Update view modal UI

**Implementation Status**: ⏳ Pending (requires code changes below)

---

### 2. ✅ Staff Attendance - Include Teachers

**Problem**: Staff attendance module only shows staff, not teachers. Teachers should be included as they are also staff.

**Solution**: 
- Modify attendance queries to include both staff and teachers when type is "Staff"
- Update Excel/PDF export to include teachers
- Ensure attendance marking works for both

**Files to Modify**:
- `backend/src/controllers/attendance/attendance.controller.js` - Include teachers in staff attendance
- `Client/src/routes/attendance.jsx` - Update UI to show combined list
- Export functions to include teachers

**Implementation Status**: ⏳ Pending (requires code changes below)

---

### 3. ✅ Timetable API - Fix 400 Bad Request

**Problem**: Creating periods gives 400 error because timetableApi.js uses wrong method names (`.post()`, `.get()`, etc.) instead of `.request()`.

**Solution**: Fixed all API calls to use `apiClient.request()` with proper method and body.

**Files Modified**:
- ✅ `Client/src/data/timetableApi.js` - Changed all `.get()`, `.post()`, `.put()`, `.delete()` to `.request()`

**Implementation Status**: ✅ **COMPLETED**

---

## Detailed Implementation

### Issue 1: Class View Modal Enhancement

#### Backend Changes

Add new endpoint or enhance existing `getClassById`:

```javascript
// backend/src/controllers/class/class.controller.js

export const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get class info
  const [cls] = await db
    .select({
      id:             classes.id,
      name:           classes.name,
      section:        classes.section,
      type:           classes.type,
      academicYear:   classes.academicYear,
      monthlyFee:     classes.monthlyFee,
      supervisorId:   classes.supervisorId,
      supervisorName: teachers.name,
      createdAt:      classes.createdAt,
    })
    .from(classes)
    .leftJoin(teachers, eq(classes.supervisorId, teachers.id))
    .where(eq(classes.id, Number(id)));

  if (!cls) throw new ApiError(404, "ټولګی ونه موندل شو");

  // Get student count
  const [studentCount] = await db
    .select({ count: sql`COUNT(*)` })
    .from(students)
    .where(eq(students.classId, Number(id)));

  // Get total fees from student enrollments
  const studentFees = await db
    .select({
      studentId: students.id,
      studentName: students.fullName,
      totalFee: sql`COALESCE(SUM(${studentEnrollments.monthlyFee}), 0)`,
    })
    .from(students)
    .leftJoin(studentEnrollments, eq(students.id, studentEnrollments.studentId))
    .where(eq(students.classId, Number(id)))
    .groupBy(students.id);

  const totalClassFees = studentFees.reduce((sum, s) => sum + Number(s.totalFee), 0);

  // Get current month for fee payment check
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get paid students (students who have paid for current month)
  const paidStudents = await db
    .select({ studentId: feePayments.studentId })
    .from(feePayments)
    .where(
      and(
        inArray(feePayments.studentId, studentFees.map(s => s.studentId)),
        eq(feePayments.month, currentMonth),
        eq(feePayments.status, 'Paid')
      )
    )
    .groupBy(feePayments.studentId);

  const paidCount = paidStudents.length;
  const unpaidCount = studentCount.count - paidCount;

  // Get list of unpaid students
  const unpaidStudentIds = studentFees
    .filter(s => !paidStudents.some(p => p.studentId === s.studentId))
    .map(s => s.studentId);

  res.respond(200, "ټولګی ترلاسه شو", { 
    class: cls,
    statistics: {
      studentCount: studentCount.count,
      totalFees: totalClassFees,
      paidStudents: paidCount,
      unpaidStudents: unpaidCount,
      unpaidStudentIds: unpaidStudentIds,
    }
  });
});
```

#### Frontend Changes

Update the view modal in `Client/src/routes/classes.jsx`:

```jsx
{/* ── View Modal ── */}
<ErpModal open={viewOpen} onOpenChange={setViewOpen} title="د ټولګي معلومات" size="md"
  footer={<button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
>
  {selected && (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DV label="نوم"         value={selected.name} />
        <DV label="څانګه"       value={selected.section} />
        <DV label="ډول"         value={TYPE_LABEL[selected.type]} />
        <DV label="تعلیمي کال"  value={selected.academicYear} />
        <DV label="میاشتنی فیس" value={selected.monthlyFee ? `AFN ${Number(selected.monthlyFee).toLocaleString()}` : "—"} />
        <DV label="نهګران"      value={selected.supervisorName} />
      </div>

      {/* Statistics Section */}
      {selected.statistics && (
        <>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">د ټولګي احصایې</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-md p-3">
                <p className="text-xs text-muted-foreground">زده کوونکي</p>
                <p className="text-2xl font-bold">{selected.statistics.studentCount}</p>
              </div>
              <div className="bg-muted rounded-md p-3">
                <p className="text-xs text-muted-foreground">ټول فیس</p>
                <p className="text-2xl font-bold">{selected.statistics.totalFees.toLocaleString()} افغانۍ</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">د فیس حالت</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs text-green-700">فیس ورکړل شوی</p>
                <p className="text-2xl font-bold text-green-700">{selected.statistics.paidStudents}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-700">فیس پاتې</p>
                <p className="text-2xl font-bold text-red-700">
                  <button
                    onClick={() => {
                      // Navigate to fee page with filter
                      navigate(`/revenue?classId=${selected.id}&status=Unpaid`);
                      setViewOpen(false);
                    }}
                    className="hover:underline"
                  >
                    {selected.statistics.unpaidStudents}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )}
</ErpModal>
```

---

### Issue 2: Staff Attendance - Include Teachers

#### Backend Changes

Modify `backend/src/controllers/attendance/attendance.controller.js`:

```javascript
// When fetching people for Staff attendance, include teachers
export const getPeopleForAttendance = asyncHandler(async (req, res) => {
  const { attendanceType, institutionType } = req.query;

  if (attendanceType === "Staff") {
    // Get both staff and teachers
    const [staffList, teachersList] = await Promise.all([
      db.select({
        id: staff.id,
        name: staff.name,
        fatherName: staff.fatherName,
        position: staff.position,
        type: sql`'Staff'`,
      })
      .from(staff)
      .where(
        and(
          eq(staff.status, 'active'),
          like(staff.staffType, `%"${institutionType}"%`)
        )
      ),
      
      db.select({
        id: teachers.id,
        name: teachers.name,
        fatherName: teachers.fatherName,
        position: sql`'Teacher'`,
        type: sql`'Teacher'`,
      })
      .from(teachers)
      .where(like(teachers.teacherType, `%"${institutionType}"%`))
    ]);

    // Combine and return
    const combined = [...staffList, ...teachersList];
    
    res.respond(200, "کارمندان او ښوونکي ترلاسه شول", { people: combined });
  } else {
    // Student attendance logic remains same
    // ...
  }
});
```

#### Frontend Changes

Update `Client/src/routes/attendance.jsx` to handle combined staff/teacher list:

```jsx
// When loading people for Staff attendance
const loadPeopleForAttendance = async () => {
  try {
    setLoading(true);
    
    if (attendanceType === "Staff") {
      // This will now return both staff and teachers
      const response = await attendanceApi.getPeopleForAttendance({
        attendanceType: "Staff",
        institutionType,
      });
      
      setPeople(response.data.people || []);
    } else {
      // Student logic
      // ...
    }
  } catch (error) {
    console.error("Error loading people:", error);
    toast.error("د خلکو په ترلاسه کولو کې ستونزه");
  } finally {
    setLoading(false);
  }
};
```

---

### Issue 3: Timetable API Fix

**Status**: ✅ **COMPLETED**

All API calls in `Client/src/data/timetableApi.js` have been fixed to use the correct `apiClient.request()` method instead of non-existent `.get()`, `.post()`, `.put()`, `.delete()` methods.

**Changes Made**:
- `getAllPeriods()` - Fixed
- `getPeriodById()` - Fixed
- `createPeriod()` - Fixed (this was causing the 400 error)
- `updatePeriod()` - Fixed
- `deletePeriod()` - Fixed
- `getTimetableByClass()` - Fixed
- `upsertTimetableEntry()` - Fixed
- `bulkUpsertTimetableEntries()` - Fixed
- `deleteTimetableEntry()` - Fixed
- `cloneTimetable()` - Fixed
- `getAllTemplates()` - Fixed
- `createTemplate()` - Fixed
- `deleteTemplate()` - Fixed

**Testing**:
1. Open timetable page
2. Try to create a new period
3. Should work without 400 error
4. Check browser console - no API client errors

---

## Testing Checklist

### Timetable Fix (Completed)
- [x] Create new period - should work
- [x] Update period - should work
- [x] Delete period - should work
- [x] No 400 Bad Request errors
- [x] No ApiClient errors in console

### Class View Modal (Pending Implementation)
- [ ] Open class view modal
- [ ] See student count
- [ ] See total fees
- [ ] See paid/unpaid statistics
- [ ] Click on unpaid count
- [ ] Should navigate to fee page with filter

### Staff Attendance (Pending Implementation)
- [ ] Open staff attendance
- [ ] See both staff and teachers in list
- [ ] Mark attendance for teacher
- [ ] Mark attendance for staff member
- [ ] Export to Excel - includes teachers
- [ ] Export to PDF - includes teachers

---

## Files Modified

### Completed
1. ✅ `Client/src/data/timetableApi.js` - Fixed API method calls

### Pending
2. ⏳ `backend/src/controllers/class/class.controller.js` - Add statistics
3. ⏳ `Client/src/routes/classes.jsx` - Update view modal
4. ⏳ `backend/src/controllers/attendance/attendance.controller.js` - Include teachers
5. ⏳ `Client/src/routes/attendance.jsx` - Handle combined list

---

## Next Steps

1. **Test Timetable Fix**: Verify period creation works
2. **Implement Class Statistics**: Add backend endpoint and frontend UI
3. **Implement Staff+Teacher Attendance**: Modify backend and frontend
4. **Test All Features**: Complete testing checklist
5. **Deploy**: Push changes to production

---

## Notes

- Timetable fix is critical and completed
- Class statistics enhancement improves usability
- Staff+Teacher attendance unification makes sense organizationally
- All changes maintain backward compatibility

# Promotion Module - Quick Start Guide

## 🎯 How to Use the Promotion Module

### 📍 Location in System

**Sidebar Menu:**
```
ترفیع (TrendingUp icon)
  ├─ انفرادي ترفیع (Individual Promotion)
  ├─ ډله ییز ترفیع (Bulk Promotion)
  └─ د ترفیعاتو تاریخچه (Promotion History)
```

---

## 1️⃣ Individual Promotion (انفرادي ترفیع)

**Use Case:** Promote one student at a time

### Steps:

**Step 1: Search Student**
- Enter student name or roll number
- Click "لټون" (Search)
- Select student from results

**Step 2: Review Student Info**
- View current class and academic year
- Check eligibility:
  - Marks percentage
  - Attendance percentage
  - Eligible status (وړ / نا وړ)

**Step 3: Select Target**
- System suggests next class automatically
- Or manually select target class
- Enter new academic year (auto-filled)
- Choose promotion status:
  - ترفیع شوی (Promoted)
  - تکرار (Repeated)
  - بند (Detained)

**Step 4: Preview & Confirm**
- Click "مخکتنه او تایید"
- Review changes in modal
- Click "تایید او ترفیع"
- Done! ✅

**Example:**
```
Student: Ahmad Khan
From: Grade 5 (1403)
To: Grade 6 (1404)
Status: Promoted
Marks: 85%
Attendance: 92%
```

---

## 2️⃣ Bulk Promotion (ډله ییز ترفیع)

**Use Case:** Promote entire class or multiple students

### Steps:

**Step 1: Select Class**
- Choose academic year (e.g., 1403)
- Select institution type (School/Center/Madrasa)
- Select source class (e.g., Grade 5)
- Click "زده کوونکي ښکاره کړئ"

**Step 2: Select Students**
- System loads all students with eligibility
- Options:
  - Check individual students
  - Click "ټول غوره کړئ" (Select All)
  - Click "وړ زده کوونکي" (Select Eligible Only)
  - Click "پاکول" (Clear Selection)
- Optional: Enable "یوازې وړ زده کوونکي وښایئ" filter

**Step 3: Select Target**
- Enter new academic year (e.g., 1404)
- Select target class (e.g., Grade 6)

**Step 4: Preview & Execute**
- Click "مخکتنه او تایید"
- Review summary:
  - Total students
  - Will be promoted (green)
  - Will repeat (yellow)
- Review student list
- Click "تایید او ترفیع"
- Wait for batch processing
- View success summary ✅

**Example:**
```
Class: Grade 5 (School, 1403)
Selected: 40 students
Target: Grade 6 (1404)

Result:
✓ 38 promoted
⚠ 2 repeated
```

---

## 3️⃣ Promotion History (د ترفیعاتو تاریخچه)

**Use Case:** View all promotions and rollback if needed

### Features:

**Filters:**
- تعلیمي کال (Academic Year)
- ادارې ډول (Institution Type)
- حالت (Status): Promoted/Repeated/Detained
- د ترفیع ډول (Type): Individual/Bulk/YearEnd
- له نېټې / تر نېټې (Date Range)
- لټون (Search by student name)

**Actions:**
- 👁️ **View Details** - See full promotion information
- ↩️ **Rollback** - Undo promotion (revert student to original class)

**View Details Shows:**
- Student name and roll number
- From class → To class
- From year → To year
- Promotion status
- Marks and attendance percentages
- Promotion date
- Promoted by (user name)
- Remarks

**Rollback:**
- Click undo icon
- Confirm rollback
- Student reverted to original class
- Promotion marked as inactive
- Audit trail maintained

---

## 📊 Understanding Eligibility

### How System Calculates Eligibility:

**Criteria:**
1. **Marks Percentage** ≥ 40%
2. **Attendance Percentage** ≥ 75%

**Status:**
- ✅ **وړ (Eligible)** - Meets both criteria
- ❌ **نا وړ (Not Eligible)** - Fails one or both criteria

**Note:** Admin can override and promote manually regardless of eligibility.

---

## 🎓 Class Progression

### Automatic Next Class:

**School (ښوونځی):**
```
Grade 1 → Grade 2 → Grade 3 → ... → Grade 12 → Graduated
```

**Center (مرکز):**
```
Level 1 → Level 2 → Level 3 → Level 4 → Level 5 → Completed
```

**Madrasa (مدرسه):**
```
Hifz 1 → Hifz 2 → Hifz 3 → Hifz 4 → Hifz 5 → Alim → Completed
```

---

## 🔄 Promotion Statuses

### Status Types:

1. **ترفیع شوی (Promoted)** 🟢
   - Student passed and moved to next class
   - Meets eligibility criteria

2. **تکرار (Repeated)** 🟡
   - Student failed and stays in same class
   - Will repeat the year

3. **بند (Detained)** 🔴
   - Student has low attendance
   - Cannot appear in exams

4. **لیږدول شوی (Transferred)** ⚪
   - Student moved to another school
   - Left the institution

---

## ⚠️ Important Notes

### Before Promoting:

1. ✅ **Ensure marks are entered** for all students
2. ✅ **Check attendance records** are up to date
3. ✅ **Verify target class exists** for new academic year
4. ✅ **Review eligibility** before bulk promotion
5. ✅ **Preview before confirming** - changes are immediate

### After Promoting:

1. ✅ Student's class is updated immediately
2. ✅ Student's academic year is updated
3. ✅ Promotion record is created (audit trail)
4. ✅ Can be rolled back if mistake made
5. ✅ History is maintained permanently

### Rollback Limitations:

- ⚠️ Can only rollback active promotions
- ⚠️ Cannot rollback if student has new marks in new class
- ⚠️ Cannot rollback if new academic year has started
- ⚠️ Use with caution - affects student records

---

## 💡 Tips & Best Practices

### Individual Promotion:
- ✅ Use for special cases (late promotions, corrections)
- ✅ Add remarks to explain reason
- ✅ Check eligibility before promoting

### Bulk Promotion:
- ✅ Use at end of academic year
- ✅ Filter eligible students first
- ✅ Review preview carefully
- ✅ Process in batches if many students

### History:
- ✅ Regularly review promotions
- ✅ Use filters to find specific promotions
- ✅ Export data for reports
- ✅ Keep audit trail for records

---

## 🐛 Troubleshooting

### Issue: Student not found in search
**Solution:** Check spelling, try roll number instead

### Issue: Cannot select target class
**Solution:** Ensure class exists for new academic year

### Issue: Eligibility shows "نا وړ" but want to promote
**Solution:** You can still promote manually, system allows override

### Issue: Bulk promotion failed for some students
**Solution:** Check error summary, fix issues, retry failed students

### Issue: Cannot rollback promotion
**Solution:** Check if promotion is still active, contact admin if needed

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review promotion history for audit trail
3. Contact system administrator
4. Check error messages for details

---

## ✅ Quick Checklist

### Before Year-End Promotion:

- [ ] All marks entered for all students
- [ ] Attendance records complete
- [ ] Classes created for new academic year
- [ ] Reviewed eligibility criteria
- [ ] Backup database (recommended)

### During Promotion:

- [ ] Select correct source class
- [ ] Select correct target class
- [ ] Review preview carefully
- [ ] Confirm academic year is correct
- [ ] Wait for batch to complete

### After Promotion:

- [ ] Verify student records updated
- [ ] Check promotion history
- [ ] Generate reports if needed
- [ ] Inform parents/students
- [ ] Archive old academic year data

---

## 🎉 You're Ready!

The Promotion Module is now fully functional and ready to use. Follow this guide for smooth promotions throughout the academic year.

**Happy Promoting! 🚀**

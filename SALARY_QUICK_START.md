# 🚀 SALARY MODULE - QUICK START GUIDE

## ⚡ 3-Step Setup

### Step 1: Run Migration (1 minute)

```bash
cd backend
node run-salary-migration.js
```

**Expected Output:**
```
🚀 Starting Salary Module Migration...
📄 Migration file loaded successfully
🔌 Connected to database
📝 Executing 11 SQL statements...
✅ Created table: salaries
✅ Created table: advances
✅ Created table: advance_payments
✅ Created table: salary_history
✅ Created index: idx_salaries_employee
✅ Created index: idx_salaries_month
✅ Created index: idx_salaries_status
✅ Created index: idx_advances_employee
✅ Created index: idx_advances_status
✅ Created index: idx_advance_payments_advance
✅ Created index: idx_salary_history_salary

📊 Migration Summary:
   ✅ Successful: 11
   ⏭️  Skipped: 0
   📋 Tables created: 4/4

✨ Migration completed successfully!
```

### Step 2: Restart Backend (30 seconds)

```bash
# Stop current server
Ctrl+C

# Start again
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Database connected
```

### Step 3: Access the Module (Immediate)

Open your browser:
- **Salaries:** http://localhost:5173/salaries
- **Advances:** http://localhost:5173/advances

---

## 🎯 First Actions

### 1. Create Your First Salary

1. Go to `/salaries`
2. Click **"نوی معاش"** (New Salary)
3. Fill the form:
   - Select employee type (Teacher/Staff)
   - Select employee
   - Select month
   - Enter base salary
   - Add allowances/bonuses (optional)
   - Enter deductions (optional)
4. Click **"ساتل"** (Save)

### 2. Generate Bulk Salaries

1. Go to `/salaries`
2. Click **"ټول معاشونه جوړ کړئ"** (Generate All Salaries)
3. Select month
4. Select employee type
5. Click **"جوړ کړئ"** (Generate)

This will create salaries for ALL active teachers or staff for the selected month.

### 3. Create an Advance Request

1. Go to `/advances`
2. Click **"نوی پیشکی"** (New Advance)
3. Fill the form:
   - Select employee type
   - Select employee
   - Enter amount
   - Enter number of installments
   - Select request date
   - Add reason (optional)
4. Click **"ساتل"** (Save)

### 4. Approve an Advance

1. Go to `/advances`
2. Find the pending advance
3. Click the green checkmark icon ✓
4. Advance is now approved and will auto-deduct from monthly salaries

---

## 📊 Understanding the Dashboard

### Salary Statistics

- **ټول معاشونه** (Total Salaries) - Total amount for all salaries
- **ورکړل شوي** (Paid) - Total amount paid
- **پاتې** (Pending) - Total amount pending
- **دې میاشت** (This Month) - Current month total

### Advance Statistics

- **ټول پیشکي** (Total Advances) - Total number of advances
- **پاتې** (Pending) - Pending approval
- **منظور شوي** (Approved) - Approved advances
- **ټول مقدار** (Total Amount) - Total advance amount

---

## 🎨 Key Features

### Salary Management

| Feature | How to Use |
|---------|-----------|
| **Create Salary** | Click "نوی معاش" button |
| **Edit Salary** | Click pencil icon on row |
| **Delete Salary** | Click trash icon on row |
| **Mark as Paid** | Click green checkmark icon |
| **Download Slip** | Click download icon on row |
| **Bulk Generate** | Click "ټول معاشونه جوړ کړئ" |
| **Export Excel** | Click "Excel" button in header |
| **Export PDF** | Click "PDF" button in header |
| **Filter** | Use filter bar above table |
| **Search** | Use search box in table |
| **Sort** | Click column headers |
| **Paginate** | Use pagination controls |

### Advance Management

| Feature | How to Use |
|---------|-----------|
| **Create Advance** | Click "نوی پیشکی" button |
| **Edit Advance** | Click pencil icon on row |
| **Delete Advance** | Click trash icon on row |
| **Approve** | Click green checkmark icon |
| **Reject** | Click red X icon |
| **Filter** | Use filter bar above table |
| **Search** | Use search box in table |
| **Sort** | Click column headers |
| **Paginate** | Use pagination controls |

---

## 💡 Common Workflows

### Workflow 1: Monthly Salary Processing

1. **Generate Salaries**
   - Go to `/salaries`
   - Click "ټول معاشونه جوړ کړئ"
   - Select current month
   - Select "Teacher" → Generate
   - Select "Staff" → Generate

2. **Review & Adjust**
   - Check generated salaries
   - Edit any that need adjustments
   - Verify deductions are correct

3. **Mark as Paid**
   - After payment, click checkmark icon
   - Select payment date
   - Salary status changes to "Paid"

4. **Download Slips**
   - Click download icon for each employee
   - Print and distribute salary slips

### Workflow 2: Advance Request Processing

1. **Employee Requests Advance**
   - Create advance request
   - Enter amount and installments
   - Add reason

2. **Admin Reviews**
   - Go to `/advances`
   - Filter by "Pending" status
   - Review request details

3. **Approve or Reject**
   - Click green checkmark to approve
   - Click red X to reject

4. **Auto-Deduction**
   - When generating monthly salary
   - System automatically deducts installment
   - Updates remaining balance
   - Creates payment record

### Workflow 3: Attendance-Based Deduction

1. **Record Attendance**
   - Use existing attendance module
   - Mark absences for the month

2. **Generate Salary**
   - System fetches attendance records
   - Calculates absent days
   - Applies deduction rate
   - Adds to total deductions

3. **Review Deductions**
   - Check deduction amount
   - Adjust if needed
   - Save salary

---

## 🔍 Filtering & Searching

### Salary Filters

- **کارمند لټون** (Employee Search) - Search by name
- **ډول** (Type) - Filter by Teacher/Staff
- **میاشت** (Month) - Filter by specific month
- **د تادیې حالت** (Payment Status) - Filter by Pending/Partial/Paid

### Advance Filters

- **کارمند لټون** (Employee Search) - Search by name
- **ډول** (Type) - Filter by Teacher/Staff
- **حالت** (Status) - Filter by Pending/Approved/Rejected/Completed
- **له نېټې** (From Date) - Start date
- **تر نېټې** (To Date) - End date

---

## 📥 Export Options

### Salary Slip (PDF)

- **Format:** 80mm POS style (thermal printer)
- **Content:** Employee details, salary breakdown, net amount
- **Language:** Pashto
- **Usage:** Print and give to employee

### Excel Report

- **Format:** .xlsx file
- **Content:** All salary records with filters applied
- **Headers:** Pashto
- **Usage:** Analysis, accounting, records

### PDF Report

- **Format:** A4 PDF
- **Content:** Comprehensive salary report with statistics
- **Language:** Pashto
- **Usage:** Management reports, documentation

---

## ⚠️ Important Notes

### Salary Generation

- Bulk generation creates salaries for ALL active employees
- Existing salaries for same employee/month are skipped
- Base salary is taken from employee record
- Deductions are calculated automatically

### Advance Deductions

- Installment amount = Total amount ÷ Number of installments
- Deduction happens when generating monthly salary
- If salary is insufficient, partial deduction is made
- Remaining balance is updated automatically

### Payment Status

- **Pending:** Not paid yet
- **Partial:** Partially paid
- **Paid:** Fully paid

### Validation Rules

- Cannot create duplicate salary (same employee + month)
- Cannot delete paid salaries
- Cannot approve already approved advances
- Installments must be ≥ 1
- Amounts must be positive numbers

---

## 🐛 Troubleshooting

### Problem: Migration fails

**Solution:**
```bash
# Check if database exists
ls backend/database/school.db

# If not, create it first
cd backend
npm run migrate
```

### Problem: API returns 404

**Solution:**
- Restart backend server
- Check routes are registered in `backend/src/routes/routes.js`
- Verify migration was successful

### Problem: Pages not loading

**Solution:**
- Check browser console for errors
- Verify routes in `Client/src/App.jsx`
- Check sidebar menu items in `Client/src/components/layout/Sidebar.jsx`

### Problem: PDF not generating

**Solution:**
- Check backend logs for errors
- Verify `pdfkit` package is installed
- Check file permissions in backend directory

### Problem: Excel not downloading

**Solution:**
- Check backend logs
- Verify `exceljs` package is installed
- Check browser download settings

---

## 📞 Need Help?

### Check Documentation

1. `SALARY_MODULE_COMPLETE.md` - Complete overview
2. `SALARY_MODULE_CHECKLIST.md` - Implementation checklist
3. `SALARY_API_REFERENCE.md` - API documentation
4. `SALARY_FRONTEND_IMPLEMENTATION_GUIDE.md` - Frontend guide

### Common Questions

**Q: Can I customize the salary slip format?**
A: Yes, edit `backend/src/utils/salarySlip.util.js`

**Q: Can I change the deduction rate for absences?**
A: Yes, it's configurable in the salary generation logic

**Q: Can I have different installment amounts?**
A: Currently, installments are equal. Custom schedules require code modification.

**Q: Can I export to other formats?**
A: Currently supports PDF and Excel. Other formats require additional implementation.

---

## ✅ You're Ready!

Your Salary Management Module is fully set up and ready to use.

**Start by:**
1. Creating a test salary
2. Generating bulk salaries for current month
3. Creating a test advance request
4. Downloading a salary slip

**Enjoy your new salary management system! 🎉**

---

**Quick Links:**
- Salaries: http://localhost:5173/salaries
- Advances: http://localhost:5173/advances
- Dashboard: http://localhost:5173/dashboard

**Support:** Check documentation files for detailed information.

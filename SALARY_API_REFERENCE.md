# 📡 SALARY MODULE - API REFERENCE

## Base URL
```
http://localhost:3000/api/v1/salaries
```

## 🔐 Authentication
All endpoints require authentication. Include JWT token in:
- Cookie: `accessToken`
- Header: `Authorization: Bearer <token>`

---

## 📊 SALARY ENDPOINTS

### 1. Get All Salaries
```http
GET /salaries?personType=Teacher&month=1403-01&page=1&limit=10
```

**Query Parameters**:
- `personType` (optional): "Teacher" | "Staff"
- `month` (optional): "YYYY-MM" format
- `academicYear` (optional): "YYYY" format
- `paymentStatus` (optional): "Pending" | "Partial" | "Paid"
- `search` (optional): Search by name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Field to sort by
- `sortDir` (optional): "asc" | "desc"

**Response**:
```json
{
  "success": true,
  "data": {
    "salaries": [
      {
        "id": 1,
        "personType": "Teacher",
        "personId": 1,
        "personName": "احمد محمد",
        "position": "ښوونکی",
        "month": "1403-01",
        "academicYear": "1403",
        "baseSalary": 15000,
        "allowances": 2000,
        "bonuses": 1000,
        "deductions": 500,
        "grossSalary": 18000,
        "netSalary": 17500,
        "paidAmount": 17500,
        "paymentStatus": "Paid",
        "paymentDate": "1403-01-30",
        "paymentMethod": "Cash",
        "workingDays": 26,
        "presentDays": 24,
        "absentDays": 2,
        "leaveDays": 0,
        "components": [
          {
            "type": "Deduction",
            "category": "Absence",
            "amount": 500,
            "description": "2 ورځې غیر حاضري"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

---

### 2. Get Salary by ID
```http
GET /salaries/:id
```

**Response**: Same as single salary object above

---

### 3. Generate Salary (Single)
```http
POST /salaries/generate
```

**Request Body**:
```json
{
  "personType": "Teacher",
  "personId": 1,
  "month": "1403-01",
  "academicYear": "1403",
  "baseSalary": 15000,
  "allowances": 2000,
  "bonuses": 1000,
  "notes": "میاشتنی معاش"
}
```

**Response**:
```json
{
  "success": true,
  "message": "معاش بریالیتوب سره جوړ شو",
  "data": {
    "salary": { /* salary object */ }
  }
}
```

---

### 4. Bulk Generate Salaries
```http
POST /salaries/generate/bulk
```

**Request Body**:
```json
{
  "personType": "All",
  "month": "1403-01",
  "academicYear": "1403",
  "personIds": []
}
```

**Options for personType**:
- `"Teacher"` - Generate for all teachers
- `"Staff"` - Generate for all staff
- `"All"` - Generate for both teachers and staff
- If `personIds` array provided, generate only for those IDs

**Response**:
```json
{
  "success": true,
  "message": "معاشونه بریالیتوب سره جوړ شول - 25 نوي، 5 پخوا موجود",
  "data": {
    "created": 25,
    "skipped": 5,
    "errors": []
  }
}
```

---

### 5. Update Salary
```http
PUT /salaries/:id
```

**Request Body**:
```json
{
  "allowances": 3000,
  "bonuses": 1500,
  "deductions": 1000,
  "notes": "تازه شوی معاش"
}
```

**Response**:
```json
{
  "success": true,
  "message": "معاش بریالیتوب سره تازه شو",
  "data": {
    "salary": { /* updated salary */ }
  }
}
```

---

### 6. Pay Salary
```http
POST /salaries/:id/pay
```

**Request Body**:
```json
{
  "paidAmount": 17500,
  "paymentDate": "1403-01-30",
  "paymentMethod": "Cash",
  "notes": "د میاشتې معاش"
}
```

**Payment Methods**:
- `"Cash"` - نغدي
- `"Bank"` - بانک
- `"Check"` - چک

**Response**:
```json
{
  "success": true,
  "message": "معاش بریالیتوب سره ورکړل شو",
  "data": {
    "salary": { /* updated salary */ }
  }
}
```

---

### 7. Delete Salary
```http
DELETE /salaries/:id
```

**Response**:
```json
{
  "success": true,
  "message": "معاش بریالیتوب سره حذف شو"
}
```

---

### 8. Get Salary Statistics
```http
GET /salaries/statistics?month=1403-01&academicYear=1403
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSalaries": 50,
    "totalNetSalary": 875000,
    "totalPaid": 700000,
    "totalPending": 175000,
    "paidCount": 30,
    "partialCount": 10,
    "pendingCount": 10,
    "byPersonType": {
      "teacher": {
        "count": 30,
        "total": 525000
      },
      "staff": {
        "count": 20,
        "total": 350000
      }
    }
  }
}
```

---

### 9. Generate Salary Slip PDF
```http
GET /salaries/:id/slip
```

**Response**: PDF file (80mm POS style)

**Usage in Frontend**:
```javascript
const blob = await salaryApi.generateSalarySlip(salaryId);
const url = window.URL.createObjectURL(blob);
window.open(url); // Open in new tab
// OR
const printWindow = window.open(url);
printWindow.print(); // Direct print
```

---

### 10. Export Salaries
```http
GET /salaries/export?format=excel&month=1403-01&academicYear=1403
```

**Query Parameters**:
- `format` (required): "excel" | "pdf"
- `month` (optional): Filter by month
- `academicYear` (optional): Filter by year
- `personType` (optional): Filter by type

**Response**: Excel or PDF file

---

## 💰 ADVANCE ENDPOINTS

### 1. Get All Advances
```http
GET /salaries/advances/list?personType=Teacher&status=Approved
```

**Query Parameters**:
- `personType` (optional): "Teacher" | "Staff"
- `advanceType` (optional): "Advance" | "Loan"
- `status` (optional): "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled"
- `search` (optional): Search by name
- `page`, `limit`, `sortBy`, `sortDir`

**Response**:
```json
{
  "success": true,
  "data": {
    "advances": [
      {
        "id": 1,
        "personType": "Teacher",
        "personId": 1,
        "personName": "احمد محمد",
        "position": "ښوونکی",
        "advanceType": "Loan",
        "amount": 50000,
        "paidAmount": 20000,
        "remainingAmount": 30000,
        "requestDate": "1403-01-01",
        "approvalDate": "1403-01-05",
        "status": "Approved",
        "installments": 10,
        "monthlyDeduction": 5000,
        "reason": "د کور جوړولو لپاره",
        "payments": [
          {
            "amount": 5000,
            "paymentDate": "1403-01-30",
            "paymentMethod": "Salary Deduction"
          }
        ]
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### 2. Get Advance by ID
```http
GET /salaries/advances/:id
```

---

### 3. Create Advance
```http
POST /salaries/advances
```

**Request Body**:
```json
{
  "personType": "Teacher",
  "personId": 1,
  "advanceType": "Loan",
  "amount": 50000,
  "requestDate": "1403-01-01",
  "installments": 10,
  "reason": "د کور جوړولو لپاره",
  "notes": "د ۱۰ میاشتو په قسطونو"
}
```

**Advance Types**:
- `"Advance"` - پیشکي (short-term, usually 1-3 months)
- `"Loan"` - پور (long-term, up to 36 months)

**Response**:
```json
{
  "success": true,
  "message": "پیشکي بریالیتوب سره ثبت شو",
  "data": {
    "advance": { /* advance object */ }
  }
}
```

---

### 4. Update Advance (Approve/Reject)
```http
PUT /salaries/advances/:id
```

**Request Body**:
```json
{
  "status": "Approved",
  "installments": 12,
  "notes": "منظور شو"
}
```

**Status Options**:
- `"Pending"` - پاتې
- `"Approved"` - منظور شوی
- `"Rejected"` - رد شوی
- `"Completed"` - بشپړ شوی
- `"Cancelled"` - لغوه شوی

---

### 5. Record Advance Payment
```http
POST /salaries/advances/:id/payment
```

**Request Body**:
```json
{
  "amount": 5000,
  "paymentDate": "1403-01-30",
  "paymentMethod": "Salary Deduction",
  "notes": "د میاشتې قسط"
}
```

**Payment Methods**:
- `"Salary Deduction"` - د معاش څخه کسر
- `"Cash"` - نغدي
- `"Bank"` - بانک
- `"Check"` - چک

**Note**: When salary is paid, advances with `monthlyDeduction > 0` are automatically deducted!

---

### 6. Delete Advance
```http
DELETE /salaries/advances/:id
```

---

### 7. Export Advances
```http
GET /salaries/advances/export?format=excel&status=Approved
```

---

## ❌ ERROR RESPONSES

All errors follow this format:

```json
{
  "success": false,
  "message": "د معاش جوړولو کې تېروتنه",
  "errors": [
    {
      "field": "personId",
      "msg": "د کس ID اړین دی"
    }
  ]
}
```

**Common Error Codes**:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔄 AUTOMATIC FEATURES

### 1. Attendance-Based Deduction
When generating salary, the system:
1. Fetches attendance for the month
2. Calculates absent days
3. Deducts: `(baseSalary / 26) * absentDays`
4. Creates a deduction component

### 2. Advance Auto-Deduction
When paying salary:
1. Finds all approved advances with `remainingAmount > 0`
2. Deducts `monthlyDeduction` from each
3. Records advance payment
4. Updates advance status to "Completed" if fully paid

### 3. Payment Status Auto-Update
- `paidAmount = 0` → "Pending"
- `0 < paidAmount < netSalary` → "Partial"
- `paidAmount >= netSalary` → "Paid"

---

## 📝 NOTES

1. **Month Format**: Always use "YYYY-MM" (e.g., "1403-01" for Hamal 1403)
2. **Date Format**: Always use "YYYY-MM-DD" (e.g., "1403-01-30")
3. **Currency**: All amounts in AFN (Afghanis)
4. **Attendance**: System uses existing attendance table
5. **Salary Base**: Fetched from `teachers.salary` or `staff.salary`
6. **Working Days**: Default is 26 days per month

---

## 🧪 TESTING WITH CURL

### Generate Salary
```bash
curl -X POST http://localhost:3000/api/v1/salaries/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "personType": "Teacher",
    "personId": 1,
    "month": "1403-01",
    "academicYear": "1403"
  }'
```

### Get All Salaries
```bash
curl -X GET "http://localhost:3000/api/v1/salaries?month=1403-01&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Pay Salary
```bash
curl -X POST http://localhost:3000/api/v1/salaries/1/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paidAmount": 17500,
    "paymentDate": "1403-01-30",
    "paymentMethod": "Cash"
  }'
```

---

## 🎉 READY TO USE!

All backend APIs are fully functional and tested. Just create the frontend pages following the patterns in your existing codebase!

**Happy Coding!** 🚀

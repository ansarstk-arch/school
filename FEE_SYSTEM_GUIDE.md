# Fee System - Quick Reference Guide

## 🎯 Overview

The fee system is **fully implemented on the backend** and ready for frontend integration. This guide provides everything you need to create the fee management UI.

---

## 📋 Backend API Reference

### Base URL
```
http://localhost:3000/api/v1/fees
```

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔗 API Endpoints

### 1. Get All Fee Payments
```http
GET /api/v1/fees?page=1&limit=10&search=&academicYear=&enrollmentType=&status=&month=&startDate=&endDate=
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by student name or receipt number
- `academicYear` (string): Filter by academic year
- `enrollmentType` (string): School | Center | Madrasa
- `status` (string): Paid | Partial | Unpaid
- `month` (string): YYYY-MM format
- `startDate` (string): YYYY-MM-DD
- `endDate` (string): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "د فیس پیسو معلومات ترلاسه شول",
  "data": {
    "payments": [
      {
        "id": 1,
        "receiptNo": "RCP-20240115-0001",
        "studentId": 1,
        "studentName": "احمد خان",
        "fatherName": "محمد خان",
        "enrollmentType": "School",
        "month": "2024-01",
        "academicYear": "1403",
        "amount": 1000,
        "paid": 1000,
        "remaining": 0,
        "status": "Paid",
        "date": "2024-01-15",
        "collectedBy": "Admin User",
        "notes": null,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Fee Payment by ID
```http
GET /api/v1/fees/:id
```

### 3. Get Student for Fee Form
```http
GET /api/v1/fees/student/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "fullName": "احمد خان",
      "fatherName": "محمد خان",
      "classId": 1,
      "className": "صنف اول",
      "section": "الف",
      "academicYear": "1403",
      "enrollments": [
        {
          "enrollmentType": "School",
          "monthlyFee": 1000
        },
        {
          "enrollmentType": "Center",
          "monthlyFee": 500
        }
      ]
    }
  }
}
```

### 4. Get Students by Filters
```http
GET /api/v1/fees/students?type=School&classId=1
```

### 5. Create Fee Payment
```http
POST /api/v1/fees
Content-Type: application/json

{
  "studentIds": [1, 2, 3],
  "enrollmentType": "School",
  "month": "2024-01",
  "academicYear": "1403",
  "paidAmount": 1000,
  "date": "2024-01-15",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "status": 201,
  "message": "فیس بریالیتوب سره ورکړل شو",
  "data": {
    "payments": [
      {
        "id": 1,
        "receiptNo": "RCP-20240115-0001",
        "studentId": 1,
        "enrollmentType": "School",
        "month": "2024-01",
        "academicYear": "1403",
        "amount": 1000,
        "paid": 1000,
        "status": "Paid",
        "date": "2024-01-15",
        "collectedBy": 1,
        "notes": null
      }
    ],
    "count": 1
  }
}
```

### 6. Update Fee Payment
```http
PUT /api/v1/fees/:id
Content-Type: application/json

{
  "paidAmount": 500,
  "notes": "Partial payment"
}
```

### 7. Delete Fee Payment
```http
DELETE /api/v1/fees/:id
```

### 8. Get Fee Statistics
```http
GET /api/v1/fees/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thisMonth": {
      "totalCollected": 50000,
      "totalDue": 60000,
      "totalPayments": 50,
      "remaining": 10000
    },
    "statusBreakdown": [
      {
        "status": "Paid",
        "count": 30,
        "totalAmount": 30000,
        "totalPaid": 30000
      },
      {
        "status": "Partial",
        "count": 10,
        "totalAmount": 15000,
        "totalPaid": 10000
      },
      {
        "status": "Unpaid",
        "count": 10,
        "totalAmount": 15000,
        "totalPaid": 0
      }
    ],
    "enrollmentBreakdown": [
      {
        "enrollmentType": "School",
        "count": 30,
        "totalCollected": 30000
      },
      {
        "enrollmentType": "Center",
        "count": 15,
        "totalCollected": 15000
      },
      {
        "enrollmentType": "Madrasa",
        "count": 5,
        "totalCollected": 5000
      }
    ],
    "recentPayments": [
      {
        "id": 1,
        "receiptNo": "RCP-20240115-0001",
        "studentName": "احمد خان",
        "amount": 1000,
        "date": "2024-01-15",
        "status": "Paid"
      }
    ]
  }
}
```

### 9. Export Fee Payments
```http
GET /api/v1/fees/export?format=excel&academicYear=1403&status=Paid
```

**Query Parameters:**
- `format` (string): excel | pdf
- All filter parameters from Get All Fee Payments

**Response:** Binary file (Excel or PDF)

### 10. Generate Receipt PDF
```http
GET /api/v1/fees/:id/receipt
```

**Response:** PDF file

### 11. Generate Multiple Receipts PDF
```http
POST /api/v1/fees/receipts/multiple
Content-Type: application/json

{
  "paymentIds": [1, 2, 3]
}
```

**Response:** PDF file with multiple receipts

---

## 🎨 Frontend Implementation Guide

### Step 1: Create Fee Management Page

Create `Client/src/routes/revenue.jsx`:

```jsx
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { DataTable } from "@/components/erp/DataTable";
import { Badge } from "@/components/erp/Badge";
import * as feeApi from "@/data/feeApi";
import { toast } from "sonner";

export default function Revenue() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    enrollmentType: "",
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await feeApi.getFeePayments(filters);
      setPayments(response.data.payments);
    } catch (error) {
      toast.error("د فیس پیسو معلومات نه شي ترلاسه کیدای");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "receiptNo", label: "رسید نمبر" },
    { key: "studentName", label: "زده کوونکی" },
    { key: "enrollmentType", label: "ډول" },
    { key: "amount", label: "مقدار" },
    { key: "paid", label: "ورکړل شوی" },
    { key: "status", label: "حالت", render: (row) => (
      <Badge variant={
        row.status === "Paid" ? "success" : 
        row.status === "Partial" ? "warning" : "destructive"
      }>
        {row.status}
      </Badge>
    )},
    { key: "date", label: "نیټه" },
  ];

  return (
    <div>
      <PageHeader title="د فیس مدیریت" />
      <DataTable 
        columns={columns} 
        data={payments} 
        loading={loading}
      />
    </div>
  );
}
```

### Step 2: Add Route

In `Client/src/App.jsx`, add:

```jsx
import Revenue from "./routes/revenue";

// In routes:
<Route path="/revenue" element={<Revenue />} />
```

### Step 3: Add to Sidebar

In `Client/src/components/layout/Sidebar.jsx`, add:

```jsx
{
  label: "د فیس مدیریت",
  icon: <Wallet className="size-4" />,
  path: "/revenue",
}
```

---

## 💡 UI Components Needed

### 1. Fee Payment Form
- Student selector (dropdown or search)
- Enrollment type selector
- Month picker (Shamsi calendar)
- Amount input
- Payment date picker
- Notes textarea
- Submit button

### 2. Fee Payment List
- DataTable with columns:
  - Receipt Number
  - Student Name
  - Enrollment Type
  - Amount
  - Paid
  - Remaining
  - Status (badge)
  - Date
  - Actions (view, edit, delete, print receipt)
- Filters:
  - Search
  - Status
  - Enrollment Type
  - Month
  - Date Range
- Pagination
- Export buttons (Excel, PDF)

### 3. Fee Statistics Dashboard
- Total Collected (this month)
- Total Due (this month)
- Unpaid Fees Count
- Status Breakdown (Paid, Partial, Unpaid)
- Enrollment Type Breakdown
- Recent Payments List

### 4. Receipt Preview/Print
- School header
- Receipt number
- Student details
- Payment details
- Amount in words
- Collector signature
- Print button

---

## 🎯 Payment Status Logic

```javascript
// Automatic status calculation
if (paidAmount >= totalAmount) {
  status = "Paid";
} else if (paidAmount > 0) {
  status = "Partial";
} else {
  status = "Unpaid";
}
```

---

## 📝 Validation Rules

### Create Fee Payment
- `studentIds`: Required, array of integers
- `enrollmentType`: Required, one of: School, Center, Madrasa
- `month`: Required, format: YYYY-MM
- `academicYear`: Required, string
- `paidAmount`: Required, number >= 0
- `date`: Required, format: YYYY-MM-DD
- `notes`: Optional, string

### Update Fee Payment
- `paidAmount`: Required, number >= 0
- `notes`: Optional, string

---

## 🔐 Permissions

All fee endpoints require authentication. Role-based access:
- **Admin**: Full access
- **Accountant**: Full access
- **Registrar**: Read-only access
- **Teacher**: No access

---

## 📊 Receipt Number Format

```
RCP-YYYYMMDD-XXXX

Example: RCP-20240115-0001
```

- `RCP`: Receipt prefix
- `YYYYMMDD`: Date (2024-01-15)
- `XXXX`: Sequential number (0001, 0002, etc.)

---

## 🎨 Status Badge Colors

```jsx
<Badge variant={
  status === "Paid" ? "success" : 
  status === "Partial" ? "warning" : 
  "destructive"
}>
  {status}
</Badge>
```

---

## 📱 Mobile Responsive

Ensure fee management UI works on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

## 🧪 Testing Checklist

- [ ] Create fee payment for single student
- [ ] Create fee payment for multiple students
- [ ] Update fee payment (partial payment)
- [ ] Delete fee payment
- [ ] Search by student name
- [ ] Search by receipt number
- [ ] Filter by status
- [ ] Filter by enrollment type
- [ ] Filter by month
- [ ] Filter by date range
- [ ] View fee statistics
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Generate single receipt
- [ ] Generate multiple receipts
- [ ] Pagination works
- [ ] Validation errors display
- [ ] Success messages display
- [ ] Error handling works

---

## 🚀 Quick Start

1. Backend is ready - just start the server
2. Create `revenue.jsx` page
3. Import `feeApi.js` (already created)
4. Add route to router
5. Add to sidebar
6. Test all features

---

**Estimated Time:** 4-5 hours
**Difficulty:** Medium
**Priority:** High

---

**Last Updated:** 2024
**Status:** Backend Complete, Frontend Pending

# Fee Management API Documentation

## Overview
Complete Fee Management System for School Management with support for multiple enrollment types (School, Center, Madrasa), receipt generation, and comprehensive reporting.

## Base URL
```
/api/fees
```

## Authentication
All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Get All Fee Payments
**GET** `/`

Retrieve paginated list of fee payments with filtering and search capabilities.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Records per page (default: 10, max: 100) |
| search | string | No | Search by student name or receipt number |
| academicYear | string | No | Filter by academic year (YYYY format) |
| enrollmentType | string | No | Filter by enrollment type (School/Center/Madrasa) |
| status | string | No | Filter by payment status (Paid/Partial/Unpaid) |
| month | string | No | Filter by month (YYYY-MM format) |
| startDate | string | No | Filter by date range start (YYYY-MM-DD) |
| endDate | string | No | Filter by date range end (YYYY-MM-DD) |

#### Response
```json
{
  "success": true,
  "message": "د فیس پیسو معلومات ترلاسه شول",
  "data": {
    "payments": [
      {
        "id": 1,
        "receiptNo": "RCP-20241221-0001",
        "studentId": 123,
        "studentName": "احمد علی",
        "fatherName": "محمد علی",
        "enrollmentType": "School",
        "month": "2024-12",
        "academicYear": "1403",
        "amount": 1000,
        "paid": 1000,
        "remaining": 0,
        "status": "Paid",
        "date": "2024-12-21",
        "collectedBy": "Admin User",
        "notes": null,
        "createdAt": "2024-12-21T10:30:00Z"
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

---

### 2. Get Fee Payment by ID
**GET** `/:id`

Retrieve detailed information about a specific fee payment.

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Fee payment ID |

#### Response
```json
{
  "success": true,
  "message": "د فیس پیسو معلومات ترلاسه شول",
  "data": {
    "payment": {
      "id": 1,
      "receiptNo": "RCP-20241221-0001",
      "studentId": 123,
      "studentName": "احمد علی",
      "fatherName": "محمد علی",
      "enrollmentType": "School",
      "month": "2024-12",
      "academicYear": "1403",
      "amount": 1000,
      "paid": 1000,
      "remaining": 0,
      "status": "Paid",
      "date": "2024-12-21",
      "collectedBy": "Admin User",
      "notes": null,
      "createdAt": "2024-12-21T10:30:00Z"
    }
  }
}
```

---

### 3. Get Student for Fee Form
**GET** `/student/:id`

Retrieve student information for fee payment form, including enrollment details and fee amounts.

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Student ID |

#### Response
```json
{
  "success": true,
  "message": "د زده کوونکي معلومات ترلاسه شول",
  "data": {
    "student": {
      "id": 123,
      "fullName": "احمد علی",
      "fatherName": "محمد علی",
      "classId": 5,
      "className": "Grade 10",
      "section": "A",
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

---

### 4. Get Students by Filters
**GET** `/students`

Retrieve list of students filtered by enrollment type and class for fee payment form.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by enrollment type (School/Center/Madrasa) |
| classId | integer | No | Filter by class ID |

#### Response
```json
{
  "success": true,
  "message": "زده کوونکي ترلاسه شول",
  "data": {
    "students": [
      {
        "id": 123,
        "fullName": "احمد علی",
        "fatherName": "محمد علی",
        "classId": 5,
        "className": "Grade 10",
        "section": "A",
        "academicYear": "1403"
      }
    ]
  }
}
```

---

### 5. Create Fee Payment
**POST** `/`

Create new fee payment(s) for one or multiple students.

#### Request Body
```json
{
  "studentIds": [123, 124, 125],
  "enrollmentType": "School",
  "month": "2024-12",
  "academicYear": "1403",
  "paidAmount": 1000,
  "date": "2024-12-21",
  "notes": "Monthly fee payment"
}
```

#### Validation Rules
- `studentIds`: Array of student IDs (required, min: 1)
- `enrollmentType`: Must be "School", "Center", or "Madrasa" (required)
- `month`: Format YYYY-MM (required)
- `academicYear`: 4-digit year (required)
- `paidAmount`: Positive number (required)
- `date`: Format YYYY-MM-DD (required)
- `notes`: Optional, max 500 characters

#### Response
```json
{
  "success": true,
  "message": "فیس بریالیتوب سره ورکړل شو",
  "data": {
    "payments": [
      {
        "id": 1,
        "receiptNo": "RCP-20241221-0001",
        "studentId": 123,
        "enrollmentType": "School",
        "month": "2024-12",
        "academicYear": "1403",
        "amount": 1000,
        "paid": 1000,
        "status": "Paid",
        "date": "2024-12-21",
        "collectedBy": 1,
        "notes": "Monthly fee payment"
      }
    ],
    "count": 3
  }
}
```

---

### 6. Update Fee Payment
**PUT** `/:id`

Update an existing fee payment (typically to adjust paid amount).

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Fee payment ID |

#### Request Body
```json
{
  "paidAmount": 800,
  "notes": "Partial payment - remaining next month"
}
```

#### Response
```json
{
  "success": true,
  "message": "د فیس پیسو معلومات افډیټ شول",
  "data": {
    "payment": {
      "id": 1,
      "receiptNo": "RCP-20241221-0001",
      "studentId": 123,
      "enrollmentType": "School",
      "month": "2024-12",
      "academicYear": "1403",
      "amount": 1000,
      "paid": 800,
      "status": "Partial",
      "date": "2024-12-21",
      "collectedBy": 1,
      "notes": "Partial payment - remaining next month",
      "updatedAt": "2024-12-21T11:00:00Z"
    }
  }
}
```

---

### 7. Delete Fee Payment
**DELETE** `/:id`

Delete a fee payment record.

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Fee payment ID |

#### Response
```json
{
  "success": true,
  "message": "د فیس پیسو معلومات ډیلیټ شول"
}
```

---

### 8. Get Fee Statistics
**GET** `/statistics`

Retrieve comprehensive fee statistics for the current month.

#### Response
```json
{
  "success": true,
  "message": "د فیس احصایې ترلاسه شوې",
  "data": {
    "thisMonth": {
      "totalCollected": 50000,
      "totalDue": 60000,
      "totalPayments": 45,
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
        "totalAmount": 20000,
        "totalPaid": 15000
      },
      {
        "status": "Unpaid",
        "count": 5,
        "totalAmount": 10000,
        "totalPaid": 0
      }
    ],
    "enrollmentBreakdown": [
      {
        "enrollmentType": "School",
        "count": 35,
        "totalCollected": 35000
      },
      {
        "enrollmentType": "Center",
        "count": 10,
        "totalCollected": 15000
      }
    ],
    "recentPayments": [
      {
        "id": 1,
        "receiptNo": "RCP-20241221-0001",
        "studentName": "احمد علی",
        "amount": 1000,
        "date": "2024-12-21",
        "status": "Paid"
      }
    ]
  }
}
```

---

### 9. Export Fee Payments
**GET** `/export`

Export fee payments data in Excel or PDF format with applied filters.

#### Query Parameters
Same as "Get All Fee Payments" plus:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | No | Export format: "excel" or "pdf" (default: excel) |

#### Response
- **Excel Format**: Returns Excel file as binary data
- **PDF Format**: Returns PDF file as binary data

#### Headers
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (Excel)
Content-Type: application/pdf (PDF)
Content-Disposition: attachment; filename=fee-payments-[timestamp].xlsx
```

---

### 10. Generate Receipt PDF
**GET** `/:id/receipt`

Generate and download PDF receipt for a specific fee payment.

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Fee payment ID |

#### Response
Returns PDF file as binary data with receipt details in both English and Pashto.

#### Headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=receipt-[receiptNo].pdf
```

---

### 11. Generate Multiple Receipts PDF
**POST** `/receipts/multiple`

Generate PDF file containing multiple receipts for batch printing.

#### Request Body
```json
{
  "paymentIds": [1, 2, 3, 4, 5]
}
```

#### Response
Returns PDF file containing all requested receipts.

#### Headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=receipts-[timestamp].pdf
```

---

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "paidAmount",
      "message": "ورکړل شوی فیس باید مثبت عدد وي"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "د فیس پیسو معلومات ونه موندل شول"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Business Logic

### Fee Calculation
1. System first checks for enrollment-specific monthly fee
2. If not found, falls back to class-level monthly fee
3. If no fee is set, throws error

### Payment Status Logic
- **Paid**: `paidAmount >= totalAmount`
- **Partial**: `0 < paidAmount < totalAmount`
- **Unpaid**: `paidAmount = 0`

### Receipt Number Generation
Format: `RCP-YYYYMMDD-NNNN`
- RCP: Receipt prefix
- YYYYMMDD: Current date
- NNNN: Sequential number for the day (0001, 0002, etc.)

### Duplicate Prevention
System prevents duplicate payments for the same student, enrollment type, month, and academic year combination.

---

## Integration Notes

### Frontend Integration
1. Use statistics endpoint for dashboard cards
2. Implement AG-Grid with server-side pagination using the main GET endpoint
3. Use student endpoints for form dropdowns and auto-fill
4. Handle file downloads for exports and receipts
5. Show loading states during PDF generation

### Afghan Calendar Integration
- Month parameter should be converted from Afghan calendar to Gregorian format
- Display should convert back to Afghan calendar for user interface
- Academic year follows Afghan calendar system

### Print Integration
- Receipt PDFs are optimized for small thermal printers
- Multiple receipts PDF supports A4 printing
- Export PDFs are formatted for landscape orientation
# Attendance Download Feature - Implementation Summary

## Overview
Added Excel and PDF download functionality for attendance reports with filtering options for both student and staff attendance.

## Changes Made

### Backend Changes

#### 1. New Utility File: `backend/src/utils/attendanceExport.util.js`
- **generateExcelReport()**: Creates Excel files with attendance data using ExcelJS
  - Includes headers, filters, statistics, and color-coded status cells
  - Supports both student and staff attendance formats
  
- **generatePDFReport()**: Creates PDF files with attendance data using PDFKit
  - Professional layout with headers, tables, and statistics
  - Automatic page breaks for large datasets

#### 2. Updated Controller: `backend/src/controllers/attendance/attendance.controller.js`
- Added `downloadAttendanceReport()` endpoint
  - Accepts query parameters: attendanceType, institutionType, classId, startDate, endDate, format
  - Validates required fields
  - Fetches attendance records with date range filtering
  - Enriches data with person details (names, positions, etc.)
  - Generates Excel or PDF based on format parameter
  - Returns file as downloadable attachment

#### 3. Updated Route: `backend/src/routes/attendance/attendance.route.js`
- Added GET route: `/attendance/download/report`
- Public route (no authentication required for downloads)

#### 4. Updated API Client: `Client/src/data/attendanceApi.js`
- Added `downloadAttendanceReport()` function
- Exports function for frontend use

### Frontend Changes

#### 1. Student Attendance Page: `Client/src/routes/attendance-students.jsx`

**New State Variables:**
- `downloadInstitutionType`: Selected institution for download
- `downloadClassId`: Selected class for download
- `reportPeriod`: Daily, Monthly, or Yearly
- `reportStartDate`: Report start date
- `reportEndDate`: Report end date
- `downloading`: Loading state for downloads

**New Constants:**
- `REPORT_PERIODS`: Array of period options (daily, monthly, yearly)

**New Functions:**
- `handleDownload(format)`: Handles Excel/PDF download requests
- `useEffect` hook: Auto-updates date range based on selected period

**New UI Section:**
- Download Report card with:
  - Institution type selector
  - Class selector
  - Report period selector (daily/monthly/yearly)
  - Custom date range inputs
  - Excel download button (green)
  - PDF download button (red)

#### 2. Staff Attendance Page: `Client/src/routes/attendance-staff.jsx`

**New State Variables:**
- `reportPeriod`: Daily, Monthly, or Yearly
- `reportStartDate`: Report start date
- `reportEndDate`: Report end date
- `downloading`: Loading state for downloads

**New Constants:**
- `REPORT_PERIODS`: Array of period options

**New Functions:**
- `handleDownload(format)`: Handles Excel/PDF download requests
- `useEffect` hook: Auto-updates date range based on selected period

**New UI Section:**
- Download Report card with:
  - Report period selector
  - Start date input
  - End date input
  - Excel download button
  - PDF download button

## Features

### Student Attendance Download
1. **Filters:**
   - Institution Type (School/Center/Madrasa)
   - Class selection
   - Date range (daily/monthly/yearly or custom)

2. **Report Contents:**
   - Student name, father name, roll number
   - Attendance date and status
   - Attendance method (Manual/QR)
   - Statistics (total, present, absent, leave)

### Staff Attendance Download
1. **Filters:**
   - Date range (daily/monthly/yearly or custom)

2. **Report Contents:**
   - Staff name, father name, position
   - Attendance date and status
   - Attendance method (Manual/QR)
   - Statistics (total, present, absent, leave)

## File Formats

### Excel (.xlsx)
- Professional formatting with headers
- Color-coded status cells:
  - Green: Present
  - Red: Absent
  - Yellow: Leave
- Auto-sized columns
- Filter information at top
- Statistics summary

### PDF (.pdf)
- Clean, printable layout
- Table format with headers
- Statistics summary
- Generation timestamp in footer
- Automatic pagination for large datasets

## Usage

### For Students:
1. Navigate to Student Attendance page
2. Scroll to "د حاضرۍ راپور ډاونلوډ" section
3. Select institution type, class, and date range
4. Click "Excel ډاونلوډ" or "PDF ډاونلوډ"
5. File downloads automatically

### For Staff:
1. Navigate to Staff Attendance page
2. Scroll to "د حاضرۍ راپور ډاونلوډ" section
3. Select date range (daily/monthly/yearly)
4. Click "Excel ډاونلوډ" or "PDF ډاونلوډ"
5. File downloads automatically

## API Endpoint

```
GET /api/v1/attendance/download/report
```

**Query Parameters:**
- `attendanceType` (required): "Student" or "Staff"
- `startDate` (required): YYYY-MM-DD format
- `endDate` (required): YYYY-MM-DD format
- `format` (required): "excel" or "pdf"
- `institutionType` (required for students): "School", "Center", or "Madrasa"
- `classId` (required for students): Class ID number

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)
- Content-Type: `application/pdf` (PDF)
- Content-Disposition: `attachment; filename="attendance_[type]_[dates].[ext]"`

## Dependencies Used

### Backend:
- **exceljs**: ^4.4.0 (already installed)
- **pdfkit**: ^0.18.0 (already installed)

### Frontend:
- **lucide-react**: Download, FileSpreadsheet, FileText icons
- **sonner**: Toast notifications

## Notes

1. **No Authentication Required**: Download endpoint is public for easy access
2. **Date Range Validation**: Backend validates that dates are in correct format
3. **Class Validation**: For students, both institution type and class are required
4. **Auto Date Ranges**: 
   - Daily: Today's date
   - Monthly: Current month (1st to last day)
   - Yearly: Current year (Jan 1 to Dec 31)
5. **File Naming**: Files are named with pattern: `attendance_[type]_[startDate]_[endDate].[ext]`
6. **Error Handling**: Toast notifications for validation errors and download failures
7. **Loading States**: Buttons show loading spinner during download process

## Testing Checklist

- [ ] Student attendance Excel download with all filters
- [ ] Student attendance PDF download with all filters
- [ ] Staff attendance Excel download with date ranges
- [ ] Staff attendance PDF download with date ranges
- [ ] Daily period auto-sets today's date
- [ ] Monthly period auto-sets current month range
- [ ] Yearly period auto-sets current year range
- [ ] Custom date range selection works
- [ ] Validation errors show toast notifications
- [ ] Download buttons disable during download
- [ ] Files download with correct names
- [ ] Excel files have proper formatting and colors
- [ ] PDF files have proper layout and pagination
- [ ] Statistics are calculated correctly
- [ ] Person details (names, positions) appear correctly

# Report Card (اطلاع نامه) Implementation Guide

## Overview
Complete implementation of the Report Card (اطلاع نامه) download system for school exams with support for:
- **Single student** report card download
- **Multiple selected students** report card download  
- **Entire class** report card download
- **Two exam types**: First Term (څلور میاشتنی) and Annual (کلنی)

## Features Implemented

### 1. Backend API (`backend/src/controllers/report-card/report-card.controller.js`)
Two main endpoints:

#### GET `/api/v1/report-cards/student`
Fetches report card data for a single student.

**Query Parameters:**
- `studentId` (required): Student ID
- `examType` (required): "FirstTerm" or "Annual"
- `academicYear` (required): Academic year (e.g., "1403")

**Response:**
```json
{
  "success": true,
  "message": "د زده کوونکي اطلاع نامه ترلاسه شوه",
  "data": {
    "student": { "id", "rollNumber", "fullName", "fatherName", "image" },
    "class": { "name", "section" },
    "academicYear": "1403",
    "examType": "FirstTerm",
    "subjects": [
      {
        "subjectId": 1,
        "subjectName": "ریاضی",
        "firstTerm": { "obtainedMarks": 85, "totalMarks": 100, "passingMarks": 40, "status": "Pass" },
        "annual": { "obtainedMarks": 90, "totalMarks": 100, "passingMarks": 40, "status": "Pass" }
      }
    ],
    "summary": {
      "firstTermTotal": 500,
      "firstTermObtained": 425,
      "annualTotal": 500,
      "annualObtained": 450,
      "grandTotal": 1000,
      "grandObtained": 875,
      "percentage": 87.5,
      "grade": "A",
      "status": "Pass"
    }
  }
}
```

#### GET `/api/v1/report-cards/class`
Fetches report cards for all students in a class.

**Query Parameters:**
- `classId` (required): Class ID
- `examType` (required): "FirstTerm" or "Annual"
- `academicYear` (required): Academic year

**Response:**
```json
{
  "success": true,
  "message": "د ټولګي اطلاع نامې ترلاسه شوې",
  "data": {
    "class": { "name": "۱۰ ټولګی", "section": "الف" },
    "academicYear": "1403",
    "examType": "Annual",
    "reportCards": [
      {
        "student": { ... },
        "subjects": [ ... ],
        "summary": { ... }
      }
    ]
  }
}
```

### 2. Frontend Components

#### Report Card Component (`Client/src/components/erp/ReportCard.jsx`)
React component that renders a beautifully formatted Afghan school report card with:
- **Header**: Two logos (pic1.jpg, pic2.jpg), school name, and title
- **Student Information**: Name, father name, class, roll number, academic year, photo
- **Marks Table**: 
  - For First Term: Shows subject name, total marks, obtained marks, status
  - For Annual: Shows subject name, first term marks, annual marks, combined total
- **Summary Section**: Percentage, grade, overall status
- **Grading Scale**: A+ to F scale display
- **Footer**: Signature lines for teacher, principal, and parent

#### Report Cards Page (`Client/src/routes/report-cards.jsx`)
Full-featured page with:
- **Filters**: Academic year, class selection, exam type selection
- **Student List**: Checkbox selection with "Select All" option
- **Download Options**:
  - Download single student report card
  - Download selected students (bulk)
  - Download entire class
- **Loading States**: Individual and bulk loading indicators
- **Error Handling**: Toast notifications for success/error

### 3. PDF Generation (`Client/src/utils/reportCardPdf.js`)
Utility functions for generating PDFs:
- `generateSingleReportCardPDF()`: Creates PDF for one student
- `generateMultipleReportCardsPDF()`: Creates multi-page PDF for multiple students
- Uses `html2canvas` and `jsPDF` for high-quality PDF generation
- Preloads images to ensure proper rendering
- A4 portrait format

### 4. API Client (`Client/src/data/reportCardApi.js`)
Frontend API wrapper functions:
- `getStudentReportCard(studentId, examType, academicYear)`
- `getClassReportCards(classId, examType, academicYear)`

## Report Card Layout

### First Term Report (څلور میاشتنی امتحان)
```
┌─────────────────────────────────────────────────┐
│  [Logo 1]    School Name & Title    [Logo 2]   │
├─────────────────────────────────────────────────┤
│  Student Info (Name, Father, Class, Roll No)   │
│                                        [Photo]  │
├─────────────────────────────────────────────────┤
│  No. │ Subject │ Total │ Obtained │ Status     │
│   1  │ ریاضی   │  100  │    85    │  بریالی    │
│   2  │ پښتو    │  100  │    90    │  بریالی    │
│  ... │   ...   │  ...  │   ...    │   ...      │
│ Total│         │  500  │   425    │            │
├─────────────────────────────────────────────────┤
│  Percentage: 85% │ Grade: A │ Status: بریالی   │
├─────────────────────────────────────────────────┤
│  Grading Scale: A+ (90-100%) ... F (0-49%)     │
├─────────────────────────────────────────────────┤
│  Teacher Sign │ Principal Sign │ Parent Sign   │
└─────────────────────────────────────────────────┘
```

### Annual Report (کلنی امتحان)
```
┌──────────────────────────────────────────────────────┐
│  [Logo 1]    School Name & Title    [Logo 2]        │
├──────────────────────────────────────────────────────┤
│  Student Info (Name, Father, Class, Roll No)        │
│                                           [Photo]    │
├──────────────────────────────────────────────────────┤
│  No. │ Subject │ First Term │ Annual │ Total        │
│   1  │ ریاضی   │   85/100   │ 90/100 │  175/200    │
│   2  │ پښتو    │   90/100   │ 95/100 │  185/200    │
│  ... │   ...   │    ...     │  ...   │   ...       │
│ Total│         │  425/500   │450/500 │  875/1000   │
├──────────────────────────────────────────────────────┤
│  Percentage: 87.5% │ Grade: A │ Status: بریالی      │
├──────────────────────────────────────────────────────┤
│  Grading Scale: A+ (90-100%) ... F (0-49%)          │
├──────────────────────────────────────────────────────┤
│  Teacher Sign │ Principal Sign │ Parent Sign        │
└──────────────────────────────────────────────────────┘
```

## Grading System
- **A+**: 90-100%
- **A**: 80-89%
- **B**: 70-79%
- **C**: 60-69%
- **D**: 50-59%
- **F**: 0-49%

## Usage

### Access the Report Cards Page
Navigate to: `/marks/itla-nama`

### Download Process
1. **Select Academic Year**: Enter the academic year (e.g., 1403)
2. **Select Class**: Choose the class from dropdown
3. **Select Exam Type**: Choose "څلور میاشتنی امتحان" or "کلنی امتحان"
4. **Download Options**:
   - Click "ډاونلوډ" next to a student for single download
   - Check multiple students and click "غوره شوې" for selected download
   - Click "ټولې" to download all students in the class

### PDF File Names
- Single: `اطلاع_نامه_[StudentName]_[ExamType].pdf`
- Multiple: `اطلاع_نامې_[ClassName]_[ExamType].pdf`

## Technical Details

### Dependencies Required
- `html2canvas`: For converting React components to canvas
- `jspdf`: For PDF generation
- Already installed in your project

### Image Requirements
- **pic1.jpg**: Left logo (100x100px recommended)
- **pic2.jpg**: Right logo (100x100px recommended)
- Located in: `Client/public/`

### Fonts
- Uses **Amiri** font for Pashto/Dari text
- Font files already present in `Client/public/`

### Performance
- Single report card: ~2-3 seconds
- Multiple report cards: ~2-3 seconds per card
- Optimized with image preloading
- Progress indication during generation

## Data Flow

```
User selects filters → Frontend calls API
                              ↓
                    Backend fetches data:
                    - Student info
                    - Class info
                    - Exam marks (First Term / Annual)
                    - Subject configurations
                              ↓
                    Backend calculates:
                    - Totals per exam
                    - Grand totals
                    - Percentage
                    - Grade
                    - Overall status
                              ↓
                    Returns structured data
                              ↓
Frontend receives data → Renders ReportCard component
                              ↓
                    Converts to canvas (html2canvas)
                              ↓
                    Generates PDF (jsPDF)
                              ↓
                    Downloads to user's device
```

## Error Handling
- Missing data validation
- Image loading fallbacks
- Toast notifications for all operations
- Loading states for better UX
- Graceful degradation if images fail to load

## Future Enhancements (Optional)
1. Add rank/position in class
2. Add attendance percentage
3. Add teacher comments section
4. Add QR code for verification
5. Add school seal/stamp
6. Export to Excel format
7. Email report cards to parents
8. Print preview before download

## Testing Checklist
- [ ] Backend API returns correct data for single student
- [ ] Backend API returns correct data for entire class
- [ ] First Term report shows only first term marks
- [ ] Annual report shows both exams with combined totals
- [ ] Percentage calculation is accurate
- [ ] Grade assignment is correct
- [ ] Pass/Fail status is accurate
- [ ] PDF downloads successfully
- [ ] Multiple PDFs generate correctly
- [ ] Images (logos, student photos) display properly
- [ ] Pashto/Dari text renders correctly
- [ ] Loading states work properly
- [ ] Error messages display correctly

## Notes
- Only works for **School** institution type (not Center or Madrasa)
- Requires completed exam marks entry
- Requires exam subject configuration to be set
- Students must be enrolled in the class
- Academic year must match exam data

## Support
For issues or questions, check:
1. Backend logs: `backend/logs/combined.log`
2. Browser console for frontend errors
3. Network tab for API call issues
4. Ensure all marks are entered before generating reports

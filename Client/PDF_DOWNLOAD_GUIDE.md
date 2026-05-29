# PDF Download System - Usage Guide

## Overview

This guide explains how to use the reusable PDF download system for exporting data with proper Pashto formatting, headers on all pages, and loading states.

## Features

✅ **Reusable PDF Generation** - Single utility function for all PDF exports  
✅ **A4 Page Size** - Standard A4 format with portrait/landscape support  
✅ **Headers on All Pages** - School name and title appear on every page  
✅ **Loading States** - Button shows loader during PDF generation  
✅ **Filtered Data Export** - Only exports currently filtered data  
✅ **Pashto Support** - Full RTL support with Amiri font  
✅ **Filter Information** - Shows applied filters in PDF header  
✅ **Professional Styling** - Consistent theme with alternating row colors  

## File Structure

```
Client/src/
├── utils/
│   └── pdfDownload.js          # Main PDF utility (NEW)
├── components/erp/
│   └── PdfDownloadButton.jsx   # Reusable button component (NEW)
└── routes/
    ├── teachers.jsx             # Updated to use new system
    ├── classes.jsx              # Updated to use new system
    └── students.jsx             # Can be updated similarly
```

## Quick Start

### 1. Basic Usage with Pre-configured Functions

For common sections (teachers, applicants, classes), use the pre-configured export functions:

```javascript
import { exportTeachersPDF, exportApplicantsPDF, exportClassesPDF } from "@/utils/pdfDownload";
import { PdfDownloadButton } from "@/components/erp/PdfDownloadButton";
import { toast } from "sonner";

// In your component
const [pdfLoading, setPdfLoading] = useState(false);

const handleDownloadPDF = async () => {
  try {
    setPdfLoading(true);
    
    // Fetch all data (including filtered)
    const response = await fetchAllData({ ...filters, limit: 10000 });
    const data = response.data.items || [];
    
    if (!data.length) {
      toast.error("د صادرولو لپاره هیڅ معلومات شتون نلري");
      return;
    }
    
    // Export to PDF
    await exportTeachersPDF(data, filters, EDU_LABEL);
    toast.success(`${data.length} ریکارډونه بریالیتوب سره صادر شول`);
    
  } catch (error) {
    toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
  } finally {
    setPdfLoading(false);
  }
};

// In your JSX
<PdfDownloadButton 
  onDownload={handleDownloadPDF}
  label="PDF ډاونلوډ"
  loadingLabel="ډاونلوډ کیږي..."
/>
```

### 2. Custom PDF Export

For custom data structures, use the generic `downloadPDF` function:

```javascript
import { downloadPDF } from "@/utils/pdfDownload";

const handleCustomPDF = async () => {
  const columns = [
    { 
      header: "#", 
      field: "index", 
      width: 22, 
      align: "center", 
      format: (_, __, i) => i + 1 
    },
    { 
      header: "نوم", 
      field: "name", 
      width: "*" 
    },
    { 
      header: "معاش (؋)", 
      field: "salary", 
      width: 80,
      format: (val) => val ? Number(val).toLocaleString() : "—"
    },
  ];

  const filterConfig = {
    name: "نوم",
    department: "څانګه",
    year: "کال",
  };

  await downloadPDF({
    data: myData,
    columns: columns,
    title: "زما لیست",
    filename: "my-export",
    orientation: "portrait", // or "landscape"
    filters: appliedFilters,
    filterConfig: filterConfig,
  });
};
```

## Component API

### PdfDownloadButton

Main button component with loading state:

```javascript
<PdfDownloadButton 
  onDownload={async () => { /* your download logic */ }}
  label="PDF ډاونلوډ"              // Button text
  loadingLabel="ډاونلوډ کیږي..."    // Loading text
  variant="outline"                 // 'primary' | 'secondary' | 'outline'
  size="sm"                         // 'sm' | 'md' | 'lg'
  disabled={false}                  // Disable button
  className=""                      // Additional CSS classes
/>
```

### PdfDownloadIconButton

Compact icon-only button for toolbars:

```javascript
<PdfDownloadIconButton 
  onDownload={async () => { /* your download logic */ }}
  title="PDF ډاونلوډ"
  disabled={false}
  className=""
/>
```

## downloadPDF Options

### Required Parameters

- **data** `Array` - Array of objects to export
- **columns** `Array` - Column definitions (see below)
- **title** `string` - Document title in Pashto

### Optional Parameters

- **filename** `string` - Output filename without extension (default: "export")
- **orientation** `string` - "portrait" or "landscape" (default: "portrait")
- **filters** `Object` - Applied filters to show in header
- **filterConfig** `Object` - Filter label translations

### Column Definition

Each column object can have:

```javascript
{
  header: "ستن سرلیک",           // Column header (required)
  field: "fieldName",            // Data field name (required)
  width: "*" | 100,              // Column width: "*" for auto, number for fixed
  align: "right" | "center" | "left",  // Text alignment (default: "right")
  format: (value, item, index) => {    // Custom formatter function
    return formattedValue;
  }
}
```

## Column Width Guidelines

- Use `"*"` for flexible columns that share remaining space
- Use numbers for fixed-width columns (in points)
- Common widths:
  - Index column: `22`
  - Phone numbers: `85`
  - Dates: `82`
  - ID numbers: `72`
  - Names: `"*"`

## Examples

### Example 1: Teachers Export

```javascript
const handleExportTeachers = async () => {
  try {
    setPdfLoading(true);
    
    // Fetch filtered data
    const response = await teacherApi.getAllTeachers({ 
      ...filters, 
      page: 1, 
      limit: 10000 
    });
    
    const teachers = response.data.teachers || [];
    
    if (!teachers.length) {
      toast.error("د صادرولو لپاره هیڅ ښوونکی شتون نلري");
      return;
    }
    
    // Export with filters
    await exportTeachersPDF(teachers, filters, EDU_LABEL);
    toast.success(`${teachers.length} ښوونکي بریالیتوب سره صادر شول`);
    
  } catch (error) {
    toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
  } finally {
    setPdfLoading(false);
  }
};
```

### Example 2: Custom Student Export

```javascript
const handleExportStudents = async () => {
  const columns = [
    { 
      header: "#", 
      field: "rollNumber", 
      width: 30, 
      align: "center" 
    },
    { 
      header: "نوم", 
      field: "fullName", 
      width: "*" 
    },
    { 
      header: "د پلار نوم", 
      field: "fatherName", 
      width: "*" 
    },
    { 
      header: "ټولګی", 
      field: "classId", 
      width: 80 
    },
    { 
      header: "فیس (؋)", 
      field: "fees", 
      width: 70,
      format: (fees) => {
        if (!fees) return "—";
        const total = Object.values(fees).reduce((sum, val) => sum + Number(val || 0), 0);
        return total.toLocaleString();
      }
    },
  ];

  const filterConfig = {
    fullName: "نوم",
    classId: "ټولګی",
    academicYear: "تعلیمي کال",
    enrollment: "د شمولیت ډول",
  };

  await downloadPDF({
    data: students,
    columns,
    title: "د زده کوونکو لیست",
    filename: "students",
    orientation: "landscape",
    filters: currentFilters,
    filterConfig,
  });
};
```

### Example 3: With Nested Fields

```javascript
const columns = [
  { 
    header: "نوم", 
    field: "user.name",  // Nested field
    width: "*" 
  },
  { 
    header: "څانګه", 
    field: "department.name",  // Nested field
    width: "*" 
  },
];
```

## Integration with AgGridTable

The PDF download button is already integrated into `AgGridTable` component:

```javascript
<AgGridTable
  columnDefs={columnDefs}
  rowData={data}
  loading={loading}
  enableExport={true}
  onPdfClick={handlePdfDownload}  // Your PDF handler
  pdfLoading={pdfLoading}         // Loading state
  exportLoading={excelLoading}    // Excel loading state
/>
```

## Styling Customization

The PDF uses a consistent theme defined in `pdfDownload.js`:

```javascript
const NAVY       = "#1E3A5F";  // School name banner
const BLUE       = "#2E75B6";  // Headers and title
const LIGHT_BLUE = "#D9E2F3";  // Count badge
const ROW_EVEN   = "#EEF3FA";  // Alternating rows
const BORDER     = "#B0BEC5";  // Table borders
```

To customize, edit these constants in `Client/src/utils/pdfDownload.js`.

## Filter Display

Filters are automatically displayed in the PDF header when provided:

```javascript
await downloadPDF({
  data: myData,
  columns: columns,
  title: "لیست",
  filters: { name: "احمد", year: "1403" },
  filterConfig: { name: "نوم", year: "کال" },
});
```

This will show: `فلټر: نوم: احمد | کال: 1403`

## Error Handling

Always wrap PDF downloads in try-catch:

```javascript
const handleDownload = async () => {
  try {
    setPdfLoading(true);
    
    // Validate data
    if (!data || data.length === 0) {
      toast.error("د صادرولو لپاره هیڅ معلومات شتون نلري");
      return;
    }
    
    await downloadPDF({ /* options */ });
    toast.success("PDF بریالیتوب سره ډاونلوډ شو");
    
  } catch (error) {
    console.error("PDF download error:", error);
    toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
  } finally {
    setPdfLoading(false);
  }
};
```

## Best Practices

1. **Always fetch all filtered data** - Don't just export the current page
2. **Show loading state** - Use `pdfLoading` state with the button
3. **Validate data** - Check if data exists before exporting
4. **Show success message** - Inform user of successful export with count
5. **Handle errors gracefully** - Show user-friendly error messages
6. **Use appropriate orientation** - Landscape for wide tables, portrait for narrow
7. **Test with large datasets** - Ensure pagination works correctly
8. **Include filter info** - Show what filters were applied

## Troubleshooting

### PDF not downloading
- Check browser console for errors
- Ensure fonts are loaded (Amiri-Regular.ttf, Amiri-Bold.ttf in public folder)
- Verify data is not empty

### Text not displaying correctly
- Ensure Amiri fonts are in `/public` folder
- Check that text is in Pashto/Dari script
- Verify font files are accessible

### Headers not appearing on all pages
- This is handled automatically by pdfMake
- First page shows full header, subsequent pages show compact header

### Loading state not working
- Ensure `pdfLoading` state is properly managed
- Check that `setPdfLoading` is called in try/finally blocks

## Migration from Old System

If you're updating from the old `pdfExport.js`:

1. Import from new location:
   ```javascript
   // Old
   import { exportTeachersPdf } from "@/utils/pdfExport";
   
   // New
   import { exportTeachersPDF } from "@/utils/pdfDownload";
   ```

2. Add filters parameter:
   ```javascript
   // Old
   await exportTeachersPdf(teachers, EDU_LABEL);
   
   // New
   await exportTeachersPDF(teachers, filters, EDU_LABEL);
   ```

3. Add success toast:
   ```javascript
   await exportTeachersPDF(teachers, filters, EDU_LABEL);
   toast.success(`${teachers.length} ښوونکي بریالیتوب سره صادر شول`);
   ```

## Support

For issues or questions:
1. Check this guide first
2. Review example implementations in `teachers.jsx` and `classes.jsx`
3. Check browser console for errors
4. Verify font files are present in `/public` folder

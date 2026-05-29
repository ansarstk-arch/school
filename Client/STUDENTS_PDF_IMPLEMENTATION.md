# Students Page - PDF Download Implementation Example

This document shows how to add PDF download functionality to the students page using the new reusable system.

## Step 1: Add Imports

Add these imports to `Client/src/routes/students.jsx`:

```javascript
import { downloadPDF } from "@/utils/pdfDownload";
import { PdfDownloadButton } from "@/components/erp/PdfDownloadButton";
import { toast } from "sonner";
```

## Step 2: Add State

Add PDF loading state to your component:

```javascript
const [pdfLoading, setPdfLoading] = useState(false);
```

## Step 3: Create PDF Export Handler

Add this function to handle PDF export:

```javascript
const handleExportStudentsPDF = async () => {
  try {
    setPdfLoading(true);
    
    // Get filtered data (all pages)
    const dataToExport = filtered; // Use your filtered data
    
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("د صادرولو لپاره هیڅ زده کوونکی شتون نلري");
      return;
    }
    
    // Define columns for PDF
    const columns = [
      { 
        header: "نمبر", 
        field: "rollNumber", 
        width: 40, 
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
        width: 70 
      },
      { 
        header: "جنسیت", 
        field: "gender", 
        width: 50,
        format: (val) => val === "Male" ? "نر" : "ښځینه"
      },
      { 
        header: "ټېلیفون", 
        field: "phone", 
        width: 90 
      },
      { 
        header: "د شمولیت ډول", 
        field: "enrollments", 
        width: 100,
        format: (enrollments) => {
          if (!enrollments || !enrollments.length) return "—";
          const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
          return enrollments.map(e => TYPE_LABEL[e] || e).join("، ");
        }
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
    
    // Filter configuration for display
    const filterConfig = {
      fullName: "نوم",
      enrollment: "د شمولیت ډول",
      academicYear: "تعلیمي کال",
      classId: "ټولګی",
      gender: "جنسیت",
    };
    
    // Generate PDF
    await downloadPDF({
      data: dataToExport,
      columns: columns,
      title: "د زده کوونکو لیست",
      filename: "students",
      orientation: "landscape", // Wide table needs landscape
      filters: filters, // Current applied filters
      filterConfig: filterConfig,
    });
    
    toast.success(`${dataToExport.length} زده کوونکي بریالیتوب سره صادر شول`);
    
  } catch (error) {
    console.error("PDF export error:", error);
    toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
  } finally {
    setPdfLoading(false);
  }
};
```

## Step 4: Add Button to UI

Replace the existing "صادرول" button in the PageHeader actions:

```javascript
<PageHeader 
  title="زده کوونکي" 
  subtitle="د زده کوونکو لیست او اداره"
  actions={
    <>
      <PdfDownloadButton 
        onDownload={handleExportStudentsPDF}
        label="PDF ډاونلوډ"
        loadingLabel="ډاونلوډ کیږي..."
        variant="outline"
        size="sm"
      />
      <button 
        onClick={() => printElement(tableRef.current)} 
        className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5"
      >
        <Printer className="size-3.5" /> چاپ
      </button>
      <button 
        onClick={openNew} 
        className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"
      >
        <Plus className="size-3.5" /> نوی زده کوونکی
      </button>
    </>
  }
/>
```

## Complete Example

Here's the complete implementation for students page:

```javascript
import { PageHeader } from "@/components/erp/PageHeader";
import { DataTable } from "@/components/erp/DataTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { PdfDownloadButton } from "@/components/erp/PdfDownloadButton";
import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Printer } from "lucide-react";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { SESSIONS, ACTIVE_SESSION } from "@/constants";
import { currentShamsiYear } from "@/lib/afghan-date";
import { printElement } from "@/lib/print";
import { downloadPDF } from "@/utils/pdfDownload";
import { toast } from "sonner";

// ... (rest of your existing code)

export default function StudentsPage() {
  // ... (existing state)
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // ... (existing functions)
  
  const handleExportStudentsPDF = async () => {
    try {
      setPdfLoading(true);
      
      if (!filtered || filtered.length === 0) {
        toast.error("د صادرولو لپاره هیڅ زده کوونکی شتون نلري");
        return;
      }
      
      const columns = [
        { header: "نمبر", field: "rollNumber", width: 40, align: "center" },
        { header: "نوم", field: "fullName", width: "*" },
        { header: "د پلار نوم", field: "fatherName", width: "*" },
        { header: "ټولګی", field: "classId", width: 70 },
        { 
          header: "جنسیت", 
          field: "gender", 
          width: 50,
          format: (val) => val === "Male" ? "نر" : "ښځینه"
        },
        { header: "ټېلیفون", field: "phone", width: 90 },
        { 
          header: "د شمولیت ډول", 
          field: "enrollments", 
          width: 100,
          format: (enrollments) => {
            if (!enrollments || !enrollments.length) return "—";
            const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
            return enrollments.map(e => TYPE_LABEL[e] || e).join("، ");
          }
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
        enrollment: "د شمولیت ډول",
        academicYear: "تعلیمي کال",
        classId: "ټولګی",
        gender: "جنسیت",
      };
      
      await downloadPDF({
        data: filtered,
        columns: columns,
        title: "د زده کوونکو لیست",
        filename: "students",
        orientation: "landscape",
        filters: filters,
        filterConfig: filterConfig,
      });
      
      toast.success(`${filtered.length} زده کوونکي بریالیتوب سره صادر شول`);
      
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <PageHeader 
        title="زده کوونکي" 
        subtitle="د زده کوونکو لیست او اداره"
        actions={
          <>
            <PdfDownloadButton 
              onDownload={handleExportStudentsPDF}
              label="PDF ډاونلوډ"
              loadingLabel="ډاونلوډ کیږي..."
              variant="outline"
              size="sm"
            />
            <button 
              onClick={() => printElement(tableRef.current)} 
              className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5"
            >
              <Printer className="size-3.5" /> چاپ
            </button>
            <button 
              onClick={openNew} 
              className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus className="size-3.5" /> نوی زده کوونکی
            </button>
          </>
        }
      />
      
      {/* ... rest of your component */}
    </div>
  );
}
```

## Key Points

1. **Filtered Data**: The PDF exports only the currently filtered data (`filtered` array)
2. **Loading State**: Button shows spinner during PDF generation
3. **Custom Formatting**: Use `format` function for complex fields (enrollments, fees, gender)
4. **Landscape Orientation**: Wide tables work better in landscape mode
5. **Filter Display**: Applied filters are shown in the PDF header
6. **Success Feedback**: Toast message confirms successful export with count

## Testing

1. Apply some filters (e.g., specific class, academic year)
2. Click "PDF ډاونلوډ" button
3. Verify:
   - Button shows loading state
   - Only filtered students are exported
   - PDF has headers on all pages
   - Filter information is displayed
   - All text is in Pashto
   - Success toast appears

## Customization

### Change Column Widths

Adjust the `width` property in column definitions:

```javascript
{ header: "نوم", field: "fullName", width: 150 } // Fixed width
{ header: "نوم", field: "fullName", width: "*" }  // Flexible width
```

### Add More Columns

Simply add more column definitions:

```javascript
{ 
  header: "پته", 
  field: "address", 
  width: "*" 
},
{ 
  header: "د ثبت نام فیس", 
  field: "registrationFee", 
  width: 80,
  format: (val) => val ? `AFN ${Number(val).toLocaleString()}` : "—"
},
```

### Change Orientation

For narrower tables, use portrait:

```javascript
await downloadPDF({
  // ...
  orientation: "portrait", // Instead of "landscape"
});
```

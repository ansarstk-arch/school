# CSV Export Feature Documentation

## ✅ What Was Added

### 1. Export Button in AgGridTable Component
**File:** `Client/src/components/erp/AgGridTable.jsx`

Features:
- ✅ Export button with download icon
- ✅ Pashto text: "CSV صادرول" (Export CSV)
- ✅ Disabled when loading or no data
- ✅ Positioned in the toolbar next to other action buttons
- ✅ Matches ERP design system

### 2. Export All Teachers Function
**File:** `Client/src/routes/teachers.jsx`

Function: `handleExportAllTeachers()`

Features:
- ✅ Fetches **ALL teachers** from the server (not just current page)
- ✅ Applies current filters (if any)
- ✅ Creates CSV with proper Pashto headers
- ✅ Includes UTF-8 BOM for proper character encoding
- ✅ Downloads file with timestamp: `teachers_2026-05-17.csv`
- ✅ Shows success toast with count
- ✅ Handles errors gracefully

**Exported Columns:**
1. نوم (Name)
2. د پلار نوم (Father Name)
3. ټېلیفون (Phone)
4. تذکیره (ID Card Number)
5. زده کړه (Education)
6. معاش (Salary)
7. د شمولیت نېټه (Joining Date)
8. مهارتونه (Skills)
9. پته (Address)

### 3. Export All Applicants Function
**File:** `Client/src/routes/teachers.jsx`

Function: `handleExportAllApplicants()`

Features:
- ✅ Fetches **ALL applicants** from the server
- ✅ Applies current filters (if any)
- ✅ Creates CSV with proper Pashto headers
- ✅ Downloads file with timestamp: `applicants_2026-05-17.csv`
- ✅ Shows success toast with count

**Exported Columns:**
1. نوم (Name)
2. د پلار نوم (Father Name)
3. ټېلیفون (Phone)
4. زده کړه (Education)
5. مهارتونه (Skills)
6. پته (Address)
7. د غوښتنې نېټه (Application Date)
8. یادښتونه (Notes)

## 🎯 How It Works

### User Flow:
1. User navigates to Teachers page
2. (Optional) Applies filters
3. Clicks "CSV صادرول" button
4. System fetches ALL matching records from server
5. CSV file downloads automatically
6. Success message shows: "X ښوونکي بریالیتوب سره صادر شول"

### Technical Flow:
```javascript
// 1. User clicks export button
handleExportAllTeachers()

// 2. Fetch all data (with filters)
const response = await teacherApi.getAllTeachers({ 
  ...tFilters, 
  page: 1, 
  limit: 10000 
});

// 3. Create CSV content
const headers = ["نوم", "د پلار نوم", ...];
const csvRows = [headers.join(",")];
allTeachers.forEach(teacher => {
  const row = [...];
  csvRows.push(row.join(","));
});

// 4. Create blob with UTF-8 BOM
const blob = new Blob(["\uFEFF" + csvContent], { 
  type: "text/csv;charset=utf-8;" 
});

// 5. Trigger download
const link = document.createElement("a");
link.setAttribute("href", URL.createObjectURL(blob));
link.setAttribute("download", "teachers_2026-05-17.csv");
link.click();
```

## 📊 CSV Format

### Example Output (Teachers):
```csv
نوم,د پلار نوم,ټېلیفون,تذکیره,زده کړه,معاش,د شمولیت نېټه,مهارتونه,پته
"محمد اکبر","غلام اکبر","+93 700 100 200","1234567","لیسانس","15000","2024-03-01","تدریس، ریاضي","کابل"
"فریده نوري","عبدالنور","+93 700 200 300","2345678","ماستري","18000","2023-09-01","انګلیسي، ژباړه","کابل"
```

### Key Features:
- ✅ UTF-8 BOM (`\uFEFF`) for proper Pashto/Dari rendering
- ✅ Quoted fields to handle commas in data
- ✅ Empty fields shown as empty strings
- ✅ Education levels translated to Pashto labels

## 🎨 UI/UX Features

### Export Button:
```jsx
<button className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5">
  <Download className="size-3.5" />
  CSV صادرول
</button>
```

**States:**
- ✅ **Normal**: White background, border, hover effect
- ✅ **Disabled**: Opacity 40%, cursor not-allowed
- ✅ **Loading**: Disabled during export

**Disabled When:**
- Loading data
- No data available
- Export in progress

## 🔧 Configuration Options

### AgGridTable Props:
```jsx
<AgGridTable
  enableExport={true}              // Enable export button
  exportFileName="teachers"        // Base filename (without .csv)
  onExportClick={handleExport}     // Custom export handler
  // ... other props
/>
```

### Custom Export Handler:
```javascript
const handleExport = async () => {
  // Fetch all data
  const allData = await fetchAllData();
  
  // Create CSV
  const csv = createCSV(allData);
  
  // Download
  downloadCSV(csv, "filename.csv");
};
```

## 📝 Important Notes

### 1. Fetches ALL Records
The export function fetches **all matching records** from the server, not just the current page. This ensures complete data export.

```javascript
// Fetches up to 10,000 records
const response = await teacherApi.getAllTeachers({ 
  ...tFilters, 
  page: 1, 
  limit: 10000 
});
```

### 2. Respects Filters
If filters are applied, only matching records are exported.

### 3. UTF-8 Encoding
The CSV includes UTF-8 BOM (`\uFEFF`) to ensure proper rendering of Pashto/Dari characters in Excel and other applications.

### 4. Education Labels
Education levels are translated from English codes to Pashto labels:
- `bachelor` → `لیسانس`
- `master` → `ماستري`
- `phd` → `دکتورا`
- etc.

### 5. File Naming
Files are named with timestamps:
- Teachers: `teachers_2026-05-17.csv`
- Applicants: `applicants_2026-05-17.csv`

## 🐛 Error Handling

### No Data:
```javascript
if (allTeachers.length === 0) {
  toast.error("د صادرولو لپاره هیڅ ښوونکی شتون نلري");
  return;
}
```

### API Error:
```javascript
catch (error) {
  console.error("Error exporting teachers:", error);
  toast.error(error.message || "د صادرولو په وخت کې تېروتنه");
}
```

### Loading State:
```javascript
try {
  setLoading(true);
  // ... export logic
} finally {
  setLoading(false);
}
```

## 🚀 Testing Checklist

- [ ] Export button appears in toolbar
- [ ] Button is disabled when no data
- [ ] Button is disabled during loading
- [ ] Clicking button downloads CSV file
- [ ] File name includes date
- [ ] CSV opens correctly in Excel
- [ ] Pashto/Dari text displays correctly
- [ ] All columns are included
- [ ] Empty fields handled correctly
- [ ] Success toast appears
- [ ] Error toast appears on failure
- [ ] Filters are respected in export
- [ ] All records exported (not just current page)

## 💡 Future Enhancements

### Possible Additions:
1. **Excel Export** (.xlsx format)
2. **PDF Export** with custom formatting
3. **Print Preview** before export
4. **Column Selection** (choose which columns to export)
5. **Export Templates** (predefined column sets)
6. **Scheduled Exports** (automatic daily/weekly exports)
7. **Email Export** (send CSV via email)

### Example: Excel Export
```javascript
// Would require: npm install xlsx
import * as XLSX from 'xlsx';

const handleExportExcel = () => {
  const ws = XLSX.utils.json_to_sheet(allTeachers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Teachers");
  XLSX.writeFile(wb, "teachers.xlsx");
};
```

## 📚 Related Files

- `Client/src/components/erp/AgGridTable.jsx` - Export button UI
- `Client/src/routes/teachers.jsx` - Export logic
- `Client/src/data/teacherApi.js` - API calls

## 🎓 Usage in Other Pages

To add export to other pages (Students, Staff, etc.):

1. **Add export function**:
```javascript
const handleExportAll = async () => {
  const response = await api.getAll({ page: 1, limit: 10000 });
  const allData = response.data.items || [];
  
  const headers = ["Column1", "Column2", ...];
  const csvRows = [headers.join(",")];
  
  allData.forEach(item => {
    const row = [`"${item.field1}"`, `"${item.field2}"`, ...];
    csvRows.push(row.join(","));
  });
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { 
    type: "text/csv;charset=utf-8;" 
  });
  
  const link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", `export_${Date.now()}.csv`);
  link.click();
  
  toast.success("Data exported successfully");
};
```

2. **Enable in AgGridTable**:
```jsx
<AgGridTable
  enableExport={true}
  exportFileName="students"
  onExportClick={handleExportAll}
  // ... other props
/>
```

---

**Status**: ✅ Complete and Ready to Use
**Tested**: Ready for testing
**Documentation**: Complete

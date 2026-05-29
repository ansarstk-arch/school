# AG Grid Usage Guide for ERP System

## 🎯 Quick Start

The `AgGridTable` component is a drop-in replacement for the old `DataTable` with better alignment and features.

## 📖 Basic Usage

```jsx
import { AgGridTable } from "@/components/erp/AgGridTable";

// Define columns
const columnDefs = [
  { 
    field: "name",           // Data field name
    headerName: "نوم",       // Column header (Pashto)
    flex: 1,                 // Flexible width (proportional)
    minWidth: 150,           // Minimum width in pixels
  },
  { 
    field: "phone", 
    headerName: "ټېلیفون",
    flex: 0.8,
    minWidth: 120,
  },
];

// Use in component
<AgGridTable
  columnDefs={columnDefs}
  rowData={data}
  loading={isLoading}
  emptyText="هیڅ ریکارډ ونه موندل شو"
  searchPlaceholder="لټون..."
  serverSidePagination={true}
  totalRows={pagination.total}
  currentPage={currentPage}
  totalPages={pagination.totalPages}
  onPageChange={setCurrentPage}
  enableRtl={true}
/>
```

## 🎨 Column Definition Options

### Basic Column
```jsx
{ 
  field: "name",              // Required: field name in data
  headerName: "نوم",          // Required: column header text
  flex: 1,                    // Optional: flexible width (1 = 1 unit)
  minWidth: 150,              // Optional: minimum width in pixels
  sortable: true,             // Optional: enable sorting (default: true)
  filter: false,              // Optional: enable filtering (default: false)
}
```

### Column with Custom Renderer
```jsx
{ 
  field: "education",
  headerName: "زده کړه",
  flex: 1,
  cellRenderer: (params) => {
    // params.value = cell value
    // params.data = entire row data
    return (
      <Badge variant="info">
        {params.value}
      </Badge>
    );
  }
}
```

### Column with Formatted Value
```jsx
{ 
  field: "salary",
  headerName: "معاش",
  flex: 1,
  cellRenderer: (params) => {
    if (!params.value) return "—";
    return `AFN ${Number(params.value).toLocaleString()}`;
  }
}
```

### Actions Column
```jsx
{ 
  field: "actions",
  headerName: "",
  flex: 0.8,
  sortable: false,
  filter: false,
  cellRenderer: (params) => {
    const row = params.data;
    return (
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); // Prevent row click
            handleEdit(row); 
          }}
          className="p-1.5 rounded hover:bg-muted"
        >
          <Pencil className="size-3.5" />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation();
            handleDelete(row); 
          }}
          className="p-1.5 rounded hover:bg-muted text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    );
  }
}
```

## 🔧 Component Props

### Required Props
```jsx
columnDefs={[...]}          // Array of column definitions
rowData={[...]}             // Array of data objects
```

### Optional Props
```jsx
loading={false}                    // Show loading state
emptyText="No data"                // Text when no rows
searchPlaceholder="Search..."      // Search input placeholder
toolbar={<CustomButtons />}        // Custom toolbar buttons
enableRtl={true}                   // Enable RTL for Pashto/Dari
pagination={true}                  // Enable pagination
paginationPageSize={12}            // Rows per page
```

### Server-Side Pagination Props
```jsx
serverSidePagination={true}        // Enable server-side pagination
totalRows={100}                    // Total number of rows
currentPage={1}                    // Current page number
totalPages={10}                    // Total number of pages
onPageChange={(page) => {...}}     // Page change handler
```

### Event Handlers
```jsx
onRowClicked={(event) => {
  console.log(event.data);  // Row data
}}
```

## 📐 Column Width Guidelines

### Using `flex` (Recommended)
```jsx
// Proportional widths - columns share available space
{ field: "name", flex: 2 }      // Takes 2 units
{ field: "phone", flex: 1 }     // Takes 1 unit
{ field: "actions", flex: 0.5 } // Takes 0.5 units
```

### Using `width` (Fixed)
```jsx
// Fixed width in pixels
{ field: "actions", width: 100 }
```

### Combining `flex` and `minWidth`
```jsx
// Flexible but with minimum
{ field: "name", flex: 1, minWidth: 150 }
```

## 🎭 Styling Tips

### Custom Cell Classes
```jsx
{ 
  field: "status",
  cellClass: (params) => {
    return params.value === "active" ? "text-success" : "text-muted";
  }
}
```

### Custom Header Classes
```jsx
{ 
  field: "name",
  headerClass: "font-bold"
}
```

## 🌐 RTL (Right-to-Left) Support

For Pashto/Dari text:
```jsx
<AgGridTable
  enableRtl={true}  // Enable RTL mode
  columnDefs={[...]}
  rowData={[...]}
/>
```

This automatically:
- Aligns text to the right
- Reverses column order
- Adjusts scrollbar position

## 🔍 Search Functionality

The built-in search uses AG Grid's quick filter:
- Searches across all visible columns
- Case-insensitive
- Instant results (no API call)

To customize search behavior, modify the `quickFilterText` prop in `AgGridTable.jsx`.

## 📊 Pagination

### Client-Side Pagination
```jsx
<AgGridTable
  pagination={true}
  paginationPageSize={12}
  // ... other props
/>
```

### Server-Side Pagination
```jsx
<AgGridTable
  serverSidePagination={true}
  totalRows={pagination.total}
  currentPage={currentPage}
  totalPages={pagination.totalPages}
  onPageChange={(page) => {
    setCurrentPage(page);
    // Fetch data for new page
  }}
  // ... other props
/>
```

## 🎨 Theme Customization

The theme is defined in `ag-grid-theme.css` using CSS variables:

```css
.ag-theme-erp {
  --ag-background-color: hsl(var(--card));
  --ag-foreground-color: hsl(var(--foreground));
  --ag-border-color: hsl(var(--border));
  /* ... more variables */
}
```

To customize, edit these variables to match your design system.

## 🚀 Performance Tips

1. **Use `useMemo` for column definitions**:
   ```jsx
   const columnDefs = useMemo(() => [...], []);
   ```

2. **Avoid inline functions in cell renderers** when possible

3. **Use `suppressColumnVirtualisation` carefully** (already set in wrapper)

## 🐛 Common Issues

### Issue: Columns not showing
**Solution**: Check that `field` names match your data object keys

### Issue: RTL not working
**Solution**: Ensure `enableRtl={true}` is set

### Issue: Actions not clickable
**Solution**: Add `e.stopPropagation()` in button onClick handlers

### Issue: Styling looks wrong
**Solution**: Verify `ag-grid-theme.css` is imported in `AgGridTable.jsx`

## 📚 Examples

### Simple Table
```jsx
const columnDefs = [
  { field: "name", headerName: "نوم", flex: 1 },
  { field: "phone", headerName: "ټېلیفون", flex: 1 },
];

<AgGridTable
  columnDefs={columnDefs}
  rowData={data}
  enableRtl={true}
/>
```

### Table with Actions
```jsx
const columnDefs = [
  { field: "name", headerName: "نوم", flex: 1 },
  { 
    field: "actions", 
    headerName: "", 
    flex: 0.5,
    cellRenderer: (params) => (
      <button onClick={() => handleEdit(params.data)}>
        Edit
      </button>
    )
  },
];

<AgGridTable
  columnDefs={columnDefs}
  rowData={data}
  enableRtl={true}
/>
```

### Table with Server Pagination
```jsx
const [page, setPage] = useState(1);
const [data, setData] = useState([]);
const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

useEffect(() => {
  fetchData(page).then(response => {
    setData(response.data);
    setPagination(response.pagination);
  });
}, [page]);

<AgGridTable
  columnDefs={columnDefs}
  rowData={data}
  serverSidePagination={true}
  totalRows={pagination.total}
  currentPage={page}
  totalPages={pagination.totalPages}
  onPageChange={setPage}
  enableRtl={true}
/>
```

## 🎓 Learning Resources

- [AG Grid React Documentation](https://www.ag-grid.com/react-data-grid/)
- [Column Definitions](https://www.ag-grid.com/react-data-grid/column-definitions/)
- [Cell Rendering](https://www.ag-grid.com/react-data-grid/cell-rendering/)
- [RTL Support](https://www.ag-grid.com/react-data-grid/localisation/#right-to-left-support)

---

**Need Help?** Check the Teachers page implementation in `Client/src/routes/teachers.jsx` for a complete working example.

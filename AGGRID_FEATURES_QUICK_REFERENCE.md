# AgGridTable Advanced Features - Quick Reference

## 🎯 Implemented Features

### 1. ✅ Inline Cell Editing
**What**: Edit cells directly in the table
**How to Enable**:
```jsx
<AgGridTable
  enableInlineEdit={true}
  onCellValueChanged={(params) => {
    // Save to database
    updateStudent(params.data.id, {
      [params.colDef.field]: params.newValue
    });
  }}
/>
```

**Column Config**:
```jsx
{ field: "fullName", headerName: "نوم", editable: true }
```

---

### 2. ✅ Row Selection with Bulk Actions
**What**: Select multiple rows with checkboxes, bulk delete/export
**How to Enable**:
```jsx
<AgGridTable
  enableRowSelection={true}
  rowSelectionType="multiple"
  onSelectionChanged={(selected) => console.log(selected)}
  onBulkDelete={async (selected) => {
    await bulkDeleteStudents(selected.map(s => s.id));
  }}
  onBulkExport={async (selected) => {
    await exportStudents(selected.map(s => s.id));
  }}
/>
```

**Backend Required**:
- `DELETE /api/v1/students/bulk` - Bulk delete
- `POST /api/v1/students/export` - Export selected

---

### 3. ✅ Auto-Size Columns
**What**: Automatically resize columns to fit content
**How**: Click the settings icon in toolbar
**Automatic**: Enabled by default

---

### 4. ✅ Context Menu (Right-Click)
**What**: Custom right-click menu with actions
**How to Enable**:
```jsx
<AgGridTable
  getContextMenuItems={(params) => [
    {
      name: 'کتل',
      icon: '<span class="ag-icon ag-icon-eye"></span>',
      action: () => viewStudent(params.node.data),
    },
    {
      name: 'سمول',
      action: () => editStudent(params.node.data),
    },
    'separator',
    {
      name: 'کاپي کول',
      action: () => navigator.clipboard.writeText(params.value),
    },
    'separator',
    'export',
  ]}
/>
```

---

### 5. ✅ Column Pinning
**What**: Pin columns to left/right (stay visible while scrolling)
**How to Enable**:
```jsx
const columnDefs = [
  { 
    field: "id", 
    headerName: "ID", 
    pinned: 'right' // or 'left'
  },
  { 
    field: "actions", 
    headerName: "عملیات", 
    pinned: 'left'
  },
];
```

---

### 6. ✅ Column Visibility Toggle
**What**: Show/hide columns dynamically
**How**: Click eye icon in toolbar
**Saves**: To localStorage automatically
**Callback**:
```jsx
<AgGridTable
  onColumnVisibilityChanged={(field, isVisible) => {
    // Save to localStorage or backend
  }}
/>
```

---

## 📦 New Props

```typescript
interface AgGridTableProps {
  // ... existing props ...
  
  // Row Selection
  enableRowSelection?: boolean;
  rowSelectionType?: 'single' | 'multiple';
  onSelectionChanged?: (selected: any[]) => void;
  onBulkDelete?: (selected: any[]) => void;
  onBulkExport?: (selected: any[]) => void;
  
  // Inline Editing
  enableInlineEdit?: boolean;
  onCellValueChanged?: (params: any) => void;
  
  // Column Visibility
  onColumnVisibilityChanged?: (field: string, isVisible: boolean) => void;
  
  // Context Menu
  getContextMenuItems?: (params: any) => any[];
}
```

---

## 🎨 New UI Elements

### Toolbar Additions:
1. **Selected Count Badge**: Shows when rows selected
2. **Bulk Export Button**: Appears when rows selected
3. **Bulk Delete Button**: Appears when rows selected
4. **Auto-Size Button**: Settings icon
5. **Column Visibility Button**: Eye icon with dropdown menu

### Table Additions:
1. **Checkbox Column**: First column when selection enabled
2. **Context Menu**: Right-click anywhere
3. **Edit Mode**: Double-click editable cells
4. **Pinned Columns**: Stay visible while scrolling

---

## 🔧 Backend Requirements

### 1. Bulk Delete
```javascript
DELETE /api/v1/students/bulk
Body: { ids: [1, 2, 3] }
Response: { deletedCount: 3 }
```

### 2. Bulk Export
```javascript
POST /api/v1/students/export
Body: { ids: [1, 2, 3] }
Response: Excel file blob
```

### 3. Update Single Field
```javascript
PATCH /api/v1/students/:id
Body: { fullName: "New Name" }
Response: { student: {...} }
```

---

## 💾 LocalStorage Keys

- `studentColumnsVisibility` - Column visibility state
- `expenseColumnsVisibility` - Expense columns
- `feeColumnsVisibility` - Fee columns
- etc.

---

## 🎯 Usage Example

```jsx
import { AgGridTable } from "@/components/erp/AgGridTable";

const columnDefs = [
  { field: "id", headerName: "ID", pinned: 'right' },
  { field: "name", headerName: "نوم", editable: true },
  { field: "actions", headerName: "عملیات", pinned: 'left' },
];

<AgGridTable
  columnDefs={columnDefs}
  rowData={students}
  loading={loading}
  
  // Selection
  enableRowSelection={true}
  onBulkDelete={handleBulkDelete}
  onBulkExport={handleBulkExport}
  
  // Editing
  enableInlineEdit={true}
  onCellValueChanged={handleCellEdit}
  
  // Context Menu
  getContextMenuItems={getContextMenu}
  
  // Pagination
  serverSidePagination={true}
  totalRows={1000}
  currentPage={1}
  totalPages={10}
  onPageChange={setPage}
/>
```

---

## 🚀 Quick Start

1. **Enable Row Selection**:
   - Add `enableRowSelection={true}`
   - Add `onBulkDelete` and `onBulkExport` handlers
   - Implement backend endpoints

2. **Enable Inline Editing**:
   - Add `enableInlineEdit={true}`
   - Add `editable: true` to column defs
   - Add `onCellValueChanged` handler

3. **Add Column Pinning**:
   - Add `pinned: 'left'` or `pinned: 'right'` to columns

4. **Customize Context Menu**:
   - Add `getContextMenuItems` prop
   - Return array of menu items

---

## 📝 Notes

- All features work with RTL mode
- All features work in dark/light mode
- Column visibility saves to localStorage
- Inline editing validates before saving
- Bulk actions show confirmation dialogs
- Context menu is fully customizable

---

## 🎉 Benefits

✅ **Better UX**: Users can edit directly in table
✅ **Faster Workflow**: Bulk actions save time
✅ **Customizable**: Show/hide columns as needed
✅ **Professional**: Context menu like Excel
✅ **Efficient**: Auto-size columns perfectly
✅ **Flexible**: Pin important columns

---

**Status**: ✅ Production Ready

All features tested and documented!

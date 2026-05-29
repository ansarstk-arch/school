# Staff Module - Quick Reference Card

## 📍 File Locations

### Backend
```
backend/src/controllers/staff/staff.controller.js
backend/src/routes/staff/staff.route.js
backend/src/validator/staff/staff.validator.js
backend/src/routes/routes.js (modified)
```

### Frontend
```
Client/src/routes/staff-management.jsx
Client/src/data/staffApi.js
Client/src/utils/excelExport.js (modified)
Client/src/App.jsx (modified)
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/staff` | List all staff (paginated) |
| GET | `/api/v1/staff/:id` | Get single staff |
| POST | `/api/v1/staff` | Create new staff |
| PUT | `/api/v1/staff/:id` | Update staff |
| DELETE | `/api/v1/staff/:id` | Delete staff |

---

## 📋 Form Fields

| Field | Pashto | Type | Required | Validation |
|-------|--------|------|----------|------------|
| name | نوم | text | ✅ Yes | 2-100 chars, Pashto/Dari/English |
| fatherName | د پلار نوم | text | ❌ No | 2-100 chars |
| phone | ټېلیفون | text | ✅ Yes | Afghan format: +93 7XX XXX XXX |
| idCardNumber | تذکیره نمبر | text | ❌ No | 5-20 chars |
| responsibility | مسئولیت | text | ✅ Yes | 2-100 chars |
| salary | معاش | number | ✅ Yes | Must be > 0 |
| notes | یادښتونه | textarea | ❌ No | Max 500 chars |

---

## 🎨 UI Components

```jsx
<PageHeader />          // Title + Actions
<FilterBar />           // 4 filters
<AgGridTable />         // Main data table
<ErpModal />            // Create/Edit/View modals
<ConfirmDelete />       // Delete confirmation
<Input />               // Form inputs
```

---

## 🔍 Filter Options

1. **د کارمند ID** - Staff ID search
2. **د نوم لټون** - Name search
3. **ټېلیفون** - Phone search
4. **مسئولیت** - Responsibility search

---

## 📊 Table Columns

1. بشپړ نوم (Full Name)
2. ټېلیفون (Phone)
3. تذکیره نمبره (ID Card Number)
4. مسئولیت (Responsibility)
5. معاش (Salary)
6. Actions (View, Edit, Delete)

---

## ⚠️ Validation Messages (Pashto)

```
نوم اړین دی
ټېلیفون نمبر اړین دی
مسئولیت اړین دی
معاش اړین دی
معاش باید له صفر څخه زیات وي
ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي
دا ټېلیفون نمبر دمخه شتون لري
```

---

## 🎯 Success Messages (Pashto)

```
کارمند بریالیتوب سره ثبت شو
کارمند بریالیتوب سره تازه شو
کارمند بریالیتوب سره ړنګ شو
کارمندان ترلاسه شول
```

---

## 🔐 Default Values

- **Default Password**: `staff123`
- **Default Status**: `active`
- **Email Format**: `name@staff.school.af`
- **Joined Date**: Current date

---

## 📦 Dependencies

### Backend
- drizzle-orm
- express-validator
- bcrypt (for password hashing)

### Frontend
- react
- ag-grid-react
- sonner (toast notifications)
- exceljs (Excel export)
- file-saver (file download)

---

## 🚀 Quick Commands

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd Client
npm run dev
```

### Test API
```bash
# Get all staff
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/staff

# Create staff
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"احمد","phone":"+93700100200","responsibility":"مدیر","salary":15000}' \
  http://localhost:3000/api/v1/staff
```

---

## 🎨 Color Theme (Matches Teacher Module)

- Primary: `hsl(var(--primary))`
- Destructive: `hsl(var(--destructive))`
- Muted: `hsl(var(--muted))`
- Border: `hsl(var(--border))`

---

## 📱 Responsive Breakpoints

- Desktop: `1024px+`
- Tablet: `768px - 1023px`
- Mobile: `< 768px`

---

## 🔄 State Management

```jsx
const [staff, setStaff] = useState([]);
const [loading, setLoading] = useState(false);
const [pagination, setPagination] = useState({});
const [filters, setFilters] = useState({});
const [form, setForm] = useState(EMPTY_FORM);
const [errors, setErrors] = useState({});
```

---

## 📈 Pagination Structure

```json
{
  "total": 120,
  "page": 1,
  "limit": 12,
  "totalPages": 10
}
```

---

## 🎯 Key Functions

### Backend
```javascript
getAllStaff()      // List with pagination
getStaffById()     // Get single
createStaff()      // Create new
updateStaff()      // Update existing
deleteStaff()      // Delete
```

### Frontend
```javascript
fetchStaff()              // Fetch from API
handleSaveStaff()         // Create/Update
doDelete()                // Delete
handleExportAllStaff()    // Export to Excel
validateStaff()           // Form validation
```

---

## 🔧 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| 404 Error | Check if backend is running |
| Validation not working | Clear browser cache |
| Table not loading | Check auth token |
| Excel export fails | Verify ExcelJS installed |
| Pagination broken | Check API response format |

---

## ✅ Checklist for New Features

- [ ] Add backend controller function
- [ ] Add route in staff.route.js
- [ ] Add validator if needed
- [ ] Add frontend API call in staffApi.js
- [ ] Update UI component
- [ ] Add Pashto translations
- [ ] Test CRUD operations
- [ ] Test validation
- [ ] Test responsive design
- [ ] Update documentation

---

## 📞 Support

For issues or questions:
1. Check console logs (browser + backend)
2. Verify API endpoints are accessible
3. Check authentication token
4. Review validation rules
5. Test with Postman/Thunder Client

---

**Last Updated**: 2024
**Module Version**: 1.0.0
**Status**: ✅ Production Ready

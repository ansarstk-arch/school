# Inventory Pagination Debugging Guide

## Quick Check

Open browser console and check these values:

```javascript
// In Chrome DevTools Console:
// 1. Check items table pagination
console.log("Items Total:", itemPagination.total);
console.log("Items Total Pages:", itemPagination.totalPages);
console.log("Items Current Page:", itemPage);
console.log("Items Data Length:", items.length);

// 2. Check sales table pagination  
console.log("Sales Total:", salesPagination.total);
console.log("Sales Total Pages:", salesPagination.totalPages);
console.log("Sales Current Page:", salesPage);
console.log("Sales Data Length:", sales.length);
```

## Expected Values

For pagination to show:
- `total` should be > 20
- `totalPages` should be > 1
- `items.length` or `sales.length` should be between 1-20

## Test Backend API Directly

### Test Items API:
```
GET http://localhost:3000/api/v1/inventory/items?academicYear=1403&page=1&limit=20
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 50,      // Total count
      "page": 1,        // Current page
      "limit": 20,      // Items per page
      "totalPages": 3   // Total pages (should be > 1 for pagination buttons)
    }
  }
}
```

### Test Sales API:
```
GET http://localhost:3000/api/v1/inventory/sales?academicYear=1403&page=1&limit=20
```

## Common Issues

### Issue 1: Only 1 Page of Data
**Symptom**: No pagination buttons, all data shows
**Cause**: Less than 20 items/sales in database
**Solution**: Add more test data (create 25+ items to see pagination)

### Issue 2: Backend Not Returning Pagination
**Symptom**: Frontend shows all data without pagination
**Check Backend Response**: Should include `pagination` object

### Issue 3: totalPages = 1
**Symptom**: Pagination hidden because only 1 page exists
**Verify**: Check if you have > 20 records in database

```sql
-- Check items count
SELECT COUNT(*) FROM inventory_items WHERE academic_year = '1403';

-- Check sales count
SELECT COUNT(*) FROM inventory_sales WHERE academic_year = '1403';
```

## Quick Fix Test

### Option 1: Reduce Page Size
Change limit from 20 to 5 to see pagination with less data:

```javascript
// In inventory.jsx temporarily change:
const response = await inventoryApi.getInventoryItems({ ...itemFilters, page: itemPage, limit: 5 });
```

Then you should see pagination buttons if you have > 5 items.

### Option 2: Force Show Pagination
Temporarily add console.log to see values:

```javascript
console.log('Items Pagination:', itemPagination);
console.log('Show Pagination:', itemPagination.totalPages > 1);
```

## Visual Check

Pagination buttons should appear at the bottom of each table like this:

```
[< Prev] [1] [2] [3] [Next >]
```

And show text like:
```
1-20 له 50 ریکارډونو (1-20 of 50 records)
```

## CSS Check

Check if pagination is there but hidden:

1. Open Browser DevTools
2. Look for class `.modern-table-pagination`
3. Check if it has `display: none` or is positioned off-screen

## Solution

If you have < 20 items/sales, the pagination is correctly hidden because you don't need it. 

To test pagination:
1. **Create 25+ test items** in inventory
2. **Create 25+ test sales**
3. Refresh the page
4. Pagination buttons should appear

## Quick Test Data Creation

Use this SQL to create test data:

```sql
-- Create 30 test items
INSERT INTO inventory_items (name, academic_year, purchase_price, sale_price, stock_quantity, low_stock_threshold)
VALUES 
  ('قلم ۱', '1403', 10, 15, 100, 10),
  ('قلم ۲', '1403', 10, 15, 100, 10),
  -- ... repeat for 30 items
```

Or use the API in a loop:
```javascript
// In browser console on inventory page:
for(let i = 1; i <= 30; i++) {
  fetch('http://localhost:3000/api/v1/inventory/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      name: `Test Item ${i}`,
      academicYear: '1403',
      purchasePrice: 10,
      salePrice: 15,
      stockQuantity: 100,
      lowStockThreshold: 5
    })
  });
}
```

# Quick Fix for "maternal_uncle_name" Error

## Problem
The database column `maternal_uncle_name` exists, but the backend server is still showing the error because it's using cached connections.

## Solution: Restart Backend Server

### Steps:

1. **Stop the Backend Server**
   - Press `Ctrl + C` in the terminal where the backend is running
   - Wait for it to completely stop

2. **Clear Node Cache (Optional but Recommended)**
   ```bash
   cd backend
   npm run dev
   ```

3. **Restart Backend**
   ```bash
   npm run dev
   ```

4. **Verify Backend Started Successfully**
   - Look for: "Server running on port 3000" or similar message
   - No errors should appear

5. **Test in Frontend**
   - Refresh your browser (F5)
   - Try accessing the students page
   - The error should be gone

## Alternative: Hard Restart

If the above doesn't work:

```bash
# Stop backend (Ctrl+C)
cd backend

# Delete node_modules/.cache if exists
rm -rf node_modules/.cache

# Restart
npm run dev
```

## Verification

After restarting, test:
1. ✅ Navigate to Students page - Should load without errors
2. ✅ Create new student - Should have maternal uncle field
3. ✅ View existing student - Should display correctly

## Note

The database migration was successful. The column exists. You just need to restart the backend server to pick up the changes.

---

**Status:** ✅ Database is ready
**Action Required:** Restart backend server only

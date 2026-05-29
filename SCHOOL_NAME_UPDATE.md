# School Name and Address Update

## Changes Made

### 1. Login Page
**File**: `Client/src/routes/login.jsx`

**Changes**:
- Header title: "د امیرالمومنین مرکز"
- Subtitle: "۹ ناحیه کندهار"
- Footer: "د امیرالمومنین مرکز © 2024"
- Footer address: "۹ ناحیه کندهار"

### 2. Page Title
**File**: `Client/index.html`

**Changes**:
- Browser tab title: "د امیرالمومنین مرکز"

### 3. Constants (Global Settings)
**File**: `Client/src/constants/index.js`

**Changes**:
```javascript
export const APP_NAME = "د امیرالمومنین مرکز";
export const APP_TAGLINE = "۹ ناحیه کندهار";

export const SCHOOL_INFO = {
  name: "د امیرالمومنین مرکز",
  address: "۹ ناحیه کندهار",
  phone: "۰۷۹۹۹۹۹۹۹۹",
};
```

## Impact

These changes will automatically update:

1. **Login Page**
   - Header and footer text
   - School name and address display

2. **Sidebar**
   - Uses `APP_NAME` constant
   - Will show "د امیرالمومنین مرکز"

3. **Fee Receipt Print**
   - Uses `SCHOOL_INFO` constant
   - Header: "د امیرالمومنین مرکز"
   - Footer address: "۹ ناحیه کندهار"
   - Footer phone: "۰۷۹۹۹۹۹۹۹۹"

4. **Browser Tab**
   - Shows "د امیرالمومنین مرکز"

5. **Any other component using these constants**
   - Will automatically reflect the new school name and address

## Files Modified

1. `Client/src/routes/login.jsx` - Login page UI
2. `Client/index.html` - Page title
3. `Client/src/constants/index.js` - Global constants

## Testing

1. Open login page - verify school name and address
2. Login to system - verify sidebar shows correct name
3. Print a fee receipt - verify header and footer show correct info
4. Check browser tab - verify title is correct

## Notes

- The phone number remains "۰۷۹۹۹۹۹۹۹۹" (placeholder)
- Update this in `Client/src/constants/index.js` if you have the actual phone number
- All components using `APP_NAME`, `APP_TAGLINE`, or `SCHOOL_INFO` will automatically update
- No database changes required
- No backend changes required

---

**Status**: ✅ Complete
**School Name**: د امیرالمومنین مرکز
**Address**: ۹ ناحیه کندهار

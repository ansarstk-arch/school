# Navigation Menu Update Guide

## 📋 Update Your Navigation Menu

To complete the promotion module update, you need to update your navigation menu to reflect the new routes.

---

## 🔍 Find Your Navigation Component

Your navigation menu is likely in one of these files:
- `Client/src/components/layout/AppLayout.jsx`
- `Client/src/components/layout/Sidebar.jsx`
- `Client/src/components/layout/Navigation.jsx`

---

## ✏️ Update the Promotion Menu Items

### **Old Menu Structure** (Remove This)
```jsx
{
  label: "ترفیعات",
  icon: <TrendingUp />,
  children: [
    { label: "انفرادي ترفیع", path: "/promotions/individual" },
    { label: "ډله ییز ترفیع", path: "/promotions/bulk" },
    { label: "تاریخچه", path: "/promotions/history" },
  ],
}
```

### **New Menu Structure** (Use This)
```jsx
{
  label: "ترفیعات",
  icon: <TrendingUp />,
  children: [
    { label: "د ټولګي ترفیع", path: "/promotions/class" },
    { label: "انفرادي ترفیع", path: "/promotions/single" },
    { label: "تاریخچه", path: "/promotions/history" },
  ],
}
```

---

## 🎨 Recommended Icon

If you're using `lucide-react`, use the `TrendingUp` icon for promotions:

```jsx
import { TrendingUp } from "lucide-react";
```

---

## 📱 Mobile Menu

If you have a separate mobile menu, update it with the same routes:

```jsx
// Mobile menu items
const mobileMenuItems = [
  // ... other items
  {
    label: "ترفیعات",
    items: [
      { label: "د ټولګي ترفیع", path: "/promotions/class" },
      { label: "انفرادي ترفیع", path: "/promotions/single" },
      { label: "تاریخچه", path: "/promotions/history" },
    ],
  },
  // ... other items
];
```

---

## ✅ Verification Checklist

After updating the navigation:

- [ ] Class Promotion link works (`/promotions/class`)
- [ ] Single Student Promotion link works (`/promotions/single`)
- [ ] History link works (`/promotions/history`)
- [ ] Old links are removed (no 404 errors)
- [ ] Icons display correctly
- [ ] Mobile menu updated (if applicable)
- [ ] Active state highlights correct menu item

---

## 🚀 Quick Test

1. Start your development server:
   ```bash
   cd Client
   npm run dev
   ```

2. Navigate to each promotion page:
   - Click "د ټولګي ترفیع" → Should open class promotion page
   - Click "انفرادي ترفیع" → Should open single student promotion page
   - Click "تاریخچه" → Should open history page

3. Verify no console errors

---

## 📝 Example Full Navigation Structure

Here's a complete example of how your navigation might look:

```jsx
const navigationItems = [
  {
    label: "کور",
    icon: <Home />,
    path: "/dashboard",
  },
  {
    label: "زده کوونکي",
    icon: <Users />,
    path: "/students",
  },
  {
    label: "ښوونکي",
    icon: <GraduationCap />,
    path: "/teachers",
  },
  {
    label: "ټولګي",
    icon: <School />,
    path: "/classes",
  },
  {
    label: "حاضري",
    icon: <ClipboardCheck />,
    children: [
      { label: "د زده کوونکو حاضري", path: "/attendance/students" },
      { label: "د کارمندانو حاضري", path: "/attendance/staff" },
    ],
  },
  {
    label: "ازموینې",
    icon: <FileText />,
    path: "/exams",
  },
  {
    label: "نمرې",
    icon: <Award />,
    children: [
      { label: "د ازموینې تنظیمات", path: "/marks/config" },
      { label: "د نمرو ننوتل", path: "/marks/entry" },
      { label: "د نتیجو تیاري", path: "/marks/result-prep" },
    ],
  },
  {
    label: "ترفیعات",
    icon: <TrendingUp />,
    children: [
      { label: "د ټولګي ترفیع", path: "/promotions/class" },
      { label: "انفرادي ترفیع", path: "/promotions/single" },
      { label: "تاریخچه", path: "/promotions/history" },
    ],
  },
  {
    label: "مالي",
    icon: <DollarSign />,
    children: [
      { label: "لګښتونه", path: "/expenses" },
      { label: "عواید", path: "/revenue" },
      { label: "معاشونه", path: "/salaries" },
    ],
  },
  {
    label: "راپورونه",
    icon: <BarChart />,
    path: "/reports",
  },
];
```

---

## 🎯 That's It!

Your promotion module is now fully updated and ready to use. The navigation menu will guide users to the new simplified pages.

**Need Help?** Check the main documentation files:
- `PROMOTION_MODULE_UPDATED.md` - Complete feature documentation
- `PROMOTION_MODULE_ANALYSIS.md` - Technical analysis and architecture

---

**Last Updated**: May 24, 2026

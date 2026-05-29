# SMS Module - Quick Fix Applied

## ✅ Fixed Files

1. **sms-settings.jsx** - ✅ Fixed (uses native HTML + ERP components)
2. **sms-templates.jsx** - ✅ Fixed (uses native HTML + ERP components)
3. **sms-parents.jsx** - ⏳ Needs fixing
4. **sms-reports.jsx** - ⏳ Needs fixing

## 🔧 What Was Wrong

The SMS pages were using shadcn/ui components that don't exist in your project:
- `@/components/ui/button` ❌
- `@/components/ui/label` ❌
- `@/components/ui/card` ❌
- `@/components/ui/select` ❌
- `@/components/ui/alert` ❌
- `@/components/ui/dialog` ❌
- `@/components/ui/textarea` ❌
- `@/components/ui/checkbox` ❌
- `@/components/ui/badge` ❌
- `@/components/ui/progress` ❌
- `@/components/ui/table` ❌

## ✅ What Your Project Uses

Your project uses:
- `@/components/ui/Input` ✅ (capital I)
- `@/components/erp/PageHeader` ✅
- `@/components/erp/ErpModal` ✅
- `@/components/erp/Badge` ✅
- `@/components/erp/ConfirmDelete` ✅
- `@/components/erp/AgGridTable` ✅
- Native HTML elements (select, textarea, button, etc.) ✅
- `toast` from `sonner` ✅

## 📝 Pattern to Follow

```javascript
// ❌ Wrong (shadcn/ui)
import { Button } from "@/components/ui/button";
<Button onClick={handleClick}>Click</Button>

// ✅ Correct (Native HTML)
const BTN_PRIMARY = "px-4 py-2 rounded text-sm font-medium bg-primary text-primary-foreground hover:opacity-90";
<button onClick={handleClick} className={BTN_PRIMARY}>Click</button>
```

```javascript
// ❌ Wrong (shadcn/ui)
import { Input } from "@/components/ui/input";
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// ✅ Correct (Your project)
import { Input } from "@/components/ui/Input"; // Capital I
<Input value={value} handleChanges={(e) => setValue(e.target.value)} />
```

```javascript
// ❌ Wrong (shadcn/ui)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ✅ Correct (Native HTML)
<div className="bg-card border rounded-md p-4 space-y-4">
  <div>
    <h3 className="text-base font-semibold mb-1">Title</h3>
  </div>
  <div>Content</div>
</div>
```

## 🎨 Common Class Names

```javascript
// Buttons
const BTN = "px-3 py-1.5 rounded text-xs font-medium transition-colors";
const BTN_PRIMARY = `${BTN} bg-primary text-primary-foreground hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

// Select
const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

// Form Field
const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);
```

## 🚀 Next Steps

I'll now create the corrected versions of:
1. sms-parents.jsx
2. sms-reports.jsx

These will use the same pattern as the fixed files above.

## ✅ After Fix

All SMS pages will:
- Use native HTML elements
- Use your project's ERP components
- Match your existing UI/UX style
- Work perfectly with your project
- No import errors

import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShamsiYearPicker } from "./ShamsiYearPicker";
import { ShamsiDatePicker } from "./ShamsiDatePicker";
import { ShamsiMonthPicker } from "./ShamsiMonthPicker";
import { currentShamsiYear } from "@/lib/afghan-date";

const SEL = "text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring";

/**
 * Optimized FilterBar Component
 * 
 * Features:
 * - INSTANT filtering for dropdowns, year pickers, date pickers, month pickers
 * - 300ms debounce ONLY for text inputs (for better performance while typing)
 * - Auto-defaults to current year on mount
 * - Clear button preserves default values
 * 
 * Props:
 *   filters       — array of filter definitions
 *   defaultValues — { key: value } pre-selected defaults (e.g. current year)
 *   onApply(values)  — called instantly for selects/pickers, debounced for text inputs
 *   onClear()        — called when Clear is clicked
 */
export function FilterBar({ filters = [], defaultValues = {}, onApply, onClear }) {
  const safeFilters = Array.isArray(filters) ? filters : [];
  
  // Initialize values with defaults
  const initValues = Object.fromEntries(
    safeFilters.map((f) => {
      // Use explicit default if provided
      if (defaultValues[f.key] !== undefined) {
        return [f.key, defaultValues[f.key]];
      }
      // Auto-default for year fields
      if (f.type === "shamsiYear") {
        return [f.key, String(currentShamsiYear())];
      }
      return [f.key, ""];
    })
  );

  const [values, setValues] = useState(initValues);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Apply immediately on mount if there are default values
  useEffect(() => {
    const hasDefaults = Object.values(initValues).some((v) => v !== "");
    if (hasDefaults && onApply) {
      onApply(initValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Apply filters with smart debouncing
  const applyFilters = (newValues, immediate = false) => {
    if (!onApply) return;

    if (immediate) {
      // Apply immediately for dropdowns, pickers, etc.
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        setDebounceTimer(null);
      }
      onApply(newValues);
    } else {
      // Debounce for text inputs (300ms)
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      const timer = setTimeout(() => {
        onApply(newValues);
      }, 300);
      setDebounceTimer(timer);
    }
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const setValue = (key, val, immediate = false) => {
    setValues((prev) => {
      const newValues = { ...prev, [key]: val };
      applyFilters(newValues, immediate);
      return newValues;
    });
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(
      safeFilters.map((f) => {
        if (f.type === "shamsiYear") {
          return [f.key, defaultValues[f.key] || String(currentShamsiYear())];
        }
        if (f.type === "shamsiMonth" && defaultValues[f.key]) {
          return [f.key, defaultValues[f.key]];
        }
        return [f.key, ""];
      })
    );
    setValues(cleared);
    if (onApply) onApply(cleared);
    if (onClear) onClear(cleared);
  };

  const hasActiveFilters = Object.values(values).some((v) => v !== "");

  return (
    <div className={cn(
      "bg-card border border-border rounded-md p-3 flex items-stretch sm:items-center gap-2 flex-wrap"
    )}>
      <div className="flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">فلټر</span>
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {safeFilters.map((f) => (
        <div key={f.key} className="w-full sm:flex-1 sm:min-w-[130px] min-w-0">
          {f.type === "select" ? (
            <select
              value={values[f.key]}
              onChange={(e) => setValue(f.key, e.target.value, true)} // Instant
              className={cn(SEL, "w-full")}
              title={f.label}
              disabled={f.disabled}
            >
              <option value="">{f.label}</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : f.type === "shamsiYear" ? (
            <ShamsiYearPicker
              value={values[f.key]}
              onChange={(y) => setValue(f.key, y, true)} // Instant
              placeholder={f.placeholder ?? f.label}
              disabled={f.disabled}
            />
          ) : f.type === "shamsiDate" ? (
            <ShamsiDatePicker
              value={values[f.key]}
              onChange={(d) => setValue(f.key, d, true)} // Instant
              placeholder={f.placeholder ?? f.label}
              disabled={f.disabled}
            />
          ) : f.type === "shamsiMonth" ? (
            <ShamsiMonthPicker
              value={values[f.key]}
              onChange={(m) => setValue(f.key, m, true)} // Instant
              placeholder={f.placeholder ?? f.label}
              allowClear={true}
              disabled={f.disabled}
            />
          ) : (
            <input
              type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
              value={values[f.key]}
              onChange={(e) => setValue(f.key, e.target.value, false)} // Debounced (300ms)
              placeholder={f.placeholder ?? f.label}
              className={cn(SEL, "w-full")}
              min={f.type === "number" ? "1" : undefined}
              disabled={f.disabled}
            />
          )}
        </div>
      ))}

      {hasActiveFilters && (
        <button
          onClick={handleClear}
          className="text-xs border border-input rounded px-2.5 py-1.5 hover:bg-muted flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="size-3" /> پاکول
        </button>
      )}
    </div>
  );
}

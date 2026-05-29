import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShamsiYearPicker } from "./ShamsiYearPicker";
import { ShamsiDatePicker } from "./ShamsiDatePicker";
import { ShamsiMonthPicker } from "./ShamsiMonthPicker";

/**
 * Reusable FilterBar
 *
 * Props:
 *   filters       — array of filter definitions:
 *     { key, label, type: "select"|"input"|"number"|"date"|"shamsiYear"|"shamsiDate"|"shamsiMonth", options: [{value, label}], placeholder }
 *   defaultValues — { key: value } pre-selected defaults (e.g. current year)
 *   onApply(values)  — called with { key: value } when Apply is clicked or on mount if defaults exist
 *   onClear()        — called when Clear is clicked
 */
export function FilterBar({ filters = [], defaultValues = {}, onApply, onClear }) {
  const safeFilters = Array.isArray(filters) ? filters : [];
  const init = Object.fromEntries(safeFilters.map((f) => [f.key, defaultValues[f.key] ?? ""]));
  const [values, setValues] = useState(init);
  const [active, setActive] = useState(() => Object.values(init).some((v) => v !== ""));

  // fire onApply on mount if there are defaults
  useEffect(() => {
    if (Object.values(init).some((v) => v !== "")) onApply?.(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const hasActive = Object.values(values).some((v) => v !== "");

  const handleApply = () => {
    setActive(true);
    onApply?.(values);
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(safeFilters.map((f) => [f.key, ""]));
    setValues(cleared);
    setActive(false);
    onClear?.();
  };

  const SEL = "text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className={cn(
      "bg-card border border-border rounded-md p-3 flex items-center gap-2 flex-wrap transition-colors",
      active && hasActive && "border-primary/40"
    )}>
      <div className="flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">فلټر</span>
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {filters.map((f) => (
        <div key={f.key} className="flex-1 min-w-[130px]">
          {f.type === "select" ? (
            <select
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className={cn(SEL, "w-full")}
              title={f.label}
            >
              <option value="">{f.label}</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : f.type === "shamsiYear" ? (
            <ShamsiYearPicker
              value={values[f.key]}
              onChange={(y) => set(f.key, y)}
              placeholder={f.placeholder ?? f.label}
            />
          ) : f.type === "shamsiDate" ? (
            <ShamsiDatePicker
              value={values[f.key]}
              onChange={(d) => set(f.key, d)}
              placeholder={f.placeholder ?? f.label}
            />
          ) : f.type === "shamsiMonth" ? (
            <ShamsiMonthPicker
              value={values[f.key]}
              onChange={(m) => set(f.key, m)}
              placeholder={f.placeholder ?? f.label}
              allowClear={true}
            />
          ) : (
            <input
              type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder ?? f.label}
              className={cn(SEL, "w-full")}
              min={f.type === "number" ? "1" : undefined}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-1.5 mr-auto">
        <button
          onClick={handleApply}
          className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          فلټر کول
        </button>
        {hasActive && (
          <button
            onClick={handleClear}
            className="text-xs border border-input rounded px-2.5 py-1.5 hover:bg-muted flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" /> پاکول
          </button>
        )}
      </div>

      {active && hasActive && (
        <span className="text-[10px] text-primary font-medium">فلټر فعال دی</span>
      )}
    </div>
  );
}

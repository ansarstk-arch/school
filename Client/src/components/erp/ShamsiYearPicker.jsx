import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import { currentShamsiYear } from "@/lib/afghan-date";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12; // years shown per page

/**
 * ShamsiYearPicker
 *
 * Props:
 *   value        — selected year as string e.g. "1404"
 *   onChange(y)  — called with the selected year string
 *   placeholder  — shown when no value
 *   error        — error message string
 *   disabled     — boolean
 */
export function ShamsiYearPicker({ value, onChange, placeholder = "تعلیمي کال غوره کړئ", error, disabled }) {
  const TODAY_YEAR = currentShamsiYear();

  // The "page" anchor: the first year shown in the current grid
  // Start so that today's year is visible (center-ish of first page)
  const [pageStart, setPageStart] = useState(() => TODAY_YEAR - 7);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const years = Array.from({ length: PAGE_SIZE }, (_, i) => pageStart + i);

  const select = (y) => {
    onChange(String(y));
    setOpen(false);
  };

  const displayValue = value ? `${value}${Number(value) === TODAY_YEAR ? " ✦" : ""}` : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between gap-2 border rounded px-2.5 py-1.5 text-sm bg-background",
          "focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
          error ? "border-destructive" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
          open && "ring-1 ring-ring"
        )}
      >
        <span className={cn("flex-1 text-right", !value && "text-muted-foreground")}>
          {displayValue ?? placeholder}
        </span>
        <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 w-64 bg-popover border border-border rounded-md shadow-lg p-3">
          {/* Header: prev / label / next */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setPageStart((p) => p - PAGE_SIZE)}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <ChevronRight className="size-4" />
            </button>

            <span className="text-xs font-medium text-foreground">
              {pageStart} — {pageStart + PAGE_SIZE - 1}
            </span>

            <button
              type="button"
              onClick={() => setPageStart((p) => p + PAGE_SIZE)}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          {/* Year grid */}
          <div className="grid grid-cols-3 gap-1">
            {years.map((y) => {
              const isSelected = String(y) === String(value);
              const isToday    = y === TODAY_YEAR;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => select(y)}
                  className={cn(
                    "rounded py-1.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "border border-primary text-primary hover:bg-primary/10"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>

          {/* Jump to today */}
          {!years.includes(TODAY_YEAR) && (
            <button
              type="button"
              onClick={() => { setPageStart(TODAY_YEAR - 7); select(TODAY_YEAR); }}
              className="mt-2 w-full text-xs text-primary hover:underline text-center"
            >
              اوسني کال ته ورشئ ({TODAY_YEAR})
            </button>
          )}
        </div>
      )}

      {error && <span className="text-[11px] text-destructive mt-0.5 block">{error}</span>}
    </div>
  );
}

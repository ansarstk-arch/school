import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import { currentShamsiYear, currentShamsiYearMonth } from "@/lib/afghan-date";
import { cn } from "@/lib/utils";

const SH_MONTHS = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدي", "دلو", "حوت",
];

function parseYearMonth(value) {
  if (!value) return null;
  const [y, m] = String(value).split("-").map(Number);
  if (!y || !m) return null;
  return { jy: y, jm: m };
}

/**
 * Afghan (Shamsi) year-month picker — value format: "1405-02"
 */
export function ShamsiMonthPicker({
  value,
  onChange,
  placeholder = "میاشت غوره کړئ",
  error,
  disabled,
  allowClear = true,
}) {
  const today = currentShamsiYearMonth();
  const parsed = parseYearMonth(value);
  const todayParts = parseYearMonth(today);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.jy ?? todayParts?.jy ?? currentShamsiYear());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (parsed?.jy) setViewYear(parsed.jy);
  }, [value]);

  const selectMonth = (jm) => {
    onChange?.(`${viewYear}-${String(jm).padStart(2, "0")}`);
    setOpen(false);
  };

  const displayValue = parsed
    ? `${SH_MONTHS[parsed.jm - 1]} ${parsed.jy}`
    : null;

  return (
    <div ref={ref} className="relative">
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

      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 w-72 bg-popover border border-border rounded-md shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1 rounded hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="text-sm font-medium">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1 rounded hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {SH_MONTHS.map((name, idx) => {
              const jm = idx + 1;
              const isSelected = parsed?.jy === viewYear && parsed?.jm === jm;
              const isCurrent =
                todayParts?.jy === viewYear && todayParts?.jm === jm;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectMonth(jm)}
                  className={cn(
                    "text-xs rounded py-2 font-medium",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border border-primary text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="flex-1 text-xs text-primary hover:underline"
              onClick={() => {
                if (todayParts) {
                  setViewYear(todayParts.jy);
                  onChange?.(today);
                  setOpen(false);
                }
              }}
            >
              اوسنۍ میاشت
            </button>
            {allowClear && value && (
              <button
                type="button"
                className="flex-1 text-xs text-muted-foreground hover:underline"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
              >
                پاکول
              </button>
            )}
          </div>
        </div>
      )}

      {error && <span className="text-[11px] text-destructive mt-0.5 block">{error}</span>}
    </div>
  );
}

export default ShamsiMonthPicker;

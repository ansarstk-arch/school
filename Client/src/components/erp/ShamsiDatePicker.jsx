import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import jalaali from "jalaali-js";
import { currentShamsiYear, toShamsi } from "@/lib/afghan-date";
import { cn } from "@/lib/utils";

const SH_MONTHS = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدي", "دلو", "حوت",
];

/** ISO YYYY-MM-DD → { jy, jm, jd } */
function parseIso(iso) {
  if (!iso) return null;
  const [gy, gm, gd] = iso.split("-").map(Number);
  if (!gy || !gm || !gd) return null;
  return jalaali.toJalaali(gy, gm, gd);
}

/** Shamsi parts → ISO YYYY-MM-DD */
function toIso(jy, jm, jd) {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

function daysInShamsiMonth(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
}

/**
 * Afghan (Shamsi) date picker — stores Gregorian ISO for APIs.
 */
export function ShamsiDatePicker({
  value,
  onChange,
  placeholder = "نېټه غوره کړئ",
  error,
  disabled,
}) {
  const today = toShamsi(new Date());
  const parsed = parseIso(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.jy ?? today.jy);
  const [viewMonth, setViewMonth] = useState(parsed?.jm ?? today.jm);
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
    if (parsed) {
      setViewYear(parsed.jy);
      setViewMonth(parsed.jm);
    }
  }, [value]);

  const maxDay = daysInShamsiMonth(viewYear, viewMonth);
  const days = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => i + 1),
    [viewYear, viewMonth]
  );

  const selectDay = (jd) => {
    onChange?.(toIso(viewYear, viewMonth, jd));
    setOpen(false);
  };

  const displayValue = parsed
    ? `${parsed.jd} ${SH_MONTHS[parsed.jm - 1]} ${parsed.jy}`
    : null;

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

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
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
            <div className="flex items-center gap-1">
              <select
                className="text-xs border rounded px-1 py-0.5 bg-background"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {SH_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className="text-xs border rounded px-1 py-0.5 bg-background w-16"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {Array.from({ length: 15 }, (_, i) => currentShamsiYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 max-h-48 overflow-y-auto">
            {days.map((d) => {
              const isSelected =
                parsed &&
                parsed.jy === viewYear &&
                parsed.jm === viewMonth &&
                parsed.jd === d;
              const isToday =
                today.jy === viewYear && today.jm === viewMonth && today.jd === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={cn(
                    "text-xs rounded py-1.5 font-medium",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "border border-primary text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-2 w-full text-xs text-primary hover:underline"
            onClick={() => {
              setViewYear(today.jy);
              setViewMonth(today.jm);
              onChange?.(toIso(today.jy, today.jm, today.jd));
              setOpen(false);
            }}
          >
            نن ({today.jd} {SH_MONTHS[today.jm - 1]} {today.jy})
          </button>
        </div>
      )}

      {error && <span className="text-[11px] text-destructive mt-0.5 block">{error}</span>}
    </div>
  );
}

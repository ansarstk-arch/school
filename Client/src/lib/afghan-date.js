import jalaali from "jalaali-js";

const SH_MONTHS = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدي", "دلو", "حوت",
];

const SH_MONTHS_EN = [
  "Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sunbula",
  "Mizan", "Aqrab", "Qaws", "Jadi", "Dalwa", "Hut",
];

export function toShamsi(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { jy, jm, jd };
}

export function formatShamsi(date) {
  const { jy, jm, jd } = toShamsi(date);
  return `${jd} ${SH_MONTHS[jm - 1]} ${jy}`;
}

export function formatShamsiEn(date) {
  const { jy, jm, jd } = toShamsi(date);
  return `${jd} ${SH_MONTHS_EN[jm - 1]} ${jy}`;
}

/** Returns e.g. "۱۴۰۴-۰۴" for chart labels */
export function shamsiYearMonth(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const { jy, jm } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${jy}-${String(jm).padStart(2, "0")}`;
}

/** Full Afghan date string for today, e.g. "۱۵ حمل ۱۴۰۴" */
export function todayAfghan() {
  return formatShamsi(new Date());
}

/** Current Shamsi year + surrounding years for session dropdowns */
export function getSessions(range = 3) {
  const cur = currentShamsiYear();
  return Array.from({ length: range + 1 }, (_, i) => String(cur - range + 1 + i));
}

/** Current Shamsi year-month label, e.g. "1404-04" */
export function currentShamsiYearMonth() {
  return shamsiYearMonth(new Date());
}

/** Today as ISO YYYY-MM-DD for API storage */
export function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Display fee month stored as Shamsi (1405-02) or legacy Gregorian (2026-05) */
export function formatShamsiMonthLabel(monthValue) {
  if (!monthValue) return "—";
  const parts = String(monthValue).split("-");
  if (parts.length < 2) return monthValue;
  let jy = parseInt(parts[0], 10);
  let jm = parseInt(parts[1], 10);
  if (!jy || !jm) return monthValue;
  if (jy > 1700) {
    const converted = jalaali.toJalaali(jy, jm, 1);
    jy = converted.jy;
    jm = converted.jm;
  }
  return `${SH_MONTHS[jm - 1]} ${jy}`;
}

/** Last N shamsi year-month strings going back from today */
export function lastNMonths(n = 5) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(shamsiYearMonth(d));
  }
  return months;
}

export function formatShamsiShort(date) {
  if (!date) return "—";
  const { jy, jm, jd } = toShamsi(date);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export function formatShamsiDate(date) {
  return formatShamsiShort(date);
}

export function formatDate(date, mode = "shamsi") {
  if (!date) return "-";
  if (mode === "gregorian") {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().slice(0, 10);
  }
  return formatShamsiShort(date);
}

export function currentShamsiYear() {
  return toShamsi(new Date()).jy;
}

export function formatAFN(amount) {
  if (amount == null || isNaN(amount)) return "AFN 0";
  return `AFN ${amount.toLocaleString("en-US")}`;
}

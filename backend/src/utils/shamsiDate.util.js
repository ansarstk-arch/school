import jalaali from "jalaali-js";

export const SH_MONTHS = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدي", "دلو", "حوت",
];

export const SH_MONTHS_EN = [
  "Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sunbula",
  "Mizan", "Aqrab", "Qaws", "Jadi", "Dalwa", "Hut",
];

export const INSTITUTE_TYPE_LABELS = {
  School: "ښوونځی",
  Center: "مرکز",
  Madrasa: "مدرسه",
  all: "ټول",
};

/** Gregorian ISO date in Afghanistan timezone (UTC+4:30) */
export function getCurrentGregorianDateAfghanTZ() {
  const now = new Date();
  const afghan = new Date(now.getTime() + 4.5 * 60 * 60 * 1000);
  const y = afghan.getUTCFullYear();
  const m = String(afghan.getUTCMonth() + 1).padStart(2, "0");
  const d = String(afghan.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toShamsi(date = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date;
  const afghan = new Date(d.getTime() + 4.5 * 60 * 60 * 1000);
  return jalaali.toJalaali(
    afghan.getUTCFullYear(),
    afghan.getUTCMonth() + 1,
    afghan.getUTCDate()
  );
}

export function currentShamsiYear() {
  return toShamsi(new Date()).jy;
}

export function currentShamsiYearMonth() {
  const { jy, jm } = toShamsi(new Date());
  return `${jy}-${String(jm).padStart(2, "0")}`;
}

export function shamsiMonthKey(jy, jm) {
  return `${jy}-${String(jm).padStart(2, "0")}`;
}

export function daysInShamsiMonth(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
}

export function shamsiToGregorianISO(jy, jm, jd) {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function shamsiMonthToGregorianRange(jy, jm) {
  const start = shamsiToGregorianISO(jy, jm, 1);
  const end = shamsiToGregorianISO(jy, jm, daysInShamsiMonth(jy, jm));
  return { start, end };
}

/** Current Afghan month: cumulative from month start through today */
export function getCurrentShamsiMonthRange() {
  const { jy, jm } = toShamsi(new Date());
  const { start } = shamsiMonthToGregorianRange(jy, jm);
  const today = getCurrentGregorianDateAfghanTZ();
  return {
    monthKey: shamsiMonthKey(jy, jm),
    monthStart: start,
    monthEnd: today,
    jy,
    jm,
  };
}

/** Current Afghan year: from 1 Hamal through today */
export function getCurrentShamsiYearRange(yearOverride) {
  const jy = Number(yearOverride) || currentShamsiYear();
  const yearStart = shamsiToGregorianISO(jy, 1, 1);
  const today = getCurrentGregorianDateAfghanTZ();
  return { yearStart, yearEnd: today, jy };
}

/** Last N Afghan months including current, oldest first */
export function getLastNShamsiMonths(n = 5) {
  const { jy, jm } = toShamsi(new Date());
  const months = [];

  for (let i = n - 1; i >= 0; i--) {
    let mm = jm - i;
    let yy = jy;
    while (mm < 1) {
      mm += 12;
      yy -= 1;
    }
    const range = shamsiMonthToGregorianRange(yy, mm);
    months.push({
      jy: yy,
      jm: mm,
      name: SH_MONTHS[mm - 1],
      nameEn: SH_MONTHS_EN[mm - 1],
      monthKey: shamsiMonthKey(yy, mm),
      monthStart: range.start,
      monthEnd: range.end,
    });
  }

  return months;
}

/** Week range: last 7 days including today */
export function getWeekDateRange() {
  const today = getCurrentGregorianDateAfghanTZ();
  const d = new Date(today);
  d.setDate(d.getDate() - 6);
  const weekStart = d.toISOString().split("T")[0];
  return { weekStart, weekEnd: today };
}

export function getInstituteTypeLabel(type) {
  return INSTITUTE_TYPE_LABELS[type] || type;
}

export default {
  SH_MONTHS,
  SH_MONTHS_EN,
  getCurrentGregorianDateAfghanTZ,
  toShamsi,
  currentShamsiYear,
  currentShamsiYearMonth,
  getCurrentShamsiMonthRange,
  getCurrentShamsiYearRange,
  getLastNShamsiMonths,
  getWeekDateRange,
  getInstituteTypeLabel,
};

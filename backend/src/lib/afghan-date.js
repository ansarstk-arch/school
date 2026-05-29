// Afghan (Shamsi/Solar Hijri) calendar utilities

const SH_MONTHS = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدي", "دلو", "حوت",
];

/**
 * Get current Shamsi year
 * @returns {number} Current Shamsi year
 */
export const currentShamsiYear = () => {
  const now = new Date();
  const gregorianYear = now.getFullYear();
  
  // Simple approximation: Shamsi year is roughly Gregorian year - 621
  // This is a basic conversion, for production use a proper library like jalaali-js
  const shamsiYear = gregorianYear - 621;
  
  // Adjust for the fact that Shamsi new year (Nowruz) is around March 21
  const nowruz = new Date(gregorianYear, 2, 21); // March 21
  
  if (now < nowruz) {
    return shamsiYear - 1;
  }
  
  return shamsiYear;
};

/**
 * Simple Shamsi date conversion (approximation)
 * @param {Date|string} date - Gregorian date
 * @returns {object} Shamsi date components {jy, jm, jd}
 */
const toShamsi = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const gregorianYear = d.getFullYear();
  const gregorianMonth = d.getMonth() + 1;
  const gregorianDay = d.getDate();
  
  // Simple approximation - for production use jalaali-js
  let shamsiYear = gregorianYear - 621;
  
  // Adjust for Nowruz (around March 21)
  const nowruz = new Date(gregorianYear, 2, 21);
  if (d < nowruz) {
    shamsiYear -= 1;
  }
  
  // Simple month/day approximation
  let shamsiMonth = gregorianMonth;
  let shamsiDay = gregorianDay;
  
  // Adjust for the fact that Shamsi calendar starts around March 21
  if (gregorianMonth >= 3) {
    shamsiMonth = gregorianMonth - 2;
  } else {
    shamsiMonth = gregorianMonth + 10;
  }
  
  return { jy: shamsiYear, jm: shamsiMonth, jd: shamsiDay };
};

/**
 * Format Shamsi date as full text
 * @param {Date|string} date - Gregorian date
 * @returns {string} Formatted Shamsi date like "۱۵ حمل ۱۴۰۴"
 */
export const formatShamsi = (date) => {
  const { jy, jm, jd } = toShamsi(date);
  return `${jd} ${SH_MONTHS[jm - 1]} ${jy}`;
};

/**
 * Format Shamsi date as short format
 * @param {Date|string} date - Gregorian date
 * @returns {string} Formatted Shamsi date like "1404/04/15"
 */
export const formatShamsiDate = (date) => {
  if (!date) return "—";
  const { jy, jm, jd } = toShamsi(date);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
};

/**
 * Get today's Afghan date string
 * @returns {string} Today's date in Afghan format
 */
export const todayAfghan = () => {
  return formatShamsi(new Date());
};

/** Current Shamsi year-month, e.g. "1404-04" — matches fee payment month field */
export const currentShamsiYearMonth = () => {
  const { jy, jm } = toShamsi(new Date());
  return `${jy}-${String(jm).padStart(2, "0")}`;
};

/**
 * Convert Gregorian date to Shamsi date string
 * @param {Date|string} date - Gregorian date
 * @returns {string} Shamsi date in YYYY-MM-DD format
 */
export const toShamsiDate = (date) => {
  // This is a simplified conversion
  // For production, use a proper library like jalaali-js
  const d = new Date(date);
  const shamsiYear = currentShamsiYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${shamsiYear}-${month}-${day}`;
};

/**
 * Get Shamsi year range for academic years
 * @param {number} count - Number of years to include
 * @returns {Array} Array of year objects
 */
export const getShamsiYearRange = (count = 10) => {
  const currentYear = currentShamsiYear();
  const years = [];
  
  for (let i = 0; i < count; i++) {
    const year = currentYear - i;
    years.push({
      value: String(year),
      label: String(year),
    });
  }
  
  return years;
};

export default {
  currentShamsiYear,
  toShamsiDate,
  getShamsiYearRange,
  formatShamsi,
  formatShamsiDate,
  todayAfghan,
};
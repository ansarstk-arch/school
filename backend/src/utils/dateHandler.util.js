// Date and timezone handling utilities for attendance system

/**
 * Get current date in Afghanistan timezone (UTC+4:30)
 * Returns date in YYYY-MM-DD format
 */
export const getCurrentAfghanDate = () => {
  const now = new Date();
  // Afghanistan is UTC+4:30
  const afghanTime = new Date(now.getTime() + (4.5 * 60 * 60 * 1000));
  return afghanTime.toISOString().split('T')[0];
};

/**
 * Convert any date to Afghanistan timezone
 * @param {string|Date} date - Input date
 * @returns {string} Date in YYYY-MM-DD format in Afghan timezone
 */
export const toAfghanDate = (date) => {
  const inputDate = new Date(date);
  const afghanTime = new Date(inputDate.getTime() + (4.5 * 60 * 60 * 1000));
  return afghanTime.toISOString().split('T')[0];
};

/**
 * Check if a date is today in Afghanistan timezone
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isToday = (date) => {
  return date === getCurrentAfghanDate();
};

/**
 * Get midnight timestamp for a given date in Afghanistan timezone
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Date}
 */
export const getAfghanMidnight = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  // Create date at midnight Afghanistan time
  const midnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  // Adjust for Afghanistan timezone offset
  return new Date(midnight.getTime() - (4.5 * 60 * 60 * 1000));
};

/**
 * Validate if attendance date is not in the future
 * @param {string} attendanceDate - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isValidAttendanceDate = (attendanceDate) => {
  const today = getCurrentAfghanDate();
  return attendanceDate <= today;
};

/**
 * Get date range for attendance queries
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {object} Validated date range
 */
export const getDateRange = (startDate, endDate) => {
  const today = getCurrentAfghanDate();
  
  // Default to current month if no dates provided
  if (!startDate && !endDate) {
    const currentMonth = today.substring(0, 7); // YYYY-MM
    return {
      startDate: `${currentMonth}-01`,
      endDate: today,
    };
  }
  
  return {
    startDate: startDate || `${today.substring(0, 7)}-01`,
    endDate: endDate || today,
  };
};

/**
 * Handle midnight date transitions for QR scans
 * If scan happens within 30 minutes of midnight, allow for previous day
 * @param {string} scanTime - ISO timestamp of scan
 * @returns {string} Appropriate attendance date
 */
export const getAttendanceDateForScan = (scanTime = new Date().toISOString()) => {
  const scanDate = new Date(scanTime);
  const afghanTime = new Date(scanDate.getTime() + (4.5 * 60 * 60 * 1000));
  
  const hours = afghanTime.getHours();
  const minutes = afghanTime.getMinutes();
  
  // If scan is within 30 minutes after midnight, allow previous day attendance
  if (hours === 0 && minutes <= 30) {
    const previousDay = new Date(afghanTime);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay.toISOString().split('T')[0];
  }
  
  return afghanTime.toISOString().split('T')[0];
};

export default {
  getCurrentAfghanDate,
  toAfghanDate,
  isToday,
  getAfghanMidnight,
  isValidAttendanceDate,
  getDateRange,
  getAttendanceDateForScan,
};
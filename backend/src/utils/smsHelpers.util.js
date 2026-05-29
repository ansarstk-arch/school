/**
 * Format phone number for SMS sending
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, "");
  
  // If starts with 0, replace with country code (Afghanistan: +93)
  if (formatted.startsWith("0")) {
    formatted = "+93" + formatted.substring(1);
  }
  
  // If doesn't start with +, add +93
  if (!formatted.startsWith("+")) {
    formatted = "+93" + formatted;
  }
  
  return formatted;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} - Is valid
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  
  // Afghan phone numbers: +93 followed by 9 digits
  const afghanPattern = /^(\+93|0)?[7][0-9]{8}$/;
  return afghanPattern.test(phone.replace(/[\s\-()]/g, ""));
};

/**
 * Get position text in Pashto
 * @param {number} rank - Rank number
 * @returns {string} - Position in Pashto
 */
export const getPositionText = (rank) => {
  const positions = {
    1: "لومړی",
    2: "دویم",
    3: "دریم",
    4: "څلورم",
    5: "پنځم",
  };
  
  return positions[rank] || `${rank}م`;
};

/**
 * Get month name in Pashto (Shamsi calendar)
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} - Month name in Pashto
 */
export const getShamsiMonthName = (month) => {
  if (!month) return "";
  
  const monthNumber = parseInt(month.split("-")[1]);
  const months = [
    "وری", "غویی", "غبرګولی", "چنګاښ", "زمری", "وږی",
    "تله", "لړم", "لیندۍ", "مرغومی", "سلواغه", "کب"
  ];
  
  return months[monthNumber - 1] || month;
};

/**
 * Calculate SMS count based on message length
 * @param {string} message - Message content
 * @returns {number} - Number of SMS parts
 */
export const calculateSmsCount = (message) => {
  if (!message) return 0;
  
  const length = message.length;
  
  // Unicode SMS (Pashto): 70 characters per SMS
  if (length <= 70) return 1;
  if (length <= 134) return 2;
  if (length <= 201) return 3;
  
  return Math.ceil(length / 67);
};

/**
 * Generate batch ID
 * @returns {string} - Batch ID
 */
export const generateBatchId = () => {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `SMS-${date}-${time}-${random}`;
};

import crypto from 'crypto';

// QR Security utilities for enhanced QR code validation
// This provides basic security measures until full encryption is implemented

const QR_SECRET = process.env.QR_SECRET || 'afghan-school-erp-2024';
const QR_EXPIRY_HOURS = 24; // QR codes expire after 24 hours

/**
 * Generate a secure QR code with timestamp and checksum
 * @param {string} attendanceType - Student/Teacher/Staff
 * @param {number} personId - Person ID
 * @param {number} classId - Class ID (optional)
 * @returns {string} Secure QR code
 */
export const generateSecureQR = (attendanceType, personId, classId = null) => {
  const timestamp = Date.now();
  const baseData = `${attendanceType}:${personId}${classId ? `:${classId}` : ''}`;
  
  // Create checksum using HMAC
  const hmac = crypto.createHmac('sha256', QR_SECRET);
  hmac.update(`${baseData}:${timestamp}`);
  const checksum = hmac.digest('hex').substring(0, 8);
  
  return `${baseData}:${timestamp}:${checksum}`;
};

/**
 * Validate and parse a secure QR code
 * @param {string} qrCode - QR code to validate
 * @returns {object} Parsed QR data or throws error
 */
export const validateSecureQR = (qrCode) => {
  try {
    const parts = qrCode.split(':');
    
    // Handle legacy QR codes (without security)
    if (parts.length === 2 || parts.length === 3) {
      // Legacy format: "TYPE:ID" or "TYPE:ID:CLASS"
      return parseLegacyQR(qrCode);
    }
    
    // Secure format: "TYPE:ID:CLASS:TIMESTAMP:CHECKSUM" or "TYPE:ID:TIMESTAMP:CHECKSUM"
    if (parts.length !== 4 && parts.length !== 5) {
      throw new Error("Invalid QR code format");
    }
    
    const attendanceType = parts[0];
    const personId = parseInt(parts[1]);
    let classId = null;
    let timestamp, checksum;
    
    if (parts.length === 5) {
      // Has class ID
      classId = parseInt(parts[2]);
      timestamp = parseInt(parts[3]);
      checksum = parts[4];
    } else {
      // No class ID
      timestamp = parseInt(parts[2]);
      checksum = parts[3];
    }
    
    // Validate timestamp (check expiry)
    const now = Date.now();
    const ageHours = (now - timestamp) / (1000 * 60 * 60);
    
    if (ageHours > QR_EXPIRY_HOURS) {
      throw new Error("QR کوډ د وخت له مخې ختم شوی دی");
    }
    
    // Validate checksum
    const baseData = `${attendanceType}:${personId}${classId ? `:${classId}` : ''}`;
    const hmac = crypto.createHmac('sha256', QR_SECRET);
    hmac.update(`${baseData}:${timestamp}`);
    const expectedChecksum = hmac.digest('hex').substring(0, 8);
    
    if (checksum !== expectedChecksum) {
      throw new Error("QR کوډ د امنیت له مخې سم نه دی");
    }
    
    // Validate attendance type
    if (!["Student", "Teacher", "Staff"].includes(attendanceType)) {
      throw new Error("Invalid attendance type in QR code");
    }
    
    // Validate person ID
    if (isNaN(personId) || personId <= 0) {
      throw new Error("Invalid person ID in QR code");
    }
    
    return { attendanceType, personId, classId, timestamp };
    
  } catch (error) {
    throw new Error(error.message || "د QR کوډ فارمټ سم نه دی");
  }
};

/**
 * Parse legacy QR codes for backward compatibility
 * @param {string} qrCode - Legacy QR code
 * @returns {object} Parsed QR data
 */
const parseLegacyQR = (qrCode) => {
  const parts = qrCode.split(":");
  
  if (parts.length < 2) {
    throw new Error("Invalid QR code format");
  }
  
  const attendanceType = parts[0];
  const personId = parseInt(parts[1]);
  const classId = parts[2] ? parseInt(parts[2]) : null;
  
  if (!["Student", "Teacher", "Staff"].includes(attendanceType)) {
    throw new Error("Invalid attendance type in QR code");
  }
  
  if (isNaN(personId) || personId <= 0) {
    throw new Error("Invalid person ID in QR code");
  }
  
  return { attendanceType, personId, classId, timestamp: null };
};

/**
 * Generate QR codes for bulk export
 * @param {Array} people - Array of people objects
 * @param {string} attendanceType - Student/Teacher/Staff
 * @returns {Array} Array of QR codes with person info
 */
export const generateBulkQRCodes = (people, attendanceType) => {
  return people.map(person => ({
    ...person,
    qrCode: generateSecureQR(attendanceType, person.id, person.classId),
    qrText: `${attendanceType}:${person.id}${person.classId ? `:${person.classId}` : ''}`,
  }));
};

/**
 * Validate QR scan rate limiting
 * @param {string} personKey - Unique person identifier
 * @param {Map} scanCache - Rate limiting cache
 * @returns {boolean} Whether scan is allowed
 */
export const validateScanRate = (personKey, scanCache) => {
  const now = Date.now();
  const cached = scanCache.get(personKey);
  
  if (!cached) {
    scanCache.set(personKey, { lastScan: now, count: 1 });
    return true;
  }
  
  const timeDiff = now - cached.lastScan;
  const RATE_LIMIT_WINDOW = 10000; // 10 seconds
  const MAX_SCANS = 2;
  
  if (timeDiff < RATE_LIMIT_WINDOW) {
    if (cached.count >= MAX_SCANS) {
      return false;
    }
    cached.count++;
  } else {
    cached.count = 1;
    cached.lastScan = now;
  }
  
  return true;
};

export default {
  generateSecureQR,
  validateSecureQR,
  generateBulkQRCodes,
  validateScanRate,
};
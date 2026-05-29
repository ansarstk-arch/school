/**
 * Parse attendance QR payloads.
 * Canonical ID card format: st:123 | th:45 | sf:67
 * Legacy: Student:123:5 | Staff:67
 */

const PREFIX_MAP = {
  st: "Student",
  th: "Teacher",
  sf: "Staff",
};

const parseInteger = (value) => {
  if (value === undefined || value === null) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeLegacyType = (value) => {
  if (!value) return null;
  const type = String(value).trim().toLowerCase();
  if (type === "student") return "Student";
  if (type === "staff") return "Staff";
  if (type === "teacher") return "Teacher";
  return null;
};

/**
 * @param {string} qrCode
 * @returns {{
 *   attendanceType: string,
 *   personId: number,
 *   classId: number|null,
 *   rawValue: string,
 *   isJsonPayload: boolean,
 * }}
 */
export function parseAttendanceQrCode(qrCode) {
  if (!qrCode) {
    throw new Error("Invalid QR code format");
  }

  const trimmedValue = String(qrCode).trim();

  if (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) {
    const payload = JSON.parse(trimmedValue);
    const attendanceType = normalizeLegacyType(payload.type || payload.attendanceType);
    const personId = parseInteger(payload.id ?? payload.personId);
    const classId = parseInteger(payload.classId ?? payload.class);

    if (!attendanceType || !personId) {
      throw new Error("Invalid QR payload");
    }

    return {
      attendanceType,
      personId,
      classId,
      rawValue: trimmedValue,
      isJsonPayload: true,
    };
  }

  const prefixMatch = trimmedValue.match(/^(st|th|sf):?(\d+)$/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    const personId = parseInteger(prefixMatch[2]);
    if (!personId) throw new Error("Invalid person ID in QR code");

    return {
      attendanceType: PREFIX_MAP[prefix],
      personId,
      classId: null,
      rawValue: trimmedValue,
      isJsonPayload: false,
    };
  }

  const parts = trimmedValue.split(":");
  if (parts.length >= 2) {
    const attendanceType = normalizeLegacyType(parts[0]);
    const personId = parseInteger(parts[1]);
    const classId = parseInteger(parts[2] ?? null);

    if (!attendanceType || !personId) {
      throw new Error("Invalid QR code format");
    }

    return {
      attendanceType,
      personId,
      classId,
      rawValue: trimmedValue,
      isJsonPayload: false,
    };
  }

  throw new Error("Invalid QR code format");
}

export function buildAttendanceQrPayload(role, id) {
  const map = { student: "st", teacher: "th", staff: "sf" };
  const prefix = map[role];
  if (!prefix || id == null) return "";
  return `${prefix}:${id}`;
}

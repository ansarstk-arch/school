/** QR payload prefixes for attendance (must match backend parser). */
export const QR_ROLE_PREFIX = {
  student: "st",
  teacher: "th",
  staff: "sf",
};

/**
 * Build QR code value for ID cards and scanners.
 * @param {"student"|"teacher"|"staff"} role
 * @param {number|string} id
 */
export function buildAttendanceQrPayload(role, id) {
  const prefix = QR_ROLE_PREFIX[role];
  if (!prefix || id == null || id === "") return "";
  return `${prefix}:${id}`;
}

/** True if string looks like an attendance QR payload. */
export function isAttendanceQrPayload(value) {
  if (!value || typeof value !== "string") return false;
  const t = value.trim().toLowerCase();
  return /^(st|th|sf):?\d+$/i.test(t) || /^student:\d+/i.test(t) || /^staff:\d+/i.test(t);
}

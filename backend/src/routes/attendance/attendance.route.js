import { Router } from "express";
import {
  getAllAttendance,
  getPeopleForAttendance,
  bulkCreateAttendance,
  qrAttendance,
  getAttendanceStats,
  downloadAttendanceReport,
} from "../../controllers/attendance/attendance.controller.js";
import {
  getAllSettings,
  getSettingsByType,
  updateSettings,
} from "../../controllers/attendance/attendance-settings.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  bulkAttendanceValidator,
  qrAttendanceValidator,
} from "../../validator/attendance/attendance.validator.js";

const router = Router();

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
// Get all attendance (with filtering and pagination)
router.get("/", getAllAttendance);

// Get attendance statistics
router.get("/stats/summary", getAttendanceStats);

// Get people for attendance (students/staff)
router.get("/people/list", getPeopleForAttendance);

// Download attendance report
router.get("/download/report", downloadAttendanceReport);

// Attendance settings
router.get("/settings", getAllSettings);
router.get("/settings/:institutionType", getSettingsByType);

// ─── PROTECTED ROUTES ──────────────────────────────────────────────────────────
// Bulk create/update attendance records
router.post("/bulk", 
  authMiddleware, 
  validate(bulkAttendanceValidator), 
  bulkCreateAttendance
);

// QR code attendance
router.post("/qr", 
  authMiddleware, 
  validate(qrAttendanceValidator), 
  qrAttendance
);

// Update attendance settings
router.patch("/settings/:institutionType", authMiddleware, updateSettings);

export default router;
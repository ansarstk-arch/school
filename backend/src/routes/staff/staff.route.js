import { Router } from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
  toggleStaffStatus,
} from "../../controllers/staff/staff.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createStaffValidator,
  updateStaffValidator,
  resetStaffPasswordValidator,
} from "../../validator/staff/staff.validator.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

// ─── STAFF ROUTES ──────────────────────────────────────────────────────────────
// Public: list and view
router.get("/", getAllStaff);
router.get("/:id", getStaffById);

// Protected: create/update/delete require authentication
router.post("/", authMiddleware, upload.single("image"), validate(createStaffValidator), createStaff);
router.post("/:id/reset-password", authMiddleware, validate(resetStaffPasswordValidator), resetStaffPassword);
router.put("/:id", authMiddleware, upload.single("image"), validate(updateStaffValidator), updateStaff);
router.patch("/:id/status", authMiddleware, toggleStaffStatus);
router.delete("/:id", authMiddleware, deleteStaff);

export default router;

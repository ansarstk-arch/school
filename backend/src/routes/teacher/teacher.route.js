import { Router } from "express";
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getAllApplicants,
  getApplicantById,
  createApplicant,
  updateApplicant,
  deleteApplicant,
  convertApplicantToTeacher,
  toggleTeacherStatus,
  getClassesByTeacherTypes,
  resetTeacherPassword,
  getMyTeacherDashboard,
  getMyClassAttendance,
  submitTeacherClassAttendance,
} from "../../controllers/teacher/teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createTeacherValidator,
  updateTeacherValidator,
  createApplicantValidator,
  updateApplicantValidator,
  resetTeacherPasswordValidator,
  teacherAttendanceValidator,
} from "../../validator/teacher/teacher.validator.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ─── TEACHER ROUTES ────────────────────────────────────────────────────────────
router.get("/me/dashboard", getMyTeacherDashboard);
router.get("/me/classes/:classId/attendance", getMyClassAttendance);
router.post("/me/attendance", validate(teacherAttendanceValidator), submitTeacherClassAttendance);

router.get("/", getAllTeachers);
router.get("/classes-by-types", getClassesByTeacherTypes);
router.get("/:id", getTeacherById);
router.post("/:id/reset-password", validate(resetTeacherPasswordValidator), resetTeacherPassword);
router.post("/", upload.single("image"), validate(createTeacherValidator), createTeacher);
router.put("/:id", upload.single("image"), validate(updateTeacherValidator), updateTeacher);
router.patch("/:id/status", toggleTeacherStatus);
router.delete("/:id", deleteTeacher);

// ─── APPLICANT ROUTES ──────────────────────────────────────────────────────────
router.get("/applicants/all", getAllApplicants);
router.get("/applicants/:id", getApplicantById);
router.post("/applicants", validate(createApplicantValidator), createApplicant);
router.put("/applicants/:id", validate(updateApplicantValidator), updateApplicant);
router.delete("/applicants/:id", deleteApplicant);
router.post("/applicants/:id/convert", convertApplicantToTeacher);

export default router;

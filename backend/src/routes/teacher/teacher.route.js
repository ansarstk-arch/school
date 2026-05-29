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
} from "../../controllers/teacher/teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createTeacherValidator,
  updateTeacherValidator,
  createApplicantValidator,
  updateApplicantValidator,
} from "../../validator/teacher/teacher.validator.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ─── TEACHER ROUTES ────────────────────────────────────────────────────────────
router.get("/", getAllTeachers);
router.get("/:id", getTeacherById);
router.post("/", upload.single("image"), validate(createTeacherValidator), createTeacher);
router.put("/:id", upload.single("image"), validate(updateTeacherValidator), updateTeacher);
router.delete("/:id", deleteTeacher);

// ─── APPLICANT ROUTES ──────────────────────────────────────────────────────────
router.get("/applicants/all", getAllApplicants);
router.get("/applicants/:id", getApplicantById);
router.post("/applicants", validate(createApplicantValidator), createApplicant);
router.put("/applicants/:id", validate(updateApplicantValidator), updateApplicant);
router.delete("/applicants/:id", deleteApplicant);
router.post("/applicants/:id/convert", convertApplicantToTeacher);

export default router;

import { Router } from "express";
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleStudentStatus,
  getClassesByTypeAndYear,
  getParentNumbers,
  toggleParentCallStatus,
} from "../../controllers/student/student.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createStudentValidator,
  updateStudentValidator,
} from "../../validator/student/student.validator.js";
import { studentUpload } from "../../middlewares/upload.middleware.js";

const router = Router();

// ─── STUDENT ROUTES ────────────────────────────────────────────────────────────
router.get("/", getAllStudents);
router.get("/classes-by-type", getClassesByTypeAndYear);
router.get("/parent-numbers", getParentNumbers);
router.patch("/parent-numbers/call-status", toggleParentCallStatus);
router.get("/:id", getStudentById);
router.post("/", studentUpload.single("image"), validate(createStudentValidator), createStudent);
router.put("/:id", studentUpload.single("image"), validate(updateStudentValidator), updateStudent);
router.patch("/:id/status", toggleStudentStatus);
router.delete("/:id", deleteStudent);

export default router;

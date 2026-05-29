import { Router } from "express";
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getClassesByTypeAndYear,
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
router.get("/:id", getStudentById);
router.post("/", studentUpload.single("image"), validate(createStudentValidator), createStudent);
router.put("/:id", studentUpload.single("image"), validate(updateStudentValidator), updateStudent);
router.delete("/:id", deleteStudent);

export default router;

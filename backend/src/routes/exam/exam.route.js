import { Router } from "express";
import { 
  getAllExams, 
  getExamById, 
  createExam, 
  updateExam, 
  deleteExam,
  getClassesByInstitution,
  updateExpiredExamStatuses
} from "../../controllers/exam/exam.controller.js";
import { createExamValidator, updateExamValidator } from "../../validator/exam/exam.validator.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ─── EXAM ROUTES ───────────────────────────────────────────────────────────────

// GET /api/v1/exams - Get all exams with filtering and pagination
router.get("/", getAllExams);

// GET /api/v1/exams/classes-by-institution - Get classes by institution type
router.get("/classes-by-institution", getClassesByInstitution);

// POST /api/v1/exams/update-expired-statuses - Update expired exam statuses
router.post("/update-expired-statuses", updateExpiredExamStatuses);

// GET /api/v1/exams/:id - Get exam by ID
router.get("/:id", getExamById);

// POST /api/v1/exams - Create new exam
router.post("/", validate(createExamValidator), createExam);

// PUT /api/v1/exams/:id - Update exam
router.put("/:id", validate(updateExamValidator), updateExam);

// DELETE /api/v1/exams/:id - Delete exam
router.delete("/:id", deleteExam);

export default router;
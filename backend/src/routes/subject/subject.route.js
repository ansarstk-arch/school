import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createSubjectValidator, updateSubjectValidator } from "../../validator/subject/subject.validator.js";
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getClassesByTypeAndYear,
} from "../../controllers/subject/subject.controller.js";

const router = Router();

router.use(authMiddleware);

// Get classes by type (must come before /:id to avoid route conflict)
router.get("/classes-by-type", getClassesByTypeAndYear);

// CRUD routes
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.post("/", validate(createSubjectValidator), createSubject);
router.put("/:id", validate(updateSubjectValidator), updateSubject);
router.delete("/:id", deleteSubject);

export default router;

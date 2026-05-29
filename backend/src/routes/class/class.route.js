import { Router } from "express";
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getTeachersByType,
} from "../../controllers/class/class.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createClassValidator, updateClassValidator } from "../../validator/class/class.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/teachers-by-type", getTeachersByType);
router.get("/", getAllClasses);
router.get("/:id", getClassById);
router.post("/", validate(createClassValidator), createClass);
router.put("/:id", validate(updateClassValidator), updateClass);
router.delete("/:id", deleteClass);

export default router;

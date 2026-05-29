import { Router } from "express";
import {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  getClassesByTypes,
  getStudentsByTypesAndClasses,
  changeParentPassword,
} from "../../controllers/parent/parent.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createParentValidator,
  updateParentValidator,
} from "../../validator/parent/parent.validator.js";

const router = Router();

// ─── PARENT ROUTES ─────────────────────────────────────────────────────────────
router.get("/", getAllParents);
router.get("/classes-by-types", getClassesByTypes);
router.get("/students-by-types", getStudentsByTypesAndClasses);
router.get("/:id", getParentById);
router.post("/", validate(createParentValidator), createParent);
router.put("/:id", validate(updateParentValidator), updateParent);
router.patch("/:id/change-password", changeParentPassword);
router.delete("/:id", deleteParent);

export default router;

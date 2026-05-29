import { Router } from "express";
import {
  getAllMarks,
  getMarksEntrySheet,
  getMarkById,
  createMark,
  bulkSaveMarks,
  updateMark,
  deleteMark,
  exportMarksExcel,
  exportMarksPDF,
} from "../../controllers/marks/marks.controller.js";
import {
  createMarkValidator,
  bulkMarksValidator,
  updateMarkValidator,
  markIdValidator,
} from "../../validator/marks/marks.validator.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/export/excel", exportMarksExcel);
router.get("/export/pdf", exportMarksPDF);
router.get("/entry-sheet", getMarksEntrySheet);
router.post("/bulk", validate(bulkMarksValidator), bulkSaveMarks);
router.get("/", getAllMarks);
router.get("/:id", validate(markIdValidator), getMarkById);
router.post("/", validate(createMarkValidator), createMark);
router.put("/:id", validate(updateMarkValidator), updateMark);
router.delete("/:id", validate(markIdValidator), deleteMark);

export default router;

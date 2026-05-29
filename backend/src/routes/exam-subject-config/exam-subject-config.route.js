import { Router } from "express";
import {
  getAllExamSubjectConfigs,
  getExamSubjectConfigById,
  getSubjectsForExamClass,
  createExamSubjectConfig,
  bulkUpsertExamSubjectConfig,
  updateExamSubjectConfig,
  deleteExamSubjectConfig,
} from "../../controllers/exam-subject-config/exam-subject-config.controller.js";
import {
  createExamSubjectConfigValidator,
  updateExamSubjectConfigValidator,
  bulkUpsertConfigValidator,
  configIdValidator,
} from "../../validator/exam-subject-config/exam-subject-config.validator.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getAllExamSubjectConfigs);
router.get("/subjects-for-class", getSubjectsForExamClass);
router.post("/bulk-upsert", validate(bulkUpsertConfigValidator), bulkUpsertExamSubjectConfig);
router.get("/:id", validate(configIdValidator), getExamSubjectConfigById);
router.post("/", validate(createExamSubjectConfigValidator), createExamSubjectConfig);
router.put("/:id", validate(updateExamSubjectConfigValidator), updateExamSubjectConfig);
router.delete("/:id", validate(configIdValidator), deleteExamSubjectConfig);

export default router;

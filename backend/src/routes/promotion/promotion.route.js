import { Router } from "express";
import {
  getAllPromotions,
  getPromotionById,
  promoteIndividualStudent,
  promoteWholeClass,
  searchStudentById,
  getEligibleStudents,
  previewPromotion,
  rollbackPromotionById,
  getStudentPromotionHistory,
  getNextClassForStudent,
} from "../../controllers/promotion/promotion.controller.js";
import {
  promoteIndividualValidator,
  promoteBulkValidator,
  getEligibleStudentsValidator,
  previewPromotionValidator,
  promotionIdValidator,
  studentIdValidator,
  getNextClassValidator,
} from "../../validator/promotion/promotion.validator.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Promotion operations
router.post("/individual", validate(promoteIndividualValidator), promoteIndividualStudent);
router.post("/class", validate(promoteBulkValidator), promoteWholeClass);
router.post("/preview", validate(previewPromotionValidator), previewPromotion);

// Search student
router.get("/search/:studentId", validate(studentIdValidator), searchStudentById);

// Get operations
router.get("/", getAllPromotions);
router.get("/eligible", validate(getEligibleStudentsValidator), getEligibleStudents);
router.get("/:id", validate(promotionIdValidator), getPromotionById);

// Student-specific
router.get("/student/:studentId/history", validate(studentIdValidator), getStudentPromotionHistory);
router.get("/student/:studentId/next-class", validate(getNextClassValidator), getNextClassForStudent);

// Rollback
router.put("/:id/rollback", validate(promotionIdValidator), rollbackPromotionById);

export default router;

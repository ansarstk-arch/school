import { Router } from "express";
import {
  createAdvance,
  getAllAdvances,
  getAdvanceById,
  updateAdvance,
  deleteAdvance,
} from "../../controllers/salary/salary.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createAdvanceValidator,
  updateAdvanceValidator,
  getAdvancesValidator,
} from "../../validator/salary/salary.validator.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get advance by ID
router.get(
  "/:id",
  authMiddleware,
  getAdvanceById
);

// Get all advances (with filters, pagination, sorting)
router.get(
  "/",
  authMiddleware,
  validate(getAdvancesValidator),
  getAllAdvances
);

// Create advance
router.post(
  "/",
  authMiddleware,
  validate(createAdvanceValidator),
  createAdvance
);

// Update advance
router.put(
  "/:id",
  authMiddleware,
  validate(updateAdvanceValidator),
  updateAdvance
);

// Delete advance
router.delete(
  "/:id",
  authMiddleware,
  deleteAdvance
);

export default router;

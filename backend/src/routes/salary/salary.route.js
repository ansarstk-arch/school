import { Router } from "express";
import {
  createSalary,
  bulkGenerateSalaries,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  markSalaryAsPaid,
  undoSalaryPayment,
  deleteSalary,
  getSalaryStatistics,
  downloadSalarySlip,
  downloadSalaryExcel,
  downloadSalaryPDF,
} from "../../controllers/salary/salary.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  generateSalaryValidator,
  bulkGenerateSalaryValidator,
  updateSalaryValidator,
  paySalaryValidator,
  getSalariesValidator,
} from "../../validator/salary/salary.validator.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SALARY ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get salary statistics
router.get(
  "/statistics",
  authMiddleware,
  getSalaryStatistics
);

// Export salaries to Excel
router.get(
  "/export/excel",
  authMiddleware,
  downloadSalaryExcel
);

// Export salaries to PDF
router.get(
  "/export/pdf",
  authMiddleware,
  downloadSalaryPDF
);

// Download salary slip
router.get(
  "/:id/slip",
  authMiddleware,
  downloadSalarySlip
);

// Get salary by ID
router.get(
  "/:id",
  authMiddleware,
  getSalaryById
);

// Get all salaries (with filters, pagination, sorting)
router.get(
  "/",
  authMiddleware,
  validate(getSalariesValidator),
  getAllSalaries
);

// Create salary
router.post(
  "/",
  authMiddleware,
  validate(generateSalaryValidator),
  createSalary
);

// Bulk generate salaries
router.post(
  "/bulk",
  authMiddleware,
  validate(bulkGenerateSalaryValidator),
  bulkGenerateSalaries
);

// Mark salary as paid
router.patch(
  "/:id/paid",
  authMiddleware,
  validate(paySalaryValidator),
  markSalaryAsPaid
);

// Undo salary payment (paid records only)
router.patch(
  "/:id/undo-payment",
  authMiddleware,
  undoSalaryPayment
);

// Update salary
router.put(
  "/:id",
  authMiddleware,
  validate(updateSalaryValidator),
  updateSalary
);

// Delete salary
router.delete(
  "/:id",
  authMiddleware,
  deleteSalary
);

export default router;

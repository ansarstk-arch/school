import { Router } from "express";
import {
  getFeePayments,
  getFeePaymentById,
  getStudentForFee,
  getStudentsByFilters,
  getStudentsByIds,
  createFeePayment,
  updateFeePayment,
  deleteFeePayment,
  getFeeStatistics,
  exportFeePayments,
  generateReceiptPDF,
  generateMultipleReceiptsPDFEndpoint,
} from "../../controllers/fee/fee.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import {
  createFeePaymentValidator,
  updateFeePaymentValidator,
  getFeePaymentsValidator,
  exportFeePaymentsValidator,
} from "../../validator/fee/fee.validator.js";
import { idParamValidator } from "../../validator/phone/mobile.validator.js";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ─── GET ROUTES ─────────────────────────────────────────────────────────────────
router.get("/", getFeePaymentsValidator, requestValidator, getFeePayments);
router.get("/statistics", getFeeStatistics);
router.get("/export", exportFeePaymentsValidator, requestValidator, exportFeePayments);
router.get("/student/:id", idParamValidator, requestValidator, getStudentForFee);
router.get("/students", getStudentsByFilters);
router.get("/:id/receipt", idParamValidator, requestValidator, generateReceiptPDF);
router.get("/:id", idParamValidator, requestValidator, getFeePaymentById);

// ─── POST ROUTES ────────────────────────────────────────────────────────────────
router.post("/", createFeePaymentValidator, requestValidator, createFeePayment);
router.post("/receipts/multiple", generateMultipleReceiptsPDFEndpoint);
router.post("/students/by-ids", getStudentsByIds);

// ─── PUT ROUTES ─────────────────────────────────────────────────────────────────
router.put("/:id", idParamValidator, updateFeePaymentValidator, requestValidator, updateFeePayment);

// ─── DELETE ROUTES ──────────────────────────────────────────────────────────────
router.delete("/:id", idParamValidator, requestValidator, deleteFeePayment);

export default router;
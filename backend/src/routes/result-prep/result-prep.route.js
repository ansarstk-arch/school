import { Router } from "express";
import {
  runResultCalculation,
  getResultPrepRecords,
  getResultPrepSummary,
  downloadItlaNamaExcel,
  downloadItlaNamaPDF,
} from "../../controllers/result-prep/result-prep.controller.js";
import { resultCalcValidator } from "../../validator/marks/marks.validator.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/summary", getResultPrepSummary);
router.get("/itla-nama/excel", downloadItlaNamaExcel);
router.get("/itla-nama/pdf", downloadItlaNamaPDF);
router.post("/calculate", validate(resultCalcValidator), runResultCalculation);
router.get("/", getResultPrepRecords);

export default router;

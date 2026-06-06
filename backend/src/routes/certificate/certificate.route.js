import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  getCertificateExams,
  getCertificateClasses,
  getCertificateBatchData,
} from "../../controllers/certificate/certificate.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/exams", getCertificateExams);
router.get("/classes", getCertificateClasses);
router.get("/batch-data", getCertificateBatchData);

export default router;

import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  getStudentReportCard,
  getClassReportCards,
} from "../../controllers/report-card/report-card.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/student", getStudentReportCard);
router.get("/class", getClassReportCards);

export default router;

import { Router } from "express";
import {
  getStudentReportCard,
  getClassReportCards,
} from "../../controllers/report-card/report-card.controller.js";

const router = Router();

// Get single student report card
router.get("/student", getStudentReportCard);

// Get all report cards for a class
router.get("/class", getClassReportCards);

export default router;

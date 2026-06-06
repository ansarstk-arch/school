import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getSmsSettings,
  getSmsEndpoints,
  upsertSmsSettings,
  upsertSmsEndpoint,
  testSmsConnection,
  deleteSmsSettings,
} from "../../controllers/sms/sms-settings.controller.js";
import {
  getAllSmsTemplates,
  getSmsTemplateById,
  createSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate,
  getDefaultTemplates,
  seedDefaultTemplates,
} from "../../controllers/sms/sms-templates.controller.js";
import {
  getAbsentRecipients,
  getPresentRecipients,
  getFeeRecipients,
  getExamRecipients,
  sendSmsToParents,
  sendSmsSingle,
  getSmsLogs,
  retrySms,
  getSmsStatistics,
} from "../../controllers/sms/sms.controller.js";
import {
  upsertSmsSettingsValidator,
  upsertSmsEndpointValidator,
  testSmsConnectionValidator,
  createSmsTemplateValidator,
  updateSmsTemplateValidator,
  deleteSmsTemplateValidator,
  getAbsentRecipientsValidator,
  getPresentRecipientsValidator,
  getFeeRecipientsValidator,
  getExamRecipientsValidator,
  sendSmsToParentsValidator,
  sendSmsSingleValidator,
  retrySmsValidator,
  getSmsLogsValidator,
} from "../../validator/sms/sms.validator.js";

const router = Router();
// router.use(authMiddleware);
// ─── SMS ENDPOINTS / SETTINGS ROUTES ───────────────────────────────────────────
router.get("/endpoints",  getSmsEndpoints);
router.put("/endpoints",  validate(upsertSmsEndpointValidator), upsertSmsEndpoint);
router.get("/settings",  getSmsSettings);
router.post("/settings",  validate(upsertSmsSettingsValidator), upsertSmsSettings);
router.post("/settings/test",  validate(testSmsConnectionValidator), testSmsConnection);
router.delete("/settings",  deleteSmsSettings);

// ─── SMS TEMPLATES ROUTES ──────────────────────────────────────────────────────
router.get("/templates",  getAllSmsTemplates);
router.get("/templates/default",  getDefaultTemplates);
router.post("/templates/seed",  seedDefaultTemplates);
router.get("/templates/:id",  getSmsTemplateById);
router.post("/templates",  validate(createSmsTemplateValidator), createSmsTemplate);
router.put("/templates/:id",  validate(updateSmsTemplateValidator), updateSmsTemplate);
router.delete("/templates/:id",  validate(deleteSmsTemplateValidator), deleteSmsTemplate);

// ─── SMS RECIPIENTS ROUTES ─────────────────────────────────────────────────────
router.get("/recipients/absent",  validate(getAbsentRecipientsValidator), getAbsentRecipients);
router.get("/recipients/present",  validate(getPresentRecipientsValidator), getPresentRecipients);
router.get("/recipients/fee",  validate(getFeeRecipientsValidator), getFeeRecipients);
router.get("/recipients/exam",  validate(getExamRecipientsValidator), getExamRecipients);

// ─── SMS SENDING ROUTES ────────────────────────────────────────────────────────
router.post("/send",  validate(sendSmsToParentsValidator), sendSmsToParents);
router.post("/send-single",  validate(sendSmsSingleValidator), sendSmsSingle);

// ─── SMS LOGS & REPORTS ROUTES ─────────────────────────────────────────────────
router.get("/logs",  validate(getSmsLogsValidator), getSmsLogs);
router.post("/logs/:id/retry",  validate(retrySmsValidator), retrySms);
router.get("/statistics",  getSmsStatistics);

export default router;

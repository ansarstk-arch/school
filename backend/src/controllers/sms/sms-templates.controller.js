import { eq, like, and, desc } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { smsTemplates } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";

// ─── GET ALL SMS TEMPLATES ─────────────────────────────────────────────────────
export const getAllSmsTemplates = asyncHandler(async (req, res) => {
  const { templateType, isActive } = req.query;

  const conditions = [];
  if (templateType) conditions.push(eq(smsTemplates.templateType, templateType));
  if (isActive !== undefined) conditions.push(eq(smsTemplates.isActive, isActive === "true"));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const templates = await db
    .select()
    .from(smsTemplates)
    .where(whereClause)
    .orderBy(desc(smsTemplates.createdAt));

  // Parse variables JSON
  const parsedTemplates = templates.map(t => ({
    ...t,
    variables: t.variables ? JSON.parse(t.variables) : [],
  }));

  res.respond(200, "د SMS کالبدونه ترلاسه شول", { templates: parsedTemplates });
});

// ─── GET SMS TEMPLATE BY ID ────────────────────────────────────────────────────
export const getSmsTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
  if (!template) throw new ApiError(404, "کالبد ونه موندل شو");

  const parsedTemplate = {
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  };

  res.respond(200, "کالبد ترلاسه شو", { template: parsedTemplate });
});

// ─── CREATE SMS TEMPLATE ───────────────────────────────────────────────────────
export const createSmsTemplate = asyncHandler(async (req, res) => {
  const { templateType, templateName, messagePs, messageDa, variables } = req.body;

  if (!templateType) throw new ApiError(400, "د کالبد ډول اړین دی");
  if (!templateName) throw new ApiError(400, "د کالبد نوم اړین دی");
  if (!messagePs) throw new ApiError(400, "پښتو پیغام اړین دی");

  // Validate template type
  const validTypes = ["Absent", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"];
  if (!validTypes.includes(templateType)) {
    throw new ApiError(400, "د کالبد ډول سم نه دی");
  }

  // Parse variables if string
  const parsedVariables = typeof variables === "string" ? JSON.parse(variables) : variables || [];

  const [newTemplate] = await db
    .insert(smsTemplates)
    .values({
      templateType,
      templateName,
      messagePs,
      messageDa: messageDa || null,
      variables: JSON.stringify(parsedVariables),
      isActive: true,
    })
    .returning();

  const result = {
    ...newTemplate,
    variables: JSON.parse(newTemplate.variables),
  };

  res.respond(201, "کالبد بریالیتوب سره جوړ شو", { template: result });
});

// ─── UPDATE SMS TEMPLATE ───────────────────────────────────────────────────────
export const updateSmsTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { templateType, templateName, messagePs, messageDa, variables, isActive } = req.body;

  const [existingTemplate] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
  if (!existingTemplate) throw new ApiError(404, "کالبد ونه موندل شو");

  // Validate template type if provided
  if (templateType) {
    const validTypes = ["Absent", "Fee", "ExamPass", "ExamFail", "Homework", "Custom"];
    if (!validTypes.includes(templateType)) {
      throw new ApiError(400, "د کالبد ډول سم نه دی");
    }
  }

  const updateData = { updatedAt: new Date().toISOString() };
  if (templateType !== undefined) updateData.templateType = templateType;
  if (templateName !== undefined) updateData.templateName = templateName;
  if (messagePs !== undefined) updateData.messagePs = messagePs;
  if (messageDa !== undefined) updateData.messageDa = messageDa || null;
  if (variables !== undefined) {
    const parsedVariables = typeof variables === "string" ? JSON.parse(variables) : variables;
    updateData.variables = JSON.stringify(parsedVariables);
  }
  if (isActive !== undefined) updateData.isActive = isActive;

  const [updatedTemplate] = await db
    .update(smsTemplates)
    .set(updateData)
    .where(eq(smsTemplates.id, id))
    .returning();

  const result = {
    ...updatedTemplate,
    variables: JSON.parse(updatedTemplate.variables),
  };

  res.respond(200, "کالبد بریالیتوب سره تازه شو", { template: result });
});

// ─── DELETE SMS TEMPLATE ───────────────────────────────────────────────────────
export const deleteSmsTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingTemplate] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
  if (!existingTemplate) throw new ApiError(404, "کالبد ونه موندل شو");

  await db.delete(smsTemplates).where(eq(smsTemplates.id, id));

  res.respond(200, "کالبد بریالیتوب سره ړنګ شو");
});

// ─── GET DEFAULT TEMPLATES ─────────────────────────────────────────────────────
export const getDefaultTemplates = asyncHandler(async (req, res) => {
  const defaultTemplates = [
    {
      templateType: "Absent",
      templateName: "د غیر حاضرۍ پیغام",
      messagePs: "سلام {parentName}، ستاسو زوی/لور {studentName} د {className} ټولګي نن {date} په {institutionType} کې غیر حاضر دی. مهرباني وکړئ د خپل ماشوم په حاضرۍ پام وکړئ.",
      variables: ["parentName", "studentName", "className", "date", "institutionType"],
    },
    {
      templateType: "Fee",
      templateName: "د فیس یادونه",
      messagePs: "سلام {parentName}، د {studentName} د {month} میاشتې فیس {amount} افغانۍ پاتې دی. مهرباني وکړئ ژر تر ژره یې ورکړئ.",
      variables: ["parentName", "studentName", "month", "amount"],
    },
    {
      templateType: "ExamPass",
      templateName: "د ازموینې بریالیتوب",
      messagePs: "مبارک شه! ستاسو زوی/لور {studentName} د {examName} په ازموینه کې {position} مقام ترلاسه کړی. ټولې نمرې: {totalMarks}، ترلاسه شوې: {obtainedMarks}، سلنه: {percentage}%",
      variables: ["studentName", "examName", "position", "totalMarks", "obtainedMarks", "percentage"],
    },
    {
      templateType: "ExamFail",
      templateName: "د ازموینې ناکامي",
      messagePs: "سلام {parentName}، ستاسو زوی/لور {studentName} د {examName} په ازموینه کې ناکام شوی. ټولې نمرې: {totalMarks}، ترلاسه شوې: {obtainedMarks}. مهرباني وکړئ د خپل ماشوم سره مرسته وکړئ.",
      variables: ["parentName", "studentName", "examName", "totalMarks", "obtainedMarks"],
    },
    {
      templateType: "Homework",
      templateName: "د کور کار یادونه",
      messagePs: "سلام {parentName}، د {studentName} لپاره د {subject} مضمون کور کار ورکړل شوی. د سبا نیټه: {dueDate}. مهرباني وکړئ ډاډ ترلاسه کړئ چې ستاسو ماشوم یې بشپړوي.",
      variables: ["parentName", "studentName", "subject", "dueDate"],
    },
  ];

  res.respond(200, "د ډیفالټ کالبدونه ترلاسه شول", { templates: defaultTemplates });
});

// ─── SEED DEFAULT TEMPLATES ────────────────────────────────────────────────────
export const seedDefaultTemplates = asyncHandler(async (req, res) => {
  const defaultTemplates = [
    {
      templateType: "Absent",
      templateName: "د غیر حاضرۍ پیغام",
      messagePs: "سلام {parentName}، ستاسو زوی/لور {studentName} د {className} ټولګي نن {date} په {institutionType} کې غیر حاضر دی. مهرباني وکړئ د خپل ماشوم په حاضرۍ پام وکړئ.",
      variables: JSON.stringify(["parentName", "studentName", "className", "date", "institutionType"]),
    },
    {
      templateType: "Fee",
      templateName: "د فیس یادونه",
      messagePs: "سلام {parentName}، د {studentName} د {month} میاشتې فیس {amount} افغانۍ پاتې دی. مهرباني وکړئ ژر تر ژره یې ورکړئ.",
      variables: JSON.stringify(["parentName", "studentName", "month", "amount"]),
    },
    {
      templateType: "ExamPass",
      templateName: "د ازموینې بریالیتوب",
      messagePs: "مبارک شه! ستاسو زوی/لور {studentName} د {examName} په ازموینه کې {position} مقام ترلاسه کړی. ټولې نمرې: {totalMarks}، ترلاسه شوې: {obtainedMarks}، سلنه: {percentage}%",
      variables: JSON.stringify(["studentName", "examName", "position", "totalMarks", "obtainedMarks", "percentage"]),
    },
    {
      templateType: "ExamFail",
      templateName: "د ازموینې ناکامي",
      messagePs: "سلام {parentName}، ستاسو زوی/لور {studentName} د {examName} په ازموینه کې ناکام شوی. ټولې نمرې: {totalMarks}، ترلاسه شوې: {obtainedMarks}. مهرباني وکړئ د خپل ماشوم سره مرسته وکړئ.",
      variables: JSON.stringify(["parentName", "studentName", "examName", "totalMarks", "obtainedMarks"]),
    },
    {
      templateType: "Homework",
      templateName: "د کور کار یادونه",
      messagePs: "سلام {parentName}، د {studentName} لپاره د {subject} مضمون کور کار ورکړل شوی. د سبا نیټه: {dueDate}. مهرباني وکړئ ډاډ ترلاسه کړئ چې ستاسو ماشوم یې بشپړوي.",
      variables: JSON.stringify(["parentName", "studentName", "subject", "dueDate"]),
    },
  ];

  // Check if templates already exist
  const existingTemplates = await db.select().from(smsTemplates);
  if (existingTemplates.length > 0) {
    return res.respond(200, "کالبدونه دمخه شتون لري", { count: existingTemplates.length });
  }

  // Insert default templates
  await db.insert(smsTemplates).values(defaultTemplates);

  res.respond(201, "ډیفالټ کالبدونه بریالیتوب سره جوړ شول", { count: defaultTemplates.length });
});

/**
 * Replace template variables with actual values
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} data - Object with variable values
 * @returns {string} - Processed message
 */
export const replaceTemplateVariables = (template, data) => {
  if (!template) return "";

  let message = template;

  // Replace all variables in format {variableName}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    const value = data[key] !== undefined && data[key] !== null ? data[key] : "";
    message = message.replace(regex, value);
  });

  return message;
};

/**
 * Extract variables from template
 * @param {string} template - Template string
 * @returns {Array<string>} - Array of variable names
 */
export const extractTemplateVariables = (template) => {
  if (!template) return [];

  const regex = /\{([^}]+)\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};

/**
 * Validate template has all required variables
 * @param {string} template - Template string
 * @param {Array<string>} requiredVars - Required variable names
 * @returns {Object} - { valid: boolean, missing: Array<string> }
 */
export const validateTemplate = (template, requiredVars) => {
  const templateVars = extractTemplateVariables(template);
  const missing = requiredVars.filter(v => !templateVars.includes(v));

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Preview template with sample data
 * @param {string} template - Template string
 * @param {Object} sampleData - Sample data for preview
 * @returns {string} - Preview message
 */
export const previewTemplate = (template, sampleData = {}) => {
  const defaultSample = {
    parentName: "احمد",
    studentName: "محمد",
    className: "دهم - الف",
    date: "1403/01/15",
    institutionType: "ښوونځی",
    month: "حمل",
    amount: "1000",
    examName: "لومړی ټرم",
    position: "لومړی",
    totalMarks: "500",
    obtainedMarks: "450",
    percentage: "90",
    subject: "ریاضی",
    dueDate: "1403/01/20",
  };

  return replaceTemplateVariables(template, { ...defaultSample, ...sampleData });
};

/**
 * Get available template variables by message type
 * @param {string} messageType - Message type (Absent, Fee, etc.)
 * @returns {Array<Object>} - Array of { name, description }
 */
export const getAvailableVariables = (messageType) => {
  const commonVars = [
    { name: "parentName", description: "د مور/پلار نوم" },
    { name: "studentName", description: "د زده کوونکي نوم" },
    { name: "className", description: "د ټولګي نوم" },
    { name: "institutionType", description: "د موسسې ډول" },
    { name: "date", description: "نیټه" },
  ];

  const typeSpecificVars = {
    Absent: [],
    Fee: [
      { name: "month", description: "میاشت" },
      { name: "amount", description: "مقدار" },
    ],
    ExamPass: [
      { name: "examName", description: "د ازموینې نوم" },
      { name: "position", description: "مقام" },
      { name: "totalMarks", description: "ټولې نمرې" },
      { name: "obtainedMarks", description: "ترلاسه شوې نمرې" },
      { name: "percentage", description: "سلنه" },
    ],
    ExamFail: [
      { name: "examName", description: "د ازموینې نوم" },
      { name: "totalMarks", description: "ټولې نمرې" },
      { name: "obtainedMarks", description: "ترلاسه شوې نمرې" },
    ],
    Homework: [
      { name: "subject", description: "مضمون" },
      { name: "dueDate", description: "د سپارلو نیټه" },
    ],
  };

  return [...commonVars, ...(typeSpecificVars[messageType] || [])];
};

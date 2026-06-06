/** Pashto labels for institution types — used in SMS templates and API responses */
export const INSTITUTION_LABELS = {
  School: "ښوونځی",
  Center: "سینټر",
  Madrasa: "مدرسه",
};

export const institutionLabel = (type) =>
  INSTITUTION_LABELS[type] || type || "";

export default { INSTITUTION_LABELS, institutionLabel };

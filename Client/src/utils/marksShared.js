export const INSTITUTION_TYPES = [
  { value: "School", label: "ښوونځی", variant: "info" },
  { value: "Center", label: "مرکز", variant: "muted" },
  { value: "Madrasa", label: "مدرسه", variant: "warning" },
];

export const MARK_STATUSES = [
  { value: "Pass", label: "بریالی", variant: "success" },
  { value: "Fail", label: "ناکام", variant: "destructive" },
  { value: "Absent", label: "غیر حاضر", variant: "warning" },
];

export const STATUS_LABELS = Object.fromEntries(
  MARK_STATUSES.map((s) => [s.value, s.label])
);

export const SEL =
  "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export const computeMarkStatus = (obtained, passing, status) => {
  if (status === "Absent") return "Absent";
  const o = Number(obtained);
  if (!Number.isFinite(o)) return "Fail";
  return o >= Number(passing) ? "Pass" : "Fail";
};

export const validateMarkRow = (row, totalMarks) => {
  if (row.status === "Absent") return null;
  const o = Number(row.obtainedMarks);
  if (row.obtainedMarks === "" || !Number.isFinite(o)) return "نمرې اړینې دي";
  if (o < 0) return "منفي نمرې نشي کیدای";
  if (o > Number(totalMarks)) return `نمرې د ${totalMarks} څخه زیاتې نشي`;
  return null;
};

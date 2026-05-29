import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Theme ────────────────────────────────────────────────────────────────────
const HEADER_BG   = "1E3A5F";   // dark navy
const HEADER_FG   = "FFFFFF";
const ROW_ODD     = "FFFFFF";
const ROW_EVEN    = "EEF3FA";   // light blue tint
const BORDER_CLR  = "B0BEC5";
const ACCENT      = "2E75B6";   // medium blue for totals / accents

const thinBorder = {
  top:    { style: "thin",   color: { argb: BORDER_CLR } },
  bottom: { style: "thin",   color: { argb: BORDER_CLR } },
  left:   { style: "thin",   color: { argb: BORDER_CLR } },
  right:  { style: "thin",   color: { argb: BORDER_CLR } },
};

const mediumBorder = {
  top:    { style: "medium", color: { argb: ACCENT } },
  bottom: { style: "medium", color: { argb: ACCENT } },
  left:   { style: "medium", color: { argb: ACCENT } },
  right:  { style: "medium", color: { argb: ACCENT } },
};

// ─── Core builder ─────────────────────────────────────────────────────────────
async function buildWorkbook({ sheetName, title, columns, rows, fileName }) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = "School ERP";
  wb.created  = new Date();

  const ws = wb.addWorksheet(sheetName, {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 3 }],
  });

  const colCount = columns.length;

  // ── Row 1: Title banner ────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font      = { bold: true, size: 14, color: { argb: HEADER_FG }, name: "Arial" };
  titleCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
  titleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 30;

  // ── Row 2: Meta (date + count) ─────────────────────────────────────────────
  ws.mergeCells(2, 1, 2, colCount);
  const metaCell = ws.getCell(2, 1);
  const today = new Date().toLocaleDateString("fa-AF");
  metaCell.value = `د صادرولو نېټه: ${today}  |  ټول شمیر: ${rows.length}`;
  metaCell.font      = { size: 10, color: { argb: "555555" }, name: "Arial" };
  metaCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E2F3" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(2).height = 20;

  // ── Row 3: Headers ─────────────────────────────────────────────────────────
  const headerRow = ws.getRow(3);
  headerRow.height = 28;
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value     = col.header;
    cell.font      = { bold: true, size: 11, color: { argb: HEADER_FG }, name: "Arial" };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true, readingOrder: "rtl" };
    cell.border    = mediumBorder;
  });

  // ── Data rows ──────────────────────────────────────────────────────────────
  rows.forEach((rowData, ri) => {
    const exRow = ws.addRow(rowData);
    exRow.height = 22;
    const isEven = ri % 2 === 1;
    exRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      if (colNum > colCount) return;
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? ROW_EVEN : ROW_ODD } };
      cell.font      = { size: 10, name: "Arial" };
      cell.alignment = { horizontal: "right", vertical: "middle", wrapText: false, readingOrder: "rtl" };
      cell.border    = thinBorder;
    });
  });

  // ── Column widths ──────────────────────────────────────────────────────────
  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width || 18;
  });

  // ── AutoFilter on header row ───────────────────────────────────────────────
  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to:   { row: 3, column: colCount },
  };

  // ── Write & download ───────────────────────────────────────────────────────
  const date = new Date().toISOString().split("T")[0];
  const fullName = `${fileName}_${date}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fullName);
  return fullName;
}

// ─── Teachers ─────────────────────────────────────────────────────────────────
export async function exportTeachersToExcel(teachers, eduLabels) {
  const columns = [
    { header: "ID",            width: 8  },
    { header: "نوم",           width: 22 },
    { header: "د پلار نوم",   width: 22 },
    { header: "ټېلیفون",      width: 18 },
    { header: "تذکیره",        width: 16 },
    { header: "زده کړه",      width: 16 },
    { header: "معاش (افغانۍ)", width: 16 },
    { header: "د شمولیت نېټه", width: 16 },
    { header: "مهارتونه",      width: 28 },
    { header: "پته",           width: 22 },
    { header: "یادښتونه",      width: 32 },
  ];

  const rows = teachers.map((t) => [
    t.id            || "",
    t.name          || "",
    t.fatherName    || "",
    t.phone         || "",
    t.idCardNumber  || "",
    eduLabels[t.education] || t.education || "",
    t.salary        ? Number(t.salary) : "",
    t.joiningDate   || "",
    t.skills        || "",
    t.address       || "",
    t.notes         || "",
  ]);

  return buildWorkbook({ sheetName: "ښوونکي", title: "د ښوونکو لیست", columns, rows, fileName: "teachers" });
}

// ─── Applicants ───────────────────────────────────────────────────────────────
export async function exportApplicantsToExcel(applicants, eduLabels) {
  const columns = [
    { header: "ID",             width: 8  },
    { header: "نوم",            width: 22 },
    { header: "د پلار نوم",    width: 22 },
    { header: "ټېلیفون",       width: 18 },
    { header: "زده کړه",       width: 16 },
    { header: "مهارتونه",       width: 28 },
    { header: "پته",            width: 22 },
    { header: "د غوښتنې نېټه", width: 16 },
    { header: "یادښتونه",       width: 32 },
  ];

  const rows = applicants.map((a) => [
    a.id          || "",
    a.name        || "",
    a.fatherName  || "",
    a.phone       || "",
    eduLabels[a.education] || a.education || "",
    a.skills      || "",
    a.address     || "",
    a.appliedAt   || "",
    a.notes       || "",
  ]);

  return buildWorkbook({ sheetName: "د کار غوښتونکي", title: "د کار غوښتونکو لیست", columns, rows, fileName: "applicants" });
}

// ─── Classes (kept for other pages) ──────────────────────────────────────────
export async function exportClassesToExcel(classes) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
  const columns = [
    { header: "ID",            width: 8  },
    { header: "د ټولګي نوم",  width: 22 },
    { header: "څانګه",         width: 14 },
    { header: "ډول",           width: 14 },
    { header: "تعلیمي کال",   width: 14 },
    { header: "میاشتنی فیس",  width: 16 },
    { header: "نهګران",        width: 22 },
  ];

  const rows = classes.map((c) => [
    c.id             || "",
    c.name           || "",
    c.section        || "",
    TYPE_LABEL[c.type] || c.type || "",
    c.academicYear   || "",
    c.monthlyFee     ? Number(c.monthlyFee) : "",
    c.supervisorName || "",
  ]);

  return buildWorkbook({ sheetName: "ټولګي", title: "د ټولګو لیست", columns, rows, fileName: "classes" });
}

// ─── Students ─────────────────────────────────────────────────────────────────
export async function exportStudentsToExcel(students) {
  const columns = [
    { header: "ID",              width: 8  },
    { header: "بشپړ نوم",        width: 22 },
    { header: "د پلار نوم",     width: 22 },
    { header: "د نیکه نوم",     width: 22 },
    { header: "جنسیت",           width: 12 },
    { header: "ټېلیفون",         width: 18 },
    { header: "تذکیره",          width: 16 },
    { header: "د زېږېدنې نېټه", width: 16 },
    { header: "پته",             width: 22 },
    { header: "بېړنۍ اړیکه",    width: 18 },
    { header: "تعلیمي کال",     width: 14 },
    { header: "د شمولیت ډول",   width: 20 },
    { header: "د ثبت نام فیس",  width: 16 },
  ];

  const rows = students.map((s) => {
    const enrollmentTypes = s.enrollments?.map(e => {
      const typeMap = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
      return typeMap[e.type] || e.type;
    }).join("، ") || "";

    return [
      s.id                || "",
      s.fullName          || "",
      s.fatherName        || "",
      s.grandFatherName   || "",
      s.gender === "Male" ? "نر" : "ښځینه",
      s.phone             || "",
      s.idCardNumber      || "",
      s.dob               || "",
      s.address           || "",
      s.emergencyContact  || "",
      s.academicYear      || "",
      enrollmentTypes,
      s.registrationFee   ? Number(s.registrationFee) : "",
    ];
  });

  return buildWorkbook({ sheetName: "زده کوونکي", title: "د زده کوونکو لیست", columns, rows, fileName: "students" });
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export async function exportStaffToExcel(staffList) {
  const columns = [
    { header: "ID",            width: 8  },
    { header: "بشپړ نوم",     width: 22 },
    { header: "د پلار نوم",   width: 22 },
    { header: "ټېلیفون",      width: 18 },
    { header: "تذکیره نمبره", width: 16 },
    { header: "مسئولیت",      width: 22 },
    { header: "معاش (افغانۍ)", width: 16 },
    { header: "د شمولیت نېټه", width: 16 },
    { header: "حالت",         width: 12 },
    { header: "یادښتونه",      width: 32 },
  ];

  const rows = staffList.map((s) => [
    s.id            || "",
    s.name          || "",
    s.fatherName    || "",
    s.phone         || "",
    s.idCardNumber  || "",
    s.role          || "",
    s.salary        ? Number(s.salary) : "",
    s.joinedAt      || "",
    s.status === "active" ? "فعال" : "غیر فعال",
    s.notes         || "",
  ]);

  return buildWorkbook({ sheetName: "کارمندان", title: "د کارمندانو لیست", columns, rows, fileName: "staff" });
}

// ─── Exams ────────────────────────────────────────────────────────────────────
export async function exportExamsToExcel(exams) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه", Other: "نور" };
  
  const columns = [
    { header: "ID",              width: 8  },
    { header: "د امتحان سرلیک", width: 28 },
    { header: "د ادارې ډول",    width: 16 },
    { header: "ټولګي شمیر",     width: 12 },
    { header: "د پیل نېټه",     width: 16 },
    { header: "د پای نېټه",     width: 16 },
    { header: "حالت",           width: 12 },
    { header: "تعلیمي کال",     width: 14 },
    { header: "د جوړولو نېټه",  width: 18 },
  ];

  const rows = exams.map((e) => [
    e.id                || "",
    e.examTitle         || "",
    TYPE_LABEL[e.institutionType] || e.institutionType || "",
    e.assignedClasses?.length || 0,
    e.startDate         || "",
    e.endDate           || "",
    e.status            || "",
    e.academicYear      || "",
    e.createdAt ? new Date(e.createdAt).toLocaleDateString("fa-AF") : "",
  ]);

  return buildWorkbook({ sheetName: "امتحانات", title: "د امتحاناتو لیست", columns, rows, fileName: "exams" });
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export async function exportSubjectsToExcel(subjects) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
  
  const columns = [
    { header: "ID",              width: 8  },
    { header: "د مضمون نوم",     width: 28 },
    { header: "ډول",             width: 16 },
    { header: "تعلیمي کال",     width: 14 },
    { header: "ګمارل شوي ټولګي", width: 42 },
    { header: "د جوړولو نېټه",  width: 18 },
  ];

  const rows = subjects.map((s) => [
    s.id                || "",
    s.name              || "",
    TYPE_LABEL[s.type]  || s.type || "",
    s.academicYear      || "",
    s.classes?.map(c => `${c.name} (${c.section})`).join("، ") || "",
    s.createdAt ? new Date(s.createdAt).toLocaleDateString("fa-AF") : "",
  ]);

  return buildWorkbook({ sheetName: "مضامین", title: "د مضامینو لیست", columns, rows, fileName: "subjects" });
}

// ─── Parents ──────────────────────────────────────────────────────────────────
export async function exportParentsToExcel(parents) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
  
  const columns = [
    { header: "ID",              width: 8  },
    { header: "نوم",             width: 22 },
    { header: "ټېلیفون",         width: 18 },
    { header: "تذکیره",          width: 16 },
    { header: "د مؤسسې ډول",    width: 20 },
    { header: "زده کوونکي",     width: 32 },
    { header: "کارن نوم",        width: 18 },
    { header: "د ثبت نېټه",     width: 16 },
    { header: "یادښتونه",        width: 32 },
  ];

  const rows = parents.map((p) => {
    const instituteTypes = Array.isArray(p.instituteTypes)
      ? p.instituteTypes.map(t => TYPE_LABEL[t] || t).join("، ")
      : "";
    
    const studentNames = Array.isArray(p.students)
      ? p.students.map(s => s.name).join("، ")
      : "";

    return [
      p.id            || "",
      p.name          || "",
      p.phone         || "",
      p.idCardNumber  || "",
      instituteTypes,
      studentNames,
      p.username      || "",
      p.registeredAt  || "",
      p.notes         || "",
    ];
  });

  return buildWorkbook({ sheetName: "والدین", title: "د والدینو لیست", columns, rows, fileName: "parents" });
}

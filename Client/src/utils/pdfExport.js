import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

if (typeof pdfMake.addVirtualFileSystem === "function") {
  pdfMake.addVirtualFileSystem(pdfFonts || {});
} else {
  pdfMake.vfs = { ...(pdfMake.vfs || {}), ...(pdfFonts || {}) };
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY       = "#1E3A5F";
const BLUE       = "#2E75B6";
const LIGHT_BLUE = "#D9E2F3";
const WHITE      = "#FFFFFF";
const GRAY_TEXT  = "#666666";
const ROW_EVEN   = "#EEF3FA";
const BORDER     = "#B0BEC5";

const SCHOOL_NAME = "سرتاج حنفي خصوصي ښونڅی او وړکتون";

// ─── Font loader (fetches once, caches) ──────────────────────────────────────
let fontsReady = false;

async function ensureFonts() {
  if (fontsReady) return;

  const toBase64 = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Unable to load font ${url}: ${res.status} ${res.statusText}`);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const chunkSize = 0x8000;
      let binary = "";
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    } catch (error) {
      console.error(`Font loading error for ${url}:`, error);
      throw error;
    }
  };

  try {
    // Use absolute paths from public folder
    const [regular, bold] = await Promise.all([
      toBase64("/Amiri-Regular.ttf"),
      toBase64("/Amiri-Bold.ttf"),
    ]);

    // Initialize vfs if it doesn't exist
    if (!pdfMake.vfs) {
      pdfMake.vfs = {};
    }

    // Add fonts to virtual file system
    pdfMake.vfs["Amiri-Regular.ttf"] = regular;
    pdfMake.vfs["Amiri-Bold.ttf"] = bold;

    // Configure fonts
    pdfMake.fonts = {
      Amiri: {
        normal: "Amiri-Regular.ttf",
        bold: "Amiri-Bold.ttf",
        italics: "Amiri-Regular.ttf",
        bolditalics: "Amiri-Bold.ttf",
      },
    };

    fontsReady = true;
    console.log("PDF fonts loaded successfully");
  } catch (error) {
    console.error("Failed to load PDF fonts:", error);
    throw new Error("د PDF فونټونو په بارولو کې تېروتنه");
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toLocaleDateString("fa-AF");
const v = (x) => (x == null || x === "" ? "—" : String(x));

function tableLayout() {
  return {
    hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1.5 : 0.5),
    vLineWidth: () => 0.5,
    hLineColor: (i) => (i <= 1 ? BLUE : BORDER),
    vLineColor: () => BORDER,
    fillColor:  (ri) => ri === 0 ? BLUE : ri % 2 === 0 ? ROW_EVEN : WHITE,
    paddingLeft:   () => 7,
    paddingRight:  () => 7,
    paddingTop:    () => 6,
    paddingBottom: () => 6,
  };
}

const hCell = (text) => ({
  text, bold: true, fontSize: 10, color: WHITE,
  alignment: "center", font: "Amiri",
});

const dCell = (text, align = "right") => ({
  text: v(text), fontSize: 9.5, color: "#1a1a1a",
  alignment: align, font: "Amiri",
});

function buildHeader(title, count) {
  return [
    // ── School name banner ──
    {
      table: { widths: ["*"], body: [[{
        text: SCHOOL_NAME, font: "Amiri", bold: true,
        fontSize: 15, color: WHITE, alignment: "center",
        fillColor: NAVY, margin: [0, 8, 0, 8],
      }]] },
      layout: "noBorders",
      margin: [0, 0, 0, 5],
    },
    // ── Title bar ──
    {
      table: { widths: ["*", "auto"], body: [[
        { text: title, font: "Amiri", bold: true, fontSize: 13, color: WHITE, fillColor: BLUE, margin: [10, 6, 0, 6] },
        { text: `ټول: ${count}`, font: "Amiri", fontSize: 10, color: GRAY_TEXT, fillColor: LIGHT_BLUE, margin: [10, 6, 10, 6], alignment: "center" },
      ]] },
      layout: "noBorders",
      margin: [0, 0, 0, 5],
    },
    // ── Meta bar ──
    {
      table: { widths: ["*"], body: [[{
        text: `د صادرولو نېټه: ${todayStr()}    |    ټول شمیر: ${count}`,
        font: "Amiri", fontSize: 9, color: GRAY_TEXT,
        fillColor: "#F0F4FA", alignment: "center", margin: [0, 5, 0, 5],
      }]] },
      layout: { hLineColor: () => BORDER, vLineColor: () => BORDER, hLineWidth: () => 0.5, vLineWidth: () => 0 },
      margin: [0, 0, 0, 12],
    },
  ];
}

const defaultStyle = { font: "Amiri", fontSize: 9.5 };

const styles = {
  footer: { font: "Amiri", fontSize: 8, color: GRAY_TEXT, alignment: "center" },
};

// ─── TEACHERS PDF ─────────────────────────────────────────────────────────────
export async function exportTeachersPdf(teachers, eduLabels) {
  await ensureFonts();
  const EDU = eduLabels || {};

  const headerRow = ["#", "نوم", "د پلار نوم", "ټېلیفون", "تذکیره", "زده کړه", "معاش (؋)", "د شمولیت نېټه", "پته"].map(hCell);

  const dataRows = teachers.map((t, i) => [
    dCell(i + 1, "center"),
    dCell(t.name),
    dCell(t.fatherName),
    dCell(t.phone),
    dCell(t.idCardNumber),
    dCell(EDU[t.education] || t.education),
    dCell(t.salary ? Number(t.salary).toLocaleString() : "—"),
    dCell(t.joiningDate),
    dCell(t.address),
  ]);

  const docDef = {
    pageSize: "A4", pageOrientation: "landscape",
    pageMargins: [30, 30, 30, 40],
    footer: (cur, total) => ({
      text: `${cur} / ${total}    —    ${SCHOOL_NAME}`,
      style: "footer", margin: [0, 8, 0, 0],
    }),
    content: [
      ...buildHeader("د ښوونکو لیست", teachers.length),
      {
        table: {
          headerRows: 1,
          widths: [22, "*", "*", 85, 72, 72, 72, 82, "*"],
          body: [headerRow, ...dataRows],
        },
        layout: tableLayout(),
      },
    ],
    defaultStyle, styles,
  };

  pdfMake.createPdf(docDef).download(`teachers_${todayStr()}.pdf`);
}

// ─── APPLICANTS PDF ───────────────────────────────────────────────────────────
export async function exportApplicantsPdf(applicants, eduLabels) {
  await ensureFonts();
  const EDU = eduLabels || {};

  const headerRow = ["#", "نوم", "د پلار نوم", "ټېلیفون", "زده کړه", "مهارتونه", "پته", "د غوښتنې نېټه"].map(hCell);

  const dataRows = applicants.map((a, i) => [
    dCell(i + 1, "center"),
    dCell(a.name),
    dCell(a.fatherName),
    dCell(a.phone),
    dCell(EDU[a.education] || a.education),
    dCell(a.skills),
    dCell(a.address),
    dCell(a.appliedAt),
  ]);

  const docDef = {
    pageSize: "A4", pageOrientation: "landscape",
    pageMargins: [30, 30, 30, 40],
    footer: (cur, total) => ({
      text: `${cur} / ${total}    —    ${SCHOOL_NAME}`,
      style: "footer", margin: [0, 8, 0, 0],
    }),
    content: [
      ...buildHeader("د کار غوښتونکو لیست", applicants.length),
      {
        table: {
          headerRows: 1,
          widths: [22, "*", "*", 85, 72, "*", "*", 82],
          body: [headerRow, ...dataRows],
        },
        layout: tableLayout(),
      },
    ],
    defaultStyle, styles,
  };

  pdfMake.createPdf(docDef).download(`applicants_${todayStr()}.pdf`);
}

// ─── CLASSES PDF ──────────────────────────────────────────────────────────────
export async function exportClassesPdf(classes) {
  await ensureFonts();
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };

  const headerRow = ["#", "د ټولګي نوم", "څانګه", "ډول", "تعلیمي کال", "میاشتنی فیس (؋)", "نهګران"].map(hCell);

  const dataRows = classes.map((c, i) => [
    dCell(i + 1, "center"),
    dCell(c.name),
    dCell(c.section),
    dCell(TYPE_LABEL[c.type] || c.type),
    dCell(c.academicYear),
    dCell(c.monthlyFee ? Number(c.monthlyFee).toLocaleString() : "—"),
    dCell(c.supervisorName),
  ]);

  const docDef = {
    pageSize: "A4", pageOrientation: "portrait",
    pageMargins: [30, 30, 30, 40],
    footer: (cur, total) => ({
      text: `${cur} / ${total}    —    ${SCHOOL_NAME}`,
      style: "footer", margin: [0, 8, 0, 0],
    }),
    content: [
      ...buildHeader("د ټولګو لیست", classes.length),
      {
        table: {
          headerRows: 1,
          widths: [22, "*", 52, 62, 72, 90, "*"],
          body: [headerRow, ...dataRows],
        },
        layout: tableLayout(),
      },
    ],
    defaultStyle, styles,
  };

  pdfMake.createPdf(docDef).download(`classes_${todayStr()}.pdf`);
}

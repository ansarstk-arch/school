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

import { SCHOOL_INFO } from "@/constants";

const SCHOOL_NAME = SCHOOL_INFO.name;

// ─── Font & logo loader (fetches once, caches) ───────────────────────────────
let assetsReady = false;
let logoDataUrl = null;

async function ensureFonts() {
  if (assetsReady) return;

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
    const [regular, bold, logoB64] = await Promise.all([
      toBase64("/Amiri-Regular.ttf"),
      toBase64("/Amiri-Bold.ttf"),
      toBase64("/logo.png").catch(() => null),
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

    if (logoB64) {
      logoDataUrl = `data:image/png;base64,${logoB64}`;
    }

    assetsReady = true;
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

/**
 * Build header that appears on all pages
 * @param {string} title - Main title in Pashto
 * @param {number} count - Total count of records
 * @param {string} filterInfo - Optional filter information to display
 */
function schoolBannerCell() {
  const nameBlock = {
    text: SCHOOL_NAME,
    font: "Amiri",
    bold: true,
    fontSize: 15,
    color: WHITE,
    alignment: "center",
    margin: [8, 8, 8, 8],
  };

  if (logoDataUrl) {
    return {
      columns: [
        { image: logoDataUrl, width: 42, margin: [12, 6, 0, 6] },
        { ...nameBlock, alignment: "right", width: "*" },
      ],
      fillColor: NAVY,
    };
  }

  return { ...nameBlock, fillColor: NAVY };
}

function buildHeader(title, count, filterInfo = "") {
  const header = [
    {
      table: { widths: ["*"], body: [[schoolBannerCell()]] },
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
  ];

  // Add filter info if provided
  if (filterInfo) {
    header.push({
      table: { widths: ["*"], body: [[{
        text: `فلټر: ${filterInfo}`,
        font: "Amiri", fontSize: 9, color: GRAY_TEXT,
        fillColor: "#FFF9E6", alignment: "center", margin: [0, 4, 0, 4],
      }]] },
      layout: { hLineColor: () => BORDER, vLineColor: () => BORDER, hLineWidth: () => 0.5, vLineWidth: () => 0 },
      margin: [0, 0, 0, 8],
    });
  }

  // ── Meta bar ──
  header.push({
    table: { widths: ["*"], body: [[{
      text: `د صادرولو نېټه: ${todayStr()}    |    ټول شمیر: ${count}`,
      font: "Amiri", fontSize: 9, color: GRAY_TEXT,
      fillColor: "#F0F4FA", alignment: "center", margin: [0, 5, 0, 5],
    }]] },
    layout: { hLineColor: () => BORDER, vLineColor: () => BORDER, hLineWidth: () => 0.5, vLineWidth: () => 0 },
    margin: [0, 0, 0, 12],
  });

  return header;
}

const defaultStyle = { font: "Amiri", fontSize: 9.5, alignment: "right" };

const styles = {
  footer: { font: "Amiri", fontSize: 8, color: GRAY_TEXT, alignment: "center" },
};

/**
 * Generate filter description in Pashto
 * @param {Object} filters - Filter object
 * @param {Object} config - Configuration for filter labels
 */
function generateFilterInfo(filters, config = {}) {
  if (!filters || Object.keys(filters).length === 0) {
    return "";
  }

  const parts = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "" && key !== "page" && key !== "limit") {
      const label = config[key] || key;
      parts.push(`${label}: ${value}`);
    }
  });

  return parts.length > 0 ? parts.join(" | ") : "";
}

/**
 * Reusable PDF Download Function
 * @param {Object} options - Configuration options
 * @param {Array} options.data - Array of data to export
 * @param {Array} options.columns - Column definitions [{header: string, field: string, width: string|number, align: string, format: function}]
 * @param {string} options.title - Document title in Pashto
 * @param {string} options.filename - Output filename (without extension)
 * @param {string} options.orientation - 'portrait' or 'landscape' (default: 'portrait')
 * @param {Object} options.filters - Applied filters object
 * @param {Object} options.filterConfig - Filter label configuration
 * @returns {Promise<void>}
 */
export async function downloadPDF({
  data = [],
  columns = [],
  title = "لیست",
  filename = "export",
  orientation = "portrait",
  filters = {},
  filterConfig = {},
}) {
  try {
    console.log("Starting PDF generation...");
    
    // Ensure fonts are loaded
    await ensureFonts();
    console.log("Fonts loaded, generating PDF...");

    if (!data || data.length === 0) {
      throw new Error("د صادرولو لپاره هیڅ معلومات شتون نلري");
    }

    if (!columns || columns.length === 0) {
      throw new Error("د جدول ستنې تعریف شوي ندي");
    }

    // Generate filter info
    const filterInfo = generateFilterInfo(filters, filterConfig);

    // Build header row
    const headerRow = columns.map(col => hCell(col.header));

    // Build data rows
    const dataRows = data.map((item, index) => {
      return columns.map(col => {
        let value;
        
        // Handle nested fields (e.g., "user.name")
        if (col.field.includes('.')) {
          const fields = col.field.split('.');
          value = fields.reduce((obj, field) => obj?.[field], item);
        } else {
          value = item[col.field];
        }

        // Apply custom format function if provided
        if (col.format && typeof col.format === 'function') {
          value = col.format(value, item, index);
        }

        // Handle number formatting
        if (typeof value === 'number' && !col.format) {
          value = value.toLocaleString();
        }

        const align = col.align || "right";
        return dCell(value, align);
      });
    });

    // Calculate column widths
    const widths = columns.map(col => col.width || "*");

    // Build document definition
    const docDef = {
      pageSize: "A4",
      pageOrientation: orientation,
      pageMargins: [30, 30, 30, 40],
      
      // Header on all pages
      header: (currentPage, pageCount) => {
        if (currentPage === 1) {
          return null; // First page header is in content
        }
        return {
          stack: [
            {
              table: { widths: ["*"], body: [[schoolBannerCell()]] },
              layout: "noBorders",
              margin: [30, 15, 30, 0],
            },
            {
              table: { widths: ["*"], body: [[{
                text: title, font: "Amiri", bold: true,
                fontSize: 11, color: WHITE, alignment: "center",
                fillColor: BLUE, margin: [0, 4, 0, 4],
              }]] },
              layout: "noBorders",
              margin: [30, 3, 30, 8],
            },
          ],
        };
      },

      // Footer on all pages
      footer: (currentPage, pageCount) => ({
        text: `${currentPage} / ${pageCount}    —    ${SCHOOL_NAME}`,
        style: "footer",
        margin: [0, 8, 0, 0],
      }),

      content: [
        // First page header
        ...buildHeader(title, data.length, filterInfo),
        
        // Main table
        {
          table: {
            headerRows: 1,
            widths: widths,
            body: [headerRow, ...dataRows],
            // Repeat header on each page
            dontBreakRows: false,
          },
          layout: tableLayout(),
        },
      ],

      defaultStyle,
      styles,
    };

    console.log("PDF definition created, generating file...");

    // Generate and download PDF
    const pdfDoc = pdfMake.createPdf(docDef);
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.pdf`;
    
    console.log(`Downloading PDF: ${finalFilename}`);
    
    // Try download method first
    try {
      pdfDoc.download(finalFilename);
      console.log("PDF download triggered successfully");
    } catch (downloadError) {
      console.warn("Download method failed, trying getBlob...", downloadError);
      
      // Fallback: use getBlob and create download link
      pdfDoc.getBlob((blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log("PDF downloaded via blob method");
        } catch (blobError) {
          console.error("Blob download also failed:", blobError);
          throw new Error("د PDF ډاونلوډ کې تېروتنه");
        }
      });
    }
    
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}

/**
 * Hook for managing PDF download state
 * @returns {Object} { isLoading, downloadPDF: wrappedDownloadPDF, error }
 */
export function usePDFDownload() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const wrappedDownloadPDF = async (options) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await downloadPDF(options);
    } catch (err) {
      setError(err.message || "د PDF په جوړولو کې تېروتنه");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, downloadPDF: wrappedDownloadPDF, error };
}

// ─── Pre-configured exports for specific sections ─────────────────────────────

/**
 * Export Teachers to PDF
 */
export async function exportTeachersPDF(teachers, filters = {}, eduLabels = {}) {
  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "نوم", field: "name", width: "*" },
    { header: "د پلار نوم", field: "fatherName", width: "*" },
    { header: "ټېلیفون", field: "phone", width: 85 },
    { header: "تذکیره", field: "idCardNumber", width: 72 },
    { header: "زده کړه", field: "education", width: 72, format: (val) => eduLabels[val] || val },
    { header: "معاش (؋)", field: "salary", width: 72, format: (val) => val ? Number(val).toLocaleString() : "—" },
    { header: "د شمولیت نېټه", field: "joiningDate", width: 82 },
    { header: "پته", field: "address", width: "*" },
  ];

  const filterConfig = {
    name: "نوم",
    education: "زده کړه",
    id: "ID",
  };

  await downloadPDF({
    data: teachers,
    columns,
    title: "د ښوونکو لیست",
    filename: "teachers",
    orientation: "landscape",
    filters,
    filterConfig,
  });
}

/**
 * Export Applicants to PDF
 */
export async function exportApplicantsPDF(applicants, filters = {}, eduLabels = {}) {
  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "نوم", field: "name", width: "*" },
    { header: "د پلار نوم", field: "fatherName", width: "*" },
    { header: "ټېلیفون", field: "phone", width: 85 },
    { header: "زده کړه", field: "education", width: 72, format: (val) => eduLabels[val] || val },
    { header: "مهارتونه", field: "skills", width: "*" },
    { header: "پته", field: "address", width: "*" },
    { header: "د غوښتنې نېټه", field: "appliedAt", width: 82 },
  ];

  const filterConfig = {
    name: "نوم",
    phone: "ټېلیفون",
    dateFrom: "له نېټې",
    dateTo: "تر نېټې",
    id: "ID",
  };

  await downloadPDF({
    data: applicants,
    columns,
    title: "د کار غوښتونکو لیست",
    filename: "applicants",
    orientation: "landscape",
    filters,
    filterConfig,
  });
}

/**
 * Export Classes to PDF
 */
export async function exportClassesPDF(classes, filters = {}) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };

  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "د ټولګي نوم", field: "name", width: "*" },
    { header: "څانګه", field: "section", width: 52 },
    { header: "ډول", field: "type", width: 62, format: (val) => TYPE_LABEL[val] || val },
    { header: "تعلیمي کال", field: "academicYear", width: 72 },
    { header: "میاشتنی فیس (؋)", field: "monthlyFee", width: 90, format: (val) => val ? Number(val).toLocaleString() : "—" },
    { header: "نهګران", field: "supervisorName", width: "*" },
  ];

  const filterConfig = {
    name: "نوم",
    type: "ډول",
    academicYear: "تعلیمي کال",
  };

  await downloadPDF({
    data: classes,
    columns,
    title: "د ټولګو لیست",
    filename: "classes",
    orientation: "portrait",
    filters,
    filterConfig,
  });
}

/**
 * Export Students to PDF
 */
export async function exportStudentsPDF(students, filters = {}) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };

  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "بشپړ نوم", field: "fullName", width: "*" },
    { header: "د پلار نوم", field: "fatherName", width: "*" },
    { header: "جنسیت", field: "gender", width: 48, format: (val) => val === "Male" ? "نر" : "ښځینه" },
    { header: "ټېلیفون", field: "phone", width: 85 },
    { header: "تعلیمي کال", field: "academicYear", width: 72 },
    { 
      header: "د شمولیت ډول", 
      field: "enrollments", 
      width: 95,
      format: (val) => {
        if (!val || !Array.isArray(val)) return "—";
        return val.map(e => TYPE_LABEL[e.type] || e.type).join("، ");
      }
    },
    { header: "پته", field: "address", width: "*" },
  ];

  const filterConfig = {
    id: "ID",
    fullName: "نوم",
    enrollmentType: "د شمولیت ډول",
    academicYear: "تعلیمي کال",
  };

  await downloadPDF({
    data: students,
    columns,
    title: "د زده کوونکو لیست",
    filename: "students",
    orientation: "landscape",
    filters,
    filterConfig,
  });
}

/**
 * Export Exams to PDF
 */
export async function exportExamsPDF(exams, filters = {}) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه", Other: "نور" };

  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "د امتحان سرلیک", field: "examTitle", width: "*" },
    { header: "د ادارې ډول", field: "institutionType", width: 72, format: (val) => TYPE_LABEL[val] || val },
    { header: "ټولګي شمیر", field: "assignedClasses", width: 62, align: "center", format: (val) => val?.length || 0 },
    { header: "د پیل نېټه", field: "startDate", width: 82 },
    { header: "د پای نېټه", field: "endDate", width: 82 },
    { header: "حالت", field: "status", width: 62, align: "center" },
    { header: "تعلیمي کال", field: "academicYear", width: 72, align: "center" },
  ];

  const filterConfig = {
    examTitle: "د امتحان سرلیک",
    institutionType: "د ادارې ډول",
    status: "حالت",
    academicYear: "تعلیمي کال",
  };

  await downloadPDF({
    data: exams,
    columns,
    title: "د امتحاناتو لیست",
    filename: "exams",
    orientation: "landscape",
    filters,
    filterConfig,
  });
}

/**
 * Export Subjects to PDF
 */
export async function exportSubjectsPDF(subjects, filters = {}) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };

  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "د مضمون نوم", field: "name", width: "*" },
    { header: "ډول", field: "type", width: 72, format: (val) => TYPE_LABEL[val] || val },
    { header: "تعلیمي کال", field: "academicYear", width: 72, align: "center" },
    { 
      header: "ګمارل شوي ټولګي", 
      field: "classes", 
      width: "*",
      format: (val) => {
        if (!val || !Array.isArray(val) || val.length === 0) return "—";
        return val.map(c => `${c.name} (${c.section})`).join("، ");
      }
    },
    { 
      header: "د جوړولو نېټه", 
      field: "createdAt", 
      width: 82,
      format: (val) => val ? new Date(val).toLocaleDateString("fa-AF") : "—"
    },
  ];

  const filterConfig = {
    name: "د مضمون نوم",
    type: "ډول",
    academicYear: "تعلیمي کال",
  };

  await downloadPDF({
    data: subjects,
    columns,
    title: "د مضامینو لیست",
    filename: "subjects",
    orientation: "landscape",
    filters,
    filterConfig,
  });
}

/**
 * Export Parents to PDF
 */
export async function exportParentsPDF(parents, filters = {}) {
  const TYPE_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };

  const columns = [
    { header: "#", field: "index", width: 22, align: "center", format: (_, __, i) => i + 1 },
    { header: "نوم", field: "name", width: "*" },
    { header: "ټېلیفون", field: "phone", width: 85 },
    { header: "تذکیره", field: "idCardNumber", width: 72 },
    { 
      header: "د مؤسسې ډول", 
      field: "instituteTypes", 
      width: 85,
      format: (val) => {
        if (!val || !Array.isArray(val)) return "—";
        return val.map(t => TYPE_LABEL[t] || t).join("، ");
      }
    },
    { 
      header: "زده کوونکي", 
      field: "students", 
      width: "*",
      format: (val) => {
        if (!val || !Array.isArray(val) || val.length === 0) return "—";
        return val.map(s => s.name).join("، ");
      }
    },
    { header: "کارن نوم", field: "username", width: 85 },
    { header: "د ثبت نېټه", field: "registeredAt", width: 82 },
  ];

  const filterConfig = {
    name: "نوم",
    phone: "ټېلیفون",
    username: "کارن نوم",
    instituteType: "د مؤسسې ډول",
    id: "ID",
  };

  await downloadPDF({
    data: parents,
    columns,
    title: "د والدینو لیست",
    filename: "parents",
    orientation: "landscape",
    filters,
    filterConfig,
  });
}

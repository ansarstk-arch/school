import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { registerPdfFonts, setFont, drawReportHeader } from './pdfKitHelpers.util.js';

// ─── GENERATE SALARY EXCEL REPORT ──────────────────────────────────────────────

export const generateSalaryExcelReport = async (salariesData, filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('معاشونه', {
    views: [{ rightToLeft: true }],
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true
    }
  });

  // Set column widths (RTL)
  worksheet.columns = [
    { width: 4 },   // نمبر
    { width: 15 },  // نوم
    { width: 10 },  // ډول
    { width: 10 },  // دنده
    { width: 10 },  // میاشت
    { width: 10 },  // اصلي معاش
    { width: 10 },  // علاوې
    { width: 10 },  // انعامونه
    { width: 10 },  // ټول معاش
    { width: 10 },  // کسرونه
    { width: 10 },  // خالص معاش
    { width: 10 },  // ورکړل شوی
    { width: 10 },  // حالت
  ];

  let currentRow = 1;

  // ─── HEADER ───
  worksheet.mergeCells(1, 1, 1, 13);
  const headerCell = worksheet.getCell(1, 1);
  headerCell.value = 'د معاشونو راپور';
  headerCell.font = { name: 'B Nazanin', size: 16, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  headerCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'medium' }
  };
  worksheet.getRow(1).height = 25;

  // ─── FILTERS INFO ───
  currentRow = 2;
  if (filters.month || filters.academicYear) {
    worksheet.mergeCells(2, 1, 2, 13);
    const filterCell = worksheet.getCell(2, 1);
    let filterText = '';
    if (filters.month) filterText += `میاشت: ${filters.month}  `;
    if (filters.academicYear) filterText += `تعلیمي کال: ${filters.academicYear}`;
    filterCell.value = filterText;
    filterCell.font = { name: 'B Nazanin', size: 11 };
    filterCell.alignment = { horizontal: 'center', vertical: 'middle' };
    filterCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };
    currentRow = 3;
  }

  // ─── COLUMN HEADERS ───
  const headers = [
    'نمبر', 'نوم', 'ډول', 'دنده', 'میاشت', 
    'اصلي معاش', 'علاوې', 'انعامونه', 'ټول معاش', 
    'کسرونه', 'خالص معاش', 'ورکړل شوی', 'حالت'
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { name: 'B Nazanin', size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  currentRow++;

  // ─── DATA ROWS ───
  const typeMap = { Teacher: 'ښوونکی', Staff: 'کارمند' };
  const statusMap = { Paid: 'ورکړل شوی', Partial: 'نیمګړی', Pending: 'پاتې' };

  salariesData.forEach((salary, index) => {
    const rowData = [
      index + 1,
      salary.personName || '-',
      typeMap[salary.personType] || salary.personType,
      salary.position || '-',
      salary.month,
      Number(salary.baseSalary || 0),
      Number(salary.allowances || 0),
      Number(salary.bonuses || 0),
      Number(salary.grossSalary || 0),
      Number(salary.deductions || 0),
      Number(salary.netSalary || 0),
      Number(salary.paidAmount || 0),
      statusMap[salary.paymentStatus] || salary.paymentStatus
    ];

    rowData.forEach((data, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = data;
      cell.font = { name: 'B Nazanin', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      // Number formatting for currency columns
      if (colIndex >= 5 && colIndex <= 11) {
        cell.numFmt = '#,##0';
      }

      // Color coding for status
      if (colIndex === 12) {
        if (salary.paymentStatus === 'Paid') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
        } else if (salary.paymentStatus === 'Partial') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
        } else if (salary.paymentStatus === 'Pending') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
        }
      }
    });

    currentRow++;
  });

  // ─── SUMMARY ROW ───
  if (salariesData.length > 0) {
    currentRow++;
    const totalBaseSalary = salariesData.reduce((sum, s) => sum + Number(s.baseSalary || 0), 0);
    const totalAllowances = salariesData.reduce((sum, s) => sum + Number(s.allowances || 0), 0);
    const totalBonuses = salariesData.reduce((sum, s) => sum + Number(s.bonuses || 0), 0);
    const totalGross = salariesData.reduce((sum, s) => sum + Number(s.grossSalary || 0), 0);
    const totalDeductions = salariesData.reduce((sum, s) => sum + Number(s.deductions || 0), 0);
    const totalNet = salariesData.reduce((sum, s) => sum + Number(s.netSalary || 0), 0);
    const totalPaid = salariesData.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);

    const summaryData = [
      'ټول', '', '', '', '',
      totalBaseSalary, totalAllowances, totalBonuses, totalGross,
      totalDeductions, totalNet, totalPaid, ''
    ];

    summaryData.forEach((data, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = data;
      cell.font = { name: 'B Nazanin', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'medium' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }
      };

      if (colIndex >= 5 && colIndex <= 11) {
        cell.numFmt = '#,##0';
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ─── GENERATE SALARY PDF REPORT ────────────────────────────────────────────────

export const generateSalaryPDFReport = (salariesData, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 30, 
        layout: 'landscape' 
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerPdfFonts(doc);
      drawReportHeader(doc, 'د معاشونو راپور');

      if (filters.month || filters.academicYear) {
        setFont(doc, false);
        doc.fontSize(10);
        let filterText = '';
        if (filters.month) filterText += `میاشت: ${filters.month}  `;
        if (filters.academicYear) filterText += `تعلیمي کال: ${filters.academicYear}`;
        doc.text(filterText, { align: 'center' });
        doc.moveDown();
      }

      const tableTop = doc.y;
      const colWidths = [25, 80, 50, 60, 50, 55, 45, 45, 55, 45, 55, 55, 50];
      const headers = ['#', 'نوم', 'ډول', 'دنده', 'میاشت', 'اصلي', 'علاوې', 'انعام', 'ټول', 'کسر', 'خالص', 'ورکړل', 'حالت'];
      
      let xPos = 30;
      setFont(doc, true);
      doc.fontSize(8);
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
        xPos += colWidths[i];
      });

      doc.moveTo(30, tableTop + 12).lineTo(800, tableTop + 12).stroke();
      
      let yPos = tableTop + 15;
      setFont(doc, false);
      doc.fontSize(7);
      
      const typeMap = { Teacher: 'ښوونکی', Staff: 'کارمند' };
      const statusMap = { Paid: 'ورکړل شوی', Partial: 'نیمګړی', Pending: 'پاتې' };

      salariesData.forEach((salary, index) => {
        if (yPos > 500) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 30;
        const rowData = [
          (index + 1).toString(),
          (salary.personName || '-').substring(0, 15),
          typeMap[salary.personType] || salary.personType,
          (salary.position || '-').substring(0, 12),
          salary.month,
          Number(salary.baseSalary || 0).toLocaleString(),
          Number(salary.allowances || 0).toLocaleString(),
          Number(salary.bonuses || 0).toLocaleString(),
          Number(salary.grossSalary || 0).toLocaleString(),
          Number(salary.deductions || 0).toLocaleString(),
          Number(salary.netSalary || 0).toLocaleString(),
          Number(salary.paidAmount || 0).toLocaleString(),
          statusMap[salary.paymentStatus] || salary.paymentStatus
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPos, { width: colWidths[i], align: 'center' });
          xPos += colWidths[i];
        });

        yPos += 12;
      });

      // Summary
      if (salariesData.length > 0) {
        const totalNet = salariesData.reduce((sum, s) => sum + Number(s.netSalary || 0), 0);
        const totalPaid = salariesData.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
        
        doc.moveDown(2);
        setFont(doc, true);
        doc.fontSize(10);
        doc.text(`ټول ریکارډونه: ${salariesData.length}`, { align: 'right' });
        doc.text(`ټول خالص معاش: ${totalNet.toLocaleString()} افغانۍ`, { align: 'right' });
        doc.text(`ورکړل شوی: ${totalPaid.toLocaleString()} افغانۍ`, { align: 'right' });
        doc.text(`پاتې: ${(totalNet - totalPaid).toLocaleString()} افغانۍ`, { align: 'right' });
      }

      setFont(doc, false);
      doc.fontSize(7).text(
        `د صادرولو نېټه: ${new Date().toLocaleDateString('fa-AF')}`,
        30,
        doc.page.height - 30,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─── GENERATE ADVANCE EXCEL REPORT ─────────────────────────────────────────────

export const generateAdvanceExcelReport = async (advancesData, filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('پیشکي او پورونه', {
    views: [{ rightToLeft: true }],
    pageSetup: { 
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true
    }
  });

  worksheet.columns = [
    { width: 4 },   // نمبر
    { width: 15 },  // نوم
    { width: 10 },  // ډول
    { width: 10 },  // د پیشکي ډول
    { width: 12 },  // اندازه
    { width: 12 },  // ورکړل شوی
    { width: 12 },  // پاتې
    { width: 10 },  // قسطونه
    { width: 12 },  // میاشتنی کسر
    { width: 10 },  // حالت
    { width: 12 },  // د غوښتنې نیټه
    { width: 20 },  // دلیل
  ];

  let currentRow = 1;

  // Header
  worksheet.mergeCells(1, 1, 1, 12);
  const headerCell = worksheet.getCell(1, 1);
  headerCell.value = 'د پیشکي او پورونو راپور';
  headerCell.font = { name: 'B Nazanin', size: 16, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  headerCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'medium' }
  };
  worksheet.getRow(1).height = 25;

  currentRow = 2;

  // Column Headers
  const headers = [
    'نمبر', 'نوم', 'ډول', 'د پیشکي ډول', 'اندازه', 
    'ورکړل شوی', 'پاتې', 'قسطونه', 'میاشتنی کسر', 
    'حالت', 'د غوښتنې نیټه', 'دلیل'
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { name: 'B Nazanin', size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  currentRow++;

  // Data Rows
  const typeMap = { Teacher: 'ښوونکی', Staff: 'کارمند' };
  const advanceTypeMap = { Advance: 'پیشکي', Loan: 'پور' };
  const statusMap = { 
    Pending: 'پاتې', 
    Approved: 'منظور شوی', 
    Rejected: 'رد شوی',
    Completed: 'بشپړ شوی',
    Cancelled: 'لغوه شوی'
  };

  advancesData.forEach((advance, index) => {
    const rowData = [
      index + 1,
      advance.personName || '-',
      typeMap[advance.personType] || advance.personType,
      advanceTypeMap[advance.advanceType] || advance.advanceType,
      Number(advance.amount || 0),
      Number(advance.paidAmount || 0),
      Number(advance.remainingAmount || 0),
      advance.installments || 1,
      Number(advance.monthlyDeduction || 0),
      statusMap[advance.status] || advance.status,
      advance.requestDate,
      advance.reason || '-'
    ];

    rowData.forEach((data, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = data;
      cell.font = { name: 'B Nazanin', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      if (colIndex >= 4 && colIndex <= 8) {
        cell.numFmt = '#,##0';
      }

      // Color coding for status
      if (colIndex === 9) {
        if (advance.status === 'Approved') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
        } else if (advance.status === 'Pending') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
        } else if (advance.status === 'Rejected' || advance.status === 'Cancelled') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
        } else if (advance.status === 'Completed') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0E0E6' } };
        }
      }
    });

    currentRow++;
  });

  // Summary
  if (advancesData.length > 0) {
    currentRow++;
    const totalAmount = advancesData.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const totalPaid = advancesData.reduce((sum, a) => sum + Number(a.paidAmount || 0), 0);
    const totalRemaining = advancesData.reduce((sum, a) => sum + Number(a.remainingAmount || 0), 0);

    const summaryData = [
      'ټول', '', '', '', totalAmount, totalPaid, totalRemaining, '', '', '', '', ''
    ];

    summaryData.forEach((data, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = data;
      cell.font = { name: 'B Nazanin', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'medium' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }
      };

      if (colIndex >= 4 && colIndex <= 6) {
        cell.numFmt = '#,##0';
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export default {
  generateSalaryExcelReport,
  generateSalaryPDFReport,
  generateAdvanceExcelReport,
};

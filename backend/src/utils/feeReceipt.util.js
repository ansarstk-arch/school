import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { SCHOOL_INFO } from '../config/school.config.js';
import { registerPdfFonts, setFont, drawReportHeader } from './pdfKitHelpers.util.js';

const enrollmentTypeMap = {
  School: 'ښوونځی',
  Center: 'مرکز',
  Madrasa: 'مدرسه',
};

const statusMap = {
  Paid: 'ورکړل شوی',
  Partial: 'نیمګړی',
  Unpaid: 'نه ورکړل شوی',
};

const THERMAL_WIDTH = 226.77; // 80mm
const THERMAL_MARGIN = 28.35;

/** POS thermal receipt — Amiri font, no logo */
export const generateFeeReceiptPDF = (paymentData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [THERMAL_WIDTH, 841.89],
        margin: THERMAL_MARGIN,
      });
      const chunks = [];
      const contentWidth = THERMAL_WIDTH - THERMAL_MARGIN * 2;

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerPdfFonts(doc);

      const remaining = paymentData.amount - paymentData.paid;
      const right = { width: contentWidth, align: 'right' };
      const center = { width: contentWidth, align: 'center' };

      // School Name
      setFont(doc, true);
      doc.fontSize(12);
      doc.text(SCHOOL_INFO.name, center);
      doc.moveDown(0.4);

      // Separator line
      doc.moveTo(THERMAL_MARGIN, doc.y).lineTo(THERMAL_WIDTH - THERMAL_MARGIN, doc.y).stroke();
      doc.moveDown(0.4);

      // Receipt Title
      setFont(doc, true);
      doc.fontSize(11);
      doc.text('د فیس رسید', center);
      doc.moveDown(0.5);

      // Receipt Number and Date
      setFont(doc, false);
      doc.fontSize(8);
      doc.text(`${paymentData.receiptNo} :رسید نمبر`, right);
      doc.moveDown(0.3);
      doc.text(`${paymentData.date} :نېټه`, right);
      doc.moveDown(0.5);

      // Dashed separator
      doc.moveTo(THERMAL_MARGIN, doc.y)
        .lineTo(THERMAL_WIDTH - THERMAL_MARGIN, doc.y)
        .dash(3, { space: 3 })
        .stroke()
        .undash();
      doc.moveDown(0.5);

      // Student Information
      setFont(doc, false);
      doc.fontSize(8);
      
      // Format: Label first, then value (RTL format)
      doc.text(`${paymentData.studentName} :د زده کوونکي نوم`, right);
      doc.moveDown(0.3);
      doc.text(`${paymentData.fatherName} :د پلار نوم`, right);
      doc.moveDown(0.3);
      doc.text(`${paymentData.className || 'N/A'} :ټولګی`, right);
      doc.moveDown(0.3);
      doc.text(`${enrollmentTypeMap[paymentData.enrollmentType] || paymentData.enrollmentType} :ډول`, right);
      doc.moveDown(0.5);

      // Dashed separator
      doc.moveTo(THERMAL_MARGIN, doc.y)
        .lineTo(THERMAL_WIDTH - THERMAL_MARGIN, doc.y)
        .dash(3, { space: 3 })
        .stroke()
        .undash();
      doc.moveDown(0.5);

      // Month and Year
      setFont(doc, false);
      doc.fontSize(8);
      doc.text(`${paymentData.month} :میاشت`, right);
      doc.moveDown(0.3);
      doc.text(`${paymentData.academicYear} :تعلیمي کال`, right);
      doc.moveDown(0.5);

      // Solid separator
      doc.moveTo(THERMAL_MARGIN, doc.y).lineTo(THERMAL_WIDTH - THERMAL_MARGIN, doc.y).stroke();
      doc.moveDown(0.5);

      // Payment Details
      setFont(doc, true);
      doc.fontSize(9);
      doc.text(`${paymentData.amount} افغانۍ :ټول فیس`, right);
      doc.moveDown(0.3);
      doc.text(`${Number(paymentData.paid).toFixed(2)} افغانۍ :ترلاسه شوی`, right);
      doc.moveDown(0.3);
      doc.text(`${remaining > 0 ? remaining.toFixed(2) : '0'} افغانۍ :پاتې فیس`, right);
      doc.moveDown(0.5);

      // Solid separator
      doc.moveTo(THERMAL_MARGIN, doc.y).lineTo(THERMAL_WIDTH - THERMAL_MARGIN, doc.y).stroke();
      doc.moveDown(0.5);

      // Status
      setFont(doc, true);
      doc.fontSize(9);
      doc.text(`${statusMap[paymentData.status] || paymentData.status} :حالت`, center);
      doc.moveDown(0.5);

      // Notes
      if (paymentData.notes) {
        setFont(doc, false);
        doc.fontSize(7);
        doc.text(`${paymentData.notes} :یادښت`, right);
        doc.moveDown(0.4);
      }

      // Collected By
      if (paymentData.collectedBy) {
        setFont(doc, false);
        doc.fontSize(7);
        doc.text(`${paymentData.collectedBy} :د راټولونکي نوم`, right);
        doc.moveDown(0.5);
      }

      // Footer
      doc.moveDown(0.5);
      setFont(doc, false);
      doc.fontSize(7);
      doc.text('مننه چې تاسو زموږ سره یاست', center);
      doc.moveDown(0.2);
      doc.text(`د اړیکې شمیره: ${SCHOOL_INFO.phone}`, center);
      doc.moveDown(0.2);
      doc.text(`پته: ${SCHOOL_INFO.address}`, center);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/** Multiple thermal receipts — no logo */
export const generateMultipleReceiptsPDF = (paymentsData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [THERMAL_WIDTH, 841.89], margin: THERMAL_MARGIN });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      paymentsData.forEach((payment, index) => {
        if (index > 0) doc.addPage();
        registerPdfFonts(doc);
        const contentWidth = THERMAL_WIDTH - THERMAL_MARGIN * 2;
        const right = { width: contentWidth, align: 'right' };
        const center = { width: contentWidth, align: 'center' };

        setFont(doc, true);
        doc.fontSize(11);
        doc.text(SCHOOL_INFO.name, center);
        doc.moveDown(0.3);
        setFont(doc, true);
        doc.fontSize(10);
        doc.text('د فیس رسید', center);
        doc.moveDown(0.3);

        setFont(doc, false);
        doc.fontSize(8);
        doc.text(`رسید: ${payment.receiptNo}  |  ${payment.date}`, right);
        doc.text(`زده کوونکی: ${payment.studentName}`, right);
        doc.text(`پلار: ${payment.fatherName}`, right);
        doc.text(`میاشت: ${payment.month}  |  کال: ${payment.academicYear}`, right);
        doc.text(`ټول: ${payment.amount}  |  ورکړل: ${payment.paid} افغانۍ`, right);
        doc.text(`حالت: ${statusMap[payment.status] || payment.status}`, right);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─── GENERATE EXCEL EXPORT ─────────────────────────────────────────────────────
export const generateFeeExcelExport = async (paymentsData, filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Fee Payments');

  worksheet.columns = [
    { header: 'Receipt No', key: 'receiptNo', width: 15 },
    { header: 'Student Name', key: 'studentName', width: 20 },
    { header: 'Father Name', key: 'fatherName', width: 20 },
    { header: 'Enrollment Type', key: 'enrollmentType', width: 15 },
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Academic Year', key: 'academicYear', width: 15 },
    { header: 'Total Amount', key: 'amount', width: 12 },
    { header: 'Paid Amount', key: 'paid', width: 12 },
    { header: 'Remaining', key: 'remaining', width: 12 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Collected By', key: 'collectedBy', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  paymentsData.forEach((payment) => {
    worksheet.addRow({
      receiptNo: payment.receiptNo,
      studentName: payment.studentName,
      fatherName: payment.fatherName,
      enrollmentType: payment.enrollmentType,
      month: payment.month,
      academicYear: payment.academicYear,
      amount: payment.amount,
      paid: payment.paid,
      remaining: payment.remaining || payment.amount - payment.paid,
      status: payment.status,
      date: payment.date,
      collectedBy: payment.collectedBy,
      notes: payment.notes || '',
    });
  });

  if (paymentsData.length > 0) {
    const totalAmount = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaid = paymentsData.reduce((sum, p) => sum + (p.paid || 0), 0);

    worksheet.addRow({});
    const summaryRow = worksheet.addRow({
      receiptNo: 'TOTAL',
      amount: totalAmount,
      paid: totalPaid,
      remaining: totalAmount - totalPaid,
      notes: `Total Records: ${paymentsData.length}`,
    });
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD700' },
    };
  }

  if (Object.keys(filters).length > 0) {
    worksheet.insertRow(1, {});
    worksheet.insertRow(1, { receiptNo: 'Applied Filters:' });
    let filterRow = 2;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        worksheet.insertRow(filterRow, { receiptNo: `${key}: ${value}` });
        filterRow++;
      }
    });
    worksheet.insertRow(filterRow, {});
  }

  return workbook;
};

/** Fee payments list report — logo + Amiri */
export const generateFeePDFExport = (paymentsData, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30, layout: 'landscape' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerPdfFonts(doc);
      drawReportHeader(doc, 'د فیس پیسو راپور');

      if (Object.keys(filters).length > 0) {
        setFont(doc, false);
        doc.fontSize(9);
        Object.entries(filters).forEach(([key, value]) => {
          if (value) doc.text(`${key}: ${value}`, { align: 'right' });
        });
        doc.moveDown();
      }

      const tableTop = doc.y;
      const colWidths = [60, 80, 80, 60, 50, 60, 50, 50, 50, 40, 60];
      const headers = [
        'رسید',
        'زده کوونکی',
        'پلار',
        'ډول',
        'میاشت',
        'کال',
        'ټول',
        'ورکړل',
        'پاتې',
        'حالت',
        'نېټه',
      ];

      let currentX = 30;
      setFont(doc, true);
      doc.fontSize(8);
      headers.forEach((header, i) => {
        doc.text(header, currentX, tableTop, { width: colWidths[i], align: 'center' });
        currentX += colWidths[i];
      });

      let currentY = tableTop + 18;
      setFont(doc, false);
      doc.fontSize(7);

      paymentsData.forEach((payment) => {
        if (currentY > 500) {
          doc.addPage();
          currentY = 50;
        }

        currentX = 30;
        const rowData = [
          payment.receiptNo,
          payment.studentName?.substring(0, 14) || '',
          payment.fatherName?.substring(0, 14) || '',
          enrollmentTypeMap[payment.enrollmentType] || payment.enrollmentType,
          payment.month,
          payment.academicYear,
          String(payment.amount ?? 0),
          String(payment.paid ?? 0),
          String((payment.amount || 0) - (payment.paid || 0)),
          statusMap[payment.status] || payment.status,
          payment.date,
        ];

        rowData.forEach((data, i) => {
          doc.text(data, currentX, currentY, { width: colWidths[i], align: 'center' });
          currentX += colWidths[i];
        });

        currentY += 14;
      });

      if (paymentsData.length > 0) {
        const totalAmount = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPaid = paymentsData.reduce((sum, p) => sum + (p.paid || 0), 0);

        doc.y = currentY + 20;
        setFont(doc, true);
        doc.fontSize(10);
        doc.text(`ټول ریکارډونه: ${paymentsData.length}`, { align: 'right' });
        doc.text(`ټول فیس: ${totalAmount} افغانۍ`, { align: 'right' });
        doc.text(`ورکړل شوی: ${totalPaid} افغانۍ`, { align: 'right' });
        doc.text(`پاتې: ${totalAmount - totalPaid} افغانۍ`, { align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

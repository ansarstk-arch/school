import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { registerPdfFonts, setFont, drawReportHeader } from './pdfKitHelpers.util.js';

// // ─── GENERATE MONTHLY EXCEL REPORT (Simple Grid) ───────────────────────────────

// export const generateMonthlyExcelReport = async (data, filters, schoolInfo) => {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet('حاضري', {
//     views: [{ rightToLeft: true }],
//     pageSetup: { 
//       paperSize: 9, // A4
//       orientation: 'landscape',
//       fitToPage: true,
//       fitToWidth: 1,
//       fitToHeight: 0
//     }
//   });

//   // Get days in month
//   const startDate = new Date(filters.startDate);
//   const daysInMonth = new Date(
//     startDate.getFullYear(),
//     startDate.getMonth() + 1,
//     0
//   ).getDate();

//   // Set column widths (RTL - from right to left)
//   const columns = [
//     { width: 4 },   // نمبر
//     { width: 12 },  // نوم
//     { width: 10 },  // د پلار نوم
//     { width: 8 },   // ثبت
//   ];
  
//   // Add day columns
//   for (let i = 0; i < daysInMonth; i++) {
//     columns.push({ width: 3 });
//   }
  
//   worksheet.columns = columns;

//   let currentRow = 1;

//   // ─── HEADER SECTION ───
//   // Row 1: Year
//   const totalCols = 4 + daysInMonth;
//   worksheet.mergeCells(1, 1, 1, totalCols);
//   const yearCell = worksheet.getCell(1, 1);
//   const year = startDate.getFullYear();
//   yearCell.value = `کال ${year}`;
//   yearCell.font = { name: 'B Nazanin', size: 14, bold: true };
//   yearCell.alignment = { horizontal: 'center', vertical: 'middle' };
//   yearCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };

//   // Row 2: Month and Class info
//   currentRow = 2;
//   const monthNames = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
//   const monthName = monthNames[startDate.getMonth()];
  
//   // Left side: Month name
//   const monthColSpan = Math.floor(totalCols / 2);
//   worksheet.mergeCells(2, 1, 2, monthColSpan);
//   const monthCell = worksheet.getCell(2, 1);
//   monthCell.value = `میاشت: ${monthName}`;
//   monthCell.font = { name: 'B Nazanin', size: 12, bold: true };
//   monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
//   monthCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };

//   // Right side: Class name
//   worksheet.mergeCells(2, monthColSpan + 1, 2, totalCols);
//   const classCell = worksheet.getCell(2, monthColSpan + 1);
//   classCell.value = `صنف: ${filters.className || ''}`;
//   classCell.font = { name: 'B Nazanin', size: 12, bold: true };
//   classCell.alignment = { horizontal: 'center', vertical: 'middle' };
//   classCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };

//   // Row 3: Column headers
//   currentRow = 3;
  
//   // Main headers (RTL)
//   const headerCells = [
//     { col: 1, value: 'نمبر' },
//     { col: 2, value: 'نوم' },
//     { col: 3, value: 'د پلار نوم' },
//     { col: 4, value: 'ثبت' }
//   ];

//   headerCells.forEach(({ col, value }) => {
//     const cell = worksheet.getCell(currentRow, col);
//     cell.value = value;
//     cell.font = { name: 'B Nazanin', size: 10, bold: true };
//     cell.alignment = { horizontal: 'center', vertical: 'middle' };
//     cell.border = {
//       top: { style: 'thin' },
//       left: { style: 'thin' },
//       right: { style: 'thin' },
//       bottom: { style: 'thin' }
//     };
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFD3D3D3' }
//     };
//   });

//   // Days headers (1 to daysInMonth)
//   for (let day = 1; day <= daysInMonth; day++) {
//     const cell = worksheet.getCell(currentRow, 4 + day);
//     cell.value = day;
//     cell.font = { name: 'B Nazanin', size: 8, bold: true };
//     cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
//     cell.border = {
//       top: { style: 'thin' },
//       left: { style: 'thin' },
//       right: { style: 'thin' },
//       bottom: { style: 'thin' }
//     };
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFD3D3D3' }
//     };
//   }

//   // ─── DATA ROWS ───
//   currentRow = 4;
  
//   // Group records by student
//   const studentMap = new Map();
//   data.records.forEach(record => {
//     const key = record.personId;
//     if (!studentMap.has(key)) {
//       studentMap.set(key, {
//         person: record.person,
//         personName: record.personName,
//         attendance: {}
//       });
//     }
//     const day = new Date(record.attendanceDate).getDate();
//     studentMap.get(key).attendance[day] = record.status;
//   });

//   let rowNum = 1;
//   studentMap.forEach((student) => {
//     // Student info columns
//     worksheet.getCell(currentRow, 1).value = rowNum;
//     worksheet.getCell(currentRow, 2).value = student.personName || '-';
//     worksheet.getCell(currentRow, 3).value = student.person?.fatherName || '-';
//     worksheet.getCell(currentRow, 4).value = student.person?.rollNumber || '-';

//     // Style info columns
//     for (let col = 1; col <= 4; col++) {
//       const cell = worksheet.getCell(currentRow, col);
//       cell.font = { name: 'B Nazanin', size: 9 };
//       cell.alignment = { horizontal: 'center', vertical: 'middle' };
//       cell.border = {
//         top: { style: 'thin' },
//         left: { style: 'thin' },
//         right: { style: 'thin' },
//         bottom: { style: 'thin' }
//       };
//     }

//     // Attendance days
//     for (let day = 1; day <= daysInMonth; day++) {
//       const cell = worksheet.getCell(currentRow, 4 + day);
//       const status = student.attendance[day];
      
//       if (status === 'Present') {
//         cell.value = '✓';
//         cell.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FF90EE90' }
//         };
//       } else if (status === 'Absent') {
//         cell.value = '✗';
//         cell.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FFFF6B6B' }
//         };
//       } else if (status === 'Leave') {
//         cell.value = 'ر';
//         cell.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FFFFD700' }
//         };
//       }
      
//       cell.font = { name: 'B Nazanin', size: 9, bold: true };
//       cell.alignment = { horizontal: 'center', vertical: 'middle' };
//       cell.border = {
//         top: { style: 'thin' },
//         left: { style: 'thin' },
//         right: { style: 'thin' },
//         bottom: { style: 'thin' }
//       };
//     }

//     currentRow++;
//     rowNum++;
//   });

//   // Generate buffer
//   const buffer = await workbook.xlsx.writeBuffer();
//   return buffer;
// };

// // ─── GENERATE YEARLY EXCEL REPORT (With Logos) ─────────────────────────────────

// export const generateYearlyExcelReport = async (data, filters, schoolInfo) => {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet('حاضري کلنی', {
//     views: [{ rightToLeft: true }],
//     pageSetup: { 
//       paperSize: 9,
//       orientation: 'portrait',
//       fitToPage: true
//     }
//   });

//   // Set column widths (RTL)
//   worksheet.columns = [
//     { width: 4 },   // نمبر
//     { width: 12 },  // نوم
//     { width: 10 },  // د پلار نوم
//     { width: 6 },   // ثبت
//     { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, // حمل، ثور، جوزا، سرطان
//     { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, // اسد، سنبله، میزان، عقرب
//     { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, // قوس، جدی، دلو، حوت
//   ];

//   let currentRow = 1;

//   // ─── ADD LOGOS ───
//   try {
//     if (fs.existsSync(LOGO_PATH)) {
//       // Add left logo
//       const logoLeft = workbook.addImage({
//         filename: LOGO_PATH,
//         extension: 'png',
//       });
//       worksheet.addImage(logoLeft, {
//         tl: { col: 0.5, row: 0.2 },
//         ext: { width: 60, height: 60 }
//       });

//       // Add right logo
//       const logoRight = workbook.addImage({
//         filename: LOGO_PATH,
//         extension: 'png',
//       });
//       worksheet.addImage(logoRight, {
//         tl: { col: 14.5, row: 0.2 },
//         ext: { width: 60, height: 60 }
//       });
//     }
//   } catch (error) {
//     console.error('Error adding logos:', error);
//   }

//   // ─── HEADER WITH LOGOS ───
//   // Row 1-3: Ministry and School header
//   worksheet.mergeCells('A1:P3');
//   const headerCell = worksheet.getCell('A1');
//   headerCell.value = (schoolInfo?.ministry || 'وزارت معارف') + '\n' + 
//                      (schoolInfo?.department || 'ریاست معارف جوزجان') + '\n' + 
//                      (schoolInfo?.name || 'د ښوونځي نوم');
//   headerCell.font = { name: 'B Nazanin', size: 14, bold: true };
//   headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
//   headerCell.border = {
//     top: { style: 'medium' },
//     left: { style: 'medium' },
//     right: { style: 'medium' },
//     bottom: { style: 'medium' }
//   };
//   worksheet.getRow(1).height = 20;
//   worksheet.getRow(2).height = 20;
//   worksheet.getRow(3).height = 20;

//   // Row 4: Class and Year info
//   currentRow = 4;
//   worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
//   const classCell = worksheet.getCell(`A${currentRow}`);
//   classCell.value = `صنف: ${filters.className || ''}`;
//   classCell.font = { name: 'B Nazanin', size: 11, bold: true };
//   classCell.alignment = { horizontal: 'right', vertical: 'middle' };
//   classCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };

//   worksheet.mergeCells(`I${currentRow}:P${currentRow}`);
//   const yearCell = worksheet.getCell(`I${currentRow}`);
//   const year = new Date(filters.startDate).getFullYear();
//   yearCell.value = `تاریخ: ${year}`;
//   yearCell.font = { name: 'B Nazanin', size: 11, bold: true };
//   yearCell.alignment = { horizontal: 'center', vertical: 'middle' };
//   yearCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };

//   // Row 5: "شرایط حاضري اسناد" header
//   currentRow = 5;
//   worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
//   const conditionsCell = worksheet.getCell(`A${currentRow}`);
//   conditionsCell.value = 'شرایط حاضري اسناد';
//   conditionsCell.font = { name: 'B Nazanin', size: 12, bold: true };
//   conditionsCell.alignment = { horizontal: 'center', vertical: 'middle' };
//   conditionsCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };
//   conditionsCell.fill = {
//     type: 'pattern',
//     pattern: 'solid',
//     fgColor: { argb: 'FFE0E0E0' }
//   };

//   // Row 6: Column headers
//   currentRow = 6;
  
//   // Main info headers
//   const mainHeaders = [
//     { col: 1, value: 'نمبر', rowSpan: 2 },
//     { col: 2, value: 'اسم', rowSpan: 2 },
//     { col: 3, value: 'ولد', rowSpan: 2 },
//     { col: 4, value: 'ثبت', rowSpan: 2 }
//   ];

//   mainHeaders.forEach(({ col, value, rowSpan }) => {
//     if (rowSpan === 2) {
//       worksheet.mergeCells(currentRow, col, currentRow + 1, col);
//     }
//     const cell = worksheet.getCell(currentRow, col);
//     cell.value = value;
//     cell.font = { name: 'B Nazanin', size: 10, bold: true };
//     cell.alignment = { horizontal: 'center', vertical: 'middle' };
//     cell.border = {
//       top: { style: 'thin' },
//       left: { style: 'thin' },
//       right: { style: 'thin' },
//       bottom: { style: 'thin' }
//     };
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFD3D3D3' }
//     };
//   });

//   // Months header - merged row
//   worksheet.mergeCells(currentRow, 5, currentRow, 16);
//   const monthsHeaderCell = worksheet.getCell(currentRow, 5);
//   monthsHeaderCell.value = 'شرایط حاضري میاشتوار';
//   monthsHeaderCell.font = { name: 'B Nazanin', size: 10, bold: true };
//   monthsHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
//   monthsHeaderCell.border = {
//     top: { style: 'thin' },
//     left: { style: 'thin' },
//     right: { style: 'thin' },
//     bottom: { style: 'thin' }
//   };
//   monthsHeaderCell.fill = {
//     type: 'pattern',
//     pattern: 'solid',
//     fgColor: { argb: 'FFD3D3D3' }
//   };

//   // Row 7: Individual month names
//   currentRow = 7;
//   const monthNames = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
  
//   monthNames.forEach((monthName, index) => {
//     const cell = worksheet.getCell(currentRow, 5 + index);
//     cell.value = monthName;
//     cell.font = { name: 'B Nazanin', size: 8, bold: true };
//     cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
//     cell.border = {
//       top: { style: 'thin' },
//       left: { style: 'thin' },
//       right: { style: 'thin' },
//       bottom: { style: 'thin' }
//     };
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFD3D3D3' }
//     };
//   });

//   // ─── DATA ROWS ───
//   currentRow = 8;
  
//   // Group records by student and calculate monthly stats
//   const studentMap = new Map();
  
//   data.records.forEach(record => {
//     const key = record.personId;
//     if (!studentMap.has(key)) {
//       studentMap.set(key, {
//         person: record.person,
//         personName: record.personName,
//         monthlyStats: {}
//       });
//     }
//     const month = new Date(record.attendanceDate).getMonth() + 1;
//     if (!studentMap.get(key).monthlyStats[month]) {
//       studentMap.get(key).monthlyStats[month] = { present: 0, absent: 0, leave: 0, total: 0 };
//     }
//     studentMap.get(key).monthlyStats[month].total++;
//     if (record.status === 'Present') studentMap.get(key).monthlyStats[month].present++;
//     if (record.status === 'Absent') studentMap.get(key).monthlyStats[month].absent++;
//     if (record.status === 'Leave') studentMap.get(key).monthlyStats[month].leave++;
//   });

//   let rowNum = 1;
//   studentMap.forEach((student) => {
//     // Student info
//     worksheet.getCell(currentRow, 1).value = rowNum;
//     worksheet.getCell(currentRow, 2).value = student.personName || '-';
//     worksheet.getCell(currentRow, 3).value = student.person?.fatherName || '-';
//     worksheet.getCell(currentRow, 4).value = student.person?.rollNumber || '-';

//     // Style info columns
//     for (let col = 1; col <= 4; col++) {
//       const cell = worksheet.getCell(currentRow, col);
//       cell.font = { name: 'B Nazanin', size: 9 };
//       cell.alignment = { horizontal: 'center', vertical: 'middle' };
//       cell.border = {
//         top: { style: 'thin' },
//         left: { style: 'thin' },
//         right: { style: 'thin' },
//         bottom: { style: 'thin' }
//       };
//     }

//     // Monthly attendance (12 months)
//     for (let month = 1; month <= 12; month++) {
//       const cell = worksheet.getCell(currentRow, 4 + month);
//       const stats = student.monthlyStats[month];
      
//       if (stats && stats.total > 0) {
//         const percentage = Math.round((stats.present / stats.total) * 100);
//         cell.value = percentage;
        
//         // Color coding based on percentage
//         if (percentage >= 90) {
//           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
//         } else if (percentage >= 75) {
//           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
//         } else if (percentage >= 50) {
//           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
//         } else {
//           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
//         }
//       } else {
//         cell.value = '-';
//       }
      
//       cell.font = { name: 'B Nazanin', size: 9 };
//       cell.alignment = { horizontal: 'center', vertical: 'middle' };
//       cell.border = {
//         top: { style: 'thin' },
//         left: { style: 'thin' },
//         right: { style: 'thin' },
//         bottom: { style: 'thin' }
//       };
//     }

//     currentRow++;
//     rowNum++;
//   });

//   const buffer = await workbook.xlsx.writeBuffer();
//   return buffer;
// };

// ─── GENERATE EXCEL REPORT (WRAPPER) ───────────────────────────────────────────

export const generateExcelReport = async (data, filters, schoolInfo) => {
  // Determine if monthly or yearly based on date range
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 31) {
    // Monthly report (simple grid)
    return generateMonthlyExcelReport(data, filters, schoolInfo);
  } else {
    // Yearly report (with logos and monthly breakdown)
    return generateYearlyExcelReport(data, filters, schoolInfo);
  }
};

// // ─── GENERATE PDF REPORT (All in Pashto) ──────────────────────────────────────

// export const generatePDFReport = (data, filters, schoolInfo) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ 
//         margin: 30, 
//         size: 'A4',
//         layout: 'landscape'
//       });
//       const chunks = [];

//       doc.on('data', chunk => chunks.push(chunk));
//       doc.on('end', () => resolve(Buffer.concat(chunks)));
//       doc.on('error', reject);

//       // Title
//       doc.fontSize(16).text('د حاضرۍ راپور', { align: 'center' });
//       doc.fontSize(12).text(schoolInfo?.name || 'ښوونځی', { align: 'center' });
//       doc.moveDown();

//       // Filter info
//       doc.fontSize(10);
//       doc.text(`صنف: ${filters.className || '-'}`, { align: 'right' });
//       doc.text(`نېټه: ${filters.startDate} تر ${filters.endDate}`, { align: 'right' });
//       doc.moveDown();

//       // Statistics
//       doc.fontSize(9);
//       doc.text(`ټول: ${data.stats.total}  |  حاضر: ${data.stats.present}  |  غیر حاضر: ${data.stats.absent}  |  رخصتي: ${data.stats.leave}`, { align: 'center' });
//       doc.moveDown();

//       // Table
//       const tableTop = doc.y;
//       const colWidths = [25, 100, 90, 60, 70, 50];
//       const headers = ['#', 'نوم', 'د پلار نوم', filters.attendanceType === 'Student' ? 'نمبر' : 'دنده', 'نېټه', 'حالت'];
      
//       let xPos = 50;
//       doc.fontSize(9).font('Helvetica-Bold');
//       headers.forEach((header, i) => {
//         doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
//         xPos += colWidths[i];
//       });

//       doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();
      
//       let yPos = tableTop + 15;
//       doc.font('Helvetica').fontSize(8);
      
//       data.records.slice(0, 50).forEach((record, index) => {
//         if (yPos > 500) {
//           doc.addPage();
//           yPos = 50;
//         }

//         xPos = 50;
//         const rowData = [
//           (index + 1).toString(),
//           record.personName || '-',
//           record.person?.fatherName || '-',
//           filters.attendanceType === 'Student' ? (record.person?.rollNumber || '-') : (record.person?.position || '-'),
//           record.attendanceDate,
//           record.status === 'Present' ? 'حاضر' : record.status === 'Absent' ? 'غیر حاضر' : record.status === 'Leave' ? 'رخصتي' : '-'
//         ];

//         rowData.forEach((data, i) => {
//           doc.text(data, xPos, yPos, { width: colWidths[i], align: 'center' });
//           xPos += colWidths[i];
//         });

//         yPos += 15;
//       });

//       doc.fontSize(7).text(
//         `تاریخ: ${new Date().toLocaleDateString('fa-AF')}`,
//         50,
//         doc.page.height - 30,
//         { align: 'center' }
//       );

//       doc.end();
//     } catch (error) {
//       reject(error);
//     }
//   });
// };



// ─── GENERATE MONTHLY EXCEL REPORT (Simple Grid - Second Image) ────────────────

export const generateMonthlyExcelReport = async (data, filters, schoolInfo) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('حاضري', {
    views: [{ rightToLeft: true }],
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
  });

  // Get days in month
  const startDate = new Date(filters.startDate);
  const daysInMonth = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0
  ).getDate();

  // Set column widths (RTL - from right to left)
  const columns = [
    { width: 4 },   // نمبر
    { width: 12 },  // نوم
    { width: 10 },  // ولد نوم
    { width: 8 },   // ثبت
  ];
  
  // Add day columns
  for (let i = 0; i < daysInMonth; i++) {
    columns.push({ width: 3 });
  }
  
  worksheet.columns = columns;

  let currentRow = 1;

  // ─── HEADER SECTION ───
  // Row 1: Year
  const totalCols = 4 + daysInMonth;
  worksheet.mergeCells(1, 1, 1, totalCols);
  const yearCell = worksheet.getCell(1, 1);
  const year = startDate.getFullYear();
  yearCell.value = `کال ${year}`;
  yearCell.font = { name: 'B Nazanin', size: 14, bold: true };
  yearCell.alignment = { horizontal: 'center', vertical: 'middle' };
  yearCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  // Row 2: Month and Class info
  currentRow = 2;
  const monthNames = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
  const monthName = monthNames[startDate.getMonth()];
  
  // Left side: Month name
  const monthColSpan = Math.floor(totalCols / 2);
  worksheet.mergeCells(2, 1, 2, monthColSpan);
  const monthCell = worksheet.getCell(2, 1);
  monthCell.value = `میاشت: ${monthName}`;
  monthCell.font = { name: 'B Nazanin', size: 12, bold: true };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
  monthCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  // Right side: Class name
  worksheet.mergeCells(2, monthColSpan + 1, 2, totalCols);
  const classCell = worksheet.getCell(2, monthColSpan + 1);
  classCell.value = `صنف: ${filters.className || ''}`;
  classCell.font = { name: 'B Nazanin', size: 12, bold: true };
  classCell.alignment = { horizontal: 'center', vertical: 'middle' };
  classCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  // Row 3: Column headers
  currentRow = 3;
  
  // Main headers (RTL)
  const headerCells = [
    { col: 1, value: 'نمبر' },
    { col: 2, value: 'نوم' },
    { col: 3, value: 'ولد نوم' },
    { col: 4, value: 'ثبت' }
  ];

  headerCells.forEach(({ col, value }) => {
    const cell = worksheet.getCell(currentRow, col);
    cell.value = value;
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

  // Days headers (1 to daysInMonth)
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = worksheet.getCell(currentRow, 4 + day);
    cell.value = day;
    cell.font = { name: 'B Nazanin', size: 8, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
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
  }

  // ─── DATA ROWS ───
  currentRow = 4;
  
  // Group records by student
  const studentMap = new Map();
  data.records.forEach(record => {
    const key = record.personId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        person: record.person,
        personName: record.personName,
        attendance: {}
      });
    }
    const day = new Date(record.attendanceDate).getDate();
    studentMap.get(key).attendance[day] = record.status;
  });

  let rowNum = 1;
  studentMap.forEach((student) => {
    // Student info columns
    worksheet.getCell(currentRow, 1).value = rowNum;
    worksheet.getCell(currentRow, 2).value = student.personName || '-';
    worksheet.getCell(currentRow, 3).value = student.person?.fatherName || '-';
    worksheet.getCell(currentRow, 4).value = student.person?.rollNumber || '-';

    // Style info columns
    for (let col = 1; col <= 4; col++) {
      const cell = worksheet.getCell(currentRow, col);
      cell.font = { name: 'B Nazanin', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    }

    // Attendance days
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = worksheet.getCell(currentRow, 4 + day);
      const status = student.attendance[day];
      
      if (status === 'Present') {
        cell.value = '✓';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }
        };
      } else if (status === 'Absent') {
        cell.value = '✗';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      } else if (status === 'Leave') {
        cell.value = 'ر';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' }
        };
      }
      
      cell.font = { name: 'B Nazanin', size: 9, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    }

    currentRow++;
    rowNum++;
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ─── GENERATE YEARLY EXCEL REPORT (With Logos - First Image) ───────────────────

export const generateYearlyExcelReport = async (data, filters, schoolInfo) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('حاضري کلنی', {
    views: [{ rightToLeft: true }],
    pageSetup: { 
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true
    }
  });

  // Set column widths (RTL)
  worksheet.columns = [
    { width: 4 },   // نمبر
    { width: 12 },  // نوم
    { width: 10 },  // ولد نوم
    { width: 6 },   // ثبت
    { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, // حمل، ثور، جوزا، سرطان
    { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, // اسد، سنبله، میزان، عقرب
    { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, // قوس، جدی، دلو، حوت
  ];

  let currentRow = 1;

  // ─── HEADER WITH LOGOS ───
  // Row 1-3: Ministry and School header with logos
  worksheet.mergeCells('A1:P3');
  const headerCell = worksheet.getCell('A1');
  headerCell.value = 'وزارت معارف\nریاست معارف جوزجان\n' + (schoolInfo?.name || 'د ښوونځي نوم');
  headerCell.font = { name: 'B Nazanin', size: 14, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'medium' }
  };

  // TODO: Add logos here when logo files are available
  // You can add images using: worksheet.addImage()

  // Row 4: Class and Year info
  currentRow = 4;
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const classCell = worksheet.getCell(`A${currentRow}`);
  classCell.value = `صنف: ${filters.className || ''}`;
  classCell.font = { name: 'B Nazanin', size: 11, bold: true };
  classCell.alignment = { horizontal: 'right', vertical: 'middle' };
  classCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  worksheet.mergeCells(`I${currentRow}:P${currentRow}`);
  const yearCell = worksheet.getCell(`I${currentRow}`);
  const year = new Date(filters.startDate).getFullYear();
  yearCell.value = `تاریخ: ${year}`;
  yearCell.font = { name: 'B Nazanin', size: 11, bold: true };
  yearCell.alignment = { horizontal: 'center', vertical: 'middle' };
  yearCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  // Row 5: "شرایط حاضري اسناد" header
  currentRow = 5;
  worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
  const conditionsCell = worksheet.getCell(`A${currentRow}`);
  conditionsCell.value = 'شرایط حاضري اسناد';
  conditionsCell.font = { name: 'B Nazanin', size: 12, bold: true };
  conditionsCell.alignment = { horizontal: 'center', vertical: 'middle' };
  conditionsCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };
  conditionsCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Row 6: Column headers
  currentRow = 6;
  
  // Main info headers
  const mainHeaders = [
    { col: 1, value: 'نمبر', rowSpan: 2 },
    { col: 2, value: 'اسم', rowSpan: 2 },
    { col: 3, value: 'ولد', rowSpan: 2 },
    { col: 4, value: 'ثبت', rowSpan: 2 }
  ];

  mainHeaders.forEach(({ col, value, rowSpan }) => {
    if (rowSpan === 2) {
      worksheet.mergeCells(currentRow, col, currentRow + 1, col);
    }
    const cell = worksheet.getCell(currentRow, col);
    cell.value = value;
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

  // Months header - merged row
  worksheet.mergeCells(currentRow, 5, currentRow, 16);
  const monthsHeaderCell = worksheet.getCell(currentRow, 5);
  monthsHeaderCell.value = 'شرایط حاضري میاشتوار';
  monthsHeaderCell.font = { name: 'B Nazanin', size: 10, bold: true };
  monthsHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
  monthsHeaderCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };
  monthsHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };

  // Row 7: Individual month names
  currentRow = 7;
  const monthNames = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
  
  monthNames.forEach((monthName, index) => {
    const cell = worksheet.getCell(currentRow, 5 + index);
    cell.value = monthName;
    cell.font = { name: 'B Nazanin', size: 8, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
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

  // ─── DATA ROWS ───
  currentRow = 8;
  
  // Group records by student and calculate monthly stats
  const studentMap = new Map();
  
  data.records.forEach(record => {
    const key = record.personId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        person: record.person,
        personName: record.personName,
        monthlyStats: {}
      });
    }
    const month = new Date(record.attendanceDate).getMonth() + 1;
    if (!studentMap.get(key).monthlyStats[month]) {
      studentMap.get(key).monthlyStats[month] = { present: 0, absent: 0, leave: 0, total: 0 };
    }
    studentMap.get(key).monthlyStats[month].total++;
    if (record.status === 'Present') studentMap.get(key).monthlyStats[month].present++;
    if (record.status === 'Absent') studentMap.get(key).monthlyStats[month].absent++;
    if (record.status === 'Leave') studentMap.get(key).monthlyStats[month].leave++;
  });

  let rowNum = 1;
  studentMap.forEach((student) => {
    // Student info
    worksheet.getCell(currentRow, 1).value = rowNum;
    worksheet.getCell(currentRow, 2).value = student.personName || '-';
    worksheet.getCell(currentRow, 3).value = student.person?.fatherName || '-';
    worksheet.getCell(currentRow, 4).value = student.person?.rollNumber || '-';

    // Style info columns
    for (let col = 1; col <= 4; col++) {
      const cell = worksheet.getCell(currentRow, col);
      cell.font = { name: 'B Nazanin', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    }

    // Monthly attendance (12 months)
    for (let month = 1; month <= 12; month++) {
      const cell = worksheet.getCell(currentRow, 4 + month);
      const stats = student.monthlyStats[month];
      
      if (stats && stats.total > 0) {
        const percentage = Math.round((stats.present / stats.total) * 100);
        cell.value = percentage;
        
        // Color coding based on percentage
        if (percentage >= 90) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
        } else if (percentage >= 75) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
        } else if (percentage >= 50) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
        }
      } else {
        cell.value = '-';
      }
      
      cell.font = { name: 'B Nazanin', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    }

    currentRow++;
    rowNum++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// // ─── GENERATE EXCEL REPORT (WRAPPER) ───────────────────────────────────────────

// export const generateExcelReport = async (data, filters, schoolInfo) => {
//   // Determine if monthly or yearly based on date range
//   const startDate = new Date(filters.startDate);
//   const endDate = new Date(filters.endDate);
//   const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

//   if (daysDiff <= 31) {
//     // Monthly report (simple grid)
//     return generateMonthlyExcelReport(data, filters, schoolInfo);
//   } else {
//     // Yearly report (with logos and monthly breakdown)
//     return generateYearlyExcelReport(data, filters, schoolInfo);
//   }
// };

// ─── GENERATE PDF REPORT ───────────────────────────────────────────────────────

export const generatePDFReport = (data, filters, schoolInfo) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 30, 
        size: 'A4',
        layout: 'landscape'
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerPdfFonts(doc);
      drawReportHeader(doc, 'د حاضرۍ راپور');

      setFont(doc, false);
      doc.fontSize(10);
      doc.text(`صنف: ${filters.className || '-'}`, { align: 'right' });
      doc.text(`نېټه: ${filters.startDate} تر ${filters.endDate}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(9);
      doc.text(`ټول: ${data.stats.total}  |  حاضر: ${data.stats.present}  |  غیر حاضر: ${data.stats.absent}  |  رخصتي: ${data.stats.leave}`, { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [25, 100, 90, 60, 70, 50];
      const headers = ['#', 'نوم', 'ولد', filters.attendanceType === 'Student' ? 'نمبر' : 'دنده', 'نېټه', 'حالت'];
      
      let xPos = 50;
      setFont(doc, true);
      doc.fontSize(9);
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
        xPos += colWidths[i];
      });

      doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();
      
      let yPos = tableTop + 15;
      setFont(doc, false);
      doc.fontSize(8);
      
      data.records.slice(0, 50).forEach((record, index) => {
        if (yPos > 500) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        const rowData = [
          (index + 1).toString(),
          record.personName || '-',
          record.person?.fatherName || '-',
          filters.attendanceType === 'Student' ? (record.person?.rollNumber || '-') : (record.person?.position || '-'),
          record.attendanceDate,
          record.status || '-'
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPos, { width: colWidths[i], align: 'center' });
          xPos += colWidths[i];
        });

        yPos += 15;
      });

      doc.fontSize(7).text(
        `تاریخ: ${new Date().toLocaleDateString('fa-AF')}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateExcelReport,
  generatePDFReport,
};

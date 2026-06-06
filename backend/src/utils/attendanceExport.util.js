import ExcelJS from 'exceljs';

/**
 * Generate comprehensive Excel attendance report
 * @param {Object} reportData - Attendance records and statistics
 * @param {Object} filters - Applied filters
 * @param {Object} schoolInfo - School information
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function generateExcelReport(reportData, filters, schoolInfo) {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = schoolInfo.name || 'School Management System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('حاضری راپور', {
    properties: { defaultRowHeight: 20 },
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 10 }]
  });

  // ─── HEADER SECTION ────────────────────────────────────────────────────

  // School Logo/Name Section (Merged cells)
  worksheet.mergeCells('A1:H1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = schoolInfo.name || 'د امیرالمومنین ښوونځی';
  titleRow.font = { name: 'Arial', size: 20, bold: true };
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  titleRow.font.color = { argb: 'FFFFFFFF' };
  worksheet.getRow(1).height = 30;

  // School Details
  worksheet.mergeCells('A2:H2');
  const detailsRow = worksheet.getCell('A2');
  detailsRow.value = `${schoolInfo.ministry || 'وزارت معارف'} - ${schoolInfo.department || 'ریاست معارف'}`;
  detailsRow.font = { name: 'Arial', size: 12 };
  detailsRow.alignment = { vertical: 'middle', horizontal: 'center' };
  detailsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' }
  };
  worksheet.getRow(2).height = 25;

  // Report Type
  worksheet.mergeCells('A3:H3');
  const reportTypeRow = worksheet.getCell('A3');
  const reportTypeLabel = filters.attendanceType === 'Student' ? 'د زده کوونکو حاضری راپور' : 
                           filters.attendanceType === 'Teacher' ? 'د ښوونکو حاضری راپور' : 
                           'د کارمندانو حاضری راپور';
  reportTypeRow.value = reportTypeLabel;
  reportTypeRow.font = { name: 'Arial', size: 14, bold: true };
  reportTypeRow.alignment = { vertical: 'middle', horizontal: 'center' };
  reportTypeRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' }
  };
  worksheet.getRow(3).height = 25;

  // Empty row for spacing
  worksheet.addRow([]);

  // Filter Information Row
  worksheet.mergeCells('A5:H5');
  const filterRow = worksheet.getCell('A5');
  let filterText = `نېټه: ${filters.startDate} څخه ${filters.endDate} پورې`;
  if (filters.className) {
    filterText += ` | ټولګی: ${filters.className}`;
  }
  if (filters.institutionType) {
    filterText += ` | ادارہ: ${filters.institutionType}`;
  }
  filterRow.value = filterText;
  filterRow.font = { name: 'Arial', size: 11 };
  filterRow.alignment = { vertical: 'middle', horizontal: 'center' };
  filterRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD1FAE5' }
  };
  worksheet.getRow(5).height = 22;

  // Statistics Summary Row
  worksheet.mergeCells('A6:H6');
  const statsRow = worksheet.getCell('A6');
  const presentPercent = reportData.stats.total > 0 
    ? Math.round((reportData.stats.present / reportData.stats.total) * 100) 
    : 0;
  statsRow.value = `ټول: ${reportData.stats.total} | حاضر: ${reportData.stats.present} (${presentPercent}%) | غیر حاضر: ${reportData.stats.absent} | رخصت: ${reportData.stats.leave}`;
  statsRow.font = { name: 'Arial', size: 11, bold: true };
  statsRow.alignment = { vertical: 'middle', horizontal: 'center' };
  statsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFBFDBFE' }
  };
  worksheet.getRow(6).height = 22;

  // Empty row
  worksheet.addRow([]);

  // ─── TABLE HEADER ──────────────────────────────────────────────────────

  const headers = ['#', 'نوم', 'د پلار نوم', 'ټولګی/موقف', 'نېټه', 'حالت', 'طریقه', 'وخت'];
  
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 25;
  
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // ─── DATA ROWS ─────────────────────────────────────────────────────────

  // Group records by person and date
  const personDateMap = new Map();
  
  reportData.records.forEach((record) => {
    const key = `${record.personId}-${record.attendanceDate}`;
    if (!personDateMap.has(key)) {
      personDateMap.set(key, record);
    }
  });

  const uniqueRecords = Array.from(personDateMap.values());
  
  uniqueRecords.forEach((record, index) => {
    const positionInfo = record.attendanceType === 'Student' 
      ? (record.person?.rollNumber || 'N/A')
      : (record.person?.position || 'کارمند');
    
    const statusMap = {
      'Present': 'حاضر',
      'Absent': 'غیر حاضر',
      'Leave': 'رخصت',
      null: 'ثبت نشوی'
    };
    
    const methodMap = {
      'QR': 'QR کوډ',
      'Manual': 'دستی',
      'Auto': 'خودکار'
    };

    const scannedTime = record.scannedAt 
      ? new Date(record.scannedAt).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      : '-';

    const row = worksheet.addRow([
      index + 1,
      record.personName || 'نامعلوم',
      record.person?.fatherName || '-',
      positionInfo,
      record.attendanceDate,
      statusMap[record.status] || 'نامعلوم',
      methodMap[record.attendanceMethod] || '-',
      scannedTime
    ]);

    // Apply alternating row colors
    const rowFillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB';
    
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowFillColor }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      // Color code status
      if (colNumber === 6) { // Status column
        if (record.status === 'Present') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
          };
          cell.font = { ...cell.font, color: { argb: 'FF065F46' }, bold: true };
        } else if (record.status === 'Absent') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFECACA' }
          };
          cell.font = { ...cell.font, color: { argb: 'FF991B1B' }, bold: true };
        } else if (record.status === 'Leave') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }
          };
          cell.font = { ...cell.font, color: { argb: 'FF92400E' }, bold: true };
        }
      }
    });

    row.height = 20;
  });

  // ─── COLUMN WIDTHS ─────────────────────────────────────────────────────

  worksheet.getColumn(1).width = 8;   // #
  worksheet.getColumn(2).width = 25;  // Name
  worksheet.getColumn(3).width = 20;  // Father Name
  worksheet.getColumn(4).width = 18;  // Class/Position
  worksheet.getColumn(5).width = 15;  // Date
  worksheet.getColumn(6).width = 12;  // Status
  worksheet.getColumn(7).width = 12;  // Method
  worksheet.getColumn(8).width = 15;  // Time

  // ─── FOOTER SECTION ────────────────────────────────────────────────────

  const lastRow = worksheet.lastRow.number + 2;
  
  worksheet.mergeCells(`A${lastRow}:H${lastRow}`);
  const footerRow = worksheet.getCell(`A${lastRow}`);
  footerRow.value = `د چمتو کولو نېټه: ${new Date().toLocaleDateString('fa-AF')} | ${schoolInfo.name || 'School Management System'}`;
  footerRow.font = { name: 'Arial', size: 10, italic: true };
  footerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  footerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };

  // ─── AUTO FILTER ───────────────────────────────────────────────────────

  worksheet.autoFilter = {
    from: { row: 8, column: 1 },
    to: { row: 8, column: 8 }
  };

  // ─── GENERATE BUFFER ───────────────────────────────────────────────────

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Generate PDF attendance report (placeholder for future implementation)
 * @param {Object} reportData - Attendance records and statistics
 * @param {Object} filters - Applied filters
 * @param {Object} schoolInfo - School information
 * @returns {Promise<Buffer>} PDF file buffer
 */
export async function generatePDFReport(reportData, filters, schoolInfo) {
  // PDF generation removed as per requirement
  throw new Error('PDF export is no longer supported. Please use Excel export.');
}

export default {
  generateExcelReport,
  generatePDFReport
};

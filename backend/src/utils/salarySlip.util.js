import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// School Information
const SCHOOL_INFO = {
  name: 'د امیرالمومنین ښوونځی',
  nameDari: 'مکتب امیرالمومنین',
  address: 'جوزجان، افغانستان',
  phone: '0799999999',
  ministry: 'وزارت معارف',
  department: 'ریاست معارف جوزجان',
};

// Try to load Amiri font for Pashto support
const loadPashtoFont = () => {
  try {
    const fontPath = path.join(__dirname, '../../public/Amiri-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  } catch (err) {
    console.log('Pashto font not found, using default');
  }
  return null;
};

// ─── GENERATE SALARY SLIP PDF (POS Style - 80mm) ──────────────────────────────

export const generateSalarySlipPDF = (salaryData) => {
  return new Promise((resolve, reject) => {
    try {
      // 80mm = 226.77 points
      const doc = new PDFDocument({ 
        size: [226.77, 841.89], // 80mm width, auto height
        margin: 28.35 // 10mm margins
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Try to register Pashto font
      const pashtoFont = loadPashtoFont();
      if (pashtoFont) {
        try {
          doc.registerFont('Amiri', pashtoFont);
          doc.font('Amiri');
        } catch (err) {
          console.log('Could not load Pashto font, using default');
          doc.font('Helvetica');
        }
      } else {
        doc.font('Helvetica');
      }

      // School Name Header
      doc.fontSize(14).font(pashtoFont ? 'Amiri' : 'Helvetica-Bold');
      doc.text(SCHOOL_INFO.name, { align: 'center' });
      doc.fontSize(10);
      doc.text(SCHOOL_INFO.address, { align: 'center' });
      doc.text(`تلفون: ${SCHOOL_INFO.phone}`, { align: 'center' });
      doc.moveDown(0.5);
      
      // Line separator
      doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).stroke();
      doc.moveDown(0.5);

      // Slip Title
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('د معاش پرچه', { align: 'center' });
      doc.text('Salary Slip', { align: 'center' });
      doc.moveDown(0.5);

      // Month & Date
      doc.fontSize(9).font('Helvetica');
      doc.text(`میاشت: ${salaryData.month}`, { align: 'right' });
      doc.text(`تعلیمي کال: ${salaryData.academicYear}`, { align: 'right' });
      doc.text(`نیټه: ${salaryData.paymentDate || salaryData.createdAt?.split('T')[0] || ''}`, { align: 'right' });
      doc.moveDown(0.5);

      // Dashed line
      doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).dash(3, { space: 3 }).stroke().undash();
      doc.moveDown(0.5);

      // Employee Information
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('نوم:', { continued: false });
      doc.font('Helvetica');
      doc.text(salaryData.personName, { indent: 20 });
      doc.moveDown(0.3);

      doc.font('Helvetica-Bold');
      doc.text('دنده:', { continued: false });
      doc.font('Helvetica');
      doc.text(salaryData.position || salaryData.personType, { indent: 20 });
      doc.moveDown(0.3);

      doc.font('Helvetica-Bold');
      doc.text('ډول:', { continued: false });
      doc.font('Helvetica');
      const typeMap = { Teacher: 'ښوونکی', Staff: 'کارمند' };
      doc.text(typeMap[salaryData.personType] || salaryData.personType, { indent: 20 });
      doc.moveDown(0.5);

      // Dashed line
      doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).dash(3, { space: 3 }).stroke().undash();
      doc.moveDown(0.5);

      // EARNINGS Section
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('عایدات (EARNINGS)', { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica');
      doc.text(`اصلي معاش:`, { continued: true });
      doc.text(`${Number(salaryData.baseSalary || 0).toLocaleString()} AFN`, { align: 'right' });

      if (salaryData.allowances > 0) {
        doc.text(`علاوې:`, { continued: true });
        doc.text(`${Number(salaryData.allowances || 0).toLocaleString()} AFN`, { align: 'right' });
      }

      if (salaryData.bonuses > 0) {
        doc.text(`انعامونه:`, { continued: true });
        doc.text(`${Number(salaryData.bonuses || 0).toLocaleString()} AFN`, { align: 'right' });
      }

      doc.moveDown(0.3);
      doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica-Bold');
      doc.text(`ټول معاش:`, { continued: true });
      doc.text(`${Number(salaryData.grossSalary || 0).toLocaleString()} AFN`, { align: 'right' });
      doc.moveDown(0.5);

      // DEDUCTIONS Section
      if (salaryData.deductions > 0) {
        doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).dash(3, { space: 3 }).stroke().undash();
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('کسرونه (DEDUCTIONS)', { align: 'center' });
        doc.moveDown(0.3);

        doc.fontSize(9).font('Helvetica');
        
        // Show component-wise deductions if available
        if (salaryData.components && salaryData.components.length > 0) {
          salaryData.components
            .filter(c => c.type === 'Deduction')
            .forEach(comp => {
              const categoryMap = {
                'Advance': 'پیشکي',
                'Loan': 'پور',
                'Absence': 'غیر حاضري',
                'Tax': 'مالیه',
                'Other': 'نور'
              };
              doc.text(`${categoryMap[comp.category] || comp.category}:`, { continued: true });
              doc.text(`${Number(comp.amount || 0).toLocaleString()} AFN`, { align: 'right' });
            });
        } else {
          doc.text(`ټول کسرونه:`, { continued: true });
          doc.text(`${Number(salaryData.deductions || 0).toLocaleString()} AFN`, { align: 'right' });
        }

        doc.moveDown(0.3);
        doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).stroke();
        doc.moveDown(0.3);
      }

      // NET SALARY
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`خالص معاش:`, { continued: true });
      doc.text(`${Number(salaryData.netSalary || 0).toLocaleString()} AFN`, { align: 'right' });
      doc.moveDown(0.5);

      // Solid line
      doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).stroke();
      doc.moveDown(0.5);

      // Attendance Summary
      doc.fontSize(9).font('Helvetica');
      doc.text('د حاضرۍ لنډیز:', { underline: true });
      doc.text(`کاري ورځې: ${salaryData.workingDays || 26}`);
      doc.text(`حاضر: ${salaryData.presentDays || 0}`);
      doc.text(`غیر حاضر: ${salaryData.absentDays || 0}`);
      doc.text(`رخصتي: ${salaryData.leaveDays || 0}`);
      doc.moveDown(0.5);

      // Payment Status
      const statusMap = {
        'Paid': 'ورکړل شوی',
        'Partial': 'نیمګړی',
        'Pending': 'پاتې'
      };
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`حالت: ${statusMap[salaryData.paymentStatus] || salaryData.paymentStatus}`, { align: 'center' });
      
      if (salaryData.paidAmount > 0) {
        doc.fontSize(9).font('Helvetica');
        doc.text(`ورکړل شوی: ${Number(salaryData.paidAmount || 0).toLocaleString()} AFN`, { align: 'center' });
      }
      doc.moveDown(0.5);

      // Notes
      if (salaryData.notes) {
        doc.fontSize(8).font('Helvetica');
        doc.text(`یادښت: ${salaryData.notes}`, { align: 'right' });
        doc.moveDown(0.5);
      }

      // Payment Method
      if (salaryData.paymentMethod) {
        const methodMap = {
          'Cash': 'نغدي',
          'Bank': 'بانک',
          'Check': 'چک'
        };
        doc.fontSize(8).font('Helvetica');
        doc.text(`د تادیې طریقه: ${methodMap[salaryData.paymentMethod] || salaryData.paymentMethod}`, { align: 'right' });
        doc.moveDown(0.5);
      }

      // Dashed line
      doc.moveTo(28.35, doc.y).lineTo(198.42, doc.y).dash(3, { space: 3 }).stroke().undash();
      doc.moveDown(0.5);

      // Signatures
      doc.fontSize(8).font('Helvetica');
      doc.text('د کارمند لاسلیک:', { align: 'left' });
      doc.moveDown(0.8);
      doc.text('_________________', { align: 'left' });
      doc.moveDown(0.5);

      doc.text('د محاسب لاسلیک:', { align: 'right' });
      doc.moveDown(0.8);
      doc.text('_________________', { align: 'right' });
      doc.moveDown(0.5);

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text('مننه چې تاسو زموږ سره یاست', { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(7).font('Helvetica');
      doc.text('د اړیکې شمیره: ۰۷۹۹۹۹۹۹۹۹', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─── GENERATE MULTIPLE SALARY SLIPS PDF ───────────────────────────────────────

export const generateMultipleSalarySlipsPDF = (salariesData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      salariesData.forEach((salary, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Header
        doc.fontSize(20).font('Helvetica-Bold');
        doc.text('د معاش پرچه / Salary Slip', { align: 'center' });
        doc.moveDown();

        // Month & Year
        doc.fontSize(12).font('Helvetica');
        doc.text(`Month / میاشت: ${salary.month}`, { align: 'right' });
        doc.text(`Academic Year / تعلیمي کال: ${salary.academicYear}`, { align: 'right' });
        doc.moveDown();

        // Employee Info
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('Employee Information / د کارمند معلومات');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Name / نوم: ${salary.personName}`);
        doc.text(`Position / دنده: ${salary.position || salary.personType}`);
        doc.text(`Type / ډول: ${salary.personType}`);
        doc.moveDown();

        // Earnings
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('Earnings / عایدات');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Base Salary / اصلي معاش: ${Number(salary.baseSalary || 0).toLocaleString()} AFN`);
        if (salary.allowances > 0) {
          doc.text(`Allowances / علاوې: ${Number(salary.allowances || 0).toLocaleString()} AFN`);
        }
        if (salary.bonuses > 0) {
          doc.text(`Bonuses / انعامونه: ${Number(salary.bonuses || 0).toLocaleString()} AFN`);
        }
        doc.text(`Gross Salary / ټول معاش: ${Number(salary.grossSalary || 0).toLocaleString()} AFN`);
        doc.moveDown();

        // Deductions
        if (salary.deductions > 0) {
          doc.fontSize(14).font('Helvetica-Bold');
          doc.text('Deductions / کسرونه');
          doc.fontSize(12).font('Helvetica');
          doc.text(`Total Deductions / ټول کسرونه: ${Number(salary.deductions || 0).toLocaleString()} AFN`);
          doc.moveDown();
        }

        // Net Salary
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text(`Net Salary / خالص معاش: ${Number(salary.netSalary || 0).toLocaleString()} AFN`);
        doc.moveDown();

        // Attendance
        doc.fontSize(12).font('Helvetica');
        doc.text(`Attendance / حاضري: Present ${salary.presentDays}/${salary.workingDays}, Absent ${salary.absentDays}, Leave ${salary.leaveDays}`);
        doc.moveDown();

        // Payment Status
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Status / حالت: ${salary.paymentStatus}`);
        if (salary.paidAmount > 0) {
          doc.text(`Paid Amount / ورکړل شوی: ${Number(salary.paidAmount || 0).toLocaleString()} AFN`);
        }
        doc.moveDown(2);

        // Signatures
        doc.fontSize(10).font('Helvetica');
        doc.text('Employee Signature: _______________     Accountant Signature: _______________');
        doc.text('د کارمند لاسلیک                                    د محاسب لاسلیک', { align: 'center' });
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateSalarySlipPDF,
  generateMultipleSalarySlipsPDF,
};

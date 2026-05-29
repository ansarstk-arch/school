import PDFDocument from 'pdfkit';
import { SCHOOL_INFO } from '../config/school.config.js';
import { registerPdfFonts, setFont } from './pdfKitHelpers.util.js';

/**
 * Generate Salary Slip PDF (Simple version with better Pashto support)
 */
export const generateSalarySlipPDF = (salaryData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document (80mm thermal printer width)
      const doc = new PDFDocument({ 
        size: [226.77, 841.89], // 80mm width
        margin: 20
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerPdfFonts(doc);

      const pageWidth = 226.77;
      const contentWidth = pageWidth - 40;
      let yPos = 20;

      // Helper function to add centered text
      const addCenteredText = (text, fontSize = 10, bold = false) => {
        doc.fontSize(fontSize);
        setFont(doc, bold);
        doc.text(text, 20, yPos, {
          width: contentWidth,
          align: 'center'
        });
        yPos += fontSize + 5;
      };

      // Helper function to add line
      const addLine = (style = 'solid') => {
        if (style === 'dashed') {
          doc.dash(3, { space: 3 });
        }
        doc.moveTo(20, yPos).lineTo(pageWidth - 20, yPos).stroke();
        if (style === 'dashed') {
          doc.undash();
        }
        yPos += 10;
      };

      // Helper function to add row
      const addRow = (label, value, bold = false) => {
        doc.fontSize(9);
        setFont(doc, bold);
        doc.text(label, 20, yPos, { width: contentWidth * 0.5, align: 'right' });
        doc.text(value, 20 + (contentWidth * 0.5), yPos, { width: contentWidth * 0.5, align: 'left' });
        yPos += 15;
      };

      // ═══════════════════════════════════════════════════════════════════
      // HEADER
      // ═══════════════════════════════════════════════════════════════════
      
      addCenteredText(SCHOOL_INFO.name, 14, true);
      addCenteredText(SCHOOL_INFO.address, 9);
      addCenteredText(`تلفون: ${SCHOOL_INFO.phone}`, 9);
      yPos += 5;
      addLine();

      // Title
      addCenteredText('د معاش پرچه', 12, true);
      yPos += 5;

      setFont(doc, false);
      doc.fontSize(9);
      doc.text(`میاشت: ${salaryData.month}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 12;
      doc.text(`تعلیمي کال: ${salaryData.academicYear}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 12;
      const printDate = salaryData.paymentDate || salaryData.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
      doc.text(`نیټه: ${printDate}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 15;

      addLine('dashed');

      // ═══════════════════════════════════════════════════════════════════
      // EMPLOYEE INFO
      // ═══════════════════════════════════════════════════════════════════
      
      addRow('نوم:', salaryData.personName || '-', true);
      addRow('دنده:', salaryData.position || salaryData.personType || '-');
      
      const typeMap = { Teacher: 'ښوونکی', Staff: 'کارمند' };
      addRow('ډول:', typeMap[salaryData.personType] || salaryData.personType);
      
      yPos += 5;
      addLine('dashed');

      // ═══════════════════════════════════════════════════════════════════
      // EARNINGS
      // ═══════════════════════════════════════════════════════════════════
      
      addCenteredText('عایدات', 10, true);
      yPos += 5;

      addRow('اصلي معاش:', `${Number(salaryData.baseSalary || 0).toLocaleString()} AFN`);
      
      if (salaryData.allowances > 0) {
        addRow('علاوې:', `${Number(salaryData.allowances || 0).toLocaleString()} AFN`);
      }
      
      if (salaryData.bonuses > 0) {
        addRow('انعامونه:', `${Number(salaryData.bonuses || 0).toLocaleString()} AFN`);
      }

      yPos += 5;
      addLine();
      addRow('ټول معاش:', `${Number(salaryData.grossSalary || 0).toLocaleString()} AFN`, true);
      yPos += 5;

      // ═══════════════════════════════════════════════════════════════════
      // DEDUCTIONS
      // ═══════════════════════════════════════════════════════════════════
      
      if (salaryData.deductions > 0) {
        addLine('dashed');
        addCenteredText('کسرونه', 10, true);
        yPos += 5;

        // Show component-wise deductions if available
        if (salaryData.components && salaryData.components.length > 0) {
          const deductionComponents = salaryData.components.filter(c => c.type === 'Deduction');
          
          if (deductionComponents.length > 0) {
            const categoryMap = {
              'Advance': 'پیشکي',
              'Loan': 'پور',
              'Absence': 'غیر حاضري',
              'Tax': 'مالیه',
              'Other': 'نور'
            };
            
            deductionComponents.forEach(comp => {
              const label = categoryMap[comp.category] || comp.category;
              addRow(`${label}:`, `${Number(comp.amount || 0).toLocaleString()} AFN`);
            });
          } else {
            addRow('ټول کسرونه:', `${Number(salaryData.deductions || 0).toLocaleString()} AFN`);
          }
        } else {
          addRow('ټول کسرونه:', `${Number(salaryData.deductions || 0).toLocaleString()} AFN`);
        }

        yPos += 5;
        addLine();
      }

      // ═══════════════════════════════════════════════════════════════════
      // NET SALARY
      // ═══════════════════════════════════════════════════════════════════
      
      setFont(doc, true);
      doc.fontSize(11);
      doc.text('خالص معاش:', 20, yPos, { width: contentWidth * 0.5, align: 'right' });
      doc.text(`${Number(salaryData.netSalary || 0).toLocaleString()} AFN`, 20 + (contentWidth * 0.5), yPos, { 
        width: contentWidth * 0.5, 
        align: 'left' 
      });
      yPos += 20;

      addLine();

      // ═══════════════════════════════════════════════════════════════════
      // ATTENDANCE SUMMARY
      // ═══════════════════════════════════════════════════════════════════
      
      setFont(doc, true);
      doc.fontSize(9);
      doc.text('د حاضرۍ لنډیز:', 20, yPos, { width: contentWidth, align: 'right', underline: true });
      yPos += 15;

      setFont(doc, false);
      doc.text(`کاري ورځې: ${salaryData.workingDays || 26}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 12;
      doc.text(`حاضر: ${salaryData.presentDays || 0}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 12;
      doc.text(`غیر حاضر: ${salaryData.absentDays || 0}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 12;
      doc.text(`رخصتي: ${salaryData.leaveDays || 0}`, 20, yPos, { width: contentWidth, align: 'right' });
      yPos += 15;

      // ═══════════════════════════════════════════════════════════════════
      // PAYMENT STATUS
      // ═══════════════════════════════════════════════════════════════════
      
      const statusMap = {
        'Paid': 'ورکړل شوی',
        'Partial': 'نیمګړی',
        'Pending': 'پاتې'
      };
      
      setFont(doc, true);
      doc.fontSize(10);
      doc.text(`حالت: ${statusMap[salaryData.paymentStatus] || salaryData.paymentStatus}`, 20, yPos, { 
        width: contentWidth, 
        align: 'center' 
      });
      yPos += 15;

      if (salaryData.paidAmount > 0) {
        setFont(doc, false);
        doc.fontSize(9);
        doc.text(`ورکړل شوی: ${Number(salaryData.paidAmount || 0).toLocaleString()} افغانۍ`, 20, yPos, { 
          width: contentWidth, 
          align: 'center' 
        });
        yPos += 12;
      }

      // Payment Method
      if (salaryData.paymentMethod) {
        const methodMap = {
          'Cash': 'نغدي',
          'Bank': 'بانک',
          'Check': 'چک'
        };
        doc.text(`د تادیې طریقه: ${methodMap[salaryData.paymentMethod] || salaryData.paymentMethod}`, 20, yPos, { 
          width: contentWidth, 
          align: 'center' 
        });
        yPos += 15;
      }

      // Notes
      if (salaryData.notes) {
        setFont(doc, false);
        doc.fontSize(8);
        doc.text(`یادښت: ${salaryData.notes}`, 20, yPos, { width: contentWidth, align: 'right' });
        yPos += 15;
      }

      yPos += 5;
      addLine('dashed');

      // ═══════════════════════════════════════════════════════════════════
      // SIGNATURES
      // ═══════════════════════════════════════════════════════════════════
      
      setFont(doc, false);
      doc.fontSize(8);
      doc.text('د کارمند لاسلیک:', 20, yPos, { width: contentWidth * 0.45, align: 'left' });
      doc.text('د محاسب لاسلیک:', 20 + (contentWidth * 0.55), yPos, { width: contentWidth * 0.45, align: 'right' });
      yPos += 20;

      doc.text('_____________', 20, yPos, { width: contentWidth * 0.45, align: 'left' });
      doc.text('_____________', 20 + (contentWidth * 0.55), yPos, { width: contentWidth * 0.45, align: 'right' });
      yPos += 20;

      // ═══════════════════════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════════════════════
      
      setFont(doc, false);
      doc.fontSize(8);
      doc.text('مننه چې تاسو زموږ سره یاست', 20, yPos, { width: contentWidth, align: 'center' });
      yPos += 12;

      doc.fontSize(7);
      doc.text(`د اړیکې شمیره: ${SCHOOL_INFO.phone}`, 20, yPos, { width: contentWidth, align: 'center' });

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
};

export default {
  generateSalarySlipPDF,
};

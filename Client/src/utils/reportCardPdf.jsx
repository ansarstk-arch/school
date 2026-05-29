import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import ReportCard from "@/components/erp/ReportCard";

/**
 * Preload images to ensure they're available for canvas rendering


/**
 * Generate single report card PDF
 */
export async function generateSingleReportCardPDF(reportData, examType, studentName = "student") {
  try {
    // Preload logos and student image
    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    const imagesToLoad = [
      "/pic1.jpg",
      "/pic2.jpg",
    ];

    // Create temporary container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    // Render React component
    const root = createRoot(container);
    await new Promise((resolve) => {
      root.render(
        <ReportCard 
          data={reportData} 
          examType={examType}
          scale={1} 
        />
      );
      setTimeout(resolve, 500);
    });

    const canvas = await html2canvas(container.firstChild, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Cleanup
    root.unmount();
    document.body.removeChild(container);
    const imgData = canvas.toDataURL("image/png");
    
    // A4 portrait dimensions in mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const examTypeLabel = examType === "FirstTerm" ? "چهار نیمه" : "سالانه";
    const fileName = `اطلاع_نامه_${studentName.replace(/\s+/g, "_")}_${examTypeLabel}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating report card PDF:", error);
    throw new Error("د اطلاع نامې په جوړولو کې تېروتنه");
  }
}

/**
 * Generate multiple report cards PDF (optimized)
 */
export async function generateMultipleReportCardsPDF(reportCards, examType, className = "class") {
  try {
    if (!reportCards || reportCards.length === 0) {
      throw new Error("هیڅ اطلاع نامه ونه موندل شوه");
    }

    console.log(`Generating ${reportCards.length} report cards...`);

    // Preload all images
    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    const imagesToLoad = ["/pic1.jpg", "/pic2.jpg"];
    
    reportCards.forEach((rc) => {
      if (rc.student?.image) {
        const imgPath = rc.student.image.startsWith('http') 
          ? rc.student.image 
          : `${API_BASE}/uploads/students/${rc.student.image}`;
        imagesToLoad.push(imgPath);
      }
    });
    
    await preloadImages(imagesToLoad);
    console.log("All images loaded");

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Create temporary container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const root = createRoot(container);

    for (let i = 0; i < reportCards.length; i++) {
      console.log(`Processing report card ${i + 1}/${reportCards.length}...`);

      // Render component
      await new Promise((resolve) => {
        root.render(
          <ReportCard 
            data={reportCards[i]} 
            examType={examType}
            scale={1} 
          />
        );
        setTimeout(resolve, 300);
      });

      // Generate canvas
      const canvas = await html2canvas(container.firstChild, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // Add page (except for first card)
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    const examTypeLabel = examType === "FirstTerm" ? "چهار_ماهه" : "سالانه";
    const fileName = `اطلاع_نامې_${className.replace(/\s+/g, "_")}_${examTypeLabel}.pdf`;
    pdf.save(fileName);

    console.log("Multiple report cards PDF generated successfully");
  } catch (error) {
    console.error("Error generating multiple report cards PDF:", error);
    throw new Error("د اطلاع نامو په جوړولو کې تېروتنه");
  }
}

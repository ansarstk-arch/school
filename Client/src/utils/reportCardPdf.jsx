import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import ReportCard from "@/components/erp/ReportCard";

const EXAM_TYPE_LABELS = {
  FirstTerm: "چهار_نیمه",
  Annual: "سالانه",
  SingleExam: "ازموینه",
};

function preloadImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(
    unique.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
}

export async function generateSingleReportCardPDF(reportData, examType, studentName = "student") {
  try {
    await preloadImages(["/pic1.jpg", "/pic2.jpg"]);

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const root = createRoot(container);
    await new Promise((resolve) => {
      root.render(<ReportCard data={reportData} examType={examType} scale={1} />);
      setTimeout(resolve, 500);
    });

    const canvas = await html2canvas(container.firstChild, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    root.unmount();
    document.body.removeChild(container);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);

    const label = EXAM_TYPE_LABELS[examType] || examType;
    pdf.save(`سند_${studentName.replace(/\s+/g, "_")}_${label}.pdf`);
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    throw new Error("د سند په جوړولو کې تېروتنه");
  }
}

export async function generateMultipleReportCardsPDF(reportCards, examType, className = "class") {
  try {
    if (!reportCards?.length) {
      throw new Error("هیڅ سند ونه موندل شو");
    }

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

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const root = createRoot(container);

    for (let i = 0; i < reportCards.length; i++) {
      await new Promise((resolve) => {
        root.render(
          <ReportCard data={reportCards[i]} examType={examType} scale={1} />
        );
        setTimeout(resolve, 300);
      });

      const canvas = await html2canvas(container.firstChild, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    root.unmount();
    document.body.removeChild(container);

    const label = EXAM_TYPE_LABELS[examType] || examType;
    pdf.save(`سندونه_${className.replace(/\s+/g, "_")}_${label}.pdf`);
  } catch (error) {
    console.error("Error generating certificates PDF:", error);
    throw new Error("د سندونو په جوړولو کې تېروتنه");
  }
}

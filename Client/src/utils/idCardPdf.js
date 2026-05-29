import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import { buildAttendanceQrPayload } from "./attendanceQr";

/**
 * Optimized ID Card PDF Generation
 * Pre-loads all images and uses canvas for fast rendering
 */

const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const CARD_WIDTH_PX = 1016;
const CARD_HEIGHT_PX = 638;

const EDU_LABEL = {
  grade12: '۱۲ ګرېډ پاس',
  grade14: '۱۴ ګرېډ پاس',
  bachelor: 'لیسانس',
  master: 'ماستري',
  phd: 'دکتورا',
};

/**
 * Load an image and return it as HTMLImageElement
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(null); // Resolve with null instead of rejecting
    };
    img.src = src;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!img.complete) {
        console.warn(`Image load timeout: ${src}`);
        resolve(null);
      }
    }, 5000);
  });
}

/**
 * Draw image with CSS object-fit: cover behavior onto canvas
 * Preserves aspect ratio and fills the target rectangle by cropping as needed
 */
function drawImageCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const sw = img.width;
  const sh = img.height;
  const dw = w;
  const dh = h;

  const scale = Math.max(dw / sw, dh / sh);
  const swScaled = dw / scale;
  const shScaled = dh / scale;

  const sx = Math.max(0, (sw - swScaled) / 2);
  const sy = Math.max(0, (sh - shScaled) / 2);

  ctx.drawImage(img, sx, sy, swScaled, shScaled, x, y, dw, dh);
}

// Draw rounded rectangle path (used for clipping and borders)
function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function createQRCodeCanvas(value, size) {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;
  container.style.opacity = "0";
  document.body.appendChild(container);

  const root = createRoot(container);
  flushSync(() => {
    root.render(
      React.createElement(QRCodeCanvas, {
        value,
        size,
        includeMargin: false,
        bgColor: "#ffffff",
        fgColor: "#000000",
      })
    );
  });

  const copyCanvas = await new Promise((resolve, reject) => {
    const start = performance.now();

    const check = () => {
      const qrCanvas = container.querySelector("canvas");
      if (qrCanvas) {
        const result = document.createElement("canvas");
        result.width = size;
        result.height = size;
        const ctx = result.getContext("2d");
        ctx.drawImage(qrCanvas, 0, 0, size, size);
        resolve(result);
        return;
      }

      if (performance.now() - start > 2000) {
        reject(new Error("QR code canvas did not render in time"));
        return;
      }

      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  });

  root.unmount();
  if (container.parentNode) {
    container.parentNode.removeChild(container);
  }

  return copyCanvas;
}

// Load Amiri font into document.fonts for canvas rendering
let canvasFontsLoaded = false;
async function ensureCanvasFonts() {
  if (canvasFontsLoaded) return;

  async function loadFont(name, url, descriptors = {}) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load font ${url}: ${res.status}`);
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: 'font/ttf' });
    const blobUrl = URL.createObjectURL(blob);
    const fontFace = new FontFace(name, `url(${blobUrl})`, descriptors);
    await fontFace.load();
    document.fonts.add(fontFace);
    URL.revokeObjectURL(blobUrl);
  }

  try {
    // Regular and bold weights under same family name
    await Promise.all([
      loadFont('Amiri', '/Amiri-Regular.ttf', { weight: '400' }),
      loadFont('Amiri', '/Amiri-Bold.ttf', { weight: '700' }),
    ]);
    // Wait for fonts to be ready
    await document.fonts.ready;
    canvasFontsLoaded = true;
    console.log('Canvas fonts loaded');
  } catch (err) {
    console.warn('Unable to load canvas fonts, falling back to system fonts', err);
  }
}

/**
 * Get the appropriate background image path based on card type
 */
function getBackgroundImagePath(cardType) {
  switch (cardType) {
    case 'teacher':
      return '/teacher_id.png';
    case 'staff':
      return '/staff_id.png';
    case 'student':
    default:
      return '/student_id.png';
  }
}

/**
 * Draw ID card on canvas
 */
async function drawCardOnCanvas(student, backgroundImg, logoImg) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH_PX;
  canvas.height = CARD_HEIGHT_PX;
  const ctx = canvas.getContext('2d');

  // Draw background
  if (backgroundImg) {
    // Use cover behaviour to match CSS object-fit: cover in the DOM
    drawImageCover(ctx, backgroundImg, 0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX);
  }

  // Draw transparent logo in center background (matching preview)
  if (logoImg) {
    const bgLogoWidth = 300;
    const bgLogoHeight = Math.round((logoImg.height / logoImg.width) * bgLogoWidth);
    const bgLogoX = CARD_WIDTH_PX * 0.70 - bgLogoWidth / 2;
    const bgLogoY = CARD_HEIGHT_PX * 0.55 - bgLogoHeight / 2;
    
    ctx.save();
    ctx.globalAlpha = 0.1; // 10% opacity to match preview
    ctx.drawImage(logoImg, bgLogoX, bgLogoY, bgLogoWidth, bgLogoHeight);
    ctx.restore();
  }

  // Draw top-right logo
  if (logoImg) {
    const logoWidth = 100;
    const logoHeight = Math.round((logoImg.height / logoImg.width) * logoWidth);
    // Keep logo aspect ratio without cover cropping
    ctx.drawImage(logoImg, CARD_WIDTH_PX - logoWidth - 50, 10, logoWidth, logoHeight);
  }

  // Draw student/teacher/staff photo
  const photoPath = student.imageUrl || student.image;
  if (photoPath) {
    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    let photoSrc;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      photoSrc = photoPath;
    } else if (photoPath.startsWith('/')) {
      photoSrc = `${API_BASE}${photoPath}`;
    } else {
      photoSrc = `${API_BASE}/uploads/${photoPath}`;
    }
    const photoImg = await loadImage(photoSrc);
    
    if (photoImg) {
      const photoX = 110;
      const photoY = 155;
      const photoWidth = 180;
      const photoHeight = 220;

      // Draw white rounded border and clip image to rounded rect to match DOM
      const border = 3;
      const radius = 8;
      // White rounded rect (outer)
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, photoX - border, photoY - border, photoWidth + border * 2, photoHeight + border * 2, radius + border);
      ctx.fill();

      // Clip to inner rounded rect and draw image with cover
      ctx.save();
      roundRectPath(ctx, photoX, photoY, photoWidth, photoHeight, radius);
      ctx.clip();
      drawImageCover(ctx, photoImg, photoX, photoY, photoWidth, photoHeight);
      ctx.restore();
    } else {
      console.warn('Failed to load photo for:', student.fullName);
    }
  }

  // Draw QR code to match the card preview exactly
  if (student.id) {
    try {
      const qrSize = 110;
      const cardRole =
        student.cardType === "teacher"
          ? "teacher"
          : student.cardType === "staff"
            ? "staff"
            : "student";
      const qrValue = buildAttendanceQrPayload(cardRole, student.id);
      const qrCanvas = await createQRCodeCanvas(qrValue, qrSize);
      
      // QR code position matching preview: container is 80x80 at left:168, top:450
      // But QR itself is 110px, so we need to center it within the container
      const containerX = 168;
      const containerY = 450;
      const containerSize = 80;
      
      // Center the 110px QR within the 80px container (it will overflow as in preview)
      const qrX = containerX + (containerSize - qrSize) / 2;
      const qrY = containerY + (containerSize - qrSize) / 2;
      
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    } catch (error) {
      console.warn('Failed to render QR code for PDF:', error);
    }
  }

  // Set text properties - matching IdCardGenerator exactly
  ctx.fillStyle = '#1a1a1a';
  // Use Amiri font if available and set alignment to match DOM
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  ctx.textBaseline = 'top';
  // Prefer using Amiri if loaded
  try {
    ctx.font = '700 24px Amiri';
  } catch (e) {
    ctx.font = 'bold 24px Arial';
  }

  // Match DOM metrics: top = 193, fontSize = 24, lineHeight = 1.8, marginBottom = 40
  const textX = CARD_WIDTH_PX - 190;
  const startY = 200; // Adjusted down to match preview exactly
  const fontSize = 24;
  const lineHeight = 1.8;
  const actualLineHeight = fontSize * lineHeight; // 24 * 1.8 = 43.2
  const marginBottom = 40;

  // First field top is startY, then step by (actualLineHeight + marginBottom)
  const stepY = actualLineHeight + marginBottom; // matches DOM: line height + margin-bottom

  const fields = [
    { text: `ایډیکارډ نمبر: ${student.id || '—'}`, y: startY + stepY * 0 },
    { text: `نوم: ${student.fullName || '—'}`, y: startY + stepY * 1 },
    { text: `د پلار نوم: ${student.fatherName || '—'}`, y: startY + stepY * 2 },
    { text: `${student.fieldLabel || 'ټولګی:'} ${EDU_LABEL[student.className] || student.className || '—'}`, y: startY + stepY * 3 },
  ];

  fields.forEach((field) => {
    ctx.fillText(field.text, textX, field.y);
  });

  // Draw school name and card title (centered at 55% in DOM; align with translateX(-50%))
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#1E3A5F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  try {
    ctx.font = '700 32px Amiri';
  } catch (e) {
    ctx.font = 'bold 32px Arial';
  }
  const schoolY = 50;
  ctx.fillText('سرتاج حنفي خصوصي ښونځي او وړکتون', CARD_WIDTH_PX * 0.55, schoolY);

  const cardTitle = student.title || 'شاګرد پیژند کارډ';
  ctx.fillStyle = '#1E3A5F';
  try {
    ctx.font = '600 26px Amiri';
  } catch (e) {
    ctx.font = '600 26px Arial';
  }
  const titleY = schoolY + 60;
  ctx.fillText(cardTitle, CARD_WIDTH_PX * 0.55, titleY);

  return canvas;
}

/**
 * Generate single card PDF
 */
export async function generateSingleCardPDF(student, studentName = "student") {
  try {
    console.log("Loading images...");
      // Ensure canvas fonts are loaded for pixel-matching text
      await ensureCanvasFonts();
    
    // Pre-load background and logo - use appropriate background for card type
    const backgroundPath = getBackgroundImagePath(student.cardType);
    const [backgroundImg, logoImg] = await Promise.all([
      loadImage(backgroundPath),
      loadImage('/logo.png'),
    ]);

    console.log("Drawing card on canvas...");
    const canvas = await drawCardOnCanvas(student, backgroundImg, logoImg);

    console.log("Creating PDF...");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
      compress: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `ID_Card_${studentName.replace(/\s+/g, "_")}_${timestamp}.pdf`;
    
    pdf.save(filename);
    console.log("PDF generated successfully!");
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("د کارت په جوړولو کې تېروتنه");
  }
}

/**
 * Generate multiple cards PDF (optimized)
 */
export async function generateMultipleCardsPDF(students) {
  try {
    if (!students || students.length === 0) {
      throw new Error("هیڅ کارت د صادرولو لپاره شتون نلري");
    }

    console.log(`Generating PDF for ${students.length} cards...`);
    await ensureCanvasFonts();
    
    // Pre-load logo and all background images needed
    console.log("Pre-loading images...");
    const bgImagePaths = new Set();
    students.forEach(s => {
      bgImagePaths.add(getBackgroundImagePath(s.cardType));
    });

    const [logoImg, ...bgImages] = await Promise.all([
      loadImage('/logo.png'),
      ...Array.from(bgImagePaths).map(path => loadImage(path))
    ]);

    // Create a map of background paths to loaded images
    const bgImageMap = {};
    let bgIndex = 0;
    bgImagePaths.forEach(path => {
      bgImageMap[path] = bgImages[bgIndex];
      bgIndex++;
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
      compress: true,
    });

    // Process each card
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      console.log(`Processing card ${i + 1}/${students.length}: ${student.fullName}`);

      // Get the appropriate background image for this card type
      const bgPath = getBackgroundImagePath(student.cardType);
      const bgImage = bgImageMap[bgPath];

      const canvas = await drawCardOnCanvas(student, bgImage, logoImg);

      if (i > 0) {
        pdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], "landscape");
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `ID_Cards_${students.length}_${timestamp}.pdf`;
    
    pdf.save(filename);
    console.log("Multi-card PDF generated successfully!");
    
    return true;
  } catch (error) {
    console.error("Error generating multiple cards PDF:", error);
    throw new Error("د کارتونو په جوړولو کې تېروتنه");
  }
}

// Export for backward compatibility
export async function waitForImagesToLoad() {
  // Not needed in new implementation
  return Promise.resolve();
}

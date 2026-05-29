import { forwardRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { buildAttendanceQrPayload } from '@/utils/attendanceQr';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
const imgUrl = (path) => {
  if (!path) return null;
  const trimmed = String(path).trim();
  if (!trimmed) return null;
  
  // If already a full URL, return as is
  if (/^(https?:)?\/\//.test(trimmed)) return trimmed;
  
  // If starts with /uploads/, ensure it has the correct format
  if (trimmed.startsWith('/uploads/')) {
    return `${API_BASE}${trimmed}`;
  }
  
  // If starts with uploads/ without leading slash
  if (trimmed.startsWith('uploads/')) {
    return `${API_BASE}/${trimmed}`;
  }
  
  // If starts with / but not /uploads, assume it's from backend
  if (trimmed.startsWith('/')) {
    return `${API_BASE}${trimmed}`;
  }
  
  // For student images from backend (e.g., "students/School/image.jpg")
  if (trimmed.includes('students/')) {
    return `${API_BASE}/uploads/${trimmed}`;
  }
  
  // Default fallback
  return `${API_BASE}/uploads/${trimmed}`;
};

/**
 * IdCardGenerator Component
 * Renders a student ID card with background image and overlaid data
 * 
 * @param {Object} student - Student data object
 * @param {number} scale - Scale factor for rendering (default: 1)
 * @param {React.Ref} ref - Ref for PDF generation
 */
const IdCardGenerator = forwardRef(({ student, scale = 1 }, ref) => {
  const title = student.title || 'شاګرد پیژند کارډ';
  const cardWidth = 1016;
  const cardHeight = 638;

  return (
    <div
      ref={ref}
      style={{
        width: `${cardWidth * scale}px`,
        height: `${cardHeight * scale}px`,
        position: 'relative',
        fontFamily: 'Amiri, Arial, sans-serif',
        direction: 'rtl',
        overflow: 'hidden',
      }}
    >
      {/* Background Image - Using img tag instead of CSS background */}
      <img
        src="/student_id.png"
        alt="ID Card Background"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      {/* Transparent Logo in Center Background */}
      <img
        src="/logo.png"
        alt="Background Logo"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          top: '55%',
          left: '70%',
          transform: 'translate(-50%, -50%)',
          width: `${300 * scale}px`,
          height: 'auto',
          opacity: 0.1,
          zIndex: 1,
        }}
      />

      {/* Logo */}
      <img
        src="/logo.png"
        alt="Logo"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          top: `${10 * scale}px`,
          right: `${50 * scale}px`,
          width: `${100 * scale}px`,
          height: 'auto',
          zIndex: 2,
        }}
      />
      {/* Student Photo */}
      {student.image && (
        <img
          src={imgUrl(student.image)}
          alt={student.fullName}
          crossOrigin="anonymous"
          onError={(e) => {
            console.error('Failed to load student image:', student.image);
            console.error('Attempted URL:', e.target.src);
            e.target.style.display = 'none';
          }}
          style={{
            position: 'absolute',
            top: `${155 * scale}px`,
            left: `${110 * scale}px`,
            width: `${180 * scale}px`,
            height: `${220 * scale}px`,
            objectFit: 'cover',
            border: `${3 * scale}px solid #fff`,
            borderRadius: `${8 * scale}px`,
            zIndex: 2,
          }}
        />
      )}

      {/* QR Code (placed below photo — adjust position as needed) */}
      {student.id && (() => {
        try {
          const QRComp = QRCodeCanvas || QRCodeSVG;
          if (!QRComp) {
            console.warn('QRCode component not found in qrcode.react');
            return null;
          }

          return (
            <div
              style={{
                position: 'absolute',
                top: `${450 * scale}px`, // photo top + photo height + gap
                left: `${168 * scale}px`,
                zIndex: 2,
                width: `${80 * scale}px`,
                height: `${80 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
              }}
            >
              <QRComp
                value={buildAttendanceQrPayload("student", student.id)}
                size={Math.round(110 * scale)}
                includeMargin={false}
                bgColor="#ffffff00"
              />
            </div>
          );
        } catch (error) {
          console.error('Error rendering QR code:', error);
          return null;
        }
      })()}

      {/* Student Information */}
      <div
        style={{
          position: 'absolute',
          top: `${193 * scale}px`,
          right: `${190 * scale}px`,
          fontSize: `${24 * scale}px`,
          color: '#1a1a1a',
          lineHeight: 1.8,
          zIndex: 2,
        }}
      >
        <div style={{ marginBottom: `${40 * scale}px` }}>
          <strong>ایډیکارډ نمبر:</strong> {student.id || '—'}
        </div>
        <div style={{ marginBottom: `${40 * scale}px` }}>
          <strong>نوم:</strong> {student.fullName || '—'}
        </div>
        <div style={{ marginBottom: `${40 * scale}px` }}>
          <strong>د پلار نوم:</strong> {student.fatherName || '—'}
        </div>
        <div style={{ marginBottom: `${15 * scale}px` }}>
          <strong>{student.fieldLabel || 'ټولګی:'}</strong> {student.className || '—'}
        </div>
      </div>

      {/* School Name */}
      <div
        style={{
          position: 'absolute',
          top: `${50 * scale}px`,
          left: '55%',
          transform: 'translateX(-50%)',
          fontSize: `${32 * scale}px`,
          fontWeight: 'bold',
          color: '#1E3A5F',
          textAlign: 'center',
          zIndex: 2,
          lineHeight: 1.1,
        }}
      >
        <div>سرتاج حنفي خصوصي ښونځي او وړکتون</div>
        <div style={{ marginTop: `${10 * scale}px`, fontSize: `${26 * scale}px`, fontWeight: 600 }}>
          {title}
        </div>
      </div>
    </div>
  );
});

IdCardGenerator.displayName = 'IdCardGenerator';

export default IdCardGenerator;

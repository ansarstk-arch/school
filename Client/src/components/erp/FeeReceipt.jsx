import { forwardRef } from "react";
import { SCHOOL_INFO } from "@/constants";

/**
 * FeeReceipt Component - POS Style Receipt
 * Designed for small thermal printers (58mm/80mm) — no logo
 */
const FeeReceipt = forwardRef(({ payment }, ref) => {
  if (!payment) return null;

  const remaining = payment.amount - payment.paid;

  return (
    <div
      ref={ref}
      style={{
        width: "80mm",
        padding: "10mm",
        fontFamily: "Amiri, Arial, sans-serif",
        direction: "rtl",
        fontSize: "12pt",
        lineHeight: "1.6",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8mm", borderBottom: "2px solid #000", paddingBottom: "5mm" }}>
        <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: "0 0 2mm 0" }}>
          {SCHOOL_INFO.name}
        </h1>
      </div>

      {/* Receipt Title */}
      <div style={{ textAlign: "center", marginBottom: "5mm" }}>
        <h2 style={{ fontSize: "14pt", fontWeight: "bold", margin: "0" }}>
          د فیس رسید
        </h2>
      </div>

      {/* Receipt Number & Date */}
      <div style={{ marginBottom: "5mm", fontSize: "10pt" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2mm" }}>
          <span><strong>رسید نمبر:</strong></span>
          <span>{payment.receiptNo}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span><strong>نیټه:</strong></span>
          <span>{payment.date}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #000", margin: "5mm 0" }}></div>

      {/* Student Information */}
      <div style={{ marginBottom: "5mm", fontSize: "10pt" }}>
        <div style={{ marginBottom: "2mm" }}>
          <strong>د زده کوونکي نوم:</strong>
          <div style={{ paddingRight: "5mm", marginTop: "1mm" }}>{payment.studentName}</div>
        </div>
        <div style={{ marginBottom: "2mm" }}>
          <strong>د پلار نوم:</strong>
          <div style={{ paddingRight: "5mm", marginTop: "1mm" }}>{payment.fatherName}</div>
        </div>
        <div style={{ marginBottom: "2mm" }}>
          <strong>ټولګی:</strong>
          <div style={{ paddingRight: "5mm", marginTop: "1mm" }}>{payment.className}</div>
        </div>
        <div style={{ marginBottom: "2mm" }}>
          <strong>ډول:</strong>
          <div style={{ paddingRight: "5mm", marginTop: "1mm" }}>
            {payment.enrollmentType === "School" ? "ښوونځی" : 
             payment.enrollmentType === "Center" ? "مرکز" : "مدرسه"}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #000", margin: "5mm 0" }}></div>

      {/* Fee Details */}
      <div style={{ marginBottom: "5mm", fontSize: "11pt" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2mm" }}>
          <span><strong>میاشت:</strong></span>
          <span>{payment.month}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2mm" }}>
          <span><strong>تعلیمي کال:</strong></span>
          <span>{payment.academicYear}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "2px solid #000", margin: "5mm 0" }}></div>

      {/* Payment Summary */}
      <div style={{ fontSize: "12pt", fontWeight: "bold" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3mm" }}>
          <span>ټول فیس:</span>
          <span>{payment.amount} افغانۍ</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3mm", color: "#0a7c42" }}>
          <span>ورکړل شوی:</span>
          <span>{payment.paid} افغانۍ</span>
        </div>
        {remaining > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3mm", color: "#d97706" }}>
            <span>پاتې فیس:</span>
            <span>{remaining.toFixed(2)} افغانۍ</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "2px solid #000", margin: "5mm 0" }}></div>

      {/* Status */}
      <div style={{ textAlign: "center", marginBottom: "5mm" }}>
        <div style={{
          display: "inline-block",
          padding: "2mm 5mm",
          borderRadius: "3mm",
          fontSize: "11pt",
          fontWeight: "bold",
          backgroundColor: payment.status === "Paid" ? "#d1fae5" : 
                          payment.status === "Partial" ? "#fef3c7" : "#fee2e2",
          color: payment.status === "Paid" ? "#065f46" : 
                 payment.status === "Partial" ? "#92400e" : "#991b1b",
        }}>
          {payment.status === "Paid" ? "ورکړل شوی" : 
           payment.status === "Partial" ? "نیمګړی" : "نه ورکړل شوی"}
        </div>
      </div>

      {/* Notes */}
      {payment.notes && (
        <div style={{ marginBottom: "5mm", fontSize: "9pt", color: "#666" }}>
          <strong>یادښت:</strong>
          <div style={{ paddingRight: "5mm", marginTop: "1mm" }}>{payment.notes}</div>
        </div>
      )}

      {/* Collector */}
      {payment.collectedBy && (
        <div style={{ marginBottom: "5mm", fontSize: "9pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span><strong>د راټولونکي نوم:</strong></span>
            <span>{payment.collectedBy}</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #000", margin: "5mm 0" }}></div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "9pt", color: "#666", marginTop: "5mm" }}>
        <p style={{ margin: "0 0 2mm 0" }}>مننه چې تاسو زموږ سره یاست</p>
      </div>

      {/* Contact Info */}
      <div style={{ textAlign: "center", fontSize: "8pt", color: "#999", marginTop: "3mm" }}>
        <p style={{ margin: "0" }}>د اړیکې شمیره: {SCHOOL_INFO.phone}</p>
        <p style={{ margin: "0" }}>پته: {SCHOOL_INFO.address}</p>
      </div>
    </div>
  );
});

FeeReceipt.displayName = "FeeReceipt";

export default FeeReceipt;

import { SCHOOL_INFO } from "@/constants";

const ENROLL_LABEL = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
const STATUS_LABEL = { Paid: "ورکړل شوی", Partial: "نیمګړی", Unpaid: "نه ورکړل شوی" };

/**
 * Print fee receipt on thermal/POS printer (80mm, no logo, Pashto via Amiri).
 * @param {object} payment - Fee payment record from API
 */
export function printFeeReceipt(payment) {
  if (!payment) return;

  const remaining = Number(payment.amount || 0) - Number(payment.paid || 0);
  const enroll =
    ENROLL_LABEL[payment.enrollmentType] || payment.enrollmentType || "—";
  const status = STATUS_LABEL[payment.status] || payment.status || "—";

  const html = `<!DOCTYPE html>
<html lang="ps" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>د فیس رسید</title>
  <style>
    @font-face {
      font-family: 'Amiri';
      src: url('/Amiri-Regular.ttf') format('truetype');
      font-weight: 400;
    }
    @font-face {
      font-family: 'Amiri';
      src: url('/Amiri-Bold.ttf') format('truetype');
      font-weight: 700;
    }
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 72mm;
      font-family: Amiri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      direction: rtl;
      padding: 2mm;
    }
    .center { text-align: center; }
    .row { display: flex; justify-content: space-between; margin: 1mm 0; font-size: 10pt; }
    .label { font-weight: 700; }
    .title { font-size: 13pt; font-weight: 700; margin-bottom: 2mm; }
    .divider { border-top: 1px dashed #000; margin: 3mm 0; }
    .divider-solid { border-top: 2px solid #000; margin: 3mm 0; }
    .amounts { font-size: 11pt; font-weight: 700; }
    .footer { font-size: 8pt; color: #444; text-align: center; margin-top: 3mm; }
    .status {
      text-align: center;
      font-weight: 700;
      padding: 2mm;
      margin: 2mm 0;
    }
  </style>
</head>
<body>
  <div class="center title">${SCHOOL_INFO.name}</div>
  <div class="divider"></div>
  <div class="center title" style="font-size:12pt">د فیس رسید</div>
  <div class="row"><span class="label">رسید نمبر:</span><span>${payment.receiptNo || "—"}</span></div>
  <div class="row"><span class="label">نېټه:</span><span>${payment.date || "—"}</span></div>
  <div class="divider"></div>
  <div class="row"><span class="label">زده کوونکی:</span><span>${payment.studentName || "—"}</span></div>
  <div class="row"><span class="label">د پلار نوم:</span><span>${payment.fatherName || "—"}</span></div>
  <div class="row"><span class="label">ټولګی:</span><span>${payment.className || "—"}</span></div>
  <div class="row"><span class="label">ډول:</span><span>${enroll}</span></div>
  <div class="divider"></div>
  <div class="row"><span class="label">میاشت:</span><span>${payment.month || "—"}</span></div>
  <div class="row"><span class="label">تعلیمي کال:</span><span>${payment.academicYear || "—"}</span></div>
  <div class="divider-solid"></div>
  <div class="amounts">
    <div class="row"><span>ټول فیس:</span><span>${payment.amount} افغانۍ</span></div>
    <div class="row"><span>ترلاسه شوی:</span><span>${Number(payment.paid || 0).toFixed(2)} افغانۍ</span></div>
    <div class="row"><span>پاتې فیس:</span><span>${remaining > 0 ? remaining.toFixed(2) : "0"} افغانۍ</span></div>
  </div>
  <div class="divider-solid"></div>
  <div class="status">حالت: ${status}</div>
  ${payment.notes ? `<div class="row"><span class="label">یادښت:</span><span>${payment.notes}</span></div>` : ""}
  ${payment.collectedBy ? `<div class="row"><span class="label">راټولونکی:</span><span>${payment.collectedBy}</span></div>` : ""}
  <div class="footer">
    <p>مننه چې تاسو زموږ سره یاست</p>
    <p>د اړیکې شمیره: ${SCHOOL_INFO.phone}</p>
    <p>پته: ${SCHOOL_INFO.address}</p>
  </div>
  <script>window.onload = function() { window.focus(); window.print(); }</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=320,height=600");
  if (!w) {
    throw new Error("د چاپ کړکۍ پرانیستل نشول — پاپ اپ بلاک شوی دی");
  }
  w.document.write(html);
  w.document.close();
}

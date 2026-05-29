import { QRCodeSVG } from "qrcode.react";
import { SCHOOL_INFO } from "@/constants";
import { formatShamsi, formatAFN } from "@/lib/afghan-date";
const STATUS_PS = { Paid: "ورکړل شوی", Partial: "نیم", Unpaid: "نه ورکړل شوی" };

export function FeeReceipt({ fee, student }) {
  return (
    <div className="print-page bg-white text-black p-8 max-w-[210mm] mx-auto border">
      <div className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <h1 className="text-2xl font-bold">{SCHOOL_INFO.name}</h1>
          <p className="text-sm">{SCHOOL_INFO.address}</p>
          <p className="text-sm">{SCHOOL_INFO.phone} · {SCHOOL_INFO.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">د فیس رسید</p>
          <p className="text-sm">شمېره: {fee.receiptNo}</p>
          <p className="text-sm">نېټه: {formatShamsi(fee.date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
        <div className="space-y-1">
          <p><b>زده کوونکی:</b> {student.fullName}</p>
          <p><b>د پلار نوم:</b> {student.fatherName}</p>
          <p><b>پېژندنه:</b> {student.idCardNumber}</p>
          <p><b>ټولګی:</b> {student.classId.replace("c-", "")}-{student.section}</p>
        </div>
        <div className="space-y-1">
          <p><b>ډول:</b> {student.type === "School" ? "ښوونځی" : "مرکز"}</p>
          <p><b>میاشت:</b> {fee.month}</p>
          <p><b>حالت:</b> {STATUS_PS[fee.status]}</p>
        </div>
      </div>

      <table className="w-full mt-6 border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-right">تشریح</th>
            <th className="border p-2 text-right">اندازه</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border p-2">میاشتنی فیس — {fee.month}</td><td className="border p-2 text-right">{formatAFN(fee.amount)}</td></tr>
          <tr><td className="border p-2">ورکړل شوی مبلغ</td><td className="border p-2 text-right">{formatAFN(fee.paid)}</td></tr>
          <tr className="font-semibold"><td className="border p-2">پاتې پور</td><td className="border p-2 text-right">{formatAFN(fee.amount - fee.paid)}</td></tr>
        </tbody>
      </table>

      <div className="flex items-end justify-between mt-12">
        <div className="text-center">
          <div className="border-t border-black w-48 pt-1 text-xs">د خزانه دار لاسلیک</div>
        </div>
        <QRCodeSVG value={`RCPT:${fee.receiptNo}`} size={80} />
        <div className="text-center">
          <div className="border-t border-black w-48 pt-1 text-xs">د مجاز چارواکي لاسلیک</div>
        </div>
      </div>
    </div>
  );
}

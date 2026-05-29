import { QRCodeSVG } from "qrcode.react";
import { SCHOOL_INFO } from "@/constants";
import { buildAttendanceQrPayload } from "@/utils/attendanceQr";
import { formatShamsiShort, currentShamsiYear } from "@/lib/afghan-date";
export function IdCard({ student, side = "front" }) {
  if (side === "back") {
    return (
      <div className="w-[340px] h-[210px] bg-white text-black border border-gray-300 rounded-md p-3 flex flex-col text-[10px]">
        <p className="font-bold text-center text-[12px]">{SCHOOL_INFO.name}</p>
        <div className="border-t border-gray-300 my-2" />
        <p><b>پته:</b> {student.address}</p>
        <p><b>بېړنۍ اړیکه:</b> {student.emergencyContact}</p>
        <p><b>د زېږېدنې نېټه:</b> {formatShamsiShort(student.dob)}</p>
        <p><b>د شمولیت نېټه:</b> {formatShamsiShort(student.dateJoined)}</p>
        <p className="mt-auto text-center text-gray-600 italic text-[9px]">که چیرې وموندل شو، مهرباني وکړئ {SCHOOL_INFO.phone} ته راستون کړئ</p>
      </div>
    );
  }
  return (
    <div className="w-[340px] h-[210px] bg-white text-black border border-gray-300 rounded-md p-3 flex gap-3 text-[11px]">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-7 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">AN</div>
          <div>
            <p className="font-bold text-[11px] leading-tight">{SCHOOL_INFO.name}</p>
            <p className="text-[8px] text-gray-500">{SCHOOL_INFO.address}</p>
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-[14px] font-bold leading-tight">{student.fullName}</p>
          <p className="text-[10px] text-gray-600">د {student.fatherName} زوی/لور</p>
          <p><b>پېژندنه:</b> {student.idCardNumber}</p>
          <p><b>ټولګی:</b> {student.classId.replace("c-", "")} · <b>نمبر:</b> {student.rollNumber}</p>
          <p><b>ډول:</b> {student.type === "School" ? "ښوونځی" : "مرکز"}</p>
          <p><b>تعلیمي کال:</b> {currentShamsiYear()}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="size-16 bg-gray-200 rounded text-[8px] text-gray-500 flex items-center justify-center">عکس</div>
        <QRCodeSVG value={buildAttendanceQrPayload("student", student.id)} size={64} />
      </div>
    </div>
  );
}

import { QRCodeSVG } from "qrcode.react";
import { SCHOOL_INFO } from "@/constants";
import { formatShamsi, currentShamsiYear } from "@/lib/afghan-date";

export function AdmissionForm({ student }) {
  const Field = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      <span className="border-b border-gray-400 pb-0.5 text-sm min-h-[20px]">{value || ""}</span>
    </div>
  );
  return (
    <div className="print-page bg-white text-black p-8 max-w-[210mm] mx-auto border">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded bg-slate-900 text-white flex items-center justify-center font-bold">AN</div>
          <div>
            <h1 className="text-xl font-bold">{SCHOOL_INFO.name}</h1>
            <p className="text-xs">{SCHOOL_INFO.address} · {SCHOOL_INFO.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">د شمولیت / ثبت نام فورمه</p>
          <p className="text-xs">تعلیمي کال {currentShamsiYear()}</p>
          <p className="text-xs">نېټه: {formatShamsi(new Date())}</p>
        </div>
      </div>

      <h2 className="font-semibold mt-4 text-sm uppercase tracking-wider text-slate-700">د زده کوونکي معلومات</h2>
      <div className="grid grid-cols-3 gap-4 mt-2">
        <Field label="بشپړ نوم" value={student.fullName} />
        <Field label="د پلار نوم" value={student.fatherName} />
        <Field label="د نیکه نوم" value={student.grandFatherName} />
        <Field label="د زېږېدنې نېټه" value={formatShamsi(student.dob)} />
        <Field label="جنسیت" value={student.gender === "Male" ? "نر" : "ښځینه"} />
        <Field label="د پېژندنې شمېره" value={student.idCardNumber} />
        <Field label="ټولګی" value={student.classId.replace("c-", "")} />
        <Field label="څانګه" value={student.section} />
        <Field label="د حاضرۍ نمبر" value={student.rollNumber} />
        <Field label="ډول" value={student.type === "School" ? "ښوونځی" : "مرکز"} />
        <Field label="د شمولیت نېټه" value={formatShamsi(student.dateJoined)} />
        <Field label="میاشتنی فیس" value={String(student.monthlyFee)} />
      </div>

      <h2 className="font-semibold mt-5 text-sm uppercase tracking-wider text-slate-700">د اړیکې معلومات</h2>
      <div className="grid grid-cols-3 gap-4 mt-2">
        <Field label="ټېلیفون" value={student.phone} />
        <Field label="بېړنۍ اړیکه" value={student.emergencyContact} />
        <Field label="پته" value={student.address} />
      </div>

      <h2 className="font-semibold mt-5 text-sm uppercase tracking-wider text-slate-700">اقرار</h2>
      <p className="text-xs mt-1 leading-relaxed">
        زه دا اعلان کوم چې پورته ورکړل شوي معلومات سم او رښتیني دي. زه د {SCHOOL_INFO.name} د قوانینو او مقرراتو د منلو سره موافق یم.
      </p>

      <div className="flex items-end justify-between mt-16">
        <div className="text-center"><div className="border-t border-black w-44 pt-1 text-xs">د سرپرست لاسلیک</div></div>
        <QRCodeSVG value={`ADM:${student.id}`} size={80} />
        <div className="text-center"><div className="border-t border-black w-44 pt-1 text-xs">د مدیر لاسلیک</div></div>
      </div>
    </div>
  );
}

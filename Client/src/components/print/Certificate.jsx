import { QRCodeSVG } from "qrcode.react";
import { SCHOOL_INFO } from "@/constants";
import { formatShamsi, currentShamsiYear } from "@/lib/afghan-date";
const TYPE_PS = {
  Achievement: "لاسته راوړنې",
  Completion: "بشپړتیا",
  Exam: "ازموینې",
  Appreciation: "قدردانۍ",
};

export function Certificate({ student, type = "Achievement", body }) {
  const defaultBody = `د ${currentShamsiYear()} تعلیمي کال د ${student.classId.replace("c-", "")}-${student.section} ټولګي په جریان کې یې د ${TYPE_PS[type] ?? type} په برخه کې د ستاینې وړ فعالیت ښودلی دی. موږ د هغه/هغې د هڅو، چلند او علمي غوره والي قدرداني کوو.`;
  return (
    <div className="print-page bg-white text-black p-12 max-w-[297mm] mx-auto border-8 border-double border-slate-800">
      <div className="text-center">
        <p className="text-sm tracking-[0.4em] text-slate-600">{SCHOOL_INFO.name}</p>
        <h1 className="text-4xl font-serif font-bold mt-2 tracking-wider">د {TYPE_PS[type] ?? type} سند</h1>
        <p className="text-xs text-slate-500 mt-1">د مدیر د واک لاندې صادر شوی</p>

        <p className="mt-10 text-base">دا تصدیق کیږي چې</p>
        <p className="text-3xl font-serif font-bold mt-2 underline decoration-1 underline-offset-8">{student.fullName}</p>
        <p className="text-sm mt-1">د {student.fatherName} زوی / لور</p>

        <p className="mt-6 max-w-xl mx-auto text-sm leading-relaxed">
          {body ?? defaultBody}
        </p>

        <p className="mt-6 text-xs">د صدور نېټه: {formatShamsi(new Date())}</p>

        <div className="flex items-end justify-between mt-16 px-8">
          <div className="text-center"><div className="border-t border-black w-44 pt-1 text-xs">د ټولګي ښوونکی</div></div>
          <QRCodeSVG value={`CERT:${student.id}:${type}`} size={70} />
          <div className="text-center"><div className="border-t border-black w-44 pt-1 text-xs">مدیر</div></div>
        </div>
      </div>
    </div>
  );
}

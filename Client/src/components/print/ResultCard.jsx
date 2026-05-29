import { QRCodeSVG } from "qrcode.react";
import { SCHOOL_INFO, calcGrade } from "@/constants";
import { formatShamsi } from "@/lib/afghan-date";

export function ResultCard({ student, exam, marks, subjects, position }) {
  const examNameMap = { Midterm: "منځنۍ ازموینه", Final: "وروستۍ ازموینه", Monthly: "میاشتنۍ ازموینه" };

  const rows = exam.subjects.map((es) => {
    const subj = subjects.find((s) => s.id === es.subjectId);
    const m = marks.find((mk) => mk.studentId === student.id && mk.examId === exam.id && mk.subjectId === es.subjectId);
    return { name: subj?.name ?? "—", total: es.total, obtained: m?.obtained ?? 0 };
  });
  const total = rows.reduce((s, r) => s + r.total, 0);
  const obtained = rows.reduce((s, r) => s + r.obtained, 0);
  const pct = total ? Math.round((obtained / total) * 100) : 0;
  const g = calcGrade(pct);
  const passed = pct >= 40;

  return (
    <div className="print-page bg-white text-black p-8 max-w-[210mm] mx-auto border">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded bg-slate-900 text-white flex items-center justify-center font-bold">AN</div>
          <div>
            <h1 className="text-2xl font-bold">{SCHOOL_INFO.name}</h1>
            <p className="text-xs">{SCHOOL_INFO.address} · {SCHOOL_INFO.phone}</p>
          </div>
        </div>
        <QRCodeSVG value={`RES:${student.id}:${exam.id}`} size={70} />
      </div>

      <h2 className="text-center text-lg font-bold mt-3 uppercase tracking-wider">د پایلې کارت — {examNameMap[exam.name] ?? exam.name}</h2>
      <p className="text-center text-xs">تعلیمي کال {exam.session} · د ازموینې نېټه: {formatShamsi(exam.date)}</p>

      <div className="grid grid-cols-3 gap-4 mt-5 text-sm border border-gray-300 p-3 rounded">
        <p><b>نوم:</b> {student.fullName}</p>
        <p><b>د پلار نوم:</b> {student.fatherName}</p>
        <p><b>پېژندنه:</b> {student.idCardNumber}</p>
        <p><b>ټولګی:</b> {student.classId.replace("c-", "")}-{student.section}</p>
        <p><b>نمبر:</b> {student.rollNumber}</p>
        <p><b>ډول:</b> {student.type === "School" ? "ښوونځی" : "مرکز"}</p>
      </div>

      <table className="w-full mt-5 border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-right">#</th>
            <th className="border p-2 text-right">مضمون</th>
            <th className="border p-2 text-right">ټول</th>
            <th className="border p-2 text-right">لاسته راوړل</th>
            <th className="border p-2 text-right">٪</th>
            <th className="border p-2 text-center">درجه</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const sp = r.total ? Math.round((r.obtained / r.total) * 100) : 0;
            return (
              <tr key={i}>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{r.name}</td>
                <td className="border p-2 text-right">{r.total}</td>
                <td className="border p-2 text-right">{r.obtained}</td>
                <td className="border p-2 text-right">{sp}%</td>
                <td className="border p-2 text-center">{calcGrade(sp).grade}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="font-semibold bg-gray-50">
          <tr>
            <td className="border p-2" colSpan={2}>ټول</td>
            <td className="border p-2 text-right">{total}</td>
            <td className="border p-2 text-right">{obtained}</td>
            <td className="border p-2 text-right">{pct}%</td>
            <td className="border p-2 text-center">{g.grade}</td>
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
        <div className="border p-2 rounded"><p className="text-xs text-gray-500">سلنه</p><p className="font-bold">{pct}%</p></div>
        <div className="border p-2 rounded"><p className="text-xs text-gray-500">درجه</p><p className="font-bold">{g.grade}</p></div>
        <div className="border p-2 rounded"><p className="text-xs text-gray-500">GPA</p><p className="font-bold">{g.gpa.toFixed(2)}</p></div>
        <div className="border p-2 rounded"><p className="text-xs text-gray-500">پایله</p><p className={`font-bold ${passed ? "text-green-700" : "text-red-700"}`}>{passed ? "پاس" : "فیل"}</p></div>
      </div>

      {position && <p className="mt-3 text-sm"><b>د ټولګي ځای:</b> {position}</p>}
      <p className="mt-3 text-sm"><b>یادښت:</b> {passed ? "ډېر ښه فعالیت. همداسې دوام ورکړئ!" : "ښه والي ته اړتیا ده. د ټولګي ښوونکي سره مشوره وکړئ."}</p>

      <div className="flex justify-between mt-12 text-sm">
        <div className="text-center"><div className="border-t border-black w-44 pt-1">د ټولګي ښوونکی</div></div>
        <div className="text-center"><div className="border-t border-black w-44 pt-1">ازموینه اخیستونکی</div></div>
        <div className="text-center"><div className="border-t border-black w-44 pt-1">مدیر</div></div>
      </div>
    </div>
  );
}

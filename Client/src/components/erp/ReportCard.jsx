import { forwardRef, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

const ReportCard = forwardRef(({ data, examType, scale = 1 }, ref) => {
  const cardWidth = 794;
  const cardHeight = 1123;
  const { student, class: classInfo, academicYear, subjects, summary, examTitle } = data;
  const isSingleExam = examType === "SingleExam";
  const showBothExams = examType === "Annual";

  const subjectCount = subjects?.length || 0;
  const layout = useMemo(() => {
    const count = Math.max(subjectCount, 1);
    const compact = count > 10;
    return {
      subjectRowPad: compact ? 3 : 5,
      subjectFont: compact ? 8 : 9,
      headerFont: compact ? 9 : 11,
      labelFont: compact ? 14 : 16,
      infoFont: compact ? 13 : 15,
    };
  }, [subjectCount]);

  const getSubjectMarks = (subject) => {
    if (isSingleExam) {
      const m = subject.single;
      return {
        total: m?.obtainedMarks ?? "",
        first: "",
        annual: m?.obtainedMarks ?? "",
      };
    }
    const first = subject.firstTerm?.obtainedMarks ?? "";
    const annual = subject.annual?.obtainedMarks ?? "";
    const total = showBothExams
      ? (Number(subject.firstTerm?.obtainedMarks) || 0) + (Number(subject.annual?.obtainedMarks) || 0)
      : first;
    return { total, first, annual };
  };

  const midColLabel = isSingleExam
    ? (examTitle || "ازموینې")
    : "څلور نیم میاشتنی";
  const lastColLabel = showBothExams ? "کلني ازموینې" : (isSingleExam ? "" : "");

  return (
    <div
      ref={ref}
      style={{
        width: `${cardWidth * scale}px`,
        height: `${cardHeight * scale}px`,
        backgroundColor: 'white',
        fontFamily: 'Amiri, serif',
        direction: 'rtl',
        padding: `${36 * scale}px`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: `${16 * scale}px`,
      }}>
        <img src="/pic2.jpg" alt="" crossOrigin="anonymous" style={{ width: `${90 * scale}px`, height: `${90 * scale}px`, objectFit: 'contain' }} />
        <div style={{ textAlign: 'center', flex: 1, paddingTop: `${8 * scale}px` }}>
          <div style={{ fontSize: `${14 * scale}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` }}>د پوهنې وزارت</div>
          <div style={{ fontSize: `${13 * scale}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` }}>د عمومي تعلیماتو ریاست</div>
          <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` }}>د اساسي او ثانوي تعلیماتو ریاست</div>
          <div style={{ fontSize: `${13 * scale}px`, fontWeight: 'bold' }}>سرتاج حیفي خصوصي ښونځي او وړکتون</div>
        </div>
        <img src="/pic1.jpg" alt="" crossOrigin="anonymous" style={{ width: `${90 * scale}px`, height: `${90 * scale}px`, objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', borderBottom: `${0 * scale}px solid #000` }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1, padding: `${2 * scale}px`, textAlign: 'right', fontSize: `${layout.infoFont * scale}px`, fontWeight: 'bold' }}>
            صنف ( {classInfo.name} {classInfo.section || ''} )
          </div>
          <div style={{ flex: 1, padding: `${2 * scale}px`, textAlign: 'center', fontSize: `${layout.infoFont * scale}px` }}>
            نګران ( {academicYear} )
          </div>
        </div>
        <div style={{ width: `${180 * scale}px`, padding: `${2 * scale}px`, textAlign: 'center', fontSize: `${layout.infoFont * scale}px`, fontWeight: 'bold' }}>
          تعلیمی کال ( {academicYear} )
        </div>
      </div>

      <div style={{ border: `${2 * scale}px solid #000`, backgroundColor: '#fff' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ width: `${100 * scale}px` }}>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.labelFont * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>د اساس نمبر</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.labelFont * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>نوم</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.labelFont * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>پلار نوم</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.labelFont * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>نیکه نوم</div>
            <div style={{ padding: `${6 * scale}px`, fontSize: `${layout.labelFont * scale}px`, textAlign: 'start' }}></div>
          </div>
          <div style={{ width: `${100 * scale}px` }}>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, fontSize: `${layout.infoFont * scale}px`, textAlign: 'center' }}>{student.id || ""}</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, fontSize: `${layout.infoFont * scale}px`, textAlign: 'center' }}>{student.fullName}</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, fontSize: `${layout.infoFont * scale}px`, textAlign: 'center' }}>{student.fatherName}</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, fontSize: `${layout.infoFont * scale}px`, textAlign: 'center' }}>{student.grandFatherName || ""}</div>
          </div>
        </div>

        <div style={{ display: 'flex', borderTop: `${1 * scale}px solid #000` }}>
          <div style={{ flex: 1, borderRight: `${1 * scale}px solid #000` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#4472c4' }}>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.headerFont * scale}px`, fontWeight: 'bold' }}>درجه</th>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.headerFont * scale}px`, fontWeight: 'bold' }}>پایه</th>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${(layout.headerFont - 1) * scale}px`, fontWeight: 'bold' }}>
                    {isSingleExam ? midColLabel : "د څلور نیم میاشتنۍ ازموینې نمرې"}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>الف</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۳۶ څخه تر ۴۰</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>ب</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۳۰ څخه تر ۳۵.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>ج</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۲۴ څخه تر ۲۹.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>د</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۲۰ څخه تر ۲۳.۹۹</td></tr>
              </tbody>
            </table>

            {showBothExams && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#4472c4' }}>
                    <th style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.headerFont * scale}px`, fontWeight: 'bold' }}>درجه</th>
                    <th style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${layout.headerFont * scale}px`, fontWeight: 'bold' }}>پایه</th>
                    <th style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${(layout.headerFont - 1) * scale}px`, fontWeight: 'bold' }}>د څلور نیم میاشتنۍ او د کلني ازموینې نمرې</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>الف</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۹۰ څخه تر ۱۰۰</td></tr>
                  <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>ب</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۷۵ څخه تر ۸۹.۹۹</td></tr>
                  <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>ج</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۶۰ څخه تر ۷۴.۹۹</td></tr>
                  <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>د</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${3 * scale}px`, textAlign: 'center', fontSize: `${(layout.subjectFont + 1) * scale}px` }}>له ۵۰ څخه تر ۵۹.۹۹</td></tr>
                </tbody>
              </table>
            )}

            <div style={{ borderTop: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px` }}>
              <div style={{ fontWeight: 'bold' }}>د ټولګي د ښوونکي لاسلیک</div>
              <div style={{ minHeight: `${30 * scale}px` }}></div>
              <div style={{ fontWeight: 'bold', marginTop: `${4 * scale}px` }}>د ښوونځي د مدیر لاسلیک</div>
              <div style={{ minHeight: `${30 * scale}px` }}></div>
            </div>
          </div>

          <div style={{ width: `${200 * scale}px`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ display: 'flex', borderBottom: `${1 * scale}px solid #000`, backgroundColor: '#e8e8e8' }}>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${20 * scale}px ${2 * scale}px`, fontSize: `${(layout.subjectFont) * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl' }}>مضمون</div>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${20 * scale}px ${2 * scale}px`, fontSize: `${(layout.subjectFont) * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl' }}>درجه</div>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${20 * scale}px ${2 * scale}px`, fontSize: `${(layout.subjectFont) * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl' }}>مجموع</div>
              {!isSingleExam && (
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${20 * scale}px ${2 * scale}px`, fontSize: `${(layout.subjectFont - 1) * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl' }}>{midColLabel}</div>
              )}
              {(showBothExams || isSingleExam) && (
                <div style={{ flex: 1, padding: `${20 * scale}px ${2 * scale}px`, fontSize: `${(layout.subjectFont - 1) * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl' }}>{isSingleExam ? midColLabel : lastColLabel}</div>
              )}
            </div>

            {subjects.map((subject) => {
              const marks = getSubjectMarks(subject);
              return (
                <div key={subject.subjectId} style={{ display: 'flex', borderBottom: `${1 * scale}px solid #000` }}>
                  <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${layout.subjectRowPad * scale}px`, fontSize: `${layout.subjectFont * scale}px`, textAlign: 'center', lineHeight: 1.2 }}>{subject.subjectName}</div>
                  <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${layout.subjectRowPad * scale}px`, fontSize: `${layout.subjectFont * scale}px`, textAlign: 'center' }}>{summary?.grade || ""}</div>
                  <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${layout.subjectRowPad * scale}px`, fontSize: `${layout.subjectFont * scale}px`, textAlign: 'center', fontWeight: 'bold' }}>{marks.total}</div>
                  {!isSingleExam && (
                    <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${layout.subjectRowPad * scale}px`, fontSize: `${layout.subjectFont * scale}px`, textAlign: 'center' }}>{marks.first}</div>
                  )}
                  {(showBothExams || isSingleExam) && (
                    <div style={{ flex: 1, padding: `${layout.subjectRowPad * scale}px`, fontSize: `${layout.subjectFont * scale}px`, textAlign: 'center' }}>{marks.annual}</div>
                  )}
                </div>
              );
            })}

            <div style={{ borderTop: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${9 * scale}px`, textAlign: 'center', fontWeight: 'bold', marginTop: 'auto' }}>
              مجموعه: {summary?.grandObtained ?? ""} / {summary?.grandTotal ?? ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;

import { forwardRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

const imgUrl = (path) => {
  if (!path) return null;
  const trimmed = String(path).trim();
  if (!trimmed) return null;
  if (/^(https?:)?\/\//.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/uploads/')) return `${API_BASE}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${API_BASE}/${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE}${trimmed}`;
  if (trimmed.includes('students/')) return `${API_BASE}/uploads/${trimmed}`;
  return `${API_BASE}/uploads/students/${trimmed}`;
};


const ReportCard = forwardRef(({ data, examType, scale = 1 }, ref) => {
  const cardWidth = 794;
  const cardHeight = 1123;
  const { student, class: classInfo, academicYear, subjects, summary } = data;
  const showBothExams = examType === "Annual";

  return (
    <div
      ref={ref}
      style={{
        width: `${cardWidth * scale}px`,
        height: `${cardHeight * scale}px`,
        backgroundColor: 'white',
        fontFamily: 'Amiri, serif',
        direction: 'rtl',
        padding: `${40 * scale}px`,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* TOP HEADER - Logos and Ministry Text */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: `${20 * scale}px`,
      }}>
        <img src="/pic2.jpg" alt="" crossOrigin="anonymous" style={{ width: `${100 * scale}px`, height: `${100 * scale}px`, objectFit: 'contain' }} />
        {/* Center Text */}
        <div style={{ textAlign: 'center', flex: 1, paddingTop: `${10 * scale}px` }}>
          <div style={{ fontSize: `${14 * scale}px`, fontWeight: 'bold', marginBottom: `${5 * scale}px` }}>د پوهنې وزارت</div>
          <div style={{ fontSize: `${13 * scale}px`, fontWeight: 'bold', marginBottom: `${5 * scale}px` }}>د عمومي تعلیماتو ریاست</div>
          <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${5 * scale}px` }}>د اساسي او ثانوي تعلیماتو ریاست</div>
          <div style={{ fontSize: `${13 * scale}px`, fontWeight: 'bold' }}>سرتاج حیفي خصوصي ښونځي او وړکتون</div>
        </div>

        {/* Right Logo */}
         {/* Left Logo */}
        <img src="/pic1.jpg" alt="" crossOrigin="anonymous" style={{ width: `${100 * scale}px`, height: `${100 * scale}px`, objectFit: 'contain', fontWeight: 'bold' }} />
        
      </div>
       {/* Top Row: Class, Number, Academic Year + Right Side Student Info */}
        <div style={{ display: 'flex', borderBottom: `${0 * scale}px solid #000` }}>
          
          {/* Left Section - Class/Number/Year */}
          <div style={{ flex: 1, display: 'flex', borderRight: `${0 * scale}px solid #000` }}>
            <div style={{ flex: 1, padding: `${2 * scale}px`, borderLeft: `${0 * scale}px solid #000`, textAlign: 'right', fontSize: `${15 * scale}px`, marginBottom: '6px',  fontWeight: 'bold' }}>
              <div>صنف (  {classInfo.name} {classInfo.section || ''}  )</div>
            </div>
            <div style={{ flex: 1, padding: `${2 * scale}px`, textAlign: 'center', fontSize: `${15 * scale}px`, marginBottom: '6px' }}>
              <div>نګران (  {academicYear}  ) </div>
            </div>
          </div>

          {/* Right Section - Student Info Header */}
          <div style={{ width: `${180 * scale}px`, padding: `${2 * scale}px`,  textAlign: 'center', fontSize: `${15 * scale}px`, fontWeight: 'bold' }}>
            تعلیمی کال ( {academicYear} )
          </div>
        </div>

      {/* Main Container with Border */}
      <div style={{ border: `${2 * scale}px solid #000`, backgroundColor: '#fff' }}>
        
        {/* Banner + Student Info Rows */}
        <div style={{ display: 'flex' }}>
          {/* Right Section - Student Info Rows */}
          <div style={{ width: `${100 * scale}px`}}>
            {/* <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.rollNumber || ''}</div> */}
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, backgroundColor: 'white', fontSize: `${16 * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>د اساس نمبر</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, backgroundColor: 'white', fontSize: `${16 * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>نوم</div>
            {/* <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.fullName}</div> */}
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, backgroundColor: 'white', fontSize: `${16 * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>پلار نوم</div>
            {/* <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.fatherName}</div> */}
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, backgroundColor: 'white', fontSize: `${16 * scale}px`, fontWeight: 'bold', textAlign: 'start' }}>نیکه نوم</div>
            {/* <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}></div> */}
            <div style={{ padding: `${8 * scale}px`, fontSize: `${16 * scale}px`, textAlign: 'start' }}></div>
          </div>
{/* INfor */}
          <div style={{ width: `${100 * scale}px`}}>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.id || ""}</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.fullName}</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.fatherName}</div>
            <div style={{ border: `${1 * scale}px solid #000`, padding: `${4 * scale}px`, fontSize: `${15 * scale}px`, textAlign: 'center' }}>{student.grandFatherName || ""}</div>
         </div>
        </div>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', borderTop: `${1 * scale}px solid #000` }}>
          
          {/* Left Section - Grade Tables */}
          <div style={{ flex: 1, borderRight: `${1 * scale}px solid #000` }}>
            
            {/* First Grade Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#4472c4' }}>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000' }}>درجه</th>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000' }}>پایه</th>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, fontWeight: 'bold', color: '#000' }}>د څلور نیم میاشتنۍ ازموینې نمرې</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>الف</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۳۶ څخه تر ۴۰</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ب</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۳۰ څخه تر ۳۵.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ج</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۲۴ څخه تر ۲۹.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>د</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۲۰ څخه تر ۲۳.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ه</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${9 * scale}px` }}>لاتیراوه درجه</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${9 * scale}px` }}>هغه چې د سرو اوسط په ۴۰، ۴۰ خښه تر ۱۹.۹۹ پورې دی او یا لږ تر لږه په یو مضمون کې ۱۰ خښه تر ۱۴.۹۹ خښه تر منځ د لاسلیک لپاره وه مشروطه وي</td></tr>
              </tbody>
            </table>

            {/* Second Grade Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#4472c4' }}>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000' }}>درجه</th>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000' }}>پایه</th>
                  <th style={{ border: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, fontWeight: 'bold', color: '#000' }}>د څلور نیم میاشتنۍ او د کلني ازموینې نمرې</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>الف</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۹۰ څخه تر ۱۰۰</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ب</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>مزیالی</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۷۵ څخه تر ۸۹.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ج</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۶۰ څخه تر ۷۴.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>د</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}></td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>له ۵۰ څخه تر ۵۹.۹۹</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ه</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${9 * scale}px` }}>مشروطه</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${9 * scale}px` }}>هغه چې د سرو اوسط په ۱۰۰، ۱۰۰ خښه تر ۴۹.۹۹ خښه تر منځ وي او یا لږ تر لږه په یو مضمون کې ۲۵ خښه تر ۳۴.۹۹ خښه تر منځ د لاسلیک لپاره وه مشروطه وي</td></tr>
                <tr><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${10 * scale}px` }}>ه</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${9 * scale}px` }}>د ناکامۍ نښه کار</td><td style={{ border: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, textAlign: 'center', fontSize: `${9 * scale}px` }}>هغه چې د سرو اوسط په ۱۰۰، ۱۰۰ خښه تر ۴۹.۹۹ خښه تر منځ وي او یا لږ تر لږه په دوو مضامینو کې ۲۵ خښه تر ۳۴.۹۹ خښه تر منځ د لاسلیک لپاره وه ناکامه وي</td></tr>
              </tbody>
            </table>

            {/* Bottom Section */}
            <div style={{ borderTop: `${1 * scale}px solid #000`, display: 'flex' }}>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${8 * scale}px`, fontSize: `${10 * scale}px` }}>
                <div style={{ fontWeight: 'bold', marginBottom: `${5 * scale}px` }}>لاسلیک هدی</div>
                <div style={{ minHeight: `${40 * scale}px` }}></div>
              </div>
              <div style={{ flex: 1, padding: `${8 * scale}px`, fontSize: `${10 * scale}px` }}>
                <div style={{ fontWeight: 'bold', marginBottom: `${5 * scale}px` }}>څلورنیم میاشتنی</div>
                <div style={{ minHeight: `${40 * scale}px` }}></div>
              </div>
              <div style={{ flex: 1, borderRight: `${1 * scale}px solid #000`, padding: `${8 * scale}px`, fontSize: `${10 * scale}px` }}>
                <div style={{ fontWeight: 'bold', marginBottom: `${5 * scale}px` }}>کلني ازموینې</div>
                <div style={{ minHeight: `${40 * scale}px` }}></div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ borderTop: `${1 * scale}px solid #000` }}>
              <div style={{ padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, borderBottom: `${1 * scale}px solid #000` }}>د ټولګي د ښوونکي لاسلیک</div>
              <div style={{ padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, borderBottom: `${1 * scale}px solid #000` }}>د ټولګي مرستیال لاسلیک</div>
              <div style={{ padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, borderBottom: `${1 * scale}px solid #000` }}>د ټولګي مدیر لاسلیک</div>
              <div style={{ padding: `${6 * scale}px`, fontSize: `${10 * scale}px` }}>د ښوونځي د مدیر لاسلیک</div>
            </div>
          </div>

          {/* Right Section - Marks Table with Vertical Headers */}
          <div style={{ width: `${180 * scale}px`, display: 'flex', flexDirection: 'column' }}>
            
            {/* Vertical Headers Row */}
            <div style={{ display: 'flex', borderBottom: `${1 * scale}px solid #000`, backgroundColor: '#e8e8e8' }}>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${30 * scale}px ${4 * scale}px`, fontSize: `${9 * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>درجه</div>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${30 * scale}px ${4 * scale}px`, fontSize: `${9 * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>مجموع</div>
              <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${30 * scale}px ${4 * scale}px`, fontSize: `${8 * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>څلور نیم میاشتنی</div>
              <div style={{ flex: 1, padding: `${30 * scale}px ${4 * scale}px`, fontSize: `${9 * scale}px`, fontWeight: 'bold', textAlign: 'center', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>کلني ازموینې</div>
            </div>

            {/* Subject Rows - Dynamic from Backend */}
            {subjects.map((subject, idx) => (
              <div key={subject.subjectId} style={{ display: 'flex', borderBottom: `${1 * scale}px solid #000` }}>
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, fontSize: `${9 * scale}px`, textAlign: 'center' }}>{summary.grade}</div>
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, fontSize: `${9 * scale}px`, textAlign: 'center', fontWeight: 'bold' }}>
                  {showBothExams ? (subject.firstTerm?.obtainedMarks || 0) + (subject.annual?.obtainedMarks || 0) : subject.firstTerm?.obtainedMarks || 0}
                </div>
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, fontSize: `${9 * scale}px`, textAlign: 'center' }}>
                  {subject.firstTerm?.obtainedMarks || ''}
                </div>
                <div style={{ flex: 1, padding: `${5 * scale}px`, fontSize: `${9 * scale}px`, textAlign: 'center' }}>
                  {showBothExams ? subject.annual?.obtainedMarks || '' : ''}
                </div>
              </div>
            ))}

            {/* Empty rows to match image */}
            {[...Array(Math.max(0, 8 - subjects.length))].map((_, i) => (
              <div key={`empty-${i}`} style={{ display: 'flex', borderBottom: `${1 * scale}px solid #000` }}>
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, fontSize: `${9 * scale}px` }}></div>
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, fontSize: `${9 * scale}px` }}></div>
                <div style={{ flex: 1, borderLeft: `${1 * scale}px solid #000`, padding: `${5 * scale}px`, fontSize: `${9 * scale}px` }}></div>
                <div style={{ flex: 1, padding: `${5 * scale}px`, fontSize: `${9 * scale}px` }}></div>
              </div>
            ))}

            {/* Vertical Label on Right */}
            <div style={{ 
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              backgroundColor: '#e8e8e8',
              padding: `${40 * scale}px ${6 * scale}px`,
              fontSize: `${11 * scale}px`,
              fontWeight: 'bold',
              borderLeft: `${1 * scale}px solid #000`,
              borderTop: `${1 * scale}px solid #000`,
              borderBottom: `${1 * scale}px solid #000`,
            }}>
              د مضامینو نمرې
            </div>

            {/* Bottom Labels */}
            <div style={{ borderTop: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, textAlign: 'center', fontWeight: 'bold' }}>تعلیمي کال</div>
            <div style={{ borderTop: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, textAlign: 'center' }}>غیر حاضر</div>
            <div style={{ borderTop: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, textAlign: 'center' }}>مریض</div>
            <div style={{ borderTop: `${1 * scale}px solid #000`, padding: `${6 * scale}px`, fontSize: `${10 * scale}px`, textAlign: 'center' }}>رخصت</div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;

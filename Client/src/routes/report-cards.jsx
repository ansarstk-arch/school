import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";
import { getAllClasses } from "@/data/classApi";
import * as studentApi from "@/data/studentApi";
import { getStudentReportCard, getClassReportCards } from "@/data/reportCardApi";
import { generateSingleReportCardPDF, generateMultipleReportCardsPDF } from "@/utils/reportCardPdf";
import { currentShamsiYear } from "@/lib/afghan-date";

export default function ReportCardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [examType, setExamType] = useState("FirstTerm");
  const [academicYear, setAcademicYear] = useState(currentShamsiYear());
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [singleLoadingId, setSingleLoadingId] = useState(null);

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    } else {
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await getAllClasses({ 
        type: "School",
        academicYear,
        limit: 1000 
      });
      setClasses(response.data?.classes || []);
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("د ټولګیو په لوډولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    try {
      setLoading(true);
      const response = await studentApi.getAllStudents({ 
        classId,
        limit: 1000 
      });
      setStudents(response.data?.students || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("د زده کوونکو په لوډولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Handle single student report card download
  const handleDownloadSingle = async (studentId) => {
    if (!selectedClassId || !academicYear) {
      toast.error("لومړی ټولګی او تعلیمي کال غوره کړئ");
      return;
    }

    try {
      setSingleLoadingId(studentId);
      
      // Fetch report card data
      const response = await getStudentReportCard(studentId, examType, academicYear);
      
      if (!response.success) {
        throw new Error(response.message || "د اطلاع نامې په ترلاسه کولو کې تېروتنه");
      }

      // Generate PDF
      await generateSingleReportCardPDF(response.data, examType, response.data.student.fullName);
      
      toast.success("اطلاع نامه بریالیتوب سره ډاونلوډ شوه");
    } catch (error) {
      console.error("Error downloading report card:", error);
      toast.error(error.message || "د اطلاع نامې په ډاونلوډ کې تېروتنه");
    } finally {
      setSingleLoadingId(null);
    }
  };

  // Handle download selected
  const handleDownloadSelected = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("لږ تر لږه یوه اطلاع نامه غوره کړئ");
      return;
    }

    if (!selectedClassId || !academicYear) {
      toast.error("لومړی ټولګی او تعلیمي کال غوره کړئ");
      return;
    }

    try {
      setPdfLoading(true);

      // Fetch report cards for selected students
      const reportCardsPromises = selectedStudentIds.map(studentId =>
        getStudentReportCard(studentId, examType, academicYear)
      );

      const responses = await Promise.all(reportCardsPromises);
      const reportCards = responses
        .filter(r => r.success)
        .map(r => r.data);

      if (reportCards.length === 0) {
        throw new Error("هیڅ اطلاع نامه ونه موندل شوه");
      }

      // Generate PDF
      const selectedClass = classes.find(c => c.id === Number(selectedClassId));
      const className = selectedClass ? `${selectedClass.name}_${selectedClass.section || ''}` : 'class';
      
      await generateMultipleReportCardsPDF(reportCards, examType, className);
      
      toast.success(`${reportCards.length} اطلاع نامې بریالیتوب سره ډاونلوډ شوې`);
    } catch (error) {
      console.error("Error downloading selected report cards:", error);
      toast.error(error.message || "د اطلاع نامو په ډاونلوډ کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle download all
  const handleDownloadAll = async () => {
    if (!selectedClassId || !academicYear) {
      toast.error("لومړی ټولګی او تعلیمي کال غوره کړئ");
      return;
    }

    if (students.length === 0) {
      toast.error("په دې ټولګي کې زده کوونکي نشته");
      return;
    }

    try {
      setPdfLoading(true);

      // Fetch all report cards for the class
      const response = await getClassReportCards(selectedClassId, examType, academicYear);

      if (!response.success || !response.data?.reportCards) {
        throw new Error(response.message || "د اطلاع نامو په ترلاسه کولو کې تېروتنه");
      }

      const reportCards = response.data.reportCards.map(rc => ({
        student: rc.student,
        class: response.data.class,
        academicYear: response.data.academicYear,
        subjects: rc.subjects,
        summary: rc.summary,
      }));

      if (reportCards.length === 0) {
        throw new Error("هیڅ اطلاع نامه ونه موندل شوه");
      }

      // Generate PDF
      const selectedClass = classes.find(c => c.id === Number(selectedClassId));
      const className = selectedClass ? `${selectedClass.name}_${selectedClass.section || ''}` : 'class';
      
      await generateMultipleReportCardsPDF(reportCards, examType, className);
      
      toast.success(`${reportCards.length} اطلاع نامې بریالیتوب سره ډاونلوډ شوې`);
    } catch (error) {
      console.error("Error downloading all report cards:", error);
      toast.error(error.message || "د اطلاع نامو په ډاونلوډ کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  // Handle individual checkbox
  const handleCheckboxChange = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">اطلاع نامې</h1>
        <p className="text-gray-600">د زده کوونکو اطلاع نامې ډاونلوډ کړئ</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تعلیمي کال
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="۱۴۰۳"
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ټولګی
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ټولګی غوره کړئ</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              د امتحان ډول
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FirstTerm">څلور میاشتنی امتحان</option>
              <option value="Annual">کلنی امتحان</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleDownloadSelected}
              disabled={selectedStudentIds.length === 0 || pdfLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              غوره شوې ({selectedStudentIds.length})
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={!selectedClassId || students.length === 0 || pdfLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              ټولې ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      {selectedClassId && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              زده کوونکي ({students.length})
            </h2>
            {students.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.length === students.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">ټول غوره کړئ</span>
              </label>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-600">لوډ کیږي...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>په دې ټولګي کې زده کوونکي نشته</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleCheckboxChange(student.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        د پلار نوم: {student.fatherName} | د ثبت نمبر: {student.rollNumber || '—'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(student.id)}
                    disabled={singleLoadingId === student.id}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {singleLoadingId === student.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    ډاونلوډ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedClassId && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">لومړی ټولګی غوره کړئ</p>
        </div>
      )}
    </div>
  );
}

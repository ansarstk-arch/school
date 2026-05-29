import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { useState, useEffect } from "react";
import { ClipboardList, Save } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear } from "@/lib/afghan-date";
import { useStore } from "@/store/useStore";
import * as marksApi from "@/data/marksApi";
import { getAllClasses } from "@/data/classApi";
import { computeMarkStatus } from "@/utils/marksShared";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const F = ({ label, children, error }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

const STATUSES = [
  { value: "Pass", label: "بریالی", color: "text-green-600" },
  { value: "Fail", label: "ناکام", color: "text-red-600" },
  { value: "Absent", label: "غیرحاضر", color: "text-gray-500" },
];

export default function MarksEntryPage() {
  const session = useStore((s) => s.session);
  
  // Selection state
  const [academicYear, setAcademicYear] = useState(session || String(currentShamsiYear()));
  const [selectedType, setSelectedType] = useState("School");
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  
  // Loading states
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [config, setConfig] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch exams when year or type changes
  useEffect(() => {
    if (academicYear && selectedType) {
      fetchExams();
    }
  }, [academicYear, selectedType]);

  // Fetch classes when exam and type change
  useEffect(() => {
    if (selectedExam && selectedType) {
      fetchClasses();
    }
  }, [selectedExam, selectedType]);

  // Fetch subjects when class changes
  useEffect(() => {
    if (selectedExam && selectedClass && selectedType) {
      fetchSubjects();
    }
  }, [selectedExam, selectedClass, selectedType]);

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const res = await marksApi.getExamsByYear(academicYear, selectedType);
      setExams(res.data?.exams || []);
      setSelectedExam("");
      setSelectedClass("");
      setSelectedSubject("");
    } catch (error) {
      toast.error(error.message || "د امتحانونو په ترلاسه کولو کې ستونزه");
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await getAllClasses({
        type: selectedType,
        academicYear: academicYear,
        limit: 200,
      });
      setClasses(res.data?.classes || []);
      setSelectedClass("");
      setSelectedSubject("");
    } catch (error) {
      toast.error(error.message || "د ټولګیو په ترلاسه کولو کې ستونزه");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await marksApi.getSubjectsForExamClass(
        selectedExam,
        selectedClass,
        selectedType
      );
      
      // Filter only subjects that have config (total marks set)
      const subjectsWithConfig = (res.data?.subjects || []).filter(s => s.config);
      setSubjects(subjectsWithConfig);
      setSelectedSubject("");
    } catch (error) {
      toast.error(error.message || "د مضامینو په ترلاسه کولو کې ستونزه");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleShowStudents = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject || !selectedType) {
      toast.error("ټول فیلډونه غوره کړئ");
      return;
    }

    try {
      setLoadingStudents(true);
      
      const res = await marksApi.getMarksEntrySheet({
        examId: selectedExam,
        classId: selectedClass,
        subjectId: selectedSubject,
        institutionType: selectedType,
      });

      if (res.success) {
        const sheetConfig = res.data.config;
        const passingMarks = Number(sheetConfig?.passingMarks);
        setConfig(sheetConfig);
        setStudents(
          (res.data.students || []).map((st) => {
            const obtained = st.obtainedMarks ?? "";
            const status =
              st.status === "Absent"
                ? "Absent"
                : obtained !== "" && obtained !== null
                  ? computeMarkStatus(obtained, passingMarks, st.status)
                  : "Pass";
            return {
              studentId: st.studentId,
              markId: st.markId,
              fullName: st.fullName,
              fatherName: st.fatherName,
              rollNumber: st.rollNumber,
              totalMarks: st.totalMarks,
              obtainedMarks: obtained,
              status,
              remarks: st.remarks || "",
            };
          })
        );
        setModalOpen(true);
      }
    } catch (error) {
      toast.error(error.message || "د زده کوونکو په ترلاسه کولو کې ستونزه");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleMarksChange = (studentId, field, value) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.studentId !== studentId) return st;
        
        const updated = { ...st, [field]: value };
        
        const passingMarks = Number(config?.passingMarks);

        // Auto-calculate status when marks change
        if (field === "obtainedMarks" && updated.status !== "Absent" && Number.isFinite(passingMarks)) {
          const marks = Number(value);
          if (!isNaN(marks) && marks >= 0) {
            updated.status = computeMarkStatus(marks, passingMarks, updated.status);
          }
        }
        
        // Clear marks when status is Absent
        if (field === "status" && value === "Absent") {
          updated.obtainedMarks = "";
        }
        
        // Recalculate status when changing from Absent
        if (field === "status" && value !== "Absent" && updated.obtainedMarks !== "" && Number.isFinite(passingMarks)) {
          const marks = Number(updated.obtainedMarks);
          if (!isNaN(marks) && marks >= 0) {
            updated.status = computeMarkStatus(marks, passingMarks, value);
          }
        }
        
        return updated;
      })
    );
    
    // Clear error for this student
    if (errors[studentId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[studentId];
        return newErrors;
      });
    }
  };

  const validateMarks = () => {
    const newErrors = {};
    
    students.forEach((st) => {
      if (st.status === "Absent") return; // Skip validation for absent students
      
      if (st.obtainedMarks === "") {
        newErrors[st.studentId] = "نمرې اړینې دي";
        return;
      }
      
      const marks = Number(st.obtainedMarks);
      
      if (isNaN(marks)) {
        newErrors[st.studentId] = "نمرې باید عدد وي";
      } else if (marks < 0) {
        newErrors[st.studentId] = "نمرې باید مثبت وي";
      } else if (marks > st.totalMarks) {
        newErrors[st.studentId] = `نمرې د ${st.totalMarks} څخه زیاتې نشي`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateMarks()) {
      toast.error("مهرباني وکړئ ټولې نمرې سم ولیکئ");
      return;
    }

    const toSave = students.filter((st) => st.status === "Absent" || st.obtainedMarks !== "");
    
    if (toSave.length === 0) {
      toast.error("لږ تر لږه د یو زده کوونکي نمرې ولیکئ");
      return;
    }

    try {
      setSaving(true);
      
      const res = await marksApi.bulkSaveMarks({
        examId: Number(selectedExam),
        classId: Number(selectedClass),
        subjectId: Number(selectedSubject),
        institutionType: selectedType,
        marks: toSave.map((st) => ({
          studentId: st.studentId,
          markId: st.markId,
          obtainedMarks: st.status === "Absent" ? null : Number(st.obtainedMarks),
          status: st.status,
          remarks: st.remarks,
        })),
      });

      if (res.success) {
        toast.success(res.message || "نمرې بریالیتوب سره ثبت شوې");
        setModalOpen(false);
        // Reset selections
        setSelectedSubject("");
      }
    } catch (error) {
      toast.error(error.message || "د نمرو په ثبتولو کې ستونزه");
    } finally {
      setSaving(false);
    }
  };

  const selectedExamData = exams.find((e) => e.id === Number(selectedExam));
  const selectedClassData = classes.find((c) => c.id === Number(selectedClass));
  const selectedSubjectData = subjects.find((s) => s.subjectId === Number(selectedSubject));

  return (
    <div className="space-y-4">
      <PageHeader
        title="د نمرو داخلول"
        subtitle="د زده کوونکو نمرې داخل کړئ"
        actions={
          <Badge variant="info">
            <ClipboardList className="size-3 inline ml-1" />
            نمرې
          </Badge>
        }
      />

      {/* Selection Form */}
      <div className="bg-card border border-border rounded-md p-4 space-y-4">
        <p className="text-sm font-medium">د نمرو داخلولو لپاره معلومات وټاکئ</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Academic Year */}
          <F label="تعلیمي کال">
            <ShamsiYearPicker
              value={academicYear}
              onChange={setAcademicYear}
            />
          </F>

          {/* Institution Type - MOVED BEFORE EXAM */}
          <F label="د ادارې ډول">
            <select
              className={SEL}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </F>

          {/* Exam */}
          <F label="امتحان">
            <select
              className={SEL}
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={loadingExams}
            >
              <option value="">
                {loadingExams ? "لوډېږي..." : "امتحان غوره کړئ"}
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.examTitle}
                </option>
              ))}
            </select>
          </F>

          {/* Class */}
          <F label="ټولګی">
            <select
              className={SEL}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={!selectedExam || loadingClasses}
            >
              <option value="">
                {loadingClasses ? "لوډېږي..." : "ټولګی غوره کړئ"}
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `(${cls.section})`}
                </option>
              ))}
            </select>
          </F>

          {/* Subject */}
          <F label="مضمون">
            <select
              className={SEL}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass || loadingSubjects}
            >
              <option value="">
                {loadingSubjects ? "لوډېږي..." : "مضمون غوره کړئ"}
              </option>
              {subjects.map((subj) => (
                <option key={subj.subjectId} value={subj.subjectId}>
                  {subj.subjectName} (ټولټال: {subj.config?.totalMarks})
                </option>
              ))}
            </select>
          </F>

          {/* Show Students Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleShowStudents}
              disabled={!selectedSubject}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              زده کوونکي ښکاره کړئ
            </button>
          </div>
        </div>

        {/* Info Display */}
        {selectedExamData && selectedClassData && selectedSubjectData && (
          <div className="bg-muted/30 rounded p-3 text-xs space-y-1">
            <p>
              <span className="text-muted-foreground">امتحان:</span>{" "}
              <span className="font-medium">{selectedExamData.examTitle}</span>
            </p>
            <p>
              <span className="text-muted-foreground">ټولګی:</span>{" "}
              <span className="font-medium">
                {selectedClassData.name} {selectedClassData.section && `(${selectedClassData.section})`}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">مضمون:</span>{" "}
              <span className="font-medium">{selectedSubjectData.subjectName}</span>
            </p>
            {selectedSubjectData.config && (
              <p>
                <span className="text-muted-foreground">ټولټال نمرې:</span>{" "}
                <span className="font-medium">{selectedSubjectData.config.totalMarks}</span>
                {" | "}
                <span className="text-muted-foreground">د بریالیتوب نمرې:</span>{" "}
                <span className="font-medium">{selectedSubjectData.config.passingMarks}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Students Modal */}
      <ErpModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={`د نمرو داخلول - ${selectedExamData?.examTitle || ""} - ${selectedSubjectData?.subjectName || ""}`}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
              disabled={saving}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingStudents}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium disabled:opacity-50"
            >
              <Save className="size-3.5" />
              {saving ? "ثبتیږي..." : "ټول خوندي کړئ"}
            </button>
          </>
        }
      >
        {loadingStudents ? (
          <div className="text-center py-8 text-muted-foreground">
            د زده کوونکو په ترلاسه کولو کې...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            د دې ټولګي لپاره زده کوونکي ونه موندل شول
          </div>
        ) : (
          <div className="space-y-3">
            {/* Config Info */}
            {config && (
              <div className="bg-muted/30 rounded p-3 text-xs flex items-center justify-between">
                <span>
                  <span className="text-muted-foreground">ټولټال:</span>{" "}
                  <span className="font-medium">{config.totalMarks}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">بریالیتوب:</span>{" "}
                  <span className="font-medium">{config.passingMarks}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">زده کوونکي:</span>{" "}
                  <span className="font-medium">{students.length}</span>
                </span>
              </div>
            )}

            {/* Students Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">رول</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">نوم</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">د پلار نوم</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">ټولټال</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">ترلاسه شوې</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">حالت</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs whitespace-nowrap">یادښت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {students.map((student) => (
                      <tr
                        key={student.studentId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Roll Number */}
                        <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap">
                          {student.rollNumber}
                        </td>

                        {/* Full Name */}
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                          {student.fullName}
                        </td>

                        {/* Father Name */}
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {student.fatherName}
                        </td>

                        {/* Total Marks */}
                        <td className="px-3 py-2.5 text-xs font-medium text-center">
                          {student.totalMarks}
                        </td>

                        {/* Obtained Marks Input */}
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={student.obtainedMarks}
                            onChange={(e) =>
                              handleMarksChange(
                                student.studentId,
                                "obtainedMarks",
                                e.target.value
                              )
                            }
                            disabled={student.status === "Absent"}
                            className={`w-20 px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                              errors[student.studentId]
                                ? "border-destructive bg-destructive/5"
                                : "border-input"
                            } ${
                              student.status === "Absent"
                                ? "bg-muted cursor-not-allowed text-muted-foreground"
                                : "bg-background"
                            }`}
                            placeholder="نمرې"
                            min="0"
                            max={student.totalMarks}
                          />
                          {errors[student.studentId] && (
                            <p className="text-[10px] text-destructive mt-0.5">
                              {errors[student.studentId]}
                            </p>
                          )}
                        </td>

                        {/* Status Select */}
                        <td className="px-3 py-2.5">
                          <select
                            value={student.status}
                            onChange={(e) =>
                              handleMarksChange(
                                student.studentId,
                                "status",
                                e.target.value
                              )
                            }
                            className={`w-28 px-2 py-1.5 text-xs border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium ${
                              STATUSES.find((s) => s.value === student.status)
                                ?.color || ""
                            }`}
                          >
                            {STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Remarks Input */}
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={student.remarks}
                            onChange={(e) =>
                              handleMarksChange(
                                student.studentId,
                                "remarks",
                                e.target.value
                              )
                            }
                            className="w-36 px-2 py-1.5 text-xs border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="یادښت"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </ErpModal>
    </div>
  );
}

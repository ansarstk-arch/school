import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { Search, ArrowRight, User, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as promotionApi from "@/data/promotionApi";
import * as studentApi from "@/data/studentApi";
import { getAllClasses } from "@/data/classApi";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function IndividualPromotionPage() {
  const session = useStore((s) => s.session);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const [toClassId, setToClassId] = useState("");
  const [toAcademicYear, setToAcademicYear] = useState(String(Number(session || currentShamsiYear()) + 1));
  const [promotionStatus, setPromotionStatus] = useState("Promoted");
  const [remarks, setRemarks] = useState("");

  const [availableClasses, setAvailableClasses] = useState([]);
  const [nextClassInfo, setNextClassInfo] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);

  // Search students
  const handleSearch = async () => {
    if (!search.trim()) {
      toast.error("د لټون لپاره نوم یا رول نمبر ولیکئ");
      return;
    }

    setLoading(true);
    try {
      const res = await studentApi.getAllStudents({
        search: search.trim(),
        limit: 10,
      });
      setStudents(res.data.students || []);
      if (res.data.students.length === 0) {
        toast.info("هیڅ زده کوونکی ونه موندل شو");
      }
    } catch (error) {
      toast.error(error.message || "د لټون کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  // Select student
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearch("");
    setToClassId("");
    setNextClassInfo(null);
    setEligibility(null);

    // Get next class
    try {
      const nextRes = await promotionApi.getNextClassForStudent(student.id, toAcademicYear);
      if (nextRes.success) {
        setNextClassInfo(nextRes.data.nextClass);
        if (nextRes.data.nextClass.nextClass) {
          setToClassId(String(nextRes.data.nextClass.nextClass.id));
        }
      }
    } catch (error) {
      console.error("Error getting next class:", error);
    }

    // Get available classes
    if (student.classId) {
      try {
        const [currentClass] = await getAllClasses({ id: student.classId });
        if (currentClass) {
          const classesRes = await getAllClasses({
            type: currentClass.data.classes[0].type,
            academicYear: toAcademicYear,
            limit: 100,
          });
          setAvailableClasses(classesRes.data.classes || []);
        }
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    }

    // Get eligibility
    try {
      const eligRes = await promotionApi.getEligibleStudents({
        classId: student.classId,
        academicYear: student.academicYear,
      });
      if (eligRes.success) {
        const studentElig = eligRes.data.students.find((s) => s.id === student.id);
        setEligibility(studentElig);
      }
    } catch (error) {
      console.error("Error getting eligibility:", error);
    }
  };

  // Preview promotion
  const handlePreview = () => {
    if (!selectedStudent) {
      toast.error("زده کوونکی وټاکئ");
      return;
    }
    if (!toClassId) {
      toast.error("نوی ټولګی وټاکئ");
      return;
    }
    setPreviewOpen(true);
  };

  // Execute promotion
  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await promotionApi.promoteIndividualStudent({
        studentId: selectedStudent.id,
        toClassId: Number(toClassId),
        toAcademicYear,
        promotionStatus,
        remarks,
      });

      if (res.success) {
        toast.success(res.message || "زده کوونکی بریالیتوب سره ترفیع شو");
        setPreviewOpen(false);
        // Reset form
        setSelectedStudent(null);
        setToClassId("");
        setRemarks("");
        setEligibility(null);
        setNextClassInfo(null);
      }
    } catch (error) {
      toast.error(error.message || "د ترفیع کې ستونزه");
    } finally {
      setPromoting(false);
    }
  };

  const selectedClass = availableClasses.find((c) => c.id === Number(toClassId));

  return (
    <div className="space-y-4">
      <PageHeader
        title="انفرادي ترفیع"
        subtitle="د یو زده کوونکي ترفیع"
      />

      {/* Search Section */}
      <div className="bg-card border border-border rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">۱ — زده کوونکی ولټوئ</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              className={SEL}
              placeholder="نوم یا رول نمبر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Search className="size-4 inline ml-1" />
            {loading ? "لټول..." : "لټون"}
          </button>
        </div>

        {/* Search Results */}
        {students.length > 0 && (
          <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => handleSelectStudent(student)}
                className="w-full p-3 text-right hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      رول: {student.rollNumber} | پلار: {student.fatherName}
                    </p>
                  </div>
                  <Badge variant="muted">{student.className}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Student */}
      {selectedStudent && (
        <>
          <div className="bg-card border border-border rounded-md p-4 space-y-4">
            <p className="text-sm font-medium">۲ — د زده کوونکي معلومات</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  <User className="size-3 inline ml-1" />
                  نوم
                </p>
                <p className="text-sm font-medium">{selectedStudent.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  <BookOpen className="size-3 inline ml-1" />
                  اوسنی ټولګی
                </p>
                <p className="text-sm font-medium">{selectedStudent.className}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  <Calendar className="size-3 inline ml-1" />
                  تعلیمي کال
                </p>
                <p className="text-sm font-medium">{selectedStudent.academicYear}</p>
              </div>
            </div>

            {/* Eligibility */}
            {eligibility && (
              <div className="p-3 border rounded bg-background">
                <p className="text-xs font-medium mb-2">د ترفیع وړتیا:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">نمرې</p>
                    <p className="text-sm font-medium">
                      {eligibility.percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">حاضري</p>
                    <p className="text-sm font-medium">
                      {eligibility.attendancePercentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">حالت</p>
                    <Badge variant={eligibility.eligible ? "success" : "destructive"}>
                      {eligibility.eligible ? "وړ" : "نا وړ"}
                    </Badge>
                  </div>
                </div>
                {!eligibility.eligible && (
                  <p className="text-xs text-muted-foreground mt-2">{eligibility.reason}</p>
                )}
              </div>
            )}
          </div>

          {/* Promotion Form */}
          <div className="bg-card border border-border rounded-md p-4 space-y-3">
            <p className="text-sm font-medium">۳ — د ترفیع معلومات</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                نوی تعلیمي کال
                <input
                  type="text"
                  className={SEL}
                  value={toAcademicYear}
                  onChange={(e) => setToAcademicYear(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                نوی ټولګی
                <select
                  className={SEL}
                  value={toClassId}
                  onChange={(e) => setToClassId(e.target.value)}
                >
                  <option value="">ټولګی وټاکئ</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section && `(${cls.section})`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                د ترفیع حالت
                <select
                  className={SEL}
                  value={promotionStatus}
                  onChange={(e) => setPromotionStatus(e.target.value)}
                >
                  <option value="Promoted">ترفیع شوی</option>
                  <option value="Repeated">تکرار</option>
                  <option value="Detained">بند</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              یادښت
              <textarea
                className={SEL}
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="اختیاري..."
              />
            </label>

            {nextClassInfo?.graduated && (
              <div className="p-3 bg-success/10 border border-success/20 rounded text-sm">
                🎓 دا زده کوونکی به فارغ شي
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!toClassId}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                مخکتنه او تایید
                <ArrowRight className="size-4 inline mr-1" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      <ErpModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="د ترفیع مخکتنه"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
              disabled={promoting}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoting}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium"
            >
              {promoting ? "ترفیع کیږي..." : "تایید او ترفیع"}
            </button>
          </>
        }
      >
        {selectedStudent && selectedClass && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded space-y-2">
              <p className="text-sm font-medium">زده کوونکی:</p>
              <p className="text-sm">{selectedStudent.fullName}</p>
              <p className="text-xs text-muted-foreground">
                رول: {selectedStudent.rollNumber}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">له</p>
                <Badge variant="muted" className="text-sm">
                  {selectedStudent.className}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedStudent.academicYear}
                </p>
              </div>

              <ArrowRight className="size-6 text-primary" />

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">ته</p>
                <Badge variant="info" className="text-sm">
                  {selectedClass.name}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {toAcademicYear}
                </p>
              </div>
            </div>

            <div className="p-3 border rounded space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">حالت:</span>
                <Badge variant={promotionStatus === "Promoted" ? "success" : "warning"}>
                  {promotionStatus === "Promoted" ? "ترفیع شوی" : promotionStatus === "Repeated" ? "تکرار" : "بند"}
                </Badge>
              </div>
              {remarks && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">یادښت:</span>
                  <span>{remarks}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded text-xs">
              ⚠️ د تایید وروسته، د زده کوونکي ټولګی او تعلیمي کال به تازه شي.
            </div>
          </div>
        )}
      </ErpModal>
    </div>
  );
}

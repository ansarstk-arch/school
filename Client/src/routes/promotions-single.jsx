import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { Input } from "@/components/ui/Input";
import { User, ArrowRight, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as promotionApi from "@/data/promotionApi";
import { getAllClasses } from "@/data/classApi";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function SinglePromotionPage() {
  const session = useStore((s) => s.session);
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const [toClassId, setToClassId] = useState("");
  const [toAcademicYear, setToAcademicYear] = useState("");
  const [remarks, setRemarks] = useState("");

  const [availableClasses, setAvailableClasses] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Search student by ID
  const handleSearch = async () => {
    if (!studentId.trim()) {
      toast.error("د زده کوونکي ID ولیکئ");
      return;
    }

    setLoading(true);
    try {
      const res = await promotionApi.searchStudentById(studentId.trim());
      if (res.success) {
        setStudent(res.data.student);
        // Set default target year to next year
        const nextYear = String(Number(res.data.student.academicYear) + 1);
        setToAcademicYear(nextYear);
        setToClassId(""); // Reset class selection
      }
    } catch (error) {
      toast.error(error.message || "زده کوونکی ونه موندل شو");
      setStudent(null);
      setToAcademicYear("");
      setAvailableClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load available classes when year changes
  useEffect(() => {
    if (student && toAcademicYear) {
      loadAvailableClasses();
    }
  }, [student, toAcademicYear]);

  const loadAvailableClasses = async () => {
    if (!student) return;
    
    try {
      const res = await getAllClasses({
        type: student.institutionType,
        academicYear: toAcademicYear,
        limit: 100,
      });
      
      // Exclude current class if same year
      let filteredClasses = res.data.classes || [];
      if (toAcademicYear === student.academicYear && student.classId) {
        filteredClasses = filteredClasses.filter(c => c.id !== student.classId);
      }
      
      setAvailableClasses(filteredClasses);
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("د ټولګیو په ترلاسه کولو کې تېروتنه");
    }
  };

  const handlePromote = async () => {
    if (!toClassId) {
      toast.error("نوی ټولګی وټاکئ");
      return;
    }

    if (!toAcademicYear) {
      toast.error("نوی تعلیمي کال ولیکئ");
      return;
    }

    setPromoting(true);
    try {
      const res = await promotionApi.promoteIndividualStudent({
        studentId: student.id,
        toClassId: Number(toClassId),
        toAcademicYear,
        promotionStatus: "Promoted",
        remarks,
      });

      if (res.success) {
        toast.success(res.message || "زده کوونکی بریالیتوب سره ترفیع شو");
        setConfirmOpen(false);
        
        // Reset form
        setStudentId("");
        setStudent(null);
        setToClassId("");
        setToAcademicYear("");
        setRemarks("");
        setAvailableClasses([]);
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

      <div className="bg-card border border-border rounded-md p-4 space-y-4">
        {/* Step 1: Search Student */}
        <div className="space-y-3">
          <p className="text-sm font-medium">۱ — د زده کوونکي ID ولیکئ</p>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                value={studentId}
                handleChanges={(e) => setStudentId(e.target.value)}
                placeholder="د زده کوونکي ID..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="size-4" />
              {loading ? "لټول..." : "لټون"}
            </button>
          </div>
        </div>

        {/* Student Info */}
        {student && (
          <>
            <div className="border-t" />

            <div className="space-y-3">
              <p className="text-sm font-medium">۲ — د زده کوونکي معلومات</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    <User className="size-3 inline ml-1" />
                    نوم
                  </p>
                  <p className="text-sm font-medium">{student.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">د پلار نوم</p>
                  <p className="text-sm font-medium">{student.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">رول نمبر</p>
                  <p className="text-sm font-medium">{student.rollNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">اوسنی ټولګی</p>
                  <Badge variant="muted">{student.className}</Badge>
                </div>
              </div>

              {/* Eligibility */}
              {student.percentage !== undefined && (
                <div className="p-3 border rounded-lg bg-background">
                  <p className="text-xs font-medium mb-2">د ترفیع وړتیا:</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">نمرې</p>
                      <p className="text-base font-bold">
                        {student.percentage?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">حاضري</p>
                      <p className="text-base font-bold">
                        {student.attendancePercentage?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">حالت</p>
                      <Badge
                        variant={student.eligible ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {student.eligible ? "وړ" : "نا وړ"}
                      </Badge>
                    </div>
                  </div>
                  {!student.eligible && student.reason && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                      {student.reason}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Step 3: Select Target Class */}
            <div className="space-y-3">
              <p className="text-sm font-medium">۳ — نوی تعلیمي کال او ټولګی وټاکئ</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Input
                    type="text"
                    value={toAcademicYear}
                    handleChanges={(e) => setToAcademicYear(e.target.value)}
                    label="نوی تعلیمي کال"
                    placeholder="1404"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">نوی ټولګی</span>
                  <select
                    className={SEL}
                    value={toClassId}
                    onChange={(e) => setToClassId(e.target.value)}
                  >
                    <option value="">ټولګی وټاکئ</option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section && `(${c.section})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Input
                  type="textarea"
                  value={remarks}
                  handleChanges={(e) => setRemarks(e.target.value)}
                  label="یادښت (اختیاري)"
                  placeholder="د ترفیع په اړه یادښت..."
                  rows={2}
                />
              </div>
            </div>

            {/* Step 4: Confirm */}
            {toClassId && toAcademicYear && (
              <>
                <div className="border-t" />

                <div className="space-y-3">
                  <p className="text-sm font-medium">۴ — مخکتنه او تایید</p>

                  <div className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">له</p>
                      <Badge variant="muted" className="text-sm px-3 py-1">
                        {student.className}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {student.academicYear}
                      </p>
                    </div>

                    <ArrowRight className="size-6 text-primary" />

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">ته</p>
                      <Badge variant="info" className="text-sm px-3 py-1">
                        {selectedClass?.name}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">{toAcademicYear}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      disabled={promoting}
                      className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      زده کوونکی ترفیع کړئ
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <ErpModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="د ترفیع تایید"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
              disabled={promoting}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoting}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-50"
            >
              {promoting ? "ترفیع کیږي..." : "تایید او ترفیع"}
            </button>
          </>
        }
      >
        {student && selectedClass && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">زده کوونکی:</p>
              <p className="text-base">{student.fullName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                رول: {student.rollNumber} | پلار: {student.fatherName}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 p-3 border rounded-lg">
              <div className="text-center">
                <Badge variant="muted">{student.className}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{student.academicYear}</p>
              </div>

              <ArrowRight className="size-5 text-primary" />

              <div className="text-center">
                <Badge variant="info">{selectedClass.name}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{toAcademicYear}</p>
              </div>
            </div>

            <div className="p-3 border border-warning/20 bg-warning/5 rounded-lg text-sm">
              <p className="font-medium mb-2">ایا تاسو ډاډه یاست؟</p>
              <p className="text-muted-foreground text-xs">
                <strong>{student.fullName}</strong> به له <strong>{student.className}</strong> څخه{" "}
                <strong>{selectedClass.name}</strong> ته ترفیع شي.
              </p>
            </div>
          </div>
        )}
      </ErpModal>
    </div>
  );
}

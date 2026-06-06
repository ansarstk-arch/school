import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { Badge } from "@/components/erp/Badge";
import { Award, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear } from "@/lib/afghan-date";
import { INSTITUTION_TYPES, SEL } from "@/utils/marksShared";
import {
  getCertificateExams,
  getCertificateClasses,
  getCertificateBatchData,
} from "@/data/certificateApi";
import { generateMultipleReportCardsPDF } from "@/utils/reportCardPdf";

const F = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default function CertificatesPage() {
  const [institutionType, setInstitutionType] = useState("School");
  const [academicYear, setAcademicYear] = useState(String(currentShamsiYear()));
  const [examId, setExamId] = useState("");
  const [classIds, setClassIds] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [preview, setPreview] = useState(null);

  const selectedExam = exams.find((e) => String(e.id) === String(examId));

  const fetchExams = useCallback(async () => {
    setLoadingExams(true);
    setExamId("");
    setClassIds([]);
    setClasses([]);
    setPreview(null);
    try {
      const res = await getCertificateExams(institutionType, academicYear);
      setExams(res.data?.exams || []);
    } catch (err) {
      toast.error(err.message || "د امتحاناتو ترلاسه کولو کې تېروتنه");
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  }, [institutionType, academicYear]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const fetchClasses = useCallback(async () => {
    if (!examId) {
      setClasses([]);
      setClassIds([]);
      setPreview(null);
      return;
    }
    setLoadingClasses(true);
    setClassIds([]);
    setPreview(null);
    try {
      const res = await getCertificateClasses(examId);
      setClasses(res.data?.classes || []);
    } catch (err) {
      toast.error(err.message || "د ټولګیو ترلاسه کولو کې تېروتنه");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const loadPreview = useCallback(async () => {
    if (!examId || classIds.length === 0) {
      setPreview(null);
      return;
    }
    try {
      const res = await getCertificateBatchData(Number(examId), classIds, true);
      setPreview(res.data);
    } catch {
      setPreview(null);
    }
  }, [examId, classIds]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleClassToggle = (id) => {
    setClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSelectAllClasses = () => {
    if (classIds.length === classes.length) {
      setClassIds([]);
    } else {
      setClassIds(classes.map((c) => c.id));
    }
  };

  const handleDownload = async () => {
    if (!examId) {
      toast.error("امتحان وټاکئ");
      return;
    }
    if (classIds.length === 0) {
      toast.error("لږ تر لږه یو ټولګی وټاکئ");
      return;
    }

    setDownloading(true);
    try {
      const res = await getCertificateBatchData(Number(examId), classIds, true);
      const data = res.data;

      if (!data?.totalCertificates) {
        toast.error("هیڅ بشپړ سند ونه موندل شو — لومړی نمرې بشپړې کړئ");
        return;
      }

      const reportCards = [];
      let examType = "FirstTerm";

      for (const batch of data.batches || []) {
        examType = batch.examType || examType;
        for (const cert of batch.certificates || []) {
          reportCards.push({
            student: cert.student,
            class: cert.class,
            academicYear: cert.academicYear,
            examTitle: cert.examTitle,
            subjects: cert.subjects,
            summary: cert.summary,
          });
        }
      }

      const examLabel = selectedExam?.examTitle?.replace(/\s+/g, "_") || "exam";
      await generateMultipleReportCardsPDF(reportCards, examType, `${examLabel}_${academicYear}`);

      toast.success(`${reportCards.length} سندونه بریالیتوب سره ډاونلوډ شول`);
      if (data.totalSkipped > 0) {
        toast.info(`${data.totalSkipped} زده کوونکي پریښودل شول (نمرې نه بشپړې)`);
      }
    } catch (err) {
      toast.error(err.message || "د سندونو په ډاونلوډ کې تېروتنه");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="سندونه"
        subtitle="د ازموینې سندونه — یوازې هغه زده کوونکي چې نمرې یې بشپړې دي"
        actions={
          <button
            onClick={handleDownload}
            disabled={downloading || !examId || classIds.length === 0}
            className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded-md px-3 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {downloading ? (
              <><Loader2 className="size-4 animate-spin" />ډاونلوډ کیږي...</>
            ) : (
              <><Download className="size-4" />سندونه ډاونلوډ کړئ</>
            )}
          </button>
        }
      />

      <div className="bg-card border border-border rounded-md p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="size-5" />
          <h3 className="text-base font-semibold">د سند جوړولو تنظیمات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <F label="د ادارې ډول">
            <select
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value)}
              className={SEL}
            >
              {INSTITUTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </F>

          <F label="تعلیمي کال">
            <ShamsiYearPicker value={academicYear} onChange={setAcademicYear} />
          </F>

          <F label="امتحان">
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className={SEL}
              disabled={loadingExams}
            >
              <option value="">{loadingExams ? "لوډ کیږي..." : "امتحان وټاکئ"}</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.examTitle}</option>
              ))}
            </select>
          </F>

          <F label="ټولګي">
            <div className="text-sm text-muted-foreground py-1.5">
              {classIds.length > 0 ? `${classIds.length} ټولګي غوره شوي` : "لاندې ټولګي وټاکئ"}
            </div>
          </F>
        </div>

        {selectedExam && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="muted">{selectedExam.examTitle}</Badge>
            <Badge variant="muted">کال: {academicYear}</Badge>
            {preview?.totalCertificates > 0 && (
              <Badge variant="success">
                <CheckCircle className="inline size-3 ml-1" />
                {preview.totalCertificates} بشپړ سندونه
              </Badge>
            )}
            {preview?.totalSkipped > 0 && (
              <Badge variant="warning">
                <AlertCircle className="inline size-3 ml-1" />
                {preview.totalSkipped} نیمګړي
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">ټولګي وټاکئ</h3>
          {classes.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllClasses}
              className="text-xs border border-input rounded px-2 py-1 hover:bg-muted"
            >
              {classIds.length === classes.length ? "لغوه کول" : "ټول وټاکئ"}
            </button>
          )}
        </div>

        {loadingClasses ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !examId ? (
          <p className="text-sm text-muted-foreground text-center py-6">لومړی امتحان وټاکئ</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">د دې امتحان لپاره ټولګي نشته</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {classes.map((cls) => (
              <label
                key={cls.id}
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted/50 ${
                  classIds.includes(cls.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={classIds.includes(cls.id)}
                  onChange={() => handleClassToggle(cls.id)}
                  className="rounded"
                />
                <span className="text-sm font-medium">
                  {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {preview?.totalCertificates === 0 && examId && classIds.length > 0 && !loadingClasses && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-2">
          <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            په غوره شوو ټولګیو کې هیڅ زده کوونکی د بشپړو نمرو سره ونه موندل شو.
            لومړی د ټولو مضامینو نمرې داخل کړئ.
          </p>
        </div>
      )}
    </div>
  );
}

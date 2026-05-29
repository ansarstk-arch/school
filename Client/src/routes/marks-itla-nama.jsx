import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { currentShamsiYear } from "@/lib/afghan-date";
import { useMarksLookups } from "@/hooks/useMarksLookups";
import { SEL } from "@/utils/marksShared";
import * as marksApi from "@/data/marksApi";
import { getStudentReportCard, getClassReportCards } from "@/data/reportCardApi";
import { generateSingleReportCardPDF, generateMultipleReportCardsPDF } from "@/utils/reportCardPdf";

export default function ItlaNamaPage() {
  const [filters, setFilters] = useState({
    academicYear: String(currentShamsiYear()),
    examId: "",
    classId: "",
    institutionType: "School",
  });

  const [examType, setExamType] = useState("Annual"); // FirstTerm or Annual
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [singleLoadingId, setSingleLoadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });

  const { exams, classes } = useMarksLookups({
    academicYear: filters.academicYear,
    examId: filters.examId,
    institutionType: filters.institutionType,
  });

  const [selectedIds, setSelectedIds] = useState([]);

  const canExport = Boolean(filters.examId && filters.classId);

  const fetchRecords = async () => {
    if (!filters.examId || !filters.classId) {
      setRecords([]);
      setPagination({ total: 0, totalPages: 1, page: 1, limit: 12 });
      return;
    }
    setLoading(true);
    try {
      const res = await marksApi.getResultPrepRecords({ ...filters, page, limit: 12 });
      if (res.success) {
        setRecords(res.data.records || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1, page, limit: 12 });
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    setSelectedIds([]);
  }, [records]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allIds = useMemo(() => records.map((r) => r.studentId), [records]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedSet.has(id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(allIds);
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Download single student report card
  const doExportSingle = async (studentId, studentName) => {
    if (!canExport) {
      toast.error("لومړی امتحان او ټولګی غوره کړئ");
      return;
    }

    try {
      setSingleLoadingId(studentId);
      
      // Fetch report card data
      const response = await getStudentReportCard(studentId, examType, filters.academicYear);
      
      if (!response.success) {
        throw new Error(response.message || "د اطلاع نامې په ترلاسه کولو کې تېروتنه");
      }

      // Generate PDF
      await generateSingleReportCardPDF(response.data, examType, studentName);
      
      toast.success("اطلاع نامه بریالیتوب سره ډاونلوډ شوه");
    } catch (error) {
      console.error("Error downloading report card:", error);
      toast.error(error.message || "د اطلاع نامې په ډاونلوډ کې تېروتنه");
    } finally {
      setSingleLoadingId(null);
    }
  };

  // Download selected students
  const doExportSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error("لږ تر لږه یوه اطلاع نامه غوره کړئ");
      return;
    }

    if (!canExport) {
      toast.error("لومړی امتحان او ټولګی غوره کړئ");
      return;
    }

    try {
      setExporting(true);

      // Fetch report cards for selected students
      const reportCardsPromises = selectedIds.map(studentId =>
        getStudentReportCard(studentId, examType, filters.academicYear)
      );

      const responses = await Promise.all(reportCardsPromises);
      const reportCards = responses
        .filter(r => r.success)
        .map(r => r.data);

      if (reportCards.length === 0) {
        throw new Error("هیڅ اطلاع نامه ونه موندل شوه");
      }

      // Generate PDF
      const selectedClass = classes.find(c => c.id === Number(filters.classId));
      const className = selectedClass ? `${selectedClass.name}_${selectedClass.section || ''}` : 'class';
      
      await generateMultipleReportCardsPDF(reportCards, examType, className);
      
      toast.success(`${reportCards.length} اطلاع نامې بریالیتوب سره ډاونلوډ شوې`);
    } catch (error) {
      console.error("Error downloading selected report cards:", error);
      toast.error(error.message || "د اطلاع نامو په ډاونلوډ کې تېروتنه");
    } finally {
      setExporting(false);
    }
  };

  // Download all students in class
  const doExportAll = async () => {
    if (!canExport) {
      toast.error("لومړی امتحان او ټولګی غوره کړئ");
      return;
    }

    if (records.length === 0) {
      toast.error("په دې ټولګي کې زده کوونکي نشته");
      return;
    }

    try {
      setExporting(true);

      // Fetch all report cards for the class
      const response = await getClassReportCards(filters.classId, examType, filters.academicYear);

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
      const selectedClass = classes.find(c => c.id === Number(filters.classId));
      const className = selectedClass ? `${selectedClass.name}_${selectedClass.section || ''}` : 'class';
      
      await generateMultipleReportCardsPDF(reportCards, examType, className);
      
      toast.success(`${reportCards.length} اطلاع نامې بریالیتوب سره ډاونلوډ شوې`);
    } catch (error) {
      console.error("Error downloading all report cards:", error);
      toast.error(error.message || "د اطلاع نامو په ډاونلوډ کې تېروتنه");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="اطلاع نامې"
        subtitle="د ښوونځي د پایلو لپاره اطلاع نامه صادر کړئ"
        icon={<Download className="size-5" />}
      />

      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">تعلیمي کال</span>
            <input
              className={SEL}
              value={filters.academicYear}
              onChange={(e) => setFilters((p) => ({ ...p, academicYear: e.target.value }))}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">ډول</span>
            <select
              className={SEL}
              value={filters.institutionType}
              onChange={(e) => setFilters((p) => ({ ...p, institutionType: e.target.value }))}
            >
              <option value="School">ښوونځی</option>
              <option value="Center">مرکز</option>
              <option value="Madrasa">مدرسه</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">امتحان</span>
            <select
              className={SEL}
              value={filters.examId}
              onChange={(e) => {
                setPage(1);
                setFilters((p) => ({ ...p, examId: e.target.value, classId: "" }));
              }}
            >
              <option value="">—</option>
              {exams.map((ex) => (
                <option key={ex.id} value={String(ex.id)}>
                  {ex.examTitle}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">ټولګی</span>
            <select
              className={SEL}
              value={filters.classId}
              onChange={(e) => {
                setPage(1);
                setFilters((p) => ({ ...p, classId: e.target.value }));
              }}
            >
              <option value="">—</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.section ? `(${c.section})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">د امتحان ډول</span>
            <select
              className={SEL}
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="FirstTerm">څلور میاشتنی امتحان</option>
              <option value="Annual">کلنی امتحان</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={doExportAll}
            disabled={exporting || !canExport}
            className="px-3 py-2 border border-input rounded text-sm font-medium hover:bg-muted disabled:opacity-50 inline-flex items-center gap-2"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PDF (ټول ټولګی)
          </button>

          <button
            onClick={doExportSelected}
            disabled={exporting || !canExport || selectedIds.length === 0}
            className="px-3 py-2 border border-input rounded text-sm font-medium hover:bg-muted disabled:opacity-50 inline-flex items-center gap-2"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PDF (ټاکل شوي - {selectedIds.length})
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="text-sm text-muted-foreground">
            {loading ? "..." : `${pagination.total || records.length} زده کوونکي`}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            ټول انتخاب
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">انتخاب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">نوم</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">پلار</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">نمبر</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">درجه</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">فردي PDF</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    {filters.examId && filters.classId
                      ? "هیڅ ریکارډ ونه موندل شو"
                      : "لومړی امتحان او ټولګی غوره کړئ"}
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(r.studentId)}
                        onChange={() => toggleOne(r.studentId)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{r.studentName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.fatherName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.rollNumber || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.grade || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => doExportSingle(r.studentId, r.studentName)}
                          disabled={singleLoadingId === r.studentId || exporting}
                          className="px-2 py-1 text-xs border border-input rounded hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {singleLoadingId === r.studentId ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Download className="size-3" />
                          )}
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-input rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              پخوانی
            </button>
            <span className="text-sm text-muted-foreground">
              پاڼه {pagination.page} د {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 border border-input rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              راتلونکی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { FilterBar } from "@/components/erp/FilterBar";
import { StatCard } from "@/components/erp/StatCard";
import { Badge } from "@/components/erp/Badge";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { Calculator, Users, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear, formatShamsi } from "@/lib/afghan-date";
import { useStore } from "@/store/useStore";
import * as marksApi from "@/data/marksApi";
import { useMarksLookups } from "@/hooks/useMarksLookups";
import { INSTITUTION_TYPES, SEL } from "@/utils/marksShared";
import { saveAs } from "file-saver";

export default function MarksResultPrepPage() {
  const session = useStore((s) => s.session);
  const [academicYear, setAcademicYear] = useState(session || String(currentShamsiYear()));
  const [filters, setFilters] = useState({ academicYear: session || String(currentShamsiYear()) });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [calcForm, setCalcForm] = useState({
    examId: "",
    classId: "",
    institutionType: "School",
  });

  const { exams, classes } = useMarksLookups({
    academicYear,
    examId: calcForm.examId,
    institutionType: calcForm.institutionType,
  });

  const listLookup = useMarksLookups({
    academicYear: filters.academicYear || academicYear,
    examId: filters.examId,
    institutionType: filters.institutionType,
  });

  const fetchRecords = useCallback(
    async (pageNum = 1, f = filters) => {
      setLoading(true);
      try {
        const res = await marksApi.getResultPrepRecords({ page: pageNum, limit: 10, ...f });
        if (res.success) {
          setRecords(res.data.records || []);
          setPagination(
            res.data.pagination || { total: 0, totalPages: 1, page: pageNum, limit: 10 }
          );
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchSummary = useCallback(async (examId, classId, institutionType) => {
    if (!examId || !classId) {
      setSummary(null);
      return;
    }
    try {
      const res = await marksApi.getResultPrepSummary({ examId, classId, institutionType });
      if (res.success) setSummary(res.data);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    fetchRecords(page, filters);
    if (filters.examId && filters.classId) {
      fetchSummary(filters.examId, filters.classId, filters.institutionType);
    } else {
      setSummary(null);
    }
  }, [filters, page]);

  const handleCalculate = async () => {
    const { examId, classId, institutionType } = calcForm;
    if (!examId || !classId) {
      toast.error("امتحان او ټولګی غوره کړئ");
      return;
    }
    setCalculating(true);
    try {
      const res = await marksApi.runResultCalculation({
        examId: Number(examId),
        classId: Number(classId),
        institutionType,
      });
      if (res.success) {
        toast.success(res.message || "محاسبه بریالۍ شوه");
        const nextFilters = {
          academicYear,
          examId: String(examId),
          classId: String(classId),
          institutionType,
        };
        setFilters(nextFilters);
        setPage(1);
        fetchSummary(examId, classId, institutionType);
      }
    } catch (e) {
      toast.error(e.message || "د محاسبې کې ستونزه");
    } finally {
      setCalculating(false);
    }
  };

  const handleExport = async (type) => {
    if (!filters.examId) {
      toast.error("لومړی امتحان فلټر کړئ");
      return;
    }
    setExporting(true);
    try {
      const blob =
        type === "pdf"
          ? await marksApi.downloadMarksPDF(filters)
          : await marksApi.downloadMarksExcel(filters);
      saveAs(blob, type === "pdf" ? "results.pdf" : "results.xlsx");
      toast.success("صادرول بریالي شول");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  const columnDefs = useMemo(
    () => [
      { field: "rank", headerName: "#", width: 55 },
      { field: "studentName", headerName: "نوم", flex: 1, minWidth: 130 },
      { field: "fatherName", headerName: "پلار", width: 110 },
      {
        field: "totalObtained",
        headerName: "ترلاسه",
        width: 85,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(1) : "—"),
      },
      {
        field: "percentage",
        headerName: "سلنه",
        width: 75,
        valueFormatter: (p) => (p.value != null ? `${Number(p.value).toFixed(1)}%` : "—"),
      },
      { field: "grade", headerName: "درجه", width: 65 },
      {
        field: "gpa",
        headerName: "GPA",
        width: 65,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(2) : "—"),
      },
      {
        field: "overallStatus",
        headerName: "حالت",
        width: 95,
        cellRenderer: (p) => (
          <Badge variant={p.value === "Pass" ? "success" : "destructive"}>
            {p.value === "Pass" ? "بریالی" : "ناکام"}
          </Badge>
        ),
      },
      {
        field: "updatedAt",
        headerName: "محاسبه",
        width: 105,
        valueFormatter: (p) => (p.value ? formatShamsi(p.value) : "—"),
      },
    ],
    []
  );

  const filterDefs = useMemo(
    () => [
      { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear" },
      {
        key: "examId",
        label: "امتحان",
        type: "select",
        options: listLookup.exams.map((e) => ({ value: String(e.id), label: e.examTitle })),
      },
      {
        key: "institutionType",
        label: "اداره",
        type: "select",
        options: INSTITUTION_TYPES,
      },
      {
        key: "classId",
        label: "ټولګی",
        type: "select",
        options: listLookup.classes.map((c) => ({
          value: String(c.id),
          label: `${c.name}${c.section ? ` (${c.section})` : ""}`,
        })),
      },
      {
        key: "overallStatus",
        label: "حالت",
        type: "select",
        options: [
          { value: "Pass", label: "بریالی" },
          { value: "Fail", label: "ناکام" },
        ],
      },
      { key: "search", label: "لټون", type: "input", placeholder: "نوم…" },
    ],
    [listLookup.exams, listLookup.classes]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="د پایلو محاسبه چمتووالی"
        subtitle={`تعلیمي کال ${academicYear} — د کارډونو لپاره چمتو معلومات`}
        actions={
          filters.examId ? (
            <div className="flex gap-2">
              <button type="button" disabled={exporting} onClick={() => handleExport("excel")} className="text-xs border rounded px-3 py-1.5">Excel</button>
              <button type="button" disabled={exporting} onClick={() => handleExport("pdf")} className="text-xs border rounded px-3 py-1.5">PDF</button>
            </div>
          ) : null
        }
      />

      <div className="bg-card border border-border rounded-md p-4 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Calculator className="size-4" />
          محاسبه پیل کړئ
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            تعلیمي کال
            <ShamsiYearPicker value={academicYear} onChange={setAcademicYear} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            امتحان
            <select className={SEL} value={calcForm.examId} onChange={(e) => setCalcForm((f) => ({ ...f, examId: e.target.value, classId: "" }))}>
              <option value="">امتحان</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.examTitle}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            ادارې ډول
            <select className={SEL} value={calcForm.institutionType} onChange={(e) => setCalcForm((f) => ({ ...f, institutionType: e.target.value, classId: "" }))}>
              {INSTITUTION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            ټولګی
            <select className={SEL} value={calcForm.classId} onChange={(e) => setCalcForm((f) => ({ ...f, classId: e.target.value }))} disabled={!calcForm.examId}>
              <option value="">ټولګی</option>
              {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </label>
          <button type="button" onClick={handleCalculate} disabled={calculating} className="h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {calculating ? "محاسبه…" : "محاسبه او چمتو کړئ"}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="ټول زده کوونکي" value={summary.totalStudents} icon={Users} />
          <StatCard label="بریالي" value={summary.passed} icon={TrendingUp} accent="success" />
          <StatCard label="ناکام" value={summary.failed} icon={AlertCircle} accent="destructive" />
          <StatCard label="منځنۍ سلنه" value={`${summary.averagePercentage}%`} icon={Calculator} />
        </div>
      )}

      <FilterBar
        filters={filterDefs}
        defaultValues={{ academicYear: session || String(currentShamsiYear()) }}
        onApply={(v) => { setFilters(v); setPage(1); }}
        onClear={() => {
          const y = session || String(currentShamsiYear());
          setFilters({ academicYear: y });
          setSummary(null);
          setPage(1);
        }}
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={records}
        loading={loading}
        serverSidePagination
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

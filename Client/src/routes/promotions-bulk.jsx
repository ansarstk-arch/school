import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { Users, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as promotionApi from "@/data/promotionApi";
import { getAllClasses } from "@/data/classApi";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const INSTITUTION_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

export default function BulkPromotionPage() {
  const session = useStore((s) => s.session);
  const [academicYear, setAcademicYear] = useState(session || String(currentShamsiYear()));
  const [institutionType, setInstitutionType] = useState("School");
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toAcademicYear, setToAcademicYear] = useState(String(Number(academicYear) + 1));

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const [filterEligible, setFilterEligible] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Load classes
  useEffect(() => {
    loadClasses();
  }, [institutionType, academicYear]);

  const loadClasses = async () => {
    try {
      const res = await getAllClasses({
        type: institutionType,
        academicYear,
        limit: 100,
      });
      setClasses(res.data.classes || []);
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  // Load students
  const loadStudents = async () => {
    if (!fromClassId) {
      toast.error("ټولګی وټاکئ");
      return;
    }

    setLoading(true);
    try {
      const res = await promotionApi.getEligibleStudents({
        classId: fromClassId,
        academicYear,
      });

      if (res.success) {
        setStudents(res.data.students || []);
        // Auto-select eligible students if filter is on
        if (filterEligible) {
          const eligibleIds = res.data.students
            .filter((s) => s.eligible)
            .map((s) => s.id);
          setSelectedStudentIds(eligibleIds);
        }
      }
    } catch (error) {
      toast.error(error.message || "د زده کوونکو د ترلاسه کولو کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  // Toggle student selection
  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedStudentIds(students.map((s) => s.id));
  };

  // Select eligible only
  const selectEligible = () => {
    const eligibleIds = students.filter((s) => s.eligible).map((s) => s.id);
    setSelectedStudentIds(eligibleIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Preview promotion
  const handlePreview = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("لږترلږه یو زده کوونکی وټاکئ");
      return;
    }

    if (!toClassId) {
      toast.error("نوی ټولګی وټاکئ");
      return;
    }

    setLoading(true);
    try {
      const res = await promotionApi.previewPromotion({
        studentIds: selectedStudentIds,
        fromClassId: Number(fromClassId),
        toClassId: Number(toClassId),
        toAcademicYear,
      });

      if (res.success) {
        setPreviewData(res.data);
        setPreviewOpen(true);
      }
    } catch (error) {
      toast.error(error.message || "د مخکتنې کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  // Execute bulk promotion
  const handlePromote = async () => {
    setPromoting(true);
    try {
      const fromClass = classes.find((c) => c.id === Number(fromClassId));
      const toClass = classes.find((c) => c.id === Number(toClassId));

      const res = await promotionApi.promoteBulkStudents({
        studentIds: selectedStudentIds,
        fromClassId: Number(fromClassId),
        toClassId: Number(toClassId),
        toAcademicYear,
        batchName: `${fromClass?.name} → ${toClass?.name} (${new Date().toISOString().split("T")[0]})`,
        remarks: `د ${academicYear} کال پای ترفیع`,
      });

      if (res.success) {
        toast.success(res.message || "زده کوونکي بریالیتوب سره ترفیع شول");
        setPreviewOpen(false);
        // Reset
        setSelectedStudentIds([]);
        setStudents([]);
        setFromClassId("");
        setToClassId("");
      }
    } catch (error) {
      toast.error(error.message || "د ترفیع کې ستونزه");
    } finally {
      setPromoting(false);
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "",
        width: 50,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        pinned: "right",
      },
      {
        field: "rollNumber",
        headerName: "رول",
        width: 90,
        pinned: "right",
      },
      {
        field: "fullName",
        headerName: "نوم",
        flex: 1,
        minWidth: 150,
      },
      {
        field: "fatherName",
        headerName: "د پلار نوم",
        flex: 1,
        minWidth: 150,
      },
      {
        field: "percentage",
        headerName: "نمرې",
        width: 90,
        valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "—"),
      },
      {
        field: "attendancePercentage",
        headerName: "حاضري",
        width: 90,
        valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "—"),
      },
      {
        field: "eligible",
        headerName: "وړتیا",
        width: 100,
        cellRenderer: (p) => (
          <Badge variant={p.value ? "success" : "destructive"}>
            {p.value ? "وړ" : "نا وړ"}
          </Badge>
        ),
      },
    ],
    []
  );

  const selectedClass = classes.find((c) => c.id === Number(fromClassId));
  const targetClass = classes.find((c) => c.id === Number(toClassId));
  const selectedStudents = students.filter((s) => selectedStudentIds.includes(s.id));
  const eligibleCount = selectedStudents.filter((s) => s.eligible).length;
  const notEligibleCount = selectedStudents.length - eligibleCount;

  return (
    <div className="space-y-4">
      <PageHeader
        title="ډله ییز ترفیع"
        subtitle="د ټولګي یا ګڼو زده کوونکو ترفیع"
        actions={
          students.length > 0 && (
            <Badge variant="info">
              <Users className="size-3 inline ml-1" />
              {students.length} زده کوونکي
            </Badge>
          )
        }
      />

      {/* Selection Form */}
      <div className="bg-card border border-border rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">۱ — ټولګی او تعلیمي کال وټاکئ</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            تعلیمي کال
            <ShamsiYearPicker value={academicYear} onChange={setAcademicYear} />
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            ادارې ډول
            <select
              className={SEL}
              value={institutionType}
              onChange={(e) => {
                setInstitutionType(e.target.value);
                setFromClassId("");
                setToClassId("");
              }}
            >
              {INSTITUTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            اوسنی ټولګی
            <select
              className={SEL}
              value={fromClassId}
              onChange={(e) => setFromClassId(e.target.value)}
            >
              <option value="">ټولګی وټاکئ</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section && `(${c.section})`}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadStudents}
              disabled={loading || !fromClassId}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "لوډېږي..." : "زده کوونکي ښکاره کړئ"}
            </button>
          </div>
        </div>

        {students.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterEligible}
              onChange={(e) => {
                setFilterEligible(e.target.checked);
                if (e.target.checked) {
                  selectEligible();
                }
              }}
              className="rounded border-input"
            />
            یوازې وړ زده کوونکي وښایئ
          </label>
        )}
      </div>

      {/* Students Table */}
      {students.length > 0 && (
        <>
          <div className="bg-card border border-border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">۲ — زده کوونکي وټاکئ</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-muted"
                >
                  ټول غوره کړئ
                </button>
                <button
                  type="button"
                  onClick={selectEligible}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-muted"
                >
                  وړ زده کوونکي
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-muted"
                >
                  پاکول
                </button>
              </div>
            </div>

            <AgGridTable
              columnDefs={columnDefs}
              rowData={filterEligible ? students.filter((s) => s.eligible) : students}
              loading={loading}
              clientSidePagination
              pageSize={10}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              onSelectionChanged={(params) => {
                const selected = params.api.getSelectedRows();
                setSelectedStudentIds(selected.map((s) => s.id));
              }}
            />

            {selectedStudentIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                <div className="text-sm">
                  <span className="font-medium">{selectedStudentIds.length}</span> زده کوونکي غوره شوي
                  {eligibleCount > 0 && (
                    <span className="text-muted-foreground mr-2">
                      ({eligibleCount} وړ، {notEligibleCount} نا وړ)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Target Class Selection */}
          <div className="bg-card border border-border rounded-md p-4 space-y-3">
            <p className="text-sm font-medium">۳ — نوی ټولګی او کال وټاکئ</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section && `(${c.section})`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePreview}
                disabled={selectedStudentIds.length === 0 || !toClassId}
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
        title="د ډله ییز ترفیع مخکتنه"
        size="lg"
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
        {previewData && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border rounded text-center">
                <p className="text-2xl font-bold">{previewData.summary.total}</p>
                <p className="text-xs text-muted-foreground">ټول زده کوونکي</p>
              </div>
              <div className="p-3 border rounded text-center bg-success/10">
                <p className="text-2xl font-bold text-success">
                  {previewData.summary.willBePromoted}
                </p>
                <p className="text-xs text-muted-foreground">به ترفیع شي</p>
              </div>
              <div className="p-3 border rounded text-center bg-warning/10">
                <p className="text-2xl font-bold text-warning">
                  {previewData.summary.willRepeat}
                </p>
                <p className="text-xs text-muted-foreground">به تکرار شي</p>
              </div>
            </div>

            {/* From/To */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">له</p>
                <Badge variant="muted" className="text-sm">
                  {selectedClass?.name}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{academicYear}</p>
              </div>

              <ArrowRight className="size-6 text-primary" />

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">ته</p>
                <Badge variant="info" className="text-sm">
                  {targetClass?.name}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{toAcademicYear}</p>
              </div>
            </div>

            {/* Student List */}
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-right">نوم</th>
                    <th className="p-2 text-right">رول</th>
                    <th className="p-2 text-right">نمرې</th>
                    <th className="p-2 text-right">حالت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.preview.map((student) => (
                    <tr key={student.studentId}>
                      <td className="p-2">{student.studentName}</td>
                      <td className="p-2">{student.rollNumber}</td>
                      <td className="p-2">{student.percentage?.toFixed(1)}%</td>
                      <td className="p-2">
                        {student.willBePromoted ? (
                          <CheckCircle2 className="size-4 text-success inline" />
                        ) : (
                          <XCircle className="size-4 text-warning inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded text-xs">
              ⚠️ د تایید وروسته، د ټولو غوره شوو زده کوونکو ټولګی او تعلیمي کال به تازه شي.
            </div>
          </div>
        )}
      </ErpModal>
    </div>
  );
}

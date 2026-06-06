import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { FilterBar } from "@/components/erp/FilterBar";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { Save, Settings2, Pencil, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear, formatShamsi } from "@/lib/afghan-date";
import { useStore } from "@/store/useStore";
import * as marksApi from "@/data/marksApi";
import { useMarksLookups } from "@/hooks/useMarksLookups";
import { INSTITUTION_TYPES, SEL } from "@/utils/marksShared";

const F = ({ label, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
    {error && <span className="text-[11px] text-destructive">{error}</span>}
  </label>
);

export default function MarksExamConfigPage() {
  const session = useStore((s) => s.session);
  const [academicYear, setAcademicYear] = useState(session || String(currentShamsiYear()));
  const [listFilters, setListFilters] = useState({ academicYear: session || String(currentShamsiYear()) });
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });

  const [setup, setSetup] = useState({
    examId: "",
    institutionType: "School",
    classId: "",
  });
  const [subjectRows, setSubjectRows] = useState([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupErrors, setSetupErrors] = useState({});

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ totalMarks: "", passingMarks: "" });
  const [editId, setEditId] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { exams, classes, selectedExam } = useMarksLookups({
    academicYear,
    examId: setup.examId,
    institutionType: setup.institutionType,
  });

  const listLookup = useMarksLookups({
    academicYear: listFilters.academicYear || academicYear,
    examId: listFilters.examId,
    institutionType: listFilters.institutionType,
  });

  const fetchList = useCallback(
    async (pageNum = 1, f = listFilters) => {
      setLoading(true);
      try {
        const res = await marksApi.getAllExamSubjectConfigs({
          page: pageNum,
          limit: 12,
          ...f,
        });
        if (res.success) {
          setConfigs(res.data.configs || []);
          setPagination(
            res.data.pagination || { total: 0, totalPages: 1, page: pageNum, limit: 12 }
          );
        }
      } catch (e) {
        toast.error(e.message || "د لیست د ترلاسه کولو کې ستونزه");
      } finally {
        setLoading(false);
      }
    },
    [listFilters]
  );

  useEffect(() => {
    fetchList(page, listFilters);
  }, [listFilters, page]);

  const loadSubjectsForSetup = async () => {
    if (!setup.examId || !setup.classId || !setup.institutionType) {
      toast.error("امتحان، ادارې ډول او ټولګی غوره کړئ");
      return;
    }
    setSetupLoading(true);
    try {
      const res = await marksApi.getSubjectsForExamClass(
        setup.examId,
        setup.classId,
        setup.institutionType
      );
      if (res.success) {
        const rows = (res.data.subjects || []).map((s) => ({
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          totalMarks: s.config?.totalMarks ?? "",
          passingMarks: s.config?.passingMarks ?? "",
          configId: s.config?.id ?? null,
        }));
        setSubjectRows(rows);
        if (rows.length === 0) toast.info("د دې ټولګي لپاره مضامین ونه موندل شول");
        // Open modal instead of showing below
        setSetupOpen(true);
      }
    } catch (e) {
      toast.error(e.message || "د مضامینو د ترلاسه کولو کې ستونزه");
    } finally {
      setSetupLoading(false);
    }
  };

  const validateConfig = (totalMarks, passingMarks) => {
    const total = Number(totalMarks);
    const passing = Number(passingMarks);
    if (!totalMarks || totalMarks === "") return "ټولټال نمرې اړینې دي";
    if (!Number.isFinite(total) || total <= 0 || total > 100) return "ټولټال نمرې باید د 0 او 100 تر منځ وي";
    if (!passingMarks || passingMarks === "") return "د بریالیتوب نمرې اړینې دي";
    if (!Number.isFinite(passing) || passing < 0) return "د بریالیتوب نمرې باید مثبتې وي";
    if (passing > total) return "بریالیتوب نمرې د ټولټال څخه زیاتې نشي";
    return null;
  };

  const handleSaveSetup = async () => {
    // Validate all rows
    const errors = {};
    subjectRows.forEach((row, idx) => {
      if (row.totalMarks !== "" || row.passingMarks !== "") {
        const err = validateConfig(row.totalMarks, row.passingMarks);
        if (err) {
          errors[`${row.subjectId}`] = err;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setSetupErrors(errors);
      toast.error("مهرباني وکړئ ټولې تېروتنې سمې کړئ");
      return;
    }

    const toSave = subjectRows.filter((r) => r.totalMarks !== "" && r.passingMarks !== "");
    if (toSave.length === 0) {
      toast.error("لږ تر لږه یو مضمون تنظیم کړئ");
      return;
    }

    setSaving(true);
    try {
      const res = await marksApi.bulkUpsertExamSubjectConfig({
        examId: Number(setup.examId),
        classId: Number(setup.classId),
        institutionType: setup.institutionType,
        configs: toSave.map((r) => ({
          subjectId: r.subjectId,
          totalMarks: Number(r.totalMarks),
          passingMarks: Number(r.passingMarks),
        })),
      });
      if (res.success) {
        toast.success(res.message);
        setSetupOpen(false);
        setSetupErrors({});
        fetchList(1, listFilters);
      }
    } catch (e) {
      toast.error(e.message || "د ثبتولو کې ستونزه");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setEditForm({ totalMarks: row.totalMarks, passingMarks: row.passingMarks });
    setEditErrors({});
    setEditOpen(true);
  };

  const openView = (row) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openDelete = (row) => {
    setDeleteId(row.id);
    setDeleteOpen(true);
  };

  const handleEditSave = async () => {
    const err = validateConfig(editForm.totalMarks, editForm.passingMarks);
    if (err) {
      setEditErrors({ form: err });
      return;
    }
    setEditLoading(true);
    try {
      await marksApi.updateExamSubjectConfig(editId, {
        totalMarks: Number(editForm.totalMarks),
        passingMarks: Number(editForm.passingMarks),
      });
      toast.success("تنظیم بریالي تازه شو");
      setEditOpen(false);
      fetchList(page, listFilters);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const onSetupCellChange = (subjectId, field, value) => {
    setSubjectRows((prev) =>
      prev.map((r) =>
        r.subjectId === subjectId ? { ...r, [field]: value } : r
      )
    );
    // Clear error for this subject when user types
    if (setupErrors[`${subjectId}`]) {
      setSetupErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${subjectId}`];
        return newErrors;
      });
    }
  };

  const listColumnDefs = useMemo(
    () => [
      { field: "examTitle", headerName: "امتحان", flex: 1, minWidth: 130 },
      {
        field: "examStartDate",
        headerName: "پیل",
        width: 110,
        valueFormatter: (p) => (p.value ? formatShamsi(p.value) : "—"),
      },
      { field: "className", headerName: "ټولګی", width: 90 },
      { field: "subjectName", headerName: "مضمون", width: 110 },
      {
        field: "institutionType",
        headerName: "اداره",
        width: 85,
        cellRenderer: (p) => INSTITUTION_TYPES.find((t) => t.value === p.value)?.label || p.value,
      },
      { field: "totalMarks", headerName: "ټولټال", width: 80 },
      { field: "passingMarks", headerName: "بریالیتوب", width: 90 },
      {
        field: "actions",
        headerName: "",
        width: 120,
        sortable: false,
        cellRenderer: (p) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openView(p.data); }}
              title="کتل"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openEdit(p.data); }}
              title="سمول"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openDelete(p.data); }}
              title="ړنګول"
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const filterDefs = useMemo(
    () => [
      { key: "search", label: "لټون", type: "input", placeholder: "امتحان، مضمون…" },
      {
        key: "institutionType",
        label: "ادارې ډول",
        type: "select",
        options: INSTITUTION_TYPES,
      },
      {
        key: "examId",
        label: "امتحان",
        type: "select",
        options: listLookup.exams.map((e) => ({
          value: String(e.id),
          label: e.examTitle,
        })),
        disabled: !listFilters.institutionType,
      },
      {
        key: "classId",
        label: "ټولګی",
        type: "select",
        options: listLookup.classes.map((c) => ({
          value: String(c.id),
          label: `${c.name}${c.section ? ` (${c.section})` : ""}`,
        })),
        disabled: !listFilters.examId,
      },
      { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear" },
    ],
    [listLookup.exams, listLookup.classes, listFilters.institutionType, listFilters.examId]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="د امتحان مضامین تنظیم"
        subtitle={`تعلیمي کال ${academicYear} — د هر امتحان او ټولګي لپاره د مضامینو نمرې`}
        actions={<Badge variant="info"><Settings2 className="size-3 inline ml-1" />تنظیم</Badge>}
      />

      <div className="bg-card border border-border rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">۱ — امتحان، ادارې ډول او ټولګی وټاکئ</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            تعلیمي کال
            <ShamsiYearPicker value={academicYear} onChange={setAcademicYear} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            ادارې ډول
            <select
              className={SEL}
              value={setup.institutionType}
              onChange={(e) =>
                setSetup((s) => ({ ...s, institutionType: e.target.value, examId: "", classId: "" }))
              }
            >
              {INSTITUTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            امتحان
            <select
              className={SEL}
              value={setup.examId}
              onChange={(e) =>
                setSetup((s) => ({ ...s, examId: e.target.value, classId: "" }))
              }
              disabled={!setup.institutionType}
            >
              <option value="">امتحان</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.examTitle}
                  {ex.startDate ? ` (${formatShamsi(ex.startDate)})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            ټولګی
            <select
              className={SEL}
              value={setup.classId}
              onChange={(e) => setSetup((s) => ({ ...s, classId: e.target.value }))}
              disabled={!setup.examId}
            >
              <option value="">ټولګی</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.section ? ` (${c.section})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadSubjectsForSetup}
              disabled={setupLoading}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {setupLoading ? "لوډېږي…" : "مضامین ښکاره کړئ"}
            </button>
          </div>
        </div>
        {selectedExam && (
          <p className="text-xs text-muted-foreground">
            {selectedExam.examTitle} · پیل: {formatShamsi(selectedExam.startDate)} · پای:{" "}
            {formatShamsi(selectedExam.endDate)}
          </p>
        )}
      </div>

      <FilterBar
        filters={filterDefs}
        defaultValues={{ academicYear: session || String(currentShamsiYear()) }}
        onApply={(newFilters) => {
          // Handle cascading: when type changes, reset exam and class
          if (newFilters.institutionType !== listFilters.institutionType) {
            setListFilters({ 
              ...newFilters, 
              examId: "", 
              classId: "" 
            });
          }
          // When exam changes, reset class
          else if (newFilters.examId !== listFilters.examId) {
            setListFilters({ 
              ...newFilters, 
              classId: "" 
            });
          }
          // Normal update
          else {
            setListFilters(newFilters);
          }
          setPage(1);
        }}
        onClear={() => {
          const y = session || String(currentShamsiYear());
          setListFilters({ academicYear: y });
          setPage(1);
        }}
      />

      <AgGridTable
        columnDefs={listColumnDefs}
        rowData={configs}
        loading={loading}
        serverSidePagination
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Subject Configuration Modal */}
      <ErpModal
        open={setupOpen}
        onOpenChange={(open) => {
          setSetupOpen(open);
          if (!open) {
            setSetupErrors({});
          }
        }}
        title="د مضامینو نمرې تنظیم کړئ"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSetupOpen(false)}
              className="text-sm border border-input rounded px-4 py-2 hover:bg-muted"
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handleSaveSetup}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded px-4 py-2 disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "ثبتیږي…" : "ټول خوندي کړئ"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            د هر مضمون لپاره ټولټال او د بریالیتوب نمرې ولیکئ. ټولټال نمرې باید د 0 او 100 تر منځ وي.
          </p>
          
          <div className="space-y-3">
            {subjectRows.map((row) => (
              <div
                key={row.subjectId}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border border-border rounded-md bg-muted/30"
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium">{row.subjectName}</span>
                </div>
                <F label="ټولټال نمرې" error={setupErrors[`${row.subjectId}`]}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    className={SEL}
                    value={row.totalMarks}
                    onChange={(e) => onSetupCellChange(row.subjectId, "totalMarks", e.target.value)}
                  />
                </F>
                <F label="د بریالیتوب نمرې" error={setupErrors[`${row.subjectId}`]}>
                  <input
                    type="number"
                    min="0"
                    placeholder="40"
                    className={SEL}
                    value={row.passingMarks}
                    onChange={(e) => onSetupCellChange(row.subjectId, "passingMarks", e.target.value)}
                  />
                </F>
              </div>
            ))}
          </div>

          {subjectRows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              د دې ټولګي لپاره مضامین ونه موندل شول
            </div>
          )}
        </div>
      </ErpModal>

      <ErpModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="تنظیم سمول"
        footer={
          <>
            <button type="button" onClick={() => setEditOpen(false)} className="text-xs border rounded px-3 py-1.5">لغوه</button>
            <button
              type="button"
              onClick={handleEditSave}
              disabled={editLoading}
              className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5"
            >
              {editLoading ? "ثبتیږي…" : "خوندي کړئ"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <F label="ټولټال نمرې" error={editErrors.form}>
            <input
              type="number"
              className={SEL}
              value={editForm.totalMarks}
              onChange={(e) => setEditForm((f) => ({ ...f, totalMarks: e.target.value }))}
            />
          </F>
          <F label="د بریالیتوب نمرې">
            <input
              type="number"
              className={SEL}
              value={editForm.passingMarks}
              onChange={(e) => setEditForm((f) => ({ ...f, passingMarks: e.target.value }))}
            />
          </F>
        </div>
      </ErpModal>

      {/* View Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د تنظیم معلومات"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setViewOpen(false)}
            className="text-sm border border-input rounded px-4 py-2 hover:bg-muted"
          >
            تړل
          </button>
        }
      >
        {viewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">امتحان</p>
                <p className="text-sm font-medium">{viewData.examTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تعلیمي کال</p>
                <p className="text-sm font-medium">{viewData.academicYear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">د امتحان پیل</p>
                <p className="text-sm font-medium">{formatShamsi(viewData.examStartDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د امتحان پای</p>
                <p className="text-sm font-medium">{formatShamsi(viewData.examEndDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ټولګی</p>
                <p className="text-sm font-medium">{viewData.className}{viewData.classSection ? ` (${viewData.classSection})` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د ادارې ډول</p>
                <p className="text-sm font-medium">
                  <Badge variant={INSTITUTION_TYPES.find(t => t.value === viewData.institutionType)?.variant || "muted"}>
                    {INSTITUTION_TYPES.find(t => t.value === viewData.institutionType)?.label || viewData.institutionType}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2">مضمون</p>
              <p className="text-base font-semibold">{viewData.subjectName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
              <div>
                <p className="text-xs text-muted-foreground">ټولټال نمرې</p>
                <p className="text-2xl font-bold text-primary">{viewData.totalMarks}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د بریالیتوب نمرې</p>
                <p className="text-2xl font-bold text-success">{viewData.passingMarks}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              <p>جوړ شوی: {new Date(viewData.createdAt).toLocaleString('fa-AF')}</p>
              <p>تازه شوی: {new Date(viewData.updatedAt).toLocaleString('fa-AF')}</p>
            </div>
          </div>
        )}
      </ErpModal>

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteLoading(true);
          try {
            await marksApi.deleteExamSubjectConfig(deleteId);
            toast.success("تنظیم ړنګ شو");
            setDeleteOpen(false);
            fetchList(page, listFilters);
          } catch (e) {
            toast.error(e.message);
          } finally {
            setDeleteLoading(false);
          }
        }}
        title="د امتحان مضمون تنظیم"
      />
    </div>
  );
}

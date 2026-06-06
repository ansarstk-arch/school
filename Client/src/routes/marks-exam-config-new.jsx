import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { FilterBar } from "@/components/erp/FilterBar";
import { ErpModal } from "@/components/erp/ErpModal";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { Settings2, Pencil, Trash2, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear, formatShamsi } from "@/lib/afghan-date";
import { useStore } from "@/store/useStore";
import * as marksApi from "@/data/marksApi";
import * as examApi from "@/data/examApi";
import { getAllClasses } from "@/data/classApi";
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
  
  // Setup form state - Default to current year
  const [academicYear] = useState(session || String(currentShamsiYear()));
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [setup, setSetup] = useState({
    examId: "",
    institutionType: "School",
    classId: "",
  });

  // Filter state for saved configurations table
  const [listFilters, setListFilters] = useState({ 
    academicYear: session || String(currentShamsiYear()) 
  });
  const [filterExams, setFilterExams] = useState([]);
  const [filterClasses, setFilterClasses] = useState([]);

  // Modal state for subject management
  const [manageOpen, setManageOpen] = useState(false);
  const [subjectRows, setSubjectRows] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Table state
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ totalMarks: "", passingMarks: "" });
  const [editId, setEditId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // View modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch exams when institution type changes
  useEffect(() => {
    const fetchExams = async () => {
      if (!setup.institutionType) return;
      try {
        const res = await examApi.getAllExams({
          academicYear,
          institutionType: setup.institutionType,
          limit: 200,
        });
        if (res.success) {
          setExams(res.data.exams || []);
        }
      } catch (e) {
        toast.error("د امتحانونو د ترلاسه کولو کې ستونزه");
      }
    };
    fetchExams();
  }, [setup.institutionType, academicYear]);

  // Fetch classes when institution type and exam are selected
  useEffect(() => {
    const fetchClasses = async () => {
      if (!setup.institutionType || !setup.examId) return;
      try {
        const res = await getAllClasses({
          type: setup.institutionType,
          academicYear,
          limit: 200,
        });
        if (res.success) {
          setClasses(res.data.classes || []);
        }
      } catch (e) {
        toast.error("د ټولګیو د ترلاسه کولو کې ستونزه");
      }
    };
    fetchClasses();
  }, [setup.institutionType, setup.examId, academicYear]);

  // Fetch filter exams when filter institution type changes
  useEffect(() => {
    const fetchFilterExams = async () => {
      if (!listFilters.institutionType) {
        setFilterExams([]);
        return;
      }
      try {
        const res = await examApi.getAllExams({
          academicYear: listFilters.academicYear || academicYear,
          institutionType: listFilters.institutionType,
          limit: 200,
        });
        if (res.success) {
          setFilterExams(res.data.exams || []);
        }
      } catch (e) {
        toast.error("د امتحانونو د ترلاسه کولو کې ستونزه");
      }
    };
    fetchFilterExams();
  }, [listFilters.institutionType, listFilters.academicYear, academicYear]);

  // Fetch filter classes when filter institution type and exam are selected
  useEffect(() => {
    const fetchFilterClasses = async () => {
      if (!listFilters.institutionType || !listFilters.examId) {
        setFilterClasses([]);
        return;
      }
      try {
        const res = await getAllClasses({
          type: listFilters.institutionType,
          academicYear: listFilters.academicYear || academicYear,
          limit: 200,
        });
        if (res.success) {
          setFilterClasses(res.data.classes || []);
        }
      } catch (e) {
        toast.error("د ټولګیو د ترلاسه کولو کې ستونزه");
      }
    };
    fetchFilterClasses();
  }, [listFilters.institutionType, listFilters.examId, listFilters.academicYear, academicYear]);

  // Fetch saved configurations for table
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await marksApi.getAllExamSubjectConfigs({
        ...listFilters,
        limit: 500,
      });
      if (res.success) {
        setConfigs(res.data.configs || []);
      }
    } catch (e) {
      toast.error("د تنظیماتو د ترلاسه کولو کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [listFilters]);

  // Load subjects when "Show Subjects" is clicked
  const loadSubjectsForSetup = async () => {
    if (!setup.examId || !setup.classId || !setup.institutionType) {
      toast.error("امتحان، ادارې ډول او ټولګی غوره کړئ");
      return;
    }
    
    setManageLoading(true);
    setManageOpen(true);
    
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
        
        if (rows.length === 0) {
          toast.info("د دې ټولګي لپاره مضامین ونه موندل شول");
        }
      }
    } catch (e) {
      toast.error(e.message || "د مضامینو د ترلاسه کولو کې ستونزه");
    } finally {
      setManageLoading(false);
    }
  };

  const validateConfig = (totalMarks, passingMarks) => {
    const total = Number(totalMarks);
    const passing = Number(passingMarks);
    if (!Number.isFinite(total) || total <= 0) return "ټولټال نمرې اړینې دي";
    if (!Number.isFinite(passing) || passing < 0) return "د بریالیتوب نمرې اړینې دي";
    if (passing > total) return "بریالیتوب نمرې د ټولټال څخه زیاتې نشي";
    return null;
  };

  // Save subject configurations
  const handleSaveSetup = async () => {
    const toSave = subjectRows.filter((r) => r.totalMarks !== "" && r.passingMarks !== "");
    
    if (toSave.length === 0) {
      toast.error("لږ تر لږه یو مضمون تنظیم کړئ");
      return;
    }
    
    // Validate all entries
    for (const row of toSave) {
      const err = validateConfig(row.totalMarks, row.passingMarks);
      if (err) {
        toast.error(`${row.subjectName}: ${err}`);
        return;
      }
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
        toast.success(res.message || "تنظیمات بریالي ثبت شول");
        setManageOpen(false);
        fetchConfigs(); // Refresh table
      }
    } catch (e) {
      toast.error(e.message || "د ثبتولو کې ستونزه");
    } finally {
      setSaving(false);
    }
  };

  const onSetupCellChange = (params) => {
    const { data, colDef, newValue } = params;
    setSubjectRows((prev) =>
      prev.map((r) =>
        r.subjectId === data.subjectId ? { ...r, [colDef.field]: newValue } : r
      )
    );
  };

  const openView = (row) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setEditForm({ 
      totalMarks: row.totalMarks, 
      passingMarks: row.passingMarks 
    });
    setEditOpen(true);
  };

  // Update configuration
  const handleEditSave = async () => {
    const err = validateConfig(editForm.totalMarks, editForm.passingMarks);
    if (err) {
      toast.error(err);
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
      fetchConfigs(); // Refresh table
    } catch (e) {
      toast.error(e.message || "د تازه کولو کې ستونزه");
    } finally {
      setEditLoading(false);
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
        headerName: "عملیات",
        width: 140,
        sortable: false,
        cellRenderer: (p) => (
          <div className="flex gap-1">
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-muted text-xs"
              title="کتل"
              onClick={() => openView(p.data)}
            >
              کتل
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-muted"
              title="سمول"
              onClick={() => openEdit(p.data)}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-muted text-destructive"
              title="ړنګول"
              onClick={() => {
                setDeleteId(p.data.id);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const selectedExam = useMemo(
    () => exams.find((e) => String(e.id) === String(setup.examId)),
    [exams, setup.examId]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="د امتحان مضامین تنظیم"
        subtitle={`تعلیمي کال ${academicYear} — د هر امتحان او ټولګي لپاره د مضامینو نمرې تنظیم کړئ`}
      />

      {/* Setup Form */}
      <div className="bg-card border border-border rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">د مضامینو تنظیم</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. First select Institution Type */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">۱. ادارې ډول</span>
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
          
          {/* 2. Then select Exam (disabled until type is selected) */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">۲. امتحان</span>
            <select
              className={SEL}
              value={setup.examId}
              onChange={(e) =>
                setSetup((s) => ({ ...s, examId: e.target.value, classId: "" }))
              }
              disabled={!setup.institutionType}
            >
              <option value="">امتحان غوره کړئ</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.examTitle}
                </option>
              ))}
            </select>
          </label>
          
          {/* 3. Finally select Class (disabled until exam is selected) */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">۳. ټولګی</span>
            <select
              className={SEL}
              value={setup.classId}
              onChange={(e) => setSetup((s) => ({ ...s, classId: e.target.value }))}
              disabled={!setup.examId}
            >
              <option value="">ټولګی غوره کړئ</option>
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
              disabled={!setup.examId || !setup.classId || manageLoading}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {manageLoading ? "لوډېږي…" : "مضامین ښکاره کړئ"}
            </button>
          </div>
        </div>
        
        {selectedExam && (
          <p className="text-xs text-muted-foreground">
            {selectedExam.examTitle} · پیل: {formatShamsi(selectedExam.startDate)} · پای: {formatShamsi(selectedExam.endDate)}
          </p>
        )}
      </div>

      {/* Saved Configurations Table */}
      <div className="space-y-3">
        <FilterBar
          filters={useMemo(
            () => [
              { key: "search", label: "لټون", type: "input", placeholder: "امتحان، مضمون…" },
              {
                key: "institutionType",
                label: "۱. ادارې ډول",
                type: "select",
                options: INSTITUTION_TYPES,
              },
              {
                key: "examId",
                label: "۲. امتحان",
                type: "select",
                options: filterExams.map((e) => ({
                  value: String(e.id),
                  label: e.examTitle,
                })),
                disabled: !listFilters.institutionType,
              },
              {
                key: "classId",
                label: "۳. ټولګی",
                type: "select",
                options: filterClasses.map((c) => ({
                  value: String(c.id),
                  label: `${c.name}${c.section ? ` (${c.section})` : ""}`,
                })),
                disabled: !listFilters.examId,
              },
              { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear" },
            ],
            [filterExams, filterClasses, listFilters.institutionType, listFilters.examId]
          )}
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
          }}
          onClear={() => {
            const y = session || String(currentShamsiYear());
            setListFilters({ academicYear: y });
          }}
        />
        
        <div className="bg-card border border-border rounded-md p-4">
          <p className="text-sm font-medium mb-3">ثبت شوي تنظیمات</p>
          <AgGridTable
            columnDefs={listColumnDefs}
            rowData={configs}
            loading={loading}
          />
        </div>
      </div>

      {/* Manage Modal - Shows when "Show Subjects" is clicked */}
      <ErpModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        title={`د مضامینو تنظیم - ${selectedExam?.examTitle || ""} - ${classes.find(c => String(c.id) === String(setup.classId))?.name || ""}`}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setManageOpen(false)}
              className="text-xs border rounded px-3 py-1.5"
              disabled={saving}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handleSaveSetup}
              disabled={saving || manageLoading}
              className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground rounded px-3 py-1.5"
            >
              <Save className="size-3" />
              {saving ? "ثبتیږي…" : "ټول خوندي کړئ"}
            </button>
          </>
        }
      >
        {manageLoading ? (
          <p className="text-sm text-muted-foreground">لوډېږي…</p>
        ) : subjectRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">د دې ټولګي لپاره مضامین ونه موندل شول</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              د هر مضمون لپاره ټولټال او د بریالیتوب نمرې ولیکئ
            </p>
            <AgGridTable
              columnDefs={[
                { field: "subjectName", headerName: "مضمون", flex: 1, editable: false },
                {
                  field: "totalMarks",
                  headerName: "ټولټال نمرې",
                  width: 140,
                  editable: true,
                  cellEditor: "agNumberCellEditor",
                },
                {
                  field: "passingMarks",
                  headerName: "د بریالیتوب نمرې",
                  width: 150,
                  editable: true,
                  cellEditor: "agNumberCellEditor",
                },
              ]}
              rowData={subjectRows}
              loading={manageLoading}
              enableInlineEdit
              onCellValueChanged={onSetupCellChange}
              getRowId={(p) => String(p.data?.subjectId)}
            />
          </>
        )}
      </ErpModal>

      {/* View Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د تنظیم معلومات"
        footer={
          <button
            type="button"
            onClick={() => setViewOpen(false)}
            className="text-xs border rounded px-3 py-1.5"
          >
            تړل
          </button>
        }
      >
        {viewData && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">امتحان</p>
                <p className="font-medium">{viewData.examTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تعلیمي کال</p>
                <p className="font-medium">{viewData.academicYear}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ټولګی</p>
                <p className="font-medium">{viewData.className}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">اداره</p>
                <p className="font-medium">
                  {INSTITUTION_TYPES.find((t) => t.value === viewData.institutionType)?.label || viewData.institutionType}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مضمون</p>
                <p className="font-medium">{viewData.subjectName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د امتحان پیل</p>
                <p className="font-medium">{formatShamsi(viewData.examStartDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ټولټال نمرې</p>
                <p className="font-medium text-lg">{viewData.totalMarks}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د بریالیتوب نمرې</p>
                <p className="font-medium text-lg">{viewData.passingMarks}</p>
              </div>
            </div>
          </div>
        )}
      </ErpModal>

      {/* Edit Modal */}
      <ErpModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="تنظیم سمول"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="text-xs border rounded px-3 py-1.5"
            >
              لغوه
            </button>
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

      <ConfirmDelete
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        loading={deleteLoading}
        onConfirm={async () => {
          setDeleteLoading(true);
          try {
            await marksApi.deleteExamSubjectConfig(deleteId);
            toast.success("تنظیم ړنګ شو");
            setDeleteOpen(false);
            fetchConfigs(); // Refresh table
          } catch (e) {
            toast.error(e.message);
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </div>
  );
}

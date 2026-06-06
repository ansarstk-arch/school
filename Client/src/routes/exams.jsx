import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, Calendar, Users } from "lucide-react";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as examApi from "@/data/examApi";
import { exportExamsToExcel } from "@/utils/excelExport";
import { exportExamsPDF } from "@/utils/pdfDownload";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const DEFAULT_SCHOOL_EXAM_TITLES = ["څلور نیمه", "سالانه"];
const isDefaultSchoolExam = (exam) =>
  exam?.institutionType === "School" && DEFAULT_SCHOOL_EXAM_TITLES.includes(exam?.examTitle);

const INSTITUTION_TYPES = [
  { value: "School",  label: "ښوونځی", variant: "info"    },
  { value: "Center",  label: "مرکز",   variant: "muted"   },
  { value: "Madrasa", label: "مدرسه",  variant: "warning" },
];

const STATUS_OPTIONS = [
  { value: "فعال",     label: "فعال",     variant: "success" },
  { value: "غیر فعال", label: "غیر فعال", variant: "destructive" },
];

const EMPTY_FORM = {
  examTitle: "",
  institutionType: "Center",
  assignedClasses: [],
  startDate: "",
  endDate: "",
  status: "فعال",
  academicYear: String(currentShamsiYear()),
};

// ─── Helper Functions ──────────────────────────────────────────────────────────
const getInstitutionLabel = (type) => INSTITUTION_TYPES.find(t => t.value === type)?.label || type;
const getInstitutionVariant = (type) => INSTITUTION_TYPES.find(t => t.value === type)?.variant || "muted";
const getStatusVariant = (status) => STATUS_OPTIONS.find(s => s.value === status)?.variant || "muted";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString('fa-AF');
  } catch {
    return dateStr;
  }
};

const validateForm = (form) => {
  const errors = {};
  
  if (!form.examTitle?.trim()) errors.examTitle = "د امتحان سرلیک اړین دی";
  if (!form.institutionType) errors.institutionType = "د ادارې ډول اړین دی";
  if (!form.assignedClasses?.length) errors.assignedClasses = "لږ تر لږه یوه ټولګي اړینه ده";
  if (!form.startDate) errors.startDate = "د پیل نېټه اړینه ده";
  if (!form.endDate) errors.endDate = "د پای نېټه اړینه ده";
  if (!form.status) errors.status = "حالت اړین دی";
  if (!form.academicYear) errors.academicYear = "تعلیمي کال اړین دی";
  
  // Date validation
  if (form.startDate && form.endDate) {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) {
      errors.endDate = "د پای نېټه باید د پیل نېټې څخه وروسته وي";
    }
  }
  
  return errors;
};

export default function ExamsPage() {
  // ─── State Management ────────────────────────────────────────────────────────
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [filters, setFilters] = useState({ academicYear: String(currentShamsiYear()) }); // Initialize with default year
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewExam, setViewExam] = useState(null);
  
  // Classes state
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────────
  const fetchExams = async (pageNum = page, filterParams = filters) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 10, ...filterParams };
      const response = await examApi.getAllExams(params);
      
      if (response.success) {
        setExams(response.data.exams || []);
        setPagination(response.data.pagination || { total: 0, totalPages: 1, page: pageNum, limit: 10 });
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("د امتحاناتو د ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesByInstitution = async (institutionType, academicYear) => {
    if (!institutionType || !academicYear) return;
    
    setClassesLoading(true);
    try {
      const response = await examApi.getClassesByInstitution(institutionType, academicYear);
      if (response.success) {
        setAvailableClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("د ټولګیو د ترلاسه کولو کې تېروتنه");
      setAvailableClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  // ─── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchExams(page, filters);
  }, [filters, page]);

  useEffect(() => {
    if (form.institutionType && form.academicYear) {
      fetchClassesByInstitution(form.institutionType, form.academicYear);
    }
  }, [form.institutionType, form.academicYear]);

  // ─── Form Handlers ────────────────────────────────────────────────────────────
  const setF = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = async (exam) => {
    setForm({
      examTitle: exam.examTitle,
      institutionType: exam.institutionType,
      assignedClasses: exam.assignedClasses || [],
      startDate: exam.startDate,
      endDate: exam.endDate,
      status: exam.status,
      academicYear: exam.academicYear,
    });
    setErrors({});
    setEditingId(exam.id);
    setFormOpen(true);
  };

  const openViewModal = (exam) => {
    setViewExam(exam);
    setViewOpen(true);
  };

  const handleSave = async () => {
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setFormLoading(true);
    try {
      const examData = {
        ...form,
        examTitle: form.examTitle.trim(),
      };

      if (editingId) {
        await examApi.updateExam(editingId, examData);
        toast.success("امتحان بریالي تازه شو");
      } else {
        await examApi.createExam(examData);
        toast.success("امتحان بریالي ثبت شو");
      }

      setFormOpen(false);
      fetchExams();
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error(error.message || "د امتحان د ثبتولو کې تېروتنه");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    try {
      await examApi.deleteExam(deleteId);
      toast.success("امتحان بریالي ړنګ شو");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("د امتحان د ړنګولو کې تېروتنه");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Table Configuration ──────────────────────────────────────────────────────
  const columnDefs = useMemo(() => [
    {
      field: "examTitle",
      headerName: "د امتحان سرلیک",
      flex: 1.5,
      minWidth: 200,
      cellRenderer: (params) => (
        <div className="font-medium text-foreground">{params.value}</div>
      ),
    },
    {
      field: "institutionType",
      headerName: "د ادارې ډول",
      width: 120,
      cellRenderer: (params) => (
        <Badge variant={getInstitutionVariant(params.value)}>
          {getInstitutionLabel(params.value)}
        </Badge>
      ),
    },
    {
      field: "assignedClasses",
      headerName: "ټولګي",
      width: 100,
      cellRenderer: (params) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="size-3" />
          <span className="text-xs">{params.value?.length || 0}</span>
        </div>
      ),
    },
    {
      field: "startDate",
      headerName: "د پیل نېټه",
      width: 120,
      cellRenderer: (params) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(params.value)}
        </div>
      ),
    },
    {
      field: "endDate",
      headerName: "د پای نېټه",
      width: 120,
      cellRenderer: (params) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(params.value)}
        </div>
      ),
    },
    {
      field: "status",
      headerName: "حالت",
      width: 100,
      cellRenderer: (params) => (
        <Badge variant={getStatusVariant(params.value)}>
          {params.value}
        </Badge>
      ),
    },
    {
      field: "academicYear",
      headerName: "تعلیمي کال",
      width: 100,
      cellRenderer: (params) => (
        <div className="text-xs text-muted-foreground">{params.value}</div>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const isDefault = isDefaultSchoolExam(params.data);
        return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openViewModal(params.data)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="کتل"
          >
            <Eye className="size-3.5" />
          </button>
          {!isDefault && (
            <>
              <button
                onClick={() => openEditForm(params.data)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="سمول"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setDeleteId(params.data.id);
                  setDeleteOpen(true);
                }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                title="ړنګول"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
        );
      },
    },
  ], []);

  // ─── Filter Configuration ─────────────────────────────────────────────────────
  const filterConfig = [
    {
      key: "examTitle",
      label: "د امتحان سرلیک",
      type: "input",
      placeholder: "د امتحان سرلیک لټون...",
    },
    {
      key: "institutionType",
      label: "د ادارې ډول",
      type: "select",
      options: INSTITUTION_TYPES.map(t => ({ value: t.value, label: t.label })),
    },
    {
      key: "status",
      label: "حالت",
      type: "select",
      options: STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label })),
    },
    {
      key: "academicYear",
      label: "تعلیمي کال",
      type: "shamsiYear",
      placeholder: "تعلیمي کال",
    },
  ];

  // ─── Export Functions ─────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      await exportExamsToExcel(exams, filters);
      toast.success("د Excel فایل بریالي ډاونلوډ شو");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("د Excel د ډاونلوډ کې تېروتنه");
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportExamsPDF(exams, filters);
      toast.success("د PDF فایل بریالي ډاونلوډ شو");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("د PDF د ډاونلوډ کې تېروتنه");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="د امتحاناتو مدیریت"
        subtitle="د امتحاناتو جوړول، سمول او مدیریت"
        actions={
          <button
            onClick={openCreateForm}
            className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            نوی امتحان
          </button>
        }
      />

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        defaultValues={{ academicYear: String(currentShamsiYear()) }}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
        onClear={(cleared) => {
          setFilters(cleared || { academicYear: String(currentShamsiYear()) });
          setPage(1);
        }}
      />

      {/* Data Table */}
      <AgGridTable
        columnDefs={columnDefs}
        rowData={exams}
        loading={loading}
        emptyText="هیڅ امتحان ونه موندل شو"
        searchPlaceholder="د امتحان سرلیک لټون..."
        pagination={true}
        serverSidePagination={true}
        pageSize={pagination.limit || 10}
        currentPage={page}
        totalPages={pagination.totalPages}
        totalRows={pagination.total}
        onPageChange={setPage}
        enableRtl={true}
        enableExport={true}
        onExportClick={handleExportExcel}
        onPdfClick={handleExportPDF}
        exportFileName="exams"
      />

      {/* Create/Edit Modal */}
      <ErpModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? "امتحان سمول" : "نوی امتحان"}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setFormOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted transition-colors"
              disabled={formLoading}
            >
              لغوه
            </button>
            <button
              onClick={handleSave}
              disabled={formLoading}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {formLoading ? "ثبتیږي..." : editingId ? "تازه کول" : "ثبتول"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Exam Title */}
          <F label="د امتحان سرلیک" error={errors.examTitle}>
            <Input
              value={form.examTitle}
              onChange={(e) => setF("examTitle", e.target.value)}
              placeholder="د امتحان سرلیک ولیکئ..."
              className={errors.examTitle ? "border-destructive" : ""}
            />
          </F>

          {/* Institution Type & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="د ادارې ډول" error={errors.institutionType}>
              <select
                value={form.institutionType}
                onChange={(e) => setF("institutionType", e.target.value)}
                className={`${SEL} ${errors.institutionType ? "border-destructive" : ""}`}
              >
                {INSTITUTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </F>

            <F label="تعلیمي کال" error={errors.academicYear}>
              <ShamsiYearPicker
                value={form.academicYear}
                onChange={(year) => setF("academicYear", year)}
                className={errors.academicYear ? "border-destructive" : ""}
              />
            </F>
          </div>

          {/* Assigned Classes */}
          <F label="ټاکل شوې ټولګي" error={errors.assignedClasses}>
            <div className="border border-input rounded p-3 bg-background min-h-[100px]">
              {classesLoading ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  ټولګي بارېږي...
                </div>
              ) : availableClasses.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  د دې ادارې لپاره ټولګي ونه موندل شول
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableClasses.map(cls => (
                    <label key={cls.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.assignedClasses.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setF("assignedClasses", [...form.assignedClasses, cls.id]);
                          } else {
                            setF("assignedClasses", form.assignedClasses.filter(id => id !== cls.id));
                          }
                        }}
                        className="rounded border-input"
                      />
                      <span>{cls.name} {cls.section && `- ${cls.section}`}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {errors.assignedClasses && (
              <span className="text-[11px] text-destructive mt-0.5">{errors.assignedClasses}</span>
            )}
          </F>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="د پیل نېټه" error={errors.startDate}>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setF("startDate", e.target.value)}
                className={errors.startDate ? "border-destructive" : ""}
              />
            </F>

            <F label="د پای نېټه" error={errors.endDate}>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setF("endDate", e.target.value)}
                className={errors.endDate ? "border-destructive" : ""}
              />
            </F>
          </div>

          {/* Status */}
          <F label="حالت" error={errors.status}>
            <select
              value={form.status}
              onChange={(e) => setF("status", e.target.value)}
              className={`${SEL} ${errors.status ? "border-destructive" : ""}`}
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </F>
        </div>
      </ErpModal>

      {/* Delete Confirmation */}
      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="امتحان ړنګول"
        subtitle="ایا تاسو ډاډه یاست چې غواړئ دا امتحان ړنګ کړئ؟ دا عمل د بیرته راګرځولو وړ نه دی."
      />

      {/* View Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د امتحان تفصیلات"
        size="lg"
        footer={
          <button
            onClick={() => setViewOpen(false)}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity"
          >
            تړل
          </button>
        }
      >
        {viewExam && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">د امتحان سرلیک</label>
                <div className="font-medium text-foreground">{viewExam.examTitle}</div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">د ادارې ډول</label>
                <Badge variant={getInstitutionVariant(viewExam.institutionType)}>
                  {getInstitutionLabel(viewExam.institutionType)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">تعلیمي کال</label>
                <div className="text-sm text-muted-foreground">{viewExam.academicYear}</div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">حالت</label>
                <Badge variant={getStatusVariant(viewExam.status)}>
                  {viewExam.status}
                </Badge>
              </div>
            </div>

            {/* Date Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">د پیل نېټه</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{formatDate(viewExam.startDate)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">د پای نېټه</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{formatDate(viewExam.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Assigned Classes */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">ټاکل شوې ټولګي</label>
              <div className="border border-input rounded p-3 bg-muted/30">
                {viewExam.assignedClasses && viewExam.assignedClasses.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm">
                      {viewExam.assignedClasses.length} ټولګي ټاکل شوي
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {viewExam.assignedClasses.map((classId, index) => (
                        <Badge key={classId} variant="outline" className="text-xs">
                          ټولګي #{classId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">هیڅ ټولګي ونه ټاکل شول</div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">د جوړولو نېټه</label>
                <div className="text-xs text-muted-foreground">
                  {viewExam.createdAt ? formatDate(viewExam.createdAt) : "-"}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">د وروستي بدلون نېټه</label>
                <div className="text-xs text-muted-foreground">
                  {viewExam.updatedAt ? formatDate(viewExam.updatedAt) : "-"}
                </div>
              </div>
            </div>
          </div>
        )}
      </ErpModal>
    </div>
  );
}

import { PageHeader } from "@/components/erp/PageHeader";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Upload, X, UserX, UserCheck } from "lucide-react";
import { ImageLightbox } from "@/components/erp/ImageLightbox";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { ConfirmStatus } from "@/components/erp/ConfirmStatus";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as studentApi from "@/data/studentApi";
import { getAllClasses } from "@/data/classApi";
import { exportStudentsToExcel } from "@/utils/excelExport";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
const imgUrl = (path) => path ? `${API_BASE}/uploads/${path}` : null;

// API function to get classes by type and year
const getClassesByTypeAndYear = async (type, academicYear) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/students/classes-by-type?type=${type}&academicYear=${academicYear}`);
  if (!response.ok) throw new Error('Failed to fetch classes');
  return response.json();
};

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const ENROLL_TYPES = [
  { value: "School",  label: "ښوونځی", variant: "info"    },
  { value: "Center",  label: "سینټر",   variant: "muted"   },
  { value: "Madrasa", label: "مدرسه",  variant: "warning" },
];

const EMPTY_FORM = {
  fullName: "", fatherName: "", grandFatherName: "", maternalUncleName: "", parentNumber1: "",
  rollNumber: "", idCardNumber: "", dob: "", gender: "Male", 
  address: "", parentNumber2: "", academicYear: String(currentShamsiYear()),
  enrollments: [], classes: { School: "", Center: "", Madrasa: "" },
  fees: { School: "", Center: "", Madrasa: "" }, registrationFee: "", image: null, removeImage: false
};
// ─── Image Upload Field ────────────────────────────────────────────────────────
function ImageUploadField({ currentImage, onFileChange, onRemove }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (currentImage && !preview) setPreview(imgUrl(currentImage));
  }, [currentImage]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    onRemove();
  };

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <div className="relative shrink-0">
          <img src={preview} alt="" className="w-16 h-16 rounded-full object-cover border border-border" />
          <button type="button" onClick={handleRemove}
            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5">
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-dashed border-border shrink-0">
          <Upload className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">د زده کوونکي انځور (اختیاري)</span>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="text-xs border border-input rounded px-2.5 py-1 hover:bg-muted w-fit">
          انځور غوره کول
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP · اعظمي ۵MB</span>
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────
const validateStudent = (data) => {
  const errors = {};
  const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
  const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;

  if (!data.fullName?.trim()) {
    errors.fullName = "بشپړ نوم اړین دی";
  } else if (!nameRegex.test(data.fullName)) {
    errors.fullName = "نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.fullName.length < 2 || data.fullName.length > 100) {
    errors.fullName = "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (!data.fatherName?.trim()) {
    errors.fatherName = "د پلار نوم اړین دی";
  } else if (!nameRegex.test(data.fatherName)) {
    errors.fatherName = "د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.fatherName.length < 2 || data.fatherName.length > 100) {
    errors.fatherName = "د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  // Check if enrollments array exists and has at least one item
  if (!Array.isArray(data.enrollments) || data.enrollments.length === 0) {
    errors.enrollments = "لږ تر لږه یو ډول وټاکئ";
  } else {
    // Validate that each enrollment has a class selected
    data.enrollments.forEach((type) => {
      if (!data.classes?.[type] || data.classes[type] === "") {
        errors[`class_${type}`] = `د ${ENROLL_TYPES.find(t => t.value === type)?.label} لپاره ټولګی وټاکئ`;
      }
    });
  }

  if (!data.parentNumber1?.trim()) {
    errors.parentNumber1 = "د والد نمبر ۱ اړین دی";
  } else if (!phoneRegex.test(data.parentNumber1)) {
    errors.parentNumber1 = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (data.parentNumber2 && !phoneRegex.test(data.parentNumber2)) {
    errors.parentNumber2 = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (data.idCardNumber && (data.idCardNumber.length < 5 || data.idCardNumber.length > 20)) {
    errors.idCardNumber = "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي";
  }

  if (data.address && data.address.length > 200) {
    errors.address = "پته باید د ۲۰۰ توري څخه لږه وي";
  }

  return errors;
};

export default function StudentsPage() {
  const { allowedInstitutions } = usePermissions();
  const visibleEnrollTypes = ENROLL_TYPES.filter((t) => allowedInstitutions.includes(t.value));
  const [students, setStudents] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ academicYear: String(currentShamsiYear()) }); // Initialize with default year
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });
  const [classesByType, setClassesByType] = useState({ School: [], Center: [], Madrasa: [] });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const studentFilters = useMemo(() => [
    { key: "id", label: "د زده کوونکي ID", type: "number", placeholder: "ID..." },
    { key: "fullName", label: "نوم", type: "input", placeholder: "نوم، د پلار نوم..." },
    { key: "enrollmentType", label: "ډول", type: "select", options: visibleEnrollTypes.map((t) => ({ value: t.value, label: t.label })) },
    { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
    { key: "status", label: "حالت", type: "select", options: [
      { value: "active", label: "فعال" },
      { value: "inactive", label: "غیر فعال" },
    ]},
  ], [visibleEnrollTypes]);

  // Fetch classes for allowed institution types and academic year
  const fetchClassesByType = async (year = form.academicYear || String(currentShamsiYear())) => {
    try {
      const types = allowedInstitutions.length > 0 ? allowedInstitutions : ["School", "Center", "Madrasa"];
      const classesData = { School: [], Center: [], Madrasa: [] };

      await Promise.all(
        types.map(async (type) => {
          const response = await getAllClasses({ type, academicYear: year, limit: 200 });
          classesData[type] = response.data?.classes || [];
        })
      );

      setClassesByType(classesData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getAllStudents({ ...filters, page, limit: 10 });
      setStudents(response.data.students || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(error.message || "د زده کوونکو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesByType(filters.academicYear || String(currentShamsiYear()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedInstitutions, filters.academicYear]);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    const openId = searchParams.get("openId");
    const openView = searchParams.get("openView");
    if (openId && openView) {
      setFilters((prev) => ({ ...prev, id: openId }));
      loadStudentView(Number(openId));
      searchParams.delete("openId");
      searchParams.delete("openView");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const setFee = (type, v) => setForm((f) => ({ ...f, fees: { ...f.fees, [type]: v } }));
  const setClass = (type, v) => {
    setForm((f) => {
      const updatedForm = { ...f, classes: { ...f.classes, [type]: v } };
      
      // Auto-populate fee from selected class
      if (v) {
        const classList = classesByType[type] || [];
        const selectedClass = classList.find(cls => cls.id === Number(v));
        if (selectedClass && selectedClass.monthlyFee) {
          updatedForm.fees = { ...updatedForm.fees, [type]: String(selectedClass.monthlyFee) };
        }
      }
      
      return updatedForm;
    });
    
    if (errors[`class_${type}`]) setErrors((e) => ({ ...e, [`class_${type}`]: undefined }));
  };

  const toggleEnrollment = (type) => {
    const current = form.enrollments || [];
    const updated = current.includes(type) ? current.filter(e => e !== type) : [...current, type];
    setF("enrollments", updated);
    
    // Clear enrollment error when user selects at least one
    if (updated.length > 0 && errors.enrollments) {
      setErrors((e) => ({ ...e, enrollments: undefined }));
    }
  };

  const openNew = () => {
    const defaultEnrollments = visibleEnrollTypes.length > 0 ? [visibleEnrollTypes[0].value] : [];
    const year = String(currentShamsiYear());
    fetchClassesByType(year);
    setForm({ ...EMPTY_FORM, academicYear: year, enrollments: defaultEnrollments });
    setErrors({});
    setImageFile(null);
    setIsEditing(false);
    setFormOpen(true);
  };

  const openEdit = (s) => {
    // Transform enrollments array to match form structure
    const enrollments = s.enrollments?.map(e => e.type) || ["School"];
    const classes = {};
    const fees = {};
    
    s.enrollments?.forEach(e => {
      classes[e.type] = s.classId; // You may need to adjust this based on your data structure
      fees[e.type] = e.fee;
    });

    setForm({ 
      ...EMPTY_FORM, 
      ...s, 
      parentNumber1: s.parentNumber1 || s.phone || "",
      parentNumber2: s.parentNumber2 || s.emergencyContact || "",
      enrollments,
      classes,
      fees,
      removeImage: false 
    });
    setErrors({});
    setImageFile(null);
    setIsEditing(true);
    setFormOpen(true);
  };

  const loadStudentView = async (id) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const response = await studentApi.getStudentById(id);
      setSelected(response.data.student);
    } catch (error) {
      toast.error(error.message || "د زده کوونکي معلومات ترلاسه نه شول");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openView = (s) => loadStudentView(s.id);
  const openDelete = (s) => { setSelected(s); setDeleteOpen(true); };

  const openToggleStatus = (s) => { setStatusTarget(s); setStatusOpen(true); };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === "inactive" ? "active" : "inactive";
    try {
      await studentApi.toggleStudentStatus(statusTarget.id, newStatus);
      toast.success(newStatus === "active" ? "زده کوونکی فعال شو" : "زده کوونکی غیر فعال شو");
      fetchStudents();
    } catch (error) {
      toast.error(error.message || "د حالت بدلولو کې تېروتنه");
    }
  };

  const handleSave = async () => {
    const validationErrors = validateStudent(form);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const { image: _img, removeImage, ...studentData } = form;
      
      if (isEditing && form.id) {
        await studentApi.updateStudent(form.id, { ...studentData, removeImage: form.removeImage }, imageFile);
        toast.success("زده کوونکی بریالیتوب سره تازه شو");
      } else {
        await studentApi.createStudent(studentData, imageFile);
        toast.success("زده کوونکی بریالیتوب سره ثبت شو");
      }
      
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      setImageFile(null);
      setIsEditing(false);
      
      if (page === 1) {
        await fetchStudents();
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error(error.message || "د زده کوونکي په ثبتولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async () => {
    if (!selected) return;
    
    try {
      setLoading(true);
      await studentApi.deleteStudent(selected.id);
      toast.success("زده کوونکی بریالیتوب سره ړنګ شو");
      setDeleteOpen(false);
      setSelected(null);
      
      if (page === 1) {
        await fetchStudents();
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error(error.message || "په ړنګولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Export students to Excel
  const handleExportStudents = async () => {
    try {
      setExportLoading(true);
      const currentYear = String(currentShamsiYear());
      const exportFilters = Object.keys(filters).length > 0 ? filters : { academicYear: currentYear };
      const response = await studentApi.getAllStudents({ ...exportFilters, page: 1, limit: 10000 });
      const allStudents = response.data.students || [];
      
      if (allStudents.length === 0) {
        toast.error("د صادرولو لپاره هیڅ زده کوونکی شتون نلري");
        return;
      }

      await exportStudentsToExcel(allStudents);
      toast.success(`${allStudents.length} زده کوونکي بریالیتوب سره صادر شول`);
    } catch (error) {
      console.error("Error exporting students:", error);
      toast.error(error.message || "د صادرولو په وخت کې تېروتنه");
    } finally {
      setExportLoading(false);
    }
  };

  const AttendanceBlock = ({ label, stats }) => (
    <div>
      <p className="text-[11px] text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-muted/50 rounded text-center">
          <p className="text-xs text-muted-foreground">حاضر</p>
          <p className="text-base font-semibold text-green-700 dark:text-green-400">{stats?.present || 0}</p>
        </div>
        <div className="p-2 bg-muted/50 rounded text-center">
          <p className="text-xs text-muted-foreground">غیر حاضر</p>
          <p className="text-base font-semibold text-red-700 dark:text-red-400">{stats?.absent || 0}</p>
        </div>
        <div className="p-2 bg-muted/50 rounded text-center">
          <p className="text-xs text-muted-foreground">رخصتي</p>
          <p className="text-base font-semibold">{stats?.leave || 0}</p>
        </div>
        <div className="p-2 bg-muted/50 rounded text-center">
          <p className="text-xs text-muted-foreground">ټول</p>
          <p className="text-base font-semibold">{stats?.totalDays || 0}</p>
        </div>
      </div>
    </div>
  );

  // AG Grid columns
  const columnDefs = useMemo(() => [
    { field: "fullName", headerName: "نوم", flex: 1.2, minWidth: 150 },
    { field: "fatherName", headerName: "د پلار نوم", flex: 1.1, minWidth: 140, hideOnMobile: true },
    { 
      field: "enrollments", 
      headerName: "ډول", 
      flex: 1, 
      minWidth: 120,
      hideOnMobile: true,
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "—";
        return params.value.map(e => {
          const t = ENROLL_TYPES.find((t) => t.value === e.type);
          return t?.label ?? e.type;
        }).join(', ');
      },
      cellRenderer: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "—";
        return (
          <span className="flex gap-1 flex-wrap">
            {params.value.map((e) => {
              const t = ENROLL_TYPES.find((t) => t.value === e.type);
              return <Badge key={e.type} variant={t?.variant ?? "muted"}>{t?.label ?? e.type}</Badge>;
            })}
          </span>
        );
      }
    },
    {
      field: "className",
      headerName: "ټولګی",
      flex: 1.1,
      minWidth: 140,
      valueGetter: (params) => {
        const row = params.data;
        if (!row?.className) return "—";
        return row.className;
      },
    },
    { 
      field: "actions", 
      headerName: "", 
      flex: 0.8, 
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const s = params.data;
        return (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); openView(s); }} title="کتل" className="p-1.5 rounded hover:bg-muted text-muted-foreground">
              <Eye className="size-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} title="سمول" className="p-1.5 rounded hover:bg-muted text-muted-foreground">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); openToggleStatus(s); }} title={s.status === "inactive" ? "فعالول" : "غیر فعالول"} className={`p-1.5 rounded hover:bg-muted ${s.status === "inactive" ? "text-success" : "text-warning"}`}>
              {s.status === "inactive" ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); openDelete(s); }} title="ړنګول" className="p-1.5 rounded hover:bg-muted text-destructive">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      }
    },
  ], []);

  const DV = ({ label, value }) => (
    <div><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-medium">{value || "—"}</p></div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="زده کوونکي" subtitle="د زده کوونکو لیست او اداره"
        actions={
          <button onClick={openNew} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="size-3.5" /> نوی زده کوونکی
          </button>
        }
      />

      <FilterBar 
        filters={studentFilters}
        defaultValues={{ academicYear: String(currentShamsiYear()) }}
        onApply={(f) => { setFilters(f); setPage(1); }}
        onClear={(cleared) => { setFilters(cleared || { academicYear: String(currentShamsiYear()) }); setPage(1); }}
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={students}
        loading={loading}
        emptyText="هیڅ زده کوونکی ونه موندل شو"
        searchPlaceholder="د زده کوونکي نوم، ټېلیفون..."
        serverSidePagination={true}
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableRtl={true}
        enableExport={true}
        exportFileName="students"
        onExportClick={handleExportStudents}
        exportLoading={exportLoading}
      />

      {/* View Modal */}
      <ErpModal open={viewOpen} onOpenChange={setViewOpen} title="د زده کوونکي معلومات" size="lg"
        footer={<button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {viewLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
        ) : selected ? (
          <div className="space-y-4">
            {/* Profile Section */}
            <div className="flex gap-4 pb-4 border-b border-border">
              {/* Details - Left side */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DV label="بشپړ نوم" value={selected.fullName} />
                <DV label="د پلار نوم" value={selected.fatherName} />
                <DV label="د نیکه نوم" value={selected.grandFatherName} />
                <DV label="د ماما نوم" value={selected.maternalUncleName} />
                <DV label="تذکیره نمبر" value={selected.idCardNumber} />
                <DV label="جنسیت" value={selected.gender === "Male" ? "نر" : "ښځینه"} />
                <DV label="د زیږیدنې نیټه" value={selected.dob || "—"} />
                <DV label="عمر" value={selected.age != null ? `${selected.age} کاله` : "—"} />
                <DV label="د والد نمبر ۱" value={selected.parentNumber1 || selected.phone} />
                <DV label="د والد نمبر ۲" value={selected.parentNumber2 || selected.emergencyContact} />
                <DV label="تعلیمي کال" value={selected.academicYear} />
              </div>
              
              {/* Profile image - Right side */}
              {selected.image && (
                <div className="shrink-0">
                  <img
                    src={imgUrl(selected.image)}
                    alt={selected.fullName}
                    className="w-32 h-40 rounded-md object-cover border-2 border-border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setLightboxImage(imgUrl(selected.image));
                      setLightboxOpen(true);
                    }}
                    title="د لویولو لپاره کلیک وکړئ"
                  />
                </div>
              )}
            </div>

            {/* Enrollment Section */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">د شمولیت ډول او فیسونه</p>
              <div className="space-y-2">
                {selected.enrollments?.map((e) => {
                  const t = ENROLL_TYPES.find((t) => t.value === e.type);
                  return (
                    <div key={e.type} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <Badge variant={t?.variant}>{t?.label}</Badge>
                      <span className="text-sm font-medium">AFN {e.fee || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selected.attendanceStats && (
              <div className="space-y-3">
                <AttendanceBlock label="ورځنۍ حاضري" stats={selected.attendanceStats.daily} />
                <AttendanceBlock label="اونیزه حاضري" stats={selected.attendanceStats.weekly} />
                <AttendanceBlock label="میاشتنۍ حاضري" stats={selected.attendanceStats.monthly} />
              </div>
            )}

            {/* Fee Details */}
            {selected.feeDetails && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">د دې میاشتې فیس تفصیل</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 bg-muted/50 rounded text-center">
                    <p className="text-xs text-muted-foreground">ټول فیس</p>
                    <p className="text-lg font-semibold">{selected.feeDetails.thisMonthAmount} AFN</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded text-center">
                    <p className="text-xs text-green-700 dark:text-green-400">ورکړل شوی</p>
                    <p className="text-lg font-semibold text-green-700 dark:text-green-400">{selected.feeDetails.thisMonthPaid} AFN</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded text-center">
                    <p className="text-xs text-red-700 dark:text-red-400">پاتې</p>
                    <p className="text-lg font-semibold text-red-700 dark:text-red-400">{selected.feeDetails.thisMonthRemaining} AFN</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded text-center">
                    <p className="text-xs text-blue-700 dark:text-blue-400">حالت</p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {selected.feeDetails.thisMonthStatus === 'Paid' ? 'ورکړل شوی' : 
                       selected.feeDetails.thisMonthStatus === 'Partial' ? 'جزوي' : 'نه ورکړل شوی'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DV label="د ثبت نام فیس" value={selected.registrationFee ? `AFN ${selected.registrationFee}` : "—"} />
              <DV label="پته" value={selected.address} />
            </div>
          </div>
        ) : null}
      </ErpModal>

      {/* ── Image Lightbox ─────────────────────────────────────────────── */}
      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={lightboxImage}
        alt={selected?.fullName || ""}
      />

      {/* Form Modal */}
      <ErpModal open={formOpen} onOpenChange={setFormOpen} title={isEditing ? "زده کوونکی سمول" : "زده کوونکی ثبتول"} size="lg"
        footer={<>
          <button onClick={() => setFormOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>لغوه</button>
          <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
            {loading ? "...په ثبتیدو کې" : "ثبتول"}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="بشپړ نوم" error={errors.fullName}>
            <Input value={form.fullName} handleChanges={(e) => setF("fullName", e.target.value)} placeholder="بشپړ نوم" />
          </F>
          <F label="د پلار نوم" error={errors.fatherName}>
            <Input value={form.fatherName} handleChanges={(e) => setF("fatherName", e.target.value)} placeholder="د پلار نوم" />
          </F>
          <F label="د نیکه نوم" opt error={errors.grandFatherName}>
            <Input value={form.grandFatherName} handleChanges={(e) => setF("grandFatherName", e.target.value)} placeholder="د نیکه نوم" />
          </F>
          <F label="د ماما نوم" opt error={errors.maternalUncleName}>
            <Input value={form.maternalUncleName} handleChanges={(e) => setF("maternalUncleName", e.target.value)} placeholder="د ماما نوم" />
          </F>
          <F label="تذکیره نمبر" opt error={errors.idCardNumber}>
            <Input value={form.idCardNumber} handleChanges={(e) => setF("idCardNumber", e.target.value)} placeholder="تذکیره نمبر" />
          </F>
          <F label="جنسیت">
            <select value={form.gender} onChange={(e) => setF("gender", e.target.value)} className={SEL}>
              <option value="Male">نر</option>
              <option value="Female">ښځینه</option>
            </select>
          </F>
          <F label="د زېږېدنې نېټه" opt>
            <Input type="date" value={form.dob} handleChanges={(e) => setF("dob", e.target.value)} />
          </F>
          <F label="د والد نمبر ۱" error={errors.parentNumber1}>
            <Input value={form.parentNumber1} handleChanges={(e) => setF("parentNumber1", e.target.value)} placeholder="+93 7XX XXX XXX" />
          </F>
          <F label="د والد نمبر ۲" opt error={errors.parentNumber2}>
            <Input value={form.parentNumber2} handleChanges={(e) => setF("parentNumber2", e.target.value)} placeholder="+93 7XX XXX XXX" />
          </F>
          <F label="پته" opt error={errors.address}>
            <Input value={form.address} handleChanges={(e) => setF("address", e.target.value)} placeholder="ولایت، ښار" />
          </F>
          <F label="د ثبت نام فیس" opt>
            <Input type="number" value={form.registrationFee} handleChanges={(e) => setF("registrationFee", e.target.value)} placeholder="0" />
          </F>

          <div className="col-span-2">
            <ImageUploadField
              currentImage={isEditing ? form.image : null}
              onFileChange={(file) => { setImageFile(file); setF("removeImage", false); }}
              onRemove={() => { setImageFile(null); setF("removeImage", true); setF("image", null); }}
            />
          </div>

          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1.5">د شمولیت ډول</span>
            <div className="flex gap-2">
              {visibleEnrollTypes.map(({ value, label }) => {
                const active = Array.isArray(form.enrollments) && form.enrollments.includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleEnrollment(value)}
                    className={`flex-1 py-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${active ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted text-foreground"}`}>
                    {active && <span className="size-1.5 rounded-full bg-primary-foreground inline-block" />}{label}
                  </button>
                );
              })}
            </div>
            {errors.enrollments && <p className="text-[11px] text-destructive mt-1">{errors.enrollments}</p>}
          </div>

          {form.enrollments && form.enrollments.length > 0 && form.enrollments.filter((type) => allowedInstitutions.includes(type)).map((type) => {
            const t = ENROLL_TYPES.find((t) => t.value === type);
            const classList = classesByType[type] || [];
            return (
              <div key={type} className="col-span-2 border border-border rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-medium text-foreground">{t?.label} - معلومات</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <F label="ټولګی">
                      <select value={form.classes[type] || ""} onChange={(e) => setClass(type, e.target.value)} className={SEL}>
                        <option value="">— ټولګی وټاکئ —</option>
                        {classList.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                          </option>
                        ))}
                      </select>
                    </F>
                    {errors[`class_${type}`] && <p className="text-[11px] text-destructive mt-1">{errors[`class_${type}`]}</p>}
                  </div>
                  <div>
                    <F label="میاشتنی فیس">
                      <Input type="number" value={form.fees[type] || ""} handleChanges={(e) => setFee(type, e.target.value)} placeholder="0" />
                    </F>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ErpModal>

      <ConfirmStatus
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleToggleStatus}
        title={statusTarget?.fullName}
        subtitle={statusTarget?.fatherName}
        action={statusTarget?.status === "inactive" ? "activate" : "deactivate"}
      />

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title={selected?.fullName}
        subtitle={selected?.fatherName}
      />
    </div>
  );
}

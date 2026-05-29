import { PageHeader } from "@/components/erp/PageHeader";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Eye, Upload, X } from "lucide-react";
import { ImageLightbox } from "@/components/erp/ImageLightbox";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as studentApi from "@/data/studentApi";
import { getAllClasses } from "@/data/classApi";
import { exportStudentsToExcel } from "@/utils/excelExport";
import { exportStudentsPDF } from "@/utils/pdfDownload";
import { toast } from "sonner";

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
  { value: "Center",  label: "مرکز",   variant: "muted"   },
  { value: "Madrasa", label: "مدرسه",  variant: "warning" },
];

const EMPTY_FORM = {
  fullName: "", fatherName: "", grandFatherName: "", phone: "",
  rollNumber: "", idCardNumber: "", dob: "", gender: "Male", 
  address: "", emergencyContact: "", academicYear: String(currentShamsiYear()),
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

  if (data.phone && !phoneRegex.test(data.phone)) {
    errors.phone = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (data.emergencyContact && !phoneRegex.test(data.emergencyContact)) {
    errors.emergencyContact = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
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
  const [students, setStudents] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({});
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });
  const [classesByType, setClassesByType] = useState({ School: [], Center: [], Madrasa: [] });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Fetch classes for each type
  const fetchClassesByType = async () => {
    try {
      const types = ["School", "Center", "Madrasa"];
      const classesData = {};
      
      for (const type of types) {
        const response = await getAllClasses({ type, limit: 100 });
        classesData[type] = response.data.classes || [];
      }
      
      setClassesByType(classesData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getAllStudents({ ...filters, page, limit: 12 });
      setStudents(response.data.students || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 12 });
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(error.message || "د زده کوونکو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesByType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

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
    setForm({ ...EMPTY_FORM, academicYear: String(currentShamsiYear()), enrollments: [] });
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

  const openView = (s) => { setSelected(s); setViewOpen(true); };
  const openDelete = (s) => { setSelected(s); setDeleteOpen(true); };

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

  // Export students to PDF
  const handlePdfStudents = async () => {
    try {
      setPdfLoading(true);
      const currentYear = String(currentShamsiYear());
      const exportFilters = Object.keys(filters).length > 0 ? filters : { academicYear: currentYear };
      const response = await studentApi.getAllStudents({ ...exportFilters, page: 1, limit: 10000 });
      const allStudents = response.data.students || [];
      
      if (allStudents.length === 0) {
        toast.error("د صادرولو لپاره هیڅ زده کوونکی شتون نلري");
        return;
      }

      await exportStudentsPDF(allStudents, exportFilters);
      toast.success(`${allStudents.length} زده کوونکي بریالیتوب سره صادر شول`);
    } catch (error) {
      console.error("Error exporting students PDF:", error);
      toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

// ─── Custom Student Filter Component ──────────────────────────────────────────
function StudentFilterBar({ onApply, onClear }) {
  const [filters, setFilters] = useState({});
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Clear class filter when type or year changes
    if (key === 'enrollmentType' || key === 'academicYear') {
      delete newFilters.classId;
      setAvailableClasses([]);
    }
    
    setFilters(newFilters);
  };

  // Fetch classes when type and year are selected
  useEffect(() => {
    const fetchClasses = async () => {
      if (filters.enrollmentType && filters.academicYear) {
        try {
          setLoadingClasses(true);
          const response = await getClassesByTypeAndYear(filters.enrollmentType, filters.academicYear);
          setAvailableClasses(response.data.classes || []);
        } catch (error) {
          console.error('Error fetching classes:', error);
          setAvailableClasses([]);
        } finally {
          setLoadingClasses(false);
        }
      }
    };

    fetchClasses();
  }, [filters.enrollmentType, filters.academicYear]);

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({});
    setAvailableClasses([]);
    onClear();
  };

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-card border rounded-md p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">فلټر:</span>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {/* Student ID */}
          <input
            type="text"
            placeholder="د زده کوونکي ID..."
            value={filters.id || ''}
            onChange={(e) => updateFilter('id', e.target.value)}
            className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          
          {/* Full Name */}
          <input
            type="text"
            placeholder="نوم، د پلار نوم..."
            value={filters.fullName || ''}
            onChange={(e) => updateFilter('fullName', e.target.value)}
            className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          
          {/* Enrollment Type */}
          <select
            value={filters.enrollmentType || ''}
            onChange={(e) => updateFilter('enrollmentType', e.target.value)}
            className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">د شمولیت ډول</option>
            {ENROLL_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          {/* Academic Year */}
          <div className="min-w-[130px]">
            <ShamsiYearPicker
              value={filters.academicYear || ''}
              onChange={(y) => updateFilter('academicYear', y)}
              placeholder="تعلیمي کال"
            />
          </div>
        </div>
      </div>

      {/* Class Selection - Only show when type and year are selected */}
      {filters.enrollmentType && filters.academicYear && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">ټولګی:</span>
          <div className="flex-1">
            <select
              value={filters.classId || ''}
              onChange={(e) => updateFilter('classId', e.target.value)}
              disabled={loadingClasses}
              className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring w-full max-w-xs"
            >
              <option value="">
                {loadingClasses ? 'د ټولګیو بارول...' : 'ټولګی وټاکئ'}
              </option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApply}
          className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90"
        >
          فلټر کول
        </button>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="text-xs border border-input rounded px-2.5 py-1.5 hover:bg-muted text-muted-foreground"
          >
            پاکول
          </button>
        )}
      </div>
    </div>
  );
}

  // AG Grid columns
  const columnDefs = useMemo(() => [
    { field: "fullName", headerName: "نوم", flex: 1.2, minWidth: 150 },
    { field: "fatherName", headerName: "د پلار نوم", flex: 1.1, minWidth: 140 },
    { 
      field: "enrollments", 
      headerName: "ډول", 
      flex: 1, 
      minWidth: 120,
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

      <StudentFilterBar 
        onApply={(f) => { setFilters(f); setPage(1); }} 
        onClear={() => { setFilters({}); setPage(1); }} 
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={students}
        loading={loading}
        emptyText="هیڅ زده کوونکی ونه موندل شو"
        searchPlaceholder="د زده کوونکي نوم، ټېلیفون..."
        serverSidePagination={true}
        pageSize={pagination.limit || 12}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableRtl={true}
        enableExport={true}
        exportFileName="students"
        onExportClick={handleExportStudents}
        onPdfClick={handlePdfStudents}
        exportLoading={exportLoading}
        pdfLoading={pdfLoading}
      />

      {/* View Modal */}
      <ErpModal open={viewOpen} onOpenChange={setViewOpen} title="د زده کوونکي معلومات" size="md"
        footer={<button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {selected && (
          <div className="flex gap-4">
            {/* Details - Left side */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DV label="بشپړ نوم" value={selected.fullName} />
              <DV label="د پلار نوم" value={selected.fatherName} />
              <DV label="جنسیت" value={selected.gender === "Male" ? "نر" : "ښځینه"} />
              <DV label="ټېلیفون" value={selected.phone} />
              <DV label="تعلیمي کال" value={selected.academicYear} />
              <div className="col-span-2">
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
              <DV label="د ثبت نام فیس" value={selected.registrationFee ? `AFN ${selected.registrationFee}` : "—"} />
              <DV label="پته" value={selected.address} />
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
        )}
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
          <F label="ټېلیفون" opt error={errors.phone}>
            <Input value={form.phone} handleChanges={(e) => setF("phone", e.target.value)} placeholder="+93 7XX XXX XXX" />
          </F>
          <F label="بېړنۍ اړیکه" opt error={errors.emergencyContact}>
            <Input value={form.emergencyContact} handleChanges={(e) => setF("emergencyContact", e.target.value)} placeholder="+93 7XX XXX XXX" />
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
              {ENROLL_TYPES.map(({ value, label }) => {
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

          {form.enrollments && form.enrollments.length > 0 && form.enrollments.map((type) => {
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

import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, UserPlus, ArrowUpRight, Upload, X, UserX, UserCheck, KeyRound } from "lucide-react";
import { ShamsiDatePicker } from "@/components/erp/ShamsiDatePicker";
import { currentShamsiYear } from "@/lib/afghan-date";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { ConfirmStatus } from "@/components/erp/ConfirmStatus";
import { DEFAULT_SUBJECTS } from "@/constants";
import * as teacherApi from "@/data/teacherApi";
import { toast } from "sonner";
import { exportTeachersToExcel, exportApplicantsToExcel } from "@/utils/excelExport";
import { ImageLightbox } from "@/components/erp/ImageLightbox";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
const imgUrl = (path) => path ? `${API_BASE}/uploads/teachers/${path}` : null;

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
  </label>
);

const EDUCATION_LEVELS = [
  { value: "grade12",  label: "۱۲ ګرېډ پاس" },
  { value: "grade14",  label: "۱۴ ګرېډ پاس" },
  { value: "bachelor", label: "لیسانس"       },
  { value: "master",   label: "ماستري"        },
  { value: "phd",      label: "دکتورا"        },
];
const EDU_LABEL   = Object.fromEntries(EDUCATION_LEVELS.map(({ value, label }) => [value, label]));
const EDU_VARIANT = { grade12: "muted", grade14: "muted", bachelor: "info", master: "warning", phd: "success" };

const TEACHER_TYPES = [
  { value: "School",  label: "ښوونځی", variant: "info"    },
  { value: "Center",  label: "سینټر",   variant: "muted"   },
  { value: "Madrasa", label: "مدرسه",  variant: "warning" },
];

const EMPTY_TEACHER   = { name: "", fatherName: "", phone: "", idCardNumber: "", salary: "", education: "", teacherType: ["School"], assignedClasses: [], username: "", password: "", skills: "", address: "", joiningDate: "", notes: "", image: null, removeImage: false };
const EMPTY_APPLICANT = { name: "", fatherName: "", phone: "", education: "", skills: "", address: "", appliedAt: "", notes: "" };

// ─── Image Upload Field ────────────────────────────────────────────────────────
function ImageUploadField({ currentImage, onFileChange, onRemove }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  // Show existing image as preview on mount/edit
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
        <span className="text-xs text-muted-foreground">د ښوونکي انځور (اختیاري)</span>
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

const getToday = () => new Date().toISOString().split("T")[0];

const mapTeacherApiError = (message) => {
  const msg = message || "";
  const errors = {};
  if (msg.includes("کارن نوم")) errors.username = msg;
  else if (msg.includes("ټېلیفون")) errors.phone = msg;
  else if (msg.includes("معاش")) errors.salary = msg;
  else if (msg.includes("ډول")) errors.teacherType = msg;
  else if (msg.includes("پاسورډ")) errors.password = msg;
  else errors._form = msg || "د ښوونکي په ثبتولو کې تېروتنه";
  return errors;
};



const SubjectSelect   = ({ value, onChange }) => (<select value={value} onChange={onChange} className={SEL}><option value="">— مضمون وټاکئ —</option>{DEFAULT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}</select>);
const EducationSelect = ({ value, onChange }) => (<select value={value} onChange={onChange} className={SEL}><option value="">— زده کړه وټاکئ —</option>{EDUCATION_LEVELS.map(({ value: v, label }) => <option key={v} value={v}>{label}</option>)}</select>);

// ─── Validation ───────────────────────────────────────────────────────────────
const validateTeacher = (data) => {
  const errors = {};
  const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
  const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;

  // Required fields
  if (!data.name?.trim()) {
    errors.name = "نوم اړین دی";
  } else if (!nameRegex.test(data.name)) {
    errors.name = "نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.name = "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (!data.fatherName?.trim()) {
    errors.fatherName = "د پلار نوم اړین دی";
  } else if (!nameRegex.test(data.fatherName)) {
    errors.fatherName = "د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.fatherName.length < 2 || data.fatherName.length > 100) {
    errors.fatherName = "د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (!data.phone?.trim()) {
    errors.phone = "ټېلیفون نمبر اړین دی";
  } else if (!phoneRegex.test(data.phone)) {
    errors.phone = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (!data.education) {
    errors.education = "زده کړه اړینه ده";
  }

  // Teacher type validation
  if (!data.teacherType || !Array.isArray(data.teacherType) || data.teacherType.length === 0) {
    errors.teacherType = "د ښوونکي ډول اړین دی - لږترلږه یو ډول وټاکئ";
  }

  // Optional fields validation
  if (data.idCardNumber && (data.idCardNumber.length < 5 || data.idCardNumber.length > 20)) {
    errors.idCardNumber = "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي";
  }

  if (data.salary === "" || data.salary === undefined || data.salary === null) {
    errors.salary = "معاش اړین دی";
  } else if (isNaN(data.salary) || Number(data.salary) < 0) {
    errors.salary = "معاش باید مثبت عدد وي";
  }

  if (data.skills && data.skills.length > 300) {
    errors.skills = "مهارتونه باید د ۳۰۰ توري څخه لږ وي";
  }

  if (data.address && data.address.length > 200) {
    errors.address = "پته باید د ۲۰۰ توري څخه لږه وي";
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "یادښتونه باید د ۵۰۰ توري څخه لږ وي";
  }

  return errors;
};

const validateApplicant = (data) => {
  const errors = {};
  const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
  const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;

  // Required fields
  if (!data.name?.trim()) {
    errors.name = "نوم اړین دی";
  } else if (!nameRegex.test(data.name)) {
    errors.name = "نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.name = "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (!data.fatherName?.trim()) {
    errors.fatherName = "د پلار نوم اړین دی";
  } else if (!nameRegex.test(data.fatherName)) {
    errors.fatherName = "د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.fatherName.length < 2 || data.fatherName.length > 100) {
    errors.fatherName = "د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (!data.phone?.trim()) {
    errors.phone = "ټېلیفون نمبر اړین دی";
  } else if (!phoneRegex.test(data.phone)) {
    errors.phone = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (!data.education) {
    errors.education = "زده کړه اړینه ده";
  }

  // Optional fields validation
  if (data.skills && data.skills.length > 300) {
    errors.skills = "مهارتونه باید د ۳۰۰ توري څخه لږ وي";
  }

  if (data.address && data.address.length > 200) {
    errors.address = "پته باید د ۲۰۰ توري څخه لږه وي";
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "یادښتونه باید د ۵۰۰ توري څخه لږ وي";
  }

  return errors;
};

// ─── Filters ──────────────────────────────────────────────────────────────────
const TEACHER_FILTERS = [
  { key: "id",        label: "د ښوونکي ID", type: "number", placeholder: "د ښوونکي ID..." },
  { key: "name",      label: "د نوم لټون", type: "input",  placeholder: "د ښوونکي نوم..." },
  { key: "education", label: "زده کړه",    type: "select", options: EDUCATION_LEVELS.map(({ value, label }) => ({ value, label })) },
  { key: "teacherType", label: "د ښوونکي ډول", type: "select", options: TEACHER_TYPES.map(({ value, label }) => ({ value, label })) },
  { key: "joiningYear", label: "د شمولیت کال", type: "shamsiYear", placeholder: "د شمولیت کال" },
  { key: "status", label: "حالت", type: "select", options: [
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیر فعال" },
  ]},
];
const APPLICANT_FILTERS = [
  { key: "name",     label: "د نوم لټون",    type: "input", placeholder: "د غوښتونکي نوم..." },
  { key: "phone",    label: "ټېلیفون نمبر",  type: "input", placeholder: "+93 7XX XXX XXX" },
  { key: "skills",   label: "مهارتونه",      type: "input", placeholder: "مهارتونه..." },
  { key: "appliedYear", label: "د غوښتنې کال", type: "shamsiYear", placeholder: "د غوښتنې کال" },
];

export default function TeachersPage() {
  const [teachers, setTeachers]         = useState([]);
  const [applicants, setApplicants]     = useState([]);
  const [tab, setTab]                   = useState("teachers");
  const [teacherOpen, setTeacherOpen]   = useState(false);
  const [applicantOpen, setApplicantOpen] = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { item, kind }
  const [teacher, setTeacher]           = useState(EMPTY_TEACHER);
  const [applicant, setApplicant]       = useState(EMPTY_APPLICANT);
  const [selected, setSelected]         = useState(null);
  const [selectedKind, setSelectedKind]   = useState(null);
  const [tFilters, setTFilters]         = useState({ joiningYear: String(currentShamsiYear()) });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [aFilters, setAFilters]         = useState({});
  const [teacherErrors, setTeacherErrors] = useState({});
  const [applicantErrors, setApplicantErrors] = useState({});
  const [loading, setLoading]           = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [isApplicantEditing, setIsApplicantEditing] = useState(false);
  const [teacherImageFile, setTeacherImageFile] = useState(null);
  
  // Pagination states
  const [teacherPage, setTeacherPage]   = useState(1);
  const [teacherPagination, setTeacherPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });
  const [applicantPage, setApplicantPage] = useState(1);
  const [applicantPagination, setApplicantPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });
  const [exportLoading, setExportLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPwTarget, setResetPwTarget] = useState(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [resetPwError, setResetPwError] = useState("");
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getAllTeachers({ ...tFilters, page: teacherPage, limit: 10 });
      setTeachers(response.data.teachers || []);
      setTeacherPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error(error.message || "د ښوونکو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getAllApplicants({ ...aFilters, page: applicantPage, limit: 10 });
      setApplicants(response.data.applicants || []);
      setApplicantPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast.error(error.message || "د غوښتونکو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers on mount and when filters or page change
  useEffect(() => {
    if (tab === "teachers") {
      // Set default filter to current year if no filters are set
      const defaultFilters = Object.keys(tFilters).length === 0 ? { joiningYear: String(currentShamsiYear()) } : tFilters;
      
      if (JSON.stringify(defaultFilters) !== JSON.stringify(tFilters)) {
        setTFilters(defaultFilters);
      } else {
        fetchTeachers();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tFilters, teacherPage, tab]);

  // Fetch applicants when tab changes to applicants or filters/page change
  useEffect(() => {
    if (tab === "applicants") {
      fetchApplicants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, aFilters, applicantPage]);

  const setT = (k, v) => {
    setTeacher((f) => ({ ...f, [k]: v }));
    // Clear error for this field when user types
    if (teacherErrors[k]) {
      setTeacherErrors((e) => ({ ...e, [k]: "" }));
    }
  };

  const fetchTeacherClasses = async (types) => {
    if (!types?.length) { setAvailableClasses([]); return; }
    try {
      const response = await teacherApi.getClassesByTeacherTypes(types, currentShamsiYear());
      setAvailableClasses(response.data.classes || []);
    } catch {
      setAvailableClasses([]);
    }
  };

  const toggleTeacherType = (type) => {
    setTeacher((prev) => {
      const currentTypes = Array.isArray(prev.teacherType) ? prev.teacherType : [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      fetchTeacherClasses(newTypes);
      return { ...prev, teacherType: newTypes, assignedClasses: [] };
    });
    if (teacherErrors.teacherType) {
      setTeacherErrors((e) => ({ ...e, teacherType: "" }));
    }
  };

  const toggleAssignedClass = (classId) => {
    setTeacher((prev) => {
      const current = Array.isArray(prev.assignedClasses) ? prev.assignedClasses : [];
      const id = Number(classId);
      const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
      return { ...prev, assignedClasses: next };
    });
  };
  
  const setA = (k, v) => {
    setApplicant((f) => ({ ...f, [k]: v }));
    // Clear error for this field when user types
    if (applicantErrors[k]) {
      setApplicantErrors((e) => ({ ...e, [k]: "" }));
    }
  };

  const openEditTeacher = (t) => {
    const types = Array.isArray(t.teacherType) ? t.teacherType : ["School"];
    fetchTeacherClasses(types);
    setTeacher({
      ...EMPTY_TEACHER,
      ...t,
      assignedClasses: t.assignedClasses || [],
    });
    setTeacherErrors({});
    setTeacherImageFile(null);
    setIsEditing(true);
    setTeacherOpen(true);
  };
  
  const openAddTeacher = () => {
    const defaultTypes = EMPTY_TEACHER.teacherType;
    fetchTeacherClasses(defaultTypes);
    setTeacher({ ...EMPTY_TEACHER, joiningDate: getToday() });
    setTeacherErrors({});
    setTeacherImageFile(null);
    setIsEditing(false);
    setTeacherOpen(true);
  };

  const openAddApplicant = () => {
    setApplicant({ ...EMPTY_APPLICANT, appliedAt: getToday() });
    setApplicantErrors({});
    setIsApplicantEditing(false);
    setApplicantOpen(true);
  };

  const openEditApplicant = (a) => {
    setApplicant({ ...EMPTY_APPLICANT, ...a });
    setApplicantErrors({});
    setIsApplicantEditing(true);
    setApplicantOpen(true);
  };

  const handleViewOpenChange = (open) => {
    setViewOpen(open);
    if (!open) {
      setSelected(null);
      setSelectedKind(null);
    }
  };

  const openViewTeacher = async (t) => {
    try {
      const response = await teacherApi.getTeacherById(t.id);
      setSelected(response.data.teacher);
      setSelectedKind("teacher");
      setViewOpen(true);
    } catch (error) {
      toast.error(error.message || "د ښوونکي معلومات ترلاسه نه شول");
    }
  };

  const openToggleTeacherStatus = (t) => { setStatusTarget(t); setStatusOpen(true); };

  const handleToggleTeacherStatus = async () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === "inactive" ? "active" : "inactive";
    try {
      await teacherApi.toggleTeacherStatus(statusTarget.id, newStatus);
      toast.success(newStatus === "active" ? "ښوونکی فعال شو" : "ښوونکی غیر فعال شو");
      fetchTeachers();
    } catch (error) {
      toast.error(error.message || "د حالت بدلولو کې تېروتنه");
    }
  };

  useEffect(() => {
    const openId = searchParams.get("openId");
    if (openId && searchParams.get("openView")) {
      setTab("teachers");
      setTFilters((prev) => ({ ...prev, id: openId }));
      openViewTeacher({ id: Number(openId) });
      searchParams.delete("openId");
      searchParams.delete("openView");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const openViewApplicant = (a) => { setSelected(a); setSelectedKind("applicant"); setViewOpen(true); };
  const openDeleteTeacher   = (t) => { setDeleteTarget({ item: t, kind: "teacher" }); setDeleteOpen(true); };
  const openResetPassword   = (t) => { setResetPwTarget(t); setResetPwValue(""); setResetPwError(""); setResetPwOpen(true); };

  const handleResetPassword = async () => {
    if (!resetPwTarget) return;
    if (!resetPwValue || resetPwValue.length < 6) {
      setResetPwError("پاسورډ باید لږ تر لږه ۶ توري ولري");
      return;
    }
    setResetPwError("");
    setResetPwLoading(true);
    try {
      await teacherApi.resetTeacherPassword(resetPwTarget.id, resetPwValue);
      toast.success("پاسورډ بریالۍ بدل شو");
      setResetPwOpen(false);
      setResetPwTarget(null);
      setResetPwValue("");
      setResetPwError("");
    } catch (error) {
      setResetPwError(error.message || "د پاسورډ بدلولو کې تېروتنه");
    } finally {
      setResetPwLoading(false);
    }
  };
  const openDeleteApplicant = (a) => { setDeleteTarget({ item: a, kind: "applicant" }); setDeleteOpen(true); };

  const handleSaveTeacher = async () => {
    const errors = validateTeacher(teacher);
    if (!isEditing) {
      if (!teacher.username?.trim()) errors.username = "د کارن نوم اړین دی";
      if (!teacher.password?.trim()) errors.password = "پاسورډ اړین دی";
      else if (teacher.password.length < 6) errors.password = "پاسورډ باید لږ تر لږه ۶ توري ولري";
    } else {
      if (teacher.password?.trim() && teacher.password.length < 6) {
        errors.password = "پاسورډ باید لږ تر لږه ۶ توري ولري";
      }
    }
    if (Object.keys(errors).length > 0) {
      setTeacherErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const { image: _img, removeImage, username, password, ...teacherData } = teacher;
      const payload = isEditing
        ? { ...teacherData, username, ...(password?.trim() ? { password } : {}) }
        : { ...teacherData, username, password };
      if (isEditing && teacher.id) {
        const response = await teacherApi.updateTeacher(teacher.id, { ...payload, removeImage: teacher.removeImage }, teacherImageFile);
        toast.success(response.message || "ښوونکی بریالیتوب سره تازه شو");
      } else {
        const response = await teacherApi.createTeacher(payload, teacherImageFile);
        toast.success(response.message || "ښوونکی بریالیتوب سره ثبت شو");
      }
      setTeacherOpen(false);
      setTeacher(EMPTY_TEACHER);
      setTeacherErrors({});
      setTeacherImageFile(null);
      setIsEditing(false);
      
      // Reset to first page and fetch - this will trigger useEffect
      if (teacherPage === 1) {
        // If already on page 1, manually fetch
        await fetchTeachers();
      } else {
        // Otherwise, changing page will trigger useEffect
        setTeacherPage(1);
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
      setTeacherErrors(mapTeacherApiError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApplicant = async () => {
    const errors = validateApplicant(applicant);
    if (Object.keys(errors).length > 0) {
      setApplicantErrors(errors);
      return;
    }

    try {
      setLoading(true);
      let response;
      if (isApplicantEditing && applicant.id) {
        response = await teacherApi.updateApplicant(applicant.id, applicant);
        toast.success(response.message || "د کار غوښتونکی بریالیتوب سره تازه شو");
      } else {
        response = await teacherApi.createApplicant(applicant);
        toast.success(response.message || "د کار غوښتونکی بریالیتوب سره ثبت شو");
      }

      setApplicantOpen(false);
      setApplicant(EMPTY_APPLICANT);
      setApplicantErrors({});
      setIsApplicantEditing(false);

      // Reset to first page and fetch
      if (applicantPage === 1) {
        await fetchApplicants();
      } else {
        setApplicantPage(1);
      }
    } catch (error) {
      console.error("Error saving applicant:", error);
      toast.error(error.message || "د غوښتونکي په ثبتولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      if (deleteTarget.kind === "teacher") {
        await teacherApi.deleteTeacher(deleteTarget.item.id);
        toast.success("ښوونکی بریالیتوب سره ړنګ شو");
        
        // Refresh teachers list
        if (teacherPage === 1) {
          await fetchTeachers();
        } else {
          setTeacherPage(1);
        }
      } else if (deleteTarget.kind === "applicant") {
        await teacherApi.deleteApplicant(deleteTarget.item.id);
        toast.success("د کار غوښتونکی بریالیتوب سره ړنګ شو");
        
        // Refresh applicants list
        if (applicantPage === 1) {
          await fetchApplicants();
        } else {
          setApplicantPage(1);
        }
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(error.message || "په ړنګولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToTeacher = async (applicantItem) => {
    try {
      setLoading(true);
      const response = await teacherApi.convertApplicantToTeacher(applicantItem.id, {
        salary: null,
        joiningDate: new Date().toISOString().split('T')[0],
        idCardNumber: null,
        teacherType: ["School"] // Default to School type
      });
      toast.success(response.message || "غوښتونکی بریالیتوب سره ښوونکي ته بدل شو");
      
      // Refresh both lists automatically
      await Promise.all([
        fetchApplicants(),
        fetchTeachers()
      ]);
    } catch (error) {
      console.error("Error converting applicant:", error);
      toast.error(error.message || "په بدلولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Export all teachers to Excel
  const handleExportAllTeachers = async () => {
    try {
      setLoading(true);
      const exportFilters = Object.keys(tFilters).length > 0 ? tFilters : { joiningYear: String(currentShamsiYear()) };
      const response = await teacherApi.getAllTeachers({ ...exportFilters, page: 1, limit: 10000 });
      const allTeachers = response.data.teachers || [];
      
      if (allTeachers.length === 0) {
        toast.error("د صادرولو لپاره هیڅ ښوونکی شتون نلري");
        return;
      }

      await exportTeachersToExcel(allTeachers, EDU_LABEL);
      toast.success(`${allTeachers.length} ښوونکي بریالیتوب سره صادر شول`);
    } catch (error) {
      console.error("Error exporting teachers:", error);
      toast.error(error.message || "د صادرولو په وخت کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Export all applicants to Excel
  const handleExportAllApplicants = async () => {
    try {
      setExportLoading(true);
      const currentYear = new Date().getFullYear();
      const exportFilters = Object.keys(aFilters).length > 0 ? aFilters : { appliedYear: currentYear };
      const response = await teacherApi.getAllApplicants({ ...exportFilters, page: 1, limit: 10000 });
      const allApplicants = response.data.applicants || [];
      
      if (allApplicants.length === 0) {
        toast.error("د صادرولو لپاره هیڅ غوښتونکی شتون نلري");
        return;
      }

      await exportApplicantsToExcel(allApplicants, EDU_LABEL);
      toast.success(`${allApplicants.length} غوښتونکي بریالیتوب سره صادر شول`);
    } catch (error) {
      console.error("Error exporting applicants:", error);
      toast.error(error.message || "د صادرولو په وخت کې تېروتنه");
    } finally {
      setExportLoading(false);
    }
  };

  const filteredTeachers   = teachers;
  const filteredApplicants = applicants;

  // AG Grid column definitions for teachers
  const teacherColumnDefs = useMemo(() => [
    { 
      field: "name", 
      headerName: "نوم",
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: "fatherName",
      headerName: "د پلار نوم",
      flex: 1.1,
      minWidth: 140,
      hideOnMobile: true,
    },
    {
      field: "phone",
      headerName: "ټېلیفون",
      flex: 1,
      minWidth: 130,
      hideOnMobile: true,
    },
    {
      field: "teacherType",
      headerName: "ډول",
      flex: 1,
      minWidth: 120,
      hideOnMobile: true,
      cellRenderer: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "—";
        return (
          <span className="flex gap-1 flex-wrap">
            {params.value.map((type) => {
              const t = TEACHER_TYPES.find((t) => t.value === type);
              return <Badge key={type} variant={t?.variant ?? "muted"}>{t?.label ?? type}</Badge>;
            })}
          </span>
        );
      }
    },
    { 
      field: "salary", 
      headerName: "معاش",
      flex: 0.9,
      minWidth: 110,
      cellRenderer: (params) => {
        if (!params.value) return "—";
        return `AFN ${Number(params.value).toLocaleString()}`;
      }
    },
    { 
      field: "actions", 
      headerName: "",
      flex: 1,
      minWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const t = params.data;
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); openViewTeacher(t); }} 
              title="کتل" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditTeacher(t); }} 
              title="سمول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            {t.userId && (
              <button
                onClick={(e) => { e.stopPropagation(); openResetPassword(t); }}
                title="پاسورډ بیا تنظیمول"
                className="p-1.5 rounded hover:bg-muted text-muted-foreground"
              >
                <KeyRound className="size-3.5" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); openToggleTeacherStatus(t); }} title={t.status === "inactive" ? "فعالول" : "غیر فعالول"} className={`p-1.5 rounded hover:bg-muted ${t.status === "inactive" ? "text-success" : "text-warning"}`}>
              {t.status === "inactive" ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openDeleteTeacher(t); }} 
              title="ړنګول" 
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      }
    },
  ], []);

  // AG Grid column definitions for applicants
  const applicantColumnDefs = useMemo(() => [
    { 
      field: "name", 
      headerName: "نوم",
      flex: 1.3,
      minWidth: 160,
    },
    {
      field: "fatherName",
      headerName: "د پلار نوم",
      flex: 1.2,
      minWidth: 150,
      hideOnMobile: true,
    },
    {
      field: "phone",
      headerName: "ټېلیفون",
      flex: 1,
      minWidth: 130,
      hideOnMobile: true,
    },
    {
      field: "education",
      headerName: "زده کړه",
      flex: 0.9,
      minWidth: 120,
      hideOnMobile: true,
      cellRenderer: (params) => {
        if (!params.value) return "—";
        return (
          <Badge variant={EDU_VARIANT[params.value] ?? "muted"}>
            {EDU_LABEL[params.value] ?? params.value}
          </Badge>
        );
      }
    },
    { 
      field: "appliedAt", 
      headerName: "د غوښتنې نېټه",
      flex: 0.9,
      minWidth: 120,
    },
    { 
      field: "actions", 
      headerName: "",
      flex: 1.1,
      minWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const a = params.data;
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); openViewApplicant(a); }} 
              title="کتل" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditApplicant(a); }} 
              title="سمول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleConvertToTeacher(a); }} 
              title="ښوونکي ته بدلول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <ArrowUpRight className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openDeleteApplicant(a); }} 
              title="ړنګول"
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
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
      <PageHeader title="ښوونکي" subtitle="د ښوونکو او د کار غوښتونکو اداره"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { setTab("applicants"); openAddApplicant(); }} className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5"><UserPlus className="size-3.5" /> د کار غوښتونکی</button>
            <button onClick={() => { setTab("teachers"); openAddTeacher(); }} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"><Plus className="size-3.5" /> نوی ښوونکی</button>
          </div>
        }
      />

      <div className="flex border-b border-border">
        {[["teachers", "ښوونکي"], ["applicants", "د کار غوښتونکي"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          <FilterBar 
            filters={TEACHER_FILTERS}
            defaultValues={{ joiningYear: String(currentShamsiYear()) }}
            onApply={(filters) => { setTFilters(filters); setTeacherPage(1); }}
            onClear={(cleared) => { setTFilters(cleared || { joiningYear: String(currentShamsiYear()) }); setTeacherPage(1); }}
          />
          <AgGridTable
            columnDefs={teacherColumnDefs}
            rowData={filteredTeachers}
            loading={loading}
            emptyText="هیڅ ښوونکی ونه موندل شو"
            searchPlaceholder="د ښوونکي نوم، ټېلیفون..."
            serverSidePagination={true}
            pageSize={teacherPagination.limit || 10}
            totalRows={teacherPagination.total}
            currentPage={teacherPage}
            totalPages={teacherPagination.totalPages}
            onPageChange={setTeacherPage}
            enableRtl={true}
            enableExport={true}
            exportFileName="teachers"
            onExportClick={handleExportAllTeachers}
            exportLoading={exportLoading}
          />
        </>
      )}
      {tab === "applicants" && (
        <>
          <FilterBar
            filters={APPLICANT_FILTERS}
            defaultValues={{ appliedYear: String(currentShamsiYear()) }}
            onApply={(filters) => { setAFilters(filters); setApplicantPage(1); }}
            onClear={(cleared) => { setAFilters(cleared || { appliedYear: String(currentShamsiYear()) }); setApplicantPage(1); }}
          />
          <AgGridTable
            columnDefs={applicantColumnDefs}
            rowData={filteredApplicants}
            loading={loading}
            emptyText="هیڅ غوښتونکی ونه موندل شو"
            searchPlaceholder="د غوښتونکي نوم، ټېلیفون..."
            serverSidePagination={true}
            pageSize={applicantPagination.limit || 10}
            totalRows={applicantPagination.total}
            currentPage={applicantPage}
            totalPages={applicantPagination.totalPages}
            onPageChange={setApplicantPage}
            enableRtl={true}
            enableExport={true}
            exportFileName="applicants"
            onExportClick={handleExportAllApplicants}
            exportLoading={exportLoading}
          />
        </>
      )}

      {/* ── View modal ─────────────────────────────────────────────────── */}
      <ErpModal open={viewOpen} onOpenChange={handleViewOpenChange} title={selectedKind === "applicant" ? "د کار غوښتونکي معلومات" : "د ښوونکي معلومات"} size="md"
        footer={<button onClick={() => handleViewOpenChange(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {selected && (
          <div className="flex gap-4">
            {/* Details - Left side */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DV label="بشپړ نوم" value={selected.name} />
              <DV label="د پلار نوم" value={selected.fatherName} />
              <DV label="ټېلیفون" value={selected.phone} />
              {selectedKind === "teacher" && <DV label="تذکیره" value={selected.idCardNumber} />}
              <DV label="زده کړه" value={EDU_LABEL[selected.education] ?? selected.education} />
              {selectedKind === "teacher" && (
                <DV label="د ښوونکي ډول" value={
                  Array.isArray(selected.teacherType) 
                    ? selected.teacherType.map(type => TEACHER_TYPES.find(t => t.value === type)?.label || type).join("، ")
                    : "—"
                } />
              )}
              {selectedKind === "teacher" ? (
                <DV label="معاش" value={selected.salary ? `AFN ${Number(selected.salary).toLocaleString()}` : "—"} />
              ) : (
                <DV label="د غوښتنې نېټه" value={selected.appliedAt} />
              )}
              {selectedKind === "teacher" && <DV label="د شمولیت نېټه" value={selected.joiningDate} />}
              {selectedKind === "teacher" && selected.salaryDetails && (
                <>
                  <DV label="د دې میاشتې معاش" value={`AFN ${Number(selected.salaryDetails.netSalary || 0).toLocaleString()}`} />
                  <DV label="ورکړل شوی" value={`AFN ${Number(selected.salaryDetails.paid || 0).toLocaleString()}`} />
                  <DV label="د معاش حالت" value={selected.salaryDetails.isPaid ? "ورکړل شوی" : "پاتې"} />
                </>
              )}
              {selectedKind === "teacher" && selected.assignedClassDetails?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground mb-1">ټولګي</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.assignedClassDetails.map((c) => (
                      <Badge key={c.id} variant="outline">{c.name}{c.section ? ` - ${c.section}` : ""}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <DV label="مهارتونه" value={selected.skills} />
              <DV label="پته" value={selected.address} />
              {selected.notes && <div className="col-span-2"><DV label="یادښتونه" value={selected.notes} /></div>}
            </div>
            
            {/* Profile image - Right side */}
            {selected.image && (
              <div className="shrink-0">
                <img
                  src={imgUrl(selected.image)}
                  alt={selected.name}
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
        alt={selected?.name || ""}
      />

      {/* ── Teacher form modal ──────────────────────────────────────────── */}
      <ErpModal open={teacherOpen} onOpenChange={setTeacherOpen} title={isEditing ? "ښوونکی سمول" : "ښوونکی ثبتول"} size="md"
        footer={<>
          <button onClick={() => setTeacherOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>لغوه</button>
          <button onClick={handleSaveTeacher} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
            {loading ? "...په ثبتیدو کې" : "ثبتول"}
          </button>
        </>}
      >
        {teacherErrors._form && (
          <p className="text-xs text-destructive mb-3 bg-destructive/10 border border-destructive/20 rounded px-3 py-2">{teacherErrors._form}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <F label="بشپړ نوم"><Input value={teacher.name} handleChanges={(e) => setT("name", e.target.value)} placeholder="بشپړ نوم" /></F>
            {teacherErrors.name && <p className="text-xs text-destructive mt-1">{teacherErrors.name}</p>}
          </div>
          <div>
            <F label="د پلار نوم"><Input value={teacher.fatherName} handleChanges={(e) => setT("fatherName", e.target.value)} placeholder="د پلار نوم" /></F>
            {teacherErrors.fatherName && <p className="text-xs text-destructive mt-1">{teacherErrors.fatherName}</p>}
          </div>
          <div>
            <F label="ټېلیفون"><Input value={teacher.phone} handleChanges={(e) => setT("phone", e.target.value)} placeholder="+93 7XX XXX XXX" /></F>
            {teacherErrors.phone && <p className="text-xs text-destructive mt-1">{teacherErrors.phone}</p>}
          </div>
          <div>
            <F label="تذکیره نمبر" opt><Input value={teacher.idCardNumber} handleChanges={(e) => setT("idCardNumber", e.target.value)} placeholder="تذکیره نمبر" /></F>
            {teacherErrors.idCardNumber && <p className="text-xs text-destructive mt-1">{teacherErrors.idCardNumber}</p>}
          </div>
          <div>
            <F label="زده کړه"><EducationSelect value={teacher.education} onChange={(e) => setT("education", e.target.value)} /></F>
            {teacherErrors.education && <p className="text-xs text-destructive mt-1">{teacherErrors.education}</p>}
          </div>
          <div>
            <F label="معاش (افغانۍ)"><Input type="number" value={teacher.salary} handleChanges={(e) => setT("salary", e.target.value)} placeholder="0" /></F>
            {teacherErrors.salary && <p className="text-xs text-destructive mt-1">{teacherErrors.salary}</p>}
          </div>
          <div>
            <F label="د کارن نوم"><Input value={teacher.username} handleChanges={(e) => setT("username", e.target.value)} placeholder="د ننوتلو کارن نوم" dir="ltr" /></F>
            {teacherErrors.username && <p className="text-xs text-destructive mt-1">{teacherErrors.username}</p>}
          </div>
          <div>
            <F label={isEditing ? "نوی پاسورډ (اختیاري)" : "پاسورډ"}>
              <Input
                type="password"
                value={teacher.password}
                handleChanges={(e) => setT("password", e.target.value)}
                placeholder={isEditing ? "خالی پرېږدئ که نه بدلېږي" : "لږ تر لږه ۶ توري"}
                dir="ltr"
              />
            </F>
            {teacherErrors.password && <p className="text-xs text-destructive mt-1">{teacherErrors.password}</p>}
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1.5">د ښوونکي ډول</span>
            <div className="flex gap-2">
              {TEACHER_TYPES.map(({ value, label }) => {
                const active = Array.isArray(teacher.teacherType) && teacher.teacherType.includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleTeacherType(value)}
                    className={`flex-1 py-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${active ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted text-foreground"}`}>
                    {active && <span className="size-1.5 rounded-full bg-primary-foreground inline-block" />}{label}
                  </button>
                );
              })}
            </div>
            {teacherErrors.teacherType && <p className="text-xs text-destructive mt-1">{teacherErrors.teacherType}</p>}
          </div>
          <div>
            <F label="د شمولیت نېټه">
              <ShamsiDatePicker value={teacher.joiningDate} onChange={(d) => setT("joiningDate", d)} placeholder="د شمولیت نېټه" />
            </F>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1.5">ټولګي وټاکئ</span>
            <div className="border border-input rounded-md max-h-40 overflow-y-auto p-2 space-y-1.5 bg-background">
              {availableClasses.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">د ټاکل شوي ډول لپاره ټولګي ونه موندل شول</p>
              ) : (
                availableClasses.map((cls) => {
                  const active = teacher.assignedClasses?.includes(cls.id);
                  return (
                    <label key={cls.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={!!active}
                        onChange={() => toggleAssignedClass(cls.id)}
                        className="size-4 rounded border-input accent-primary shrink-0"
                      />
                      <span>{cls.name}{cls.section ? ` - ${cls.section}` : ""} ({TEACHER_TYPES.find(t => t.value === cls.type)?.label})</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div>
            <F label="مهارتونه" opt><Input value={teacher.skills} handleChanges={(e) => setT("skills", e.target.value)} placeholder="مهارتونه..." /></F>
            {teacherErrors.skills && <p className="text-xs text-destructive mt-1">{teacherErrors.skills}</p>}
          </div>
          <div className="col-span-2">
            <F label="پته" opt><Input value={teacher.address} handleChanges={(e) => setT("address", e.target.value)} placeholder="ولایت، ښار" /></F>
            {teacherErrors.address && <p className="text-xs text-destructive mt-1">{teacherErrors.address}</p>}
          </div>
          <div className="col-span-2">
            <F label="یادښتونه" opt><textarea rows={2} value={teacher.notes} onChange={(e) => setT("notes", e.target.value)} className={`${SEL} resize-none`} /></F>
            {teacherErrors.notes && <p className="text-xs text-destructive mt-1">{teacherErrors.notes}</p>}
          </div>
          <div className="col-span-2">
            <ImageUploadField
              currentImage={isEditing ? teacher.image : null}
              onFileChange={(file) => { setTeacherImageFile(file); setT("removeImage", false); }}
              onRemove={() => { setTeacherImageFile(null); setT("removeImage", true); setT("image", null); }}
            />
          </div>
        </div>
      </ErpModal>

      {/* ── Applicant form modal ────────────────────────────────────────── */}
      <ErpModal open={applicantOpen} onOpenChange={setApplicantOpen} title={isApplicantEditing ? "د کار غوښتونکی سمول" : "د کار غوښتونکی ثبتول"} size="md"
        footer={<>
          <button onClick={() => setApplicantOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>لغوه</button>
          <button onClick={handleSaveApplicant} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
            {loading ? "...په ثبتیدو کې" : "ثبتول"}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <F label="بشپړ نوم"><Input value={applicant.name} handleChanges={(e) => setA("name", e.target.value)} placeholder="بشپړ نوم" /></F>
            {applicantErrors.name && <p className="text-xs text-destructive mt-1">{applicantErrors.name}</p>}
          </div>
          <div>
            <F label="د پلار نوم"><Input value={applicant.fatherName} handleChanges={(e) => setA("fatherName", e.target.value)} placeholder="د پلار نوم" /></F>
            {applicantErrors.fatherName && <p className="text-xs text-destructive mt-1">{applicantErrors.fatherName}</p>}
          </div>
          <div>
            <F label="ټېلیفون"><Input value={applicant.phone} handleChanges={(e) => setA("phone", e.target.value)} placeholder="+93 7XX XXX XXX" /></F>
            {applicantErrors.phone && <p className="text-xs text-destructive mt-1">{applicantErrors.phone}</p>}
          </div>
          <div>
            <F label="زده کړه"><EducationSelect value={applicant.education} onChange={(e) => setA("education", e.target.value)} /></F>
            {applicantErrors.education && <p className="text-xs text-destructive mt-1">{applicantErrors.education}</p>}
          </div>
          <div>
            <F label="د غوښتنې نېټه" opt><Input type="date" value={applicant.appliedAt} handleChanges={(e) => setA("appliedAt", e.target.value)} /></F>
            {applicantErrors.appliedAt && <p className="text-xs text-destructive mt-1">{applicantErrors.appliedAt}</p>}
          </div>
          <div>
            <F label="مهارتونه" opt><Input value={applicant.skills} handleChanges={(e) => setA("skills", e.target.value)} placeholder="مهارتونه..." /></F>
            {applicantErrors.skills && <p className="text-xs text-destructive mt-1">{applicantErrors.skills}</p>}
          </div>
          <div>
            <F label="پته" opt><Input value={applicant.address} handleChanges={(e) => setA("address", e.target.value)} placeholder="ولایت، ښار" /></F>
            {applicantErrors.address && <p className="text-xs text-destructive mt-1">{applicantErrors.address}</p>}
          </div>
          <div className="col-span-2">
            <F label="یادښتونه" opt><textarea rows={2} value={applicant.notes} onChange={(e) => setA("notes", e.target.value)} className={`${SEL} resize-none`} /></F>
            {applicantErrors.notes && <p className="text-xs text-destructive mt-1">{applicantErrors.notes}</p>}
          </div>
        </div>
      </ErpModal>

      <ErpModal
        open={resetPwOpen}
        onOpenChange={setResetPwOpen}
        title="د ښوونکي پاسورډ بیا تنظیمول"
        size="sm"
        footer={
          <>
            <button onClick={() => setResetPwOpen(false)} disabled={resetPwLoading} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50">لغوه</button>
            <button onClick={handleResetPassword} disabled={resetPwLoading} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              {resetPwLoading ? "په پروسس کې..." : "ساتل"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            د <span className="font-medium text-foreground">{resetPwTarget?.name}</span> لپاره نوی پاسورډ ولیکئ
          </p>
          <Input
            type="password"
            label="نوی پاسورډ"
            value={resetPwValue}
            handleChanges={(e) => { setResetPwValue(e.target.value); if (resetPwError) setResetPwError(""); }}
            disabled={resetPwLoading}
            placeholder="لږ تر لږه ۶ توري"
          />
          {resetPwError && <p className="text-xs text-destructive">{resetPwError}</p>}
        </div>
      </ErpModal>

      <ConfirmStatus
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleToggleTeacherStatus}
        title={statusTarget?.name}
        action={statusTarget?.status === "inactive" ? "activate" : "deactivate"}
      />

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title={deleteTarget?.item?.name}
      />
    </div>
  );
}

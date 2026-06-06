import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, KeyRound } from "lucide-react";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import * as parentApi from "@/data/parentApi";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { exportParentsToExcel } from "@/utils/excelExport";
import { exportParentsPDF } from "@/utils/pdfDownload";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, children, error }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
    {error && <span className="text-xs text-destructive">{error}</span>}
  </label>
);

const INSTITUTE_TYPES = [
  { value: "School",  label: "ښوونځی", variant: "info"    },
  { value: "Center",  label: "مرکز",   variant: "muted"   },
  { value: "Madrasa", label: "مدرسه",  variant: "warning" },
];

const EMPTY_PARENT = { 
  name: "", phone: "", idCardNumber: "", instituteTypes: [], 
  classIds: {}, studentIds: [], username: "", password: "", 
  address: "", registeredAt: "", notes: "" 
};

// ─── Validation ───────────────────────────────────────────────────────────────
const validateParent = (data) => {
  const errors = {};
  const nameRegex = /^[\u0600-\u06FF\u200C\u200Da-zA-Z\s]+$/;
  const phoneRegex = /^(\+93|0093|0)7[0-9]{8}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!data.name?.trim()) {
    errors.name = "نوم اړین دی";
  } else if (!nameRegex.test(data.name)) {
    errors.name = "نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.name = "نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (!data.phone?.trim()) {
    errors.phone = "ټېلیفون نمبر اړین دی";
  } else if (!phoneRegex.test(data.phone)) {
    errors.phone = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (!data.instituteTypes || !Array.isArray(data.instituteTypes) || data.instituteTypes.length === 0) {
    errors.instituteTypes = "د مؤسسې ډول اړین دی - لږترلږه یو ډول وټاکئ";
  }

  if (!data.studentIds || !Array.isArray(data.studentIds) || data.studentIds.length === 0) {
    errors.studentIds = "لږترلږه یو زده کوونکی وټاکئ";
  }

  if (!data.username?.trim()) {
    errors.username = "کارن نوم اړین دی";
  } else if (!usernameRegex.test(data.username)) {
    errors.username = "کارن نوم یوازې انګلیسي توري، عددونه او _ ولري (۳-۲۰ توري)";
  } else if (data.username.length < 3 || data.username.length > 20) {
    errors.username = "کارن نوم باید د ۳ څخه تر ۲۰ توري پورې وي";
  }

  if (!data.password?.trim()) {
    errors.password = "پټنوم اړین دی";
  } else if (data.password.length < 6) {
    errors.password = "پټنوم باید لږترلږه ۶ توري ولري";
  }

  if (data.idCardNumber && (data.idCardNumber.length < 5 || data.idCardNumber.length > 20)) {
    errors.idCardNumber = "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي";
  }

  if (data.address && data.address.length > 200) {
    errors.address = "پته باید د ۲۰۰ توري څخه لږه وي";
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "یادښتونه باید د ۵۰۰ توري څخه لږ وي";
  }

  return errors;
};

const PARENT_FILTERS = [
  { key: "id",       label: "د والد ID", type: "number", placeholder: "د والد ID..." },
  { key: "name",     label: "د نوم لټون", type: "input", placeholder: "د والد نوم..." },
  { key: "phone",    label: "ټېلیفون نمبر", type: "input", placeholder: "+93 7XX XXX XXX" },
  { key: "username", label: "کارن نوم", type: "input", placeholder: "کارن نوم..." },
  { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
];

export default function ParentsPage() {
  const session = useStore((s) => s.session);
  const [parents, setParents] = useState([]);
  const [parentOpen, setParentOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [parent, setParent] = useState(EMPTY_PARENT);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ academicYear: String(currentShamsiYear()) }); // Initialize with default year
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 50 });
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Dynamic data
  const [availableClasses, setAvailableClasses] = useState({});
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await parentApi.getAllParents({ ...filters, page, limit: 50 });
      setParents(response.data.parents || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 50 });
    } catch (error) {
      console.error("Error fetching parents:", error);
      toast.error(error.message || "د والدینو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  // Fetch classes when institute types change
  useEffect(() => {
    const fetchClasses = async () => {
      if (!parent.instituteTypes || parent.instituteTypes.length === 0) {
        setAvailableClasses({});
        setAvailableStudents([]);
        setParent(prev => ({ ...prev, classIds: {}, studentIds: [] }));
        return;
      }

      try {
        setLoadingClasses(true);
        const response = await parentApi.getClassesByTypes(parent.instituteTypes, session);
        setAvailableClasses(response.data.classes || {});
        setAvailableStudents([]);
        setParent(prev => ({ ...prev, classIds: {}, studentIds: [] }));
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error(error.message || "د ټولګیو په ترلاسه کولو کې تېروتنه");
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [parent.instituteTypes, session]);

  // Fetch students when classes change
  useEffect(() => {
    const fetchStudents = async () => {
      if (!parent.instituteTypes || parent.instituteTypes.length === 0 || 
          !parent.classIds || !Object.values(parent.classIds).some(id => id)) {
        setAvailableStudents([]);
        setParent(prev => ({ ...prev, studentIds: [] }));
        return;
      }

      try {
        setLoadingStudents(true);
        const response = await parentApi.getStudentsByTypesAndClasses(
          parent.instituteTypes, 
          parent.classIds, 
          session
        );
        setAvailableStudents(response.data.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error(error.message || "د زده کوونکو په ترلاسه کولو کې تېروتنه");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [parent.classIds, parent.instituteTypes, session]);

  const setP = (k, v) => {
    setParent((f) => ({ ...f, [k]: v }));
    if (errors[k]) {
      setErrors((e) => ({ ...e, [k]: "" }));
    }
  };

  const toggleInstituteType = (type) => {
    setParent((prev) => {
      const currentTypes = Array.isArray(prev.instituteTypes) ? prev.instituteTypes : [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      
      // Reset classIds and studentIds when types change
      const newClassIds = {};
      newTypes.forEach(t => {
        if (prev.classIds[t]) newClassIds[t] = prev.classIds[t];
      });
      
      return { ...prev, instituteTypes: newTypes, classIds: newClassIds, studentIds: [] };
    });
    if (errors.instituteTypes) {
      setErrors((e) => ({ ...e, instituteTypes: "" }));
    }
  };

  const setClassForType = (type, classId) => {
    setParent((prev) => ({
      ...prev,
      classIds: { ...prev.classIds, [type]: classId },
      studentIds: [] // Reset students when class changes
    }));
  };

  const toggleStudent = (studentId) => {
    setParent((prev) => {
      const currentIds = Array.isArray(prev.studentIds) ? prev.studentIds : [];
      const newIds = currentIds.includes(studentId)
        ? currentIds.filter(id => id !== studentId)
        : [...currentIds, studentId];
      return { ...prev, studentIds: newIds };
    });
    if (errors.studentIds) {
      setErrors((e) => ({ ...e, studentIds: "" }));
    }
  };

  const openEditParent = (p) => {
    setParent({ 
      ...EMPTY_PARENT, 
      ...p,
      classIds: p.classId ? { [p.instituteTypes[0]]: p.classId } : {},
      studentIds: p.students ? p.students.map(s => s.id) : []
    });
    setErrors({});
    setIsEditing(true);
    setParentOpen(true);
  };

  const openAddParent = () => {
    setParent({ ...EMPTY_PARENT, registeredAt: new Date().toISOString().split('T')[0] });
    setErrors({});
    setIsEditing(false);
    setParentOpen(true);
  };

  // Student search handler
  useEffect(() => {
    const searchInput = document.getElementById('studentSearch');
    if (!searchInput) return;

    const handleSearch = (e) => {
      const search = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.student-item');
      
      items.forEach(item => {
        const name = item.getAttribute('data-name') || '';
        const father = item.getAttribute('data-father') || '';
        const roll = item.getAttribute('data-roll') || '';
        
        if (name.includes(search) || father.includes(search) || roll.includes(search)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    };

    searchInput.addEventListener('input', handleSearch);
    return () => searchInput.removeEventListener('input', handleSearch);
  }, [availableStudents]);

  const openViewParent = (p) => { setSelected(p); setViewOpen(true); };
  const openDeleteParent = (p) => { setDeleteTarget(p); setDeleteOpen(true); };
  const openPasswordChange = (p) => { 
    setPasswordTarget(p); 
    setNewPassword(""); 
    setConfirmPassword("");
    setPasswordError(""); 
    setConfirmPasswordError("");
    setPasswordOpen(true); 
  };

  const handleSaveParent = async () => {
    const validationErrors = validateParent(parent);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      if (isEditing && parent.id) {
        const response = await parentApi.updateParent(parent.id, parent);
        toast.success(response.message || "والد بریالیتوب سره تازه شو");
      } else {
        const response = await parentApi.createParent(parent);
        toast.success(response.message || "والد بریالیتوب سره ثبت شو");
      }
      setParentOpen(false);
      setParent(EMPTY_PARENT);
      setErrors({});
      setIsEditing(false);
      
      if (page === 1) {
        await fetchParents();
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Error saving parent:", error);
      toast.error(error.message || "د والد په ثبتولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      await parentApi.deleteParent(deleteTarget.id);
      toast.success("والد بریالیتوب سره ړنګ شو");
      setDeleteOpen(false);
      setDeleteTarget(null);
      
      if (page === 1) {
        await fetchParents();
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Error deleting parent:", error);
      toast.error(error.message || "په ړنګولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setConfirmPasswordError("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("فاسورډ باید لږترلږه ۶ توري ولري");
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("د فاسورډ تایید اړین دی");
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("فاسورډونه سره سمون نلري");
      return;
    }

    try {
      setLoading(true);
      await parentApi.changeParentPassword(passwordTarget.id, newPassword, confirmPassword);
      toast.success("فاسورډ بریالیتوب سره بدل شو");
      setPasswordOpen(false);
      setPasswordTarget(null);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setConfirmPasswordError("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.message || "په فاسورډ بدلولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Export all parents to Excel
  const handleExportAllParents = async () => {
    try {
      setExportLoading(true);
      const response = await parentApi.getAllParents({ ...filters, page: 1, limit: 10000 });
      const allParents = response.data.parents || [];
      
      if (allParents.length === 0) {
        toast.error("د صادرولو لپاره هیڅ والد شتون نلري");
        return;
      }

      await exportParentsToExcel(allParents);
      toast.success(`${allParents.length} والدین بریالیتوب سره صادر شول`);
    } catch (error) {
      console.error("Error exporting parents:", error);
      toast.error(error.message || "د صادرولو په وخت کې تېروتنه");
    } finally {
      setExportLoading(false);
    }
  };

  // PDF export
  const handlePdfParents = async () => {
    try {
      setPdfLoading(true);
      const response = await parentApi.getAllParents({ ...filters, page: 1, limit: 10000 });
      const all = response.data.parents || [];
      if (!all.length) { toast.error("د صادرولو لپاره هیڅ والد شتون نلري"); return; }
      await exportParentsPDF(all, filters);
      toast.success(`${all.length} والدین بریالیتوب سره صادر شول`);
    } catch (error) {
      toast.error(error.message || "د PDF په جوړولو کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

  const columnDefs = useMemo(() => [
    { 
      field: "name", 
      headerName: "نوم",
      flex: 1.2,
      minWidth: 150,
    },
    { 
      field: "phone", 
      headerName: "ټېلیفون",
      flex: 1,
      minWidth: 130,
    },
    { 
      field: "instituteTypes", 
      headerName: "د مؤسسې ډول",
      flex: 1,
      minWidth: 140,
      cellRenderer: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "—";
        return (
          <span className="flex gap-1 flex-wrap">
            {params.value.map((type) => {
              const t = INSTITUTE_TYPES.find((t) => t.value === type);
              return <Badge key={type} variant={t?.variant ?? "muted"}>{t?.label ?? type}</Badge>;
            })}
          </span>
        );
      }
    },
    { 
      field: "students", 
      headerName: "زده کوونکي",
      flex: 1,
      minWidth: 100,
      cellRenderer: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "۰";
        return <Badge variant="info">{params.value.length}</Badge>;
      }
    },
    { 
      field: "username", 
      headerName: "کارن نوم",
      flex: 1,
      minWidth: 120,
    },
    { 
      field: "registeredAt", 
      headerName: "د ثبت نېټه",
      flex: 0.9,
      minWidth: 110,
    },
    { 
      field: "actions", 
      headerName: "",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const p = params.data;
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); openViewParent(p); }} 
              title="کتل" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditParent(p); }} 
              title="سمول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openPasswordChange(p); }} 
              title="فاسورډ بدلول" 
              className="p-1.5 rounded hover:bg-muted text-blue-600"
            >
              <KeyRound className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openDeleteParent(p); }} 
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
      <PageHeader 
        title="والدین" 
        subtitle="د والدینو اداره"
        actions={
          <button onClick={openAddParent} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="size-3.5" /> نوی والد
          </button>
        }
      />

      <FilterBar 
        filters={PARENT_FILTERS}
        defaultValues={{ academicYear: String(new Date().getFullYear()) }}
        onApply={(f) => { setFilters(f); setPage(1); }} 
        onClear={() => { setFilters({}); setPage(1); }} 
      />
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={parents}
        loading={loading}
        emptyText="هیڅ والد ونه موندل شو"
        searchPlaceholder="د والد نوم، ټېلیفون..."
        serverSidePagination={true}
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableRtl={true}
        enableExport={true}
        exportFileName="parents"
        onExportClick={handleExportAllParents}
        onPdfClick={handlePdfParents}
        exportLoading={exportLoading}
        pdfLoading={pdfLoading}
      />

      {/* ── View modal ─────────────────────────────────────────────────── */}
      <ErpModal 
        open={viewOpen} 
        onOpenChange={setViewOpen} 
        title="د والد معلومات" 
        size="md"
        footer={<button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DV label="بشپړ نوم" value={selected.name} />
            <DV label="ټېلیفون" value={selected.phone} />
            <DV label="تذکیره" value={selected.idCardNumber} />
            <DV label="د مؤسسې ډول" value={
              Array.isArray(selected.instituteTypes) 
                ? selected.instituteTypes.map(type => INSTITUTE_TYPES.find(t => t.value === type)?.label || type).join("، ")
                : "—"
            } />
            <DV label="کارن نوم" value={selected.username} />
            <DV label="د ثبت نېټه" value={selected.registeredAt} />
            <div className="col-span-2">
              <p className="text-[11px] text-muted-foreground mb-2">زده کوونکي</p>
              {selected.students && selected.students.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selected.students.map(s => (
                    <Badge key={s.id} variant="info">{s.name} ({s.rollNumber || "—"})</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">هیڅ زده کوونکی ندی</p>
              )}
            </div>
            {selected.notes && <div className="col-span-2"><DV label="یادښتونه" value={selected.notes} /></div>}
          </div>
        )}
      </ErpModal>

      {/* ── Parent form modal ──────────────────────────────────────────── */}
      <ErpModal 
        open={parentOpen} 
        onOpenChange={setParentOpen} 
        title={isEditing ? "والد سمول" : "والد ثبتول"} 
        size="lg"
        footer={<>
          <button onClick={() => setParentOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>لغوه</button>
          <button onClick={handleSaveParent} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
            {loading ? "...په ثبتیدو کې" : "ثبتول"}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto px-1">
          <div>
            <F label="بشپړ نوم" error={errors.name}>
              <Input value={parent.name} handleChanges={(e) => setP("name", e.target.value)} placeholder="بشپړ نوم" />
            </F>
          </div>
          <div>
            <F label="ټېلیفون" error={errors.phone}>
              <Input value={parent.phone} handleChanges={(e) => setP("phone", e.target.value)} placeholder="+93 7XX XXX XXX" />
            </F>
          </div>
          <div>
            <F label="تذکیره نمبر" opt error={errors.idCardNumber}>
              <Input value={parent.idCardNumber} handleChanges={(e) => setP("idCardNumber", e.target.value)} placeholder="تذکیره نمبر" />
            </F>
          </div>
          <div>
            <F label="د ثبت نېټه" opt>
              <Input type="date" value={parent.registeredAt} handleChanges={(e) => setP("registeredAt", e.target.value)} />
            </F>
          </div>

          {/* Institute Types */}
          <div className="col-span-2">
            <F label="د مؤسسې ډول" error={errors.instituteTypes}>
              <div className="flex gap-2">
                {INSTITUTE_TYPES.map(({ value, label }) => {
                  const active = Array.isArray(parent.instituteTypes) && parent.instituteTypes.includes(value);
                  return (
                    <button key={value} type="button" onClick={() => toggleInstituteType(value)}
                      className={`flex-1 py-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${active ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted text-foreground"}`}>
                      {active && <span className="size-1.5 rounded-full bg-primary-foreground inline-block" />}{label}
                    </button>
                  );
                })}
              </div>
            </F>
          </div>

          {/* Classes for each selected type */}
          {parent.instituteTypes && parent.instituteTypes.length > 0 && (
            <div className="col-span-2 space-y-3">
              <p className="text-xs text-muted-foreground">ټولګي وټاکئ (اختیاري)</p>
              {loadingClasses ? (
                <p className="text-xs text-muted-foreground">...په لټون کې</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parent.instituteTypes.map(type => (
                    <div key={type}>
                      <label className="text-xs text-muted-foreground block mb-1">
                        {INSTITUTE_TYPES.find(t => t.value === type)?.label} ټولګی
                      </label>
                      <select 
                        value={parent.classIds[type] || ""} 
                        onChange={(e) => setClassForType(type, e.target.value)}
                        className={SEL}
                      >
                        <option value="">— ټولګی وټاکئ —</option>
                        {availableClasses[type]?.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Students */}
          {parent.instituteTypes && parent.instituteTypes.length > 0 && 
           parent.classIds && Object.values(parent.classIds).some(id => id) && (
            <div className="col-span-2">
              <F label="زده کوونکي وټاکئ" error={errors.studentIds}>
                {loadingStudents ? (
                  <p className="text-xs text-muted-foreground">...په لټون کې</p>
                ) : availableStudents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">هیڅ زده کوونکی ونه موندل شو</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{availableStudents.length} زده کوونکي</span>
                      <span>{parent.studentIds.length} غوره شوي</span>
                    </div>
                    <div className="border border-input rounded max-h-64 overflow-y-auto">
                      <div className="sticky top-0 bg-background border-b border-input p-2">
                        <input 
                          type="text" 
                          placeholder="زده کوونکی لټون..."
                          className="w-full px-2 py-1.5 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                          id="studentSearch"
                        />
                      </div>
                      <div className="p-2 space-y-1" id="studentList">
                        {availableStudents.map(student => {
                          const isSelected = parent.studentIds.includes(student.id);
                          return (
                            <label 
                              key={student.id} 
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors student-item ${isSelected ? "bg-muted" : ""}`}
                              data-name={student.fullName.toLowerCase()}
                              data-father={student.fatherName?.toLowerCase() || ""}
                              data-roll={student.rollNumber?.toLowerCase() || ""}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleStudent(student.id)}
                                className="size-4 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{student.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {student.fatherName} • {student.className || "—"} • {student.rollNumber || "—"}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </F>
            </div>
          )}

          {/* Username & Password */}
          <div>
            <F label="کارن نوم" error={errors.username}>
              <Input value={parent.username} handleChanges={(e) => setP("username", e.target.value)} placeholder="username" />
            </F>
          </div>
          <div>
            <F label="پټنوم" error={errors.password}>
              <Input type="password" value={parent.password} handleChanges={(e) => setP("password", e.target.value)} placeholder="••••••" />
            </F>
          </div>

          <div className="col-span-2">
            <F label="پته" opt error={errors.address}>
              <Input value={parent.address} handleChanges={(e) => setP("address", e.target.value)} placeholder="ولایت، ښار" />
            </F>
          </div>
          <div className="col-span-2">
            <F label="یادښتونه" opt error={errors.notes}>
              <textarea rows={2} value={parent.notes} onChange={(e) => setP("notes", e.target.value)} className={`${SEL} resize-none`} />
            </F>
          </div>
        </div>
      </ErpModal>

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title={deleteTarget?.name}
      />

      {/* Password Change Modal */}
      <ErpModal 
        open={passwordOpen} 
        onOpenChange={setPasswordOpen} 
        title="فاسورډ بدلول" 
        size="sm"
        footer={<>
          <button onClick={() => setPasswordOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>لغوه</button>
          <button onClick={handlePasswordChange} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
            {loading ? "...په بدلیدو کې" : "بدلول"}
          </button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-3">د <span className="font-medium">{passwordTarget?.name}</span> فاسورډ بدلول</p>
          </div>
          <F label="نوی فاسورډ" error={passwordError}>
            <Input 
              type="password" 
              value={newPassword} 
              handleChanges={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }} 
              placeholder="••••••" 
            />
          </F>
          <F label="د فاسورډ تایید" error={confirmPasswordError}>
            <Input 
              type="password" 
              value={confirmPassword} 
              handleChanges={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError("");
              }} 
              placeholder="••••••" 
            />
          </F>
        </div>
      </ErpModal>
    </div>
  );
}

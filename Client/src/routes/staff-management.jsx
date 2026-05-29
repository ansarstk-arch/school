import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Eye, Upload, X } from "lucide-react";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import * as staffApi from "@/data/staffApi";
import { toast } from "sonner";
import { exportStaffToExcel } from "@/utils/excelExport";
import { ImageLightbox } from "@/components/erp/ImageLightbox";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
const imgUrl = (path) => path ? `${API_BASE}/uploads/staff/${path}` : null;

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
  </label>
);

const STAFF_TYPES = [
  { value: "School",  label: "ښوونځی", variant: "info"    },
  { value: "Center",  label: "مرکز",   variant: "muted"   },
  { value: "Madrasa", label: "مدرسه",  variant: "warning" },
];

const EMPTY_STAFF = { name: "", fatherName: "", phone: "", idCardNumber: "", position: "", staffType: ["School"], salary: "", notes: "", image: null, removeImage: false };

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
        <span className="text-xs text-muted-foreground">د کارمند انځور (اختیاري)</span>
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
const validateStaff = (data) => {
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

  if (!data.phone?.trim()) {
    errors.phone = "ټېلیفون نمبر اړین دی";
  } else if (!phoneRegex.test(data.phone)) {
    errors.phone = "ټېلیفون نمبر باید د افغانستان د فارمټ سره سم وي (+93 7XX XXX XXX)";
  }

  if (!data.position?.trim()) {
    errors.position = "مسئولیت اړین دی";
  } else if (data.position.length < 2 || data.position.length > 100) {
    errors.position = "مسئولیت باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  // Staff type validation
  if (!data.staffType || !Array.isArray(data.staffType) || data.staffType.length === 0) {
    errors.staffType = "د کارمند ډول اړین دی - لږترلږه یو ډول وټاکئ";
  }

  if (!data.salary) {
    errors.salary = "معاش اړین دی";
  } else if (isNaN(data.salary) || Number(data.salary) <= 0) {
    errors.salary = "معاش باید له صفر څخه زیات وي";
  }

  // Optional fields validation
  if (data.fatherName && !nameRegex.test(data.fatherName)) {
    errors.fatherName = "د پلار نوم یوازې پښتو، دري یا انګلیسي توري ولري";
  } else if (data.fatherName && (data.fatherName.length < 2 || data.fatherName.length > 100)) {
    errors.fatherName = "د پلار نوم باید د ۲ څخه تر ۱۰۰ توري پورې وي";
  }

  if (data.idCardNumber && (data.idCardNumber.length < 5 || data.idCardNumber.length > 20)) {
    errors.idCardNumber = "تذکیره نمبر باید د ۵ څخه تر ۲۰ توري پورې وي";
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "یادښتونه باید د ۵۰۰ توري څخه لږ وي";
  }

  return errors;
};

// ─── Filters ──────────────────────────────────────────────────────────────────
const STAFF_FILTERS = [
  { key: "id",             label: "د کارمند ID", type: "input",  placeholder: "د کارمند ID..." },
  { key: "name",           label: "د نوم لټون",   type: "input",  placeholder: "د کارمند نوم..." },
  { key: "phone",          label: "ټېلیفون",      type: "input",  placeholder: "+93 7XX XXX XXX" },
  { key: "position",       label: "مسئولیت",      type: "input",  placeholder: "مسئولیت..." },
  { key: "staffType",      label: "د کارمند ډول", type: "select", options: STAFF_TYPES.map(({ value, label }) => ({ value, label })) },
  { key: "joiningYear",    label: "د شمولیت کال", type: "shamsiYear", placeholder: "د شمولیت کال" },
];

export default function StaffPage() {
  const [staff, setStaff]               = useState([]);
  const [staffOpen, setStaffOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [form, setForm]                 = useState(EMPTY_STAFF);
  const [selected, setSelected]         = useState(null);
  const [filters, setFilters]           = useState({});
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [staffImageFile, setStaffImageFile] = useState(null);
  
  // Pagination states
  const [staffPage, setStaffPage]       = useState(1);
  const [pagination, setPagination]     = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });
  const [exportLoading, setExportLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffApi.getAllStaff({ ...filters, page: staffPage, limit: 12 });
      setStaff(response.data.staff || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 12 });
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error(error.message || "د کارمندانو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff on mount and when filters or page change
  useEffect(() => {
    // Set default filter to current year if no filters are set
    const currentYear = new Date().getFullYear();
    const defaultFilters = Object.keys(filters).length === 0 ? { joiningYear: currentYear } : filters;
    
    if (JSON.stringify(defaultFilters) !== JSON.stringify(filters)) {
      setFilters(defaultFilters);
    } else {
      fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, staffPage]);

  const setF = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear error for this field when user types
    if (errors[k]) {
      setErrors((e) => ({ ...e, [k]: "" }));
    }
  };

  const toggleStaffType = (type) => {
    setForm((prev) => {
      const currentTypes = Array.isArray(prev.staffType) ? prev.staffType : [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      return { ...prev, staffType: newTypes };
    });
    // Clear error when user selects a type
    if (errors.staffType) {
      setErrors((e) => ({ ...e, staffType: "" }));
    }
  };

  const openEditStaff = (s) => { 
    setForm({ 
      name: s.name || "",
      fatherName: s.fatherName || "",
      phone: s.phone || "",
      idCardNumber: s.idCardNumber || "",
      position: s.position || s.role || "",
      staffType: Array.isArray(s.staffType) ? s.staffType : ["School"],
      salary: s.salary || "",
      notes: s.notes || "",
      image: s.image || null,
      removeImage: false,
    }); 
    setErrors({});
    setStaffImageFile(null);
    setIsEditing(true);
    setSelected(s);
    setStaffOpen(true); 
  };
  
  const openAddStaff = () => {
    setForm({ ...EMPTY_STAFF });
    setErrors({});
    setStaffImageFile(null);
    setIsEditing(false);
    setSelected(null);
    setStaffOpen(true);
  };

  const handleViewOpenChange = (open) => {
    setViewOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

  const openViewStaff = (s) => { setSelected(s); setViewOpen(true); };
  const openDeleteStaff = (s) => { setSelected(s); setDeleteOpen(true); };

  const handleSaveStaff = async () => {
    const validationErrors = validateStaff(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const { image: _img, removeImage, ...staffData } = form;
      
      if (isEditing && selected?.id) {
        const response = await staffApi.updateStaff(selected.id, { ...staffData, removeImage: form.removeImage }, staffImageFile);
        toast.success(response.message || "کارمند بریالیتوب سره تازه شو");
      } else {
        const response = await staffApi.createStaff(staffData, staffImageFile);
        toast.success(response.message || "کارمند بریالیتوب سره ثبت شو");
      }
      setStaffOpen(false);
      setForm(EMPTY_STAFF);
      setErrors({});
      setStaffImageFile(null);
      setIsEditing(false);
      setSelected(null);
      
      // Reset to first page and fetch
      if (staffPage === 1) {
        await fetchStaff();
      } else {
        setStaffPage(1);
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error(error.message || "د کارمند په ثبتولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async () => {
    if (!selected) return;

    try {
      setLoading(true);
      await staffApi.deleteStaff(selected.id);
      toast.success("کارمند بریالیتوب سره ړنګ شو");
      
      // Refresh staff list
      if (staffPage === 1) {
        await fetchStaff();
      } else {
        setStaffPage(1);
      }
      setDeleteOpen(false);
      setSelected(null);
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error(error.message || "په ړنګولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Export all staff to Excel
  const handleExportAllStaff = async () => {
    try {
      setExportLoading(true);
      const response = await staffApi.getAllStaff({ ...filters, page: 1, limit: 10000 });
      const allStaff = response.data.staff || [];
      
      if (allStaff.length === 0) {
        toast.error("د صادرولو لپاره هیڅ کارمند شتون نلري");
        return;
      }

      await exportStaffToExcel(allStaff);
      toast.success(`${allStaff.length} کارمندان بریالیتوب سره صادر شول`);
    } catch (error) {
      console.error("Error exporting staff:", error);
      toast.error(error.message || "د صادرولو په وخت کې تېروتنه");
    } finally {
      setExportLoading(false);
    }
  };

  // AG Grid column definitions for staff
  const staffColumnDefs = useMemo(() => [
    { 
      field: "name", 
      headerName: "بشپړ نوم",
      flex: 1.3,
      minWidth: 160,
    },
    { 
      field: "phone", 
      headerName: "ټېلیفون",
      flex: 1.1,
      minWidth: 140,
    },
    { 
      field: "position", 
      headerName: "مسئولیت",
      flex: 1.2,
      minWidth: 150,
      valueGetter: (params) => params.data?.position || params.data?.role || "—",
    },
    { 
      field: "staffType", 
      headerName: "ډول",
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "—";
        return params.value.map(type => {
          const t = STAFF_TYPES.find((t) => t.value === type);
          return t?.label ?? type;
        }).join(', ');
      },
      cellRenderer: (params) => {
        if (!params.value || !Array.isArray(params.value)) return "—";
        return (
          <span className="flex gap-1 flex-wrap">
            {params.value.map((type) => {
              const t = STAFF_TYPES.find((t) => t.value === type);
              return <Badge key={type} variant={t?.variant ?? "muted"}>{t?.label ?? type}</Badge>;
            })}
          </span>
        );
      }
    },
    { 
      field: "salary", 
      headerName: "معاش",
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        if (!params.data?.salary) return "—";
        return `AFN ${Number(params.data.salary).toLocaleString()}`;
      }
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
            <button 
              onClick={(e) => { e.stopPropagation(); openViewStaff(s); }} 
              title="کتل" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditStaff(s); }} 
              title="سمول" 
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openDeleteStaff(s); }} 
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
      <PageHeader title="کارمندان" subtitle="د کارمندانو اداره او ثبت"
        actions={
          <button onClick={openAddStaff} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="size-3.5" /> نوی کارمند
          </button>
        }
      />

      <FilterBar filters={STAFF_FILTERS} onApply={(f) => { setFilters(f); setStaffPage(1); }} onClear={() => { setFilters({}); setStaffPage(1); }} />

      <AgGridTable
        columnDefs={staffColumnDefs}
        rowData={staff}
        loading={loading}
        emptyText="هیڅ کارمند ونه موندل شو"
        searchPlaceholder="د کارمند نوم، ټېلیفون..."
        serverSidePagination={true}
        pageSize={pagination.limit || 12}
        totalRows={pagination.total}
        currentPage={staffPage}
        totalPages={pagination.totalPages}
        onPageChange={setStaffPage}
        enableRtl={true}
        enableExport={true}
        exportFileName="staff"
        onExportClick={handleExportAllStaff}
        exportLoading={exportLoading}
      />

      {/* ── View modal ─────────────────────────────────────────────────── */}
      <ErpModal open={viewOpen} onOpenChange={handleViewOpenChange} title="د کارمند معلومات" size="md"
        footer={<button onClick={() => handleViewOpenChange(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {selected && (
          <div className="flex gap-4">
            {/* Details - Left side */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DV label="بشپړ نوم" value={selected.name} />
              <DV label="د پلار نوم" value={selected.fatherName} />
              <DV label="ټېلیفون" value={selected.phone} />
              <DV label="تذکیره نمبر" value={selected.idCardNumber} />
              <DV label="مسئولیت" value={selected.position || selected.role} />
              <DV label="د کارمند ډول" value={
                Array.isArray(selected.staffType) 
                  ? selected.staffType.map(type => STAFF_TYPES.find(t => t.value === type)?.label || type).join("، ")
                  : "—"
              } />
              <DV label="معاش" value={selected.salary ? `AFN ${Number(selected.salary).toLocaleString()}` : "—"} />
              <DV label="د شمولیت نېټه" value={selected.joiningDate || selected.joinedAt || selected.createdAt} />
              <DV label="حالت" value={selected.status === "active" ? "فعال" : "غیر فعال"} />
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

      {/* ── Staff form modal ──────────────────────────────────────────── */}
      <ErpModal open={staffOpen} onOpenChange={setStaffOpen} title={isEditing ? "کارمند سمول" : "کارمند ثبتول"} size="md"
        footer={<>
          <button onClick={() => setStaffOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>لغوه</button>
          <button onClick={handleSaveStaff} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
            {loading ? "...په ثبتیدو کې" : "ثبتول"}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <F label="بشپړ نوم"><Input value={form.name} handleChanges={(e) => setF("name", e.target.value)} placeholder="بشپړ نوم" /></F>
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <F label="د پلار نوم" opt><Input value={form.fatherName} handleChanges={(e) => setF("fatherName", e.target.value)} placeholder="د پلار نوم" /></F>
            {errors.fatherName && <p className="text-xs text-destructive mt-1">{errors.fatherName}</p>}
          </div>
          <div>
            <F label="ټېلیفون"><Input value={form.phone} handleChanges={(e) => setF("phone", e.target.value)} placeholder="+93 7XX XXX XXX" /></F>
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
          </div>
          <div>
            <F label="تذکیره نمبر" opt><Input value={form.idCardNumber} handleChanges={(e) => setF("idCardNumber", e.target.value)} placeholder="تذکیره نمبر" /></F>
            {errors.idCardNumber && <p className="text-xs text-destructive mt-1">{errors.idCardNumber}</p>}
          </div>
          <div>
            <F label="مسئولیت"><Input value={form.position} handleChanges={(e) => setF("position", e.target.value)} placeholder="مسئولیت" /></F>
            {errors.position && <p className="text-xs text-destructive mt-1">{errors.position}</p>}
          </div>
          <div>
            <F label="معاش (افغانۍ)"><Input type="number" value={form.salary} handleChanges={(e) => setF("salary", e.target.value)} placeholder="0" /></F>
            {errors.salary && <p className="text-xs text-destructive mt-1">{errors.salary}</p>}
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1.5">د کارمند ډول</span>
            <div className="flex gap-2">
              {STAFF_TYPES.map(({ value, label }) => {
                const active = Array.isArray(form.staffType) && form.staffType.includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleStaffType(value)}
                    className={`flex-1 py-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${active ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted text-foreground"}`}>
                    {active && <span className="size-1.5 rounded-full bg-primary-foreground inline-block" />}{label}
                  </button>
                );
              })}
            </div>
            {errors.staffType && <p className="text-xs text-destructive mt-1">{errors.staffType}</p>}
          </div>
          <div className="col-span-2">
            <F label="یادښتونه" opt><textarea rows={2} value={form.notes} onChange={(e) => setF("notes", e.target.value)} className={`${SEL} resize-none`} placeholder="یادښتونه..." /></F>
            {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
          </div>
          <div className="col-span-2">
            <ImageUploadField
              currentImage={isEditing ? form.image : null}
              onFileChange={(file) => { setStaffImageFile(file); setF("removeImage", false); }}
              onRemove={() => { setStaffImageFile(null); setF("removeImage", true); setF("image", null); }}
            />
          </div>
        </div>
      </ErpModal>

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title={selected?.name}
      />
    </div>
  );
}

import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, SlidersHorizontal, X } from "lucide-react";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { currentShamsiYear } from "@/lib/afghan-date";
import { getAllClasses, createClass, updateClass, deleteClass, getTeachersByType } from "@/data/classApi";
import { exportClassesToExcel } from "@/utils/excelExport";
import { exportClassesPDF } from "@/utils/pdfDownload";
import { PdfDownloadButton } from "@/components/erp/PdfDownloadButton";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const TYPE_LABEL  = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
const TYPE_BADGE  = { School: "info",   Center: "muted", Madrasa: "warning" };
const ACTIVE_YEAR = String(currentShamsiYear());
const EMPTY       = { name: "", section: "", academicYear: ACTIVE_YEAR, type: "School", monthlyFee: "", supervisorId: "" };

// ─── Form field wrapper ───────────────────────────────────────────────────────
const F = ({ label, children, error }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

// ─── Client-side validation ───────────────────────────────────────────────────
function validate(f) {
  const errors = {};
  
  // Name validation
  if (!f.name || !f.name.trim()) {
    errors.name = "د ټولګي نوم اړین دی";
  } else if (f.name.length < 1 || f.name.length > 100) {
    errors.name = "د ټولګي نوم باید د ۱ څخه تر ۱۰۰ توري پورې وي";
  }

  // Type validation
  if (!f.type) {
    errors.type = "د ټولګي ډول اړین دی";
  } else {
    const validTypes = ["School", "Center", "Madrasa"];
    if (!validTypes.includes(f.type)) {
      errors.type = "د ټولګي ډول باید ښوونځی، مرکز یا مدرسه وي";
    }
  }

  // Academic year validation
  if (!f.academicYear || !f.academicYear.trim()) {
    errors.academicYear = "تعلیمي کال اړین دی";
  } else if (!/^\d{4}$/.test(f.academicYear)) {
    errors.academicYear = "تعلیمي کال باید د څلورو عددونو څخه جوړ وي";
  }

  // Section validation (optional but if provided must be valid)
  if (f.section && (f.section.length < 1 || f.section.length > 50)) {
    errors.section = "د ټولګي برخه باید د ۱ څخه تر ۵۰ توري پورې وي";
  }

  // Monthly fee validation
  if (f.monthlyFee) {
    if (isNaN(Number(f.monthlyFee))) {
      errors.monthlyFee = "میاشتنۍ فیس باید عدد وي";
    } else if (Number(f.monthlyFee) < 0) {
      errors.monthlyFee = "میاشتنۍ فیس باید مثبت عدد وي";
    }
  }

  return errors;
}

// ─── Inline filter bar with ShamsiYearPicker for the year field ───────────────
function ClassFilterBar({ onApply, onClear }) {
  const [name, setName]               = useState("");
  const [type, setType]               = useState("");
  const [academicYear, setAcademicYear] = useState(ACTIVE_YEAR);
  const [active, setActive]           = useState(true);

  // Fire default filter on mount
  useEffect(() => { onApply({ academicYear: ACTIVE_YEAR }); }, []); // eslint-disable-line

  const hasAny = name || type || academicYear;

  const apply = () => {
    setActive(true);
    onApply({ name: name || undefined, type: type || undefined, academicYear: academicYear || undefined });
  };

  const clear = () => {
    setName(""); setType(""); setAcademicYear(""); setActive(false);
    onClear();
  };

  return (
    <div className={`bg-card border rounded-md p-3 flex items-center gap-2 flex-wrap transition-colors ${active && hasAny ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">فلټر</span>
      </div>
      <div className="w-px h-4 bg-border shrink-0" />

      {/* Name */}
      <div className="flex-1 min-w-[130px]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="د ټولګي نوم لټون..."
          className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring w-full"
        />
      </div>

      {/* Type */}
      <div className="flex-1 min-w-[130px]">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring w-full"
        >
          <option value="">ډول</option>
          <option value="School">ښوونځی</option>
          <option value="Center">مرکز</option>
          <option value="Madrasa">مدرسه</option>
        </select>
      </div>

      {/* Shamsi Year Picker */}
      <div className="flex-1 min-w-[150px]">
        <ShamsiYearPicker
          value={academicYear}
          onChange={setAcademicYear}
          placeholder="تعلیمي کال"
        />
      </div>

      <div className="flex items-center gap-1.5 mr-auto">
        <button
          onClick={apply}
          className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90"
        >
          فلټر کول
        </button>
        {hasAny && (
          <button
            onClick={clear}
            className="text-xs border border-input rounded px-2.5 py-1.5 hover:bg-muted flex items-center gap-1 text-muted-foreground"
          >
            <X className="size-3" /> پاکول
          </button>
        )}
      </div>

      {active && hasAny && (
        <span className="text-[10px] text-primary font-medium">فلټر فعال دی</span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClassesPage() {
  const [classes, setClasses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [open, setOpen]                     = useState(false);
  const [viewOpen, setViewOpen]             = useState(false);
  const [deleteOpen, setDeleteOpen]         = useState(false);
  const [f, setF]                           = useState(EMPTY);
  const [formErrors, setFormErrors]         = useState({});
  const [selected, setSelected]             = useState(null);
  const [editId, setEditId]                 = useState(null);
  const [filters, setFilters]               = useState({ academicYear: ACTIVE_YEAR });
  const [teachers, setTeachers]             = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [exportLoading, setExportLoading]   = useState(false);
  const [pdfLoading, setPdfLoading]         = useState(false);
  const [pagination, setPagination]         = useState({ total: 0, page: 1, totalPages: 1, limit: 50 });

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // ─── Fetch classes ──────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getAllClasses({ ...params, limit: 50 });
      setClasses(res.data?.classes || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, totalPages: 1, limit: 50 });
    } catch (err) {
      toast.error(err.message || "د ټولګیو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(filters); }, [filters, fetchClasses]);

  // ─── Fetch teachers when type changes ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTeachersLoading(true);
    getTeachersByType(f.type)
      .then((res) => setTeachers(res.data?.teachers || []))
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
    setF((p) => ({ ...p, supervisorId: "" }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.type, open]);

  // ─── Open handlers ──────────────────────────────────────────────────────────
  const openAdd = () => { setF(EMPTY); setFormErrors({}); setEditId(null); setOpen(true); };

  const openEdit = (c) => {
    setF({
      name:         c.name,
      section:      c.section || "",
      academicYear: c.academicYear,
      type:         c.type,
      monthlyFee:   c.monthlyFee != null ? String(c.monthlyFee) : "",
      supervisorId: c.supervisorId != null ? String(c.supervisorId) : "",
    });
    setFormErrors({});
    setEditId(c.id);
    setOpen(true);
  };

  const openView   = (c) => { setSelected(c); setViewOpen(true); };
  const openDelete = (c) => { setSelected(c); setDeleteOpen(true); };

  // ─── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errors = validate(f);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        name:         f.name.trim(),
        section:      f.section?.trim() || null,
        type:         f.type,
        academicYear: f.academicYear,
        monthlyFee:   f.monthlyFee ? Number(f.monthlyFee) : undefined,
        supervisorId: f.supervisorId ? Number(f.supervisorId) : undefined,
      };
      if (editId) {
        const res = await updateClass(editId, payload);
        toast.success(res.message || "ټولګی بریالیتوب سره تازه شو");
      } else {
        const res = await createClass(payload);
        toast.success(res.message || "ټولګی بریالیتوب سره ثبت شو");
      }
      setOpen(false);
      fetchClasses(filters);
    } catch (err) {
      setFormErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      const res = await deleteClass(selected.id);
      toast.success(res.message || "ټولګی بریالیتوب سره ړنګ شو");
      setDeleteOpen(false);
      fetchClasses(filters);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ─── Excel export ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const exportFilters = { academicYear: ACTIVE_YEAR, ...filters };
      const res = await getAllClasses({ ...exportFilters, limit: 10000 });
      const all = res.data?.classes || [];
      if (!all.length) { toast.error("د صادرولو لپاره هیڅ ټولګی شتون نلري"); return; }
      await exportClassesToExcel(all);
      toast.success(`${all.length} ټولګي بریالیتوب سره صادر شول`);
    } catch (err) {
      toast.error(err.message || "د صادرولو کې تېروتنه");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePdf = async () => {
    try {
      setPdfLoading(true);
      const exportFilters = { academicYear: ACTIVE_YEAR, ...filters };
      const res = await getAllClasses({ ...exportFilters, limit: 10000 });
      const all = res.data?.classes || [];
      if (!all.length) { toast.error("د صادرولو لپاره هیڅ ټولګی شتون نلري"); return; }
      await exportClassesPDF(all, exportFilters);
      toast.success(`${all.length} ټولګي بریالیتوب سره صادر شول`);
    } catch (err) {
      toast.error(err.message || "د PDF په جوړولو کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

  // ─── AG Grid columns ─────────────────────────────────────────────────────────
  const columnDefs = useMemo(() => [
    {
      field: "name",
      headerName: "د ټولګي نوم",
      flex: 1.4, minWidth: 150,
      cellRenderer: (p) => <span className="font-medium">{p.value}</span>,
    },
    {
      field: "section",
      headerName: "څانګه",
      flex: 0.8, minWidth: 90,
      cellRenderer: (p) => p.value || "—",
    },
    {
      field: "type",
      headerName: "ډول",
      flex: 0.9, minWidth: 100,
      cellRenderer: (p) => <Badge variant={TYPE_BADGE[p.value]}>{TYPE_LABEL[p.value] || p.value}</Badge>,
    },
    {
      field: "academicYear",
      headerName: "تعلیمي کال",
      flex: 0.9, minWidth: 110,
    },
    {
      field: "monthlyFee",
      headerName: "میاشتنی فیس",
      flex: 1, minWidth: 120,
      cellRenderer: (p) => p.value ? `AFN ${Number(p.value).toLocaleString()}` : "—",
    },
    {
      field: "supervisorName",
      headerName: "نهګران",
      flex: 1.2, minWidth: 140,
      cellRenderer: (p) => p.value || "—",
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.8, minWidth: 110,
      sortable: false, filter: false,
      cellRenderer: (p) => {
        const c = p.data;
        return (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); openView(c); }}   className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Eye    className="size-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); openEdit(c); }}   className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Pencil className="size-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); openDelete(c); }} className="p-1.5 rounded hover:bg-muted text-destructive">    <Trash2 className="size-3.5" /></button>
          </div>
        );
      },
    },
  ], []);

  const DV = ({ label, value }) => (
    <div><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-medium">{value || "—"}</p></div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="ټولګي"
        subtitle="د ټولګیو اداره او لیست"
        actions={
          <button onClick={openAdd} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="size-3.5" /> نوی ټولګی
          </button>
        }
      />

      {/* Custom filter bar with ShamsiYearPicker */}
      <ClassFilterBar
        onApply={(vals) => setFilters(vals)}
        onClear={() => setFilters({})}
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={classes}
        loading={loading}
        emptyText="هیڅ ټولګی ونه موندل شو"
        searchPlaceholder="د ټولګي نوم، نهګران..."
        serverSidePagination={true}
        pageSize={pagination.limit || 50}
        totalRows={pagination.total}
        currentPage={pagination.page || 1}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
        enableRtl={true}
        enableExport={true}
        exportFileName="classes"
        onExportClick={handleExport}
        onPdfClick={handlePdf}
        exportLoading={exportLoading}
        pdfLoading={pdfLoading}
      />

      {/* ── View Modal ── */}
      <ErpModal open={viewOpen} onOpenChange={setViewOpen} title="د ټولګي معلومات" size="sm"
        footer={<button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DV label="نوم"         value={selected.name} />
            <DV label="څانګه"       value={selected.section} />
            <DV label="ډول"         value={TYPE_LABEL[selected.type]} />
            <DV label="تعلیمي کال"  value={selected.academicYear} />
            <DV label="میاشتنی فیس" value={selected.monthlyFee ? `AFN ${Number(selected.monthlyFee).toLocaleString()}` : "—"} />
            <DV label="نهګران"      value={selected.supervisorName} />
          </div>
        )}
      </ErpModal>

      {/* ── Add / Edit Modal ── */}
      <ErpModal
        open={open}
        onOpenChange={(v) => { if (!saving) setOpen(v); }}
        title={editId ? "ټولګی سمول" : "نوی ټولګی"}
        footer={
          <>
            <button onClick={() => setOpen(false)} disabled={saving} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50">لغوه</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              {saving ? "..." : "ساتل"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formErrors.api && (
            <p className="col-span-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{formErrors.api}</p>
          )}

          <F label="د ټولګي نوم *" error={formErrors.name}>
            <Input value={f.name} handleChanges={(e) => set("name", e.target.value)} placeholder="مثال: ټولګی ۱۰" />
          </F>

          <F label="څانګه" error={formErrors.section}>
            <Input value={f.section} handleChanges={(e) => set("section", e.target.value)} placeholder="الف، ب، A، B" />
          </F>

          <F label="ډول *" error={formErrors.type}>
            <select value={f.type} onChange={(e) => set("type", e.target.value)} className={SEL}>
              <option value="School">ښوونځی</option>
              <option value="Center">مرکز</option>
              <option value="Madrasa">مدرسه</option>
            </select>
          </F>

          {/* Shamsi Year Picker — no hardcoded years, defaults to today */}
          <F label="تعلیمي کال *">
            <ShamsiYearPicker
              value={f.academicYear}
              onChange={(y) => set("academicYear", y)}
              error={formErrors.academicYear}
            />
          </F>

          <F label="میاشتنی فیس (افغانۍ)" error={formErrors.monthlyFee}>
            <Input type="number" value={f.monthlyFee} handleChanges={(e) => set("monthlyFee", e.target.value)} placeholder="0" />
          </F>

          <F label="نهګران (ښوونکی)">
            <select value={f.supervisorId} onChange={(e) => set("supervisorId", e.target.value)} className={SEL} disabled={teachersLoading}>
              <option value="">{teachersLoading ? "بارول..." : "— نهګران غوره کړئ —"}</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.teacherType === "Both" ? " (دواړه)" : ""}
                </option>
              ))}
            </select>
          </F>
        </div>
      </ErpModal>

      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={selected?.name}
        subtitle={selected?.section}
      />
    </div>
  );
}

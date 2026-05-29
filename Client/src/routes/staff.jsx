import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, KeyRound, ShieldCheck } from "lucide-react";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { cn } from "@/lib/utils";
import * as staffApi from "@/data/staffApi";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">
      {label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}
    </span>
    {children}
  </label>
);

// ─── Permission modules ───────────────────────────────────────────────────────
const MODULES = [
  { key: "students",    label: "زده کوونکي",         desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "teachers",    label: "ښوونکي",              desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "parents",     label: "والدین",              desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "classes",     label: "ټولګي",               desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "subjects",    label: "مضامین",              desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "attendance",  label: "حاضري",               desc: "ثبت او کتل"                },
  { key: "exams",       label: "ازموینې",             desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "expenses",    label: "لګښتونه",             desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "revenue",     label: "عاید او فیسونه",      desc: "ثبت، کتل، سمول، ړنګول"     },
  { key: "reports",     label: "راپورونه",             desc: "کتل او صادرول"              },
  { key: "certificates",label: "سندونه",              desc: "جوړول او چاپ"               },
  { key: "settings",    label: "تنظیمات",             desc: "د سیسټم تنظیمات"            },
];

const ROLE_PRESETS = {
  admin:     { label: "مدیر",           variant: "destructive", perms: Object.fromEntries(MODULES.map((m) => [m.key, true]))  },
  registrar: { label: "ثبت نام",        variant: "info",        perms: { students: true, classes: true, attendance: true, revenue: true } },
  teacher:   { label: "ښوونکی",         variant: "success",     perms: { attendance: true, exams: true, reports: true } },
  accountant:{ label: "محاسب",          variant: "warning",     perms: { expenses: true, revenue: true, reports: true } },
  custom:    { label: "ځانګړی",         variant: "muted",       perms: {} },
};

const EMPTY_FORM = {
  name: "", fatherName: "", phone: "", idCardNumber: "",
  role: "registrar",
  permissions: { ...ROLE_PRESETS.registrar.perms },
  username: "", password: "",
  status: "active",
  joinedAt: new Date().toISOString().slice(0, 10),
  notes: "",
};



const STAFF_FILTERS = [
  { key: "name",     label: "د نوم لټون", type: "input",  placeholder: "د کارمند نوم..." },
  { key: "position", label: "مسئولیت",    type: "input",  placeholder: "مسئولیت..." },
  { key: "status",   label: "حالت",       type: "select", options: [{ value: "active", label: "فعال" }, { value: "inactive", label: "غیر فعال" }] },
];

export default function StaffPage() {
  const [staff, setStaff]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });
  const [formOpen, setFormOpen]     = useState(false);
  const [viewOpen, setViewOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pwOpen, setPwOpen]         = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [selected, setSelected]     = useState(null);
  const [isEdit, setIsEdit]         = useState(false);
  const [pw, setPw]                 = useState({ newPw: "", confirmPw: "" });
  const [filters, setFilters]       = useState({});

  // Fetch staff from API
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffApi.getAllStaff({ ...filters, page, limit: 12 });
      setStaff(response.data.staff || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 1, page: 1, limit: 12 });
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("د کارمندانو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [filters, page]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const applyRole = (role) => {
    const preset = ROLE_PRESETS[role];
    setForm((p) => ({ ...p, role, permissions: { ...preset.perms } }));
  };

  const togglePerm = (key) =>
    setForm((p) => ({
      ...p,
      role: "custom",
      permissions: { ...p.permissions, [key]: !p.permissions[key] },
    }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, joinedAt: new Date().toISOString().slice(0, 10), permissions: { ...ROLE_PRESETS.registrar.perms } });
    setIsEdit(false);
    setFormOpen(true);
  };
  const openEdit   = (s) => { setForm({ ...EMPTY_FORM, ...s, password: "" }); setIsEdit(true); setSelected(s); setFormOpen(true); };
  const openView   = (s) => { setSelected(s); setViewOpen(true); };
  const openDelete = (s) => { setSelected(s); setDeleteOpen(true); };
  const openPw     = (s) => { setSelected(s); setPw({ newPw: "", confirmPw: "" }); setPwOpen(true); };

  const save = async () => {
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      if (isEdit) {
        await staffApi.updateStaff(selected.id, form);
        toast.success("کارمند بریالیتوب سره تازه شو");
      } else {
        await staffApi.createStaff(form);
        toast.success("کارمند بریالیتوب سره ثبت شو");
      }
      setFormOpen(false);
      fetchStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error(error.message || "د کارمند په ثبتولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async () => {
    if (!selected) return;
    
    setLoading(true);
    try {
      await staffApi.deleteStaff(selected.id);
      toast.success("کارمند بریالیتوب سره ړنګ شو");
      setDeleteOpen(false);
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error(error.message || "په ړنګولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const permCount = (s) => Object.values(s.permissions || {}).filter(Boolean).length;
  const isFormValid = form.name && form.username && (isEdit || form.password) && permCount(form) > 0;

  const columnDefs = useMemo(() => [
    { field: "name",       headerName: "نوم", flex: 1.2, minWidth: 150, cellRenderer: (p) => <span className="font-medium">{p.value}</span> },
    { field: "fatherName", headerName: "د پلار نوم", flex: 1.1, minWidth: 140 },
    { field: "phone",      headerName: "ټېلیفون", flex: 1, minWidth: 130 },
    { field: "position",   headerName: "مسئولیت", flex: 1, minWidth: 120 },
    { field: "status",     headerName: "حالت", flex: 0.8, minWidth: 100, cellRenderer: (p) => <Badge variant={p.value === "active" ? "success" : "muted"}>{p.value === "active" ? "فعال" : "غیر فعال"}</Badge> },
    { field: "actions",    headerName: "", flex: 1, minWidth: 140, sortable: false, filter: false, cellRenderer: (p) => {
      const s = p.data;
      return (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openView(s); }}   title="کتل"   className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Eye    className="size-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(s); }}   title="سمول"  className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Pencil className="size-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); openDelete(s); }} title="ړنګول" className="p-1.5 rounded hover:bg-muted text-destructive">    <Trash2 className="size-3.5" /></button>
        </div>
      );
    }},
  ], []);

  const DV = ({ label, value }) => (
    <div><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-medium">{value || "—"}</p></div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="کارمندان" subtitle="د سیسټم کارمندان او د لاسرسي اداره"
        actions={
          <button onClick={openAdd} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="size-3.5" /> نوی کارمند
          </button>
        }
      />

      <FilterBar filters={STAFF_FILTERS} onApply={(f) => { setFilters(f); setPage(1); }} onClear={() => { setFilters({}); setPage(1); }} />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={staff}
        loading={loading}
        emptyText="هیڅ کارمند ونه موندل شو"
        searchPlaceholder="د کارمند نوم، ټېلیفون..."
        serverSidePagination={true}
        pageSize={pagination.limit || 12}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableRtl={true}
        enableExport={true}
        exportFileName="staff"
      />

      {/* ── Add / Edit modal ───────────────────────────────────────────── */}
      <ErpModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={isEdit ? "کارمند سمول" : "نوی کارمند ثبتول"}
        size="lg"
        footer={<>
          <button onClick={() => setFormOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
          <button onClick={save} disabled={!isFormValid} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium disabled:opacity-50">ثبتول</button>
        </>}
      >
        <div className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="بشپړ نوم"><Input value={form.name} handleChanges={(e) => set("name", e.target.value)} placeholder="بشپړ نوم" /></F>
            <F label="د پلار نوم" opt><Input value={form.fatherName} handleChanges={(e) => set("fatherName", e.target.value)} placeholder="د پلار نوم" /></F>
            <F label="ټېلیفون" opt><Input value={form.phone} handleChanges={(e) => set("phone", e.target.value)} placeholder="+93 7XX XXX XXX" /></F>
            <F label="تذکیره نمبر" opt><Input value={form.idCardNumber} handleChanges={(e) => set("idCardNumber", e.target.value)} placeholder="تذکیره نمبر" /></F>
            <F label="د شمولیت نېټه"><Input type="date" value={form.joinedAt} handleChanges={(e) => set("joinedAt", e.target.value)} /></F>
            <F label="حالت">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={SEL}>
                <option value="active">فعال</option>
                <option value="inactive">غیر فعال</option>
              </select>
            </F>
          </div>

          {/* Role presets */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium">رول (د لاسرسي کچه)</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLE_PRESETS).map(([key, r]) => (
                <button key={key} type="button" onClick={() => applyRole(key)}
                  className={cn(
                    "px-3 py-1.5 rounded border text-xs font-medium transition-all",
                    form.role === key ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Permission grid */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> د لاسرسي ماژولونه
              </span>
              <span className="text-[11px] text-muted-foreground">{permCount(form)} / {MODULES.length} ماژول</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-input rounded bg-muted/30">
              {MODULES.map((m) => {
                const active = !!form.permissions[m.key];
                return (
                  <button key={m.key} type="button" onClick={() => togglePerm(m.key)}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded border text-left transition-all",
                      active ? "bg-primary/10 border-primary/40 text-foreground" : "bg-background border-input text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 size-3.5 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                      active ? "bg-primary border-primary" : "border-muted-foreground/40"
                    )}>
                      {active && <span className="size-1.5 rounded-sm bg-primary-foreground block" />}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium leading-none">{m.label}</span>
                      <span className="text-[10px] opacity-60 leading-none">{m.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {permCount(form) === 0 && <p className="text-[11px] text-destructive">لږ تر لږه یو ماژول وټاکئ</p>}
          </div>

          {/* Account */}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">د سیسټم حساب</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="یوزرنیم"><Input value={form.username} handleChanges={(e) => set("username", e.target.value)} placeholder="username" /></F>
              <F label={isEdit ? "نوی پاسورډ (اختیاري)" : "پاسورډ"}>
                <Input type="password" value={form.password} handleChanges={(e) => set("password", e.target.value)} placeholder="••••••••" />
              </F>
            </div>
          </div>

          {/* Notes */}
          <F label="یادښتونه" opt>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${SEL} resize-none`} placeholder="یادښتونه..." />
          </F>
        </div>
      </ErpModal>

      {/* ── View modal ─────────────────────────────────────────────────── */}
      <ErpModal open={viewOpen} onOpenChange={setViewOpen} title="د کارمند معلومات" size="md"
        footer={<button onClick={() => setViewOpen(false)} className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted">بندول</button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DV label="بشپړ نوم"      value={selected.name} />
              <DV label="د پلار نوم"    value={selected.fatherName} />
              <DV label="ټېلیفون"       value={selected.phone} />
              <DV label="تذکیره نمبر"   value={selected.idCardNumber} />
              <DV label="رول"           value={ROLE_PRESETS[selected.role]?.label ?? selected.role} />
              <DV label="حالت"          value={selected.status === "active" ? "فعال" : "غیر فعال"} />
              <DV label="د شمولیت نېټه" value={selected.joinedAt} />
              <DV label="یوزرنیم"       value={selected.username} />
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground mb-2">د لاسرسي ماژولونه ({permCount(selected)} ماژول)</p>
              <div className="flex flex-wrap gap-1.5">
                {MODULES.filter((m) => selected.permissions[m.key]).map((m) => (
                  <Badge key={m.key} variant="info">{m.label}</Badge>
                ))}
                {permCount(selected) === 0 && <span className="text-sm text-muted-foreground">هیڅ لاسرسی نشته</span>}
              </div>
            </div>

            {selected.notes && <DV label="یادښتونه" value={selected.notes} />}
          </div>
        )}
      </ErpModal>

      {/* ── Change password modal ──────────────────────────────────────── */}
      <ErpModal open={pwOpen} onOpenChange={setPwOpen} title="د پاسورډ بدلول" size="sm"
        footer={<>
          <button onClick={() => setPwOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
          <button
            disabled={!pw.newPw || pw.newPw !== pw.confirmPw}
            onClick={() => setPwOpen(false)}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium disabled:opacity-50"
          >بدلول</button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">کارمند: <span className="font-medium text-foreground">{selected?.name}</span></p>
          <F label="نوی پاسورډ">
            <Input type="password" value={pw.newPw} handleChanges={(e) => setPw((p) => ({ ...p, newPw: e.target.value }))} placeholder="••••••••" />
          </F>
          <F label="د پاسورډ تایید">
            <Input type="password" value={pw.confirmPw} handleChanges={(e) => setPw((p) => ({ ...p, confirmPw: e.target.value }))} placeholder="••••••••" />
          </F>
          {pw.newPw && pw.confirmPw && pw.newPw !== pw.confirmPw && (
            <p className="text-[11px] text-destructive">پاسورډونه سره سمون نه خوري</p>
          )}
        </div>
      </ErpModal>

      <ConfirmDelete open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={doDelete} title={selected?.name} />
    </div>
  );
}

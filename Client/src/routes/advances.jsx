import { AgGridTable } from "@/components/erp/AgGridTable";
import { StatCard } from "@/components/erp/StatCard";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { Input } from "@/components/ui/Input";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear } from "@/lib/afghan-date";
import {
  getAdvances,
  createAdvance,
  updateAdvance,
  deleteAdvance,
} from "@/data/salaryApi";
import { getAllTeachers } from "@/data/teacherApi";
import { getAllStaff } from "@/data/staffApi";
import { formatAfn, normalizePagination } from "@/utils/payrollUtils";

const TODAY = new Date().toISOString().slice(0, 10);
const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const ADVANCE_STATUS = [
  { value: "Pending", label: "پاتې" },
  { value: "Approved", label: "منظور شوی" },
  { value: "Rejected", label: "رد شوی" },
  { value: "Completed", label: "بشپړ شوی" },
];

const ADVANCE_TYPES = [
  { value: "Advance", label: "پیشکی" },
  { value: "Loan", label: "پور" },
];

const EMPTY_ADVANCE = {
  personId: "",
  personType: "Teacher",
  advanceType: "Advance",
  amount: "",
  requestDate: TODAY,
  reason: "",
  installments: "1",
  status: "Pending",
};

const ADVANCE_FILTERS = [
  { key: "search", label: "کارمند لټون", type: "input", placeholder: "نوم..." },
  {
    key: "personType",
    label: "ډول",
    type: "select",
    options: [
      { value: "Teacher", label: "ښوونکی" },
      { value: "Staff", label: "کارمند" },
    ],
  },
  { key: "status", label: "حالت", type: "select", options: ADVANCE_STATUS },
  { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
];
const ADVANCE_DEFAULTS = { academicYear: String(currentShamsiYear()) };

/** Advances tab — embedded in payroll (salaries) page */
export function PayrollAdvancesTab() {
  const [advances, setAdvances] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalAdvances: 0,
    pendingAdvances: 0,
    approvedAdvances: 0,
    totalAmount: 0,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ADVANCE);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState(ADVANCE_DEFAULTS);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const setF = (k, v) => {
    setForm((p) => {
      const updated = { ...p, [k]: v };
      
      // Auto-fetch salary when person is selected
      if (k === "personId" && v) {
        const selectedPerson = employees.find(emp => emp.id === Number(v));
        if (selectedPerson && selectedPerson.salary) {
          // Store salary info for reference
          updated._personSalary = selectedPerson.salary;
        }
      }
      
      return updated;
    });
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const buildAdvancePayload = (formData, forCreate = true) => {
    const payload = {
      personId: Number(formData.personId),
      personType: formData.personType,
      advanceType: formData.advanceType || "Advance",
      amount: Number(formData.amount) || 0,
      requestDate: formData.requestDate,
      installments: Number(formData.installments) || 1,
      reason: formData.reason || null,
    };
    if (!forCreate) {
      return {
        status: formData.status,
        installments: payload.installments,
        notes: formData.reason || null,
      };
    }
    return payload;
  };

  const validateAdvanceForm = (formData, isEdit = false) => {
    const validationErrors = {};

    if (!isEdit) {
      if (!formData.personId) validationErrors.personId = "کارمند اړین دی";
      if (!formData.personType) validationErrors.personType = "د کارمند ډول اړین دی";
      if (!formData.amount || Number(formData.amount) <= 0) {
        validationErrors.amount = "مقدار اړین دی";
      }
      if (!formData.requestDate) validationErrors.requestDate = "نېټه اړینه ده";
    }

    if (!formData.installments || Number(formData.installments) < 1) {
      validationErrors.installments = "قسطونه باید لږ تر لږه ۱ وي";
    }

    if (formData.reason && formData.reason.length > 500) {
      validationErrors.reason = "دلیل باید د ۵۰۰ تورو څخه کم وي";
    }

    return validationErrors;
  };

  const computeStats = (rows, totalFromPagination) => {
    const totalAdvances = totalFromPagination ?? rows.length;
    const pendingAdvances = rows.filter((a) => a.status === "Pending").length;
    const approvedAdvances = rows.filter((a) => a.status === "Approved").length;
    const totalAmount = rows.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    setStats({ totalAdvances, pendingAdvances, approvedAdvances, totalAmount });
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const [teachersRes, staffRes] = await Promise.all([
        getAllTeachers({ limit: 1000 }),
        getAllStaff({ limit: 1000 }),
      ]);
      setTeachers(teachersRes.data?.teachers || []);
      setStaff(staffRes.data?.staff || []);
    } catch (err) {
      toast.error(err.message || "د کارمندانو ترلاسه کولو کې تېروتنه");
    }
  }, []);

  const fetchAdvances = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getAdvances(params);
      const advancesData = res.data?.advances || [];
      const pag = normalizePagination(res.data?.pagination);
      setAdvances(advancesData);
      setPagination(pag);
      computeStats(advancesData, pag.total);
    } catch (err) {
      toast.error(err.message || "د پیشکیو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAdvances({
      ...filters,
      page,
      limit: pagination.limit,
      sortBy,
      sortDir,
    });
  }, [filters, page, sortBy, sortDir, fetchAdvances, pagination.limit]);

  const openAdd = () => {
    setForm({ ...EMPTY_ADVANCE, requestDate: TODAY });
    setErrors({});
    setSelected(null);
    setOpen(true);
  };

  const openEdit = (a) => {
    setSelected(a);
    setErrors({});
    setForm({
      personId: a.personId ? String(a.personId) : "",
      personType: a.personType || "Teacher",
      advanceType: a.advanceType || "Advance",
      amount: a.amount != null ? String(a.amount) : "",
      requestDate: a.requestDate || TODAY,
      reason: a.reason || a.notes || "",
      installments: a.installments != null ? String(a.installments) : "1",
      status: a.status || "Pending",
    });
    setEditOpen(true);
  };

  const openDel = (a) => {
    setSelected(a);
    setDelOpen(true);
  };

  const refreshList = () =>
    fetchAdvances({ ...filters, page, limit: pagination.limit, sortBy, sortDir });

  const save = async () => {
    const validationErrors = validateAdvanceForm(form, false);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await createAdvance(buildAdvancePayload(form, true));
      toast.success("پیشکی بریالیتوب سره ثبت شو");
      setOpen(false);
      setErrors({});
      refreshList();
    } catch (err) {
      toast.error(err.message || "د پیشکي ثبتولو کې تېروتنه");
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    if (!selected) return;

    const validationErrors = validateAdvanceForm(form, true);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await updateAdvance(selected.id, buildAdvancePayload(form, false));
      toast.success("پیشکی بریالیتوب سره تازه شو");
      setEditOpen(false);
      setErrors({});
      refreshList();
    } catch (err) {
      toast.error(err.message || "د پیشکي تازه کولو کې تېروتنه");
    } finally {
      setSaving(false);
    }
  };

  const deleteAdv = async () => {
    if (!selected) return;
    try {
      await deleteAdvance(selected.id);
      toast.success("پیشکی بریالیتوب سره حذف شو");
      setDelOpen(false);
      refreshList();
    } catch (err) {
      toast.error(err.message || "د پیشکي حذف کولو کې تېروتنه");
    }
  };

  const handleApprove = async (advanceId) => {
    try {
      await updateAdvance(advanceId, { status: "Approved" });
      toast.success("پیشکی منظور شو");
      refreshList();
    } catch (err) {
      toast.error(err.message || "د پیشکي منظورولو کې تېروتنه");
    }
  };

  const handleReject = async (advanceId) => {
    try {
      await updateAdvance(advanceId, { status: "Rejected" });
      toast.success("پیشکی رد شو");
      refreshList();
    } catch (err) {
      toast.error(err.message || "د پیشکي رد کولو کې تېروتنه");
    }
  };

  const statusLabel = (v) => ADVANCE_STATUS.find((s) => s.value === v)?.label ?? v;
  const personTypeLabel = (v) => (v === "Teacher" ? "ښوونکی" : "کارمند");

  const employees = form.personType === "Teacher" ? teachers : staff;

  const columnDefs = useMemo(
    () => [
      {
        field: "personName",
        headerName: "کارمند",
        flex: 1.5,
        minWidth: 180,
      },
      {
        field: "personType",
        headerName: "ډول",
        flex: 1,
        minWidth: 120,
        valueGetter: (params) => personTypeLabel(params.data?.personType),
      },
      {
        field: "advanceType",
        headerName: "ډول",
        flex: 0.9,
        minWidth: 100,
        valueGetter: (params) =>
          ADVANCE_TYPES.find((t) => t.value === params.data?.advanceType)?.label ??
          params.data?.advanceType,
      },
      {
        field: "amount",
        headerName: "مقدار",
        flex: 1.2,
        minWidth: 140,
        valueGetter: (params) => formatAfn(params.data?.amount),
      },
      {
        field: "installments",
        headerName: "قسطونه",
        flex: 0.8,
        minWidth: 100,
      },
      {
        field: "paidInstallments",
        headerName: "ورکړل شوي",
        flex: 1,
        minWidth: 120,
        valueGetter: (params) => {
          const paid = params.data?.payments?.length ?? 0;
          const total = params.data?.installments || 0;
          return `${paid} / ${total}`;
        },
      },
      {
        field: "remainingAmount",
        headerName: "پاتې",
        flex: 1.2,
        minWidth: 140,
        valueGetter: (params) => formatAfn(params.data?.remainingAmount),
      },
      {
        field: "requestDate",
        headerName: "نېټه",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "status",
        headerName: "حالت",
        flex: 1,
        minWidth: 120,
        valueGetter: (params) => statusLabel(params.data?.status),
        cellRenderer: (params) => {
          const status = params.data?.status;
          const colors = {
            Pending: "text-yellow-600 bg-yellow-50",
            Approved: "text-green-600 bg-green-50",
            Rejected: "text-red-600 bg-red-50",
            Completed: "text-blue-600 bg-blue-50",
          };
          return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || ""}`}>
              {statusLabel(status)}
            </span>
          );
        },
      },
      {
        field: "actions",
        headerName: "",
        flex: 1.5,
        minWidth: 180,
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const a = params.data;
          return (
            <div className="flex gap-1">
              {a.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(a.id);
                    }}
                    className="p-1.5 rounded hover:bg-muted text-green-600"
                    title="منظور کړئ"
                  >
                    <CheckCircle className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(a.id);
                    }}
                    className="p-1.5 rounded hover:bg-muted text-red-600"
                    title="رد کړئ"
                  >
                    <XCircle className="size-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(a);
                }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openDel(a);
                }}
                className="p-1.5 rounded hover:bg-muted text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const AdvanceForm = ({ formData, onChange, isEdit = false }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {!isEdit && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">د کارمند ډول</span>
            <select
              value={formData.personType}
              onChange={(e) => onChange("personType", e.target.value)}
              className={SEL}
            >
              <option value="Teacher">ښوونکی</option>
              <option value="Staff">کارمند</option>
            </select>
            {errors.personType && (
              <p className="text-xs text-destructive mt-1">{errors.personType}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">کارمند</span>
            <select
              value={formData.personId}
              onChange={(e) => onChange("personId", e.target.value)}
              className={SEL}
            >
              <option value="">— کارمند وټاکئ —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.fatherName ? `- ${emp.fatherName}` : ""}
                </option>
              ))}
            </select>
            {errors.personId && (
              <p className="text-xs text-destructive mt-1">{errors.personId}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">د پیشکي ډول</span>
            <select
              value={formData.advanceType}
              onChange={(e) => onChange("advanceType", e.target.value)}
              className={SEL}
            >
              {ADVANCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              type="number"
              value={formData.amount}
              handleChanges={(e) => onChange("amount", e.target.value)}
              placeholder="0"
              label="مقدار"
              error={errors.amount}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              type="date"
              value={formData.requestDate}
              handleChanges={(e) => onChange("requestDate", e.target.value)}
              label="د غوښتنې نېټه"
              error={errors.requestDate}
            />
          </div>
        </>
      )}

      <div>
        <Input
          type="number"
          value={formData.installments}
          handleChanges={(e) => onChange("installments", e.target.value)}
          placeholder="1"
          label="قسطونه"
          error={errors.installments}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">حالت</span>
        <select
          value={formData.status}
          onChange={(e) => onChange("status", e.target.value)}
          className={SEL}
        >
          {ADVANCE_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <Input
          type="textarea"
          value={formData.reason}
          handleChanges={(e) => onChange("reason", e.target.value)}
          placeholder="دلیل (اختیاري)"
          label="دلیل / یادښت"
          error={errors.reason}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"
        >
          <Plus className="size-3.5" /> نوی پیشکی
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="ټول پیشکي" value={stats.totalAdvances} />
        <StatCard label="پاتې غوښتنې" value={stats.pendingAdvances} accent="warning" />
        <StatCard label="منظور شوي" value={stats.approvedAdvances} accent="success" />
        <StatCard label="ټول مقدار" value={formatAfn(stats.totalAmount)} accent="primary" />
      </div>

      <div>
        <FilterBar
          filters={ADVANCE_FILTERS}
          defaultValues={ADVANCE_DEFAULTS}
          onApply={(data) => {
            setFilters(data);
            setPage(1);
          }}
          onClear={() => {
            setFilters(ADVANCE_DEFAULTS);
            setPage(1);
          }}
        />
        <div className="mt-3">
          <AgGridTable
            columnDefs={columnDefs}
            rowData={advances}
            loading={loading}
            emptyText="هیڅ پیشکی ونه موندل شو"
            searchPlaceholder="کارمند، مقدار..."
            serverSidePagination
            pageSize={pagination.limit || 10}
            totalRows={pagination.total}
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onSortChanged={(sortModel) => {
              const sortItem = sortModel?.[0];
              if (!sortItem) {
                setSortBy("createdAt");
                setSortDir("desc");
                return;
              }
              setSortBy(sortItem.colId || "createdAt");
              setSortDir(sortItem.sort || "desc");
            }}
            enableExport
            exportFileName="advances"
          />
        </div>
      </div>

      <ErpModal
        open={open}
        onOpenChange={setOpen}
        title="نوی پیشکی"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
            >
              ساتل
            </button>
          </>
        }
      >
        <AdvanceForm formData={form} onChange={setF} />
      </ErpModal>

      <ErpModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="پیشکی سمول"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={update}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
            >
              ساتل
            </button>
          </>
        }
      >
        <AdvanceForm formData={form} onChange={setF} isEdit />
      </ErpModal>

      <ConfirmDelete
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={deleteAdv}
        title={selected?.personName}
        subtitle={`مقدار: ${formatAfn(selected?.amount)}`}
      />
    </div>
  );
}

/** Legacy standalone route — redirects handled in App */
export default function AdvancesPage() {
  return <PayrollAdvancesTab />;
}

import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { StatCard } from "@/components/erp/StatCard";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { ShamsiMonthPicker } from "@/components/erp/ShamsiMonthPicker";
import { Input } from "@/components/ui/Input";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, DollarSign, Download, CheckCircle, HandCoins, Undo2 } from "lucide-react";
import { formatAfn, normalizePagination, mapSalaryStatistics } from "@/utils/payrollUtils";
import { PayrollAdvancesTab } from "./advances";
import { toast } from "sonner";
import {
  getSalaries,
  getSalaryStatistics,
  createSalary,
  updateSalary,
  deleteSalary,
  generateBulkSalaries,
  downloadSalarySlip,
  markSalaryAsPaid,
  undoSalaryPayment,
} from "@/data/salaryApi";
import { getAllTeachers } from "@/data/teacherApi";
import { getAllStaff } from "@/data/staffApi";
import { getAllAttendance } from "@/data/attendanceApi";

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = TODAY.slice(0, 7);
const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const PAYMENT_STATUS = [
  { value: "Pending", label: "پاتې" },
  { value: "Partial", label: "جزوي" },
  { value: "Paid", label: "ورکړل شوی" },
];

const EMPTY_SALARY = {
  personId: "",
  personType: "Teacher",
  month: CURRENT_MONTH,
  academicYear: "",
  baseSalary: "",
  allowances: "",
  bonuses: "",
  deductions: "",
  netSalary: "",
  notes: "",
};

const SALARY_FILTERS = [
  { key: "search", label: "کارمند لټون", type: "input", placeholder: "نوم..." },
  { key: "personType", label: "ډول", type: "select", options: [
    { value: "Teacher", label: "ښوونکی" },
    { value: "Staff", label: "کارمند" },
  ]},
  { key: "month", label: "میاشت", type: "shamsiMonth" },
  { key: "paymentStatus", label: "د تادیې حالت", type: "select", options: PAYMENT_STATUS },
];
const SALARY_DEFAULTS = { month: CURRENT_MONTH };

const PAYROLL_TABS = [
  { id: "salaries", label: "معاشونه", icon: DollarSign },
  { id: "advances", label: "پیشکي", icon: HandCoins },
];

export default function SalariesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "advances" ? "advances" : "salaries";

  const setActiveTab = (tabId) => {
    if (tabId === "salaries") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    count: 0,
    totalNet: 0,
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });

  const [open, setOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SALARY);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState(SALARY_DEFAULTS);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const [bulkForm, setBulkForm] = useState({ month: CURRENT_MONTH, personType: "Teacher" });
  const [bulkErrors, setBulkErrors] = useState({});
  const [searchId, setSearchId] = useState("");
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [payingSalary, setPayingSalary] = useState(null);
  const getEmployeeBaseSalary = useCallback((employee) => {
    if (!employee) return 0;
    return Number(employee.salary ?? employee.baseSalary ?? employee.monthlySalary ?? 0) || 0;
  }, []);
  const employees = useMemo(
    () => (form.personType === "Teacher" ? teachers : staff),
    [form.personType, teachers, staff]
  );

  const setF = useCallback((k, v) => {
    setForm((p) => {
      const updated = { ...p, [k]: v };
      
      // Auto-fetch salary when person is selected
      if (k === "personId" && v) {
        const selectedPerson = employees.find(emp => Number(emp.id) === Number(v));
        const baseSalary = getEmployeeBaseSalary(selectedPerson);
        if (selectedPerson && baseSalary > 0) {
          updated.baseSalary = String(baseSalary);
          
          // Fetch attendance and calculate deductions
          fetchAttendanceAndCalculateDeductions(updated.personType, Number(v), updated.month, baseSalary);
        }
      }
      
      if (["baseSalary", "allowances", "bonuses", "deductions"].includes(k)) {
        const base = Number(updated.baseSalary) || 0;
        const allow = Number(updated.allowances) || 0;
        const bonus = Number(updated.bonuses) || 0;
        const deduct = Number(updated.deductions) || 0;
        updated.netSalary = Math.max(0, base + allow + bonus - deduct).toString();
      }
      
      return updated;
    });
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  }, [employees, getEmployeeBaseSalary]);

  const fetchAttendanceAndCalculateDeductions = async (personType, personId, month, baseSalary) => {
    try {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay}`;
      
      const attendanceType = personType === "Teacher" ? "Staff" : "Staff";
      
      const res = await getAllAttendance({
        attendanceType,
        personId,
        startDate,
        endDate,
        limit: 1000
      });
      
      const attendanceRecords = res.data?.attendance || [];
      const absentDays = attendanceRecords.filter(r => r.status === "Absent").length;
      
      if (absentDays > 0) {
        const perDayDeduction = baseSalary / 26; // Assuming 26 working days
        const absenceDeduction = Math.round(perDayDeduction * absentDays);
        
        setForm(prev => {
          const updated = { ...prev, deductions: String(absenceDeduction) };
          const base = Number(updated.baseSalary) || 0;
          const allow = Number(updated.allowances) || 0;
          const bonus = Number(updated.bonuses) || 0;
          const deduct = Number(updated.deductions) || 0;
          updated.netSalary = Math.max(0, base + allow + bonus - deduct).toString();
          return updated;
        });
        
        toast.info(`${absentDays} ورځې غیر حاضري - ${absenceDeduction} افغانۍ کسر`);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const buildSalaryFormData = (form) => ({
    personId: Number(form.personId),
    personType: form.personType,
    month: form.month,
    academicYear: form.academicYear || new Date().getFullYear().toString(),
    baseSalary: Number(form.baseSalary) || 0,
    allowances: Number(form.allowances) || 0,
    bonuses: Number(form.bonuses) || 0,
    notes: form.notes || null,
  });

  const validateSalaryForm = (form) => {
    const errors = {};
    if (!form.personId) errors.personId = "کارمند اړین دی";
    if (!form.personType) errors.personType = "د کارمند ډول اړین دی";
    if (!form.month) errors.month = "میاشت اړینه ده";
    if (!form.baseSalary || Number(form.baseSalary) <= 0) errors.baseSalary = "بنسټیز معاش اړین دی";
    return errors;
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

  const fetchStatistics = useCallback(async (params) => {
    try {
      const statsRes = await getSalaryStatistics(params);
      setStats(mapSalaryStatistics(statsRes.data));
    } catch {
      setStats(mapSalaryStatistics(null));
    }
  }, []);

  const fetchSalaries = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getSalaries(params);
      setSalaries(res.data?.salaries || []);
      setPagination(normalizePagination(res.data?.pagination));
      await fetchStatistics(params);
    } catch (err) {
      toast.error(err.message || "د معاشونو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab !== "salaries") return;
    const params = { ...filters, page, limit: pagination.limit, sortBy, sortDir };
    fetchSalaries(params);
  }, [activeTab, filters, page, sortBy, sortDir, fetchSalaries, pagination.limit]);

  const openAdd = () => {
    setForm({ ...EMPTY_SALARY, month: CURRENT_MONTH });
    setErrors({});
    setSelected(null);
    setOpen(true);
  };

  const openEdit = (s) => {
    setSelected(s);
    setErrors({});
    setForm({
      personId: s.personId ? String(s.personId) : "",
      personType: s.personType || "Teacher",
      month: s.month || CURRENT_MONTH,
      academicYear: s.academicYear || "",
      baseSalary: s.baseSalary != null ? String(s.baseSalary) : "",
      allowances: s.allowances != null ? String(s.allowances) : "",
      bonuses: s.bonuses != null ? String(s.bonuses) : "",
      deductions: s.deductions != null ? String(s.deductions) : "",
      netSalary: s.netSalary != null ? String(s.netSalary) : "",
      notes: s.notes || "",
    });
    setEditOpen(true);
  };

  const openDel = (s) => { setSelected(s); setDelOpen(true); };

  const requestSave = () => {
    const validationErrors = validateSalaryForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setConfirmSaveOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await createSalary(buildSalaryFormData(form));
      toast.success("معاش بریالیتوب سره ثبت شو");
      setOpen(false);
      setConfirmSaveOpen(false);
      setErrors({});
      fetchSalaries({ ...filters, page, limit: pagination.limit, sortBy, sortDir });
    } catch (err) {
      toast.error(err.message || "د معاش ثبتولو کې تېروتنه");
    } finally {
      setSaving(false);
    }
  };

  const handleUndoPayment = async (salary) => {
    if (salary.paymentStatus !== "Paid") {
      toast.error("یوازې ورکړل شوي معاشونه بیرته راګرځولی شي");
      return;
    }
    try {
      await undoSalaryPayment(salary.id);
      toast.success("د معاش تادیه بریالیتوب سره بیرته راګرځول شوه");
      fetchSalaries({ ...filters, page, limit: pagination.limit, sortBy, sortDir });
    } catch (err) {
      toast.error(err.message || "د معاش بیرته راګرځولو کې تېروتنه");
    }
  };

  const update = async () => {
    if (!selected) return;

    setSaving(true);
    try {
      await updateSalary(selected.id, {
        allowances: Number(form.allowances) || 0,
        bonuses: Number(form.bonuses) || 0,
        deductions: Number(form.deductions) || 0,
        notes: form.notes || null,
      });
      toast.success("معاش بریالیتوب سره تازه شو");
      setEditOpen(false);
      setErrors({});
      fetchSalaries({ ...filters, page, limit: pagination.limit, sortBy, sortDir });
    } catch (err) {
      toast.error(err.message || "د معاش تازه کولو کې تېروتنه");
    } finally {
      setSaving(false);
    }
  };

  const deleteSal = async () => {
    if (!selected) return;
    try {
      await deleteSalary(selected.id);
      toast.success("معاش بریالیتوب سره حذف شو");
      setDelOpen(false);
      fetchSalaries({ ...filters, page, limit: pagination.limit, sortBy, sortDir });
    } catch (err) {
      toast.error(err.message || "د معاش حذف کولو کې تېروتنه");
    }
  };

  const handleBulkGenerate = async () => {
    const errors = {};
    if (!bulkForm.month) errors.month = "میاشت اړینه ده";
    if (!bulkForm.personType) errors.personType = "د کارمند ډول اړین دی";

    if (Object.keys(errors).length > 0) {
      setBulkErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await generateBulkSalaries({
        ...bulkForm,
        academicYear: new Date().getFullYear().toString(),
      });
      toast.success(res.message || "معاشونه بریالیتوب سره جوړ شول");
      setBulkOpen(false);
      setBulkErrors({});
      fetchSalaries({ ...filters, page, limit: pagination.limit, sortBy, sortDir });
    } catch (err) {
      toast.error(err.message || "د معاشونو جوړولو کې تېروتنه");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsPaid = async (salary) => {
    setPayingSalary(salary);
    setPayConfirmOpen(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!payingSalary) return;
    const salary = payingSalary;
    const remaining = Math.max(0, (salary.netSalary || 0) - (salary.paidAmount || 0));
    if (remaining <= 0) {
      toast.error("د تادیې لپاره پاتې مقدار نشته");
      return;
    }
    try {
      await markSalaryAsPaid(salary.id, {
        paidAmount: remaining,
        paymentDate: TODAY,
        paymentMethod: "Cash",
      });
      toast.success("معاش د ورکړل شوي په توګه نښه شو");
      setPayConfirmOpen(false);
      setPayingSalary(null);
      fetchSalaries({ ...filters, page, limit: pagination.limit, sortBy, sortDir });
    } catch (err) {
      toast.error(err.message || "د معاش نښه کولو کې تېروتنه");
    }
  };

  const handleDownloadSlip = async (salaryId) => {
    try {
      await downloadSalarySlip(salaryId);
      toast.success("د معاش پرچه ډاونلوډ شوه");
    } catch (err) {
      toast.error(err.message || "د پرچې ډاونلوډ کې تېروتنه");
    }
  };

  const statusLabel = (v) => PAYMENT_STATUS.find((s) => s.value === v)?.label ?? v;
  const personTypeLabel = (v) => v === "Teacher" ? "ښوونکی" : "کارمند";

  useEffect(() => {
    if (!form.personId) return;
    const selectedPerson = employees.find((emp) => Number(emp.id) === Number(form.personId));
    const baseSalary = getEmployeeBaseSalary(selectedPerson);
    if (baseSalary <= 0) return;

    setForm((prev) => {
      if (String(prev.baseSalary || "") === String(baseSalary)) return prev;
      const next = { ...prev, baseSalary: String(baseSalary) };
      const allow = Number(next.allowances) || 0;
      const bonus = Number(next.bonuses) || 0;
      const deduct = Number(next.deductions) || 0;
      next.netSalary = Math.max(0, baseSalary + allow + bonus - deduct).toString();
      return next;
    });

    fetchAttendanceAndCalculateDeductions(form.personType, Number(form.personId), form.month, baseSalary);
  }, [form.personId, form.personType, form.month, employees, getEmployeeBaseSalary]);

  const handleSearchById = async () => {
    if (!searchId) {
      toast.error("د لټون لپاره ID دننه کړئ");
      return;
    }
    
    const person = employees.find(emp => Number(emp.id) === Number(searchId));
    if (!person) {
      toast.error("کارمند ونه موندل شو");
      return;
    }
    
    const baseSalary = getEmployeeBaseSalary(person);
    setForm(prev => ({
      ...prev,
      personId: String(person.id),
      baseSalary: baseSalary > 0 ? String(baseSalary) : "",
    }));
    
    toast.success(`${person.name} وموندل شو`);
    setSearchId("");
    
    // Fetch attendance and calculate deductions
    if (baseSalary > 0) {
      await fetchAttendanceAndCalculateDeductions(form.personType, person.id, form.month, baseSalary);
    }
  };

  const columnDefs = useMemo(() => [
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
      field: "month",
      headerName: "میاشت",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "baseSalary",
      headerName: "بنسټیز معاش",
      flex: 1.2,
      minWidth: 140,
      valueGetter: (params) => `AFN ${Number(params.data?.baseSalary || 0).toLocaleString()}`,
    },
    {
      field: "netSalary",
      headerName: "خالص معاش",
      flex: 1.2,
      minWidth: 140,
      valueGetter: (params) => `AFN ${Number(params.data?.netSalary || 0).toLocaleString()}`,
    },
    {
      field: "paymentStatus",
      headerName: "حالت",
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => statusLabel(params.data?.paymentStatus),
      cellRenderer: (params) => {
        const status = params.data?.paymentStatus;
        const colors = {
          Pending: "text-yellow-600 bg-yellow-50",
          Partial: "text-blue-600 bg-blue-50",
          Paid: "text-green-600 bg-green-50",
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
        const s = params.data;
        return (
          <div className="flex gap-1">
            {s.paymentStatus !== "Paid" && (
              <button
                onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(s); }}
                className="p-1.5 rounded hover:bg-muted text-green-600"
                title="د ورکړل شوي په توګه نښه کړئ"
              >
                <CheckCircle className="size-3.5" />
              </button>
            )}
            {s.paymentStatus === "Paid" && (
              <button
                onClick={(e) => { e.stopPropagation(); handleUndoPayment(s); }}
                className="p-1.5 rounded hover:bg-muted text-amber-600"
                title="تادیه بیرته راګرځول"
              >
                <Undo2 className="size-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleDownloadSlip(s.id); }}
              className="p-1.5 rounded hover:bg-muted text-blue-600"
              title="د معاش پرچه ډاونلوډ کړئ"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(s); }}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openDel(s); }}
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ], [handleMarkAsPaid, handleUndoPayment, handleDownloadSlip, openEdit, openDel]);

  const renderSalaryForm = (form, onChange) => (
    <div className="space-y-3">
      {/* Search by ID */}
      <div className="flex gap-2 p-3 bg-muted/30 rounded border border-border">
        <Input
          type="number"
          value={searchId}
          handleChanges={(e) => setSearchId(e.target.value)}
          placeholder="د کارمند ID دننه کړئ"
          label="د ID له لارې لټون"
        />
        <button
          type="button"
          onClick={handleSearchById}
          className="mt-6 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          لټون
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">د کارمند ډول</span>
        <select value={form.personType} onChange={(e) => onChange("personType", e.target.value)} className={SEL}>
          <option value="Teacher">ښوونکی</option>
          <option value="Staff">کارمند</option>
        </select>
        {errors.personType && <p className="text-xs text-destructive mt-1">{errors.personType}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">کارمند</span>
        <select value={form.personId} onChange={(e) => onChange("personId", e.target.value)} className={SEL}>
          <option value="">— کارمند وټاکئ —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} {emp.fatherName ? `- ${emp.fatherName}` : ""}
            </option>
          ))}
        </select>
        {errors.personId && <p className="text-xs text-destructive mt-1">{errors.personId}</p>}
      </div>

      <div className="sm:col-span-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">میاشت</span>
          <ShamsiMonthPicker
            value={form.month}
            onChange={(m) => onChange("month", m)}
            placeholder="میاشت غوره کړئ"
            error={errors.month}
            allowClear={false}
          />
        </div>
      </div>

      <div>
        <Input
          type="number"
          value={form.baseSalary}
          handleChanges={(e) => onChange("baseSalary", e.target.value)}
          placeholder="0"
          label="بنسټیز معاش"
          error={errors.baseSalary}
        />
      </div>

      <div>
        <Input
          type="number"
          value={form.allowances}
          handleChanges={(e) => onChange("allowances", e.target.value)}
          placeholder="0"
          label="اضافي معاش"
        />
      </div>

      <div>
        <Input
          type="number"
          value={form.bonuses}
          handleChanges={(e) => onChange("bonuses", e.target.value)}
          placeholder="0"
          label="انعامونه"
        />
      </div>

      <div>
        <Input
          type="number"
          value={form.deductions}
          handleChanges={(e) => onChange("deductions", e.target.value)}
          placeholder="0"
          label="کسرونه"
        />
      </div>

      <div className="sm:col-span-2">
        <Input
          type="number"
          value={form.netSalary}
          handleChanges={(e) => onChange("netSalary", e.target.value)}
          placeholder="0"
          label="خالص معاش"
          disabled
        />
      </div>

      <div className="sm:col-span-2">
        <Input
          type="textarea"
          value={form.notes}
          handleChanges={(e) => onChange("notes", e.target.value)}
          placeholder="یادښتونه (اختیاري)"
          label="یادښتونه"
          rows={3}
        />
      </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="معاش او پیشکي"
        subtitle="د معاشونو، پیشکیو او تادیې مدیریت"
        actions={
          activeTab === "salaries" ? (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => setBulkOpen(true)}
                className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5"
              >
                <DollarSign className="size-3.5" /> ټول معاشونه جوړ کړئ
              </button>
              <button
                onClick={openAdd}
                className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"
              >
                <Plus className="size-3.5" /> نوی معاش
              </button>
            </div>
          ) : null
        }
      />

      <div className="flex gap-1 border-b border-border">
        {PAYROLL_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "advances" ? (
        <PayrollAdvancesTab />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="ټول معاشونه" value={stats.count} accent="primary" />
            <StatCard label="خالص ټولټال" value={formatAfn(stats.totalNet)} accent="primary" />
            <StatCard label="ورکړل شوی" value={formatAfn(stats.totalPaid)} accent="success" />
            <StatCard label="پاتې" value={formatAfn(stats.totalPending)} accent="warning" />
          </div>

          <div>
            <FilterBar
              filters={SALARY_FILTERS}
              defaultValues={SALARY_DEFAULTS}
              onApply={(data) => { setFilters(data); setPage(1); }}
              onClear={() => { setFilters(SALARY_DEFAULTS); setPage(1); }}
            />
            <div className="mt-3">
              <AgGridTable
                columnDefs={columnDefs}
                rowData={salaries}
                loading={loading}
                emptyText="هیڅ معاش ونه موندل شو"
                searchPlaceholder="کارمند، میاشت..."
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
                exportFileName="salaries"
              />
            </div>
          </div>
        </>
      )}

      <ErpModal
        open={open}
        onOpenChange={setOpen}
        title="نوی معاش"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">
              لغوه
            </button>
            <button onClick={requestSave} disabled={saving} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              ساتل
            </button>
          </>
        }
      >
        {renderSalaryForm(form, setF)}
      </ErpModal>

      <ErpModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="معاش سمول"
        footer={
          <>
            <button onClick={() => setEditOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">
              لغوه
            </button>
            <button onClick={update} disabled={saving} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              ساتل
            </button>
          </>
        }
      >
        {renderSalaryForm(form, setF)}
      </ErpModal>

      <ErpModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="ټول معاشونه جوړ کړئ"
        size="sm"
        footer={
          <>
            <button onClick={() => setBulkOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">
              لغوه
            </button>
            <button onClick={handleBulkGenerate} disabled={saving} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              جوړ کړئ
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">میاشت</span>
            <ShamsiMonthPicker
              value={bulkForm.month}
              onChange={(m) => setBulkForm((p) => ({ ...p, month: m }))}
              error={bulkErrors.month}
              allowClear={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">د کارمند ډول</span>
            <select
              value={bulkForm.personType}
              onChange={(e) => setBulkForm((p) => ({ ...p, personType: e.target.value }))}
              className={SEL}
            >
              <option value="Teacher">ښوونکی</option>
              <option value="Staff">کارمند</option>
            </select>
            {bulkErrors.personType && <p className="text-xs text-destructive mt-1">{bulkErrors.personType}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            دا به د ټولو {bulkForm.personType === "Teacher" ? "ښوونکو" : "کارمندانو"} لپاره د {bulkForm.month} میاشت معاشونه جوړ کړي.
          </p>
        </div>
      </ErpModal>

      <ErpModal
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title="د معاش ثبتولو تایید"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmSaveOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">
              لغوه
            </button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              تایید او ثبت
            </button>
          </>
        }
      >
        <p className="text-sm text-center py-2">
          ایا تاسو ډاډه یاست چې غواړئ د دې کارمند لپاره معاش ثبت کړئ؟
        </p>
      </ErpModal>

      <ConfirmDelete
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={deleteSal}
        title={selected?.personName}
        subtitle={`${selected?.month} میاشت`}
      />

      <ErpModal
        open={payConfirmOpen}
        onOpenChange={setPayConfirmOpen}
        title="د معاش تادیې تایید"
        size="sm"
        footer={
          <>
            <button onClick={() => setPayConfirmOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">
              لغوه
            </button>
            <button onClick={confirmMarkAsPaid} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded">
              تایید
            </button>
          </>
        }
      >
        <p className="text-sm text-center py-2">
          ایا تاسو ډاډه یاست چې دا معاش د ورکړل شوي په توګه نښه کړئ؟
        </p>
      </ErpModal>
    </div>
  );
}

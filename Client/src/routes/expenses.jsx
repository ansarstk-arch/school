import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { StatCard } from "@/components/erp/StatCard";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { ShamsiDatePicker } from "@/components/erp/ShamsiDatePicker";
import { Input } from "@/components/ui/Input";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { ACTIVE_SESSION } from "@/constants";
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenses,
  getExpenseStatistics,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/data/expenseApi";

const TODAY = new Date().toISOString().slice(0, 10);
const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const INSTITUTE_TYPES = [
  { value: "School",  label: "ښوونځی" },
  { value: "Center",  label: "مرکز"   },
  { value: "Madrasa", label: "مدرسه"  },
];

const PERIOD_TYPES = [
  { value: "daily", label: "ورځنی" },
  { value: "monthly", label: "میاشتنی" },
  { value: "yearly", label: "کلنی" },
];

const EMPTY_EXPENSE  = { title: "", categoryId: "", instituteType: "School", periodType: "daily", amount: "", date: TODAY, description: "" };
const EMPTY_CATEGORY = { name: "", nameEn: "" };

const EXPENSE_FILTERS = (cats) => [
  { key: "title",         label: "سرلیک لټون", type: "input",  placeholder: "سرلیک..." },
  { key: "category",      label: "ډول",        type: "select", options: cats.map((c) => ({ value: String(c.id), label: c.name })) },
  { key: "instituteType", label: "ادارې ډول",  type: "select", options: INSTITUTE_TYPES.map(({ value, label }) => ({ value, label })) },
  { key: "dateFrom",      label: "له نېټې",    type: "shamsiDate" },
  { key: "dateTo",        label: "تر نېټې",    type: "shamsiDate" },
];
const EXPENSE_DEFAULTS = {};

export default function ExpensesPage() {
  const [categories, setCategories] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [stats, setStats] = useState({ totalExpenses: 0, categoryTotals: [], instituteTypeTotals: [] });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });
  const [categoryPagination, setCategoryPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });

  const [expOpen, setExpOpen] = useState(false);
  const [expEditOpen, setExpEditOpen] = useState(false);
  const [expDelOpen, setExpDelOpen] = useState(false);
  const [expForm, setExpForm] = useState(EMPTY_EXPENSE);
  const [expErrors, setExpErrors] = useState({});
  const [expSel, setExpSel] = useState(null);

  const [catOpen, setCatOpen] = useState(false);
  const [catEditOpen, setCatEditOpen] = useState(false);
  const [catDelOpen, setCatDelOpen] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CATEGORY);
  const [catErrors, setCatErrors] = useState({});
  const [catSel, setCatSel] = useState(null);

  const [filters, setFilters] = useState(EXPENSE_DEFAULTS);
  const [expensePage, setExpensePage] = useState(1);
  const [expenseSortBy, setExpenseSortBy] = useState("date");
  const [expenseSortDir, setExpenseSortDir] = useState("desc");

  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySortBy, setCategorySortBy] = useState("createdAt");
  const [categorySortDir, setCategorySortDir] = useState("desc");

  const setE = useCallback((k, v) => {
    setExpForm((p) => ({ ...p, [k]: v }));
    setExpErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  }, []);
  
  const setC = useCallback((k, v) => {
    setCatForm((p) => ({ ...p, [k]: v }));
    setCatErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  }, []);

  const buildExpenseFormData = (form) => {
    const amountValue = form.amount?.toString().trim();
    return {
      title: form.title,
      categoryId: form.categoryId,
      instituteType: form.instituteType,
      periodType: form.periodType || "daily",
      amount: amountValue ? Number(amountValue) : null,
      date: form.date,
      description: form.description || null,
    };
  };

  const validateExpenseForm = (form) => {
    const errors = {};
    const title = form.title?.trim();
    const amount = form.amount?.toString().trim();

    if (!title) {
      errors.title = "د لګښت سرلیک اړین دی";
    } else if (!/^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s]+$/.test(title)) {
      errors.title = "سرلیک باید یوازې پښتو، انګلیسي توري یا عدد ولري";
    } else if (title.length < 2 || title.length > 200) {
      errors.title = "سرلیک باید د ۲ څخه تر ۲۰۰ تورو پورې وي";
    }

    if (!form.categoryId) {
      errors.categoryId = "ډول اړین دی";
    }

    if (!form.instituteType) {
      errors.instituteType = "د ادارې ډول اړین دی";
    }

    if (!amount) {
      errors.amount = "مقدار اړین دی";
    } else if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.amount = "مقدار باید یو مثبت عدد وي";
    }

    if (!form.date) {
      errors.date = "نېټه اړینه ده";
    }

    if (form.description?.length > 500) {
      errors.description = "تشریح باید د ۵۰۰ تورو څخه کم وي";
    }

    return errors;
  };

  const mapFiltersToParams = (filter) => ({
    q: filter.title,
    categoryId: filter.category,
  instituteType: filter.instituteType,
    startDate: filter.dateFrom,
    endDate: filter.dateTo,
  });

  const fetchCategoryOptions = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await getExpenseCategories({ limit: 1000 });
      setCategoryOptions(res.data?.categories || []);
    } catch (err) {
      toast.error(err.message || "د لګټو کټګوریو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchCategoryTable = useCallback(async (params = {}) => {
    setLoadingCategories(true);
    try {
      const res = await getExpenseCategories(params);
      setCategories(res.data?.categories || []);
      setCategoryPagination(res.data?.pagination || { total: 0, page: 1, totalPages: 1, limit: 10 });
    } catch (err) {
      toast.error(err.message || "د لګټو کټګوریو جدول ترلاسه کولو کې تېروتنه");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchStatistics = useCallback(async (params) => {
    try {
      const statsRes = await getExpenseStatistics(params);
      setStats(statsRes.data?.statistics || { totalExpenses: 0, categoryTotals: [], instituteTypeTotals: [] });
    } catch (err) {
      toast.error(err.message || "د لګښتونو احصایې ترلاسه کولو کې تېروتنه");
    }
  }, []);

  const fetchExpenses = useCallback(async (params = {}) => {
    setLoadingExpenses(true);
    try {
      const res = await getExpenses(params);
      setExpenses(res.data?.expenses || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, totalPages: 1, limit: 10 });
      await fetchStatistics(params);
    } catch (err) {
      toast.error(err.message || "د لګښتونو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoadingExpenses(false);
    }
  }, [fetchStatistics]);

  useEffect(() => {
    fetchCategoryOptions();
  }, [fetchCategoryOptions]);

  useEffect(() => {
    fetchCategoryTable({ page: categoryPage, limit: categoryPagination.limit, sortBy: categorySortBy, sortDir: categorySortDir });
  }, [categoryPage, categorySortBy, categorySortDir, fetchCategoryTable, categoryPagination.limit]);

  useEffect(() => {
    const params = {
      ...mapFiltersToParams(filters),
      page: expensePage,
      limit: pagination.limit,
      sortBy: expenseSortBy,
      sortDir: expenseSortDir,
    };
    fetchExpenses(params);
  }, [filters, expensePage, expenseSortBy, expenseSortDir, fetchExpenses, pagination.limit]);

  const openAddExp = () => {
    setExpForm({ ...EMPTY_EXPENSE, date: TODAY });
    setExpErrors({});
    setExpSel(null);
    setExpOpen(true);
  };

  const openEditExp = (e) => {
    setExpSel(e);
    setExpErrors({});
    setExpForm({
      title: e.title || "",
      categoryId: e.categoryId ? String(e.categoryId) : "",
      instituteType: e.instituteType || "School",
      periodType: e.periodType || "daily",
      amount: e.amount != null ? String(e.amount) : "",
      date: e.date || TODAY,
      description: e.description || "",
    });
    setExpEditOpen(true);
  };

  const openDelExp = (e) => { setExpSel(e); setExpDelOpen(true); };

  const saveExp = async () => {
    const validationErrors = validateExpenseForm(expForm);
    if (Object.keys(validationErrors).length > 0) {
      setExpErrors(validationErrors);
      return;
    }

    setSavingExpense(true);
    try {
      await createExpense(buildExpenseFormData(expForm));
      toast.success("لګښت بریالیتوب سره ثبت شو");
      setExpOpen(false);
      setExpErrors({});
      fetchExpenses(mapFiltersToParams(filters));
    } catch (err) {
      toast.error(err.message || "د لګښت ثبتولو کې تېروتنه");
    } finally {
      setSavingExpense(false);
    }
  };

  const updateExp = async () => {
    if (!expSel) return;

    const validationErrors = validateExpenseForm(expForm);
    if (Object.keys(validationErrors).length > 0) {
      setExpErrors(validationErrors);
      return;
    }

    setSavingExpense(true);
    try {
      await updateExpense(expSel.id, buildExpenseFormData(expForm));
      toast.success("لګښت بریالیتوب سره تازه شو");
      setExpEditOpen(false);
      setExpErrors({});
      fetchExpenses(mapFiltersToParams(filters));
    } catch (err) {
      toast.error(err.message || "د لګښت تازه کولو کې تېروتنه");
    } finally {
      setSavingExpense(false);
    }
  };

  const deleteExp = async () => {
    if (!expSel) return;
    try {
      await deleteExpense(expSel.id);
      toast.success("لګښت بریالیتوب سره حذف شو");
      setExpDelOpen(false);
      fetchExpenses(mapFiltersToParams(filters));
    } catch (err) {
      toast.error(err.message || "د لګښت حذف کولو کې تېروتنه");
    }
  };

  const openAddCat = () => { setCatForm(EMPTY_CATEGORY); setCatErrors({}); setCatOpen(true); };
  const openEditCat = (c) => { setCatSel(c); setCatForm({ name: c.name, nameEn: c.nameEn }); setCatErrors({}); setCatEditOpen(true); };
  const openDelCat = (c) => { setCatSel(c); setCatDelOpen(true); };

  const validateCategoryForm = (form) => {
    const errors = {};
    if (!form.name?.trim()) {
      errors.name = "د ډول نوم اړین دی";
    } else if (form.name.trim().length > 150) {
      errors.name = "د ډول نوم باید له ۱۵۰ حروفو کم وي";
    }
    if (form.nameEn?.length > 150) {
      errors.nameEn = "انګلیسي نوم باید له ۱۵۰ حروفو کم وي";
    }
    return errors;
  };

  const saveCat = async () => {
    const clientErrors = validateCategoryForm(catForm);
    if (Object.keys(clientErrors).length > 0) {
      setCatErrors(clientErrors);
      return;
    }

    setSavingCategory(true);
    try {
      await createExpenseCategory(catForm);
      toast.success("کټګوري بریالیتوب سره ثبت شوه");
      setCatOpen(false);
      setCatErrors({});
      fetchCategoryTable({ page: categoryPage, limit: categoryPagination.limit, sortBy: categorySortBy, sortDir: categorySortDir });
      fetchCategoryOptions();
    } catch (err) {
      toast.error(err.message || "د کټګوري ثبتولو کې تېروتنه");
    } finally {
      setSavingCategory(false);
    }
  };

  const updateCat = async () => {
    if (!catSel) return;

    const clientErrors = validateCategoryForm(catForm);
    if (Object.keys(clientErrors).length > 0) {
      setCatErrors(clientErrors);
      return;
    }

    setSavingCategory(true);
    try {
      await updateExpenseCategory(catSel.id, catForm);
      toast.success("کټګوري بریالیتوب سره تازه شوه");
      setCatEditOpen(false);
      setCatErrors({});
      fetchCategoryTable({ page: categoryPage, limit: categoryPagination.limit, sortBy: categorySortBy, sortDir: categorySortDir });
      fetchCategoryOptions();
      fetchExpenses(mapFiltersToParams(filters));
    } catch (err) {
      toast.error(err.message || "د کټګوري تازه کولو کې تېروتنه");
    } finally {
      setSavingCategory(false);
    }
  };

  const deleteCat = async () => {
    if (!catSel) return;
    try {
      await deleteExpenseCategory(catSel.id);
      toast.success("کټګوري بریالیتوب سره حذف شوه");
      setCatDelOpen(false);
      fetchCategoryTable({ page: categoryPage, limit: categoryPagination.limit, sortBy: categorySortBy, sortDir: categorySortDir });
      fetchCategoryOptions();
      fetchExpenses(mapFiltersToParams(filters));
    } catch (err) {
      toast.error(err.message || "د کټګوري حذف کولو کې تېروتنه");
    }
  };

  const catName = (id) => categories.find((c) => String(c.id) === String(id))?.name ?? "—";
  const instLabel = (v) => INSTITUTE_TYPES.find((t) => t.value === v)?.label ?? v;

  const totalExpenses = stats.totalExpenses || 0;
  const thisMonthTotal = expenses.filter((e) => e.date?.startsWith(TODAY.slice(0, 7))).reduce((s, e) => s + Number(e.amount || 0), 0);

  const categoryTotalsMap = useMemo(
    () => new Map((stats.categoryTotals || []).map((item) => [String(item.categoryId), item])),
    [stats.categoryTotals]
  );

  const chartData = useMemo(() => (
    stats.categoryTotals?.map((item) => ({
      category: item.categoryName || "—",
      amount: Number(item.total || 0),
    })).filter((d) => d.amount > 0)
  ), [stats.categoryTotals]);

  const categoryColumnDefs = useMemo(() => [
    {
      field: "name",
      headerName: "د ډول نوم (پښتو)",
      flex: 1.6,
      minWidth: 180,
    },
    {
      field: "nameEn",
      headerName: "نوم (انګلیسي)",
      flex: 1.4,
      minWidth: 170,
      valueGetter: (params) => params.data?.nameEn || "—",
    },
    {
      field: "count",
      headerName: "لګښتونه",
      flex: 0.9,
      minWidth: 120,
      sortable: false,
      filter: false,
      valueGetter: (params) => categoryTotalsMap.get(String(params.data.id))?.count || 0,
    },
    {
      field: "total",
      headerName: "ټول اندازه",
      flex: 1,
      minWidth: 130,
      sortable: false,
      filter: false,
      valueGetter: (params) => `AFN ${Number(categoryTotalsMap.get(String(params.data.id))?.total || 0).toLocaleString()}`,
    },
    {
      field: "actions",
      headerName: "",
      flex: 1,
      minWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const c = params.data;
        return (
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); openEditCat(c); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Pencil className="size-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); openDelCat(c); }} className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 className="size-3.5" /></button>
          </div>
        );
      },
    },
  ], [categoryTotalsMap]);

  const expenseColumnDefs = useMemo(() => [
    {
      field: "title",
      headerName: "سرلیک",
      flex: 1.6,
      minWidth: 180,
    },
    {
      field: "categoryName",
      headerName: "ډول",
      flex: 1.3,
      minWidth: 160,
    },
    {
      field: "instituteType",
      headerName: "اداره",
      flex: 1,
      minWidth: 130,
      valueGetter: (params) => instLabel(params.data?.instituteType),
    },
    {
      field: "periodType",
      headerName: "د لګښت ډول",
      flex: 0.9,
      minWidth: 110,
      valueGetter: (params) => PERIOD_TYPES.find((p) => p.value === params.data?.periodType)?.label || "ورځنی",
    },
    {
      field: "amount",
      headerName: "اندازه",
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => `AFN ${Number(params.data?.amount || 0).toLocaleString()}`,
    },
    {
      field: "date",
      headerName: "نېټه",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "addedByName",
      headerName: "د چا له خوا",
      flex: 1.3,
      minWidth: 150,
      valueGetter: (params) => params.data?.addedByName || params.data?.addedBy || "—",
    },
    {
      field: "actions",
      headerName: "",
      flex: 1,
      minWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const e = params.data;
        return (
          <div className="flex gap-1">
            <button onClick={(evt) => { evt.stopPropagation(); openEditExp(e); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Pencil className="size-3.5" /></button>
            <button onClick={(evt) => { evt.stopPropagation(); openDelExp(e); }} className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 className="size-3.5" /></button>
          </div>
        );
      },
    },
  ], []);

  const InstToggle = useCallback(({ val, onChange }) => (
    <div className="flex gap-2">
      {INSTITUTE_TYPES.map(({ value, label }) => (
        <button key={value} type="button" onClick={() => onChange(value)}
          className={`flex-1 py-1.5 rounded border text-xs font-medium transition-all ${val === value ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"}`}
        >{label}</button>
      ))}
    </div>
  ), []);

  const ExpForm = useCallback(({ form, onChange }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <Input
          value={form.title}
          handleChanges={(e) => onChange("title", e.target.value)}
          placeholder="سرلیک"
          label="سرلیک"
          error={expErrors.title}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">ډول</span>
        <select value={form.categoryId} onChange={(e) => onChange("categoryId", e.target.value)} className={SEL}>
          <option value="">— ډول وټاکئ —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {expErrors.categoryId && <p className="text-xs text-destructive mt-1">{expErrors.categoryId}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <Input
          type="number"
          value={form.amount}
          handleChanges={(e) => onChange("amount", e.target.value)}
          placeholder="0"
          label="اندازه (افغانۍ)"
          error={expErrors.amount}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">د لګښت ډول</span>
        <select value={form.periodType || "daily"} onChange={(e) => onChange("periodType", e.target.value)} className={SEL}>
          {PERIOD_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">د ادارې ډول</span>
        <InstToggle val={form.instituteType} onChange={(v) => onChange("instituteType", v)} />
        {expErrors.instituteType && <p className="text-xs text-destructive mt-1">{expErrors.instituteType}</p>}
      </div>
      <div className="sm:col-span-2 flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">نېټه</span>
        <ShamsiDatePicker value={form.date} onChange={(d) => onChange("date", d)} placeholder="نېټه وټاکئ" />
        {expErrors.date && <p className="text-xs text-destructive mt-1">{expErrors.date}</p>}
      </div>
      <div className="sm:col-span-2">
        <Input
          type="textarea"
          value={form.description}
          handleChanges={(e) => onChange("description", e.target.value)}
          placeholder="تشریح (اختیاري)"
          label="تشریح"
          error={expErrors.description}
          rows={3}
        />
      </div>
    </div>
  ), [categories, expErrors, InstToggle]);

  return (
    <div className="space-y-4">
      <PageHeader title="لګښتونه" subtitle="د لګښتونو ثبت او ډلبندي"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={openAddCat} className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5">
              <Tag className="size-3.5" /> نوی ډول
            </button>
            <button onClick={openAddExp} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="size-3.5" /> نوی لګښت
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="کلني ټول"    value={`AFN ${totalExpenses.toLocaleString()}`}  accent="warning" />
        <StatCard label="دې میاشت کې" value={`AFN ${thisMonthTotal.toLocaleString()}`} accent="warning" />
        <StatCard label="ډولونه"       value={categories.length} />
        <StatCard label="داخلې"        value={expenses.length} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 px-0.5">د لګښت ډولونه</h3>
        <AgGridTable
          columnDefs={categoryColumnDefs}
          rowData={categories}
          loading={loadingCategories}
          emptyText="هیڅ ډول ونه موندل شو"
          searchPlaceholder="د ډول نوم یا انګلیسي نوم..."
          serverSidePagination
          pageSize={categoryPagination.limit || 10}
          totalRows={categoryPagination.total}
          currentPage={categoryPage}
          totalPages={categoryPagination.totalPages}
          onPageChange={setCategoryPage}
          enableExport
          exportFileName="expense-categories"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 px-0.5">د لګښتونو لیست</h3>
        <FilterBar filters={EXPENSE_FILTERS(categoryOptions)} defaultValues={EXPENSE_DEFAULTS} onApply={(data) => { setFilters(data); setExpensePage(1); }} onClear={() => { setFilters({}); setExpensePage(1); }} />
        <div className="mt-3">
          <AgGridTable
            columnDefs={expenseColumnDefs}
            rowData={expenses}
            loading={loadingExpenses}
            emptyText="هیڅ لګښت ونه موندل شو"
            searchPlaceholder="سرلیک، ډول، یا مسئول..."
            serverSidePagination
            pageSize={pagination.limit || 10}
            totalRows={pagination.total}
            currentPage={expensePage}
            totalPages={pagination.totalPages}
            onPageChange={setExpensePage}
            onSortChanged={(sortModel) => {
              const sortItem = sortModel?.[0];
              if (!sortItem) {
                setExpenseSortBy("date");
                setExpenseSortDir("desc");
                return;
              }
              setExpenseSortBy(sortItem.colId || "date");
              setExpenseSortDir(sortItem.sort || "desc");
            }}
            enableExport
            exportFileName="expenses"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-md p-4">
        <h3 className="font-semibold text-sm mb-3">د ډول له مخې لګښتونه</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
            <XAxis dataKey="category" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
            <Bar dataKey="amount" name="اندازه" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add expense */}
      <ErpModal open={expOpen} onOpenChange={setExpOpen} title="نوی لګښت"
        footer={<>
          <button onClick={() => setExpOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
          <button onClick={saveExp} disabled={savingExpense} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">ساتل</button>
        </>}
      >
        <ExpForm form={expForm} onChange={setE} />
      </ErpModal>

      {/* Edit expense */}
      <ErpModal open={expEditOpen} onOpenChange={setExpEditOpen} title="لګښت سمول"
        footer={<>
          <button onClick={() => setExpEditOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
          <button onClick={updateExp} disabled={savingExpense} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">ساتل</button>
        </>}
      >
        <ExpForm form={expForm} onChange={setE} />
      </ErpModal>

      {/* Add category */}
      <ErpModal open={catOpen} onOpenChange={setCatOpen} title="نوی د لګښت ډول" size="sm"
        footer={<>
          <button onClick={() => setCatOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
          <button onClick={saveCat} disabled={savingCategory} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">ساتل</button>
        </>}
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">د ډول نوم (پښتو)</span>
            <Input value={catForm.name} handleChanges={(e) => setC("name", e.target.value)} placeholder="مثال: معاشونه" error={catErrors.name} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">نوم (انګلیسي) — اختیاري</span>
            <Input value={catForm.nameEn} handleChanges={(e) => setC("nameEn", e.target.value)} placeholder="e.g. Salaries" error={catErrors.nameEn} />
          </div>
        </div>
      </ErpModal>

      {/* Edit category */}
      <ErpModal open={catEditOpen} onOpenChange={setCatEditOpen} title="ډول سمول" size="sm"
        footer={<>
          <button onClick={() => setCatEditOpen(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">لغوه</button>
          <button onClick={updateCat} disabled={savingCategory} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">ساتل</button>
        </>}
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">د ډول نوم (پښتو)</span>
            <Input value={catForm.name} handleChanges={(e) => setC("name", e.target.value)} placeholder="مثال: معاشونه" error={catErrors.name} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">نوم (انګلیسي) — اختیاري</span>
            <Input value={catForm.nameEn} handleChanges={(e) => setC("nameEn", e.target.value)} placeholder="e.g. Salaries" error={catErrors.nameEn} />
          </div>
        </div>
      </ErpModal>

      {/* Delete category */}
      <ConfirmDelete
        open={catDelOpen}
        onClose={() => setCatDelOpen(false)}
        onConfirm={deleteCat}
        title={catSel?.name}
        subtitle={`${expenses.filter((e) => e.categoryId === catSel?.id).length} لګښتونه به د کټګورۍ پرته پاتې شي`}
      />

      {/* Delete expense */}
      <ConfirmDelete
        open={expDelOpen}
        onClose={() => setExpDelOpen(false)}
        onConfirm={deleteExp}
        title={expSel?.title}
      />
    </div>
  );
}

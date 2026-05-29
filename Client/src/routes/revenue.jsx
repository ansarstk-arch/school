import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { StatCard } from "@/components/erp/StatCard";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { ShamsiDatePicker } from "@/components/erp/ShamsiDatePicker";
import { ShamsiMonthPicker } from "@/components/erp/ShamsiMonthPicker";
import { Input } from "@/components/ui/Input";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import * as feeApi from "@/data/feeApi";
import * as studentApi from "@/data/studentApi";
import * as classApi from "@/data/classApi";
import { toast } from "sonner";
import { 
  Plus, Printer, Pencil, Trash2, Eye, Download,
  DollarSign, TrendingUp, AlertCircle, CheckCircle, Search
} from "lucide-react";
import {
  currentShamsiYear,
  currentShamsiYearMonth,
  todayAfghan,
  todayIsoDate,
  formatShamsiMonthLabel,
} from "@/lib/afghan-date";
import { printFeeReceipt } from "@/utils/printFeeReceipt";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">
      {label}
      {opt && <span className="opacity-40 ml-1">(اختیاري)</span>}
    </span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const ENROLL_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

const EMPTY_FORM = {
  studentIds: [],
  enrollmentType: "School",
  month: currentShamsiYearMonth(),
  academicYear: String(currentShamsiYear()),
  paidAmount: "",
  date: todayIsoDate(),
  notes: "",
};

export default function Revenue() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selected, setSelected] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    academicYear: "",
    enrollmentType: "",
    status: "",
    month: "",
    startDate: "",
    endDate: "",
  });

  const PAGE_SIZE = 50;

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);

  // Student selection
  const [studentSearchMethod, setStudentSearchMethod] = useState("id");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedType, setSelectedType] = useState("School");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentDetails, setStudentDetails] = useState([]);
  const [multipleIds, setMultipleIds] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [totalFeeAmount, setTotalFeeAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  useEffect(() => {
    loadClasses();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [filters.month, filters.academicYear]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await feeApi.getFeePayments({
        ...filters,
        page,
        limit: PAGE_SIZE,
      });
      const data = response?.data ?? {};
      const rows = (data.payments ?? []).map((p) => ({
        ...p,
        amount: Number(p.amount ?? 0),
        paid: Number(p.paid ?? 0),
        remaining: Number(p.remaining ?? Number(p.amount ?? 0) - Number(p.paid ?? 0)),
      }));
      setPayments(rows);
      setPagination({
        currentPage: data.pagination?.currentPage ?? 1,
        totalPages: data.pagination?.totalPages ?? 1,
        totalRecords: Number(data.pagination?.totalRecords ?? rows.length),
      });
    } catch (error) {
      console.error("Load payments error:", error);
      toast.error(error?.message || "د فیس پیسو معلومات نه شي ترلاسه کیدای");
      setPayments([]);
      setPagination({ currentPage: 1, totalPages: 1, totalRecords: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await feeApi.getFeeStatistics({
        month: filters.month || currentShamsiYearMonth(),
        academicYear: filters.academicYear || undefined,
      });
      setStatistics(response.data);
    } catch (error) {
      console.error("Load statistics error:", error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classApi.getAllClasses({ limit: 100 });
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error("Load classes error:", error);
    }
  };

  const loadStudentsByFilters = async () => {
    if (!selectedClass) {
      toast.error("مهرباني وکړئ لومړی ټولګی غوره کړئ");
      return;
    }

    try {
      const response = await feeApi.getStudentsByFilters({ 
        type: selectedType,
        classId: selectedClass,
      });

      const studentsData = response.data.students || [];
      const enrichedStudents = studentsData.map((student) => ({
        ...student,
        monthlyFee: Number(student.monthlyFee || 0),
      }));

      setStudents(enrichedStudents);
      setSelectedStudents([]);
      setTotalFeeAmount(0);
      setReceivedAmount("");
      
      toast.success(`${enrichedStudents.length} زده کوونکي ترلاسه شول`);
    } catch (error) {
      console.error("Load students error:", error);
      toast.error("زده کوونکي نه شي ترلاسه کیدای");
      setStudents([]);
    }
  };

  const loadStudentsByMultipleIds = async () => {
    if (!multipleIds.trim()) {
      setErrors({ ...errors, multipleIds: "مهرباني وکړئ د زده کوونکو IDs دننه کړئ" });
      return;
    }

    const ids = multipleIds.split(',').map(id => id.trim()).filter(id => id);
    
    if (ids.length === 0) {
      setErrors({ ...errors, multipleIds: "مهرباني وکړئ سم IDs دننه کړئ" });
      return;
    }

    if (ids.length > 10) {
      setErrors({ ...errors, multipleIds: "تاسو یوازې تر 10 زده کوونکو پورې غوره کولی شئ" });
      return;
    }

    try {
      const response = await feeApi.getStudentsByIds(ids);
      if (response.data.students.length === 0) {
        toast.error("هیڅ زده کوونکی ونه موندل شو");
        return;
      }
      setStudentDetails(response.data.students);
      
      // Calculate total fee from all students
      let totalFee = 0;
      response.data.students.forEach(student => {
        student.enrollments?.forEach(enrollment => {
          totalFee += enrollment.monthlyFee || 0;
        });
      });
      
      setTotalFeeAmount(totalFee);
      setReceivedAmount("");
      
      setForm(prev => ({
        ...prev,
        studentIds: response.data.students.map(s => s.id),
        paidAmount: "",
      }));
      setErrors({ ...errors, multipleIds: undefined });
      toast.success(`${response.data.students.length} زده کوونکي ترلاسه شول - ټول فیس: ${totalFee} افغانۍ`);
    } catch (error) {
      toast.error("زده کوونکي نه شي ترلاسه کیدای");
      setStudentDetails([]);
    }
  };

  const handleExport = async (format) => {
    try {
      if (format === 'excel') setExportLoading(true);
      else setPdfLoading(true);
      
      const blob = await feeApi.exportFeePayments({ ...filters, format });
      feeApi.downloadBlob(blob, `fee-payments-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      toast.success(`فایل په بریالیتوب سره ډاونلوډ شو`);
    } catch (error) {
      toast.error("د فایل ډاونلوډ کولو کې ستونزه رامنځته شوه");
    } finally {
      if (format === 'excel') setExportLoading(false);
      else setPdfLoading(false);
    }
  };

  const handlePrintReceipt = async (paymentId) => {
    try {
      const response = await feeApi.getFeePaymentById(paymentId);
      const payment = response.data?.payment ?? response.data;
      if (!payment) {
        toast.error("د رسید معلومات ونه موندل شول");
        return;
      }
      printFeeReceipt(payment);
    } catch (error) {
      toast.error("د رسید چاپ کولو کې ستونزه رامنځته شوه");
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const blob = await feeApi.generateReceiptPDF(paymentId);
      feeApi.downloadBlob(blob, `fee-receipt-${paymentId}.pdf`);
      toast.success("رسید په بریالیتوب سره ډاونلوډ شو");
    } catch (error) {
      toast.error("د رسید ډاونلوډ کولو کې ستونزه رامنځته شوه");
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (editingPayment) {
      if (!form.paidAmount && form.paidAmount !== 0) {
        newErrors.paidAmount = "ورکړل شوی فیس اړین دی";
      } else if (parseFloat(form.paidAmount) < 0) {
        newErrors.paidAmount = "ورکړل شوی فیس باید مثبت عدد وي";
      }
      if (form.notes && form.notes.length > 500) {
        newErrors.notes = "یادښتونه باید د ۵۰۰ توري څخه لږ وي";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (studentSearchMethod === "manual" && selectedStudents.length === 0) {
      newErrors.students = "مهرباني وکړئ لږ تر لږه یو زده کوونکی غوره کړئ";
    }

    if (studentSearchMethod === "id" && form.studentIds.length === 0) {
      newErrors.studentIds = "مهرباني وکړئ د زده کوونکي ID دننه کړئ";
    }

    if (!form.month) {
      newErrors.month = "میاشت اړینه ده";
    } else if (!/^\d{4}-\d{2}$/.test(form.month)) {
      newErrors.month = "میاشت باید سم فارمټ ولري (YYYY-MM)";
    }

    if (!form.academicYear) {
      newErrors.academicYear = "تعلیمي کال اړین دی";
    } else if (!/^\d{4}$/.test(form.academicYear)) {
      newErrors.academicYear = "تعلیمي کال باید ۴ عدده وي";
    }

    if (studentSearchMethod === "id" && !receivedAmount && !editingPayment) {
      newErrors.receivedAmount = "ترلاسه شوې پیسې اړینې دي";
    } else if (studentSearchMethod === "id" && receivedAmount && parseFloat(receivedAmount) < 0) {
      newErrors.receivedAmount = "ترلاسه شوې پیسې باید مثبت عدد وي";
    }

    if (studentSearchMethod === "manual" && !form.paidAmount && !editingPayment) {
      newErrors.paidAmount = "ورکړل شوی فیس اړین دی";
    } else if (studentSearchMethod === "manual" && form.paidAmount && parseFloat(form.paidAmount) < 0) {
      newErrors.paidAmount = "ورکړل شوی فیس باید مثبت عدد وي";
    }

    if (!form.date) {
      newErrors.date = "نېټه اړینه ده";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      newErrors.date = "نېټه باید سم فارمټ ولري (YYYY-MM-DD)";
    }

    if (form.notes && form.notes.length > 500) {
      newErrors.notes = "یادښتونه باید د ۵۰۰ توري څخه لږ وي";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getApiErrorMessage = (error, fallback) => {
    if (error?.status === 401) {
      return "د ننوتلو مهال ختم شوی دی. مهرباني وکړئ بیا ننوځئ";
    }
    return error?.message || error?.data?.message || fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("مهرباني وکړئ ټول اړین ساحې ډک کړئ");
      return;
    }

    if (!localStorage.getItem("accessToken") && !localStorage.getItem("refreshToken")) {
      toast.error("د فیس ثبتولو لپاره لومړی ننوتل اړین دی");
      return;
    }

    try {
      setLoading(true);
      const paidAmt =
        studentSearchMethod === "id"
          ? parseFloat(receivedAmount)
          : parseFloat(form.paidAmount);

      if (!Number.isFinite(paidAmt) || paidAmt < 0) {
        toast.error("ورکړل شوی فیس باید سم عدد وي");
        return;
      }

      if (editingPayment) {
        await feeApi.updateFeePayment(editingPayment.id, {
          paidAmount: paidAmt,
          notes: form.notes || "",
        });
        toast.success("فیس بریالیتوب سره تازه شو");
      } else {
        const payload = {
          studentIds:
            studentSearchMethod === "manual"
              ? selectedStudents.map((id) => Number(id))
              : form.studentIds.map((id) => Number(id)),
          month: form.month,
          academicYear: String(form.academicYear),
          paidAmount: paidAmt,
          date: form.date,
          notes: form.notes || "",
          ...(studentSearchMethod === "manual" ? { enrollmentType: selectedType } : {}),
        };

        const response = await feeApi.createFeePayment(payload);
        toast.success(`فیس بریالیتوب سره ورکړل شو - ${response.data.count} زده کوونکي`);
        
        if (response.data.payments && response.data.payments.length > 0) {
          setReceiptData(response.data.payments);
          setShowReceiptModal(true);
        }
      }
      
      setFormOpen(false);
      resetForm();
      await loadPayments();
      await loadStatistics();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "فیس ورکولو کې ستونزه رامنځته شوه"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    
    try {
      setLoading(true);
      await feeApi.deleteFeePayment(selected.id);
      toast.success("فیس بریالیتوب سره ډیلیټ شو");
      setDeleteOpen(false);
      setSelected(null);
      await loadPayments();
      await loadStatistics();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "فیس ډیلیټ کولو کې ستونزه رامنځته شوه"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingPayment(null);
    setStudentDetails([]);
    setSelectedStudents([]);
    setStudentSearchMethod("id");
    setMultipleIds("");
    setTotalFeeAmount(0);
    setReceivedAmount("");
    setErrors({});
  };

  useEffect(() => {
    if (studentSearchMethod === "manual" && selectedStudents.length > 0) {
      const selectedFee = students
        .filter((student) => selectedStudents.includes(student.id))
        .reduce((sum, student) => sum + Number(student.monthlyFee || 0), 0);

      setTotalFeeAmount(selectedFee);
    } else if (studentSearchMethod === "manual") {
      setTotalFeeAmount(0);
    }
  }, [studentSearchMethod, selectedStudents, students]);

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openView = (payment) => {
    setViewPayment(payment);
    setViewOpen(true);
  };

  const openEdit = (payment) => {
    setEditingPayment(payment);
    setForm({
      ...EMPTY_FORM,
      paidAmount: payment.paid,
      notes: payment.notes || "",
    });
    setFormOpen(true);
  };

  const openDelete = (payment) => {
    setSelected(payment);
    setDeleteOpen(true);
  };

  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const typeLabel = (value) => {
    const typeMap = { School: "ښوونځی", Center: "مرکز", Madrasa: "مدرسه" };
    return typeMap[value] || value || "—";
  };

  const statusLabel = (value) => {
    const statusMap = {
      Paid: "ورکړل شوی",
      Partial: "نیمګړی",
      Unpaid: "نه ورکړل شوی",
    };
    return statusMap[value] || value || "—";
  };

  // AG Grid columns (same React pattern as salaries/students)
  const columnDefs = useMemo(() => [
    { field: "studentName", headerName: "زده کوونکی", flex: 1, minWidth: 120 },
    { field: "className", headerName: "ټولګی", flex: 0.6, minWidth: 80 },
    {
      field: "enrollmentType",
      headerName: "ډول",
      flex: 0.5,
      minWidth: 70,
      valueGetter: (params) => typeLabel(params.data?.enrollmentType),
    },
    {
      field: "month",
      headerName: "میاشت",
      flex: 0.7,
      minWidth: 90,
      valueGetter: (params) => formatShamsiMonthLabel(params.data?.month),
    },
    {
      field: "amount",
      headerName: "ټول فیس",
      flex: 0.7,
      minWidth: 85,
      valueGetter: (params) => `${Number(params.data?.amount ?? 0)} افغانۍ`,
    },
    {
      field: "paid",
      headerName: "ورکړل شوی",
      flex: 0.7,
      minWidth: 85,
      valueGetter: (params) => `${Number(params.data?.paid ?? 0)} افغانۍ`,
    },
    {
      field: "status",
      headerName: "حالت",
      flex: 0.6,
      minWidth: 80,
      valueGetter: (params) => statusLabel(params.data?.status),
      cellRenderer: (params) => {
        const status = params.data?.status;
        const colors = {
          Paid: "text-green-700 bg-green-50",
          Partial: "text-yellow-700 bg-yellow-50",
          Unpaid: "text-red-700 bg-red-50",
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
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const p = params.data;
        if (!p) return null;
        return (
          <div className="flex items-center gap-0.5 h-full">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openView(p); }}
              className="p-1.5 rounded hover:bg-muted text-blue-600"
              title="کتل"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openEdit(p); }}
              className="p-1.5 rounded hover:bg-muted text-green-600"
              title="سمول"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrintReceipt(p.id); }}
              className="p-1.5 rounded hover:bg-muted text-violet-600"
              title="چاپ"
            >
              <Printer className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(p.id); }}
              className="p-1.5 rounded hover:bg-muted text-indigo-600"
              title="ډاونلوډ PDF"
            >
              <Download className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openDelete(p); }}
              className="p-1.5 rounded hover:bg-muted text-destructive"
              title="ړنګول"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ], [openView, openEdit, openDelete, handlePrintReceipt, handleDownloadReceipt]);

  // Filter component
  function FeeFilterBar() {
    return (
      <div className="bg-card border rounded-md p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">فلټر:</span>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="نوم یا رسید نمبر..."
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            
            <div className="min-w-[140px]">
              <ShamsiYearPicker
                value={filters.academicYear}
                onChange={(y) => { setFilters({ ...filters, academicYear: y }); setPage(1); }}
                placeholder="تعلیمي کال (ټول)"
              />
            </div>
            
            <select
              value={filters.enrollmentType}
              onChange={(e) => { setFilters({ ...filters, enrollmentType: e.target.value }); setPage(1); }}
              className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">ټول ډولونه</option>
              {ENROLL_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">ټول حالتونه</option>
              <option value="Paid">ورکړل شوی</option>
              <option value="Partial">نیمګړی</option>
              <option value="Unpaid">نه ورکړل شوی</option>
            </select>

            <div className="min-w-[140px]">
              <ShamsiMonthPicker
                value={filters.month}
                onChange={(m) => { setFilters({ ...filters, month: m }); setPage(1); }}
                placeholder="میاشت (ټول)"
                allowClear
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFilters({ search: "", academicYear: "", enrollmentType: "", status: "", month: "", startDate: "", endDate: "" }); setPage(1); }}
            className="text-xs border border-input rounded px-2.5 py-1.5 hover:bg-muted text-muted-foreground"
          >
            پاکول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader 
        title="د فیس مدیریت" 
        subtitle={filters.academicYear ? `${filters.academicYear} تعلیمي کال` : "ټول فیسونه"}
        actions={
          <button onClick={openNew} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="size-3.5" /> نوی فیس
          </button>
        }
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="د دې میاشتې ټول فیس"
            value={`${formatNumber(statistics.thisMonth.totalDue)} افغانۍ`}
            icon={<DollarSign className="size-5" />}
            accent="info"
          />
          <StatCard
            label="راټول شوی فیس"
            value={`${formatNumber(statistics.thisMonth.totalCollected)} افغانۍ`}
            icon={<TrendingUp className="size-5" />}
            accent="success"
          />
          <StatCard
            label="پاتې فیس"
            value={`${formatNumber(statistics.thisMonth.remaining)} افغانۍ`}
            icon={<AlertCircle className="size-5" />}
            accent="warning"
          />
          <StatCard
            label="ټول پیسې"
            value={statistics.thisMonth.totalPayments}
            icon={<CheckCircle className="size-5" />}
            accent="success"
          />
        </div>
      )}

      <FeeFilterBar />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={payments}
        loading={loading}
        emptyText="هیڅ فیس ونه موندل شو"
        searchPlaceholder="د زده کوونکي نوم، رسید نمبر..."
        serverSidePagination={true}
        pageSize={PAGE_SIZE}
        totalRows={pagination.totalRecords}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        getRowId={(params) => String(params.data.id)}
        enableRtl={true}
        enableExport={true}
        exportFileName="fee-payments"
        onExportClick={() => handleExport('excel')}
        onPdfClick={() => handleExport('pdf')}
        exportLoading={exportLoading}
        pdfLoading={pdfLoading}
      />

      {/* Fee Payment Modal */}
      <ErpModal 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        title={editingPayment ? "د فیس تازه کول" : "نوی فیس"} 
        size="lg"
        footer={
          <>
            <button onClick={() => { setFormOpen(false); resetForm(); }} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted" disabled={loading}>
              لغوه
            </button>
            <button type="button" onClick={handleSubmit} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium" disabled={loading}>
              {loading ? "...په ثبتیدو کې" : "ثبتول"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editingPayment && (
            <>
              {/* Student Search Method */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">د زده کوونکي د غوره کولو طریقه</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="id"
                      checked={studentSearchMethod === "id"}
                      onChange={(e) => {
                        setStudentSearchMethod(e.target.value);
                        setStudentDetails([]);
                        setMultipleIds("");
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">د ID په واسطه</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="manual"
                      checked={studentSearchMethod === "manual"}
                      onChange={(e) => {
                        setStudentSearchMethod(e.target.value);
                        setStudentDetails([]);
                        setForm({ ...form, studentIds: [] });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">په لاسي ډول</span>
                  </label>
                </div>
              </div>

              {/* Search by ID */}
              {studentSearchMethod === "id" && (
                <>
                  <F label="د زده کوونکو IDs (د کاما په واسطه جلا کړئ)" error={errors.multipleIds || errors.studentIds}>
                    <textarea
                      value={multipleIds}
                      onChange={(e) => setMultipleIds(e.target.value)}
                      placeholder="مثال: 1, 2, 3, 4 (تر 10 پورې)"
                      className={SEL}
                      rows="2"
                    />
                  </F>
                  <button
                    type="button"
                    onClick={loadStudentsByMultipleIds}
                    className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted w-full flex items-center justify-center gap-1.5"
                  >
                    <Search className="size-3.5" />
                    زده کوونکي ومومئ
                  </button>

                  {studentDetails.length > 0 && (
                    <>
                      <div className="border border-border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
                        <p className="text-xs font-medium">غوره شوي زده کوونکي ({studentDetails.length}):</p>
                        {studentDetails.map((student) => (
                          <div key={student.id} className="p-2 bg-muted rounded-md text-xs">
                            <p><strong>ID:</strong> {student.id} | <strong>نوم:</strong> {student.fullName}</p>
                            <p><strong>د پلار نوم:</strong> {student.fatherName}</p>
                            <p><strong>ټولګی:</strong> {student.className} {student.section}</p>
                            {student.enrollments && student.enrollments.length > 0 && (
                              <div className="mt-1">
                                <p className="text-[10px] font-medium">شمولیتونه:</p>
                                {student.enrollments.map((enrollment, idx) => (
                                  <p key={idx} className="text-[10px]">
                                    • {enrollment.enrollmentType}: {enrollment.monthlyFee} افغانۍ
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-primary/10 border border-primary rounded-md p-3">
                        <p className="text-sm font-bold text-primary">ټول فیس: {totalFeeAmount} افغانۍ</p>
                      </div>
                      
                      <F label="ترلاسه شوې پیسې (افغانۍ)" error={errors.receivedAmount}>
                        <Input
                          type="number"
                          value={receivedAmount}
                          handleChanges={(e) => {
                            setReceivedAmount(e.target.value);
                            if (errors.receivedAmount) setErrors({ ...errors, receivedAmount: undefined });
                          }}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        {receivedAmount && (
                          <p className="text-xs text-muted-foreground mt-1">
                            پاتې فیس: {(totalFeeAmount - parseFloat(receivedAmount || 0)).toFixed(2)} افغانۍ
                          </p>
                        )}
                      </F>
                    </>
                  )}
                </>
              )}

              {/* Manual Selection */}
              {studentSearchMethod === "manual" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="ډول">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className={SEL}
                      >
                        {ENROLL_TYPES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </F>
                    <F label="ټولګی">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className={SEL}
                      >
                        <option value="">ټولګی غوره کړئ</option>
                        {classes.filter(c => c.type === selectedType).map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} {cls.section ? `- ${cls.section}` : ""}
                          </option>
                        ))}
                      </select>
                    </F>
                  </div>

                  <button
                    type="button"
                    onClick={loadStudentsByFilters}
                    className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted w-full flex items-center justify-center gap-1.5"
                  >
                    زده کوونکي ښکاره کړئ
                  </button>

                  {students.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">زده کوونکي غوره کړئ (تر 10 پورې)</span>
                      <div className="max-h-48 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                        {students.map(student => (
                          <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedStudents.length >= 10) {
                                    toast.error("تاسو یوازې تر 10 زده کوونکو پورې غوره کولی شئ");
                                    return;
                                  }
                                  setSelectedStudents([...selectedStudents, student.id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 text-xs">
                              <div>{student.fullName} - {student.fatherName}</div>
                              <div className="text-[10px] text-muted-foreground">
                                فیس: {student.monthlyFee ?? 0} افغانۍ
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        غوره شوي: {selectedStudents.length} / 10
                      </p>

                      {selectedStudents.length > 0 && (
                        <div className="mt-3 bg-primary/10 border border-primary rounded-md p-3 text-sm">
                          <p className="font-medium">د غوره شویو زده کوونکو مجموعي فیس:</p>
                          <p>{totalFeeAmount} افغانۍ</p>
                        </div>
                      )}

                      {errors.students && <p className="text-[11px] text-destructive mt-1">{errors.students}</p>}
                    </div>
                  )}
                </>
              )}

              {/* Month */}
              <F label="میاشت" error={errors.month}>
                <ShamsiMonthPicker
                  value={form.month}
                  onChange={(m) => setF("month", m)}
                  allowClear={false}
                />
              </F>

              {/* Academic Year */}
              <F label="تعلیمي کال" error={errors.academicYear}>
                <ShamsiYearPicker
                  value={String(form.academicYear || "")}
                  onChange={(y) => setF("academicYear", y)}
                />
              </F>

              {/* Date */}
              <F label="نیټه" error={errors.date}>
                <ShamsiDatePicker
                  value={form.date}
                  onChange={(d) => setF("date", d)}
                />
              </F>
            </>
          )}

          {/* Paid Amount - Only show for manual selection or edit mode */}
          {(studentSearchMethod === "manual" || editingPayment) && (
            <F label="ورکړل شوی فیس (افغانۍ)" error={errors.paidAmount}>
              <Input
                type="number"
                value={form.paidAmount}
                handleChanges={(e) => setF("paidAmount", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </F>
          )}

          {/* Notes */}
          <F label="یادښتونه" opt error={errors.notes}>
            <Input
              type="textarea"
              value={form.notes}
              handleChanges={(e) => setF("notes", e.target.value)}
              placeholder="یادښتونه..."
              rows="3"
            />
          </F>
        </form>
      </ErpModal>

      {/* Delete Confirmation */}
      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={selected?.studentName}
        subtitle={`رسید نمبر: ${selected?.receiptNo}`}
      />

      {/* Receipt Modal */}
      <ErpModal
        open={showReceiptModal}
        onOpenChange={setShowReceiptModal}
        title="د فیس رسید"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowReceiptModal(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
            >
              بندول
            </button>
            <button
              onClick={async () => {
                for (const payment of receiptData) {
                  await handlePrintReceipt(payment.id);
                }
                setShowReceiptModal(false);
              }}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium flex items-center gap-1.5"
            >
              <Printer className="size-3.5" />
              چاپ
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            فیس بریالیتوب سره ثبت شو. د چاپ لپاره د چاپ تڼۍ کلیک وکړئ.
          </p>
          <div className="border border-border rounded-md p-3 bg-muted/30">
            <p className="text-xs font-medium mb-2">د رسیدونو تفصیل:</p>
            {receiptData.map((payment, idx) => (
              <div key={idx} className="text-xs py-1 border-b border-border last:border-0">
                <p><strong>رسید نمبر:</strong> {payment.receiptNo}</p>
                <p><strong>زده کوونکی:</strong> {payment.studentName}</p>
                <p><strong>فیس:</strong> {payment.amount} افغانۍ</p>
              </div>
            ))}
          </div>
        </div>
      </ErpModal>

      {/* View Payment Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د فیس تفصیل"
        size="md"
        footer={
          <button
            onClick={() => setViewOpen(false)}
            className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
          >
            بندول
          </button>
        }
      >
        {viewPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">رسید نمبر</p>
                <p className="font-medium">{viewPayment.receiptNo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نیټه</p>
                <p className="font-medium">{viewPayment.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">زده کوونکی</p>
                <p className="font-medium">{viewPayment.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د پلار نوم</p>
                <p className="font-medium">{viewPayment.fatherName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ټولګی</p>
                <p className="font-medium">{viewPayment.className}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ډول</p>
                <p className="font-medium">
                  {viewPayment.enrollmentType === "School" ? "ښوونځی" : 
                   viewPayment.enrollmentType === "Center" ? "مرکز" : "مدرسه"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">میاشت</p>
                <p className="font-medium">{viewPayment.month}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تعلیمي کال</p>
                <p className="font-medium">{viewPayment.academicYear}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">ټول فیس</p>
                  <p className="font-semibold text-lg">{viewPayment.amount} افغانۍ</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ورکړل شوی</p>
                  <p className="font-semibold text-lg text-green-600">{viewPayment.paid} افغانۍ</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">پاتې فیس</p>
                  <p className="font-semibold text-lg text-orange-600">
                    {(viewPayment.amount - viewPayment.paid).toFixed(2)} افغانۍ
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Badge variant={
                viewPayment.status === "Paid" ? "success" : 
                viewPayment.status === "Partial" ? "warning" : "destructive"
              }>
                {viewPayment.status === "Paid" ? "ورکړل شوی" : 
                 viewPayment.status === "Partial" ? "نیمګړی" : "نه ورکړل شوی"}
              </Badge>
            </div>

            {viewPayment.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-1">یادښتونه</p>
                <p className="text-sm">{viewPayment.notes}</p>
              </div>
            )}

            {viewPayment.collectedBy && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-1">د راټولونکي نوم</p>
                <p className="text-sm font-medium">{viewPayment.collectedBy}</p>
              </div>
            )}
          </div>
        )}
      </ErpModal>
    </div>
  );
}

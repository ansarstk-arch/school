import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, Loader2, CheckCircle, XCircle, Clock, Eye, RotateCcw } from "lucide-react";
import { getSmsLogs, getSmsStatistics, retrySms, getSmsEndpoints } from "@/data/smsApi";
import { PageHeader } from "@/components/erp/PageHeader";
import { FilterBar } from "@/components/erp/FilterBar";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { StatCard } from "@/components/erp/StatCard";
import { currentShamsiYear } from "@/lib/afghan-date";
import { toast } from "sonner";

const SMS_FILTERS = [
  {
    key: "status",
    label: "حالت",
    type: "select",
    options: [
      { value: "Sent", label: "لیږل شوي" },
      { value: "Failed", label: "ناکام" },
      { value: "Pending", label: "په انتظار کې" },
    ],
  },
  {
    key: "messageType",
    label: "د پیغام ډول",
    type: "select",
    options: [
      { value: "Absent", label: "غیر حاضري" },
      { value: "Present", label: "حاضري" },
      { value: "Fee", label: "فیس" },
      { value: "ExamPass", label: "ازموینه - بریالیتوب" },
      { value: "ExamFail", label: "ازموینه - ناکامي" },
      { value: "Homework", label: "کور کار" },
    ],
  },
  { key: "year", label: "کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
  { key: "studentId", label: "د زده کوونکي ID", type: "number", placeholder: "زده کوونکي ID ولیکئ" },
];

const SMS_FILTER_DEFAULTS = { year: String(currentShamsiYear()) };

const MESSAGE_TYPE_LABELS = {
  Absent: "غیر حاضري",
  Present: "حاضري",
  Fee: "فیس",
  ExamPass: "ازموینه - بریالیتوب",
  ExamFail: "ازموینه - ناکامي",
  Homework: "کور کار",
  Custom: "دودیز",
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("fa-AF") + " " + date.toLocaleTimeString("fa-AF", { hour: "2-digit", minute: "2-digit" });
};

export default function SmsReports() {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [filters, setFilters] = useState(SMS_FILTER_DEFAULTS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSmsLogs({ ...filters, page, limit: 10 });
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      toast.error(error.message || "د ریکارډونو ترلاسه کولو کې تېروتنه");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await getSmsStatistics(filters);
      setStatistics(response.data.stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, [filters]);

  useEffect(() => {
    getSmsEndpoints().then((r) => setEndpoints(r.data.endpoints || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [fetchLogs, fetchStatistics]);

  const handleApplyFilters = (values) => {
    setFilters(values);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(SMS_FILTER_DEFAULTS);
    setPage(1);
  };

  const handleRetry = async (log) => {
    setRetrying(log.id);
    try {
      const epId = log.endpointId || endpoints.find((e) => e.apiUrl)?.id;
      await retrySms(log.id, epId ? { endpointId: epId } : {});
      toast.success("پیغام بیا لیږل شو");
      fetchLogs();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "د پیغام بیا لیږلو کې تېروتنه");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Sent":
        return <Badge variant="success"><CheckCircle className="inline-block ml-1 size-3" />لیږل شوی</Badge>;
      case "Failed":
        return <Badge variant="danger"><XCircle className="inline-block ml-1 size-3" />ناکام</Badge>;
      case "Pending":
        return <Badge variant="muted"><Clock className="inline-block ml-1 size-3" />په انتظار کې</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const columnDefs = useMemo(() => [
    {
      field: "createdAt",
      headerName: "نیټه",
      flex: 1.1,
      minWidth: 140,
      valueFormatter: (params) => formatDate(params.value),
    },
    { field: "recipientName", headerName: "ترلاسه کوونکی", flex: 1.2, minWidth: 150 },
    {
      field: "recipientPhone",
      headerName: "ټیلیفون",
      flex: 1,
      minWidth: 130,
      cellRenderer: (params) => <span dir="ltr">{params.value || "—"}</span>,
    },
    {
      field: "studentName",
      headerName: "زده کوونکی",
      flex: 1.2,
      minWidth: 150,
      cellRenderer: (params) => {
        const log = params.data;
        if (!log?.studentName) return "—";
        return (
          <span>
            {log.studentName}
            {log.studentId && <span className="text-[10px] text-muted-foreground mr-1">({log.studentId})</span>}
          </span>
        );
      },
    },
    {
      field: "messageType",
      headerName: "د پیغام ډول",
      flex: 1,
      minWidth: 120,
      cellRenderer: (params) => (
        <Badge variant="muted">{MESSAGE_TYPE_LABELS[params.value] || params.value}</Badge>
      ),
    },
    {
      field: "status",
      headerName: "حالت",
      flex: 0.9,
      minWidth: 110,
      cellRenderer: (params) => getStatusBadge(params.value),
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.7,
      minWidth: 90,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const log = params.data;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setViewingMessage(log); }}
              title="پیغام وګورئ"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            {log.status === "Failed" && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRetry(log); }}
                disabled={retrying === log.id}
                title="بیا هڅه"
                className="p-1.5 rounded hover:bg-muted text-muted-foreground"
              >
                {retrying === log.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              </button>
            )}
          </div>
        );
      },
    },
  ], [retrying]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="د SMS راپورونه او تاریخچه"
        subtitle="د لیږل شوو پیغامونو تاریخچه او احصائیې"
        actions={
          <button
            onClick={() => { fetchLogs(); fetchStatistics(); }}
            className="inline-flex items-center gap-2 text-sm border border-input rounded-md px-3 py-2 hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            تازه کړئ
          </button>
        }
      />

      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="ټول پیغامونه" value={statistics.total} />
          <StatCard label="لیږل شوي" value={statistics.sent} accent="success" />
          <StatCard label="ناکام" value={statistics.failed} accent="destructive" />
          <StatCard label="د بریالیتوب سلنه" value={`${statistics.successRate}%`} />
        </div>
      )}

      <FilterBar
        filters={SMS_FILTERS}
        defaultValues={SMS_FILTER_DEFAULTS}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={logs}
        loading={loading}
        emptyText="هیڅ ریکارډ ونه موندل شو"
        searchPlaceholder="نوم، ټیلیفون، زده کوونکی..."
        serverSidePagination
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      <ErpModal
        open={Boolean(viewingMessage)}
        onOpenChange={() => setViewingMessage(null)}
        title="د پیغام تفصیل"
        size="md"
        footer={
          <>
            {viewingMessage?.status === "Failed" && (
              <button
                onClick={() => { handleRetry(viewingMessage); setViewingMessage(null); }}
                disabled={retrying === viewingMessage?.id}
                className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
              >
                {retrying === viewingMessage?.id ? "بیا لیږل کیږي..." : "بیا هڅه"}
              </button>
            )}
            <button onClick={() => setViewingMessage(null)} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded">
              تړل
            </button>
          </>
        }
      >
        {viewingMessage && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">ترلاسه کوونکی</p>
                <p className="font-medium">{viewingMessage.recipientName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ټیلیفون</p>
                <p className="font-medium" dir="ltr">{viewingMessage.recipientPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">زده کوونکی</p>
                <p className="font-medium">{viewingMessage.studentName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د پیغام ډول</p>
                <p className="font-medium">{MESSAGE_TYPE_LABELS[viewingMessage.messageType] || viewingMessage.messageType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نیټه</p>
                <p className="font-medium">{formatDate(viewingMessage.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حالت</p>
                <div className="mt-1">{getStatusBadge(viewingMessage.status)}</div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">پیغام</p>
              <div className="bg-muted/30 p-3 rounded border leading-relaxed">{viewingMessage.messageContent}</div>
            </div>
            {viewingMessage.failureReason && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">د ناکامۍ دلیل</p>
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded text-destructive">
                  {viewingMessage.failureReason}
                </div>
              </div>
            )}
          </div>
        )}
      </ErpModal>
    </div>
  );
}

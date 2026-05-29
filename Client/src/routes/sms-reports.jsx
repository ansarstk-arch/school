import { useState, useEffect } from "react";
import { RefreshCw, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { getSmsLogs, getSmsStatistics, retrySms } from "@/data/smsApi";
import { PageHeader } from "@/components/erp/PageHeader";
import { Badge } from "@/components/erp/Badge";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const BTN = "px-3 py-1.5 rounded text-xs font-medium transition-colors";
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

const statusOptions = [
  { value: "", label: "ټول" },
  { value: "Sent", label: "لیږل شوي" },
  { value: "Failed", label: "ناکام" },
  { value: "Pending", label: "په انتظار کې" },
];

const messageTypeOptions = [
  { value: "", label: "ټول" },
  { value: "Absent", label: "غیر حاضري" },
  { value: "Fee", label: "فیس" },
  { value: "ExamPass", label: "ازموینه - بریالیتوب" },
  { value: "ExamFail", label: "ازموینه - ناکامي" },
  { value: "Homework", label: "کور کار" },
];

export default function SmsReports() {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    messageType: "",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [filters.status, filters.messageType, filters.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getSmsLogs(filters);
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error("د ریکارډونو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await getSmsStatistics();
      setStatistics(response.data.stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await retrySms(id);
      toast.success("پیغام بیا لیږل شو");
      fetchLogs();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || "د پیغام بیا لیږلو کې تېروتنه");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Sent":
        return <Badge variant="success"><CheckCircle className="inline-block ml-1 h-3 w-3" />لیږل شوی</Badge>;
      case "Failed":
        return <Badge variant="danger"><XCircle className="inline-block ml-1 h-3 w-3" />ناکام</Badge>;
      case "Pending":
        return <Badge variant="muted"><Clock className="inline-block ml-1 h-3 w-3" />په انتظار کې</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-AF') + " " + date.toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title="د SMS راپورونه او تاریخچه" 
        subtitle="د لیږل شوو پیغامونو تاریخچه او احصائیې"
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-md p-4">
            <p className="text-xs text-muted-foreground mb-1">ټول پیغامونه</p>
            <p className="text-3xl font-bold">{statistics.total}</p>
          </div>
          <div className="bg-card border rounded-md p-4">
            <p className="text-xs text-muted-foreground mb-1">لیږل شوي</p>
            <p className="text-3xl font-bold text-green-600">{statistics.sent}</p>
          </div>
          <div className="bg-card border rounded-md p-4">
            <p className="text-xs text-muted-foreground mb-1">ناکام</p>
            <p className="text-3xl font-bold text-red-600">{statistics.failed}</p>
          </div>
          <div className="bg-card border rounded-md p-4">
            <p className="text-xs text-muted-foreground mb-1">د بریالیتوب سلنه</p>
            <p className="text-3xl font-bold">{statistics.successRate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-md p-4">
        <h3 className="text-base font-semibold mb-3">فلټرونه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">حالت</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className={SEL}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">د پیغام ډول</label>
            <select
              value={filters.messageType}
              onChange={(e) => setFilters(prev => ({ ...prev, messageType: e.target.value, page: 1 }))}
              className={SEL}
            >
              {messageTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold">د پیغامونو تاریخچه</h3>
          <button onClick={fetchLogs} className={BTN_OUTLINE}>
            <RefreshCw className="inline-block ml-2 h-4 w-4" />
            تازه کړئ
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            هیڅ ریکارډ ونه موندل شو
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="pb-2 font-medium text-muted-foreground">نیټه</th>
                  <th className="pb-2 font-medium text-muted-foreground">ترلاسه کوونکی</th>
                  <th className="pb-2 font-medium text-muted-foreground">ټیلیفون</th>
                  <th className="pb-2 font-medium text-muted-foreground">زده کوونکی</th>
                  <th className="pb-2 font-medium text-muted-foreground">د پیغام ډول</th>
                  <th className="pb-2 font-medium text-muted-foreground">حالت</th>
                  <th className="pb-2 font-medium text-muted-foreground">عمل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 text-xs">{formatDate(log.createdAt)}</td>
                    <td className="py-3">{log.recipientName}</td>
                    <td className="py-3 text-xs" dir="ltr">{log.recipientPhone}</td>
                    <td className="py-3">{log.studentName || "-"}</td>
                    <td className="py-3">
                      <Badge variant="muted">{log.messageType}</Badge>
                    </td>
                    <td className="py-3">{getStatusBadge(log.status)}</td>
                    <td className="py-3">
                      {log.status === "Failed" && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retrying === log.id}
                          className={BTN_OUTLINE}
                        >
                          {retrying === log.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="inline-block ml-1 h-3 w-3" />
                              بیا هڅه
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className={`${BTN_OUTLINE} ${filters.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            مخکې
          </button>
          <div className="flex items-center px-4 text-sm">
            پاڼه {filters.page}
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={logs.length < filters.limit}
            className={`${BTN_OUTLINE} ${logs.length < filters.limit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            بل
          </button>
        </div>
      )}
    </div>
  );
}

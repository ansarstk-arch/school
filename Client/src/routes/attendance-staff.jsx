import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { QRAttendanceScanner } from "@/components/erp/QRAttendanceScanner";
import { 
  UserCog, Calendar, QrCode, Check, X, Clock, 
  CheckCircle2, XCircle, Timer, AlertCircle, Search, Download, FileSpreadsheet, FileText
} from "lucide-react";
import { currentShamsiYear, todayAfghan } from "@/lib/afghan-date";
import * as attendanceApi from "@/data/attendanceApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ATTENDANCE_METHODS = [
  { value: "Manual", label: "لاسي" },
  { value: "QR", label: "QR کوډ" },
];

const STATUS_OPTIONS = [
  { value: "Present", label: "حاضر", color: "bg-success text-success-foreground" },
  { value: "Absent", label: "غیر حاضر", color: "bg-destructive text-destructive-foreground" },
  { value: "Leave", label: "رخصتي", color: "bg-warning text-warning-foreground" },
];

const REPORT_PERIODS = [
  { value: "daily", label: "ورځنی" },
  { value: "monthly", label: "میاشتنی" },
  { value: "yearly", label: "کلنی" },
];

export default function StaffAttendance() {
  // Form states
  const [attendanceMethod, setAttendanceMethod] = useState("Manual");
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
  
  // Download states
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportStartDate, setReportStartDate] = useState(getTodayDate());
  const [reportEndDate, setReportEndDate] = useState(getTodayDate());
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Data states
  const [staff, setStaff] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usbScannerActive, setUsbScannerActive] = useState(
    Boolean(window.__attendanceUsbScannerActive)
  );
  
  const itemsPerPage = 30;

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const onScannerStatus = (event) => {
      setUsbScannerActive(Boolean(event.detail?.active));
    };
    window.addEventListener("attendance:usb-scanner-status", onScannerStatus);
    return () =>
      window.removeEventListener("attendance:usb-scanner-status", onScannerStatus);
  }, []);

  const handleManageAttendance = async () => {
    if (attendanceMethod === "QR") {
      setShowQRScanner(true);
      return;
    }

    // Load staff for manual attendance
    setLoading(true);
    try {
      const response = await attendanceApi.getPeopleForAttendance({
        attendanceType: "Staff",
        attendanceDate,
      });
      
      if (response.success) {
        setStaff(response.data.people || []);
        
        // Build attendance data from existing records
        const attendanceMap = {};
        response.data.people.forEach((staffMember) => {
          const key = staffMember.rowKey || `Staff-${staffMember.id}`;
          if (staffMember.attendance && staffMember.attendance.status !== null) {
            attendanceMap[key] = staffMember.attendance.status;
          }
        });
        setAttendanceData(attendanceMap);
        setShowTable(true);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("د کارمندانو د لوډولو کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  const personKey = (member) => member.rowKey || `Staff-${member.id}`;

  const handleStatusChange = (rowKey, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [rowKey]: status,
    }));
  };

  const handleBulkAction = (status) => {
    const newData = { ...attendanceData };
    filteredStaff.forEach((staffMember) => {
      newData[personKey(staffMember)] = status;
    });
    setAttendanceData(newData);
  };

  const handleSaveAttendance = async () => {
    if (Object.keys(attendanceData).length === 0) {
      toast.error("د ثبتولو لپاره هیڅ حاضرۍ نشته");
      return;
    }

    setSaving(true);
    try {
      const attendanceArray = Object.entries(attendanceData).map(([rowKey, status]) => {
        const [role, idPart] = rowKey.includes("-")
          ? rowKey.split("-")
          : ["Staff", rowKey];
        return {
          personId: parseInt(idPart, 10),
          status,
          attendanceType: role,
        };
      });

      const response = await attendanceApi.bulkCreateAttendance({
        attendanceType: "Staff",
        attendanceDate,
        attendanceData: attendanceArray,
      });
      
      if (response.success) {
        toast.success(response.message || "حاضرۍ بریالۍ ثبت شوه");
        // Reload to get updated data
        handleManageAttendance();
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(error.message || "د حاضرۍ د ثبتولو کې ستونزه");
    } finally {
      setSaving(false);
    }
  };

  const handleQRScan = async (qrCode) => {
    try {
      const response = await attendanceApi.qrAttendance({ qrCode, attendanceDate });
      if (response.success) {
        const action = response.data?.action;
        if (action === "already_marked_today" || action === "duplicate_scan") {
          toast.info(response.message);
        } else {
          toast.success(response.message);
        }
      }
    } catch (error) {
      console.error("QR scan error:", error);
      throw error;
    }
  };

  // Filter and paginate staff
  const filteredStaff = staff.filter(staffMember => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      staffMember.name?.toLowerCase().includes(search) ||
      staffMember.fatherName?.toLowerCase().includes(search) ||
      staffMember.position?.toLowerCase().includes(search) ||
      staffMember.id?.toString().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = {
    total: staff.length,
    present: Object.values(attendanceData).filter(s => s === "Present").length,
    absent: Object.values(attendanceData).filter(s => s === "Absent").length,
    leave: Object.values(attendanceData).filter(s => s === "Leave").length,
  };
  stats.undefined = stats.total - stats.present - stats.absent - stats.leave;

  // Handle report period change
  useEffect(() => {
    const today = getTodayDate();
    if (reportPeriod === "daily") {
      setReportStartDate(today);
      setReportEndDate(today);
    } else if (reportPeriod === "monthly") {
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      setReportStartDate(firstDay.toISOString().split('T')[0]);
      setReportEndDate(lastDay.toISOString().split('T')[0]);
    } else if (reportPeriod === "yearly") {
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), 0, 1);
      const lastDay = new Date(date.getFullYear(), 11, 31);
      setReportStartDate(firstDay.toISOString().split('T')[0]);
      setReportEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [reportPeriod]);

  // Download handler
  const handleDownload = async (format) => {
    const setLoading = format === 'excel' ? setDownloadingExcel : setDownloadingPdf;
    setLoading(true);
    try {
      const params = {
        attendanceType: "Staff",
        startDate: reportStartDate,
        endDate: reportEndDate,
        format: format,
      };

      const queryString = new URLSearchParams(params).toString();
      const url = `${import.meta.env.VITE_API_URL}/attendance/download/report?${queryString}`;
      
      // Fetch the file as blob
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `attendance_staff_${reportStartDate}_${reportEndDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`د ${format === 'excel' ? 'Excel' : 'PDF'} فایل ډاونلوډ شو`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("د ډاونلوډ کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="د کارمندانو حاضري" 
        subtitle={`د ${currentShamsiYear()} تعلیمي کال • ${todayAfghan()}`}
      />

      {/* Selection Form */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">د حاضرۍ معلومات</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              د حاضرۍ میتود
            </label>
            <select
              value={attendanceMethod}
              onChange={(e) => setAttendanceMethod(e.target.value)}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ATTENDANCE_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              نېټه
            </label>
            <input
              type="date"
              value={attendanceDate}
              max={getTodayDate()}
              onChange={(e) => {
                setAttendanceDate(e.target.value);
                setShowTable(false);
              }}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Manage Attendance Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleManageAttendance}
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                لوډ کول...
              </>
            ) : (
              <>
                {attendanceMethod === "QR" ? (
                  <QrCode className="size-5" />
                ) : (
                  <UserCog className="size-5" />
                )}
                د حاضرۍ مدیریت
              </>
            )}
          </button>
        </div>
        {attendanceMethod === "QR" && (
          <div className="flex justify-center pt-1">
            <span className="text-xs text-muted-foreground">
              QR Scanner Active: Camera {showQRScanner ? "ON" : "READY"} | USB{" "}
              {usbScannerActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      {showTable && staff.length > 0 && (
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <UserCog className="size-4" />
                <span className="text-xs">ټول</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-success mb-1">
                <CheckCircle2 className="size-4" />
                <span className="text-xs">حاضر</span>
              </div>
              <p className="text-2xl font-bold text-success">{stats.present}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <XCircle className="size-4" />
                <span className="text-xs">غیر حاضر</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-warning mb-1">
                <Timer className="size-4" />
                <span className="text-xs">رخصتي</span>
              </div>
              <p className="text-2xl font-bold text-warning">{stats.leave}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="size-4" />
                <span className="text-xs">نامعلوم</span>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">{stats.undefined}</p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="د نوم، پلار نوم، دنده یا ID لټون..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-10 pl-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">ټولو لپاره:</span>
                <button
                  onClick={() => handleBulkAction("Present")}
                  className="px-3 py-1.5 bg-success text-success-foreground rounded text-xs font-medium hover:opacity-90"
                >
                  حاضر
                </button>
                <button
                  onClick={() => handleBulkAction("Absent")}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded text-xs font-medium hover:opacity-90"
                >
                  غیر حاضر
                </button>
                <button
                  onClick={() => handleBulkAction("Leave")}
                  className="px-3 py-1.5 bg-warning text-warning-foreground rounded text-xs font-medium hover:opacity-90"
                >
                  رخصتي
                </button>
                <button
                  onClick={() => handleBulkAction(null)}
                  className="px-3 py-1.5 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/80"
                >
                  پاک
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-4 py-2 bg-success text-success-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin"></div>
                    ثبتول...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    حاضرۍ ثبت کړئ
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">#</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">ID</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">د کارمند نوم</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">د پلار نوم</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">دنده</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">حاضرۍ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                        <UserCog className="size-12 mx-auto mb-2 opacity-50" />
                        <p>هیڅ کارمند ونه موندل شو</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staffMember, index) => {
                      const globalIndex = startIndex + index + 1;
                      const rowKey = personKey(staffMember);
                      const status = attendanceData[rowKey];
                      
                      return (
                        <tr
                          key={rowKey}
                          className={cn(
                            "border-b border-border hover:bg-muted/50 transition-colors",
                            index % 2 === 0 ? "bg-background" : "bg-muted/20"
                          )}
                        >
                          <td className="px-4 py-3 text-sm text-muted-foreground">{globalIndex}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="text-xs text-muted-foreground">
                              #{staffMember.id}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {staffMember.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {staffMember.fatherName}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {staffMember.position}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusChange(rowKey, option.value)}
                                  className={cn(
                                    "px-3 py-1.5 rounded text-xs font-medium transition-all border",
                                    status === option.value
                                      ? option.color
                                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                                  )}
                                >
                                  {option.label}
                                </button>
                              ))}
                              <button
                                onClick={() => handleStatusChange(rowKey, null)}
                                className={cn(
                                  "px-2 py-1.5 rounded text-xs font-medium transition-all border",
                                  status === null || status === undefined
                                    ? "bg-muted text-muted-foreground border-muted-foreground"
                                    : "bg-background text-muted-foreground border-input hover:bg-muted"
                                )}
                                title="پاک کول"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-input rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                پخوانی
              </button>
              
              <span className="text-sm text-muted-foreground">
                پاڼه {currentPage} د {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-input rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                راتلونکی
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRAttendanceScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        attendanceDate={attendanceDate}
        onlineStatus={isOnline}
      />

      {/* Download Report Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Download className="size-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">د حاضرۍ راپور ډاونلوډ</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Period */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              د راپور موده
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {REPORT_PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              د پیل نېټه
            </label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              د پای نېټه
            </label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloadingExcel}
            className="px-6 py-3 bg-success text-success-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloadingExcel ? (
              <>
                <div className="w-5 h-5 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin"></div>
                ډاونلوډ کول...
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-5" />
                Excel ډاونلوډ
              </>
            )}
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloadingPdf}
            className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloadingPdf ? (
              <>
                <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin"></div>
                ډاونلوډ کول...
              </>
            ) : (
              <>
                <FileText className="size-5" />
                PDF ډاونلوډ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-warning text-warning-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span className="text-sm font-medium">آفلاین حالت</span>
        </div>
      )}
    </div>
  );
}

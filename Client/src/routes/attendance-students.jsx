import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { QRAttendanceScanner } from "@/components/erp/QRAttendanceScanner";
import { 
  Users, Calendar, QrCode, Check, X, Clock, 
  CheckCircle2, XCircle, Timer, AlertCircle, Search, Download, FileSpreadsheet
} from "lucide-react";
import { currentShamsiYear, todayAfghan } from "@/lib/afghan-date";
import * as attendanceApi from "@/data/attendanceApi";
import { getAllClasses } from "@/data/classApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ATTENDANCE_METHODS = [
  { value: "Manual", label: "لاسي" },
  { value: "QR", label: "QR کوډ" },
];

const INSTITUTION_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
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

export default function StudentAttendance() {
  // Form states
  const [attendanceMethod, setAttendanceMethod] = useState("Manual");
  const [institutionType, setInstitutionType] = useState("School");
  const [classId, setClassId] = useState("");
  const [serverToday, setServerToday] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  
  // Download states
  const [downloadInstitutionType, setDownloadInstitutionType] = useState("School");
  const [downloadClassId, setDownloadClassId] = useState("");
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  
  // Data states
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
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

  const loadServerToday = async () => {
    try {
      const response = await attendanceApi.getServerToday();
      const today = response.data?.today;
      if (today) {
        setServerToday(today);
        setAttendanceDate((prev) => (!prev || prev === serverToday ? today : prev));
        setReportStartDate((prev) => (!prev || prev === serverToday ? today : prev));
        setReportEndDate((prev) => (!prev || prev === serverToday ? today : prev));
      }
    } catch {
      toast.error("د سرور نېټه ترلاسه نه شوه");
    }
  };

  const prevServerTodayRef = useRef("");

  useEffect(() => {
    loadServerToday();
    const interval = setInterval(loadServerToday, 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!serverToday) return;
    if (prevServerTodayRef.current && prevServerTodayRef.current !== serverToday) {
      setShowTable(false);
      setStudents([]);
      setAttendanceData({});
      setAttendanceDate(serverToday);
    }
    prevServerTodayRef.current = serverToday;
  }, [serverToday]);

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

  // Load classes when institution type changes
  useEffect(() => {
    loadClasses();
  }, [institutionType]);

  const loadClasses = async () => {
    try {
      const response = await getAllClasses({
        type: institutionType,
        academicYear: currentShamsiYear(),
      });
      
      if (response.success) {
        setClasses(response.data.classes || []);
        setClassId("");
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("د ټولګیو د لوډولو کې ستونزه");
    }
  };

  const handleManageAttendance = async () => {
    if (!classId) {
      toast.error("مهرباني وکړئ ټولګی غوره کړئ");
      return;
    }

    if (attendanceMethod === "QR") {
      setShowQRScanner(true);
      return;
    }

    // Load students for manual attendance
    setLoading(true);
    try {
      const response = await attendanceApi.getPeopleForAttendance({
        attendanceType: "Student",
        institutionType,
        classId,
        attendanceDate,
      });
      
      if (response.success) {
        setStudents(response.data.people || []);
        
        // Build attendance data from existing records
        const attendanceMap = {};
        response.data.people.forEach(student => {
          if (student.attendance && student.attendance.status !== null) {
            attendanceMap[student.id] = student.attendance.status;
          }
        });
        setAttendanceData(attendanceMap);
        setShowTable(true);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("د زده کوونکو د لوډولو کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBulkAction = (status) => {
    const newData = { ...attendanceData };
    filteredStudents.forEach(student => {
      newData[student.id] = status;
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
      const attendanceArray = Object.entries(attendanceData).map(([personId, status]) => ({
        personId: parseInt(personId),
        status: status,
      }));

      const response = await attendanceApi.bulkCreateAttendance({
        attendanceType: "Student",
        institutionType,
        classId: parseInt(classId),
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

  // Filter and paginate students
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.fullName?.toLowerCase().includes(search) ||
      student.fatherName?.toLowerCase().includes(search) ||
      student.rollNumber?.toLowerCase().includes(search) ||
      student.id?.toString().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter(s => s === "Present").length,
    absent: Object.values(attendanceData).filter(s => s === "Absent").length,
    leave: Object.values(attendanceData).filter(s => s === "Leave").length,
  };
  stats.undefined = stats.total - stats.present - stats.absent - stats.leave;

  // Handle report period change
  useEffect(() => {
    if (!serverToday) return;
    const today = serverToday;
    if (reportPeriod === "daily") {
      setReportStartDate(today);
      setReportEndDate(today);
    } else if (reportPeriod === "monthly") {
      const [y, m] = today.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      setReportStartDate(`${y}-${String(m).padStart(2, "0")}-01`);
      setReportEndDate(`${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`);
    } else if (reportPeriod === "yearly") {
      const y = today.split("-")[0];
      setReportStartDate(`${y}-01-01`);
      setReportEndDate(`${y}-12-31`);
    }
  }, [reportPeriod, serverToday]);

  // Download handler - Excel only
  const handleDownloadExcel = async () => {
    if (!downloadClassId) {
      toast.error("مهرباني وکړئ ټولګی غوره کړئ");
      return;
    }

    setDownloadingExcel(true);
    try {
      const params = {
        attendanceType: "Student",
        institutionType: downloadInstitutionType,
        classId: downloadClassId,
        startDate: reportStartDate,
        endDate: reportEndDate,
        format: 'excel',
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
      link.download = `attendance_${reportStartDate}_${reportEndDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("د Excel فایل بریالۍ ډاونلوډ شو");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("د ډاونلوډ کې ستونزه");
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="د زده کوونکو حاضري" 
        subtitle={`د ${currentShamsiYear()} تعلیمي کال • ${todayAfghan()}`}
      />

      {/* Selection Form */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">د حاضرۍ معلومات</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Institution Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              د ادارې ډول
            </label>
            <select
              value={institutionType}
              onChange={(e) => {
                setInstitutionType(e.target.value);
                setShowTable(false);
              }}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {INSTITUTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ټولګی
            </label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setShowTable(false);
              }}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">ټولګی غوره کړئ</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- ${cls.section}`}
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
              max={serverToday || undefined}
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
            disabled={!classId || loading}
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
                  <Users className="size-5" />
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
      {showTable && students.length > 0 && (
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="size-4" />
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
                  placeholder="د نوم، پلار نوم یا ID لټون..."
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

          {/* Students Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">#</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">ID</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">د زده کوونکي نوم</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">د پلار نوم</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">حاضرۍ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                        <Users className="size-12 mx-auto mb-2 opacity-50" />
                        <p>هیڅ زده کوونکی ونه موندل شو</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, index) => {
                      const globalIndex = startIndex + index + 1;
                      const status = attendanceData[student.id];
                      
                      return (
                        <tr
                          key={student.id}
                          className={cn(
                            "border-b border-border hover:bg-muted/50 transition-colors",
                            index % 2 === 0 ? "bg-background" : "bg-muted/20"
                          )}
                        >
                          <td className="px-4 py-3 text-sm text-muted-foreground">{globalIndex}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="text-xs text-muted-foreground">
                              {student.rollNumber || `#${student.id}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {student.fullName}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {student.fatherName}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusChange(student.id, option.value)}
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
                                onClick={() => handleStatusChange(student.id, null)}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Institution Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              د ادارې ډول
            </label>
            <select
              value={downloadInstitutionType}
              onChange={(e) => {
                setDownloadInstitutionType(e.target.value);
                setDownloadClassId("");
              }}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {INSTITUTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ټولګی
            </label>
            <select
              value={downloadClassId}
              onChange={(e) => setDownloadClassId(e.target.value)}
              className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">ټولګی غوره کړئ</option>
              {classes
                .filter(c => c.type === downloadInstitutionType)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.section}
                  </option>
                ))}
            </select>
          </div>

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

          {/* Custom Date Range (shown when needed) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              نېټه
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="flex-1 border border-input rounded px-2 py-2 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="flex-1 border border-input rounded px-2 py-2 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Download Button - Excel Only */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel || !downloadClassId}
            className="px-8 py-3 bg-success text-success-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {downloadingExcel ? (
              <>
                <div className="w-5 h-5 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin"></div>
                ډاونلوډ کول...
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-5" />
                Excel راپور ډاونلوډ
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

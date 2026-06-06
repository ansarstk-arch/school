import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { ErpLoader } from "@/components/erp/ErpLoader";
import { Input } from "@/components/ui/Input";
import { useStore } from "@/store/useStore";
import { currentShamsiYear, todayAfghan } from "@/lib/afghan-date";
import * as teacherApi from "@/data/teacherApi";
import * as attendanceApi from "@/data/attendanceApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  GraduationCap, KeyRound, CalendarCheck, CheckCircle2,
  Clock, AlertCircle, Users, Search, Check, BookOpen, ChevronRight,
} from "lucide-react";

const INSTITUTION_LABELS = {
  School: "ښوونځی",
  Center: "مرکز",
  Madrasa: "مدرسه",
};

const STATUS_OPTIONS = [
  { value: "Present", label: "حاضر", short: "ح", color: "bg-success text-success-foreground" },
  { value: "Absent", label: "غیر حاضر", short: "غ", color: "bg-destructive text-destructive-foreground" },
  { value: "Leave", label: "رخصتي", short: "ر", color: "bg-warning text-warning-foreground" },
];

const getInitials = (name) => {
  if (!name) return "ښ";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

function StatPill({ label, value, className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/40 px-3 py-2 text-center", className)}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function AttendanceButtons({ studentId, attendanceData, isReadOnly, isMobile, onChange }) {
  return (
    <div className={cn("gap-2", isMobile ? "grid grid-cols-3" : "flex flex-wrap")}>
      {STATUS_OPTIONS.map((opt) => {
        const active = attendanceData[studentId] === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isReadOnly}
            onClick={() => onChange(studentId, active ? null : opt.value)}
            className={cn(
              "rounded-lg font-medium transition-all touch-manipulation",
              isMobile ? "py-3 text-sm min-h-[44px]" : "px-2.5 py-1.5 text-xs",
              active ? opt.color : "bg-muted text-muted-foreground",
              isReadOnly && "opacity-60 cursor-not-allowed"
            )}
          >
            {isMobile ? opt.label : opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function TeacherDashboard() {
  const isMobile = useIsMobile();
  const { user, changePassword } = useStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverToday, setServerToday] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");

  const [selectedClass, setSelectedClass] = useState(null);
  const [classData, setClassData] = useState(null);
  const [classLoading, setClassLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getMyTeacherDashboard(attendanceDate);
      setDashboard(response.data);
    } catch (error) {
      toast.error(error.message || "د ډیشبورډ په لوډولو کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadServerToday = async () => {
      try {
        const response = await attendanceApi.getServerToday();
        const today = response.data?.today;
        if (today) {
          setServerToday(today);
          setAttendanceDate((prev) => (!prev || prev === serverToday ? today : prev));
        }
      } catch {
        toast.error("د سرور نېټه ترلاسه نه شوه");
      }
    };
    loadServerToday();
    const interval = setInterval(loadServerToday, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!attendanceDate) return;
    loadDashboard();
  }, [attendanceDate]);

  const loadClassAttendance = async (cls) => {
    setSelectedClass(cls);
    setClassLoading(true);
    setSearchTerm("");
    try {
      const response = await teacherApi.getMyClassAttendance(cls.id, attendanceDate);
      const data = response.data;
      setClassData(data);
      setStudents(data.people || []);

      const map = {};
      (data.people || []).forEach((s) => {
        if (s.attendance?.status) map[s.id] = s.attendance.status;
      });
      setAttendanceData(map);
    } catch (error) {
      toast.error(error.message || "د ټولګي معلومات ترلاسه نه شول");
      setSelectedClass(null);
    } finally {
      setClassLoading(false);
    }
  };

  const clearSelectedClass = () => {
    setSelectedClass(null);
    setClassData(null);
    setStudents([]);
    setAttendanceData({});
    setSearchTerm("");
  };

  const handleStatusChange = (studentId, status) => {
    if (classData?.isReadOnly) return;
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.fatherName?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  const handleBulkAction = (status) => {
    if (classData?.isReadOnly) return;
    const newData = { ...attendanceData };
    filteredStudents.forEach((s) => { newData[s.id] = status; });
    setAttendanceData(newData);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || classData?.isReadOnly) return;

    const marked = Object.entries(attendanceData).filter(([, status]) => status);
    if (marked.length === 0) {
      toast.error("لږ تر لږه یو زده کوونکي حاضري وټاکئ");
      return;
    }

    setSaving(true);
    try {
      const attendanceArray = marked.map(([personId, status]) => ({
        personId: parseInt(personId, 10),
        status,
      }));

      await teacherApi.submitTeacherClassAttendance({
        classId: selectedClass.id,
        attendanceDate,
        attendanceData: attendanceArray,
      });

      toast.success("حاضرۍ بریالۍ ثبت شوه");
      await loadDashboard();
      await loadClassAttendance(selectedClass);
    } catch (error) {
      toast.error(error.message || "د حاضرۍ په ثبتولو کې ستونزه");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = {};
    if (!pw.currentPassword) errors.currentPassword = "اوسنی پاسورډ اړین دی";
    if (!pw.newPassword) errors.newPassword = "نوی پاسورډ اړین دی";
    else if (pw.newPassword.length < 6) errors.newPassword = "نوی پاسورډ باید لږ تر لږه ۶ توري ولري";
    if (!pw.confirm) errors.confirm = "د تایید برخه اړینه ده";
    else if (pw.newPassword !== pw.confirm) errors.confirm = "نوی پاسورډ او تایید سره سم نه دي";
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }
    setPwErrors({});
    setPwLoading(true);
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success("پاسورډ بدل شو");
      setPwOpen(false);
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      setPwErrors({});
    } catch (error) {
      const msg = error.message || "د پاسورډ بدلولو کې تېروتنه";
      if (msg.includes("اوسنی") || msg.includes("پخوانی") || msg.includes("ناسم")) {
        setPwErrors({ currentPassword: msg });
      } else if (msg.includes("نوی")) {
        setPwErrors({ newPassword: msg });
      } else {
        setPwErrors({ _form: msg });
      }
    } finally {
      setPwLoading(false);
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter((s) => s === "Present").length,
    absent: Object.values(attendanceData).filter((s) => s === "Absent").length,
    leave: Object.values(attendanceData).filter((s) => s === "Leave").length,
  };

  const teacher = dashboard?.teacher;
  const classes = dashboard?.assignedClassDetails || [];
  const showStickySave = isMobile && selectedClass && !classData?.isReadOnly && !classLoading;

  const statusBadge = (status) => {
    if (status === "completed") return <Badge variant="success">ثبت شوې</Badge>;
    if (status === "taken_by_other") return <Badge variant="warning">دمخه ثبت شوې</Badge>;
    return <Badge variant="muted">پاتې</Badge>;
  };

  return (
    <div className={cn("space-y-4 sm:space-y-6", showStickySave && "pb-24")}>
      <PageHeader
        title="د ښوونکي ډیشبورډ"
        subtitle={`د ${currentShamsiYear()} تعلیمي کال • ${todayAfghan()}`}
      />

      {loading ? (
        <div className="flex justify-center py-16"><ErpLoader /></div>
      ) : (
        <>
          {/* Profile */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0">
                  {teacher?.imageUrl ? (
                    <img
                      src={teacher.imageUrl}
                      alt={teacher.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl sm:text-2xl font-bold border-2 border-primary/20">
                      {getInitials(teacher?.name || user?.name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                    {teacher?.name || user?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                    <GraduationCap className="size-3.5 shrink-0" />
                    ښوونکی
                  </p>
                  <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-sm mt-2" dir="ltr">
                    <span className="text-muted-foreground text-xs">کارن نوم:</span>
                    <span className="font-medium truncate">{teacher?.username || user?.username || "—"}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setPwOpen(true); setPwErrors({}); }}
                className="w-full sm:w-auto sm:self-start inline-flex items-center justify-center gap-2 text-sm border border-input rounded-md px-4 py-2.5 min-h-[44px] hover:bg-muted touch-manipulation"
              >
                <KeyRound className="size-4" />
                پاسورډ بدلول
              </button>
            </div>
          </div>

          {/* Class selection — hide on mobile when taking attendance */}
          <div className={cn(
            "bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4",
            isMobile && selectedClass && "hidden"
          )}>
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <CalendarCheck className="size-5 shrink-0" />
                  د حاضرۍ ټولګي
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  هر ټولګي حاضري په ورځ کې یو ځل
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-muted-foreground shrink-0">نېټه:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  max={serverToday || undefined}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    clearSelectedClass();
                  }}
                  className="flex-1 sm:flex-none border border-input rounded-md px-3 py-2.5 min-h-[44px] bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring touch-manipulation"
                  dir="ltr"
                />
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="size-10 mx-auto mb-2 opacity-40" />
                <p>تاسو ته لا هیڅ ټولګی نه دی ورکړل شوی</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => loadClassAttendance(cls)}
                    className="text-right p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/50 active:scale-[0.98] transition-all min-h-[88px] touch-manipulation"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground leading-snug">
                          {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {INSTITUTION_LABELS[cls.type] || cls.type}
                        </p>
                      </div>
                      {cls.attendanceStatus === "completed" ? (
                        <CheckCircle2 className="size-5 text-success shrink-0" />
                      ) : cls.attendanceStatus === "taken_by_other" ? (
                        <AlertCircle className="size-5 text-warning shrink-0" />
                      ) : (
                        <Clock className="size-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {statusBadge(cls.attendanceStatus)}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attendance panel */}
          {selectedClass && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {isMobile && (
                <button
                  type="button"
                  onClick={clearSelectedClass}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary border-b border-border hover:bg-muted/50 touch-manipulation min-h-[44px]"
                >
                  <ChevronRight className="size-4 rotate-180" />
                  بیرته ټولګیو ته
                </button>
              )}

              {classLoading ? (
                <div className="flex justify-center py-12"><ErpLoader /></div>
              ) : (
                <>
                  <div className="p-4 border-b border-border space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-base sm:text-lg">
                        {selectedClass.name}{selectedClass.section ? ` - ${selectedClass.section}` : ""}
                      </h3>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" />
                          {students.length} زده کوونکي
                        </span>
                        {classData?.isReadOnly && (
                          <Badge variant={classData.attendanceStatus === "completed" ? "success" : "warning"}>
                            {classData.attendanceStatus === "completed" ? "ثبت شوې" : "دمخه ثبت شوې"}
                          </Badge>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <StatPill label="ټول" value={stats.total} />
                      <StatPill label="حاضر" value={stats.present} className="text-success" />
                      <StatPill label="غیر حاضر" value={stats.absent} className="text-destructive" />
                      <StatPill label="رخصتي" value={stats.leave} className="text-warning" />
                    </div>

                    {!classData?.isReadOnly && (
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          onClick={() => handleBulkAction("Present")}
                          className="text-sm px-3 py-2.5 min-h-[44px] rounded-lg bg-success/10 text-success hover:bg-success/20 touch-manipulation"
                        >
                          ټول حاضر
                        </button>
                        <button
                          onClick={() => handleBulkAction("Absent")}
                          className="text-sm px-3 py-2.5 min-h-[44px] rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 touch-manipulation"
                        >
                          ټول غیر حاضر
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="نوم، د پلار نوم، رول نمبر..."
                        className="w-full pr-10 pl-3 py-2.5 min-h-[44px] text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Mobile: card list */}
                  <div className="md:hidden divide-y divide-border">
                    {filteredStudents.length === 0 ? (
                      <p className="px-4 py-10 text-center text-muted-foreground text-sm">زده کوونکی ونه موندل شو</p>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <div key={student.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground leading-snug">{student.fullName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{student.fatherName}</p>
                              {student.rollNumber && (
                                <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">رول: {student.rollNumber}</p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                              {idx + 1}
                            </span>
                          </div>
                          <AttendanceButtons
                            studentId={student.id}
                            attendanceData={attendanceData}
                            isReadOnly={classData?.isReadOnly}
                            isMobile
                            onChange={handleStatusChange}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">#</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">رول نمبر</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">نوم</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">د پلار نوم</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">حاضري</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              زده کوونکی ونه موندل شو
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student, idx) => (
                            <tr key={student.id} className="hover:bg-muted/30">
                              <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                              <td className="px-4 py-2.5" dir="ltr">{student.rollNumber || "—"}</td>
                              <td className="px-4 py-2.5 font-medium">{student.fullName}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{student.fatherName}</td>
                              <td className="px-4 py-2.5">
                                <AttendanceButtons
                                  studentId={student.id}
                                  attendanceData={attendanceData}
                                  isReadOnly={classData?.isReadOnly}
                                  isMobile={false}
                                  onChange={handleStatusChange}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!classData?.isReadOnly && !isMobile && (
                    <div className="p-4 border-t border-border flex justify-end">
                      <button
                        onClick={handleSaveAttendance}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 min-h-[40px]"
                      >
                        {saving ? "په ثبتیدو کې..." : (
                          <>
                            <Check className="size-4" />
                            حاضري ثبتول
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile sticky save */}
      {showStickySave && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-card/95 backdrop-blur border-t border-border safe-area-bottom">
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 touch-manipulation min-h-[48px]"
          >
            {saving ? "په ثبتیدو کې..." : (
              <>
                <Check className="size-5" />
                حاضري ثبتول
              </>
            )}
          </button>
        </div>
      )}

      <ErpModal
        open={pwOpen}
        onOpenChange={setPwOpen}
        title="پاسورډ بدلول"
        size="sm"
        footer={
          <>
            <button onClick={() => setPwOpen(false)} disabled={pwLoading} className="px-3 py-2 min-h-[40px] text-sm border border-input rounded hover:bg-muted disabled:opacity-50 touch-manipulation">لغوه</button>
            <button onClick={handleChangePassword} disabled={pwLoading} className="px-3 py-2 min-h-[40px] text-sm bg-primary text-primary-foreground rounded disabled:opacity-50 touch-manipulation">
              {pwLoading ? "په پروسس کې..." : "ساتل"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {pwErrors._form && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">{pwErrors._form}</p>}
          <div>
            <Input type="password" label="اوسنی پاسورډ" value={pw.currentPassword} handleChanges={(e) => { setPw((p) => ({ ...p, currentPassword: e.target.value })); if (pwErrors.currentPassword) setPwErrors((er) => ({ ...er, currentPassword: "" })); }} disabled={pwLoading} />
            {pwErrors.currentPassword && <p className="text-xs text-destructive mt-1">{pwErrors.currentPassword}</p>}
          </div>
          <div>
            <Input type="password" label="نوی پاسورډ" value={pw.newPassword} handleChanges={(e) => { setPw((p) => ({ ...p, newPassword: e.target.value })); if (pwErrors.newPassword) setPwErrors((er) => ({ ...er, newPassword: "" })); }} disabled={pwLoading} />
            {pwErrors.newPassword && <p className="text-xs text-destructive mt-1">{pwErrors.newPassword}</p>}
          </div>
          <div>
            <Input type="password" label="تایید" value={pw.confirm} handleChanges={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); if (pwErrors.confirm) setPwErrors((er) => ({ ...er, confirm: "" })); }} disabled={pwLoading} />
            {pwErrors.confirm && <p className="text-xs text-destructive mt-1">{pwErrors.confirm}</p>}
          </div>
        </div>
      </ErpModal>
    </div>
  );
}

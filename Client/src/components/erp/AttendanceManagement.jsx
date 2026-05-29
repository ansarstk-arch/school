import { useState, useEffect, useMemo } from "react";
import { Badge } from "./Badge";
import { Input } from "@/components/ui/Input";
import { Check, X, Clock, Search, Users, UserCheck, UserX, CheckCircle2, XCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "Present", label: "حاضر", icon: UserCheck, variant: "success" },
  { value: "Absent", label: "غیر حاضر", icon: UserX, variant: "destructive" },
  { value: "Leave", label: "رخصتي", icon: Timer, variant: "warning" },
];

const AttendanceRow = ({ person, status, onStatusChange, attendanceType, index }) => {
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status);

  return (
    <tr className={cn(
      "border-b border-border hover:bg-muted/50 transition-colors",
      index % 2 === 0 ? "bg-background" : "bg-muted/20"
    )}>
      {/* Serial Number */}
      <td className="px-3 py-2 text-center text-sm font-medium text-muted-foreground">
        {index + 1}
      </td>

      {/* ID/Roll Number */}
      <td className="px-3 py-2 text-sm">
        {attendanceType === "Student" ? (
          <Badge variant="muted" className="text-xs">
            {person.rollNumber || person.id}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">#{person.id}</span>
        )}
      </td>

      {/* Name */}
      <td className="px-3 py-2">
        <div className="font-medium text-sm text-foreground">
          {person.name || person.fullName}
        </div>
      </td>

      {/* Father Name */}
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {person.fatherName}
      </td>

      {/* Additional Info */}
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {attendanceType === "Student" && person.classId && (
          <span>ټولګی: {person.classId}</span>
        )}
        {attendanceType === "Staff" && person.position && (
          <span>دنده: {person.position}</span>
        )}
      </td>

      {/* Status Buttons */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = status === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => onStatusChange(person.id, option.value)}
                className={cn(
                  "p-1.5 rounded border transition-all text-xs font-medium min-w-[60px] flex items-center justify-center gap-1",
                  isSelected
                    ? option.variant === "success"
                      ? "bg-success text-success-foreground border-success"
                      : option.variant === "destructive"
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-warning text-warning-foreground border-warning"
                    : "bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground"
                )}
                title={option.label}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            );
          })}
          
          {/* Clear/Undefined Button */}
          <button
            onClick={() => onStatusChange(person.id, null)}
            className={cn(
              "p-1.5 rounded border transition-all text-xs font-medium min-w-[60px] flex items-center justify-center gap-1",
              status === null || status === undefined
                ? "bg-muted text-muted-foreground border-muted-foreground"
                : "bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground"
            )}
            title="پاک کول"
          >
            <X className="size-3" />
            <span className="hidden sm:inline">پاک</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

const AttendanceTable = ({ 
  people, 
  attendanceData, 
  onStatusChange, 
  attendanceType,
  currentPage,
  itemsPerPage 
}) => {
  const [search, setSearch] = useState("");

  const filteredPeople = useMemo(() => {
    if (!search) return people;
    const searchLower = search.toLowerCase();
    return people.filter(person => 
      (person.name || person.fullName)?.toLowerCase().includes(searchLower) ||
      person.fatherName?.toLowerCase().includes(searchLower) ||
      person.rollNumber?.toLowerCase().includes(searchLower) ||
      person.id?.toString().includes(searchLower)
    );
  }, [people, search]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeople = filteredPeople.slice(startIndex, endIndex);

  // Stats
  const stats = useMemo(() => {
    const present = Object.values(attendanceData).filter(s => s === "Present").length;
    const absent = Object.values(attendanceData).filter(s => s === "Absent").length;
    const leave = Object.values(attendanceData).filter(s => s === "Leave").length;
    const undefined = people.length - present - absent - leave;
    
    return { present, absent, leave, undefined, total: people.length };
  }, [attendanceData, people.length]);

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="د نوم، پلار نوم یا ID لټون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>ټول: {stats.total}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-4 text-success" />
            <span>حاضر: {stats.present}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="size-4 text-destructive" />
            <span>غیر حاضر: {stats.absent}</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="size-4 text-warning" />
            <span>رخصتي: {stats.leave}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-4 text-muted-foreground" />
            <span>نامعلوم: {stats.undefined}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  نوم
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  د پلار نوم
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  معلومات
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  حاضرۍ
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPeople.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    <Users className="size-12 mx-auto mb-2 opacity-50" />
                    <p>هیڅ کس ونه موندل شو</p>
                  </td>
                </tr>
              ) : (
                paginatedPeople.map((person, index) => (
                  <AttendanceRow
                    key={person.id}
                    person={person}
                    status={attendanceData[person.id]}
                    onStatusChange={onStatusChange}
                    attendanceType={attendanceType}
                    index={startIndex + index}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      {filteredPeople.length > itemsPerPage && (
        <div className="text-sm text-muted-foreground text-center">
          د {startIndex + 1} څخه {Math.min(endIndex, filteredPeople.length)} پورې، ټول {filteredPeople.length}
        </div>
      )}
    </div>
  );
};

export function AttendanceManagement({ 
  people = [], 
  attendanceData = {}, 
  onStatusChange, 
  attendanceType = "Student",
  loading = false,
  currentPage = 1,
  itemsPerPage = 30,
  onBulkAction
}) {
  const [localAttendanceData, setLocalAttendanceData] = useState(attendanceData);

  useEffect(() => {
    setLocalAttendanceData(attendanceData);
  }, [attendanceData]);

  const handleStatusChange = (personId, status) => {
    const newData = { ...localAttendanceData, [personId]: status };
    setLocalAttendanceData(newData);
    onStatusChange?.(newData);
  };

  const handleBulkAction = (action) => {
    const newData = { ...localAttendanceData };
    people.forEach(person => {
      newData[person.id] = action === "clear" ? null : action;
    });
    setLocalAttendanceData(newData);
    onStatusChange?.(newData);
    onBulkAction?.(action);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="flex gap-1">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-8 w-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Buttons */}
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border">
        <span className="text-sm font-medium text-muted-foreground mr-2">ټولو لپاره:</span>
        <button
          onClick={() => handleBulkAction("Present")}
          className="px-3 py-1.5 bg-success text-success-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <UserCheck className="size-3 inline mr-1" />
          ټول حاضر
        </button>
        <button
          onClick={() => handleBulkAction("Absent")}
          className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <UserX className="size-3 inline mr-1" />
          ټول غیر حاضر
        </button>
        <button
          onClick={() => handleBulkAction("Leave")}
          className="px-3 py-1.5 bg-warning text-warning-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Timer className="size-3 inline mr-1" />
          ټول رخصتي
        </button>
        <button
          onClick={() => handleBulkAction("clear")}
          className="px-3 py-1.5 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors"
        >
          <X className="size-3 inline mr-1" />
          ټول پاک
        </button>
      </div>

      {/* Attendance Table */}
      <AttendanceTable
        people={people}
        attendanceData={localAttendanceData}
        onStatusChange={handleStatusChange}
        attendanceType={attendanceType}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}

export default AttendanceManagement;
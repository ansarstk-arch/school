import { PageHeader } from "@/components/erp/PageHeader";
import { FilterBar } from "@/components/erp/FilterBar";
import { ErpModal } from "@/components/erp/ErpModal";
import IdCardPreview from "@/components/erp/IdCardPreview";
import IdCardGenerator from "@/components/erp/IdCardGenerator";
import TeacherIDCard from "@/components/erp/TeacherIDCard";
import StaffIDCard from "@/components/erp/StaffIDCard";
import * as teacherApi from "@/data/teacherApi";
import * as staffApi from "@/data/staffApi";
import { Download, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as studentApi from "@/data/studentApi";
import { getAllClasses } from "@/data/classApi";
import { generateSingleCardPDF, generateMultipleCardsPDF } from "@/utils/idCardPdf";
import { toast } from "sonner";

const ENROLL_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

// API function to get classes by type and year
const getClassesByTypeAndYear = async (type, academicYear) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/students/classes-by-type?type=${type}&academicYear=${academicYear}`);
  if (!response.ok) throw new Error('Failed to fetch classes');
  return response.json();
};

const normalizeUploadPath = (image, uploadFolder) => {
  if (!image) return null;
  const trimmed = String(image).trim();
  if (!trimmed) return null;
  if (/^(https?:)?\/\//.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('uploads/')) return `/${trimmed}`;
  return `${uploadFolder}/${trimmed}`;
};

// Generate year options (current year ± 5 years)
const generateYearOptions = () => {
  const currentYear = currentShamsiYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
};

import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";

// ─── Custom ID Card Filter Component ──────────────────────────────────────────
function IdCardFilterBar({ activeTab, onApply, onClear }) {
  const [filters, setFilters] = useState({ academicYear: String(currentShamsiYear()) });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Clear class filter when type or year changes (only for students)
    if (activeTab === "students" && (key === 'enrollmentType' || key === 'academicYear')) {
      delete newFilters.classId;
      setAvailableClasses([]);
    }
    
    setFilters(newFilters);
  };

  // Fetch classes when type and year are selected (only for students)
  useEffect(() => {
    const fetchClasses = async () => {
      if (activeTab === "students" && filters.enrollmentType && filters.academicYear) {
        try {
          setLoadingClasses(true);
          const response = await getClassesByTypeAndYear(filters.enrollmentType, filters.academicYear);
          setAvailableClasses(response.data.classes || []);
        } catch (error) {
          console.error('Error fetching classes:', error);
          setAvailableClasses([]);
        } finally {
          setLoadingClasses(false);
        }
      }
    };

    fetchClasses();
  }, [activeTab, filters.enrollmentType, filters.academicYear]);

  // Reset filters when tab changes
  useEffect(() => {
    const defaultFilters = activeTab === "students" ? { academicYear: String(currentShamsiYear()) } : {};
    setFilters(defaultFilters);
    setAvailableClasses([]);
  }, [activeTab]);

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    const defaultFilters = activeTab === "students" ? { academicYear: String(currentShamsiYear()) } : {};
    setFilters(defaultFilters);
    setAvailableClasses([]);
    onClear();
  };

  const hasFilters = Object.keys(filters).length > (activeTab === "students" ? 1 : 0); // Students have default academicYear

  return (
    <div className="bg-card border rounded-md p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">فلټر:</span>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {/* ID field - for all tabs */}
          <input
            type="number"
            placeholder="ID"
            value={filters.id || ''}
            onChange={(e) => updateFilter('id', e.target.value)}
            className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          
          {/* Name field - different for each tab */}
          <input
            type="text"
            placeholder={
              activeTab === "students" ? "د زده کوونکي نوم..." :
              activeTab === "teachers" ? "د ښوونکي نوم..." : "د کارمند نوم..."
            }
            value={filters.fullName || filters.name || ''}
            onChange={(e) => updateFilter(activeTab === "students" ? 'fullName' : 'name', e.target.value)}
            className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          
          {/* Type field - only for students and teachers */}
          {(activeTab === "students" || activeTab === "teachers") && (
            <select
              value={filters.enrollmentType || filters.teacherType || ''}
              onChange={(e) => updateFilter(activeTab === "students" ? 'enrollmentType' : 'teacherType', e.target.value)}
              className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">ډول</option>
              {ENROLL_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
          
          {/* Academic Year - only for students - Using ShamsiYearPicker */}
          {activeTab === "students" && (
            <div className="min-w-[140px]">
              <ShamsiYearPicker
                value={filters.academicYear || ''}
                onChange={(year) => updateFilter('academicYear', year)}
                placeholder="تعلیمي کال"
              />
            </div>
          )}
          
          {/* Joining Year - for teachers and staff - Using ShamsiYearPicker */}
          {(activeTab === "teachers" || activeTab === "staff") && (
            <div className="min-w-[140px]">
              <ShamsiYearPicker
                value={filters.joiningYear || ''}
                onChange={(year) => updateFilter('joiningYear', year)}
                placeholder="د شاملیدو کال"
              />
            </div>
          )}
        </div>
      </div>

      {/* Class Selection - Only show for students when type and year are selected */}
      {activeTab === "students" && filters.enrollmentType && filters.academicYear && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">ټولګی:</span>
          <div className="flex-1">
            <select
              value={filters.classId || ''}
              onChange={(e) => updateFilter('classId', e.target.value)}
              disabled={loadingClasses}
              className="text-xs border border-input bg-background rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring w-full max-w-xs"
            >
              <option value="">
                {loadingClasses ? 'د ټولګیو بارول...' : 'ټولګی وټاکئ'}
              </option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApply}
          className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90"
        >
          فلټر کول
        </button>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="text-xs border border-input rounded px-2.5 py-1.5 hover:bg-muted text-muted-foreground"
          >
            پاکول
          </button>
        )}
      </div>
    </div>
  );
}

export default function IdCardsPage() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({ academicYear: String(currentShamsiYear()) });
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [singleLoadingId, setSingleLoadingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewStudent, setPreviewStudent] = useState(null);
  const [previewType, setPreviewType] = useState("student"); // 'student' | 'teacher' | 'staff'
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherPagination, setTeacherPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });
  const [staffPage, setStaffPage] = useState(1);
  const [staffPagination, setStaffPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });
  const cardRefs = useRef({});
  const previewRef = useRef(null);

  // Fetch classes for filter dropdown
  const fetchClasses = async () => {
    try {
      const response = await getAllClasses({ limit: 100 });
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch teachers for teacher tab
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teacherFilters = {};
      if (filters.name) teacherFilters.name = filters.name;
      if (filters.teacherType) teacherFilters.teacherType = filters.teacherType;
      if (filters.joiningYear) teacherFilters.joiningYear = filters.joiningYear;
      
      const response = await teacherApi.getAllTeachers({ ...teacherFilters, page: teacherPage, limit: 6 });
      setTeachers(response.data.teachers || []);
      setTeacherPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 6 });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error(error.message || "د ښوونکو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff for staff tab
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const staffFilters = {};
      if (filters.name) staffFilters.name = filters.name;
      if (filters.joiningYear) staffFilters.joiningYear = filters.joiningYear;
      
      const response = await staffApi.getAllStaff({ ...staffFilters, page: staffPage, limit: 6 });
      setStaffMembers(response.data.staff || []);
      setStaffPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 6 });
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error(error.message || "د کارمندانو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  // Fetch students based on filters
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getAllStudents({ ...filters, page, limit: 6 });
      setStudents(response.data.students || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 6 });
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(error.message || "د زده کوونکو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    } else if (activeTab === "teachers") {
      fetchTeachers();
    } else if (activeTab === "staff") {
      fetchStaff();
    }
    setSelectedIds([]); // Clear selection when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, teacherPage, staffPage, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedIds([]);
    setPage(1);
    setTeacherPage(1);
    setStaffPage(1);
    
    // Reset filters based on tab
    if (tab === "students") {
      setFilters({ academicYear: String(currentShamsiYear()) });
    } else {
      setFilters({});
    }
  };

  // Handle individual card selection
  const handleSelect = (studentId, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, studentId] : prev.filter((id) => id !== studentId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    if (activeTab === "students") {
      setSelectedIds(students.map((s) => s.id));
    } else if (activeTab === "teachers") {
      setSelectedIds(teachers.map((t) => t.id));
    } else {
      setSelectedIds(staffMembers.map((s) => s.id));
    }
  };

  // Handle preview
  const handlePreview = (item, type = "student") => {
    let normalized = item;
    if (type === "teacher") {
      normalized = { ...item, image: normalizeUploadPath(item.image, '/uploads/teachers') };
    } else if (type === "staff") {
      normalized = { ...item, image: normalizeUploadPath(item.image, '/uploads/staff') };
    }
    setPreviewStudent(normalized);
    setPreviewType(type);
    setPreviewOpen(true);
  };

  // Handle single card download
  const handleDownloadSingle = async (student) => {
    if (pdfLoading || singleLoadingId) return;
    
    try {
      setSingleLoadingId(student.id);
      await generateSingleCardPDF(student, student.fullName || student.name);
      toast.success("کارت بریالیتوب سره ډاونلوډ شو");
    } catch (error) {
      console.error("Error downloading card:", error);
      toast.error(error.message || "د کارت په ډاونلوډ کې تېروتنه");
    } finally {
      setSingleLoadingId(null);
    }
  };

  // Handle download selected cards
  const handleDownloadSelected = async () => {
    if (pdfLoading) return;
    
    try {
      if (selectedIds.length === 0) {
        toast.error("لږ تر لږه یو کارت غوره کړئ");
        return;
      }

      setPdfLoading(true);
      if (activeTab === "students") {
        const selectedStudents = students.filter((s) => selectedIds.includes(s.id));
        await generateMultipleCardsPDF(selectedStudents);
        toast.success(`${selectedStudents.length} کارتونه بریالیتوب سره ډاونلوډ شول`);
      } else if (activeTab === "teachers") {
        // Map teachers to student-shaped objects
        const mapped = teachers.filter((t) => selectedIds.includes(t.id)).map((t) => ({
          id: t.id,
          fullName: t.name,
          fatherName: t.fatherName || "",
          className: t.education || t.qualification || "-",
          fieldLabel: "صلاحیت:",
          image: normalizeUploadPath(t.image, '/uploads/teachers'),
          title: "استاد پیژند کارډ",
          cardType: 'teacher',
        }));
        await generateMultipleCardsPDF(mapped);
        toast.success(`${mapped.length} کارتونه بریالیتوب سره ډاونلوډ شول`);
      } else {
        // Map staff to student-shaped objects
        const mapped = staffMembers.filter((s) => selectedIds.includes(s.id)).map((s) => ({
          id: s.id,
          fullName: s.name,
          fatherName: s.fatherName || "",
          className: s.position || s.role || "-",
          fieldLabel: "مسئولیت:",
          image: normalizeUploadPath(s.image, '/uploads/staff'),
          title: "کارمند پیژند کارډ",
          cardType: 'staff',
        }));
        await generateMultipleCardsPDF(mapped);
        toast.success(`${mapped.length} کارتونه بریالیتوب سره ډاونلوډ شول`);
      }
    } catch (error) {
      console.error("Error downloading selected cards:", error);
      toast.error(error.message || "د کارتونو په ډاونلوډ کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle download all filtered cards
  const handleDownloadAll = async () => {
    if (pdfLoading) return;
    
    try {
      setPdfLoading(true);
      if (activeTab === "students") {
        if (students.length === 0) {
          toast.error("هیڅ کارت ونه موندل شو");
          return;
        }
        await generateMultipleCardsPDF(students);
        toast.success(`${students.length} کارتونه بریالیتوب سره ډاونلوډ شول`);
      } else if (activeTab === "teachers") {
        if (teachers.length === 0) {
          toast.error("هیڅ کارت ونه موندل شو");
          return;
        }
        // Map teachers
        const mapped = teachers.map((t) => ({
          id: t.id,
          fullName: t.name,
          fatherName: t.fatherName || "",
          className: t.education || t.qualification || "-",
          fieldLabel: "صلاحیت:",
          image: normalizeUploadPath(t.image, '/uploads/teachers'),
          title: "استاد پیژند کارډ",
          cardType: 'teacher',
        }));
        await generateMultipleCardsPDF(mapped);
        toast.success(`${teachers.length} کارتونه بریالیتوب سره ډاونلوډ شول`);
      } else {
        if (staffMembers.length === 0) {
          toast.error("هیڅ کارت ونه موندل شو");
          return;
        }
        // Map staff
        const mapped = staffMembers.map((s) => ({
          id: s.id,
          fullName: s.name,
          fatherName: s.fatherName || "",
          className: s.position || s.role || "-",
          fieldLabel: "مسئولیت:",
          image: normalizeUploadPath(s.image, '/uploads/staff'),
          title: "کارمند پیژند کارډ",
          cardType: 'staff',
        }));
        await generateMultipleCardsPDF(mapped);
        toast.success(`${staffMembers.length} کارتونه بریالیتوب سره ډاونلوډ شول`);
      }
    } catch (error) {
      console.error("Error downloading all cards:", error);
      toast.error(error.message || "د کارتونو په ډاونلوډ کې تېروتنه");
    } finally {
      setPdfLoading(false);
    }
  };

  // Filter configuration - Updated based on requirements
  const getIdCardFilters = () => {
    if (activeTab === "students") {
      return [
        { key: "fullName", label: "د زده کوونکي نوم", type: "input", placeholder: "نوم لټون..." },
        { key: "enrollmentType", label: "ډول", type: "select", options: ENROLL_TYPES },
        { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear" },
      ];
    } else if (activeTab === "teachers") {
      return [
        { key: "name", label: "د ښوونکي نوم", type: "input", placeholder: "نوم لټون..." },
        { key: "teacherType", label: "ډول", type: "select", options: ENROLL_TYPES },
      ];
    } else {
      return [
        { key: "name", label: "د کارمند نوم", type: "input", placeholder: "نوم لټون..." },
      ];
    }
  };

  const allSelected = (activeTab === "students" ? students.length : activeTab === "teachers" ? teachers.length : staffMembers.length) > 0 && selectedIds.length === (activeTab === "students" ? students.length : activeTab === "teachers" ? teachers.length : staffMembers.length);
  const someSelected = selectedIds.length > 0 && selectedIds.length < (activeTab === "students" ? students.length : activeTab === "teachers" ? teachers.length : staffMembers.length);

  const currentData = activeTab === "students" ? students : activeTab === "teachers" ? teachers : staffMembers;
  const currentPagination = activeTab === "students" ? pagination : activeTab === "teachers" ? teacherPagination : staffPagination;

  return (
    <div className="space-y-4">
      <PageHeader
        title="د پېژندنې کارتونه"
        subtitle="د زده کوونکو د پېژندنې کارتونو جوړول او ډاونلوډ"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSelected}
              disabled={selectedIds.length === 0 || pdfLoading}
              className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              غوره شوي ډاونلوډ ({selectedIds.length})
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={(activeTab === "students" ? students.length === 0 : activeTab === "teachers" ? teachers.length === 0 : staffMembers.length === 0) || pdfLoading}
              className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              ټول ډاونلوډ
            </button>
          </div>
        }
      />

      {/* Tabs: Students / Teachers / Staff */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleTabChange("students")}
          className={`px-3 py-1.5 rounded ${activeTab === "students" ? "bg-primary text-white" : "bg-transparent border border-input"}`}
        >
          زده کوونکي
        </button>
        <button
          onClick={() => handleTabChange("teachers")}
          className={`px-3 py-1.5 rounded ${activeTab === "teachers" ? "bg-primary text-white" : "bg-transparent border border-input"}`}
        >
          ښوونکي
        </button>
        <button
          onClick={() => handleTabChange("staff")}
          className={`px-3 py-1.5 rounded ${activeTab === "staff" ? "bg-primary text-white" : "bg-transparent border border-input"}`}
        >
          کارمندان
        </button>
      </div>

      <IdCardFilterBar
        activeTab={activeTab}
        onApply={(f) => { 
          setFilters(f); 
          setPage(1); 
          setTeacherPage(1); 
          setStaffPage(1); 
        }}
        onClear={() => { 
          const defaultFilters = activeTab === "students" ? { academicYear: String(currentShamsiYear()) } : {};
          setFilters(defaultFilters); 
          setPage(1); 
          setTeacherPage(1); 
          setStaffPage(1); 
        }}
      />

      {/* Stats Bar */}
      <div className="bg-card border border-border rounded-md p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => el && (el.indeterminate = someSelected)}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">ټول غوره کول</span>
          </label>
          <div className="text-sm text-muted-foreground">
            ټول: <span className="font-medium text-foreground">{currentPagination.total}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            غوره شوي: <span className="font-medium text-foreground">{selectedIds.length}</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="bg-card border border-border rounded-md p-12 text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">په بارولو کې...</p>
        </div>
      ) : activeTab === "students" ? (
        students.length === 0 ? (
          <div className="bg-card border border-border rounded-md p-12 text-center">
            <p className="font-semibold text-sm">هیڅ کارت ونه موندل شو</p>
            <p className="text-xs text-muted-foreground mt-1">د فلټر تنظیمات بدل کړئ</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <IdCardPreview
                  key={student.id}
                  student={student}
                  selected={selectedIds.includes(student.id)}
                  onSelect={handleSelect}
                  onPreview={(s) => handlePreview(s, "student")}
                  onDownload={handleDownloadSingle}
                  loading={singleLoadingId === student.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="text-sm text-muted-foreground">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </>
        )
      ) : activeTab === "teachers" ? (
        // Teachers tab
        teachers.length === 0 ? (
          <div className="bg-card border border-border rounded-md p-12 text-center">
            <p className="font-semibold text-sm">هیڅ کارت ونه موندل شو</p>
            <p className="text-xs text-muted-foreground mt-1">فلټر بدل کړئ یا ښوونکي اضافه کړئ</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => {
                const mapped = {
                  id: teacher.id,
                  fullName: teacher.name || teacher.fullName || "—",
                  fatherName: teacher.fatherName || "",
                  className: teacher.education || teacher.qualification || "—",
                  fieldLabel: "صلاحیت:",
                  image: normalizeUploadPath(teacher.image, '/uploads/teachers'),
                  cardType: 'teacher',
                  title: "استاد پیژند کارډ",
                };

                return (
                  <IdCardPreview
                    key={teacher.id}
                    student={mapped}
                    cardType="teacher"
                    selected={selectedIds.includes(mapped.id)}
                    onSelect={handleSelect}
                    onPreview={() => handlePreview(teacher, "teacher")}
                    onDownload={() => handleDownloadSingle(mapped)}
                    loading={singleLoadingId === mapped.id}
                    cardTitle="استاد پیژند کارډ"
                  />
                );
              })}
            </div>

            {/* Pagination for teachers */}
            {teacherPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setTeacherPage((p) => Math.max(1, p - 1))}
                  disabled={teacherPage === 1}
                  className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="text-sm text-muted-foreground">
                  {teacherPage} / {teacherPagination.totalPages}
                </span>
                <button
                  onClick={() => setTeacherPage((p) => Math.min(teacherPagination.totalPages, p + 1))}
                  disabled={teacherPage === teacherPagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </>
        )
      ) : (
        // Staff tab
        staffMembers.length === 0 ? (
          <div className="bg-card border border-border rounded-md p-12 text-center">
            <p className="font-semibold text-sm">هیڅ کارت ونه موندل شو</p>
            <p className="text-xs text-muted-foreground mt-1">کارمندان اضافه کړئ</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffMembers.map((staff) => {
                const mapped = {
                  id: staff.id,
                  fullName: staff.name || staff.fullName || "—",
                  fatherName: staff.fatherName || "",
                  className: staff.position || staff.role || "—",
                  fieldLabel: "مسئولیت:",
                  image: normalizeUploadPath(staff.image, '/uploads/staff'),
                  cardType: 'staff',
                  title: "کارمند پیژند کارډ",
                };

                return (
                  <IdCardPreview
                    key={staff.id}
                    student={mapped}
                    cardType="staff"
                    selected={selectedIds.includes(mapped.id)}
                    onSelect={handleSelect}
                    onPreview={(s) => handlePreview(staff, "staff")}
                    onDownload={() => handleDownloadSingle(mapped)}
                    loading={singleLoadingId === mapped.id}
                    cardTitle="کارمند پیژند کارډ"
                  />
                );
              })}
            </div>

            {/* Pagination for staff */}
            {staffPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                  disabled={staffPage === 1}
                  className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="text-sm text-muted-foreground">
                  {staffPage} / {staffPagination.totalPages}
                </span>
                <button
                  onClick={() => setStaffPage((p) => Math.min(staffPagination.totalPages, p + 1))}
                  disabled={staffPage === staffPagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </>
        )
      )}

      {/* Preview Modal */}
      <ErpModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="د کارت مخکتنه"
        size="xl"
        footer={
          <button
            onClick={() => setPreviewOpen(false)}
            className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted"
          >
            بندول
          </button>
        }
      >
        {previewStudent && (
          <div className="flex items-center justify-center bg-muted/30 p-4 rounded-lg overflow-auto">
            <div style={{ transform: 'scale(0.7)', transformOrigin: 'center' }}>
              {previewType === "teacher" ? (
                <TeacherIDCard ref={previewRef} teacher={previewStudent} scale={1} />
              ) : previewType === "staff" ? (
                <StaffIDCard ref={previewRef} staff={previewStudent} scale={1} />
              ) : (
                <IdCardGenerator ref={previewRef} student={previewStudent} scale={1} />
              )}
            </div>
          </div>
        )}
      </ErpModal>
    </div>
  );
}

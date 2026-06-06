import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { FilterBar } from "@/components/erp/FilterBar";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { currentShamsiYear, todayIsoDate } from "@/lib/afghan-date";
import { toast } from "sonner";
import * as studentApi from "@/data/studentApi";

const TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

const FILTERS = [
  { key: "id", label: "د زده کوونکي ID", type: "input", placeholder: "ID..." },
  { key: "fullName", label: "د زده کوونکي نوم", type: "input", placeholder: "نوم..." },
  { key: "fatherName", label: "د پلار نوم", type: "input", placeholder: "د پلار نوم..." },
  { key: "enrollmentType", label: "ډول", type: "select", options: TYPES },
  { key: "classId", label: "ټولګی", type: "select", options: [], dynamic: true },
  { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
  { key: "absentOnly", label: "حاضري حالت", type: "select", options: [
    { value: "", label: "ټول" },
    { value: "absent", label: "غیر حاضر" },
    { value: "present", label: "حاضر" }
  ]},
];

export default function ParentNumbersPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ academicYear: String(currentShamsiYear()) });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [filtersConfig, setFiltersConfig] = useState(FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 10 });

  // Fetch classes when type is selected
  const fetchClasses = async (type, year) => {
    if (!type || !year) {
      setClasses([]);
      return;
    }
    
    try {
      const response = await studentApi.getClassesByType({ type, academicYear: year });
      const classList = (response.data.classes || []).map(c => ({
        value: String(c.id),
        label: `${c.name}${c.section ? ` - ${c.section}` : ''}`
      }));
      setClasses(classList);
      
      // Update filter config with classes
      setFiltersConfig(prev => prev.map(f => 
        f.key === "classId" ? { ...f, options: classList } : f
      ));
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  // Watch for type changes
  useEffect(() => {
    if (filters.enrollmentType && filters.academicYear) {
      fetchClasses(filters.enrollmentType, filters.academicYear);
    } else {
      setClasses([]);
      setFiltersConfig(prev => prev.map(f => 
        f.key === "classId" ? { ...f, options: [] } : f
      ));
    }
  }, [filters.enrollmentType, filters.academicYear]);

  const loadRows = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getParentNumbers({ ...filters, page, limit: 10 });
      setRows(response.data.parentNumbers || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 10 });
    } catch (error) {
      toast.error(error.message || "د والدینو نمبرونه ترلاسه نه شول");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [JSON.stringify(filters), page]);

  const toggleCalled = async (row, nextValue) => {
    try {
      const response = await studentApi.toggleParentCallStatus({
        studentId: row.id,
        studentIds: row.studentIds || [row.id],
        attendanceDate: todayIsoDate(),
        called: nextValue,
      });
      const updatedIds = new Set(response.data?.updatedStudentIds || row.studentIds || [row.id]);
      setRows((prev) => prev.map((r) => {
        const ids = r.studentIds || [r.id];
        if (ids.some((id) => updatedIds.has(id)) || updatedIds.has(r.id)) {
          return { ...r, callStatus: nextValue ? 1 : 0 };
        }
        return r;
      }));
    } catch (error) {
      toast.error(error.message || "د اړیکې حالت تازه نه شو");
    }
  };

  const columnDefs = useMemo(() => [
    { field: "id", headerName: "ID", minWidth: 90, flex: 0.6 },
    { field: "fullName", headerName: "د زده کوونکي نوم", minWidth: 160, flex: 1.2 },
    { field: "fatherName", headerName: "د پلار نوم", minWidth: 160, flex: 1.1 },
    { field: "className", headerName: "ټولګی", minWidth: 120, flex: 0.9 },
    { field: "parentNumber1", headerName: "د والد نمبر ۱", minWidth: 150, flex: 1 },
    { field: "parentNumber2", headerName: "د والد نمبر ۲", minWidth: 150, flex: 1 },
    {
      field: "attendanceStatus",
      headerName: "نن حاضري",
      minWidth: 110,
      flex: 0.8,
      valueFormatter: ({ value }) => (value === "Absent" ? "غیر حاضر" : value === "Present" ? "حاضر" : "—"),
    },
    {
      field: "callStatus",
      headerName: "زنګ وهل شوی",
      minWidth: 120,
      flex: 0.9,
      cellRenderer: (params) => {
        const checked = Number(params.value) === 1;
        return (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => toggleCalled(params.data, e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/40"}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </label>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader title="د والدینو نمبرونه" subtitle="د زده کوونکو والدینو اړیکې او نن غیر حاضر لیست" />
      <FilterBar
        filters={filtersConfig}
        defaultValues={{ academicYear: String(currentShamsiYear()) }}
        onApply={(v) => setFilters(v)}
        onClear={() => setFilters({ academicYear: String(currentShamsiYear()) })}
      />
      <AgGridTable
        columnDefs={columnDefs}
        rowData={rows}
        loading={loading}
        emptyText="هیڅ معلومات ونه موندل شول"
        searchPlaceholder="د زده کوونکي نوم/شمېره..."
        serverSidePagination={true}
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableExport={true}
        exportFileName="parent-numbers"
      />
    </div>
  );
}

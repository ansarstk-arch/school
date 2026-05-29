import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ClipboardList, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear, formatShamsi } from "@/lib/afghan-date";
import { useStore } from "@/store/useStore";
import * as marksApi from "@/data/marksApi";
import { useMarksLookups } from "@/hooks/useMarksLookups";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const F = ({ label, children, error }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const TYPES = [
  { value: "School", label: "ښوونځی", variant: "info" },
  { value: "Center", label: "مرکز", variant: "muted" },
  { value: "Madrasa", label: "مدرسه", variant: "warning" },
];

const STATUSES = [
  { value: "Pass", label: "بریالی", color: "text-green-600", variant: "success" },
  { value: "Fail", label: "ناکام", color: "text-red-600", variant: "destructive" },
  { value: "Absent", label: "غیرحاضر", color: "text-gray-500", variant: "muted" },
];

export default function MarksListPage() {
  const session = useStore((s) => s.session);
  
  // List view state
  const [marks, setMarks] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });
  const [listFilters, setListFilters] = useState({ academicYear: session || String(currentShamsiYear()) });
  
  // View/Edit/Delete modals
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ obtainedMarks: "", status: "Pass", remarks: "" });
  const [editId, setEditId] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lookups for list filters
  const listLookup = useMarksLookups({
    academicYear: listFilters.academicYear,
    examId: listFilters.examId,
    institutionType: listFilters.institutionType,
  });

  // Fetch marks list
  const fetchMarksList = useCallback(
    async (pageNum = 1, f = listFilters) => {
      setListLoading(true);
      try {
        const res = await marksApi.getAllMarks({
          page: pageNum,
          limit: 12,
          ...f,
        });
        if (res.success) {
          setMarks(res.data.marks || []);
          setPagination(
            res.data.pagination || { total: 0, totalPages: 1, page: pageNum, limit: 12 }
          );
        }
      } catch (e) {
        toast.error(e.message || "د نمرو په ترلاسه کولو کې ستونزه");
      } finally {
        setListLoading(false);
      }
    },
    [listFilters]
  );

  useEffect(() => {
    fetchMarksList(page, listFilters);
  }, [listFilters, page]);

  // Open view modal
  const openView = (row) => {
    setViewData(row);
    setViewOpen(true);
  };

  // Open edit modal
  const openEdit = (row) => {
    setEditId(row.id);
    setEditForm({
      obtainedMarks: row.obtainedMarks ?? "",
      status: row.status || "Pass",
      remarks: row.remarks || "",
      totalMarks: row.totalMarks,
    });
    setEditErrors({});
    setEditOpen(true);
  };

  // Open delete modal
  const openDelete = (row) => {
    setDeleteId(row.id);
    setDeleteOpen(true);
  };

  // Handle edit save
  const handleEditSave = async () => {
    const { obtainedMarks, status, remarks, totalMarks } = editForm;
    
    // Validation
    if (status !== "Absent") {
      if (obtainedMarks === "") {
        setEditErrors({ form: "نمرې اړینې دي" });
        return;
      }
      const marks = Number(obtainedMarks);
      if (isNaN(marks) || marks < 0) {
        setEditErrors({ form: "نمرې باید مثبت عدد وي" });
        return;
      }
      if (marks > totalMarks) {
        setEditErrors({ form: `نمرې د ${totalMarks} څخه زیاتې نشي` });
        return;
      }
    }

    setEditLoading(true);
    try {
      await marksApi.updateMark(editId, {
        obtainedMarks: status === "Absent" ? null : Number(obtainedMarks),
        status,
        remarks,
      });
      toast.success("نمرې بریالي تازه شوې");
      setEditOpen(false);
      fetchMarksList(page, listFilters);
    } catch (e) {
      toast.error(e.message || "د تازه کولو کې ستونزه");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await marksApi.deleteMark(deleteId);
      toast.success("نمرې بریالي ړنګ شوې");
      setDeleteOpen(false);
      fetchMarksList(page, listFilters);
    } catch (e) {
      toast.error(e.message || "د ړنګولو کې ستونزه");
    } finally {
      setDeleteLoading(false);
    }
  };

  // AG Grid columns
  const columnDefs = useMemo(
    () => [
      { field: "studentName", headerName: "زده کوونکی", flex: 1.2, minWidth: 140 },
      { field: "fatherName", headerName: "د پلار نوم", flex: 1, minWidth: 120 },
      { field: "rollNumber", headerName: "رول نمبر", width: 90 },
      { field: "examTitle", headerName: "امتحان", flex: 1, minWidth: 130 },
      { field: "className", headerName: "ټولګی", width: 90 },
      { field: "subjectName", headerName: "مضمون", width: 110 },
      {
        field: "institutionType",
        headerName: "اداره",
        width: 85,
        cellRenderer: (p) => {
          const type = TYPES.find((t) => t.value === p.value);
          return type ? <Badge variant={type.variant}>{type.label}</Badge> : p.value;
        },
      },
      { field: "totalMarks", headerName: "ټولټال", width: 80 },
      { field: "obtainedMarks", headerName: "ترلاسه", width: 80 },
      {
        field: "status",
        headerName: "حالت",
        width: 90,
        cellRenderer: (p) => {
          const status = STATUSES.find((s) => s.value === p.value);
          return status ? <Badge variant={status.variant}>{status.label}</Badge> : p.value;
        },
      },
      {
        field: "actions",
        headerName: "",
        width: 120,
        sortable: false,
        cellRenderer: (p) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openView(p.data); }}
              title="کتل"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openEdit(p.data); }}
              title="سمول"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openDelete(p.data); }}
              title="ړنګول"
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Filter definitions
  const filterDefs = useMemo(
    () => [
      { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear" },
      {
        key: "examId",
        label: "امتحان",
        type: "select",
        options: listLookup.exams.map((e) => ({
          value: String(e.id),
          label: e.examTitle,
        })),
      },
      {
        key: "institutionType",
        label: "اداره",
        type: "select",
        options: TYPES,
      },
      {
        key: "classId",
        label: "ټولګی",
        type: "select",
        options: listLookup.classes.map((c) => ({
          value: String(c.id),
          label: `${c.name}${c.section ? ` (${c.section})` : ""}`,
        })),
      },
      {
        key: "status",
        label: "حالت",
        type: "select",
        options: STATUSES.map(s => ({ value: s.value, label: s.label })),
      },
      { key: "search", label: "لټون", type: "input", placeholder: "زده کوونکی، امتحان، مضمون..." },
    ],
    [listLookup.exams, listLookup.classes]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="د نمرو لیست"
        subtitle="د زده کوونکو نمرې کتل، سمول او ړنګول"
        actions={
          <Badge variant="info">
            <ClipboardList className="size-3 inline ml-1" />
            نمرې
          </Badge>
        }
      />

      <FilterBar
        filters={filterDefs}
        defaultValues={{ academicYear: session || String(currentShamsiYear()) }}
        onApply={(v) => {
          setListFilters(v);
          setPage(1);
        }}
        onClear={() => {
          const y = session || String(currentShamsiYear());
          setListFilters({ academicYear: y });
          setPage(1);
        }}
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={marks}
        loading={listLoading}
        emptyText="هیڅ نمرې ونه موندل شوې"
        serverSidePagination
        pageSize={pagination.limit || 12}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableRtl
      />

      {/* View Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د نمرو معلومات"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setViewOpen(false)}
            className="text-sm border border-input rounded px-4 py-2 hover:bg-muted"
          >
            بندول
          </button>
        }
      >
        {viewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">زده کوونکی</p>
                <p className="text-sm font-medium">{viewData.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">د پلار نوم</p>
                <p className="text-sm font-medium">{viewData.fatherName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
             
              <div>
                <p className="text-xs text-muted-foreground">تعلیمي کال</p>
                <p className="text-sm font-medium">{viewData.academicYear}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">امتحان</p>
                  <p className="text-sm font-medium">{viewData.examTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">د امتحان نېټه</p>
                  <p className="text-sm font-medium">{formatShamsi(viewData.examStartDate)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ټولګی</p>
                <p className="text-sm font-medium">{viewData.className}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مضمون</p>
                <p className="text-sm font-medium">{viewData.subjectName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">د ادارې ډول</p>
                <p className="text-sm font-medium">
                  <Badge variant={TYPES.find(t => t.value === viewData.institutionType)?.variant || "muted"}>
                    {TYPES.find(t => t.value === viewData.institutionType)?.label || viewData.institutionType}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حالت</p>
                <p className="text-sm font-medium">
                  <Badge variant={STATUSES.find(s => s.value === viewData.status)?.variant || "muted"}>
                    {STATUSES.find(s => s.value === viewData.status)?.label || viewData.status}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
              <div>
                <p className="text-xs text-muted-foreground">ټولټال نمرې</p>
                <p className="text-2xl font-bold text-primary">{viewData.totalMarks}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ترلاسه شوې نمرې</p>
                <p className="text-2xl font-bold text-success">{viewData.obtainedMarks ?? "—"}</p>
              </div>
            </div>

            {viewData.remarks && (
              <div>
                <p className="text-xs text-muted-foreground">یادښت</p>
                <p className="text-sm">{viewData.remarks}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              <p>جوړ شوی: {new Date(viewData.createdAt).toLocaleString('fa-AF')}</p>
              <p>تازه شوی: {new Date(viewData.updatedAt).toLocaleString('fa-AF')}</p>
            </div>
          </div>
        )}
      </ErpModal>

      {/* Edit Modal */}
      <ErpModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="نمرې سمول"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="text-sm border border-input rounded px-3 py-1.5 hover:bg-muted"
              disabled={editLoading}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handleEditSave}
              disabled={editLoading}
              className="text-sm bg-primary text-primary-foreground rounded px-4 py-1.5 disabled:opacity-50"
            >
              {editLoading ? "ثبتیږي..." : "خوندي کړئ"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {editErrors.form && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              {editErrors.form}
            </div>
          )}
          
          <F label="حالت">
            <select
              value={editForm.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setEditForm((f) => ({
                  ...f,
                  status: newStatus,
                  obtainedMarks: newStatus === "Absent" ? "" : f.obtainedMarks,
                }));
                setEditErrors({});
              }}
              className={SEL}
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </F>

          <F label="ترلاسه شوې نمرې">
            <input
              type="number"
              value={editForm.obtainedMarks}
              onChange={(e) => {
                setEditForm((f) => ({ ...f, obtainedMarks: e.target.value }));
                setEditErrors({});
              }}
              disabled={editForm.status === "Absent"}
              className={SEL}
              placeholder="نمرې"
              min="0"
              max={editForm.totalMarks}
            />
            {editForm.totalMarks && (
              <span className="text-[10px] text-muted-foreground">
                ټولټال: {editForm.totalMarks}
              </span>
            )}
          </F>

          <F label="یادښت (اختیاري)">
            <textarea
              value={editForm.remarks}
              onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
              className={SEL}
              placeholder="یادښت"
              rows={3}
            />
          </F>
        </div>
      </ErpModal>

      {/* Delete Confirmation */}
      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="نمرې"
        loading={deleteLoading}
      />
    </div>
  );
}

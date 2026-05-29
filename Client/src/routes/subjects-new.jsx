import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { FilterBar } from "@/components/erp/FilterBar";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { SubjectForm } from "@/components/erp/SubjectForm";
import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import * as subjectApi from "@/data/subjectApi";
import { validateSubject } from "@/utils/subjectValidation";
import { ACTIVE_SESSION } from "@/constants";

const TYPES = [
  { value: "School", label: "ښوونځی", variant: "info" },
  { value: "Center", label: "مرکز", variant: "muted" },
  { value: "Madrasa", label: "مدرسه", variant: "warning" },
];

const typeLabel = (v) => TYPES.find((t) => t.value === v)?.label ?? v;
const typeVariant = (v) => TYPES.find((t) => t.value === v)?.variant ?? "muted";

const SUBJECT_FILTERS = [
  { key: "name", label: "د مضمون نوم", type: "input", placeholder: "مضمون لټون..." },
  { key: "type", label: "ډول", type: "select", options: TYPES.map(({ value, label }) => ({ value, label })) },
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectApi.getAllSubjects({
        ...filters,
        academicYear: ACTIVE_SESSION,
        page,
        limit: 12,
      });
      setSubjects(response.data.subjects || []);
      setPagination(response.data.pagination || { total: 0, totalPages: 0, page: 1, limit: 12 });
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error(error.message || "د مضامینو په ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [filters, page]);

  const openAdd = () => {
    setSelected(null);
    setErrors({});
    setIsEditing(false);
    setOpen(true);
  };

  const openEdit = (s) => {
    setSelected(s);
    setErrors({});
    setIsEditing(true);
    setOpen(true);
  };

  const openView = (s) => {
    setSelected(s);
    setViewOpen(true);
  };

  const openDelete = (s) => {
    setSelected(s);
    setDeleteOpen(true);
  };

  const handleSaveSubject = async (form) => {
    const validationErrors = validateSubject(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        type: form.type,
        academicYear: ACTIVE_SESSION,
        classIds: form.classIds,
      };

      if (isEditing && selected?.id) {
        await subjectApi.updateSubject(selected.id, payload);
        toast.success("مضمون بریالیتوب سره تازه شو");
      } else {
        await subjectApi.createSubject(payload);
        toast.success("مضمون بریالیتوب سره ثبت شو");
      }

      setOpen(false);
      setSelected(null);
      setErrors({});
      setPage(1);
      await fetchSubjects();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error(error.message || "د مضمون په ثبتولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    try {
      setLoading(true);
      await subjectApi.deleteSubject(selected.id);
      toast.success("مضمون بریالیتوب سره ړنګ شو");
      setDeleteOpen(false);
      setSelected(null);
      setPage(1);
      await fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "د مضمون په ړنګولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const subjectColumnDefs = useMemo(() => [
    {
      field: "name",
      headerName: "د مضمون نوم",
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: "type",
      headerName: "ډول",
      flex: 0.8,
      minWidth: 120,
      cellRenderer: (params) => (
        <Badge variant={typeVariant(params.value)}>
          {typeLabel(params.value)}
        </Badge>
      ),
    },
    {
      field: "createdAt",
      headerName: "د جوړولو نېټه",
      flex: 1,
      minWidth: 140,
      cellRenderer: (params) => {
        if (!params.value) return "—";
        return new Date(params.value).toLocaleDateString("ps-AF");
      },
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.9,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const s = params.data;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openView(s);
              }}
              title="کتل"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(s);
              }}
              title="سمول"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDelete(s);
              }}
              title="ړنګول"
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ], []);

  const DV = ({ label, value }) => (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="مضامین"
        subtitle="د مضامینو اداره"
        actions={
          <button
            onClick={openAdd}
            className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> نوی مضمون
          </button>
        }
      />

      <FilterBar
        filters={SUBJECT_FILTERS}
        onApply={(f) => {
          setFilters(f);
          setPage(1);
        }}
        onClear={() => {
          setFilters({});
          setPage(1);
        }}
      />

      <AgGridTable
        columnDefs={subjectColumnDefs}
        rowData={subjects}
        loading={loading}
        emptyText="هیڅ مضمون ونه موندل شو"
        searchPlaceholder="د مضمون نوم..."
        serverSidePagination={true}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        enableRtl={true}
      />

      {/* View Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د مضمون معلومات"
        size="md"
        footer={
          <button
            onClick={() => setViewOpen(false)}
            className="px-4 py-1.5 text-sm border border-input rounded hover:bg-muted"
          >
            بندول
          </button>
        }
      >
        {selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DV label="د مضمون نوم" value={selected.name} />
            <DV label="ډول" value={typeLabel(selected.type)} />
            <DV label="د جوړولو نېټه" value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("ps-AF") : "—"} />
            {selected.classes && selected.classes.length > 0 && (
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground mb-2">ګمارل شوي ټولګي</p>
                <div className="flex gap-1 flex-wrap">
                  {selected.classes.map((c) => (
                    <Badge key={c.id} variant="muted">
                      {c.name} ({c.section})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ErpModal>

      {/* Add/Edit Modal */}
      <ErpModal
        open={open}
        onOpenChange={setOpen}
        title={isEditing ? "مضمون سمول" : "نوی مضمون"}
        size="md"
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
              disabled={loading}
            >
              لغوه
            </button>
            <button
              onClick={() => handleSaveSubject(selected || {})}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium"
              disabled={loading}
            >
              {loading ? "...په ثبتیدو کې" : "ثبتول"}
            </button>
          </>
        }
      >
        <SubjectForm
          subject={selected}
          onSave={handleSaveSubject}
          loading={loading}
          errors={errors}
          setErrors={setErrors}
        />
      </ErpModal>

      {/* Delete Confirmation */}
      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={selected?.name}
      />
    </div>
  );
}

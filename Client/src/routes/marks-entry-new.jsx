import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { FilterBar } from "@/components/erp/FilterBar";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { Save, ClipboardList, Download, Pencil, Trash2, List, Edit } from "lucide-react";
import { toast } from "sonner";
import { currentShamsiYear, formatShamsi } from "@/lib/afghan-date";
import { useStore } from "@/store/useStore";
import * as marksApi from "@/data/marksApi";
import { useMarksLookups } from "@/hooks/useMarksLookups";
import {
  INSTITUTION_TYPES,
  MARK_STATUSES,
  STATUS_LABELS,
  SEL,
  computeMarkStatus,
  validateMarkRow,
} from "@/utils/marksShared";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";

const F = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default function MarksEntryPage() {
  const session = useStore((s) => s.session);
  const [tab, setTab] = useState("entry");

  const [listFilters, setListFilters] = useState({ academicYear: session || String(currentShamsiYear()) });
  const [marksList, setMarksList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [listPagination, setListPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryData, setEntryData] = useState(null);
  const [rows, setRows] = useState([]);
  const [config, setConfig] = useState(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({ obtainedMarks: "", status: "Pass", remarks: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const listLookup = useMarksLookups({
    academicYear: listFilters.academicYear,
    examId: listFilters.examId,
    institutionType: listFilters.institutionType,
  });

  const fetchMarksList = useCallback(
    async (pageNum = 1, f = listFilters) => {
      setListLoading(true);
      try {
        const res = await marksApi.getAllMarks({ page: pageNum, limit: 12, ...f });
        if (res.success) {
          setMarksList(res.data.marks || []);
          setListPagination(
            res.data.pagination || { total: 0, totalPages: 1, page: pageNum, limit: 12 }
          );
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setListLoading(false);
      }
    },
    [listFilters]
  );

  useEffect(() => {
    if (tab === "list") fetchMarksList(listPage, listFilters);
  }, [tab, listFilters]);

  // Group marks by exam+class+subject for entry cards
  const entryGroups = useMemo(() => {
    const groups = {};
    marksList.forEach((m) => {
      const key = `${m.examId}-${m.classId}-${m.subjectId}`;
      if (!groups[key]) {
        groups[key] = {
          examId: m.examId,
          classId: m.classId,
          subjectId: m.subjectId,
          institutionType: m.institutionType,
          examTitle: m.examTitle,
          className: m.className,
          subjectName: m.subjectName,
          examStartDate: m.examStartDate,
          totalMarks: m.totalMarks,
          count: 0,
        };
      }
      groups[key].count++;
    });
    return Object.values(groups);
  }, [marksList]);

  const openEntry = async (group) => {
    setEntryData(group);
    setEntryLoading(true);
    setEntryOpen(true);
    try {
      const res = await marksApi.getMarksEntrySheet({
        examId: group.examId,
        classId: group.classId,
        subjectId: group.subjectId,
        institutionType: group.institutionType,
      });
      if (res.success) {
        setConfig(res.data.config);
        setRows(
          (res.data.students || []).map((st) => ({
            studentId: st.studentId,
            markId: st.markId,
            fullName: st.fullName,
            fatherName: st.fatherName,
            rollNumber: st.rollNumber,
            totalMarks: st.totalMarks,
            obtainedMarks: st.obtainedMarks ?? "",
            status: st.status || "Pass",
            remarks: st.remarks || "",
          }))
        );
      }
    } catch (e) {
      toast.error(e.message || "د لیست د ترلاسه کولو کې ستونزه");
      setRows([]);
    } finally {
      setEntryLoading(false);
    }
  };

  const onCellValueChanged = useCallback(
    (params) => {
      const { data, colDef, newValue } = params;
      setRows((prev) =>
        prev.map((r) => {
          if (r.studentId !== data.studentId) return r;
          const updated = { ...r, [colDef.field]: newValue };
          if (colDef.field === "obtainedMarks" && updated.status !== "Absent") {
            updated.status = computeMarkStatus(updated.obtainedMarks, config?.passingMarks, updated.status);
          }
          if (colDef.field === "status" && newValue === "Absent") updated.obtainedMarks = "";
          if (colDef.field === "status" && newValue !== "Absent" && updated.obtainedMarks !== "") {
            updated.status = computeMarkStatus(updated.obtainedMarks, config?.passingMarks, newValue);
          }
          return updated;
        })
      );
    },
    [config]
  );

  const handleBulkSave = async () => {
    for (const r of rows) {
      const err = validateMarkRow(r, r.totalMarks);
      if (err) {
        toast.error(`${r.fullName}: ${err}`);
        return;
      }
    }
    const toSave = rows.filter((r) => r.status === "Absent" || r.obtainedMarks !== "");
    if (toSave.length === 0) {
      toast.error("د خوندي کولو لپاره نمرې ولیکئ");
      return;
    }
    setSaving(true);
    try {
      const res = await marksApi.bulkSaveMarks({
        examId: Number(entryData.examId),
        classId: Number(entryData.classId),
        subjectId: Number(entryData.subjectId),
        institutionType: entryData.institutionType,
        marks: toSave.map((r) => ({
          studentId: r.studentId,
          markId: r.markId,
          obtainedMarks: r.status === "Absent" ? null : Number(r.obtainedMarks),
          status: r.status,
          remarks: r.remarks,
        })),
      });
      if (res.success) {
        toast.success(res.message);
        setEntryOpen(false);
        if (tab === "list") fetchMarksList(listPage, listFilters);
      }
    } catch (e) {
      toast.error(e.message || "د ثبتولو کې ستونزه");
    } finally {
      setSaving(false);
    }
  };

  const openEditMark = (row) => {
    setEditRow(row);
    setEditForm({
      obtainedMarks: row.obtainedMarks ?? "",
      status: row.status,
      remarks: row.remarks || "",
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    const total = editRow?.totalMarks || 100;
    const err = validateMarkRow(
      { ...editForm, status: editForm.status },
      total
    );
    if (err && editForm.status !== "Absent") {
      toast.error(err);
      return;
    }
    setEditLoading(true);
    try {
      await marksApi.updateMark(editRow.id, {
        obtainedMarks: editForm.status === "Absent" ? null : Number(editForm.obtainedMarks),
        status: editForm.status,
        remarks: editForm.remarks,
      });
      toast.success("نمرې تازه شوې");
      setEditOpen(false);
      fetchMarksList(listPage, listFilters);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const entryColumns = useMemo(
    () => [
      { field: "rollNumber", headerName: "رول", width: 90, editable: false, pinned: "right" },
      { field: "fullName", headerName: "نوم", flex: 1, minWidth: 140, editable: false },
      { field: "fatherName", headerName: "د پلار نوم", flex: 1, minWidth: 120, editable: false },
      { field: "totalMarks", headerName: "ټولټال", width: 85, editable: false },
      {
        field: "obtainedMarks",
        headerName: "ترلاسه",
        width: 110,
        editable: (p) => p.data.status !== "Absent",
        cellEditor: "agNumberCellEditor",
        cellClass: "bg-primary/5 font-semibold",
      },
      {
        field: "status",
        headerName: "حالت",
        width: 115,
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: MARK_STATUSES.map((s) => s.value) },
        cellRenderer: (p) => (
          <Badge variant={MARK_STATUSES.find((s) => s.value === p.value)?.variant || "muted"}>
            {STATUS_LABELS[p.value] || p.value}
          </Badge>
        ),
      },
      { field: "remarks", headerName: "یادښت", flex: 1, minWidth: 100, editable: true },
    ],
    []
  );

  const listColumns = useMemo(
    () => [
      { field: "rollNumber", headerName: "رول", width: 80 },
      { field: "studentName", headerName: "نوم", flex: 1, minWidth: 120 },
      { field: "examTitle", headerName: "امتحان", width: 120 },
      { field: "subjectName", headerName: "مضمون", width: 100 },
      { field: "className", headerName: "ټولګی", width: 80 },
      {
        field: "obtainedMarks",
        headerName: "نمرې",
        width: 75,
        valueFormatter: (p) => (p.data?.status === "Absent" ? "—" : p.value ?? "—"),
      },
      {
        field: "status",
        headerName: "حالت",
        width: 90,
        cellRenderer: (p) => (
          <Badge variant={MARK_STATUSES.find((s) => s.value === p.value)?.variant || "muted"}>
            {STATUS_LABELS[p.value]}
          </Badge>
        ),
      },
      {
        field: "updatedAt",
        headerName: "نېټه",
        width: 105,
        valueFormatter: (p) => (p.value ? formatShamsi(p.value) : "—"),
      },
      {
        field: "actions",
        headerName: "",
        width: 90,
        sortable: false,
        cellRenderer: (p) => (
          <div className="flex gap-1">
            <button type="button" className="p-1 rounded hover:bg-muted" onClick={() => openEditMark(p.data)}>
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted text-destructive"
              onClick={() => {
                setDeleteId(p.data.id);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const listFilterDefs = useMemo(
    () => [
      { key: "academicYear", label: "تعلیمي کال", type: "shamsiYear" },
      {
        key: "examId",
        label: "امتحان",
        type: "select",
        options: listLookup.exams.map((e) => ({ value: String(e.id), label: e.examTitle })),
      },
      {
        key: "institutionType",
        label: "اداره",
        type: "select",
        options: INSTITUTION_TYPES,
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
        key: "subjectId",
        label: "مضمون",
        type: "select",
        options: listLookup.subjects,
      },
      {
        key: "status",
        label: "حالت",
        type: "select",
        options: MARK_STATUSES,
      },
      { key: "dateFrom", label: "له نېټې", type: "shamsiDate" },
      { key: "dateTo", label: "تر نېټې", type: "shamsiDate" },
      { key: "search", label: "لټون", type: "input", placeholder: "نوم، رول…" },
    ],
    [listLookup.exams, listLookup.classes, listLookup.subjects]
  );

  useEffect(() => {
    if (listFilters.examId && listFilters.classId && listFilters.institutionType) {
      listLookup.loadSubjectsForClass(
        listFilters.classId,
        listFilters.institutionType,
        true
      );
    }
  }, [listFilters.examId, listFilters.classId, listFilters.institutionType]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="د نمرو داخلول"
        subtitle="ګړندۍ ثبتول او د ثبت شوو نمرو مدیریت"
      />

      <div className="flex gap-1 border-b border-border">
        {[
          { id: "entry", label: "ګړندۍ داخلول", icon: ClipboardList },
          { id: "list", label: "ثبت شوي نمرې", icon: List },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors",
              tab === id ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />{label}
          </button>
        ))}
      </div>

      {tab === "entry" && (
        <>
          <FilterBar
            filters={listFilterDefs.slice(0, 4)}
            defaultValues={{ academicYear: session || String(currentShamsiYear()) }}
            onApply={(v) => {
              setListFilters(v);
              setListPage(1);
            }}
            onClear={() => {
              const y = session || String(currentShamsiYear());
              setListFilters({ academicYear: y });
              setListPage(1);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entryGroups.map((group) => (
              <div
                key={`${group.examId}-${group.classId}-${group.subjectId}`}
                className="bg-card border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">{group.examTitle}</h3>
                    <p className="text-xs text-muted-foreground">
                      {group.className} • {group.subjectName}
                    </p>
                  </div>
                  <Badge variant="info">{group.count} زده کوونکي</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatShamsi(group.examStartDate)}</span>
                  <span>ټولټال: {group.totalMarks}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openEntry(group)}
                  className="w-full inline-flex items-center justify-center gap-2 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90"
                >
                  <Edit className="size-3.5" />
                  نمرې داخل کړئ
                </button>
              </div>
            ))}
          </div>

          {entryGroups.length === 0 && !listLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="size-12 mx-auto mb-3 opacity-50" />
              <p>د نمرو داخلولو لپاره امتحان او ټولګی فلټر کړئ</p>
            </div>
          )}
        </>
      )}

      {tab === "list" && (
        <>
          <FilterBar
            filters={listFilterDefs}
            defaultValues={{ academicYear: session || String(currentShamsiYear()) }}
            onApply={(v) => { setListFilters(v); setListPage(1); }}
            onClear={() => {
              const y = session || String(currentShamsiYear());
              setListFilters({ academicYear: y });
              setListPage(1);
            }}
          />
          <AgGridTable
            columnDefs={listColumns}
            rowData={marksList}
            loading={listLoading}
            serverSidePagination
            totalRows={listPagination.total}
            currentPage={listPage}
            totalPages={listPagination.totalPages}
            onPageChange={(p) => {
              setListPage(p);
              fetchMarksList(p, listFilters);
            }}
            enableExport
            onExportClick={async () => {
              try {
                const blob = await marksApi.downloadMarksExcel(listFilters);
                saveAs(blob, "marks-list.xlsx");
                toast.success("Excel صادر شو");
              } catch (e) {
                toast.error(e.message);
              }
            }}
            onPdfClick={async () => {
              try {
                const blob = await marksApi.downloadMarksPDF(listFilters);
                saveAs(blob, "marks-list.pdf");
                toast.success("PDF صادر شو");
              } catch (e) {
                toast.error(e.message);
              }
            }}
          />
        </>
      )}

      {/* Entry Modal */}
      <ErpModal
        open={entryOpen}
        onOpenChange={setEntryOpen}
        title={`نمرې داخل کړئ - ${entryData?.examTitle || ""} - ${entryData?.subjectName || ""}`}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEntryOpen(false)}
              className="text-xs border rounded px-3 py-1.5"
              disabled={saving}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handleBulkSave}
              disabled={saving || entryLoading}
              className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground rounded px-4 py-1.5"
            >
              <Save className="size-3.5" />
              {saving ? "ثبتیږي…" : "ټول خوندي کړئ"}
            </button>
          </>
        }
      >
        {entryLoading ? (
          <p className="text-sm text-muted-foreground">لوډېږي…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">زده کوونکي ونه موندل شول</p>
        ) : (
          <>
            {config && (
              <p className="text-xs text-muted-foreground mb-3">
                ټولټال: {config.totalMarks} | بریالیتوب: {config.passingMarks}
              </p>
            )}
            <AgGridTable
              columnDefs={entryColumns}
              rowData={rows}
              loading={entryLoading}
              enableInlineEdit
              onCellValueChanged={onCellValueChanged}
              getRowId={(p) => String(p.data.studentId)}
            />
          </>
        )}
      </ErpModal>

      {/* Edit Modal */}
      <ErpModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="نمرې سمول"
        footer={
          <>
            <button type="button" onClick={() => setEditOpen(false)} className="text-xs border rounded px-3 py-1.5">لغوه</button>
            <button type="button" onClick={handleEditSave} disabled={editLoading} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5">
              {editLoading ? "ثبتیږي…" : "خوندي کړئ"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <F label="ترلاسه شوې نمرې">
            <input type="number" className={SEL} disabled={editForm.status === "Absent"} value={editForm.obtainedMarks} onChange={(e) => setEditForm((f) => ({ ...f, obtainedMarks: e.target.value }))} />
          </F>
          <F label="حالت">
            <select className={SEL} value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
              {MARK_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </F>
          <div className="col-span-2">
            <F label="یادښت">
              <input className={SEL} value={editForm.remarks} onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))} />
            </F>
          </div>
        </div>
      </ErpModal>

      <ConfirmDelete
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        loading={deleteLoading}
        onConfirm={async () => {
          setDeleteLoading(true);
          try {
            await marksApi.deleteMark(deleteId);
            toast.success("نمرې ړنګ شوې");
            setDeleteOpen(false);
            fetchMarksList(listPage, listFilters);
          } catch (e) {
            toast.error(e.message);
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { AgGridTable } from "@/components/erp/AgGridTable";
import { FilterBar } from "@/components/erp/FilterBar";
import { Badge } from "@/components/erp/Badge";
import { ErpModal } from "@/components/erp/ErpModal";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { History, Undo2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { currentShamsiYear, formatShamsi } from "@/lib/afghan-date";
import * as promotionApi from "@/data/promotionApi";

const INSTITUTION_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

const PROMOTION_STATUSES = [
  { value: "Promoted", label: "ترفیع شوی", variant: "success" },
  { value: "Repeated", label: "تکرار", variant: "warning" },
  { value: "Detained", label: "بند", variant: "destructive" },
  { value: "Transferred", label: "لیږدول شوی", variant: "muted" },
];

const PROMOTION_TYPES = [
  { value: "Individual", label: "انفرادي" },
  { value: "ClassPromotion", label: "د ټولګي ترفیع" },
  { value: "YearEnd", label: "د کال پای" },
];

export default function PromotionHistoryPage() {
  const session = useStore((s) => s.session);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [filters, setFilters] = useState({ toAcademicYear: session || String(currentShamsiYear()) });

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const fetchPromotions = useCallback(
    async (pageNum = 1, f = filters) => {
      setLoading(true);
      try {
        const res = await promotionApi.getAllPromotions({
          page: pageNum,
          limit: 10,
          ...f,
        });

        if (res.success) {
          setPromotions(res.data.promotions || []);
          setPagination(
            res.data.pagination || { total: 0, totalPages: 1, page: pageNum, limit: 10 }
          );
        }
      } catch (error) {
        toast.error(error.message || "د ترفیعاتو د ترلاسه کولو کې ستونزه");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchPromotions(page, filters);
  }, [filters, page, fetchPromotions]);

  const openView = async (promotion) => {
    try {
      const res = await promotionApi.getPromotionById(promotion.id);
      if (res.success) {
        setSelectedPromotion(res.data.promotion);
        setViewOpen(true);
      }
    } catch (error) {
      toast.error(error.message || "د ترفیع د معلوماتو د ترلاسه کولو کې ستونزه");
    }
  };

  const openRollback = (promotion) => {
    setSelectedPromotion(promotion);
    setRollbackOpen(true);
  };

  const handleRollback = async () => {
    if (!selectedPromotion) return;

    setRollbackLoading(true);
    try {
      const res = await promotionApi.rollbackPromotion(selectedPromotion.id);
      if (res.success) {
        toast.success("ترفیع بریالیتوب سره لغوه شو");
        setRollbackOpen(false);
        fetchPromotions(page, filters);
      }
    } catch (error) {
      toast.error(error.message || "د ترفیع د لغوه کولو کې ستونزه");
    } finally {
      setRollbackLoading(false);
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "studentName",
        headerName: "زده کوونکی",
        flex: 1.2,
        minWidth: 150,
      },
      {
        field: "studentRollNumber",
        headerName: "رول",
        width: 90,
      },
      {
        field: "fromClassName",
        headerName: "له ټولګي",
        width: 110,
      },
      {
        field: "toClassName",
        headerName: "نوي ټولګي",
        width: 110,
      },
      {
        field: "fromAcademicYear",
        headerName: "له کال",
        width: 90,
      },
      {
        field: "toAcademicYear",
        headerName: "نوي کال",
        width: 90,
      },
      {
        field: "promotionStatus",
        headerName: "حالت",
        width: 110,
        cellRenderer: (p) => {
          const status = PROMOTION_STATUSES.find((s) => s.value === p.value);
          return (
            <Badge variant={status?.variant || "muted"}>
              {status?.label || p.value}
            </Badge>
          );
        },
      },
      {
        field: "promotionType",
        headerName: "ډول",
        width: 120,
        cellRenderer: (p) => {
          const type = PROMOTION_TYPES.find((t) => t.value === p.value);
          return type?.label || p.value;
        },
      },
      {
        field: "promotionDate",
        headerName: "نېټه",
        width: 110,
        valueFormatter: (p) => (p.value ? formatShamsi(p.value) : "—"),
      },
      {
        field: "actions",
        headerName: "",
        width: 100,
        sortable: false,
        cellRenderer: (p) => (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openView(p.data); }}
              title="کتل"
              className="p-1.5 rounded hover:bg-muted"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openRollback(p.data); }}
              title="لغوه کول"
              className="p-1.5 rounded hover:bg-muted text-warning"
            >
              <Undo2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const filterDefs = useMemo(
    () => [
      { key: "toAcademicYear", label: "تعلیمي کال", type: "shamsiYear", placeholder: "تعلیمي کال" },
      {
        key: "fromInstitutionType",
        label: "ادارې ډول",
        type: "select",
        options: INSTITUTION_TYPES,
      },
      {
        key: "promotionStatus",
        label: "حالت",
        type: "select",
        options: PROMOTION_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      },
      {
        key: "promotionType",
        label: "د ترفیع ډول",
        type: "select",
        options: PROMOTION_TYPES,
      },
      { key: "search", label: "لټون", type: "input", placeholder: "د زده کوونکي نوم..." },
    ],
    []
  );

  const DV = ({ label, value }) => (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="د ترفیعاتو تاریخچه"
        subtitle="د ټولو ترفیعاتو لیست او مدیریت"
        actions={
          <Badge variant="info">
            <History className="size-3 inline ml-1" />
            {pagination.total} ترفیعات
          </Badge>
        }
      />

      <FilterBar
        filters={filterDefs}
        defaultValues={{ toAcademicYear: session || String(currentShamsiYear()) }}
        onApply={(v) => {
          setFilters(v);
          setPage(1);
        }}
        onClear={() => {
          const y = session || String(currentShamsiYear());
          setFilters({ toAcademicYear: y });
          setPage(1);
        }}
      />

      <AgGridTable
        columnDefs={columnDefs}
        rowData={promotions}
        loading={loading}
        emptyText="هیڅ ترفیع ونه موندل شو"
        searchPlaceholder="د زده کوونکي نوم..."
        serverSidePagination
        pageSize={pagination.limit || 10}
        totalRows={pagination.total}
        currentPage={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* View Modal */}
      <ErpModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="د ترفیع معلومات"
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
        {selectedPromotion && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="p-3 bg-muted/30 rounded">
              <p className="text-sm font-medium mb-2">زده کوونکی:</p>
              <p className="text-sm">{selectedPromotion.studentName}</p>
              <p className="text-xs text-muted-foreground">
                رول: {selectedPromotion.studentRollNumber}
              </p>
            </div>

            {/* Promotion Details */}
            <div className="grid grid-cols-2 gap-4">
              <DV label="له ټولګي" value={selectedPromotion.fromClassName} />
              <DV label="نوي ټولګي" value={selectedPromotion.toClassName} />
              <DV label="له کال" value={selectedPromotion.fromAcademicYear} />
              <DV label="نوي کال" value={selectedPromotion.toAcademicYear} />
              <DV
                label="حالت"
                value={
                  <Badge
                    variant={
                      PROMOTION_STATUSES.find((s) => s.value === selectedPromotion.promotionStatus)
                        ?.variant || "muted"
                    }
                  >
                    {PROMOTION_STATUSES.find((s) => s.value === selectedPromotion.promotionStatus)
                      ?.label || selectedPromotion.promotionStatus}
                  </Badge>
                }
              />
              <DV
                label="د ترفیع ډول"
                value={
                  PROMOTION_TYPES.find((t) => t.value === selectedPromotion.promotionType)?.label ||
                  selectedPromotion.promotionType
                }
              />
            </div>

            {/* Criteria */}
            {selectedPromotion.percentage !== null && (
              <div className="p-3 border rounded">
                <p className="text-xs font-medium mb-2">د ترفیع معیار:</p>
                <div className="grid grid-cols-3 gap-3">
                  <DV
                    label="نمرې"
                    value={
                      selectedPromotion.percentage
                        ? `${selectedPromotion.percentage.toFixed(1)}%`
                        : "—"
                    }
                  />
                  <DV
                    label="حاضري"
                    value={
                      selectedPromotion.attendancePercentage
                        ? `${selectedPromotion.attendancePercentage.toFixed(1)}%`
                        : "—"
                    }
                  />
                  <DV label="اساس" value={selectedPromotion.basedOn || "—"} />
                </div>
              </div>
            )}

            {/* Remarks */}
            {selectedPromotion.remarks && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">یادښت:</p>
                <p className="text-sm">{selectedPromotion.remarks}</p>
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <DV label="د ترفیع نېټه" value={formatShamsi(selectedPromotion.promotionDate)} />
              <DV label="ترفیع کوونکی" value={selectedPromotion.promotedByName || "—"} />
            </div>
          </div>
        )}
      </ErpModal>

      {/* Rollback Confirmation */}
      <ConfirmDelete
        open={rollbackOpen}
        onOpenChange={setRollbackOpen}
        loading={rollbackLoading}
        onConfirm={handleRollback}
        title={selectedPromotion?.studentName}
        message="ایا تاسو ډاډه یاست چې غواړئ دا ترفیع لغوه کړئ؟ زده کوونکی به بیرته خپل پخواني ټولګي ته ولیږدول شي."
      />
    </div>
  );
}

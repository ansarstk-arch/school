import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Search, Download, ChevronLeft, ChevronRight, Trash2, FileDown, Eye, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useRef, useEffect } from "react";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import "./ag-grid-modern.css";

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export function AgGridTable({
  columnDefs,
  rowData,
  loading = false,
  emptyText = "هیڅ ریکارډ ونه موندل شو",
  toolbar,
  searchPlaceholder = "لټون…",
  onRowClicked,
  onSortChanged,
  serverSidePagination = false,
  clientSidePagination = true,
  pageSize = DEFAULT_PAGE_SIZE,
  totalRows = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  enableRtl = true,
  enableExport = false,
  exportFileName = "export",
  onExportClick,
  onPdfClick,
  exportLoading = false,
  pdfLoading = false,
  // New props for advanced features
  enableRowSelection = false,
  onSelectionChanged,
  onBulkDelete,
  onBulkExport,
  enableInlineEdit = false,
  onCellValueChanged,
  onColumnVisibilityChanged,
  getContextMenuItems,
  rowSelectionType = 'multiple', // 'single' or 'multiple'
  singleClickEdit = false,
  stopEditingWhenCellsLoseFocus = true,
  getRowId,
}) {
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [clientPage, setClientPage] = useState(1);
  const gridRef = useRef(null);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const useClientPaging = clientSidePagination && !serverSidePagination;
  const effectiveOnPageChange = onPageChange ?? (useClientPaging ? setClientPage : undefined);
  const showPagination = Boolean(serverSidePagination || useClientPaging || effectiveOnPageChange || Array.isArray(rowData));

  const clientTotalRows = rowData?.length ?? 0;
  const clientTotalPages = Math.max(1, Math.ceil(clientTotalRows / pageSize) || 1);

  const resolvedCurrentPage = useClientPaging ? clientPage : currentPage;
  const resolvedTotalRows = useClientPaging ? clientTotalRows : totalRows;
  const resolvedTotalPages = useClientPaging ? clientTotalPages : (totalPages || 1);

  const displayedRowData = useMemo(() => {
    if (!useClientPaging || !rowData?.length) return rowData;
    const start = (clientPage - 1) * pageSize;
    return rowData.slice(start, start + pageSize);
  }, [useClientPaging, rowData, clientPage, pageSize]);

  const headerH = isMobile ? 40 : 44;
  const rowH = isMobile ? 44 : 48;
  const visibleRowCount = displayedRowData?.length ?? 0;
  const rowsForHeight = Math.min(pageSize, Math.max(visibleRowCount, 1));
  const gridHeight = headerH + rowH * rowsForHeight + 6;
  const needsVerticalScroll = visibleRowCount > 0 && visibleRowCount >= rowsForHeight;

  useEffect(() => {
    if (useClientPaging && clientPage > clientTotalPages) {
      setClientPage(1);
    }
  }, [useClientPaging, clientPage, clientTotalPages]);

  useEffect(() => {
    if (useClientPaging) setClientPage(1);
  }, [useClientPaging, rowData?.length, quickFilterText]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: false,
    resizable: !isMobile,
    suppressMovable: true,
    wrapText: false,
    autoHeight: false,
    cellClass: 'ag-cell-aligned',
    editable: enableInlineEdit,
    tooltipValueGetter: (params) => params.value,
    minWidth: isMobile ? 72 : 80,
  }), [enableInlineEdit, isMobile]);

  const handleExport = () => {
    if (onExportClick) {
      onExportClick();
    } else if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `${exportFileName}.csv`,
      });
    }
  };

  const handleSelectionChanged = () => {
    if (gridRef.current?.api) {
      const selected = gridRef.current.api.getSelectedRows();
      setSelectedRows(selected);
      if (onSelectionChanged) {
        onSelectionChanged(selected);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    if (onBulkDelete) {
      onBulkDelete(selectedRows);
    }
  };

  const handleBulkExport = () => {
    if (selectedRows.length === 0) return;
    if (onBulkExport) {
      onBulkExport(selectedRows);
    } else if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `${exportFileName}-selected.csv`,
        onlySelected: true,
      });
    }
  };

  const handleAutoSizeAll = () => {
    if (gridRef.current?.api) {
      const allColumnIds = [];
      gridRef.current.api.getColumns().forEach((column) => {
        allColumnIds.push(column.getId());
      });
      gridRef.current.api.autoSizeColumns(allColumnIds, false);
    }
  };

  const toggleColumnVisibility = (field) => {
    if (gridRef.current?.api) {
      const column = gridRef.current.api.getColumn(field);
      if (column) {
        const isVisible = column.isVisible();
        gridRef.current.api.setColumnsVisible([field], !isVisible);
        setColumnVisibility(prev => ({ ...prev, [field]: !isVisible }));
        if (onColumnVisibilityChanged) {
          onColumnVisibilityChanged(field, !isVisible);
        }
      }
    }
  };

  const defaultContextMenuItems = useMemo(() => {
    if (getContextMenuItems) {
      return getContextMenuItems;
    }
    
    return (params) => {
      const result = [
        {
          name: 'کتل',
          icon: '<span class="ag-icon ag-icon-eye"></span>',
          action: () => {
            if (onRowClicked) {
              onRowClicked({ data: params.node.data });
            }
          },
        },
        'separator',
        {
          name: 'کاپي کول',
          icon: '<span class="ag-icon ag-icon-copy"></span>',
          action: () => {
            if (params.value) {
              navigator.clipboard.writeText(params.value);
            }
          },
        },
        'separator',
        {
          name: 'ستون اوټو سایز',
          icon: '<span class="ag-icon ag-icon-columns"></span>',
          action: () => handleAutoSizeAll(),
        },
        'export',
      ];
      
      return result;
    };
  }, [getContextMenuItems, onRowClicked]);

  const hasSizedColumns = useRef(false);

  useEffect(() => {
    hasSizedColumns.current = false;
  }, [columnDefs]);

  // Initialize column visibility state
  useEffect(() => {
    if (gridRef.current?.api && columnDefs) {
      const visibility = {};
      columnDefs.forEach(col => {
        if (col.field) {
          visibility[col.field] = col.hide !== true;
        }
      });
      setColumnVisibility(visibility);
    }
  }, [columnDefs]);

  // Pagination helpers
  const from =
    resolvedTotalRows === 0 ? 0 : (resolvedCurrentPage - 1) * pageSize + 1;
  const to = Math.min(resolvedCurrentPage * pageSize, resolvedTotalRows);

  const pageNumbers = useMemo(() => {
    if (resolvedTotalPages <= 7) {
      return Array.from({ length: resolvedTotalPages }, (_, i) => i + 1);
    }
    const pages = new Set([1, resolvedTotalPages, resolvedCurrentPage]);
    if (resolvedCurrentPage > 1) pages.add(resolvedCurrentPage - 1);
    if (resolvedCurrentPage < resolvedTotalPages) pages.add(resolvedCurrentPage + 1);
    return [...pages].sort((a, b) => a - b);
  }, [resolvedTotalPages, resolvedCurrentPage]);

  const handlePageChange = (nextPage) => {
    if (effectiveOnPageChange) effectiveOnPageChange(nextPage);
  };

  const responsiveColumnDefs = useMemo(() => {
    if (!isMobile) return columnDefs;
    return columnDefs.map((col) => {
      if (col.field === "actions" || col.pinned || col.checkboxSelection) {
        return { ...col, pinned: col.pinned ?? (enableRtl ? "right" : "left") };
      }
      if (col.hideOnMobile) {
        return { ...col, hide: true };
      }
      return {
        ...col,
        flex: col.flex ?? 1,
        minWidth: col.minWidth ?? 88,
      };
    });
  }, [columnDefs, isMobile, enableRtl]);

  const enhancedColumnDefs = useMemo(() => {
    const base = responsiveColumnDefs;
    if (!enableRowSelection) return base;

    return [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 44,
        minWidth: 44,
        maxWidth: 44,
        pinned: enableRtl ? "right" : "left",
        lockPosition: true,
        suppressMovable: true,
        sortable: false,
        filter: false,
        resizable: false,
        headerName: "",
      },
      ...base,
    ];
  }, [responsiveColumnDefs, enableRowSelection, enableRtl]);

  return (
    <div className={cn("modern-table-container", isMobile && "modern-table-container--mobile")}>
      {/* Toolbar */}
      <div className="modern-table-toolbar">
        <div className="toolbar-search">
          <Search className="search-icon" />
          <input
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            placeholder={searchPlaceholder}
            className="search-input"
          />
        </div>

        <div className="toolbar-actions">
          {/* Selection Actions */}
          {enableRowSelection && selectedRows.length > 0 && (
            <>
              <span className="selected-count">
                {selectedRows.length} غوره شوي
              </span>
              {onBulkExport && (
                <button
                  onClick={handleBulkExport}
                  className="action-btn action-btn-primary"
                  title="غوره شوي ډاونلوډ"
                >
                  <FileDown className="btn-icon" />
                  <span>ډاونلوډ</span>
                </button>
              )}
              {onBulkDelete && (
                <button
                  onClick={handleBulkDelete}
                  className="action-btn action-btn-danger"
                  title="غوره شوي حذف"
                >
                  <Trash2 className="btn-icon" />
                  <span>حذف</span>
                </button>
              )}
            </>
          )}

          {/* Auto-size button */}
          <button
            onClick={handleAutoSizeAll}
            className="action-btn"
            title="ستون اوټو سایز"
          >
            <Settings className="btn-icon" />
          </button>

          {/* Column visibility menu */}
          <div className="column-menu-wrapper">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="action-btn"
              title="ستونونه"
            >
              <Eye className="btn-icon" />
            </button>
            {showColumnMenu && (
              <div className="column-menu">
                <div className="column-menu-header">
                  <span>ستونونه</span>
                  <button onClick={() => setShowColumnMenu(false)} className="close-btn">×</button>
                </div>
                <div className="column-menu-items">
                  {responsiveColumnDefs.filter(col => col.field && col.headerName).map((col) => (
                    <label key={col.field} className="column-menu-item">
                      <input
                        type="checkbox"
                        checked={columnVisibility[col.field] !== false}
                        onChange={() => toggleColumnVisibility(col.field)}
                      />
                      <span>{col.headerName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {enableExport && (
            <button
              onClick={handleExport}
              disabled={loading || exportLoading || !rowData?.length}
              className="action-btn"
            >
              {exportLoading ? (
                <>
                  <span className="btn-spinner" />
                  <span>Excel</span>
                </>
              ) : (
                <>
                  <Download className="btn-icon" />
                  <span>Excel</span>
                </>
              )}
            </button>
          )}
          {onPdfClick && (
            <button
              onClick={onPdfClick}
              disabled={loading || pdfLoading || !rowData?.length}
              className="action-btn"
            >
              {pdfLoading ? (
                <>
                  <span className="btn-spinner" />
                  <span>PDF</span>
                </>
              ) : (
                <>
                  <Download className="btn-icon" />
                  <span>PDF</span>
                </>
              )}
            </button>
          )}
          {toolbar}
        </div>
      </div>

      {/* AG-Grid Table */}
      <div
        className={`modern-ag-grid ${enableRtl ? "rtl-mode" : ""} ${isMobile ? "modern-ag-grid--mobile" : ""}`}
        style={{ height: gridHeight }}
      >
        {loading ? (
          <div className="table-overlay">
            <div className="overlay-spinner"></div>
          </div>
        ) : !rowData || rowData.length === 0 ? (
          <div className="table-overlay">{emptyText}</div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={displayedRowData}
            getRowId={getRowId}
            columnDefs={enhancedColumnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            onRowClicked={onRowClicked}
            onSortChanged={onSortChanged}
            onSelectionChanged={handleSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            domLayout="normal"
            rowHeight={isMobile ? 44 : 48}
            headerHeight={isMobile ? 40 : 44}
            animateRows={false}
            enableRtl={enableRtl}
            suppressPaginationPanel={true}
            suppressCellFocus={!enableInlineEdit}
            singleClickEdit={enableInlineEdit || singleClickEdit}
            stopEditingWhenCellsLoseFocus={stopEditingWhenCellsLoseFocus}
            enterNavigatesVertically={enableInlineEdit}
            enterNavigatesVerticallyAfterEdit={enableInlineEdit}
            suppressColumnVirtualisation={!enableInlineEdit}
            suppressRowVirtualisation={true}
            suppressHorizontalScroll={false}
            alwaysShowHorizontalScroll={isMobile}
            alwaysShowVerticalScroll={needsVerticalScroll}
            suppressColumnMoveAnimation
            rowSelection={enableRowSelection ? rowSelectionType : undefined}
            suppressRowClickSelection={enableRowSelection}
            getContextMenuItems={defaultContextMenuItems}
            onGridReady={(params) => {
              if (!isMobile && !hasSizedColumns.current) {
                params.api.sizeColumnsToFit();
                hasSizedColumns.current = true;
              }
            }}
            onFirstDataRendered={(params) => {
              if (!isMobile && !hasSizedColumns.current) {
                params.api.sizeColumnsToFit();
                hasSizedColumns.current = true;
              }
            }}
          />
        )}
      </div>

      {/* Custom Pagination — server-side or client-side */}
      {showPagination && (
        <div className="modern-table-pagination">
          <p className="pagination-text">
            {resolvedTotalRows === 0
              ? "هیڅ ریکارډ نشته"
              : `${from}–${to} له ${resolvedTotalRows.toLocaleString()} ریکارډونو`}
          </p>

          <div className="pagination-buttons">
            <button
              onClick={() => handlePageChange(resolvedCurrentPage - 1)}
              disabled={resolvedCurrentPage === 1 || loading}
              className="page-btn"
              aria-label="previous page"
            >
              <ChevronLeft className="page-icon" />
            </button>

            {pageNumbers.map((pageNum, idx) => {
              const prev = pageNumbers[idx - 1];
              const showEllipsis = prev && pageNum - prev > 1;
              return (
                <span key={pageNum} className="page-item">
                  {showEllipsis && <span className="page-ellipsis">…</span>}
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`page-btn ${pageNum === resolvedCurrentPage ? "active" : ""}`}
                  >
                    {pageNum}
                  </button>
                </span>
              );
            })}

            <button
              onClick={() => handlePageChange(resolvedCurrentPage + 1)}
              disabled={resolvedCurrentPage === resolvedTotalPages || loading}
              className="page-btn"
              aria-label="next page"
            >
              <ChevronRight className="page-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

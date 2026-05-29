import { AgGridTable } from "./AgGridTable";

/**
 * AgGridTable with server-side pagination enabled by default when `pagination` prop is passed.
 * Prefer useServerPagination() hook and spread gridProps:
 *
 *   const pg = useServerPagination();
 *   <PaginatedAgGridTable {...pg.gridProps} columnDefs={...} rowData={rows} />
 */
export function PaginatedAgGridTable({
  pagination: paginationState,
  page,
  onPageChange,
  pageSize,
  serverSidePagination,
  ...rest
}) {
  const hasPaginationConfig =
    paginationState != null || onPageChange != null || serverSidePagination === true;

  const resolved = paginationState
    ? {
        serverSidePagination: true,
        pageSize: paginationState.limit ?? pageSize,
        totalRows: paginationState.total ?? 0,
        currentPage: page ?? paginationState.page ?? 1,
        totalPages: paginationState.totalPages ?? 1,
        onPageChange: onPageChange ?? rest.onPageChange,
      }
    : {
        serverSidePagination: serverSidePagination ?? hasPaginationConfig,
        pageSize,
        totalRows: rest.totalRows,
        currentPage: page ?? rest.currentPage,
        totalPages: rest.totalPages,
        onPageChange,
      };

  return (
    <AgGridTable
      {...rest}
      {...resolved}
      serverSidePagination={resolved.serverSidePagination !== false && hasPaginationConfig}
    />
  );
}

export default PaginatedAgGridTable;

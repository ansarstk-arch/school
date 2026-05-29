/** Default page size for list tables across the ERP */
export const DEFAULT_PAGE_SIZE = 12;

export const PAGE_SIZE_OPTIONS = [10, 12, 20, 50];

/**
 * Normalize API pagination shapes into one client format.
 * Supports: { page, limit, total, totalPages }, { currentPage, totalRecords, totalPages }, { pages }
 */
export function normalizePagination(pagination, fallbackLimit = DEFAULT_PAGE_SIZE) {
  if (!pagination) {
    return {
      total: 0,
      page: 1,
      limit: fallbackLimit,
      totalPages: 1,
    };
  }

  const limit = Number(pagination.limit ?? fallbackLimit) || fallbackLimit;
  const total = Number(
    pagination.total ?? pagination.totalRecords ?? pagination.count ?? 0
  );
  const page = Number(pagination.page ?? pagination.currentPage ?? 1) || 1;
  const totalPages = Math.max(
    1,
    Number(
      pagination.totalPages ??
        pagination.pages ??
        (total > 0 ? Math.ceil(total / limit) : 1)
    )
  );

  return { total, page, limit, totalPages };
}

/** Query params for list API calls */
export function buildPaginationQuery(page, limit = DEFAULT_PAGE_SIZE) {
  return {
    page: Number(page) || 1,
    limit: Number(limit) || DEFAULT_PAGE_SIZE,
  };
}

/** Props to spread onto AgGridTable / PaginatedAgGridTable */
export function getGridPaginationProps({
  pagination,
  page,
  onPageChange,
  pageSize,
}) {
  const meta = normalizePagination(pagination, pageSize);
  return {
    serverSidePagination: true,
    pageSize: meta.limit,
    totalRows: meta.total,
    currentPage: page ?? meta.page,
    totalPages: meta.totalPages,
    onPageChange,
  };
}

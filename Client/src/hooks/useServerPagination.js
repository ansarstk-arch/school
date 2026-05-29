import { useState, useCallback, useMemo } from "react";
import {
  DEFAULT_PAGE_SIZE,
  normalizePagination,
  buildPaginationQuery,
  getGridPaginationProps,
} from "@/utils/pagination";

/**
 * Reusable server-side pagination state for list pages + AgGridTable.
 *
 * @example
 * const pg = useServerPagination({ limit: 12 });
 * const res = await api.list({ ...filters, ...pg.queryParams });
 * pg.applyPagination(res.data.pagination);
 * <AgGridTable {...pg.gridProps} rowData={rows} />
 */
export function useServerPagination({ initialPage = 1, limit: initialLimit = DEFAULT_PAGE_SIZE } = {}) {
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState(() =>
    normalizePagination({ page: initialPage, limit: initialLimit, total: 0, totalPages: 1 }, initialLimit)
  );

  const applyPagination = useCallback(
    (apiPagination) => {
      setPagination(normalizePagination(apiPagination, initialLimit));
    },
    [initialLimit]
  );

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const queryParams = useMemo(
    () => buildPaginationQuery(page, pagination.limit ?? initialLimit),
    [page, pagination.limit, initialLimit]
  );

  const gridProps = useMemo(
    () =>
      getGridPaginationProps({
        pagination,
        page,
        onPageChange: setPage,
        pageSize: pagination.limit ?? initialLimit,
      }),
    [pagination, page, initialLimit]
  );

  return {
    page,
    setPage,
    pagination,
    setPagination,
    applyPagination,
    resetPage,
    queryParams,
    gridProps,
    limit: pagination.limit ?? initialLimit,
  };
}

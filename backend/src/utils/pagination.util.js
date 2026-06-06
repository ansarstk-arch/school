/**
 * Shared server-side pagination helpers for list endpoints.
 */

export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;

export function parsePaginationQuery(query = {}, defaultLimit = DEFAULT_PAGE_LIMIT) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginationMeta(total, page, limit) {
  const safeTotal = Number(total) || 0;
  const safeLimit = Number(limit) || DEFAULT_PAGE_LIMIT;
  const safePage = Number(page) || 1;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit) || 1);

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages,
    // Aliases for clients that expect fee-style keys
    currentPage: safePage,
    totalRecords: safeTotal,
    pages: totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export function paginateArray(items, page, limit) {
  const { offset, limit: lim } = parsePaginationQuery({ page, limit }, limit);
  const list = Array.isArray(items) ? items : [];
  return {
    items: list.slice(offset, offset + lim),
    pagination: buildPaginationMeta(list.length, page, lim),
  };
}

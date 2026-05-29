/** Safe AFN display — avoids crash when value is undefined/null */
export const formatAfn = (value) =>
  `AFN ${Number(value ?? 0).toLocaleString()}`;

export { normalizePagination, DEFAULT_PAGE_SIZE, buildPaginationQuery, getGridPaginationProps } from "./pagination";

/** Map GET /salaries/statistics response to stat card fields */
export const mapSalaryStatistics = (raw) => ({
  count: raw?.totalSalaries ?? 0,
  totalNet: raw?.totalNetSalary ?? 0,
  totalPaid: raw?.totalPaid ?? 0,
  totalPending: raw?.totalPending ?? 0,
  paidCount: raw?.paidCount ?? 0,
  pendingCount: raw?.pendingCount ?? 0,
});

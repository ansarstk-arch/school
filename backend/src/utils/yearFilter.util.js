import { and, gte, lte, sql } from "drizzle-orm";
import { shamsiMonthToGregorianRange, currentShamsiYear } from "./shamsiDate.util.js";

/** Gregorian ISO range for a Shamsi academic year (Hamal 1 → Hut last day). */
export function shamsiYearToGregorianRange(jy) {
  const year = Number(jy) || currentShamsiYear();
  const { start } = shamsiMonthToGregorianRange(year, 1);
  const { end } = shamsiMonthToGregorianRange(year, 12);
  return { start, end };
}

/** Drizzle condition: column value falls within the given Shamsi year. */
export function columnInShamsiYear(column, jy) {
  const { start, end } = shamsiYearToGregorianRange(jy);
  return and(gte(column, start), lte(column, end));
}

/** SQL fragment for raw column references. */
export function sqlColumnInShamsiYear(column, jy) {
  const { start, end } = shamsiYearToGregorianRange(jy);
  return sql`${column} >= ${start} AND ${column} <= ${end}`;
}

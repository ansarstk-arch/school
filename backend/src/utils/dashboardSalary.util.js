/** Parse institution type JSON array from staff/teacher records */
export const parseInstitutionTypes = (jsonStr) => {
  if (!jsonStr) return ["School"];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return ["School"];
    return parsed.filter((t) => ["School", "Center", "Madrasa"].includes(t));
  } catch {
    return ["School"];
  }
};

/**
 * Allocate salary for dashboard view.
 * - "all": full salary per role (staff vs teacher kept separate)
 * - specific type: salary divided by number of institution types the person belongs to
 */
export const allocateSalaryForView = (salary, types, viewType) => {
  const amount = Number(salary) || 0;
  if (amount <= 0) return 0;

  const validTypes = parseInstitutionTypes(
    Array.isArray(types) ? JSON.stringify(types) : types
  );

  if (viewType === "all") return amount;
  if (!validTypes.includes(viewType)) return 0;
  return amount / validTypes.length;
};

export const sumSalariesFromRows = (rows, typeField, viewType) => {
  return rows.reduce((sum, row) => {
    return sum + allocateSalaryForView(row.salary, row[typeField], viewType);
  }, 0);
};

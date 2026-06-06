export const INSTITUTIONS = ["School", "Center", "Madrasa"];

export const MODULE_KEYS = [
  "dashboard",
  "dashboard_school",
  "dashboard_center",
  "dashboard_madrasa",
  "students",
  "teachers",
  "staff",
  "parents",
  "classes",
  "subjects",
  "attendance",
  "exams",
  "marks",
  "promotions",
  "certificates",
  "id_cards",
  "expenses",
  "revenue",
  "inventory",
  "salaries",
  "sms",
  "reports",
];

const ALL_MODULES = Object.fromEntries(MODULE_KEYS.map((k) => [k, true]));
const ALL_INSTITUTIONS = Object.fromEntries(INSTITUTIONS.map((k) => [k, true]));

export const buildAdminPermissions = () => ({
  modules: { ...ALL_MODULES },
  institutions: { ...ALL_INSTITUTIONS },
});

export const parsePermissions = (raw, role = "user") => {
  if (role === "admin") {
    return buildAdminPermissions();
  }

  let parsed = {};
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      parsed = {};
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw;
  }

  if (!parsed.modules && !parsed.institutions) {
    const modules = { ...parsed };
    if (modules.fees && !modules.revenue) modules.revenue = true;
    return {
      modules,
      institutions: { ...ALL_INSTITUTIONS },
      profile: parsed.profile || {},
    };
  }

  return {
    modules: parsed.modules || {},
    institutions: parsed.institutions || {},
    profile: parsed.profile || {},
  };
};

export const serializePermissions = ({ modules, institutions, profile }) =>
  JSON.stringify({
    modules: modules || {},
    institutions: institutions || {},
    profile: profile || {},
  });

export const canAccessModule = (permissions, role, moduleKey) => {
  if (role === "admin") return true;
  const { modules } = parsePermissions(permissions, role);
  return Boolean(modules?.[moduleKey]);
};

export const canAccessInstitution = (permissions, role, institution) => {
  if (role === "admin") return true;
  const { institutions } = parsePermissions(permissions, role);
  if (!institutions || Object.keys(institutions).length === 0) return true;
  return Boolean(institutions?.[institution]);
};

export const getAllowedInstitutions = (permissions, role) => {
  if (role === "admin") return [...INSTITUTIONS];
  const { institutions } = parsePermissions(permissions, role);
  const allowed = INSTITUTIONS.filter((inst) => institutions?.[inst]);
  return allowed.length > 0 ? allowed : [...INSTITUTIONS];
};

export const assertInstitutionAccess = (permissions, role, institution) => {
  if (!institution) return;
  if (!canAccessInstitution(permissions, role, institution)) {
    const err = new Error("تاسو د دې ادارې لپاره اجازه نلرئ");
    err.statusCode = 403;
    throw err;
  }
};

/** Scope list/query APIs to institutions the user may access */
export const resolveInstitutionFilter = (permissions, role, requestedInstitution) => {
  const allowed = getAllowedInstitutions(permissions, role);

  if (requestedInstitution) {
    assertInstitutionAccess(permissions, role, requestedInstitution);
    return { value: requestedInstitution, allowed };
  }

  if (allowed.length > 0 && allowed.length < INSTITUTIONS.length) {
    return { value: null, allowed };
  }

  return { value: null, allowed: [...INSTITUTIONS] };
};

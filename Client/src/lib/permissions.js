export const INSTITUTIONS = [
  { key: "School", label: "ښوونځی" },
  { key: "Center", label: "سینټر" },
  { key: "Madrasa", label: "مدرسه" },
];

export const MODULES = [
  { key: "dashboard", label: "ډیشبورډ (ټول)", desc: "د ټولو ادارو لنډیز", group: "dashboard" },
  { key: "dashboard_school", label: "د ښوونځي ډیشبورډ", desc: "یوازې د ښوونځي راپورونه", group: "dashboard" },
  { key: "dashboard_center", label: "د سینټر ډیشبورډ", desc: "یوازې د سینټر راپورونه", group: "dashboard" },
  { key: "dashboard_madrasa", label: "د مدرسې ډیشبورډ", desc: "یوازې د مدرسې راپورونه", group: "dashboard" },
  { key: "students", label: "زده کوونکي", desc: "ثبت، کتل، سمول، ړنګول", group: "academic" },
  { key: "teachers", label: "ښوونکي", desc: "ثبت، کتل، سمول، ړنګول", group: "academic" },
  { key: "staff", label: "کارمندان", desc: "د کارمندانو او لاسرسي اداره", group: "academic" },
  { key: "parents", label: "د والدینو نمبرونه", desc: "د والدینو اړیکې", group: "academic" },
  { key: "classes", label: "ټولګي", desc: "ثبت، کتل، سمول", group: "academic" },
  { key: "subjects", label: "مضامین", desc: "ثبت، کتل، سمول", group: "academic" },
  { key: "attendance", label: "حاضري", desc: "د حاضرۍ ثبت او کتل", group: "academic" },
  { key: "exams", label: "ازموینې", desc: "د ازموینو اداره", group: "academic" },
  { key: "marks", label: "نمرې", desc: "د نمرو داخلول او راپورونه", group: "academic" },
  { key: "promotions", label: "ترفیع", desc: "د زده کوونکو ترفیع", group: "academic" },
  { key: "certificates", label: "سندونه", desc: "جوړول او چاپ", group: "documents" },
  { key: "id_cards", label: "پېژندنې کارتونه", desc: "د پېژندنې کارتونه", group: "documents" },
  { key: "expenses", label: "لګښتونه", desc: "د لګښتونو ثبت", group: "finance" },
  { key: "revenue", label: "عاید او فیسونه", desc: "د فیسونو اداره", group: "finance" },
  { key: "inventory", label: "سټاک", desc: "د قرطاسیې او توکو سټاک", group: "finance" },
  { key: "salaries", label: "معاش او پیشکي", desc: "د معاشونو اداره", group: "finance" },
  { key: "sms", label: "پیغام رسونه (SMS)", desc: "SMS سیسټم", group: "communication" },
  { key: "reports", label: "راپورونه", desc: "د سیسټم راپورونه", group: "reports" },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

const ALL_MODULES = Object.fromEntries(MODULE_KEYS.map((k) => [k, true]));
const ALL_INSTITUTIONS = Object.fromEntries(INSTITUTIONS.map((i) => [i.key, true]));

export const ROUTE_PERMISSIONS = {
  "/dashboard": "dashboard",
  "/students": "students",
  "/teachers": "teachers",
  "/parent-numbers": "parents",
  "/parents": "parents",
  "/staff": "staff",
  "/classes": "classes",
  "/subjects": "subjects",
  "/attendance/students": "attendance",
  "/attendance/staff": "attendance",
  "/attendance/settings": "attendance",
  "/exams": "exams",
  "/marks/config": "marks",
  "/marks/entry": "marks",
  "/marks/list": "marks",
  "/marks/result-prep": "marks",
  "/marks/itla-nama": "marks",
  "/promotions/class": "promotions",
  "/promotions/single": "promotions",
  "/promotions/history": "promotions",
  "/certificates": "certificates",
  "/id-cards": "id_cards",
  "/expenses": "expenses",
  "/inventory": "inventory",
  "/revenue": "revenue",
  "/salaries": "salaries",
  "/sms/parents": "sms",
  "/sms/templates": "sms",
  "/sms/reports": "sms",
  "/sms/settings": "sms",
  "/reports": "reports",
};

export const ROLE_PRESETS = {
  admin: {
    label: "مدیر",
    variant: "destructive",
    modules: { ...ALL_MODULES },
    institutions: { ...ALL_INSTITUTIONS },
  },
  registrar: {
    label: "ثبت نام",
    variant: "info",
    modules: {
      dashboard: true,
      students: true,
      parents: true,
      classes: true,
      attendance: true,
      revenue: true,
    },
    institutions: { School: true, Center: false, Madrasa: false },
  },
  accountant: {
    label: "محاسب",
    variant: "warning",
    modules: {
      dashboard: true,
      expenses: true,
      revenue: true,
      salaries: true,
      reports: true,
    },
    institutions: { ...ALL_INSTITUTIONS },
  },
  teacher: {
    label: "ښوونکی",
    variant: "info",
    modules: {},
    institutions: { School: true, Center: false, Madrasa: false },
  },
  custom: {
    label: "ځانګړی",
    variant: "muted",
    modules: {},
    institutions: { School: true, Center: false, Madrasa: false },
  },
};

export const buildAdminPermissions = () => ({
  modules: { ...ALL_MODULES },
  institutions: { ...ALL_INSTITUTIONS },
});

export const parsePermissions = (raw, role = "user") => {
  if (role === "admin") return buildAdminPermissions();

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

/** Modules that can be read when user has the parent module (e.g. classes for students) */
export const MODULE_FETCH_DEPENDENCIES = {
  students: ["classes", "teachers", "parents"],
  classes: ["teachers"],
  attendance: ["classes", "students", "teachers", "staff"],
  subjects: ["classes"],
  exams: ["classes", "subjects"],
  marks: ["classes", "subjects", "exams", "students"],
  revenue: ["students", "classes"],
  id_cards: ["students", "teachers", "staff", "classes"],
  promotions: ["students", "classes"],
  parents: ["classes"],
  sms: ["students", "parents"],
};

export const canAccessModule = (permissions, role, moduleKey) => {
  if (role === "admin") return true;
  const { modules } = parsePermissions(permissions, role);
  return Boolean(modules?.[moduleKey]);
};

export const canAccessModuleOrDependency = (permissions, role, targetModule, parentModule) => {
  if (canAccessModule(permissions, role, targetModule)) return true;
  if (!parentModule || !canAccessModule(permissions, role, parentModule)) return false;
  return (MODULE_FETCH_DEPENDENCIES[parentModule] || []).includes(targetModule);
};

export const canAccessInstitution = (permissions, role, institution) => {
  if (role === "admin") return true;
  const { institutions } = parsePermissions(permissions, role);
  if (!institutions || Object.keys(institutions).length === 0) return true;
  return Boolean(institutions?.[institution]);
};

export const getAllowedInstitutions = (permissions, role) => {
  if (role === "admin") return INSTITUTIONS.map((i) => i.key);
  const { institutions } = parsePermissions(permissions, role);
  const allowed = INSTITUTIONS.filter((i) => institutions?.[i.key]).map((i) => i.key);
  return allowed.length > 0 ? allowed : INSTITUTIONS.map((i) => i.key);
};

export const getRoutePermission = (pathname) => {
  const entry = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  return entry?.[1] || null;
};

export const hasDashboardAccess = (permissions, role) => {
  if (role === "admin") return true;
  return ["dashboard", "dashboard_school", "dashboard_center", "dashboard_madrasa"]
    .some((m) => canAccessModule(permissions, role, m));
};

export const getDefaultHomeRoute = (user) => {
  if (!user) return "/";
  if (user.role === "teacher") return "/teacher/dashboard";

  const order = [
    ["/dashboard", "dashboard"],
    ["/students", "students"],
    ["/revenue", "revenue"],
    ["/attendance/students", "attendance"],
    ["/teachers", "teachers"],
    ["/reports", "reports"],
  ];

  for (const [route, module] of order) {
    if (module === "dashboard" && hasDashboardAccess(user.permissions, user.role)) return route;
    if (canAccessModule(user.permissions, user.role, module)) return route;
  }

  for (const [route, module] of Object.entries(ROUTE_PERMISSIONS)) {
    if (canAccessModule(user.permissions, user.role, module)) return route;
  }

  return "/dashboard";
};

export const getDashboardViews = (permissions, role) => {
  if (role === "admin") return ["all", "school", "center", "madrasa"];

  const views = [];
  const { modules } = parsePermissions(permissions, role);
  const inst = getAllowedInstitutions(permissions, role);

  if (modules.dashboard) views.push("all");
  if (modules.dashboard_school && inst.includes("School")) views.push("school");
  if (modules.dashboard_center && inst.includes("Center")) views.push("center");
  if (modules.dashboard_madrasa && inst.includes("Madrasa")) views.push("madrasa");

  if (views.length === 0) {
    if (inst.includes("School")) views.push("school");
    else if (inst.includes("Center")) views.push("center");
    else if (inst.includes("Madrasa")) views.push("madrasa");
  }

  return views;
};

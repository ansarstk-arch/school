import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  canAccessModule,
  canAccessModuleOrDependency,
  canAccessInstitution,
  getAllowedInstitutions,
  getDashboardViews,
  parsePermissions,
} from "@/lib/permissions";

export function usePermissions() {
  const user = useStore((s) => s.user);

  return useMemo(() => {
    const role = user?.role;
    const permissions = user?.permissions;
    const parsed = parsePermissions(permissions, role);

    return {
      user,
      role,
      permissions: parsed,
      isAdmin: role === "admin",
      isTeacher: role === "teacher",
      can: (moduleKey) => canAccessModule(permissions, role, moduleKey),
      canFetch: (targetModule, parentModule) =>
        canAccessModuleOrDependency(permissions, role, targetModule, parentModule),
      canInstitution: (institution) => canAccessInstitution(permissions, role, institution),
      allowedInstitutions: getAllowedInstitutions(permissions, role),
      dashboardViews: getDashboardViews(permissions, role),
    };
  }, [user]);
}

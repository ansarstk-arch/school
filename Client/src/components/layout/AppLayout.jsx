import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useStore } from "@/store/useStore";
import { GlobalQrAttendanceListener } from "@/components/erp/GlobalQrAttendanceListener";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {isAuthenticated && <GlobalQrAttendanceListener />}
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileOpen */}
      <div className={`
        fixed inset-y-0 right-0 z-50 lg:static lg:z-auto
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar collapsed={collapsed} onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) setMobileOpen((o) => !o);
            else setCollapsed((c) => !c);
          }}
        />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden min-w-0 max-w-full safe-area-bottom">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

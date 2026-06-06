import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, BookText,
  CalendarCheck, FileBarChart, Award, IdCard, Receipt,
  Wallet, FileSpreadsheet, GanttChart, ChevronDown, X, UsersRound, UserCog, ChevronRight, DollarSign,
  ClipboardPen, TrendingUp, MessageSquare, Package, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { useStore } from "@/store/useStore";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

const adminItems = [
  { to: "/dashboard", label: "ډیشبورډ", icon: LayoutDashboard, permission: "dashboard" },
  { to: "/students", label: "زده کونکي", icon: Users, permission: "students" },
  { to: "/teachers", label: "ښونکي", icon: GraduationCap, permission: "teachers" },
  { to: "/parent-numbers", label: "د والدینو نمبرونه", icon: UsersRound, permission: "parents" },
  { to: "/staff", label: "کارمندان", icon: UserCog, permission: "staff" },
  { to: "/classes", label: "ټولګي", icon: BookOpen, permission: "classes" },
  { to: "/subjects", label: "مضامین", icon: BookText, permission: "subjects" },
  {
    label: "حاضري",
    icon: CalendarCheck,
    permission: "attendance",
    hasDropdown: true,
    children: [
      { to: "/attendance/students", label: "د زده کوونکو حاضري", permission: "attendance" },
      { to: "/attendance/staff", label: "د کارمندانو حاضري", permission: "attendance" },
      { to: "/attendance/settings", label: "د حاضرۍ تنظیمات", permission: "attendance" },
    ],
  },
  { to: "/exams", label: "ازمویني", icon: FileBarChart, permission: "exams" },
  {
    label: "نمرې",
    icon: ClipboardPen,
    permission: "marks",
    hasDropdown: true,
    children: [
      { to: "/marks/config", label: "د مضامینو تنظیم", permission: "marks" },
      { to: "/marks/entry", label: "د نمرو داخلول", permission: "marks" },
      { to: "/marks/list", label: "د نمرو لیست", permission: "marks" },
      { to: "/marks/result-prep", label: "د پایلو چمتووالی", permission: "marks" },
      { to: "/marks/itla-nama", label: "اطلاع نامې", permission: "marks" },
    ],
  },
  {
    label: "ترفیع",
    icon: TrendingUp,
    permission: "promotions",
    hasDropdown: true,
    children: [
      { to: "/promotions/class", label: "د ټولګي ترفیع", permission: "promotions" },
      { to: "/promotions/single", label: "انفرادي ترفیع", permission: "promotions" },
      { to: "/promotions/history", label: "د ترفیعاتو تاریخچه", permission: "promotions" },
    ],
  },
  { to: "/certificates", label: "سندونه", icon: Award, permission: "certificates" },
  { to: "/id-cards", label: "پېژندنې کارتونه", icon: IdCard, permission: "id_cards" },
  { to: "/expenses", label: "لګښتونه", icon: Receipt, permission: "expenses" },
  { to: "/inventory", label: "د قرطاسیې او توکو سټاک", icon: Package, permission: "inventory" },
  { to: "/revenue", label: "عاید او فیسونه", icon: Wallet, permission: "revenue" },
  { to: "/salaries", label: "معاش او پیشکي", icon: DollarSign, permission: "salaries" },
  {
    label: "پیغام رسونه (SMS)",
    icon: MessageSquare,
    permission: "sms",
    hasDropdown: true,
    children: [
      { to: "/sms/parents", label: "د مور او پلار پیغامونه", permission: "sms" },
      { to: "/sms/templates", label: "پیغام کالبدونه", permission: "sms" },
      { to: "/sms/reports", label: "راپورونه او تاریخچه", permission: "sms" },
      { to: "/sms/settings", label: "تنظیمات", permission: "sms" },
    ],
  },
  { to: "/reports", label: "راپورونه", icon: FileSpreadsheet, permission: "reports" },
];

const teacherItems = [
  { to: "/teacher/dashboard", label: "ډیشبورډ", icon: LayoutDashboard, permission: null },
];

function LockedNavItem({ to, label, allowed, end, className, onNavigate }) {
  const navigate = useNavigate();

  if (allowed) {
    return (
      <NavLink to={to} end={end} className={className} onClick={onNavigate}>
        {label}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toast.error("تاسو د دې برخې لپاره اجازه نلرئ")}
      className={cn(className, "opacity-50 cursor-not-allowed w-full text-right")}
    >
      <span className="flex items-center gap-2">
        <Lock className="size-3 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}

export function Sidebar({ collapsed, onClose }) {
  const session = useStore((s) => s.session);
  const user = useStore((s) => s.user);
  const { can, isAdmin } = usePermissions();
  const items = user?.role === "teacher" ? teacherItems : adminItems;
  const navRef = useRef(null);
  const [atBottom, setAtBottom] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const location = useLocation();

  const canAccess = (permission) => {
    if (!permission || isAdmin) return true;
    if (permission === "dashboard") {
      return can("dashboard") || can("dashboard_school") || can("dashboard_center") || can("dashboard_madrasa");
    }
    return can(permission);
  };

  const visibleItems = items
    .map((item) => {
      if (item.hasDropdown) {
        const children = (item.children || []).filter((c) => canAccess(c.permission));
        if (children.length === 0) return null;
        return { ...item, children };
      }
      return canAccess(item.permission) ? item : null;
    })
    .filter(Boolean);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const check = () => setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    check();
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, []);

  useEffect(() => {
    if (!collapsed) {
      items.forEach((item, index) => {
        if (item.hasDropdown && item.children) {
          const isActive = item.children.some((child) => location.pathname.startsWith(child.to));
          if (isActive) setOpenDropdown(index);
        }
      });
    }
  }, [location.pathname, collapsed, items]);

  const childLinkClass = (isActive, allowed) => cn(
    "flex items-center gap-3 pr-12 pl-4 py-2 text-[12px] font-medium border-l-2 transition-colors",
    allowed && isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary-foreground"
      : allowed
        ? "text-sidebar-foreground/70 border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        : "text-sidebar-foreground/40 border-l-transparent"
  );

  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen sticky top-0 flex flex-col transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="h-14 px-4 flex items-center gap-2 border-b border-sidebar-border shrink-0">
        <div className="size-8 rounded bg-primary-foreground text-primary flex items-center justify-center font-bold shrink-0">
          <GanttChart className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{APP_NAME}</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">کال {session}</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="lg:hidden ml-auto p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/70">
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-visible py-2" style={{ scrollbarWidth: "none" }}>
        {visibleItems.map((it, index) => {
          const Icon = it.icon;

          if (it.hasDropdown) {
            const isOpen = collapsed ? hoveredDropdown === index : openDropdown === index;
            const isAnyChildActive = it.children?.some((child) => location.pathname.startsWith(child.to));
            const parentAllowed = canAccess(it.permission);

            return (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => collapsed && setHoveredDropdown(index)}
                onMouseLeave={() => collapsed && setHoveredDropdown(null)}
              >
                <button
                  onClick={() => {
                    if (collapsed) setHoveredDropdown(hoveredDropdown === index ? null : index);
                    else setOpenDropdown(isOpen ? null : index);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium border-l-2 transition-colors",
                    isAnyChildActive && parentAllowed
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary-foreground"
                      : "text-sidebar-foreground/80 border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    !parentAllowed && "opacity-70"
                  )}
                  title={it.label}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-right">{it.label}</span>
                      {!parentAllowed && <Lock className="size-3 shrink-0 opacity-60" />}
                      <ChevronRight className={cn("size-3 shrink-0 transition-transform", isOpen && "rotate-90")} />
                    </>
                  )}
                </button>

                {!collapsed && isOpen && it.children && (
                  <div className="bg-sidebar-accent/30">
                    {it.children.map((child) => {
                      const allowed = canAccess(child.permission);
                      return (
                        <LockedNavItem
                          key={child.to}
                          to={child.to}
                          label={child.label}
                          allowed={allowed}
                          className={childLinkClass(location.pathname.startsWith(child.to), allowed)}
                        />
                      );
                    })}
                  </div>
                )}

                {collapsed && hoveredDropdown === index && it.children && (
                  <div className="absolute right-full top-0 mr-1 min-w-[220px] bg-sidebar border border-sidebar-border rounded-md shadow-lg z-[60]">
                    {it.children.map((child) => {
                      const allowed = canAccess(child.permission);
                      return (
                        <LockedNavItem
                          key={child.to}
                          to={child.to}
                          label={child.label}
                          allowed={allowed}
                          onNavigate={() => setHoveredDropdown(null)}
                          className={cn(
                            childLinkClass(location.pathname.startsWith(child.to), allowed),
                            "first:rounded-t-md last:rounded-b-md px-4"
                          )}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const allowed = canAccess(it.permission);
          const isActive = location.pathname === it.to || (it.to !== "/dashboard" && location.pathname.startsWith(`${it.to}/`));

          if (!allowed) {
            return (
              <button
                key={it.to}
                type="button"
                onClick={() => toast.error("تاسو د دې برخې لپاره اجازه نلرئ")}
                className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium border-l-2 border-l-transparent text-sidebar-foreground/50 opacity-60 cursor-not-allowed"
                title={it.label}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-right">{it.label}</span>
                    <Lock className="size-3 shrink-0" />
                  </>
                )}
              </button>
            );
          }

          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/dashboard" || it.to === "/teacher/dashboard"}
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-[13px] font-medium border-l-2 transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary-foreground"
                  : "text-sidebar-foreground/80 border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
              title={it.label}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{it.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!atBottom && (
        <button
          onClick={() => navRef.current?.scrollTo({ top: navRef.current.scrollHeight, behavior: "smooth" })}
          className={cn(
            "flex items-center justify-center py-2 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors",
            collapsed ? "px-0" : "px-4 gap-2"
          )}
        >
          <ChevronDown className="size-4 shrink-0" />
          {!collapsed && <span className="text-[11px]">ښکته</span>}
        </button>
      )}

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50 shrink-0">
          افغان سافتویر
        </div>
      )}
    </aside>
  );
}

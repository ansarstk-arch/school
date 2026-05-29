import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, BookText,
  CalendarCheck, FileBarChart, Award, IdCard, Receipt,
  Wallet,   FileSpreadsheet, GanttChart, ChevronDown, X, UsersRound, UserCog, ChevronRight, DollarSign,
  ClipboardPen, TrendingUp, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { useStore } from "@/store/useStore";
import { todayAfghan } from "@/lib/afghan-date";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "ډیشبورډ", icon: LayoutDashboard },
  { to: "/students", label: "زده کونکي", icon: Users },
  { to: "/teachers", label: "ښونکي", icon: GraduationCap },
  { to: "/parents",  label: "والدین",   icon: UsersRound },
  { to: "/staff",    label: "کارمندان", icon: UserCog },
  { to: "/classes", label: "ټولګي", icon: BookOpen },
  { to: "/subjects", label: "مضامین", icon: BookText },
  { 
    label: "حاضري", 
    icon: CalendarCheck,
    hasDropdown: true,
    children: [
      { to: "/attendance/students", label: "د زده کوونکو حاضري" },
      { to: "/attendance/staff", label: "د کارمندانو حاضري" },
      { to: "/attendance/settings", label: "د حاضرۍ تنظیمات" },
    ]
  },
  { to: "/exams", label: "ازمویني", icon: FileBarChart },
  {
    label: "نمرې",
    icon: ClipboardPen,
    hasDropdown: true,
    children: [
      { to: "/marks/config", label: "د مضامینو تنظیم" },
      { to: "/marks/entry", label: "د نمرو داخلول" },
      { to: "/marks/list", label: "د نمرو لیست" },
      { to: "/marks/result-prep", label: "د پایلو چمتووالی" },
      { to: "/marks/itla-nama", label: "اطلاع نامې" },
    ],
  },
  {
    label: "ترفیع",
    icon: TrendingUp,
    hasDropdown: true,
    children: [
      { to: "/promotions/class", label: "د ټولګي ترفیع" },
      { to: "/promotions/single", label: "انفرادي ترفیع" },
      { to: "/promotions/history", label: "د ترفیعاتو تاریخچه" },
    ],
  },
  { to: "/certificates", label: "سندونه", icon: Award },
  { to: "/id-cards", label: "پېژندنې کارتونه", icon: IdCard },
  { to: "/expenses", label: "لګښتونه", icon: Receipt },
  { to: "/revenue", label: "عاید او فیسونه", icon: Wallet },
  { to: "/salaries", label: "معاش او پیشکي", icon: DollarSign },
  {
    label: "پیغام رسونه (SMS)",
    icon: MessageSquare,
    hasDropdown: true,
    children: [
      { to: "/sms/parents", label: "د مور او پلار پیغامونه" },
      { to: "/sms/templates", label: "پیغام کالبدونه" },
      { to: "/sms/reports", label: "راپورونه او تاریخچه" },
      { to: "/sms/settings", label: "تنظیمات" },
    ],
  },
  { to: "/reports", label: "راپورونه", icon: FileSpreadsheet },
];

export function Sidebar({ collapsed, onClose }) {
  const session = useStore((s) => s.session);
  const navRef = useRef(null);
  const [atBottom, setAtBottom] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const check = () => setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    check();
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, []);

  // Auto-open dropdown if current path matches (only when not collapsed)
  useEffect(() => {
    if (!collapsed) {
      items.forEach((item, index) => {
        if (item.hasDropdown && item.children) {
          const isActive = item.children.some(child => location.pathname.startsWith(child.to));
          if (isActive) {
            setOpenDropdown(index);
          }
        }
      });
    }
  }, [location.pathname, collapsed]);

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
        {/* Mobile close button */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden ml-auto p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/70">
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto overflow-x-visible py-2"
        style={{ scrollbarWidth: "none", overflowX: "visible" }}
      >
        {items.map((it, index) => {
          const Icon = it.icon;
          
          // Dropdown item
          if (it.hasDropdown) {
            const isOpen = collapsed ? hoveredDropdown === index : openDropdown === index;
            const isAnyChildActive = it.children?.some(child => location.pathname.startsWith(child.to));
            
            return (
              <div 
                key={index}
                className="relative"
                onMouseEnter={() => collapsed && setHoveredDropdown(index)}
                onMouseLeave={() => collapsed && setHoveredDropdown(null)}
              >
                <button
                  onClick={() => {
                    if (collapsed) {
                      setHoveredDropdown(hoveredDropdown === index ? null : index);
                    } else {
                      setOpenDropdown(isOpen ? null : index);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium border-l-2 transition-colors",
                    isAnyChildActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary-foreground"
                      : "text-sidebar-foreground/80 border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                  title={it.label}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-right">{it.label}</span>
                      <ChevronRight className={cn(
                        "size-3 shrink-0 transition-transform",
                        isOpen && "rotate-90"
                      )} />
                    </>
                  )}
                </button>
                
                {/* Dropdown children - inline when expanded */}
                {!collapsed && isOpen && it.children && (
                  <div className="bg-sidebar-accent/30">
                    {it.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 pr-12 pl-4 py-2 text-[12px] font-medium border-l-2 transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary-foreground"
                            : "text-sidebar-foreground/70 border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <span className="truncate">{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
                
                {/* Dropdown children - popup when collapsed */}
                {collapsed && hoveredDropdown === index && it.children && (
                  <div className="absolute right-full top-0 mr-1 min-w-[220px] bg-sidebar border border-sidebar-border rounded-md shadow-lg z-[60]">
                    {it.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => setHoveredDropdown(null)}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 px-4 py-2 text-[12px] font-medium border-l-2 transition-colors first:rounded-t-md last:rounded-b-md",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary-foreground"
                            : "text-sidebar-foreground/70 border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <span className="truncate">{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          // Regular item
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/dashboard"}
              className={({ isActive }) => cn(
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

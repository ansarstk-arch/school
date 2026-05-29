import { Bell, ChevronDown, LogOut, Menu, Search, Sun, Moon, KeyRound, User2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import { SESSIONS } from "@/constants";
import { todayAfghan } from "@/lib/afghan-date";
import { ErpModal } from "@/components/erp/ErpModal";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

function UserMenu({ onChangePw }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { logout, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("وتل بریالی شو");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.message || "د وتلو کې تېروتنه");
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded hover:bg-muted">
        <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
          {getInitials(user?.name)}
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-md shadow-lg z-50 py-1">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium">{user?.name || "کارمند"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
            <User2 className="size-4" /> پروفایل
          </button>
          <button onClick={() => { setOpen(false); onChangePw(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
            <KeyRound className="size-4" /> پاسورډ بدلول
          </button>
          <div className="border-t border-border my-1" />
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-destructive">
            <LogOut className="size-4" /> وتل
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onToggleSidebar }) {
  const { session, setSession, scope, setScope, dateMode, setDateMode, dark, setDark, changePassword } = useStore();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const handleChangePassword = async () => {
    // Validation
    if (!pw.currentPassword || !pw.newPassword || !pw.confirm) {
      toast.error("ټول برخې ډکې کړئ");
      return;
    }

    if (pw.newPassword.length < 6) {
      toast.error("نوی پاسورډ باید لږ تر لږه ۶ توري ولري");
      return;
    }

    if (pw.newPassword !== pw.confirm) {
      toast.error("نوی پاسورډ او تایید سره سم نه دي");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success("پاسورډ بدل شو");
      setPwOpen(false);
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (error) {
      toast.error(error.message || "د پاسورډ بدلولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="h-14 sticky top-0 z-30 bg-card border-b border-border flex items-center px-3 gap-3">
        <button onClick={onToggleSidebar} className="p-2 rounded hover:bg-muted" aria-label="toggle sidebar">
          <Menu className="size-4" />
        </button>

        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            placeholder="لټون..."
            className="pl-8 pr-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-72"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
            <span className="hidden xl:block text-xs text-muted-foreground border border-input rounded px-2 py-1.5 bg-background select-none shrink-0">{todayAfghan()}</span>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="text-xs border border-input bg-background rounded px-2 py-1.5 shrink-0">
              <option value="All">ټول</option>
              <option value="School">ښوونځی</option>
              <option value="Center">مرکز</option>
              <option value="Madrasa">مدرسه</option>
            </select>

            <select value={session} onChange={(e) => setSession(e.target.value)} className="text-xs border border-input bg-background rounded px-2 py-1.5 shrink-0">
              {SESSIONS.map((s) => <option key={s} value={s}>کال {s}</option>)}
            </select>

            <select value={dateMode} onChange={(e) => setDateMode(e.target.value)} className="hidden sm:block text-xs border border-input bg-background rounded px-2 py-1.5 shrink-0">
              <option value="shamsi">لمریز</option>
              <option value="gregorian">میلادي</option>
            </select>

            <button onClick={() => setDark(!dark)} className="p-2 rounded hover:bg-muted shrink-0">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button className="p-2 rounded hover:bg-muted relative shrink-0">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
            </button>
          </div>

          <UserMenu onChangePw={() => setPwOpen(true)} />
        </div>
      </header>

      <ErpModal open={pwOpen} onOpenChange={setPwOpen} title="پاسورډ بدلول" size="sm"
        footer={
          <>
            <button onClick={() => setPwOpen(false)} disabled={loading} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted disabled:opacity-50">لغوه</button>
            <button onClick={handleChangePassword} disabled={loading} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50">
              {loading ? "په پروسس کې..." : "ساتل"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Input 
            type="password" 
            label="اوسنی پاسورډ" 
            value={pw.currentPassword} 
            handleChanges={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} 
            disabled={loading}
          />
          <Input 
            type="password" 
            label="نوی پاسورډ" 
            value={pw.newPassword} 
            handleChanges={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} 
            disabled={loading}
          />
          <Input 
            type="password" 
            label="تایید" 
            value={pw.confirm} 
            handleChanges={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} 
            disabled={loading}
          />
        </div>
      </ErpModal>
    </>
  );
}

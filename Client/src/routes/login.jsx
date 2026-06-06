import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { getDefaultHomeRoute } from "@/lib/permissions";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading, error, clearError } = useStore();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultHomeRoute(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!formData.identifier?.trim() || !formData.password) {
      toast.error("ټول برخې ډکې کړئ");
      return;
    }

    try {
      const result = await login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });
      toast.success(result.message || "ننوتل بریالی شو");
      navigate(getDefaultHomeRoute(result.user), { replace: true });
    } catch (err) {
      toast.error(err.message || "د ننوتلو کې تېروتنه");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">سرتاچ حیفي خصوصي ښونځي او وړکتون</h1>
          <p className="mt-2 text-sm text-muted-foreground">۹ ناحیه کندهار</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-semibold text-foreground">ننوتل</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-foreground">
                بریښنالیک یا کارن نوم
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="بریښنالیک یا کارن نوم (ښوونکي/کارمند)"
                disabled={isLoading}
                autoComplete="username"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                dir="ltr"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                پاسورډ
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="خپل پاسورډ ولیکئ"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={showPassword ? "پاسورډ پټول" : "پاسورډ ښودل"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>په پروسس کې...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>ننوتل</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>سرتاچ حیفي خصوصي ښونځي او وړکتون © {new Date().getFullYear()}</p>
            <p className="mt-1">۹ ناحیه کندهار</p>
            <p className="mt-2 text-[10px]">
              پیش فرض: admin@school.af / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

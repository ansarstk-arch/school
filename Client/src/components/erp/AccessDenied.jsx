import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";
import { getDefaultHomeRoute } from "@/lib/permissions";
import { useStore } from "@/store/useStore";

export function AccessDenied() {
  const user = useStore((s) => s.user);
  const home = getDefaultHomeRoute(user);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="size-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">لاسرسی نشته</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        تاسو د دې برخې لپاره اجازه نلرئ. د لاسرسي لپاره له مدیر سره اړیکه ونیسئ.
      </p>
      <Link
        to={home}
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        کور پاڼې ته ورګرځئ
      </Link>
    </div>
  );
}

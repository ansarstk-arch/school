import { cn } from "@/lib/utils";

export function Badge({ variant = "muted", children, className }) {
  const map = {
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    info: "bg-info/10 text-info border-info/30",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border", map[variant], className)}>
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Helper function to adjust font size based on number length
const getFontSizeForValue = (value) => {
  const str = String(value).replace(/[^0-9]/g, '');
  const len = str.length;
  if (len >= 7) return 'text-xs';
  if (len >= 6) return 'text-sm';
  if (len >= 5) return 'text-base';
  return 'text-xl sm:text-2xl';
};

export function StatCard({ 
  label, 
  value, 
  hint, 
  icon, 
  trend, 
  className, 
  accent = "default",
  onClick,
  navigateTo,
  clickable = false
}) {
  const navigate = useNavigate();
  
  const accentMap = {
    default: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning",
    info: "border-l-info",
    destructive: "border-l-destructive",
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (navigateTo) {
      navigate(navigateTo);
    }
  };

  const fontSize = getFontSizeForValue(value);

  const cardContent = (
    <>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{label}</p>
        <p className={cn(fontSize, "font-semibold mt-1 text-foreground truncate")}>{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? "▲" : "▼"} {trend.value}%
          </p>
        )}
      </div>
      {icon && <div className="text-muted-foreground/70 shrink-0">{icon}</div>}
    </>
  );

  if (clickable || onClick || navigateTo) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "bg-card border border-border rounded-md p-4 border-l-4 flex items-start justify-between gap-3 w-full text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
          accentMap[accent],
          className
        )}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-md p-4 border-l-4 flex items-start justify-between gap-3", accentMap[accent], className)}>
      {cardContent}
    </div>
  );
}

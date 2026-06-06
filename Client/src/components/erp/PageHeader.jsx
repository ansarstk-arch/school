export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-stretch sm:items-center gap-2 flex-wrap w-full sm:w-auto shrink-0 [&>button]:min-h-[40px] sm:[&>button]:min-h-0">{actions}</div>
      )}
    </div>
  );
}

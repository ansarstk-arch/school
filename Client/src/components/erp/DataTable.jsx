import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export function DataTable({
  columns, data, searchKeys, pageSize = 10, toolbar, emptyText = "No records found",
  loading, rowKey, onRowClick,
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q || !searchKeys?.length) return data;
    const s = q.toLowerCase();
    return data.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(s)));
  }, [data, q, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-card border border-border rounded-md">
      <div className="p-3 flex items-center justify-between gap-3 border-b border-border flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            handleChanges={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="لټون…"
            className="pl-8 pr-3 py-1.5 w-full"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">{toolbar}</div>
      </div>
      <div className="overflow-x-auto">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="erp-table w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-muted-foreground">
                {columns.map((c) => (
                  <th key={c.key} className={cn("px-3 py-2 font-medium text-xs uppercase tracking-wider border-b border-border", c.className)} style={{ width: c.width }}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {columns.map((c) => (
                        <td key={c.key} className="px-3 py-3">
                          <div className="h-3 bg-muted animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : pageData.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center text-muted-foreground py-12 text-sm">{emptyText}</td>
                  </tr>
                )
                : pageData.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn("border-b border-border last:border-0 hover:bg-muted/40 transition-colors", onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-3 py-2.5 text-foreground", c.className)}>
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border flex-wrap gap-2">
        <div className="shrink-0">{filtered.length} څخه {pageData.length} ښودل شوي</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border border-input rounded hover:bg-muted disabled:opacity-40">وړاندې</button>
          <span className="px-2 whitespace-nowrap">مخ {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 border border-input rounded hover:bg-muted disabled:opacity-40">بله</button>
        </div>
      </div>
    </div>
  );
}

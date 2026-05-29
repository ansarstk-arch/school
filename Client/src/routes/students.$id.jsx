import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/erp/PageHeader";
import { Badge } from "@/components/erp/Badge";
import { StatCard } from "@/components/erp/StatCard";

export default function StudentDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-4">
      <PageHeader
        title="د زده کوونکي پروفایل"
        subtitle={`ID: ${id}`}
        actions={
          <>
            <Link to="/students" className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted">← شاته</Link>
            <button className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted">د پېژندنې کارت</button>
            <button className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5">د شمولیت فورمه</button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-md p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">عکس</div>
            <div>
              <p className="font-semibold">— —</p>
              <p className="text-xs text-muted-foreground">ID: {id}</p>
              <Badge variant="info" className="mt-1">ښوونځی</Badge>
            </div>
          </div>
          <div className="space-y-1.5 text-sm border-t border-border pt-3">
            {["د پلار نوم","د نیکه نوم","ټولګی","ټېلیفون","پته","میاشتنی فیس"].map((k) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-muted-foreground text-xs">{k}</span>
                <span className="text-foreground">—</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats + tables */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="ورکړل شوی فیس" value="—" accent="success" />
            <StatCard label="پاتې پور" value="—" accent="destructive" />
            <StatCard label="حاضري" value="—" accent="info" />
            <StatCard label="ازموینې" value="—" />
          </div>

          <div className="bg-card border border-border rounded-md">
            <div className="px-4 py-3 border-b border-border"><h3 className="font-semibold text-sm">د فیسونو تاریخچه</h3></div>
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">د بیک اینډ سره وصل شئ</div>
          </div>

          <div className="bg-card border border-border rounded-md">
            <div className="px-4 py-3 border-b border-border"><h3 className="font-semibold text-sm">د ازموینو تاریخچه</h3></div>
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">د بیک اینډ سره وصل شئ</div>
          </div>
        </div>
      </div>
    </div>
  );
}

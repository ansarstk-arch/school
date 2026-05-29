import { PageHeader } from "@/components/erp/PageHeader";
import { StatCard } from "@/components/erp/StatCard";
import { FilterBar } from "@/components/erp/FilterBar";
import { FileSpreadsheet, Users, Wallet, Receipt, GraduationCap, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { SESSIONS, ACTIVE_SESSION } from "@/constants";

const reports = [
  { icon: Users, title: "د زده کوونکو راپور", desc: "غوره، کمزوري او د فعالیت ډلبندي" },
  { icon: GraduationCap, title: "د ښوونکو راپور", desc: "معاش، ټولګي او فعالیت" },
  { icon: CalendarCheck, title: "د حاضرۍ راپور", desc: "ورځني/اونیز/میاشتني/کلني" },
  { icon: Wallet, title: "د عاید راپور", desc: "د فیسونو راټولول، پور او روند" },
  { icon: Receipt, title: "د لګښتونو راپور", desc: "د ډول، میاشتنی او کلنی" },
  { icon: FileSpreadsheet, title: "د ازموینو شننه", desc: "د ټولګیو منځنۍ نمرې او غوره زده کوونکي" },
];

const REPORT_FILTERS = [
  {
    key: "type", label: "د راپور ډول", type: "select",
    options: [
      { value: "students", label: "زده کوونکي" },
      { value: "teachers", label: "ښوونکي" },
      { value: "attendance", label: "حاضري" },
      { value: "revenue", label: "عاید" },
      { value: "expenses", label: "لګښتونه" },
      { value: "exams", label: "ازموینې" },
    ],
  },
  {
    key: "year", label: "تعلیمي کال", type: "select",
    options: SESSIONS.map((s) => ({ value: s, label: s })),
  },
  { key: "dateFrom", label: "له نېټې", type: "date" },
  { key: "dateTo", label: "تر نېټې", type: "date" },
];

const REPORT_DEFAULTS = { year: ACTIVE_SESSION };

export default function ReportsPage() {
  const [filters, setFilters] = useState(REPORT_DEFAULTS);
  return (
    <div className="space-y-4">
      <PageHeader title="راپورونه" subtitle="د کاري راپورونو جوړول او صادرول" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="ټول عاید" value="—" accent="success" />
        <StatCard label="ټول لګښت" value="—" accent="warning" />
        <StatCard label="خالص" value="—" accent="info" />
      </div>

      <FilterBar
        filters={REPORT_FILTERS}
        defaultValues={REPORT_DEFAULTS}
        onApply={setFilters}
        onClear={() => setFilters({})}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {reports.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-md p-4 flex items-start gap-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded bg-muted flex items-center justify-center shrink-0">
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs border border-input rounded px-3 py-1 hover:bg-muted">کتل</button>
                  <button className="text-xs border border-input rounded px-3 py-1 hover:bg-muted">PDF</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

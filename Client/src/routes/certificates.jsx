import { PageHeader } from "@/components/erp/PageHeader";
import { FilterBar } from "@/components/erp/FilterBar";
import { Award } from "lucide-react";
import { useState } from "react";
import { SESSIONS, ACTIVE_SESSION } from "@/constants";

const TYPE_MAP = {
  Achievement: "د لاسته راوړنې",
  Completion: "د بشپړتیا",
  Exam: "د ازموینې",
  Appreciation: "د قدردانۍ",
};

const CERT_FILTERS = [
  { key: "student", label: "زده کوونکی", type: "input", placeholder: "د نوم لټون..." },
  {
    key: "type", label: "د سند ډول", type: "select",
    options: Object.entries(TYPE_MAP).map(([v, l]) => ({ value: v, label: l })),
  },
  { key: "classId", label: "ټولګی", type: "input", placeholder: "ټولګی..." },
  {
    key: "year", label: "تعلیمي کال", type: "select",
    options: SESSIONS.map((s) => ({ value: s, label: s })),
  },
];

const CERT_DEFAULTS = { year: ACTIVE_SESSION };

export default function CertificatesPage() {
  const [filters, setFilters] = useState(CERT_DEFAULTS);
  return (
    <div className="space-y-4">
      <PageHeader title="سندونه" subtitle="د لاسته راوړنو، بشپړتیا، ازموینې او قدردانۍ سندونه جوړول" />

      <div className="bg-card border border-border rounded-md p-3 flex items-center gap-3 flex-wrap">
        <select className="text-sm border border-input rounded px-2 py-1.5 bg-background">
          {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v} سند</option>)}
        </select>
        <button className="text-xs border border-input rounded px-3 py-1.5 hover:bg-muted mr-auto">
          د ټولګي لپاره ډله ییز جوړول
        </button>
      </div>

      <FilterBar
        filters={CERT_FILTERS}
        defaultValues={CERT_DEFAULTS}
        onApply={setFilters}
        onClear={() => setFilters({})}
      />

      <div className="bg-card border border-border rounded-md p-8 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Award className="size-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-sm">هیڅ زده کوونکی نشته</p>
        <p className="text-xs text-muted-foreground mt-1">د بیک اینډ سره وصل شئ — زده کوونکي به دلته ښکاره شي</p>
      </div>
    </div>
  );
}

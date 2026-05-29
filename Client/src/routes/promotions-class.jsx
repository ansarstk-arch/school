import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { Input } from "@/components/ui/Input";
import { Users, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as promotionApi from "@/data/promotionApi";
import { getAllClasses } from "@/data/classApi";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const INSTITUTION_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

export default function ClassPromotionPage() {
  const session = useStore((s) => s.session);
  const [academicYear, setAcademicYear] = useState(session || String(currentShamsiYear()));
  const [institutionType, setInstitutionType] = useState("School");
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toAcademicYear, setToAcademicYear] = useState(String(Number(academicYear) + 1));
  const [remarks, setRemarks] = useState("");

  const [fromClasses, setFromClasses] = useState([]);
  const [toClasses, setToClasses] = useState([]);
  const [loadingFrom, setLoadingFrom] = useState(false);
  const [loadingTo, setLoadingTo] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Load FROM classes when type or year changes
  useEffect(() => {
    loadFromClasses();
  }, [institutionType, academicYear]);

  // Load TO classes when target year changes
  useEffect(() => {
    if (toAcademicYear) {
      loadToClasses();
    }
  }, [institutionType, toAcademicYear]);

  const loadFromClasses = async () => {
    if (!academicYear) return;
    
    setLoadingFrom(true);
    try {
      const res = await getAllClasses({
        type: institutionType,
        academicYear,
        limit: 100,
      });
      
      const classList = res.data?.classes || [];
      console.log("✅ FROM Classes loaded:", classList.length, "classes");
      setFromClasses(classList);
    } catch (error) {
      console.error("❌ Error loading FROM classes:", error);
      toast.error("د ټولګیو په ترلاسه کولو کې تېروتنه");
      setFromClasses([]);
    } finally {
      setLoadingFrom(false);
    }
  };

  const loadToClasses = async () => {
    if (!toAcademicYear) return;
    
    setLoadingTo(true);
    try {
      const res = await getAllClasses({
        type: institutionType,
        academicYear: toAcademicYear,
        limit: 100,
      });
      
      let classList = res.data?.classes || [];
      
      // If same year, exclude the from class
      if (toAcademicYear === academicYear && fromClassId) {
        classList = classList.filter(c => c.id !== Number(fromClassId));
      }
      
      console.log("✅ TO Classes loaded:", classList.length, "classes");
      setToClasses(classList);
    } catch (error) {
      console.error("❌ Error loading TO classes:", error);
      toast.error("د نوي ټولګیو په ترلاسه کولو کې تېروتنه");
      setToClasses([]);
    } finally {
      setLoadingTo(false);
    }
  };

  const handlePromote = async () => {
    if (!fromClassId) {
      toast.error("اوسنی ټولګی وټاکئ");
      return;
    }

    if (!toClassId) {
      toast.error("نوی ټولګی وټاکئ");
      return;
    }

    setPromoting(true);
    try {
      const res = await promotionApi.promoteWholeClass({
        fromClassId: Number(fromClassId),
        toClassId: Number(toClassId),
        toAcademicYear,
        remarks,
      });

      if (res.success) {
        toast.success(res.message || "ټولګی بریالیتوب سره ترفیع شو");
        setConfirmOpen(false);
        
        // Show summary
        const { promotedCount, repeatedCount, failedCount, totalStudents } = res.data;
        toast.info(
          `ټول: ${totalStudents} | ترفیع شوي: ${promotedCount} | تکرار: ${repeatedCount}${
            failedCount > 0 ? ` | ناکام: ${failedCount}` : ""
          }`,
          { duration: 5000 }
        );

        // Reset form
        setFromClassId("");
        setToClassId("");
        setRemarks("");
      }
    } catch (error) {
      toast.error(error.message || "د ترفیع کې ستونزه");
    } finally {
      setPromoting(false);
    }
  };

  const selectedFromClass = fromClasses.find((c) => c.id === Number(fromClassId));
  const selectedToClass = toClasses.find((c) => c.id === Number(toClassId));

  console.log("🔍 Debug:", {
    fromClassId,
    toClassId,
    fromClasses: fromClasses.length,
    toClasses: toClasses.length,
    selectedFromClass: selectedFromClass?.name,
    selectedToClass: selectedToClass?.name,
    showButton: !!(fromClassId && toClassId)
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="د ټولګي ترفیع"
        subtitle="د بشپړ ټولګي ټول زده کوونکي یوځای ترفیع کړئ"
      />

      <div className="bg-card border border-border rounded-md p-4 space-y-4">
        {/* Step 1: Select Institution Type and Current Class */}
        <div className="space-y-3">
          <p className="text-sm font-medium">۱ — ادارې ډول او اوسنی ټولګی وټاکئ</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <Input
                type="text"
                value={academicYear}
                handleChanges={(e) => setAcademicYear(e.target.value)}
                label="تعلیمي کال"
                placeholder="1403"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">ادارې ډول</span>
              <select
                className={SEL}
                value={institutionType}
                onChange={(e) => {
                  setInstitutionType(e.target.value);
                  setFromClassId("");
                  setToClassId("");
                }}
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">اوسنی ټولګی</span>
              <select
                className={SEL}
                value={fromClassId}
                onChange={(e) => {
                  setFromClassId(e.target.value);
                  setToClassId("");
                  // Reload target classes to exclude the new source
                  if (toAcademicYear) {
                    loadToClasses();
                  }
                }}
                disabled={loadingFrom}
              >
                <option value="">ټولګی وټاکئ</option>
                {fromClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section && `(${c.section})`}
                  </option>
                ))}
              </select>
              {loadingFrom && <p className="text-xs text-muted-foreground">لوډ کیږي...</p>}
            </div>
          </div>
        </div>

        {/* Step 2: Select Target Class - ALWAYS SHOW IF FROM CLASS IS SELECTED */}
        {fromClassId && (
          <>
            <div className="border-t" />
            
            <div className="space-y-3">
              <p className="text-sm font-medium">۲ — نوی تعلیمي کال او ټولګی وټاکئ</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Input
                    type="text"
                    value={toAcademicYear}
                    handleChanges={(e) => setToAcademicYear(e.target.value)}
                    label="نوی تعلیمي کال"
                    placeholder="1404"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">نوی ټولګی</span>
                  <select
                    className={SEL}
                    value={toClassId}
                    onChange={(e) => setToClassId(e.target.value)}
                    disabled={loadingTo}
                  >
                    <option value="">ټولګی وټاکئ</option>
                    {toClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section && `(${c.section})`}
                      </option>
                    ))}
                  </select>
                  {loadingTo && <p className="text-xs text-muted-foreground">لوډ کیږي...</p>}
                  {!loadingTo && toClasses.length === 0 && (
                    <p className="text-xs text-destructive">هیڅ ټولګی ونه موندل شو</p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  type="textarea"
                  value={remarks}
                  handleChanges={(e) => setRemarks(e.target.value)}
                  label="یادښت (اختیاري)"
                  placeholder="د ترفیع په اړه یادښت..."
                  rows={2}
                />
              </div>

              {/* PROMOTE BUTTON - SHOW IMMEDIATELY WHEN BOTH CLASSES SELECTED */}
              {toClassId && (
                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={promoting}
                    className="h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    ټولګی ترفیع کړئ
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <ErpModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="د ټولګي ترفیع تایید"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
              disabled={promoting}
            >
              لغوه
            </button>
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoting}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-50"
            >
              {promoting ? "ترفیع کیږي..." : "تایید او ترفیع"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <Badge variant="muted" className="text-sm">
                  {selectedFromClass?.name || "—"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{academicYear}</p>
              </div>

              <ArrowRight className="size-5 text-primary" />

              <div className="text-center">
                <Badge variant="info" className="text-sm">
                  {selectedToClass?.name || "—"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{toAcademicYear}</p>
              </div>
            </div>
          </div>

          <div className="p-3 border border-warning/20 bg-warning/5 rounded-lg text-sm">
            <p className="font-medium mb-2">ایا تاسو ډاډه یاست؟</p>
            <p className="text-muted-foreground text-xs">
              د <strong>{selectedFromClass?.name}</strong> ټولګي ټول زده کوونکي به{" "}
              <strong>{selectedToClass?.name}</strong> ته ترفیع شي. دا عمل د ټولو زده کوونکو
              معلومات به تازه کړي.
            </p>
          </div>
        </div>
      </ErpModal>
    </div>
  );
}

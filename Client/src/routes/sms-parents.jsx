import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, CheckCircle, XCircle, Filter, Users, AlertCircle, Smartphone } from "lucide-react";
import {
  getAbsentRecipients,
  getPresentRecipients,
  sendSmsSingle,
  getAllSmsTemplates,
  getSmsEndpoints,
} from "@/data/smsApi";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const BTN = "px-3 py-1.5 rounded text-xs font-medium transition-colors";
const BTN_PRIMARY = `${BTN} bg-primary text-primary-foreground hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

const toUserFriendlyError = (error) => {
  const msg = error?.message || error?.data?.message || "";
  if (
    msg.includes("Failed query:") ||
    msg.includes("SQLITE_") ||
    /\b(insert|update|delete)\s+into\b/i.test(msg)
  ) {
    return "پیغام لیږل شو، خو ریکارډ خوندي کولو کې ستونزه وه";
  }
  return msg || "د پیغام لیږلو کې تېروتنه";
};

const messageTypes = [
  { value: "Absent", label: "د غیر حاضرۍ پیغام", desc: "نن غیر حاضر زده کوونکي" },
  { value: "Present", label: "د حاضرۍ پیغام", desc: "چې غیر حاضر و او اوس حاضر شوی" },
];

const institutionTypes = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

export default function SmsParents() {
  const { allowedInstitutions } = usePermissions();
  const visibleInstitutionTypes = institutionTypes.filter((t) => allowedInstitutions.includes(t.value));
  const defaultInstitution = visibleInstitutionTypes[0]?.value || "School";

  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [templates, setTemplates] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [alreadySentCount, setAlreadySentCount] = useState(0);

  const [filters, setFilters] = useState({
    institutionType: defaultInstitution,
    messageType: "Absent",
    date: new Date().toISOString().split("T")[0],
  });

  const [selectedTemplate, setSelectedTemplate] = useState("");

  const configuredEndpoints = endpoints.filter((e) => e.apiUrl);

  useEffect(() => {
    fetchEndpoints();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!visibleInstitutionTypes.some((t) => t.value === filters.institutionType)) {
      setFilters((prev) => ({ ...prev, institutionType: defaultInstitution }));
    }
  }, [visibleInstitutionTypes, defaultInstitution, filters.institutionType]);

  const fetchEndpoints = async () => {
    try {
      const response = await getSmsEndpoints();
      const eps = response.data.endpoints || [];
      setEndpoints(eps);
      const first = eps.find((e) => e.apiUrl);
      if (first) setSelectedEndpoint(String(first.id));
    } catch (error) {
      console.error("Error fetching endpoints:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getAllSmsTemplates({ isActive: true });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    setRecipients([]);
    setSelectedRecipients([]);
    setAlreadySentCount(0);

    try {
      const params = { institutionType: filters.institutionType, date: filters.date };
      const response = filters.messageType === "Present"
        ? await getPresentRecipients(params)
        : await getAbsentRecipients(params);

      const list = response.data.recipients || [];
      setRecipients(list);
      setSelectedRecipients(list.map((r) => r.parentId));
      setAlreadySentCount(response.data.alreadySentCount || 0);

      if (list.length === 0) {
        toast.info(response.data.message || "هیڅ ترلاسه کوونکی ونه موندل شو");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "د ترلاسه کوونکو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  }, [filters.institutionType, filters.messageType, filters.date]);

  useEffect(() => {
    if (filters.institutionType && filters.messageType) fetchRecipients();
  }, [fetchRecipients]);

  useEffect(() => {
    setSelectedTemplate("");
  }, [filters.messageType]);

  const handleSelectAll = (checked) => {
    setSelectedRecipients(checked ? recipients.map((r) => r.parentId) : []);
  };

  const handleSelectRecipient = (parentId, checked) => {
    setSelectedRecipients((prev) =>
      checked ? [...prev, parentId] : prev.filter((id) => id !== parentId)
    );
  };

  const handleSendClick = () => {
    if (!selectedEndpoint) { toast.error("فون وټاکئ"); return; }
    if (configuredEndpoints.length === 0) { toast.error("لومړی د SMS تنظیمات کې فون API پته خوندي کړئ"); return; }
    if (selectedRecipients.length === 0) { toast.error("لږ تر لږه یو ترلاسه کوونکی وټاکئ"); return; }
    if (!selectedTemplate) { toast.error("کالبد (کی) وټاکئ"); return; }
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setSending(true);

    const selectedData = recipients.filter((r) => selectedRecipients.includes(r.parentId));
    const total = selectedData.length;
    setProgress({ current: 0, total: total || 1 });

    const results = { total, sent: 0, failed: 0, details: [], stoppedEarly: false, stopReason: null };
    let batchId = null;

    for (let i = 0; i < selectedData.length; i++) {
      const recipient = selectedData[i];
      setProgress({ current: i, total });

      try {
        const response = await sendSmsSingle({
          endpointId: Number(selectedEndpoint),
          messageType: filters.messageType,
          templateId: Number(selectedTemplate),
          recipient,
          attendanceDate: filters.date,
          batchId,
          additionalData: { date: new Date().toLocaleDateString("fa-AF") },
        });

        if (!batchId) batchId = response.data.batchId;

        setProgress({ current: i + 1, total });

        if (response.data.success) {
          results.sent++;
          results.details.push({ phone: recipient.parentPhone, status: "success", name: recipient.parentName });
        } else {
          results.failed++;
          results.details.push({
            phone: recipient.parentPhone,
            status: "failed",
            error: response.data.error,
            name: recipient.parentName,
          });

          if (response.data.isNetworkError) {
            results.stoppedEarly = true;
            results.stopReason = response.data.error;
            break;
          }
        }
      } catch (error) {
        const errMsg = toUserFriendlyError(error);
        results.failed++;
        results.details.push({ phone: recipient.parentPhone, status: "failed", error: errMsg, name: recipient.parentName });

        const isNet = errMsg?.includes("هاټسپاټ") || errMsg?.includes("انټرنیټ") || errMsg?.includes("اتصال")
          || errMsg?.includes("VPN") || errMsg?.includes("سرور");
        if (isNet) {
          results.stoppedEarly = true;
          results.stopReason = errMsg;
          break;
        }
      }
    }

    setSendResult(results);
    setResultDialogOpen(true);
    setSending(false);
    setProgress({ current: 0, total: 0 });

    if (results.stoppedEarly) {
      toast.error(results.stopReason || "د اتصال ستونزه — نور پیغامونه و نه لیږل شول");
    } else {
      toast.success(`لیږل شوي: ${results.sent}، ناکام: ${results.failed}`);
    }

    fetchRecipients();
  };

  const filteredTemplates = templates.filter((t) => t.templateType === filters.messageType);
  const progressPct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="د مور او پلار پیغامونه"
        subtitle="د زده کوونکو مور او پلار ته SMS لیږئ"
      />

      {configuredEndpoints.length === 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-900">
            د SMS تنظیمات نه دي جوړ شوي. لومړی د تنظیماتو پاڼې ته لاړ شئ او فون API پته خوندي کړئ.
          </p>
        </div>
      )}

      {/* Network instruction */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900">
          د پیغام لیږلو دمخه ډاډ ترلاسه کړئ چې ستاسو کمپیوټر او فون په <strong>وای فای</strong> یا <strong>هاټسپاټ</strong> سره وصل دي.
          <strong> VPN مه کاروئ</strong> — VPN فعال وي نو SMS لیږل ناکام کیږي.
          که SMS سرور بند وي نو د سمې تېروتنې پیغام به وښودل شي.
        </p>
      </div>

      {/* Phone selector */}
      <div className="bg-card border rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          <h3 className="text-base font-semibold">فون وټاکئ</h3>
        </div>
        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className={SEL}
        >
          <option value="">فون وټاکئ</option>
          {configuredEndpoints.map((ep) => (
            <option key={ep.id} value={ep.id}>{ep.name}</option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-base font-semibold">فلټرونه</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">د موسسې ډول</label>
            <select
              value={filters.institutionType}
              onChange={(e) => setFilters((prev) => ({ ...prev, institutionType: e.target.value }))}
              className={SEL}
            >
              {visibleInstitutionTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">د پیغام ډول</label>
            <select
              value={filters.messageType}
              onChange={(e) => setFilters((prev) => ({ ...prev, messageType: e.target.value }))}
              className={SEL}
            >
              {messageTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {messageTypes.find((t) => t.value === filters.messageType)?.desc}
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">نیټه</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              className={SEL}
            />
          </div>
        </div>
      </div>

      {/* Template selector (key) */}
      {filteredTemplates.length > 0 && (
        <div className="bg-card border rounded-md p-4 space-y-3">
          <h3 className="text-base font-semibold">کالبد (کی) وټاکئ</h3>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className={SEL}
          >
            <option value="">کالبد وټاکئ</option>
            {filteredTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.templateName}</option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="text-xs text-muted-foreground p-2 bg-muted rounded">
              {filteredTemplates.find((t) => String(t.id) === selectedTemplate)?.messagePs}
            </p>
          )}
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900">
          د دې پیغام ډول لپاره کالبد نشته. لومړی د کالبدونو پاڼې ته لاړ شئ.
        </div>
      )}

      {/* Recipients */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="text-base font-semibold">ترلاسه کوونکي ({recipients.length})</h3>
            {alreadySentCount > 0 && filters.messageType === "Absent" && (
              <Badge variant="muted">{alreadySentCount} دمخه لیږل شوي</Badge>
            )}
          </div>
          {recipients.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedRecipients.length === recipients.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <label className="text-xs">ټول وټاکئ</label>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {filters.messageType === "Absent"
              ? "نن غیر حاضر زده کوونکي ونه موندل شول (یا دمخه لیږل شوي)"
              : "د حاضرۍ پیغام لپاره زده کوونکي ونه موندل شول"}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recipients.map((recipient) => (
              <div key={`${recipient.parentId}-${recipient.studentId}`} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent">
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(recipient.parentId)}
                  onChange={(e) => handleSelectRecipient(recipient.parentId, e.target.checked)}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{recipient.parentName}</div>
                  <div className="text-sm text-muted-foreground">
                    زده کوونکی: {recipient.studentName} — {recipient.className}
                  </div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{recipient.parentPhone}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {recipients.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSendClick}
            disabled={sending || selectedRecipients.length === 0 || !selectedEndpoint || !selectedTemplate}
            className={`${BTN_PRIMARY} ${(sending || !selectedEndpoint || !selectedTemplate) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {sending ? (
              <><Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />لیږل کیږي... {progressPct}%</>
            ) : (
              <><Send className="inline-block ml-2 h-4 w-4" />پیغامونه ولیږئ ({selectedRecipients.length})</>
            )}
          </button>
        </div>
      )}

      {sending && (
        <div className="bg-card border rounded-md p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>د پیغامونو لیږل... ({progress.current}/{progress.total})</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ErpModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="د لیږلو تایید"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className={BTN_OUTLINE}>لغوه</button>
            <button onClick={handleConfirmSend} className={BTN_PRIMARY}>
              <Send className="inline-block ml-1 h-3 w-3" />تایید او لیږل
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p>ایا تاسو ډاډه یاست چې غواړئ <strong>{selectedRecipients.length}</strong> پیغامونه ولیږئ؟</p>
          <div className="p-2 bg-muted rounded text-xs space-y-1">
            <p>فون: <strong>{configuredEndpoints.find((e) => String(e.id) === selectedEndpoint)?.name}</strong></p>
            <p>ډول: <strong>{messageTypes.find((t) => t.value === filters.messageType)?.label}</strong></p>
            <p>کالبد: <strong>{filteredTemplates.find((t) => String(t.id) === selectedTemplate)?.templateName}</strong></p>
          </div>
          <p className="text-xs text-muted-foreground">هر پیغام په ترتیب سره لیږل کیږي. که اتصال نشته نو لیږل به ودرول شي.</p>
        </div>
      </ErpModal>

      {/* Results dialog */}
      <ErpModal
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        title="د لیږلو پایله"
        size="md"
        footer={<button onClick={() => setResultDialogOpen(false)} className={BTN_OUTLINE}>بندول</button>}
      >
        {sendResult && (
          <div className="space-y-4">
            {sendResult.stoppedEarly && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-900">
                <AlertCircle className="inline-block ml-1 h-4 w-4" />
                {sendResult.stopReason || "د اتصال ستونزې له امله نور پیغامونه و نه لیږل شول"}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border rounded-md p-3 text-center">
                <div className="text-2xl font-bold">{sendResult.total}</div>
                <div className="text-xs text-muted-foreground">ټول</div>
              </div>
              <div className="bg-card border rounded-md p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{sendResult.sent}</div>
                <div className="text-xs text-muted-foreground">لیږل شوي</div>
              </div>
              <div className="bg-card border rounded-md p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{sendResult.failed}</div>
                <div className="text-xs text-muted-foreground">ناکام</div>
              </div>
            </div>

            {sendResult.details?.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sendResult.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded text-sm">
                    {detail.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{detail.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{detail.phone}</div>
                      {detail.error && <div className="text-xs text-red-600">{detail.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ErpModal>
    </div>
  );
}

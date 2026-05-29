import { useState, useEffect } from "react";
import { Send, Loader2, CheckCircle, XCircle, Filter, Users } from "lucide-react";
import {
  getAbsentRecipients,
  getFeeRecipients,
  sendSmsToParents,
  getAllSmsTemplates,
  getSmsSettings,
} from "@/data/smsApi";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const BTN = "px-3 py-1.5 rounded text-xs font-medium transition-colors";
const BTN_PRIMARY = `${BTN} bg-primary text-primary-foreground hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

const messageTypes = [
  { value: "Absent", label: "د غیر حاضرۍ پیغام" },
  { value: "Fee", label: "د فیس یادونه" },
];

const institutionTypes = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

export default function SmsParents() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [filters, setFilters] = useState({
    institutionType: "School",
    messageType: "Absent",
    date: new Date().toISOString().split('T')[0],
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    checkSettings();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (filters.institutionType && filters.messageType) {
      fetchRecipients();
    }
  }, [filters.institutionType, filters.messageType, filters.date]);

  const checkSettings = async () => {
    try {
      const response = await getSmsSettings();
      if (!response.data.settings) {
        toast.error("لومړی د SMS تنظیمات جوړ کړئ");
      } else {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Error checking settings:", error);
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

  const fetchRecipients = async () => {
    setLoading(true);
    setRecipients([]);
    setSelectedRecipients([]);

    try {
      let response;
      if (filters.messageType === "Absent") {
        response = await getAbsentRecipients({
          institutionType: filters.institutionType,
          date: filters.date,
        });
      } else if (filters.messageType === "Fee") {
        response = await getFeeRecipients({
          institutionType: filters.institutionType,
        });
      }

      const recipientsList = response.data.recipients || [];
      setRecipients(recipientsList);
      setSelectedRecipients(recipientsList.map(r => r.parentId));

      if (recipientsList.length === 0) {
        toast.info(response.data.message || "هیڅ ترلاسه کوونکی ونه موندل شو");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "د ترلاسه کوونکو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRecipients(recipients.map(r => r.parentId));
    } else {
      setSelectedRecipients([]);
    }
  };

  const handleSelectRecipient = (parentId, checked) => {
    if (checked) {
      setSelectedRecipients(prev => [...prev, parentId]);
    } else {
      setSelectedRecipients(prev => prev.filter(id => id !== parentId));
    }
  };

  const handleSendSms = async () => {
    if (!settings) {
      toast.error("لومړی د SMS تنظیمات جوړ کړئ");
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error("لږ تر لږه یو ترلاسه کوونکی وټاکئ");
      return;
    }

    if (!selectedTemplate && !customMessage) {
      toast.error("کالبد یا دودیز پیغام وټاکئ");
      return;
    }

    if (!confirm(`ایا تاسو ډاډه یاست چې غواړئ ${selectedRecipients.length} پیغامونه ولیږئ؟`)) {
      return;
    }

    setSending(true);
    setProgress(0);

    try {
      const selectedRecipientsData = recipients.filter(r => selectedRecipients.includes(r.parentId));

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const response = await sendSmsToParents({
        messageType: filters.messageType,
        templateId: selectedTemplate,
        customMessage: customMessage || undefined,
        recipients: selectedRecipientsData,
        additionalData: {
          date: new Date().toLocaleDateString('fa-AF'),
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      setSendResult(response.data.results);
      setResultDialogOpen(true);

      toast.success(response.data.message);
      fetchRecipients();
    } catch (error) {
      toast.error(error.response?.data?.message || "د پیغامونو لیږلو کې تېروتنه");
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  const filteredTemplates = templates.filter(t => t.templateType === filters.messageType);

  return (
    <div className="space-y-4">
      <PageHeader 
        title="د مور او پلار پیغامونه" 
        subtitle="د زده کوونکو مور او پلار ته SMS لیږئ"
      />

      {!settings && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-900">
            د SMS تنظیمات نه دي جوړ شوي. لومړی د تنظیماتو پاڼې ته لاړ شئ او تنظیمات جوړ کړئ.
          </p>
        </div>
      )}

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
              onChange={(e) => setFilters(prev => ({ ...prev, institutionType: e.target.value }))}
              className={SEL}
            >
              {institutionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">د پیغام ډول</label>
            <select
              value={filters.messageType}
              onChange={(e) => setFilters(prev => ({ ...prev, messageType: e.target.value }))}
              className={SEL}
            >
              {messageTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {filters.messageType === "Absent" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">نیټه</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className={SEL}
              />
            </div>
          )}
        </div>
      </div>

      {filteredTemplates.length > 0 && (
        <div className="bg-card border rounded-md p-4 space-y-4">
          <h3 className="text-base font-semibold">کالبد وټاکئ</h3>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">کالبد</label>
            <select
              value={selectedTemplate?.toString() || ""}
              onChange={(e) => {
                setSelectedTemplate(e.target.value ? parseInt(e.target.value) : null);
                setCustomMessage("");
              }}
              className={SEL}
            >
              <option value="">کالبد وټاکئ</option>
              {filteredTemplates.map(template => (
                <option key={template.id} value={template.id.toString()}>
                  {template.templateName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">یا دودیز پیغام</label>
            <textarea
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setSelectedTemplate(null);
              }}
              placeholder="دلته خپل دودیز پیغام ولیکئ..."
              rows={4}
              disabled={!!selectedTemplate}
              className="w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      <div className="bg-card border rounded-md p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="text-base font-semibold">ترلاسه کوونکي ({recipients.length})</h3>
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
            هیڅ ترلاسه کوونکی ونه موندل شو
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recipients.map((recipient) => (
              <div
                key={recipient.parentId}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(recipient.parentId)}
                  onChange={(e) => handleSelectRecipient(recipient.parentId, e.target.checked)}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{recipient.parentName}</div>
                  <div className="text-sm text-muted-foreground">
                    زده کوونکی: {recipient.studentName} - {recipient.className}
                  </div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {recipient.parentPhone}
                  </div>
                </div>
                <Badge variant="muted">{recipient.institutionType}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {recipients.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSendSms}
            disabled={sending || selectedRecipients.length === 0 || !settings}
            className={`${BTN_PRIMARY} ${(sending || selectedRecipients.length === 0 || !settings) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {sending ? (
              <>
                <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
                لیږل کیږي... {progress}%
              </>
            ) : (
              <>
                <Send className="inline-block ml-2 h-4 w-4" />
                پیغامونه ولیږئ ({selectedRecipients.length})
              </>
            )}
          </button>
        </div>
      )}

      {sending && (
        <div className="bg-card border rounded-md p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>د پیغامونو لیږل...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <ErpModal 
        open={resultDialogOpen} 
        onOpenChange={setResultDialogOpen} 
        title="د لیږلو پایله"
        size="md"
        footer={
          <button onClick={() => setResultDialogOpen(false)} className={BTN_OUTLINE}>
            بندول
          </button>
        }
      >
        {sendResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border rounded-md p-4 text-center">
                <div className="text-2xl font-bold">{sendResult.total}</div>
                <div className="text-sm text-muted-foreground">ټول</div>
              </div>
              <div className="bg-card border rounded-md p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{sendResult.sent}</div>
                <div className="text-sm text-muted-foreground">لیږل شوي</div>
              </div>
              <div className="bg-card border rounded-md p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{sendResult.failed}</div>
                <div className="text-sm text-muted-foreground">ناکام</div>
              </div>
            </div>

            {sendResult.details && sendResult.details.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sendResult.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    {detail.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{detail.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{detail.phone}</div>
                      {detail.error && (
                        <div className="text-xs text-red-600">{detail.error}</div>
                      )}
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

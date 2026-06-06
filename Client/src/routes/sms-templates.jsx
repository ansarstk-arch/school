import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Loader2, Download } from "lucide-react";
import { getAllSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate, seedDefaultTemplates } from "@/data/smsApi";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/erp/PageHeader";
import { ErpModal } from "@/components/erp/ErpModal";
import { Badge } from "@/components/erp/Badge";
import { ConfirmDelete } from "@/components/erp/ConfirmDelete";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const BTN = "px-3 py-1.5 rounded text-xs font-medium transition-colors";
const BTN_PRIMARY = `${BTN} bg-primary text-primary-foreground hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

const templateTypes = [
  { value: "Absent", label: "د غیر حاضرۍ پیغام" },
  { value: "Present", label: "د حاضرۍ پیغام" },
  { value: "Fee", label: "د فیس یادونه" },
  { value: "ExamPass", label: "د ازموینې بریالیتوب" },
  { value: "ExamFail", label: "د ازموینې ناکامي" },
  { value: "Homework", label: "د کور کار یادونه" },
  { value: "Custom", label: "دودیز پیغام" },
];

const availableVariables = {
  common: ["parentName", "studentName", "className", "date", "institutionType"],
  Absent: [],
  Present: [],
  Fee: ["month", "amount"],
  ExamPass: ["examName", "position", "totalMarks", "obtainedMarks", "percentage"],
  ExamFail: ["examName", "totalMarks", "obtainedMarks"],
  Homework: ["subject", "dueDate"],
};

export default function SmsTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [formData, setFormData] = useState({
    templateType: "Absent",
    templateName: "",
    messagePs: "",
    messageDa: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await getAllSmsTemplates();
      setTemplates(response.data.templates || []);
    } catch (error) {
      toast.error("د کالبدونو ترلاسه کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      await seedDefaultTemplates();
      toast.success("ډیفالټ کالبدونه بریالیتوب سره جوړ شول");
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || "د کالبدونو جوړولو کې تېروتنه");
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        templateType: template.templateType,
        templateName: template.templateName,
        messagePs: template.messagePs,
        messageDa: template.messageDa || "",
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        templateType: "Absent",
        templateName: "",
        messagePs: "",
        messageDa: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.templateName || !formData.messagePs) {
      toast.error("د کالبد نوم او پښتو پیغام اړین دي");
      return;
    }

    setLoading(true);
    try {
      if (editingTemplate) {
        await updateSmsTemplate(editingTemplate.id, formData);
        toast.success("کالبد بریالیتوب سره تازه شو");
      } else {
        await createSmsTemplate(formData);
        toast.success("کالبد بریالیتوب سره جوړ شو");
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || "د کالبد خوندي کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteSmsTemplate(selectedTemplate.id);
      toast.success("کالبد بریالیتوب سره ړنګ شو");
      setDeleteOpen(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error("د کالبد ړنګولو کې تېروتنه");
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      messagePs: prev.messagePs + `{${variable}}`,
    }));
  };

  const getTypeLabel = (type) => {
    return templateTypes.find(t => t.value === type)?.label || type;
  };

  const getVariablesForType = (type) => {
    return [...availableVariables.common, ...(availableVariables[type] || [])];
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title="د SMS کالبدونه" 
        subtitle="د پیغامونو کالبدونه جوړ او اداره کړئ"
        actions={
          <div className="flex gap-2">
            {templates.length === 0 && (
              <button onClick={handleSeedTemplates} disabled={seeding} className={BTN_OUTLINE}>
                {seeding ? (
                  <>
                    <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />
                    جوړیږي...
                  </>
                ) : (
                  <>
                    <Download className="inline-block ml-2 h-3 w-3" />
                    ډیفالټ کالبدونه
                  </>
                )}
              </button>
            )}
            <button onClick={() => handleOpenDialog()} className={BTN_PRIMARY}>
              <Plus className="inline-block ml-2 h-3 w-3" />
              نوی کالبد
            </button>
          </div>
        }
      />

      {loading && templates.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-card border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">هیڅ کالبد نه دی موندل شوی</p>
          <button onClick={handleSeedTemplates} disabled={seeding} className={BTN_PRIMARY}>
            {seeding ? "جوړیږي..." : "ډیفالټ کالبدونه جوړ کړئ"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-card border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-base font-semibold">{template.templateName}</h3>
                  <p className="text-xs text-muted-foreground">{getTypeLabel(template.templateType)}</p>
                </div>
                <Badge variant={template.isActive ? "info" : "muted"}>
                  {template.isActive ? "فعال" : "غیر فعال"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-3">
                {template.messagePs}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPreviewTemplate(template);
                    setPreviewOpen(true);
                  }}
                  className={BTN_OUTLINE}
                >
                  <Eye className="inline-block ml-1 h-3 w-3" />
                  کتل
                </button>
                <button
                  onClick={() => handleOpenDialog(template)}
                  className={BTN_OUTLINE}
                >
                  <Edit className="inline-block ml-1 h-3 w-3" />
                  سمون
                </button>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setDeleteOpen(true);
                  }}
                  className={`${BTN} border border-destructive text-destructive hover:bg-destructive hover:text-white`}
                >
                  <Trash2 className="inline-block ml-1 h-3 w-3" />
                  ړنګول
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ErpModal 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        title={editingTemplate ? "کالبد سمول" : "نوی کالبد"}
        size="lg"
        footer={
          <>
            <button onClick={() => setDialogOpen(false)} className={BTN_OUTLINE}>
              لغوه
            </button>
            <button onClick={handleSave} disabled={loading} className={BTN_PRIMARY}>
              {loading ? (
                <>
                  <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />
                  خوندي کیږي...
                </>
              ) : (
                "خوندي کړئ"
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="د کالبد ډول">
              <select
                value={formData.templateType}
                onChange={(e) => setFormData(prev => ({ ...prev, templateType: e.target.value }))}
                className={SEL}
              >
                {templateTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </F>

            <F label="د کالبد نوم">
              <Input
                value={formData.templateName}
                handleChanges={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                placeholder="د کالبد نوم"
              />
            </F>
          </div>

          <F label="پښتو پیغام">
            <textarea
              value={formData.messagePs}
              onChange={(e) => setFormData(prev => ({ ...prev, messagePs: e.target.value }))}
              placeholder="دلته خپل پیغام ولیکئ..."
              rows={5}
              className="w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              د توري شمیر: {formData.messagePs.length} / 500
            </p>
          </F>

          <div>
            <p className="text-xs text-muted-foreground mb-2">موجود متغیرونه</p>
            <div className="flex flex-wrap gap-2">
              {getVariablesForType(formData.templateType).map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  type="button"
                  className={BTN_OUTLINE}
                >
                  {"{" + variable + "}"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs font-semibold mb-2">د متغیرونو معنی:</p>
            <ul className="text-xs space-y-1">
              <li>parentName - د مور/پلار نوم</li>
              <li>studentName - د زده کوونکي نوم</li>
              <li>className - د ټولګي نوم</li>
              <li>date - نیټه</li>
              <li>amount - مقدار</li>
              <li>position - مقام</li>
            </ul>
          </div>
        </div>
      </ErpModal>

      {/* Preview Dialog */}
      <ErpModal 
        open={previewOpen} 
        onOpenChange={setPreviewOpen} 
        title={previewTemplate?.templateName}
        size="md"
        footer={
          <button onClick={() => setPreviewOpen(false)} className={BTN_OUTLINE}>
            بندول
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">پښتو پیغام</p>
            <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
              {previewTemplate?.messagePs}
            </div>
          </div>
          {previewTemplate?.messageDa && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">دري پیغام</p>
              <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {previewTemplate.messageDa}
              </div>
            </div>
          )}
        </div>
      </ErpModal>

      {/* Delete Confirmation */}
      <ConfirmDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={selectedTemplate?.templateName}
        subtitle={getTypeLabel(selectedTemplate?.templateType)}
      />
    </div>
  );
}

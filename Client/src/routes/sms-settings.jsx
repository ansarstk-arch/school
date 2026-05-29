import { useState, useEffect } from "react";
import { Save, TestTube, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getSmsSettings, upsertSmsSettings, testSmsConnection } from "@/data/smsApi";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/erp/PageHeader";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const BTN = "px-4 py-2 rounded text-sm font-medium transition-colors";
const BTN_PRIMARY = `${BTN} bg-primary text-primary-foreground hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

const F = ({ label, opt, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
    {error && <span className="text-[11px] text-destructive mt-0.5">{error}</span>}
  </label>
);

export default function SmsSettings() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    providerName: "Custom API",
    apiUrl: "",
    apiPort: "",
    apiToken: "",
    apiUsername: "",
    apiPassword: "",
    authMethod: "token",
    tokenPlacement: "header",
    requestMethod: "POST",
    phoneField: "phone",
    messageField: "message",
    smsBalance: 0,
  });
  const [testData, setTestData] = useState({
    testPhone: "",
    testMessage: "دا د ازموینې پیغام دی",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSmsSettings();
      if (response.data.settings) {
        setFormData({
          ...response.data.settings,
          apiToken: "",
          apiPassword: "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!testData.testPhone) {
      toast.error("د ازموینې لپاره ټیلیفون نمبر اړین دی");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await testSmsConnection(testData);
      setTestResult({
        success: true,
        message: "د SMS اتصال بریالیتوب سره ازمویل شو! ټول تنظیمات سم دي.",
        details: response.data,
      });
      toast.success("د SMS اتصال بریالیتوب سره ازمویل شو");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "د SMS اتصال کې تېروتنه";
      setTestResult({
        success: false,
        message: errorMsg,
        details: error.response?.data,
      });
      toast.error(errorMsg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.apiUrl) {
      toast.error("د API پته اړینه ده");
      return;
    }

    try {
      new URL(formData.apiUrl);
    } catch {
      toast.error("د API پته سمه نه ده. مهرباني وکړئ بشپړه URL ولیکئ (مثال: https://api.example.com/send)");
      return;
    }

    if (formData.authMethod === "token" && !formData.apiToken) {
      toast.error("د API ټوکن اړین دی");
      return;
    }

    if (formData.authMethod === "basic" && (!formData.apiUsername || !formData.apiPassword)) {
      toast.error("د API کارن نوم او پاسورډ اړین دي");
      return;
    }

    setLoading(true);

    try {
      await upsertSmsSettings(formData);
      toast.success("د SMS تنظیمات بریالیتوب سره خوندي شول");
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || "د تنظیماتو خوندي کولو کې تېروتنه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title="د SMS تنظیمات" 
        subtitle="د SMS API تنظیمات او اتصال ازموینه"
      />

      {/* Test Result Alert */}
      {testResult && (
        <div className={`p-4 rounded-md border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">
                {testResult.success ? "بریالیتوب" : "تېروتنه"}
              </div>
              <div className="text-sm">{testResult.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* API Configuration */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-1">د API تنظیمات</h3>
          <p className="text-xs text-muted-foreground">د SMS لیږلو لپاره د API معلومات داخل کړئ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="د خدمت ورکوونکي نوم">
            <Input
              value={formData.providerName}
              handleChanges={(e) => handleChange("providerName", e.target.value)}
              placeholder="Custom API"
            />
          </F>

          <F label="د غوښتنې میتود">
            <select value={formData.requestMethod} onChange={(e) => handleChange("requestMethod", e.target.value)} className={SEL}>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </F>
        </div>

        <F label="د API پته (URL)">
          <Input
            value={formData.apiUrl}
            handleChanges={(e) => handleChange("apiUrl", e.target.value)}
            placeholder="https://api.example.com/send"
          />
          <p className="text-xs text-muted-foreground mt-1">بشپړه URL ولیکئ (مثال: https://api.example.com/send)</p>
        </F>

        <F label="پورټ (اختیاري)" opt>
          <Input
            value={formData.apiPort}
            handleChanges={(e) => handleChange("apiPort", e.target.value)}
            placeholder="8080"
          />
          <p className="text-xs text-muted-foreground mt-1">که چیرې API ځانګړی پورټ ته اړتیا لري نو دلته یې ولیکئ</p>
        </F>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="د ټیلیفون فیلډ نوم">
            <Input
              value={formData.phoneField}
              handleChanges={(e) => handleChange("phoneField", e.target.value)}
              placeholder="phone"
            />
          </F>

          <F label="د پیغام فیلډ نوم">
            <Input
              value={formData.messageField}
              handleChanges={(e) => handleChange("messageField", e.target.value)}
              placeholder="message"
            />
          </F>
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-1">د تصدیق تنظیمات</h3>
          <p className="text-xs text-muted-foreground">د API تصدیق معلومات</p>
        </div>

        <F label="د تصدیق میتود">
          <select value={formData.authMethod} onChange={(e) => handleChange("authMethod", e.target.value)} className={SEL}>
            <option value="token">Token</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
        </F>

        {(formData.authMethod === "token" || formData.authMethod === "bearer") && (
          <>
            <F label="API ټوکن">
              <Input
                type="password"
                value={formData.apiToken}
                handleChanges={(e) => handleChange("apiToken", e.target.value)}
                placeholder="your-api-token-here"
              />
            </F>

            {formData.authMethod === "token" && (
              <F label="د ټوکن ځای">
                <select value={formData.tokenPlacement} onChange={(e) => handleChange("tokenPlacement", e.target.value)} className={SEL}>
                  <option value="header">Header</option>
                  <option value="query">Query Parameter</option>
                  <option value="body">Request Body</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  که چیرې ۴۰۱ تېروتنه راشي نو د ټوکن ځای بدل کړئ
                </p>
              </F>
            )}
          </>
        )}

        {formData.authMethod === "basic" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="کارن نوم">
              <Input
                value={formData.apiUsername}
                handleChanges={(e) => handleChange("apiUsername", e.target.value)}
                placeholder="username"
              />
            </F>

            <F label="پاسورډ">
              <Input
                type="password"
                value={formData.apiPassword}
                handleChanges={(e) => handleChange("apiPassword", e.target.value)}
                placeholder="password"
              />
            </F>
          </div>
        )}
      </div>

      {/* Test Connection */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-1">د اتصال ازموینه</h3>
          <p className="text-xs text-muted-foreground">د تنظیماتو د خوندي کولو دمخه اتصال ازمویئ</p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            لومړی د اتصال ازموینه وکړئ. که چیرې بریالیتوب سره ازمویل شو نو بیا تنظیمات خوندي کړئ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="د ازموینې ټیلیفون نمبر">
            <Input
              value={testData.testPhone}
              handleChanges={(e) => setTestData(prev => ({ ...prev, testPhone: e.target.value }))}
              placeholder="0700123456"
            />
          </F>

          <F label="د ازموینې پیغام">
            <Input
              value={testData.testMessage}
              handleChanges={(e) => setTestData(prev => ({ ...prev, testMessage: e.target.value }))}
              placeholder="دا د ازموینې پیغام دی"
            />
          </F>
        </div>

        <button onClick={handleTest} disabled={testing} className={BTN_OUTLINE}>
          {testing ? (
            <>
              <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
              ازموینه کیږي...
            </>
          ) : (
            <>
              <TestTube className="inline-block ml-2 h-4 w-4" />
              د اتصال ازموینه
            </>
          )}
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button 
          onClick={handleSave} 
          disabled={loading || !testResult?.success} 
          className={`${BTN_PRIMARY} ${(!testResult?.success) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
              خوندي کیږي...
            </>
          ) : (
            <>
              <Save className="inline-block ml-2 h-4 w-4" />
              تنظیمات خوندي کړئ
            </>
          )}
        </button>
      </div>

      {!testResult?.success && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-900">
            د تنظیماتو د خوندي کولو دمخه لومړی د اتصال ازموینه وکړئ او ډاډ ترلاسه کړئ چې بریالیتوب سره کار کوي.
          </p>
        </div>
      )}
    </div>
  );
}

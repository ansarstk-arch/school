import { useState, useEffect } from "react";
import { Save, TestTube, Loader2, CheckCircle, XCircle, AlertCircle, Smartphone } from "lucide-react";
import { getSmsEndpoints, upsertSmsEndpoint, testSmsConnection } from "@/data/smsApi";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/erp/PageHeader";
import { toast } from "sonner";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const BTN = "px-4 py-2 rounded text-sm font-medium transition-colors";
const BTN_PRIMARY = `${BTN} bg-primary text-primary-foreground hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border border-input hover:bg-muted`;

export default function SmsSettings() {
  const [endpoints, setEndpoints] = useState([]);
  const [urls, setUrls] = useState({ 1: "", 2: "", 3: "" });
  const [saving, setSaving] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testData, setTestData] = useState({
    endpointId: "",
    testPhone: "",
    testMessage: "دا د ازموینې پیغام دی",
  });

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      const response = await getSmsEndpoints();
      const eps = response.data.endpoints || [];
      setEndpoints(eps);
      const urlMap = { 1: "", 2: "", 3: "" };
      eps.forEach((ep) => { urlMap[ep.slot] = ep.apiUrl || ""; });
      setUrls(urlMap);
    } catch (error) {
      console.error("Error fetching endpoints:", error);
    }
  };

  const handleSave = async (slot) => {
    const apiUrl = urls[slot]?.trim();
    if (!apiUrl) {
      toast.error("د API بشپړه پته ولیکئ");
      return;
    }

    try {
      new URL(apiUrl);
    } catch {
      toast.error("د API پته سمه نه ده. بشپړه پته ولیکئ (مثال: http://192.168.1.5:8080/send)");
      return;
    }

    setSaving((prev) => ({ ...prev, [slot]: true }));
    try {
      await upsertSmsEndpoint({ slot, apiUrl });
      toast.success(`فون ${slot} بریالیتوب سره خوندي شو`);
      fetchEndpoints();
    } catch (error) {
      toast.error(error.response?.data?.message || "د خوندي کولو کې تېروتنه");
    } finally {
      setSaving((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const handleTest = async () => {
    if (!testData.endpointId) {
      toast.error("لومړی فون وټاکئ");
      return;
    }
    if (!testData.testPhone) {
      toast.error("د ازموینې لپاره ټیلیفون نمبر اړین دی");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await testSmsConnection({
        endpointId: Number(testData.endpointId),
        testPhone: testData.testPhone,
        testMessage: testData.testMessage,
      });
      setTestResult({
        success: true,
        message: "د SMS اتصال بریالیتوب سره ازمویل شو!",
        details: response.data,
      });
      toast.success("ازموینه بریالۍ وه");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "د SMS اتصال کې تېروتنه";
      
      // Enhanced error message
      let enhancedMsg = errorMsg;
      if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("Failed to fetch") || errorMsg.includes("Network")) {
        enhancedMsg = "د اتصال کې ستونزه! مهرباني وکړئ ډاډ ترلاسه کړئ چې:\n۱. SMS Gateway سرور په فون کې روان دی\n۲. فون او کمپیوټر په یوه شبکې پورې وصل دي\n۳. د API پته سمه ده";
      }
      
      setTestResult({ success: false, message: enhancedMsg });
      toast.error(enhancedMsg);
    } finally {
      setTesting(false);
    }
  };

  const configuredEndpoints = endpoints.filter((e) => e.apiUrl);

  return (
    <div className="space-y-4">
      <PageHeader
        title="د SMS تنظیمات"
        subtitle="د فون API پتې تنظیم او ازموینه"
      />

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <p className="font-semibold">د API پتې د خوندي کولو لارښوونه:</p>
            <p><strong>۱. لومړی:</strong> د SMS Gateway سرور په خپل فون کې روان کړئ</p>
            <p><strong>۲. بیا:</strong> بشپړه پته ولیکئ چې پورټ شمیره هم پکې وي (مثال: <span dir="ltr">http://192.168.1.5:8080/send</span>)</p>
            <p>• د API فیلډونه په ډیفالټ <strong>phone</strong> او <strong>message</strong> دي — بدلول اړین نه دي</p>
            <p>• هر فون جلا خوندي کیږي — لومړی پته خوندي کړئ، بیا ازموینه وکړئ</p>
          </div>
        </div>
      </div>

      {/* 3 Phone Endpoints */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          <h3 className="text-base font-semibold">د فون API پتې</h3>
        </div>

        {[1, 2, 3].map((slot) => {
          const ep = endpoints.find((e) => e.slot === slot);
          const name = ep?.name || `فون ${slot}`;
          return (
            <div key={slot} className="p-3 border rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                {ep?.apiUrl && (
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded">تنظیم شوی</span>
                )}
              </div>
              <Input
                value={urls[slot] || ""}
                handleChanges={(e) => setUrls((prev) => ({ ...prev, [slot]: e.target.value }))}
                placeholder="http://192.168.1.5:8080/send"
                dir="ltr"
              />
              <button
                onClick={() => handleSave(slot)}
                disabled={saving[slot]}
                className={BTN_PRIMARY}
              >
                {saving[slot] ? (
                  <><Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />خوندي کیږي...</>
                ) : (
                  <><Save className="inline-block ml-2 h-4 w-4" />{name} خوندي کړئ</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Test Section — separate from settings */}
      <div className="bg-card border rounded-md p-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-1">د پیغام ازموینه</h3>
          <p className="text-xs text-muted-foreground">فون وټاکئ او مستقیم API ته ازموینه وکړئ</p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p><strong>مهمه یادونه:</strong></p>
            <p>• د پیغام لیږلو دمخه ډاډ ترلاسه کړئ چې <strong>SMS Gateway سرور په فون کې روان دی</strong></p>
            <p>• ستاسو کمپیوټر او فون باید په یوه شبکې (<strong>وای فای</strong> یا <strong>هاټسپاټ</strong>) پورې وصل وي</p>
            <p>• <strong>VPN مه کاروئ</strong> — VPN فعال وي نو SMS لیږل او ازموینه ناکام کیږي</p>
          </div>
        </div>

        {testResult && (
          <div className={`p-3 rounded-md border ${testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <p className="text-sm">{testResult.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">فون وټاکئ</span>
            <select
              value={testData.endpointId}
              onChange={(e) => setTestData((prev) => ({ ...prev, endpointId: e.target.value }))}
              className={SEL}
            >
              <option value="">فون وټاکئ</option>
              {configuredEndpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">ټیلیفون نمبر</span>
            <Input
              value={testData.testPhone}
              handleChanges={(e) => setTestData((prev) => ({ ...prev, testPhone: e.target.value }))}
              placeholder="0700123456"
              dir="ltr"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">ازموینه پیغام</span>
            <Input
              value={testData.testMessage}
              handleChanges={(e) => setTestData((prev) => ({ ...prev, testMessage: e.target.value }))}
              placeholder="دا د ازموینې پیغام دی"
            />
          </label>
        </div>

        <button onClick={handleTest} disabled={testing || configuredEndpoints.length === 0} className={BTN_OUTLINE}>
          {testing ? (
            <><Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />ازموینه کیږي...</>
          ) : (
            <><TestTube className="inline-block ml-2 h-4 w-4" />ازموینه وکړئ</>
          )}
        </button>
      </div>
    </div>
  );
}

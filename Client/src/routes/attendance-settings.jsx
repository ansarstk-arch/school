import { useState, useEffect } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { Clock, Calendar, Save, AlertCircle } from "lucide-react";
import * as attendanceSettingsApi from "@/data/attendanceSettingsApi";
import { toast } from "sonner";

const INSTITUTION_TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "یکشنبه", labelEn: "Sunday" },
  { value: 1, label: "دوشنبه", labelEn: "Monday" },
  { value: 2, label: "سه‌شنبه", labelEn: "Tuesday" },
  { value: 3, label: "چهارشنبه", labelEn: "Wednesday" },
  { value: 4, label: "پنجشنبه", labelEn: "Thursday" },
  { value: 5, label: "جمعه", labelEn: "Friday" },
  { value: 6, label: "شنبه", labelEn: "Saturday" },
];

export default function AttendanceSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await attendanceSettingsApi.getAllAttendanceSettings();
      const settingsMap = {};
      (response.data || []).forEach((s) => {
        settingsMap[s.institutionType] = s;
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error(error.message || "د تنظیماتو د لوډولو کې ستونزه");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (institutionType, time) => {
    setSettings((prev) => ({
      ...prev,
      [institutionType]: {
        ...prev[institutionType],
        cutoffTime: time,
      },
    }));
  };

  const handleOffDayToggle = (institutionType, dayValue) => {
    setSettings((prev) => {
      const current = prev[institutionType] || {};
      const offDays = current.offDays || [];
      const newOffDays = offDays.includes(dayValue)
        ? offDays.filter((d) => d !== dayValue)
        : [...offDays, dayValue];

      return {
        ...prev,
        [institutionType]: {
          ...current,
          offDays: newOffDays,
        },
      };
    });
  };

  const handleSave = async (institutionType) => {
    const setting = settings[institutionType];
    if (!setting?.cutoffTime) {
      toast.error("مهرباني وکړئ وخت داخل کړئ");
      return;
    }

    setSaving((prev) => ({ ...prev, [institutionType]: true }));
    try {
      const response = await attendanceSettingsApi.updateAttendanceSettings(
        institutionType,
        {
          cutoffTime: setting.cutoffTime,
          offDays: setting.offDays || [],
          isActive: true,
        }
      );

      toast.success(response.message || "تنظیمات بریالۍ ثبت شول");
      
      // Only reload the specific setting that was updated
      const updatedResponse = await attendanceSettingsApi.getAttendanceSettingsByType(institutionType);
      if (updatedResponse.data) {
        setSettings((prev) => ({
          ...prev,
          [institutionType]: updatedResponse.data,
        }));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "د تنظیماتو د ثبتولو کې ستونزه");
    } finally {
      setSaving((prev) => ({ ...prev, [institutionType]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="د حاضرۍ تنظیمات"
        subtitle="د هرې ادارې لپاره د حاضرۍ وخت او رخصتۍ ورځې تنظیم کړئ"
      />

      <div className="bg-card border border-warning/50 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="size-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">مهم یادښت:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>د ټاکل شوي وخت څخه وروسته، ټول زده کوونکي او کارکوونکي چې حاضري یې نه وي اخیستل شوې، په اتوماتيک ډول غیر حاضر ثبت کیږي</li>
            <li>که چیرې یو زده کوونکی غیر حاضر ثبت شوی وي او بیا QR کوډ سکین کړي، د هغه حاضري حاضر ته بدلیږي</li>
            <li>د رخصتۍ ورځو کې هیڅ حاضري نه اخیستل کیږي</li>
            <li>سیسټم هره 30 دقیقې کې یو ځل اتوماتيک غیر حاضري چک کوي</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {INSTITUTION_TYPES.map((type) => {
          const setting = settings[type.value] || {};
          const isSaving = saving[type.value];

          return (
            <div
              key={type.value}
              className="bg-card border border-border rounded-lg p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {type.label}
                </h3>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    setting.isActive
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {setting.isActive ? "فعال" : "غیر فعال"}
                </div>
              </div>

              {/* Cutoff Time */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Clock className="size-4" />
                  د حاضرۍ وخت
                </label>
                <input
                  type="time"
                  value={setting.cutoffTime || "09:00"}
                  onChange={(e) =>
                    handleTimeChange(type.value, e.target.value)
                  }
                  className="w-full border border-input rounded px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  د دې وخت څخه وروسته زده کوونکي غیر حاضر ثبت کیږي
                </p>
              </div>

              {/* Off Days */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="size-4" />
                  د رخصتۍ ورځې
                </label>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = (setting.offDays || []).includes(
                      day.value
                    );
                    return (
                      <label
                        key={day.value}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleOffDayToggle(type.value, day.value)
                          }
                          className="w-4 h-4 rounded border-input text-primary focus:ring-1 focus:ring-ring"
                        />
                        <span className="text-sm text-foreground flex-1">
                          {day.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {day.labelEn}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={() => handleSave(type.value)}
                disabled={isSaving}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    ثبتول...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    تنظیمات ثبت کړئ
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

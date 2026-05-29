import { eq } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { smsSettings } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import axios from "axios";

// ─── GET SMS SETTINGS ──────────────────────────────────────────────────────────
export const getSmsSettings = asyncHandler(async (req, res) => {
  const [settings] = await db.select().from(smsSettings).limit(1);
  
  if (!settings) {
    return res.respond(200, "د SMS تنظیمات نه دي موندل شوي", { settings: null });
  }

  // Don't expose sensitive data in full
  const safeSettings = {
    ...settings,
    apiPassword: settings.apiPassword ? "********" : null,
    apiToken: settings.apiToken ? "********" : null,
  };

  res.respond(200, "د SMS تنظیمات ترلاسه شول", { settings: safeSettings });
});

// ─── CREATE OR UPDATE SMS SETTINGS ────────────────────────────────────────────
export const upsertSmsSettings = asyncHandler(async (req, res) => {
  const {
    apiUrl,
  } = req.body;

  if (!apiUrl) throw new ApiError(400, "د API پته اړینه ده");

  const [existingSettings] = await db.select().from(smsSettings).limit(1);

  const settingsData = {
    apiUrl,
    isActive: true,
    updatedAt: new Date().toISOString(),
  };

  let result;
  if (existingSettings) {
    // Update existing
    [result] = await db
      .update(smsSettings)
      .set(settingsData)
      .where(eq(smsSettings.id, existingSettings.id))
      .returning();
  } else {
    // Create new
    [result] = await db.insert(smsSettings).values(settingsData).returning();
  }

  const safeResult = {
    ...result,
    apiPassword: result.apiPassword ? "********" : null,
    apiToken: result.apiToken ? "********" : null,
  };

  res.respond(200, "د SMS تنظیمات بریالیتوب سره خوندي شول", { settings: safeResult });
});

// ─── TEST SMS CONNECTION ───────────────────────────────────────────────────────
export const testSmsConnection = asyncHandler(async (req, res) => {
  const { testPhone, testMessage } = req.body;

  if (!testPhone) throw new ApiError(400, "د ازموینې لپاره ټیلیفون نمبر اړین دی");

  const [settings] = await db.select().from(smsSettings).limit(1);
  if (!settings) throw new ApiError(404, "د SMS تنظیمات نه دي موندل شوي. لومړی تنظیمات جوړ کړئ");

  if (!settings.isActive) throw new ApiError(400, "د SMS تنظیمات غیر فعال دي");

  try {
    const message = testMessage || "دا د ازموینې پیغام دی";
    
    // Build request config
    const config = {
      method: settings.requestMethod,
      url: settings.apiUrl,
      phone: testPhone,
      message: message,
      timeout: 10000,
    };


    // Make API call
    const response = await axios(config);

    // Update last tested time
    await db
      .update(smsSettings)
      .set({ lastTestedAt: new Date().toISOString() })
      .where(eq(smsSettings.id, settings.id));

    res.respond(200, "د SMS اتصال بریالیتوب سره ازمویل شو", {
      success: true,
      statusCode: response.status,
      response: response.data,
    });
  } catch (error) {
    console.error("SMS Test Error:", error);

    let errorMessage = "د SMS اتصال کې تېروتنه رامنځته شوه";
    
    if (error.code === "ECONNREFUSED") {
      errorMessage = "د سرور سره اتصال نشو. مهرباني وکړئ API پته او پورټ وګورئ";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "د API غوښتنه ډیره وخت ونیوه. مهرباني وکړئ خپل انټرنیټ اتصال وګورئ";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "د انټرنیټ اتصال نشته. مهرباني وکړئ خپل هاټسپاټ وګورئ";
    } else if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        errorMessage = "د تصدیق تېروتنه. مهرباني وکړئ ټوکن یا پاسورډ وګورئ او یا یې په بل ځای کې ولګوئ";
      } else if (status === 403) {
        errorMessage = "اجازه نشته. مهرباني وکړئ د API کریډنشیلز وګورئ";
      } else if (status === 404) {
        errorMessage = "API پته ونه موندل شوه. مهرباني وکړئ URL وګورئ";
      } else if (status === 500) {
        errorMessage = "د سرور تېروتنه. مهرباني وکړئ وروسته بیا هڅه وکړئ";
      } else {
        errorMessage = `د API تېروتنه: ${status} - ${error.response.statusText}`;
      }
    }

    throw new ApiError(400, errorMessage);
  }
});

// ─── DELETE SMS SETTINGS ───────────────────────────────────────────────────────
export const deleteSmsSettings = asyncHandler(async (req, res) => {
  const [settings] = await db.select().from(smsSettings).limit(1);
  
  if (!settings) throw new ApiError(404, "د SMS تنظیمات نه دي موندل شوي");

  await db.delete(smsSettings).where(eq(smsSettings.id, settings.id));

  res.respond(200, "د SMS تنظیمات بریالیتوب سره ړنګ شول");
});

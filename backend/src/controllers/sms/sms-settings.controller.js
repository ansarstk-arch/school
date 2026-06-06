import { eq } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { smsEndpoints } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { testSmsConnection as testSms } from "../../services/sms/sms-sender.service.js";

const DEFAULT_ENDPOINTS = [
  { slot: 1, name: "فون ۱" },
  { slot: 2, name: "فون ۲" },
  { slot: 3, name: "فون ۳" },
];

const ensureDefaultEndpoints = async () => {
  const existing = await db.select().from(smsEndpoints);
  if (existing.length >= 3) return existing;

  for (const ep of DEFAULT_ENDPOINTS) {
    const found = existing.find((e) => e.slot === ep.slot);
    if (!found) {
      await db.insert(smsEndpoints).values({ slot: ep.slot, name: ep.name, isActive: true });
    }
  }

  return db.select().from(smsEndpoints).orderBy(smsEndpoints.slot);
};

// ─── GET ALL SMS ENDPOINTS ─────────────────────────────────────────────────────
export const getSmsEndpoints = asyncHandler(async (req, res) => {
  const endpoints = await ensureDefaultEndpoints();
  res.respond(200, "د SMS فونونه ترلاسه شول", { endpoints });
});

// ─── GET SMS SETTINGS (backward compat) ─────────────────────────────────────────
export const getSmsSettings = asyncHandler(async (req, res) => {
  const endpoints = await ensureDefaultEndpoints();
  const configured = endpoints.filter((e) => e.apiUrl);
  res.respond(200, "د SMS تنظیمات ترلاسه شول", {
    settings: configured.length > 0 ? { isActive: true, endpoints: configured } : null,
    endpoints,
  });
});

// ─── SAVE SINGLE ENDPOINT ──────────────────────────────────────────────────────
export const upsertSmsEndpoint = asyncHandler(async (req, res) => {
  const { slot, apiUrl } = req.body;

  if (!slot || slot < 1 || slot > 3) throw new ApiError(400, "د فون سلاټ سم نه دی (۱، ۲ یا ۳)");

  if (!apiUrl?.trim()) throw new ApiError(400, "د API بشپړه پته اړینه ده");

  const trimmedUrl = apiUrl.trim();
  try {
    new URL(trimmedUrl);
  } catch {
    throw new ApiError(400, "د API پته سمه نه ده. بشپړه پته ولیکئ (مثال: http://192.168.1.5:8080/send)");
  }

  await ensureDefaultEndpoints();

  const [result] = await db
    .update(smsEndpoints)
    .set({ apiUrl: trimmedUrl, isActive: true, updatedAt: new Date().toISOString() })
    .where(eq(smsEndpoints.slot, Number(slot)))
    .returning();

  if (!result) throw new ApiError(404, "فون ونه موندل شو");

  res.respond(200, `${result.name} بریالیتوب سره خوندي شو`, { endpoint: result });
});

// ─── CREATE OR UPDATE SMS SETTINGS (backward compat) ───────────────────────────
export const upsertSmsSettings = upsertSmsEndpoint;

// ─── TEST SMS CONNECTION ─────────────────────────────────────────────────────────
export const testSmsConnection = asyncHandler(async (req, res) => {
  const { endpointId, slot, testPhone, testMessage } = req.body;

  if (!testPhone) throw new ApiError(400, "د ازموینې لپاره ټیلیفون نمبر اړین دی");

  await ensureDefaultEndpoints();

  let endpoint;
  if (endpointId) {
    [endpoint] = await db.select().from(smsEndpoints).where(eq(smsEndpoints.id, Number(endpointId)));
  } else if (slot) {
    [endpoint] = await db.select().from(smsEndpoints).where(eq(smsEndpoints.slot, Number(slot)));
  }

  if (!endpoint) throw new ApiError(404, "فون ونه موندل شو");
  if (!endpoint.apiUrl) throw new ApiError(400, "لومړی د دې فون لپاره API پته خوندي کړئ");

  const result = await testSms(endpoint, testPhone, testMessage);

  if (result.success) {
    await db
      .update(smsEndpoints)
      .set({ lastTestedAt: new Date().toISOString() })
      .where(eq(smsEndpoints.id, endpoint.id));

    return res.respond(200, "د SMS اتصال بریالیتوب سره ازمویل شو", {
      success: true,
      endpoint: endpoint.name,
      response: result.response,
    });
  }

  throw new ApiError(400, result.error);
});

// ─── DELETE SMS SETTINGS (backward compat — clears endpoint URL) ─────────────────
export const deleteSmsSettings = asyncHandler(async (req, res) => {
  const { slot } = req.query;
  if (slot) {
    await db
      .update(smsEndpoints)
      .set({ apiUrl: null, updatedAt: new Date().toISOString() })
      .where(eq(smsEndpoints.slot, Number(slot)));
  }
  res.respond(200, "د SMS تنظیمات ړنګ شول");
});

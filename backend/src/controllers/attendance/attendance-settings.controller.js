import { eq } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { attendanceSettings } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";

// Get all attendance settings
export const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await db.select().from(attendanceSettings);

  res.json({
    success: true,
    data: settings.map(s => ({
      ...s,
      offDays: JSON.parse(s.offDays || "[]"),
    })),
  });
});

// Get settings by institution type
export const getSettingsByType = asyncHandler(async (req, res) => {
  const { institutionType } = req.params;

  const [setting] = await db
    .select()
    .from(attendanceSettings)
    .where(eq(attendanceSettings.institutionType, institutionType));

  if (!setting) {
    throw new ApiError(404, "د دې ادارې لپاره تنظیمات ونه موندل شول");
  }

  res.json({
    success: true,
    data: {
      ...setting,
      offDays: JSON.parse(setting.offDays || "[]"),
    },
  });
});

// Update attendance settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { institutionType } = req.params;
  const { cutoffTime, offDays, isActive } = req.body;

  if (!cutoffTime) {
    throw new ApiError(400, "د حاضرۍ وخت اړین دی");
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(cutoffTime)) {
    throw new ApiError(400, "د وخت فارمټ باید HH:MM وي");
  }

  // Validate offDays array
  if (offDays && !Array.isArray(offDays)) {
    throw new ApiError(400, "د رخصتۍ ورځې باید array وي");
  }

  // Check if setting exists
  const [existing] = await db
    .select()
    .from(attendanceSettings)
    .where(eq(attendanceSettings.institutionType, institutionType));

  const updateData = {
    cutoffTime,
    offDays: JSON.stringify(offDays || []),
    updatedAt: new Date().toISOString(),
  };

  if (typeof isActive === "boolean") {
    updateData.isActive = isActive;
  }

  let result;
  if (existing) {
    // Update existing
    const [updated] = await db
      .update(attendanceSettings)
      .set(updateData)
      .where(eq(attendanceSettings.institutionType, institutionType))
      .returning();
    result = updated;
  } else {
    // Insert new
    const [inserted] = await db
      .insert(attendanceSettings)
      .values({
        institutionType,
        ...updateData,
        isActive: typeof isActive === "boolean" ? isActive : true,
      })
      .returning();
    result = inserted;
  }

  res.json({
    success: true,
    message: "تنظیمات بریالۍ تازه شول",
    data: {
      ...result,
      offDays: JSON.parse(result.offDays || "[]"),
    },
  });
});

export default {
  getAllSettings,
  getSettingsByType,
  updateSettings,
};

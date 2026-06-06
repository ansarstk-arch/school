import db from "../configs/db/db.config.js";
import { attendanceSettings } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Current time in Afghanistan (UTC+4:30) as HH:MM — server-side only.
 */
export const getServerAfghanTime = () => {
  const afghanNow = new Date(Date.now() + 4.5 * 60 * 60 * 1000);
  return `${String(afghanNow.getUTCHours()).padStart(2, "0")}:${String(afghanNow.getUTCMinutes()).padStart(2, "0")}`;
};

/**
 * Returns true when server Afghan time is past the institution cutoff (student is late).
 */
export const isPastCutoffTime = async (institutionType = "School") => {
  const [setting] = await db
    .select()
    .from(attendanceSettings)
    .where(
      and(
        eq(attendanceSettings.institutionType, institutionType),
        eq(attendanceSettings.isActive, true)
      )
    );

  if (!setting?.cutoffTime) return false;

  const currentTime = getServerAfghanTime();
  return currentTime >= setting.cutoffTime;
};

export default { getServerAfghanTime, isPastCutoffTime };

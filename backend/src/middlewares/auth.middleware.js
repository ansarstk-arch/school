import { eq } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { verifyAccessToken, verifyAndRotateRefreshToken } from "../utils/verifyToken.util.js";
import { accessTokenGenerator } from "../utils/genToken.util.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const refreshToken = req.headers["x-refresh-token"] || null;

    // Try to verify access token first
    if (accessToken) {
      const verifyToken = verifyAccessToken(accessToken);
      if (verifyToken.valid) {
        const [user] = await db.select().from(users).where(eq(users.id, verifyToken.decoded.id));
        if (!user) {
          return res.respond(401, "غیر مجاز");
        }
        if (!user.isActive) {
          return res.respond(403, "حساب غیر فعال دی");
        }
        req.user = user;
        return next();
      }
    }

    // If access token is invalid, try refresh token
    if (refreshToken) {
      const refreshVerification = await verifyAndRotateRefreshToken(refreshToken);
      if (!refreshVerification.valid) {
        return res.respond(401, "غیر مجاز");
      }
      if (!refreshVerification.user.isActive) {
        return res.respond(403, "حساب غیر فعال دی");
      }
      
      // Generate new tokens
      const newAccessToken = accessTokenGenerator({ id: refreshVerification.user.id });
      res.setHeader("x-new-access-token", newAccessToken);
      res.setHeader("x-new-refresh-token", refreshVerification.newRefreshToken);
      
      req.user = refreshVerification.user;
      return next();
    }

    return res.respond(401, "غیر مجاز");
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.respond(500, "د تصدیق کولو کې تېروتنه");
  }
};

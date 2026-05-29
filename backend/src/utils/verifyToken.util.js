import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { refreshTokenGenerator } from "./genToken.util.js";

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return { valid: true, expired: false, decoded };
  } catch (error) {
    return { valid: false, expired: error.name === "TokenExpiredError", decoded: null };
  }
};

export const verifyAndRotateRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const [user] = await db
      .select({ 
        id: users.id, 
        name: users.name, 
        email: users.email, 
        role: users.role, 
        permissions: users.permissions,
        isActive: users.isActive 
      })
      .from(users)
      .where(eq(users.id, decoded.id));
      
    if (!user) {
      return { valid: false, user: null };
    }

    // Generate new refresh token
    const newRefreshToken = refreshTokenGenerator({ id: user.id });

    return { valid: true, user, newRefreshToken };
  } catch (error) {
    console.error("Refresh token verification error:", error);
    return { valid: false, user: null };
  }
};

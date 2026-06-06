import { eq } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { accessTokenGenerator, refreshTokenGenerator } from "../../utils/genToken.util.js";
import { comparePassword, hashPassword } from "../../utils/hash.util.js";
import db from "../../configs/db/db.config.js";
import { users } from "../../db/schema.js";
import { parsePermissions } from "../../utils/permissions.util.js";

const resolveLoginEmail = (identifier) => {
  const loginId = String(identifier || "").trim().toLowerCase();
  if (!loginId) return "";
  if (loginId.includes("@")) return loginId;
  return `${loginId}@school.local`;
};

const formatAuthUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.email?.endsWith("@school.local")
    ? user.email.replace("@school.local", "")
    : user.email,
  role: user.role,
  permissions: parsePermissions(user.permissions, user.role),
});

// Register (User)
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  // Check if email already exists
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return res.respond(400, "بریښنالیک دمخه شتون لري");
  }

  // Hash password
  const hashed = await hashPassword(password);
  
  // Create user
  const [user] = await db.insert(users).values({ 
    email, 
    password: hashed, 
    name,
    role: role || "user",
    permissions: "{}"
  }).returning({ 
    id: users.id, 
    name: users.name,
    email: users.email,
    role: users.role 
  });

  // Generate tokens
  const accessToken = accessTokenGenerator({ id: user.id });
  const refreshToken = refreshTokenGenerator({ id: user.id });

  res.respond(201, "ثبت نام بریالی شو", { 
    user: formatAuthUser(user),
    accessToken, 
    refreshToken 
  });
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { password, loginId, identifier, email } = req.body;
  const resolvedEmail = resolveLoginEmail(loginId || identifier || email);

  const [user] = await db.select().from(users).where(eq(users.email, resolvedEmail));
  if (!user) {
    return res.respond(400, "کارن نوم، بریښنالیک یا پاسورډ سم نه دی");
  }

  // Check password
  const match = await comparePassword(password, user.password);
  if (!match) {
    return res.respond(400, "کارن نوم، بریښنالیک یا پاسورډ سم نه دی");
  }

  // Check if account is active
  if (!user.isActive) {
    return res.respond(403, "حساب غیر فعال دی");
  }

  // Generate tokens
  const accessToken = accessTokenGenerator({ id: user.id });
  const refreshToken = refreshTokenGenerator({ id: user.id });

  res.respond(200, "ننوتل بریالی شو", { 
    user: formatAuthUser(user),
    accessToken, 
    refreshToken 
  });
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  res.respond(200, "وتل بریالی شو");
});

// Verify (get current user)
export const verify = asyncHandler(async (req, res) => {
  const [user] = await db
    .select({ 
      id: users.id, 
      name: users.name, 
      email: users.email, 
      role: users.role, 
      permissions: users.permissions,
      isActive: users.isActive,
      createdAt: users.createdAt 
    })
    .from(users)
    .where(eq(users.id, req.user.id));
    
  if (!user) {
    return res.respond(404, "کاربر ونه موندل شو");
  }
  
  if (!user.isActive) {
    return res.respond(403, "حساب غیر فعال دی");
  }

  res.respond(200, "تایید شو", { user: formatAuthUser(user) });
});

// Change Password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
  if (!user) {
    return res.respond(404, "کارن ونه موندل شو");
  }

  const match = await comparePassword(currentPassword, user.password);
  if (!match) {
    return res.respond(400, "اوسنی پاسورډ سم نه دی");
  }

  // Check if new password is same as old
  const isSame = await comparePassword(newPassword, user.password);
  if (isSame) {
    return res.respond(400, "نوی پاسورډ د زاړه سره ورته دی");
  }

  // Hash and update password
  const hashed = await hashPassword(newPassword);
  await db.update(users).set({
    password: hashed,
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, user.id));
  
  res.respond(200, "پاسورډ بدل شو");
});

import { eq, like, and, desc, sql } from "drizzle-orm";
import { currentShamsiYear } from "../../utils/shamsiDate.util.js";
import { columnInShamsiYear } from "../../utils/yearFilter.util.js";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { staff, users } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { hashPassword } from "../../utils/hash.util.js";
import { parsePermissions, serializePermissions } from "../../utils/permissions.util.js";
import { compressImage, deleteImage, getImageUrl } from "../../utils/imageProcessor.util.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../../../uploads/staff");

const processUploadedImage = async (file) => {
  if (!file) return null;
  try {
    const year = new Date().getFullYear();
    const yearDir = path.join(UPLOAD_DIR, String(year));
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }
    const compressedPath = path.join(yearDir, `compressed-${file.filename}`);
    await compressImage(file.path, compressedPath, 200);
    return `${year}/${path.basename(compressedPath)}`;
  } catch (err) {
    console.error("Image processing error:", err);
    return null;
  }
};

const parseStaffType = (record) => {
  if (!record?.staffType) return ["School"];
  if (Array.isArray(record.staffType)) return record.staffType;
  try {
    return JSON.parse(record.staffType);
  } catch {
    return [record.staffType];
  }
};

const withImageUrl = (record) => {
  if (!record) return record;
  return {
    ...record,
    imageUrl: record.image ? getImageUrl(record.image, "staff") : null,
    staffType: parseStaffType(record),
  };
};

const parsePermissionsBody = (raw) => {
  if (!raw) return { modules: {}, institutions: { School: true, Center: false, Madrasa: false } };
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      throw new ApiError(400, "د لاسرسي معلومات په سمه توګه نه دي لیږل شوي");
    }
  }
  return raw;
};

const enrichStaffWithUser = async (staffRecord) => {
  const parsed = withImageUrl(staffRecord);
  if (!staffRecord.userId) {
    return { ...parsed, hasSystemAccess: false };
  }

  const [user] = await db.select().from(users).where(eq(users.id, staffRecord.userId));
  if (!user) {
    return { ...parsed, hasSystemAccess: false };
  }

  const permissions = parsePermissions(user.permissions, user.role);
  return {
    ...parsed,
    hasSystemAccess: true,
    userId: user.id,
    username: user.email?.endsWith("@school.local")
      ? user.email.replace("@school.local", "")
      : user.email,
    role: user.role,
    permissions,
    userStatus: user.isActive,
  };
};

const syncUserAccount = async ({
  staffId,
  existingUserId,
  name,
  username,
  password,
  role,
  permissionsRaw,
  hasSystemAccess,
  isActive,
}) => {
  const wantsAccess = hasSystemAccess === true || hasSystemAccess === "true";

  if (!wantsAccess) {
    if (existingUserId) {
      await db.update(users)
        .set({ isActive: false, updatedAt: new Date().toISOString() })
        .where(eq(users.id, existingUserId));
      await db.update(staff)
        .set({ userId: null, updatedAt: new Date().toISOString() })
        .where(eq(staff.id, staffId));
    }
    return null;
  }

  if (!username?.trim()) throw new ApiError(400, "د کارن نوم اړین دی");
  const email = `${String(username).trim().toLowerCase()}@school.local`;
  const permissionsData = parsePermissionsBody(permissionsRaw);
  const moduleCount = Object.values(permissionsData.modules || {}).filter(Boolean).length;
  if (moduleCount === 0) throw new ApiError(400, "لږ تر لږه یو ماژول وټاکئ");

  const permissionsStr = serializePermissions({
    modules: permissionsData.modules || {},
    institutions: permissionsData.institutions || {},
  });

  if (existingUserId) {
    const [currentUser] = await db.select().from(users).where(eq(users.id, existingUserId));
    if (!currentUser) throw new ApiError(404, "د کارن حساب ونه موندل شو");

    if (email !== currentUser.email) {
      const [dup] = await db.select().from(users).where(eq(users.email, email));
      if (dup) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");
    }

    const updateUser = {
      name,
      email,
      role: role || "custom",
      permissions: permissionsStr,
      isActive: isActive !== "inactive",
      updatedAt: new Date().toISOString(),
    };
    if (password?.trim()) {
      updateUser.password = await hashPassword(password);
    }
    await db.update(users).set(updateUser).where(eq(users.id, existingUserId));
    return existingUserId;
  }

  if (!password?.trim()) throw new ApiError(400, "پاسورډ اړین دی");

  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");

  const hashed = await hashPassword(password);
  const [newUser] = await db.insert(users).values({
    name,
    email,
    password: hashed,
    role: role || "custom",
    permissions: permissionsStr,
    isActive: isActive !== "inactive",
  }).returning({ id: users.id });

  await db.update(staff)
    .set({ userId: newUser.id, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, staffId));

  return newUser.id;
};

export const getAllStaff = asyncHandler(async (req, res) => {
  const { id, name, phone, position, staffType, joiningYear, academicYear, page = 1, limit = 12 } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (id) conditions.push(eq(staff.id, Number(id)));
  if (name) conditions.push(like(staff.name, `%${name}%`));
  if (phone) conditions.push(like(staff.phone, `%${phone}%`));
  if (position) conditions.push(like(staff.position, `%${position}%`));

  const yearToUse = joiningYear || academicYear || String(currentShamsiYear());
  conditions.push(columnInShamsiYear(staff.joiningDate, yearToUse));

  if (staffType) {
    conditions.push(like(staff.staffType, `%"${staffType}"%`));
  }

  const { status } = req.query;
  if (status) conditions.push(eq(staff.status, status));
  else conditions.push(eq(staff.status, "active"));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [staffList, countResult] = await Promise.all([
    db.select().from(staff).where(whereClause).orderBy(desc(staff.createdAt)).limit(Number(limit)).offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(staff).where(whereClause),
  ]);

  const enriched = await Promise.all(staffList.map(enrichStaffWithUser));

  res.respond(200, "کارمندان ترلاسه شول", {
    staff: enriched,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
  if (!staffMember) throw new ApiError(404, "کارمند ونه موندل شو");
  res.respond(200, "کارمند ترلاسه شو", { staff: await enrichStaffWithUser(staffMember) });
});

export const createStaff = asyncHandler(async (req, res) => {
  const {
    name, fatherName, phone, idCardNumber, position, staffType: staffTypeRaw,
    salary, address, notes, academicYear, status,
    hasSystemAccess, username, password, role, permissions,
  } = req.body;

  if (phone) {
    const [existingStaff] = await db.select().from(staff).where(eq(staff.phone, phone));
    if (existingStaff) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");
  }

  let staffType;
  try {
    staffType = typeof staffTypeRaw === "string" ? JSON.parse(staffTypeRaw) : staffTypeRaw;
  } catch {
    throw new ApiError(400, "د کارمند ډول په سمه توګه نه دی لیږل شوی");
  }

  if (!staffType || !Array.isArray(staffType) || staffType.length === 0) {
    throw new ApiError(400, "د کارمند ډول اړین دی - لږترلږه یو ډول وټاکئ");
  }

  const validTypes = ["School", "Center", "Madrasa"];
  if (staffType.filter((t) => !validTypes.includes(t)).length > 0) {
    throw new ApiError(400, "د کارمند ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  if (!position) throw new ApiError(400, "مسئولیت اړین دی");

  const imageName = await processUploadedImage(req.file);

  const [newStaff] = await db.insert(staff).values({
    name,
    fatherName: fatherName || null,
    phone: phone || null,
    idCardNumber: idCardNumber || null,
    position,
    staffType: JSON.stringify(staffType),
    salary: salary ? parseFloat(salary) : null,
    address: address || null,
    joiningDate: new Date().toISOString().split("T")[0],
    academicYear: academicYear || null,
    notes: notes || null,
    image: imageName,
    status: status || "active",
  }).returning();

  await syncUserAccount({
    staffId: newStaff.id,
    existingUserId: null,
    name,
    username,
    password,
    role,
    permissionsRaw: permissions,
    hasSystemAccess,
    isActive: status || "active",
  });

  const [refreshed] = await db.select().from(staff).where(eq(staff.id, newStaff.id));
  res.respond(201, "کارمند بریالیتوب سره ثبت شو", {
    staff: await enrichStaffWithUser(refreshed),
  });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name, fatherName, phone, idCardNumber, position, staffType: staffTypeRaw,
    salary, address, notes, status, academicYear, removeImage,
    hasSystemAccess, username, password, role, permissions,
  } = req.body;

  const [existingStaff] = await db.select().from(staff).where(eq(staff.id, id));
  if (!existingStaff) throw new ApiError(404, "کارمند ونه موندل شو");

  if (phone && phone !== existingStaff.phone) {
    const [phoneExists] = await db.select().from(staff).where(eq(staff.phone, phone));
    if (phoneExists) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");
  }

  let staffType;
  if (staffTypeRaw !== undefined) {
    try {
      staffType = typeof staffTypeRaw === "string" ? JSON.parse(staffTypeRaw) : staffTypeRaw;
    } catch {
      throw new ApiError(400, "د کارمند ډول په سمه توګه نه دی لیږل شوی");
    }
    if (!Array.isArray(staffType) || staffType.length === 0) {
      throw new ApiError(400, "د کارمند ډول اړین دی - لږترلږه یو ډول وټاکئ");
    }
    const validTypes = ["School", "Center", "Madrasa"];
    if (staffType.filter((t) => !validTypes.includes(t)).length > 0) {
      throw new ApiError(400, "د کارمند ډول باید ښوونځی، مرکز یا مدرسه وي");
    }
  }

  let newImageName = existingStaff.image;
  if (req.file) {
    if (existingStaff.image) await deleteImage(path.join(UPLOAD_DIR, existingStaff.image));
    newImageName = await processUploadedImage(req.file);
  } else if (removeImage === "true" || removeImage === true) {
    if (existingStaff.image) await deleteImage(path.join(UPLOAD_DIR, existingStaff.image));
    newImageName = null;
  }

  const updateData = { updatedAt: new Date().toISOString(), image: newImageName };
  if (name !== undefined) updateData.name = name;
  if (fatherName !== undefined) updateData.fatherName = fatherName || null;
  if (phone !== undefined) updateData.phone = phone || null;
  if (idCardNumber !== undefined) updateData.idCardNumber = idCardNumber || null;
  if (position !== undefined) updateData.position = position;
  if (staffType !== undefined) updateData.staffType = JSON.stringify(staffType);
  if (salary !== undefined) updateData.salary = salary ? parseFloat(salary) : null;
  if (address !== undefined) updateData.address = address || null;
  if (notes !== undefined) updateData.notes = notes || null;
  if (status !== undefined) updateData.status = status;
  if (academicYear !== undefined) updateData.academicYear = academicYear || null;

  const [updatedStaff] = await db.update(staff).set(updateData).where(eq(staff.id, id)).returning();

  await syncUserAccount({
    staffId: updatedStaff.id,
    existingUserId: existingStaff.userId,
    name: name ?? existingStaff.name,
    username,
    password,
    role,
    permissionsRaw: permissions,
    hasSystemAccess,
    isActive: status ?? existingStaff.status,
  });

  const [refreshed] = await db.select().from(staff).where(eq(staff.id, id));
  res.respond(200, "کارمند بریالیتوب سره تازه شو", {
    staff: await enrichStaffWithUser(refreshed),
  });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existingStaff] = await db.select().from(staff).where(eq(staff.id, id));
  if (!existingStaff) throw new ApiError(404, "کارمند ونه موندل شو");

  if (existingStaff.image) await deleteImage(path.join(UPLOAD_DIR, existingStaff.image));

  if (existingStaff.userId) {
    await db.update(users)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(users.id, existingStaff.userId));
  }

  await db.delete(staff).where(eq(staff.id, id));
  res.respond(200, "کارمند بریالیتوب سره ړنګ شو");
});

export const resetStaffPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const [staffMember] = await db.select().from(staff).where(eq(staff.id, Number(id)));
  if (!staffMember) throw new ApiError(404, "کارمند ونه موندل شو");
  if (!staffMember.userId) throw new ApiError(400, "دا کارمند د ننوتلو حساب نلري");

  const hashed = await hashPassword(newPassword);
  await db.update(users)
    .set({ password: hashed, updatedAt: new Date().toISOString() })
    .where(eq(users.id, staffMember.userId));

  res.respond(200, "پاسورډ بریالۍ بدل شو");
});

export const toggleStaffStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    throw new ApiError(400, "حالت باید active یا inactive وي");
  }

  const [existing] = await db.select().from(staff).where(eq(staff.id, id));
  if (!existing) throw new ApiError(404, "کارمند ونه موندل شو");

  const [updated] = await db.update(staff)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, id))
    .returning();

  if (existing.userId) {
    await db.update(users)
      .set({ isActive: status === "active", updatedAt: new Date().toISOString() })
      .where(eq(users.id, existing.userId));
  }

  res.respond(200, status === "active" ? "کارمند فعال شو" : "کارمند غیر فعال شو", {
    staff: await enrichStaffWithUser(updated),
  });
});

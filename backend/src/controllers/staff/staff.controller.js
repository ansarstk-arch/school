import { eq, like, and, desc, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { staff } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { hashPassword } from "../../utils/hash.util.js";
import { compressImage, deleteImage, getImageUrl } from "../../utils/imageProcessor.util.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../../uploads/staff');

// Helper: process uploaded image → compress and return filename
const processUploadedImage = async (file) => {
  if (!file) return null;
  try {
    // Create year folder
    const year = new Date().getFullYear();
    const yearDir = path.join(UPLOAD_DIR, String(year));
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }
    
    const compressedPath = path.join(yearDir, `compressed-${file.filename}`);
    await compressImage(file.path, compressedPath, 200);
    return `${year}/${path.basename(compressedPath)}`;
  } catch (err) {
    console.error('Image processing error:', err);
    return null;
  }
};

// Helper: attach imageUrl to a staff record
const withImageUrl = (record) => {
  if (!record) return record;
  
  let parsedStaffType = ["School"]; // Default value
  if (record.staffType) {
    try {
      // If it's already an array, use it directly
      if (Array.isArray(record.staffType)) {
        parsedStaffType = record.staffType;
      } else if (typeof record.staffType === 'string') {
        // Try to parse as JSON, if it fails, treat as single value
        try {
          parsedStaffType = JSON.parse(record.staffType);
        } catch {
          // If JSON parsing fails, treat as single string value
          parsedStaffType = [record.staffType];
        }
      }
    } catch (error) {
      console.error('Error parsing staffType:', error);
      parsedStaffType = ["School"];
    }
  }
  
  return {
    ...record,
    imageUrl: record.image ? getImageUrl(record.image, 'staff') : null,
    staffType: parsedStaffType,
  };
};

// ─── GET ALL STAFF ─────────────────────────────────────────────────────────────
export const getAllStaff = asyncHandler(async (req, res) => {
  const { id, name, phone, position, staffType, joiningYear, page = 1, limit = 12 } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (id)       conditions.push(eq(staff.id, Number(id)));
  if (name)     conditions.push(like(staff.name, `%${name}%`));
  if (phone)    conditions.push(like(staff.phone, `%${phone}%`));
  if (position) conditions.push(like(staff.position, `%${position}%`));
  if (joiningYear) conditions.push(like(staff.joiningDate, `${joiningYear}%`));
  
  // Filter by staff type (JSON array contains the type)
  if (staffType) {
    conditions.push(like(staff.staffType, `%"${staffType}"%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [staffList, countResult] = await Promise.all([
    db.select()
      .from(staff)
      .where(whereClause)
      .orderBy(desc(staff.createdAt))
      .limit(Number(limit))
      .offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(staff).where(whereClause),
  ]);

  res.respond(200, "کارمندان ترلاسه شول", {
    staff: staffList.map(withImageUrl),
    pagination: {
      total: countResult[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

// ─── GET STAFF BY ID ───────────────────────────────────────────────────────────
export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));

  if (!staffMember) throw new ApiError(404, "کارمند ونه موندل شو");

  res.respond(200, "کارمند ترلاسه شو", { staff: withImageUrl(staffMember) });
});

// ─── CREATE STAFF ──────────────────────────────────────────────────────────────
export const createStaff = asyncHandler(async (req, res) => {
  const { name, fatherName, phone, idCardNumber, position, staffType: staffTypeRaw, salary, address, notes } = req.body;

  // Check if phone already exists
  if (phone) {
    const [existingStaff] = await db.select().from(staff).where(eq(staff.phone, phone));
    if (existingStaff) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");
  }

  // Parse staffType from JSON string (sent from FormData)
  let staffType;
  try {
    staffType = typeof staffTypeRaw === 'string' ? JSON.parse(staffTypeRaw) : staffTypeRaw;
  } catch (e) {
    throw new ApiError(400, "د کارمند ډول په سمه توګه نه دی لیږل شوی");
  }

  // Validate staffType - must be array with at least one value
  if (!staffType || !Array.isArray(staffType) || staffType.length === 0) {
    throw new ApiError(400, "د کارمند ډول اړین دی - لږترلږه یو ډول وټاکئ");
  }

  const validTypes = ["School", "Center", "Madrasa"];
  const invalidTypes = staffType.filter(type => !validTypes.includes(type));
  if (invalidTypes.length > 0) {
    throw new ApiError(400, "د کارمند ډول باید ښوونځی، مرکز یا مدرسه وي");
  }

  // Process image
  const imageName = await processUploadedImage(req.file);

  // Ensure position is provided (validator should handle this, but double-check here)
  if (!position) throw new ApiError(400, "مسئولیت اړین دی");

  const [newStaff] = await db.insert(staff).values({
    name,
    fatherName: fatherName || null,
    phone: phone || null,
    idCardNumber: idCardNumber || null,
    position: position,
    staffType: JSON.stringify(staffType), // Store as JSON array
    salary: salary ? parseFloat(salary) : null,
    address: address || null,
    joiningDate: new Date().toISOString().split('T')[0],
    notes: notes || null,
    image: imageName,
    status: "active",
  }).returning();

  // Parse staffType back to array for response
  const responseStaff = {
    ...newStaff,
    staffType: JSON.parse(newStaff.staffType)
  };

  res.respond(201, "کارمند بریالیتوب سره ثبت شو", { staff: withImageUrl(responseStaff) });
});

// ─── UPDATE STAFF ──────────────────────────────────────────────────────────────
export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, fatherName, phone, idCardNumber, position, staffType: staffTypeRaw, salary, address, notes, status, removeImage } = req.body;

  const [existingStaff] = await db.select().from(staff).where(eq(staff.id, id));
  if (!existingStaff) throw new ApiError(404, "کارمند ونه موندل شو");

  // Check if phone is being changed and if it already exists
  if (phone && phone !== existingStaff.phone) {
    const [phoneExists] = await db.select().from(staff).where(eq(staff.phone, phone));
    if (phoneExists) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");
  }

  // Parse staffType from JSON string (sent from FormData) if provided
  let staffType;
  if (staffTypeRaw !== undefined) {
    try {
      staffType = typeof staffTypeRaw === 'string' ? JSON.parse(staffTypeRaw) : staffTypeRaw;
    } catch (e) {
      throw new ApiError(400, "د کارمند ډول په سمه توګه نه دی لیږل شوی");
    }

    // Validate staffType if provided
    if (!Array.isArray(staffType) || staffType.length === 0) {
      throw new ApiError(400, "د کارمند ډول اړین دی - لږترلږه یو ډول وټاکئ");
    }

    const validTypes = ["School", "Center", "Madrasa"];
    const invalidTypes = staffType.filter(type => !validTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new ApiError(400, "د کارمند ډول باید ښوونځی، مرکز یا مدرسه وي");
    }
  }

  let newImageName = existingStaff.image;

  if (req.file) {
    if (existingStaff.image) await deleteImage(path.join(UPLOAD_DIR, existingStaff.image));
    newImageName = await processUploadedImage(req.file);
  } else if (removeImage === 'true' || removeImage === true) {
    if (existingStaff.image) await deleteImage(path.join(UPLOAD_DIR, existingStaff.image));
    newImageName = null;
  }

  const updateData = { updatedAt: new Date().toISOString(), image: newImageName };
  if (name !== undefined)         updateData.name = name;
  if (fatherName !== undefined)   updateData.fatherName = fatherName || null;
  if (phone !== undefined)        updateData.phone = phone || null;
  if (idCardNumber !== undefined) updateData.idCardNumber = idCardNumber || null;
  if (position !== undefined)     updateData.position = position;
  if (staffType !== undefined)    updateData.staffType = JSON.stringify(staffType);
  if (salary !== undefined)       updateData.salary = salary ? parseFloat(salary) : null;
  if (address !== undefined)      updateData.address = address || null;
  if (notes !== undefined)        updateData.notes = notes || null;
  if (status !== undefined)       updateData.status = status;

  const [updatedStaff] = await db.update(staff).set(updateData).where(eq(staff.id, id)).returning();

  // Parse staffType back to array for response
  const responseStaff = {
    ...updatedStaff,
    staffType: JSON.parse(updatedStaff.staffType)
  };

  res.respond(200, "کارمند بریالیتوب سره تازه شو", { staff: withImageUrl(responseStaff) });
});

// ─── DELETE STAFF ──────────────────────────────────────────────────────────────
export const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingStaff] = await db.select().from(staff).where(eq(staff.id, id));
  if (!existingStaff) throw new ApiError(404, "کارمند ونه موندل شو");

  if (existingStaff.image) await deleteImage(path.join(UPLOAD_DIR, existingStaff.image));

  await db.delete(staff).where(eq(staff.id, id));

  res.respond(200, "کارمند بریالیتوب سره ړنګ شو");
});

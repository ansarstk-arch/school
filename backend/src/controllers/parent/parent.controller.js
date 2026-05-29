import { eq, like, and, desc, sql, inArray, or } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { parents, parentStudents, students, classes } from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";
import { hashPassword } from "../../utils/hash.util.js";

// ─── GET CLASSES BY TYPES ──────────────────────────────────────────────────────
export const getClassesByTypes = asyncHandler(async (req, res) => {
  const { types, academicYear } = req.query;

  if (!types) throw new ApiError(400, "د مؤسسې ډول اړین دی");
  if (!academicYear) throw new ApiError(400, "تعلیمي کال اړین دی");

  // Parse types if it's a string
  const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types;

  if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
    throw new ApiError(400, "د مؤسسې ډول باید لیست وي");
  }

  const classesList = await db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      type: classes.type,
      academicYear: classes.academicYear,
    })
    .from(classes)
    .where(and(
      inArray(classes.type, parsedTypes),
      eq(classes.academicYear, academicYear)
    ))
    .orderBy(classes.type, classes.name, classes.section);

  // Group classes by type
  const groupedClasses = {};
  parsedTypes.forEach(type => {
    groupedClasses[type] = classesList.filter(c => c.type === type);
  });

  res.respond(200, "ټولګي ترلاسه شول", { classes: groupedClasses });
});

// ─── GET STUDENTS BY TYPES AND CLASSES ─────────────────────────────────────────
export const getStudentsByTypesAndClasses = asyncHandler(async (req, res) => {
  const { types, classIds, academicYear } = req.query;

  if (!types) throw new ApiError(400, "د مؤسسې ډول اړین دی");
  if (!academicYear) throw new ApiError(400, "تعلیمي کال اړین دی");

  // Parse types and classIds
  const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types;
  const parsedClassIds = classIds ? (typeof classIds === 'string' ? JSON.parse(classIds) : classIds) : null;

  if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
    throw new ApiError(400, "د مؤسسې ډول باید لیست وي");
  }

  const conditions = [eq(students.academicYear, academicYear)];

  // If specific classes are selected, filter by them
  if (parsedClassIds && Object.keys(parsedClassIds).length > 0) {
    const classIdValues = Object.values(parsedClassIds).filter(id => id);
    if (classIdValues.length > 0) {
      conditions.push(inArray(students.classId, classIdValues.map(Number)));
    }
  } else {
    // Otherwise, filter by types
    const classesInTypes = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(
        inArray(classes.type, parsedTypes),
        eq(classes.academicYear, academicYear)
      ));
    
    const classIdsInTypes = classesInTypes.map(c => c.id);
    if (classIdsInTypes.length > 0) {
      conditions.push(inArray(students.classId, classIdsInTypes));
    } else {
      // No classes found for these types
      return res.respond(200, "زده کوونکي ترلاسه شول", { students: [] });
    }
  }

  const studentsList = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      fatherName: students.fatherName,
      rollNumber: students.rollNumber,
      classId: students.classId,
      className: classes.name,
      classSection: classes.section,
      classType: classes.type,
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(and(...conditions))
    .orderBy(students.fullName);

  // Format students with combined class name
  const formattedStudents = studentsList.map(s => ({
    id: s.id,
    fullName: s.fullName,
    fatherName: s.fatherName,
    rollNumber: s.rollNumber,
    classId: s.classId,
    className: s.className && s.classSection 
      ? `${s.className} - ${s.classSection} (${s.classType})`
      : s.className 
        ? `${s.className} (${s.classType})`
        : null,
  }));

  res.respond(200, "زده کوونکي ترلاسه شول", { students: formattedStudents });
});

// ─── GET ALL PARENTS ───────────────────────────────────────────────────────────
export const getAllParents = asyncHandler(async (req, res) => {
  const { 
    id, name, phone, instituteType, classId, username, 
    page = 1, limit = 50 
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (id)            conditions.push(eq(parents.id, Number(id)));
  if (name)          conditions.push(like(parents.name, `%${name}%`));
  if (phone)         conditions.push(like(parents.phone, `%${phone}%`));
  if (username)      conditions.push(like(parents.username, `%${username}%`));
  if (classId)       conditions.push(eq(parents.classId, Number(classId)));
  
  // Filter by institute type (stored as JSON array)
  if (instituteType) {
    conditions.push(like(parents.instituteType, `%"${instituteType}"%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [parentsList, countResult] = await Promise.all([
    db.select({
      id: parents.id,
      name: parents.name,
      phone: parents.phone,
      idCardNumber: parents.idCardNumber,
      instituteType: parents.instituteType,
      classId: parents.classId,
      className: classes.name,
      classSection: classes.section,
      username: parents.username,
      registeredAt: parents.registeredAt,
      notes: parents.notes,
      createdAt: parents.createdAt,
      updatedAt: parents.updatedAt,
    })
      .from(parents)
      .leftJoin(classes, eq(parents.classId, classes.id))
      .where(whereClause)
      .orderBy(desc(parents.createdAt))
      .limit(Number(limit))
      .offset(offset),
    db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(parents)
      .leftJoin(classes, eq(parents.classId, classes.id))
      .where(whereClause),
  ]);

  // Fetch students for each parent
  if (parentsList.length > 0) {
    const parentIds = parentsList.map(p => p.id);
    const parentStudentLinks = await db
      .select({
        parentId: parentStudents.parentId,
        studentId: parentStudents.studentId,
        studentName: students.fullName,
        studentRollNumber: students.rollNumber,
      })
      .from(parentStudents)
      .leftJoin(students, eq(parentStudents.studentId, students.id))
      .where(inArray(parentStudents.parentId, parentIds));

    // Group students by parent
    const studentsByParent = {};
    parentStudentLinks.forEach(link => {
      if (!studentsByParent[link.parentId]) {
        studentsByParent[link.parentId] = [];
      }
      studentsByParent[link.parentId].push({
        id: link.studentId,
        name: link.studentName,
        rollNumber: link.studentRollNumber,
      });
    });

    // Attach students and format data
    const formattedParents = parentsList.map(p => {
      const className = p.className 
        ? `${p.className}${p.classSection ? ` - ${p.classSection}` : ''}` 
        : null;
      
      // Parse instituteType from JSON
      let instituteTypes = ["School"];
      try {
        instituteTypes = JSON.parse(p.instituteType);
      } catch (e) {
        instituteTypes = [p.instituteType || "School"];
      }

      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        idCardNumber: p.idCardNumber,
        instituteTypes,
        className,
        username: p.username,
        registeredAt: p.registeredAt,
        notes: p.notes,
        students: studentsByParent[p.id] || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return res.respond(200, "والدین ترلاسه شول", {
      parents: formattedParents,
      pagination: {
        total: countResult[0]?.count || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  }

  res.respond(200, "والدین ترلاسه شول", {
    parents: [],
    pagination: {
      total: 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: 0,
    },
  });
});

// ─── GET PARENT BY ID ──────────────────────────────────────────────────────────
export const getParentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [parent] = await db.select().from(parents).where(eq(parents.id, id));
  if (!parent) throw new ApiError(404, "والد ونه موندل شو");

  // Fetch students
  const studentLinks = await db
    .select({
      studentId: parentStudents.studentId,
      studentName: students.fullName,
      studentRollNumber: students.rollNumber,
    })
    .from(parentStudents)
    .leftJoin(students, eq(parentStudents.studentId, students.id))
    .where(eq(parentStudents.parentId, id));

  // Parse instituteType
  let instituteTypes = ["School"];
  try {
    instituteTypes = JSON.parse(parent.instituteType);
  } catch (e) {
    instituteTypes = [parent.instituteType || "School"];
  }

  res.respond(200, "والد ترلاسه شو", {
    parent: {
      ...parent,
      instituteTypes,
      students: studentLinks.map(s => ({
        id: s.studentId,
        name: s.studentName,
        rollNumber: s.studentRollNumber,
      })),
    },
  });
});

// ─── CREATE PARENT ─────────────────────────────────────────────────────────────
export const createParent = asyncHandler(async (req, res) => {
  const {
    name, phone, idCardNumber, instituteTypes, classIds,
    studentIds, username, password, address, registeredAt, notes
  } = req.body;

  // Check for duplicate phone
  const [existingPhone] = await db.select().from(parents).where(eq(parents.phone, phone));
  if (existingPhone) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");

  // Check for duplicate username
  const [existingUsername] = await db.select().from(parents).where(eq(parents.username, username));
  if (existingUsername) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");

  // Validate students exist
  const studentRecords = await db.select().from(students).where(inArray(students.id, studentIds.map(Number)));
  if (studentRecords.length !== studentIds.length) {
    throw new ApiError(400, "ځینې زده کوونکي ونه موندل شول");
  }

  // Determine primary classId (first student's class or first selected class)
  let primaryClassId = null;
  if (classIds && Object.keys(classIds).length > 0) {
    const firstType = instituteTypes[0];
    primaryClassId = classIds[firstType] ? Number(classIds[firstType]) : null;
  }
  if (!primaryClassId && studentRecords.length > 0) {
    primaryClassId = studentRecords[0].classId;
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create parent
  const [newParent] = await db.insert(parents).values({
    name,
    phone,
    idCardNumber: idCardNumber || null,
    instituteType: JSON.stringify(instituteTypes),
    classId: primaryClassId,
    username,
    password: hashedPassword,
    registeredAt: registeredAt || new Date().toISOString().split('T')[0],
    notes: notes || null,
  }).returning();

  // Create parent-student links
  const parentStudentLinks = studentIds.map(studentId => ({
    parentId: newParent.id,
    studentId: Number(studentId),
  }));

  await db.insert(parentStudents).values(parentStudentLinks);

  // Fetch created students
  const createdStudents = await db
    .select({
      studentId: parentStudents.studentId,
      studentName: students.fullName,
      studentRollNumber: students.rollNumber,
    })
    .from(parentStudents)
    .leftJoin(students, eq(parentStudents.studentId, students.id))
    .where(eq(parentStudents.parentId, newParent.id));

  res.respond(201, "والد بریالیتوب سره ثبت شو", {
    parent: {
      ...newParent,
      instituteTypes,
      students: createdStudents.map(s => ({
        id: s.studentId,
        name: s.studentName,
        rollNumber: s.studentRollNumber,
      })),
    },
  });
});

// ─── UPDATE PARENT ─────────────────────────────────────────────────────────────
export const updateParent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name, phone, idCardNumber, instituteTypes, classIds,
    studentIds, username, password, address, registeredAt, notes
  } = req.body;

  const [existingParent] = await db.select().from(parents).where(eq(parents.id, id));
  if (!existingParent) throw new ApiError(404, "والد ونه موندل شو");

  // Check for duplicate phone
  if (phone && phone !== existingParent.phone) {
    const [phoneExists] = await db.select().from(parents).where(eq(parents.phone, phone));
    if (phoneExists) throw new ApiError(400, "دا ټېلیفون نمبر دمخه شتون لري");
  }

  // Check for duplicate username
  if (username && username !== existingParent.username) {
    const [usernameExists] = await db.select().from(parents).where(eq(parents.username, username));
    if (usernameExists) throw new ApiError(400, "دا کارن نوم دمخه شتون لري");
  }

  // Validate students if provided
  if (studentIds) {
    const studentRecords = await db.select().from(students).where(inArray(students.id, studentIds.map(Number)));
    if (studentRecords.length !== studentIds.length) {
      throw new ApiError(400, "ځینې زده کوونکي ونه موندل شول");
    }
  }

  // Prepare update data
  const updateData = { updatedAt: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (idCardNumber !== undefined) updateData.idCardNumber = idCardNumber || null;
  if (instituteTypes !== undefined) updateData.instituteType = JSON.stringify(instituteTypes);
  if (username !== undefined) updateData.username = username;
  if (registeredAt !== undefined) updateData.registeredAt = registeredAt || null;
  if (notes !== undefined) updateData.notes = notes || null;

  // Update classId if instituteTypes or classIds changed
  if (instituteTypes && classIds && Object.keys(classIds).length > 0) {
    const firstType = instituteTypes[0];
    updateData.classId = classIds[firstType] ? Number(classIds[firstType]) : null;
  }

  // Hash password if provided
  if (password) {
    updateData.password = await hashPassword(password);
  }

  const [updatedParent] = await db.update(parents).set(updateData).where(eq(parents.id, id)).returning();

  // Update parent-student links if studentIds provided
  if (studentIds) {
    await db.delete(parentStudents).where(eq(parentStudents.parentId, id));
    
    const parentStudentLinks = studentIds.map(studentId => ({
      parentId: Number(id),
      studentId: Number(studentId),
    }));

    await db.insert(parentStudents).values(parentStudentLinks);
  }

  // Fetch updated students
  const updatedStudents = await db
    .select({
      studentId: parentStudents.studentId,
      studentName: students.fullName,
      studentRollNumber: students.rollNumber,
    })
    .from(parentStudents)
    .leftJoin(students, eq(parentStudents.studentId, students.id))
    .where(eq(parentStudents.parentId, id));

  // Parse instituteTypes
  let parsedInstituteTypes = ["School"];
  try {
    parsedInstituteTypes = JSON.parse(updatedParent.instituteType);
  } catch (e) {
    parsedInstituteTypes = [updatedParent.instituteType || "School"];
  }

  res.respond(200, "والد بریالیتوب سره تازه شو", {
    parent: {
      ...updatedParent,
      instituteTypes: parsedInstituteTypes,
      students: updatedStudents.map(s => ({
        id: s.studentId,
        name: s.studentName,
        rollNumber: s.studentRollNumber,
      })),
    },
  });
});

// ─── DELETE PARENT ─────────────────────────────────────────────────────────────
export const deleteParent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingParent] = await db.select().from(parents).where(eq(parents.id, id));
  if (!existingParent) throw new ApiError(404, "والد ونه موندل شو");

  // Delete parent-student links (cascade will handle this, but explicit is better)
  await db.delete(parentStudents).where(eq(parentStudents.parentId, id));

  // Delete parent
  await db.delete(parents).where(eq(parents.id, id));

  res.respond(200, "والد بریالیتوب سره ړنګ شو");
});

// ─── CHANGE PARENT PASSWORD ────────────────────────────────────────────────────
export const changeParentPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "فاسورډ باید لږترلږه ۶ توري ولري");
  }

  if (!confirmPassword) {
    throw new ApiError(400, "د فاسورډ تایید اړین دی");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "فاسورډونه سره سمون نلري");
  }

  const [existingParent] = await db.select().from(parents).where(eq(parents.id, id));
  if (!existingParent) throw new ApiError(404, "والد ونه موندل شو");

  const hashedPassword = await hashPassword(newPassword);

  await db.update(parents)
    .set({ 
      password: hashedPassword,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(parents.id, id));

  res.respond(200, "فاسورډ بریالیتوب سره بدل شو");
});

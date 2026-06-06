import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { asyncHandler } from '../../utils/AsyncHandler.util.js';
import db from '../../configs/db/db.config.js';
import { expenseCategories } from '../../db/schema.js';
import ApiError from '../../utils/ApiError.util.js';

export const listCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortDir = 'desc',
    q = '',
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  
  // Build where conditions
  const conditions = [];
  if (q) {
    const queryPattern = `%${q}%`;
    conditions.push(like(expenseCategories.name, queryPattern));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Define sort fields
  const sortFields = {
    name: expenseCategories.name,
    createdAt: expenseCategories.createdAt,
  };

  const sortColumn = sortFields[String(sortBy)] || expenseCategories.createdAt;
  const sortDirection = String(sortDir).toLowerCase() === 'asc' ? asc : desc;

  // Build query
  let categoriesQuery = db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      createdAt: expenseCategories.createdAt,
      updatedAt: expenseCategories.updatedAt,
    })
    .from(expenseCategories);

  if (whereClause) {
    categoriesQuery = categoriesQuery.where(whereClause);
  }

  categoriesQuery = categoriesQuery
    .orderBy(sortDirection(sortColumn))
    .limit(Number(limit))
    .offset(offset);

  // Count query
  let countQuery = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(expenseCategories);

  if (whereClause) {
    countQuery = countQuery.where(whereClause);
  }

  const [categoriesList, countResult] = await Promise.all([
    categoriesQuery,
    countQuery,
  ]);

  const total = countResult[0]?.count || 0;

  res.respond(200, 'د لګښتونو کټګورۍ ترلاسه شوې', {
    categories: categoriesList,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Check if category with same name exists
  const [existing] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.name, name));

  if (existing) {
    throw new ApiError(400, 'دا کټګوري دمخه شتون لري');
  }

  const [created] = await db
    .insert(expenseCategories)
    .values({
      name,
    })
    .returning();

  res.respond(201, 'کټګوري بریالیتوب سره ثبت شوه', { category: created });
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [category] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, Number(id)));

  if (!category) {
    throw new ApiError(404, 'کټګوري ونه موندل شوه');
  }

  res.respond(200, 'کټګوري ترلاسه شوه', { category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const [existing] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, Number(id)));

  if (!existing) {
    throw new ApiError(404, 'کټګوري ونه موندل شوه');
  }

  // Check if another category with same name exists
  if (name !== existing.name) {
    const [duplicate] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.name, name));

    if (duplicate) {
      throw new ApiError(400, 'دا کټګوري دمخه شتون لري');
    }
  }

  const [updated] = await db
    .update(expenseCategories)
    .set({
      name,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(expenseCategories.id, Number(id)))
    .returning();

  res.respond(200, 'کټګوري بریالیتوب سره تازه شوه', { category: updated });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, Number(id)));

  if (!existing) {
    throw new ApiError(404, 'کټګوري ونه موندل شوه');
  }

  await db
    .delete(expenseCategories)
    .where(eq(expenseCategories.id, Number(id)));

  res.respond(200, 'کټګوري بریالیتوب سره حذف شوه');
});

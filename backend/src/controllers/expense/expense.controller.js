import { and, asc, desc, eq, like, or, sql, inArray } from 'drizzle-orm';
import { asyncHandler } from '../../utils/AsyncHandler.util.js';
import db from '../../configs/db/db.config.js';
import { expenses, expenseCategories, users } from '../../db/schema.js';
import ApiError from '../../utils/ApiError.util.js';
import { currentShamsiYear } from '../../utils/shamsiDate.util.js';
import { columnInShamsiYear } from '../../utils/yearFilter.util.js';
import { resolveInstitutionFilter, assertInstitutionAccess } from '../../utils/permissions.util.js';

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────
let hasExpensesPeriodTypeColumnCache = null;

const hasExpensesPeriodTypeColumn = async () => {
  if (hasExpensesPeriodTypeColumnCache !== null) return hasExpensesPeriodTypeColumnCache;
  try {
    const pragmaRows = await db.run(sql`PRAGMA table_info(expenses)`);
    hasExpensesPeriodTypeColumnCache = Array.isArray(pragmaRows)
      ? pragmaRows.some((col) => col?.name === "period_type")
      : false;
  } catch {
    hasExpensesPeriodTypeColumnCache = false;
  }
  return hasExpensesPeriodTypeColumnCache;
};

const buildExpenseConditions = ({ q, categoryId, instituteType, academicYear, permissions, role }) => {
  const conditions = [];

  if (q) {
    const queryPattern = `%${q}%`;
    conditions.push(
      or(
        like(expenses.title, queryPattern),
        like(expenses.description, queryPattern)
      )
    );
  }

  if (categoryId) {
    conditions.push(eq(expenses.categoryId, Number(categoryId)));
  }

  const requestedType = instituteType?.trim() || null;
  const institutionScope = resolveInstitutionFilter(permissions, role, requestedType);
  if (institutionScope.value) {
    conditions.push(eq(expenses.instituteType, institutionScope.value));
  } else if (institutionScope.allowed.length < 3) {
    conditions.push(inArray(expenses.instituteType, institutionScope.allowed));
  }

  const year = academicYear || String(currentShamsiYear());
  conditions.push(columnInShamsiYear(expenses.date, year));

  return conditions.length ? and(...conditions) : undefined;
};

// ─── EXPENSE CATEGORIES ────────────────────────────────────────────────────────

export const getExpenseCategories = asyncHandler(async (req, res) => {
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
    conditions.push(
      or(
        like(expenseCategories.name, queryPattern),
        like(expenseCategories.nameEn, queryPattern)
      )
    );
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Define sort fields
  const sortFields = {
    name: expenseCategories.name,
    nameEn: expenseCategories.nameEn,
    createdAt: expenseCategories.createdAt,
  };

  const sortColumn = sortFields[String(sortBy)] || expenseCategories.createdAt;
  const sortDirection = String(sortDir).toLowerCase() === 'asc' ? asc : desc;

  // Build query
  let categoriesQuery = db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      nameEn: expenseCategories.nameEn,
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

export const createExpenseCategory = asyncHandler(async (req, res) => {
  const { name, nameEn } = req.body;

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
      nameEn: nameEn || null,
    })
    .returning();

  res.respond(201, 'کټګوري بریالیتوب سره ثبت شوه', { category: created });
});

export const updateExpenseCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, nameEn } = req.body;

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
      nameEn: nameEn || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(expenseCategories.id, Number(id)))
    .returning();

  res.respond(200, 'کټګوري بریالیتوب سره تازه شوه', { category: updated });
});

export const deleteExpenseCategory = asyncHandler(async (req, res) => {
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

// ─── EXPENSES ──────────────────────────────────────────────────────────────────

export const listExpenses = asyncHandler(async (req, res) => {
  const {
    q,
    categoryId,
    instituteType,
    academicYear,
    page = 1,
    limit = 10,
    sortBy = 'date',
    sortDir = 'desc',
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  
  // Build conditions with year filter
  const conditions = [];
  
  if (q) {
    const queryPattern = `%${q}%`;
    conditions.push(
      or(
        like(expenses.title, queryPattern),
        like(expenses.description, queryPattern)
      )
    );
  }

  if (categoryId) {
    conditions.push(eq(expenses.categoryId, Number(categoryId)));
  }

  const year = academicYear || String(currentShamsiYear());
  conditions.push(columnInShamsiYear(expenses.date, year));

  const requestedType = instituteType?.trim() || null;
  const institutionScope = resolveInstitutionFilter(
    req.user?.permissions,
    req.user?.role,
    requestedType
  );
  if (institutionScope.value) {
    conditions.push(eq(expenses.instituteType, institutionScope.value));
  } else if (institutionScope.allowed.length < 3) {
    conditions.push(inArray(expenses.instituteType, institutionScope.allowed));
  }
  
  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Define sort fields
  const sortFields = {
    title: expenses.title,
    amount: expenses.amount,
    date: expenses.date,
    createdAt: expenses.createdAt,
    instituteType: expenses.instituteType,
  };

  const sortColumn = sortFields[String(sortBy)] || expenses.date;
  const sortDirection = String(sortDir).toLowerCase() === 'asc' ? asc : desc;

  // Build query
  const hasPeriodType = await hasExpensesPeriodTypeColumn();
  const baseSelect = {
    id: expenses.id,
    title: expenses.title,
    categoryId: expenses.categoryId,
    instituteType: expenses.instituteType,
    amount: expenses.amount,
    date: expenses.date,
    description: expenses.description,
    addedBy: expenses.addedBy,
    createdAt: expenses.createdAt,
    updatedAt: expenses.updatedAt,
  };
  let expensesQuery = db
    .select(
      hasPeriodType
        ? { ...baseSelect, periodType: expenses.periodType }
        : { ...baseSelect, periodType: sql`'daily'` }
    )
    .from(expenses);

  if (whereClause) {
    expensesQuery = expensesQuery.where(whereClause);
  }

  expensesQuery = expensesQuery
    .orderBy(sortDirection(sortColumn))
    .limit(Number(limit))
    .offset(offset);

  // Count query
  let countQuery = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(expenses);

  if (whereClause) {
    countQuery = countQuery.where(whereClause);
  }

  const [expensesList, countResult] = await Promise.all([
    expensesQuery,
    countQuery,
  ]);

  // Get all unique category IDs and user IDs
  const categoryIds = [...new Set(expensesList.map(e => e.categoryId).filter(Boolean))];
  const userIds = [...new Set(expensesList.map(e => e.addedBy).filter(Boolean))];

  // Fetch categories and users
  const [categories, usersData] = await Promise.all([
    categoryIds.length > 0
      ? db.select().from(expenseCategories).where(inArray(expenseCategories.id, categoryIds))
      : Promise.resolve([]),
    userIds.length > 0
      ? db.select().from(users).where(inArray(users.id, userIds))
      : Promise.resolve([]),
  ]);

  // Create lookup maps
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const userMap = new Map(usersData.map(u => [u.id, u]));

  // Enrich expenses with category and user info
  const enrichedExpenses = expensesList.map(expense => {
    const category = categoryMap.get(expense.categoryId);
    const user = userMap.get(expense.addedBy);

    return {
      ...expense,
      categoryName: category?.name || null,
      categoryNameEn: category?.nameEn || null,
      addedByName: user?.name || null,
    };
  });

  const total = countResult[0]?.count || 0;

  res.respond(200, 'لګښتونه ترلاسه شول', {
    expenses: enrichedExpenses,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const createExpense = asyncHandler(async (req, res) => {
  const { title, categoryId, instituteType, amount, date, description, periodType = "daily" } = req.body;

  // Validate category exists
  const [category] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, Number(categoryId)));

  if (!category) {
    throw new ApiError(404, 'کټګوري ونه موندل شوه');
  }

  assertInstitutionAccess(req.user?.permissions, req.user?.role, instituteType);

  const validPeriod = ["daily", "monthly", "yearly"].includes(periodType) ? periodType : "daily";

  const hasPeriodType = await hasExpensesPeriodTypeColumn();
  const insertData = {
    title,
    categoryId: Number(categoryId),
    instituteType,
    amount: Number(amount),
    date,
    description: description || null,
    addedBy: req.user.id,
  };
  if (hasPeriodType) insertData.periodType = validPeriod;

  const [created] = await db
    .insert(expenses)
    .values(insertData)
    .returning();

  // Get category and user info for response
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, req.user.id));

  res.respond(201, 'لګښت بریالیتوب سره ثبت شو', {
    expense: {
      ...created,
      categoryName: category.name,
      categoryNameEn: category.nameEn,
      addedByName: user?.name || null,
    },
  });
});

export const getExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, Number(id)));

  if (!expense) {
    throw new ApiError(404, 'لګښت ونه موندل شو');
  }

  // Fetch related data
  const [category, user] = await Promise.all([
    expense.categoryId
      ? db.select().from(expenseCategories).where(eq(expenseCategories.id, expense.categoryId)).then(r => r[0])
      : null,
    expense.addedBy
      ? db.select().from(users).where(eq(users.id, expense.addedBy)).then(r => r[0])
      : null,
  ]);

  const enrichedExpense = {
    ...expense,
    categoryName: category?.name || null,
    categoryNameEn: category?.nameEn || null,
    addedByName: user?.name || null,
  };

  res.respond(200, 'لګښت ترلاسه شو', { expense: enrichedExpense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, categoryId, instituteType, amount, date, description, periodType } = req.body;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, Number(id)));

  if (!existing) {
    throw new ApiError(404, 'لګښت ونه موندل شو');
  }

  assertInstitutionAccess(req.user?.permissions, req.user?.role, existing.instituteType);
  if (instituteType !== undefined) {
    assertInstitutionAccess(req.user?.permissions, req.user?.role, instituteType);
  }

  // Validate category if provided
  if (categoryId) {
    const [category] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, Number(categoryId)));

    if (!category) {
      throw new ApiError(404, 'کټګوري ونه موندل شوه');
    }
  }

  const updateData = {
    updatedAt: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (categoryId !== undefined) updateData.categoryId = Number(categoryId);
  if (instituteType !== undefined) updateData.instituteType = instituteType;
  const hasPeriodType = await hasExpensesPeriodTypeColumn();
  if (hasPeriodType && periodType !== undefined) {
    updateData.periodType = ["daily", "monthly", "yearly"].includes(periodType) ? periodType : "daily";
  }
  if (amount !== undefined) updateData.amount = Number(amount);
  if (date !== undefined) updateData.date = date;
  if (description !== undefined) updateData.description = description || null;

  const [updated] = await db
    .update(expenses)
    .set(updateData)
    .where(eq(expenses.id, Number(id)))
    .returning();

  // Get category and user info for response
  const [category, user] = await Promise.all([
    updated.categoryId
      ? db.select().from(expenseCategories).where(eq(expenseCategories.id, updated.categoryId)).then(r => r[0])
      : Promise.resolve(null),
    updated.addedBy
      ? db.select({ name: users.name }).from(users).where(eq(users.id, updated.addedBy)).then(r => r[0])
      : Promise.resolve(null),
  ]);

  res.respond(200, 'لګښت بریالیتوب سره تازه شو', {
    expense: {
      ...updated,
      categoryName: category?.name || null,
      categoryNameEn: category?.nameEn || null,
      addedByName: user?.name || null,
    },
  });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, Number(id)));

  if (!existing) {
    throw new ApiError(404, 'لګښت ونه موندل شو');
  }

  assertInstitutionAccess(req.user?.permissions, req.user?.role, existing.instituteType);

  await db
    .delete(expenses)
    .where(eq(expenses.id, Number(id)));

  res.respond(200, 'لګښت بریالیتوب سره حذف شو');
});

export const getStatistics = asyncHandler(async (req, res) => {
  const { q, categoryId, instituteType, academicYear } = req.query;
  const whereClause = buildExpenseConditions({
    q,
    categoryId,
    instituteType,
    academicYear,
    permissions: req.user?.permissions,
    role: req.user?.role,
  });

  // Total expenses
  const totalQuery = db
    .select({ total: sql`COALESCE(sum(${expenses.amount}), 0)`.mapWith(Number) })
    .from(expenses);

  const finalTotalQuery = whereClause ? totalQuery.where(whereClause) : totalQuery;

  // Category totals
  const categoryQuery = db
    .select({
      categoryId: expenses.categoryId,
      total: sql`COALESCE(sum(${expenses.amount}), 0)`.mapWith(Number),
      count: sql`count(${expenses.id})`.mapWith(Number),
    })
    .from(expenses)
    .groupBy(expenses.categoryId);

  const finalCategoryQuery = whereClause ? categoryQuery.where(whereClause) : categoryQuery;

  // Institute type totals
  const typeQuery = db
    .select({
      instituteType: expenses.instituteType,
      total: sql`COALESCE(sum(${expenses.amount}), 0)`.mapWith(Number),
    })
    .from(expenses)
    .groupBy(expenses.instituteType);

  const finalTypeQuery = whereClause ? typeQuery.where(whereClause) : typeQuery;

  const [totalResult, categoryTotals, typeTotals] = await Promise.all([
    finalTotalQuery,
    finalCategoryQuery,
    finalTypeQuery,
  ]);

  // Fetch category names
  const categoryIds = categoryTotals.map(c => c.categoryId).filter(Boolean);
  const categories = categoryIds.length > 0
    ? await db.select().from(expenseCategories).where(inArray(expenseCategories.id, categoryIds))
    : [];

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Enrich category totals with names
  const enrichedCategoryTotals = categoryTotals.map(item => {
    const category = categoryMap.get(item.categoryId);
    return {
      categoryId: item.categoryId,
      categoryName: category?.name || 'نامعلوم',
      categoryNameEn: category?.nameEn || 'Unknown',
      total: item.total,
      count: item.count,
    };
  });

  res.respond(200, 'د لګښتونو احصایې ترلاسه شوې', {
    statistics: {
      totalExpenses: totalResult[0]?.total || 0,
      categoryTotals: enrichedCategoryTotals,
      instituteTypeTotals: typeTotals,
    },
  });
});

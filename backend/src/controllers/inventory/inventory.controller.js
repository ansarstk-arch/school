import { and, asc, desc, eq, like, sql, count } from "drizzle-orm";
import db from "../../configs/db/db.config.js";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import ApiError from "../../utils/ApiError.util.js";
import { inventoryItems, inventorySales } from "../../db/schema.js";
import { getCurrentAfghanDate } from "../../utils/dateHandler.util.js";

const ensureInventoryTables = async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      sku TEXT UNIQUE,
      description TEXT,
      academic_year TEXT NOT NULL,
      purchase_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS inventory_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      sale_date TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      sold_by INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
    )
  `);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_inventory_items_year ON inventory_items(academic_year)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_inventory_items_stock ON inventory_items(stock_quantity)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_inventory_sales_item ON inventory_sales(item_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_inventory_sales_date ON inventory_sales(sale_date)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_inventory_sales_year ON inventory_sales(academic_year)`);
};

const getDefaultAcademicYear = () => String(getCurrentAfghanDate()).split("-")[0];

export const getInventoryStats = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const year = req.query.academicYear || getDefaultAcademicYear();
  const [today] = String(getCurrentAfghanDate()).split("T");
  const [currentYear, currentMonth] = String(today).split("-");
  const monthPrefix = `${year}-${currentMonth}`;

  const [itemCount, lowStockCount, monthRevenue, yearRevenue] = await Promise.all([
    db.select({ count: count() }).from(inventoryItems).where(eq(inventoryItems.academicYear, year)),
    db.select({ count: count() }).from(inventoryItems).where(and(eq(inventoryItems.academicYear, year), sql`${inventoryItems.stockQuantity} <= ${inventoryItems.lowStockThreshold}`)),
    db.select({ total: sql`COALESCE(SUM(${inventorySales.totalAmount}),0)` }).from(inventorySales).where(and(eq(inventorySales.academicYear, year), like(inventorySales.saleDate, `${monthPrefix}%`))),
    db.select({ total: sql`COALESCE(SUM(${inventorySales.totalAmount}),0)` }).from(inventorySales).where(eq(inventorySales.academicYear, year)),
  ]);

  res.respond(200, "د سټاک احصایې ترلاسه شوې", {
    totalItems: Number(itemCount[0]?.count || 0),
    lowStockItems: Number(lowStockCount[0]?.count || 0),
    monthlyRevenue: Number(monthRevenue[0]?.total || 0),
    yearlyRevenue: Number(yearRevenue[0]?.total || 0),
  });
});

export const listInventoryItems = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const {
    id,
    name,
    category,
    academicYear = getDefaultAcademicYear(),
    lowStock,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortDir = "desc",
  } = req.query;

  const conditions = [eq(inventoryItems.academicYear, String(academicYear))];
  if (id) conditions.push(eq(inventoryItems.id, Number(id)));
  if (name) conditions.push(like(inventoryItems.name, `%${name}%`));
  if (category) conditions.push(eq(inventoryItems.category, category));
  if (lowStock === "true") conditions.push(sql`${inventoryItems.stockQuantity} <= ${inventoryItems.lowStockThreshold}`);

  const whereClause = and(...conditions);
  const offset = (Number(page) - 1) * Number(limit);
  const sortMap = { name: inventoryItems.name, stockQuantity: inventoryItems.stockQuantity, salePrice: inventoryItems.salePrice, createdAt: inventoryItems.createdAt };
  const sortColumn = sortMap[sortBy] || inventoryItems.createdAt;
  const orderFn = String(sortDir).toLowerCase() === "asc" ? asc : desc;

  const [rows, totalRows] = await Promise.all([
    db.select().from(inventoryItems).where(whereClause).orderBy(orderFn(sortColumn)).limit(Number(limit)).offset(offset),
    db.select({ total: count() }).from(inventoryItems).where(whereClause),
  ]);

  res.respond(200, "د سټاک توکي ترلاسه شول", {
    items: rows,
    pagination: {
      total: Number(totalRows[0]?.total || 0),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(Number(totalRows[0]?.total || 0) / Number(limit)),
    },
  });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const payload = req.body;
  const [created] = await db.insert(inventoryItems).values({
    name: payload.name,
    category: payload.category || null,
    sku: payload.sku || null,
    description: payload.description || null,
    academicYear: String(payload.academicYear),
    purchasePrice: Number(payload.purchasePrice || 0),
    salePrice: Number(payload.salePrice),
    stockQuantity: Number(payload.stockQuantity),
    lowStockThreshold: Number(payload.lowStockThreshold ?? 5),
  }).returning();

  res.respond(201, "توکی بریالیتوب سره ثبت شو", { item: created });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const { id } = req.params;
  const [existing] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, Number(id)));
  if (!existing) throw new ApiError(404, "توکی ونه موندل شو");

  const body = req.body;
  const updateData = { updatedAt: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.category !== undefined) updateData.category = body.category || null;
  if (body.sku !== undefined) updateData.sku = body.sku || null;
  if (body.description !== undefined) updateData.description = body.description || null;
  if (body.academicYear !== undefined) updateData.academicYear = String(body.academicYear);
  if (body.purchasePrice !== undefined) updateData.purchasePrice = Number(body.purchasePrice);
  if (body.salePrice !== undefined) updateData.salePrice = Number(body.salePrice);
  if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity);
  if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(body.lowStockThreshold);

  const [updated] = await db.update(inventoryItems).set(updateData).where(eq(inventoryItems.id, Number(id))).returning();
  res.respond(200, "توکی بریالیتوب سره تازه شو", { item: updated });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const { id } = req.params;
  const [existing] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, Number(id)));
  if (!existing) throw new ApiError(404, "توکی ونه موندل شو");
  await db.delete(inventoryItems).where(eq(inventoryItems.id, Number(id)));
  res.respond(200, "توکی بریالیتوب سره حذف شو");
});

export const listInventorySales = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const {
    academicYear = getDefaultAcademicYear(),
    itemId,
    itemName,
    page = 1,
    limit = 20,
  } = req.query;

  const conditions = [eq(inventorySales.academicYear, String(academicYear))];
  if (itemId) conditions.push(eq(inventorySales.itemId, Number(itemId)));
  if (itemName) conditions.push(like(inventoryItems.name, `%${itemName}%`));

  const whereClause = and(...conditions);
  const offset = (Number(page) - 1) * Number(limit);

  const [rows, totalRows] = await Promise.all([
    db.select({
      id: inventorySales.id,
      itemId: inventorySales.itemId,
      itemName: inventoryItems.name,
      quantity: inventorySales.quantity,
      unitPrice: inventorySales.unitPrice,
      discount: inventorySales.discount,
      totalAmount: inventorySales.totalAmount,
      saleDate: inventorySales.saleDate,
      notes: inventorySales.notes,
    })
      .from(inventorySales)
      .leftJoin(inventoryItems, eq(inventorySales.itemId, inventoryItems.id))
      .where(whereClause)
      .orderBy(desc(inventorySales.createdAt))
      .limit(Number(limit))
      .offset(offset),
    db.select({ total: count() }).from(inventorySales).leftJoin(inventoryItems, eq(inventorySales.itemId, inventoryItems.id)).where(whereClause),
  ]);

  res.respond(200, "د خرڅلاو معلومات ترلاسه شول", {
    sales: rows,
    pagination: {
      total: Number(totalRows[0]?.total || 0),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(Number(totalRows[0]?.total || 0) / Number(limit)),
    },
  });
});

export const createInventorySale = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const { itemId, quantity, discount = 0, saleDate, academicYear, notes } = req.body;

  await db.transaction(async (tx) => {
    const [item] = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, Number(itemId)));
    if (!item) throw new ApiError(404, "توکی ونه موندل شو");
    if (item.stockQuantity < Number(quantity)) throw new ApiError(400, "د توکي سټاک کافي نه دی");

    const unitPrice = Number(item.salePrice);
    const gross = Number(quantity) * unitPrice;
    const finalDiscount = Number(discount || 0);
    if (finalDiscount > gross) throw new ApiError(400, "تخفیف له مجموعې زیات نه شي کېدای");
    const totalAmount = gross - finalDiscount;

    await tx.insert(inventorySales).values({
      itemId: Number(itemId),
      quantity: Number(quantity),
      unitPrice,
      discount: finalDiscount,
      totalAmount,
      saleDate,
      academicYear: String(academicYear),
      soldBy: req.user?.id || null,
      notes: notes || null,
    });

    await tx.update(inventoryItems).set({
      stockQuantity: item.stockQuantity - Number(quantity),
      updatedAt: new Date().toISOString(),
    }).where(eq(inventoryItems.id, Number(itemId)));
  });

  res.respond(201, "خرڅلاو بریالیتوب سره ثبت شو");
});

export const updateInventorySale = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const { id } = req.params;
  const { itemId, quantity, discount = 0, saleDate, academicYear, notes } = req.body;

  await db.transaction(async (tx) => {
    // Get existing sale
    const [existingSale] = await tx.select().from(inventorySales).where(eq(inventorySales.id, Number(id)));
    if (!existingSale) throw new ApiError(404, "خرڅلاو ونه موندل شو");

    // Get old item to restore stock
    const [oldItem] = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, existingSale.itemId));
    if (oldItem) {
      await tx.update(inventoryItems).set({
        stockQuantity: oldItem.stockQuantity + existingSale.quantity,
        updatedAt: new Date().toISOString(),
      }).where(eq(inventoryItems.id, existingSale.itemId));
    }

    // Get new item
    const [newItem] = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, Number(itemId)));
    if (!newItem) throw new ApiError(404, "توکی ونه موندل شو");
    if (newItem.stockQuantity < Number(quantity)) throw new ApiError(400, "د توکي سټاک کافي نه دی");

    const unitPrice = Number(newItem.salePrice);
    const gross = Number(quantity) * unitPrice;
    const finalDiscount = Number(discount || 0);
    if (finalDiscount > gross) throw new ApiError(400, "تخفیف له مجموعې زیات نه شي کېدای");
    const totalAmount = gross - finalDiscount;

    // Update sale
    await tx.update(inventorySales).set({
      itemId: Number(itemId),
      quantity: Number(quantity),
      unitPrice,
      discount: finalDiscount,
      totalAmount,
      saleDate,
      academicYear: String(academicYear),
      notes: notes || null,
      updatedAt: new Date().toISOString(),
    }).where(eq(inventorySales.id, Number(id)));

    // Reduce new item stock
    await tx.update(inventoryItems).set({
      stockQuantity: newItem.stockQuantity - Number(quantity),
      updatedAt: new Date().toISOString(),
    }).where(eq(inventoryItems.id, Number(itemId)));
  });

  res.respond(200, "خرڅلاو بریالیتوب سره تازه شو");
});

export const deleteInventorySale = asyncHandler(async (req, res) => {
  await ensureInventoryTables();
  const { id } = req.params;

  await db.transaction(async (tx) => {
    const [existingSale] = await tx.select().from(inventorySales).where(eq(inventorySales.id, Number(id)));
    if (!existingSale) throw new ApiError(404, "خرڅلاو ونه موندل شو");

    // Restore stock
    const [item] = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, existingSale.itemId));
    if (item) {
      await tx.update(inventoryItems).set({
        stockQuantity: item.stockQuantity + existingSale.quantity,
        updatedAt: new Date().toISOString(),
      }).where(eq(inventoryItems.id, existingSale.itemId));
    }

    await tx.delete(inventorySales).where(eq(inventorySales.id, Number(id)));
  });

  res.respond(200, "خرڅلاو بریالیتوب سره حذف شو");
});

import db from './src/configs/db/db.config.js';
import { expenses, expenseCategories, users } from './src/db/schema.js';
import { and, desc, eq, sql, inArray } from 'drizzle-orm';

console.log('🧪 Testing Expense API Logic...\n');

try {
  // Test 1: Simple select from expenses
  console.log('Test 1: Fetching expenses...');
  const expensesQuery = db
    .select({
      id: expenses.id,
      title: expenses.title,
      categoryId: expenses.categoryId,
      instituteType: expenses.instituteType,
      amount: expenses.amount,
      date: expenses.date,
      description: expenses.description,
      receipt: expenses.receipt,
      addedBy: expenses.addedBy,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
    })
    .from(expenses)
    .orderBy(desc(expenses.date))
    .limit(10)
    .offset(0);

  const expensesList = await expensesQuery;
  console.log(`✅ Found ${expensesList.length} expenses`);
  console.log('First expense:', expensesList[0]);

  // Test 2: Get category IDs and fetch categories
  console.log('\nTest 2: Fetching categories...');
  const categoryIds = [...new Set(expensesList.map(e => e.categoryId).filter(Boolean))];
  console.log('Category IDs:', categoryIds);

  const categories = categoryIds.length > 0
    ? await db.select().from(expenseCategories).where(inArray(expenseCategories.id, categoryIds))
    : [];
  
  console.log(`✅ Found ${categories.length} categories`);
  console.log('Categories:', categories);

  // Test 3: Get user IDs and fetch users
  console.log('\nTest 3: Fetching users...');
  const userIds = [...new Set(expensesList.map(e => e.addedBy).filter(Boolean))];
  console.log('User IDs:', userIds);

  const usersData = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  
  console.log(`✅ Found ${usersData.length} users`);
  console.log('Users:', usersData.map(u => ({ id: u.id, name: u.name })));

  // Test 4: Create lookup maps and enrich
  console.log('\nTest 4: Enriching expenses...');
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const userMap = new Map(usersData.map(u => [u.id, u]));

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

  console.log('✅ Enriched expenses:');
  console.log(JSON.stringify(enrichedExpenses[0], null, 2));

  console.log('\n✅ All tests passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}

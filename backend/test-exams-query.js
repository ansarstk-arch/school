import db from './src/configs/db/db.config.js';
import { exams } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

async function testExamsQuery() {
  try {
    console.log('Testing exams table query...\n');
    
    // Test 1: Check if table exists
    console.log('1. Checking if exams table exists...');
    const tableCheck = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='exams'`);
    console.log('Table exists:', tableCheck ? 'Yes' : 'No');
    
    // Test 2: Get table schema
    console.log('\n2. Getting table schema...');
    const schema = await db.all(sql`PRAGMA table_info(exams)`);
    console.log('Columns:', schema.map(col => col.name).join(', '));
    
    // Test 3: Try to select all exams
    console.log('\n3. Trying to select all exams...');
    const allExams = await db.select().from(exams).limit(5);
    console.log(`Found ${allExams.length} exams`);
    
    if (allExams.length > 0) {
      console.log('\nFirst exam:', JSON.stringify(allExams[0], null, 2));
    }
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testExamsQuery();

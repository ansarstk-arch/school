import db from './src/configs/db/db.config.js';
import { sql } from 'drizzle-orm';

async function migrateExamsTable() {
  try {
    console.log('Migrating exams table...\n');
    
    // Step 1: Check if old exams table has data
    console.log('1. Checking for existing data...');
    const oldData = await db.all(sql`SELECT * FROM exams`);
    console.log(`Found ${oldData.length} existing exams`);
    
    if (oldData.length > 0) {
      console.log('\n⚠️  Warning: Existing data will be lost!');
      console.log('Backing up to exams_backup table...');
      await db.run(sql`CREATE TABLE IF NOT EXISTS exams_backup AS SELECT * FROM exams`);
      console.log('✅ Backup created');
    }
    
    // Step 2: Drop old table
    console.log('\n2. Dropping old exams table...');
    await db.run(sql`DROP TABLE IF EXISTS exams`);
    console.log('✅ Old table dropped');
    
    // Step 3: Create new table
    console.log('\n3. Creating new exams table...');
    await db.run(sql`
      CREATE TABLE "exams" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "exam_title" text NOT NULL,
        "institution_type" text DEFAULT 'School' NOT NULL,
        "assigned_classes" text NOT NULL,
        "start_date" text NOT NULL,
        "end_date" text NOT NULL,
        "status" text DEFAULT 'فعال' NOT NULL,
        "academic_year" text NOT NULL,
        "created_at" text DEFAULT (datetime('now')) NOT NULL,
        "updated_at" text DEFAULT (datetime('now')) NOT NULL
      )
    `);
    console.log('✅ New table created');
    
    // Step 4: Create indexes
    console.log('\n4. Creating indexes...');
    await db.run(sql`CREATE INDEX "idx_exams_institution" ON "exams" ("institution_type")`);
    await db.run(sql`CREATE INDEX "idx_exams_year" ON "exams" ("academic_year")`);
    await db.run(sql`CREATE INDEX "idx_exams_status" ON "exams" ("status")`);
    await db.run(sql`CREATE INDEX "idx_exams_start_date" ON "exams" ("start_date")`);
    console.log('✅ Indexes created');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNote: Old data is backed up in exams_backup table if needed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

migrateExamsTable();

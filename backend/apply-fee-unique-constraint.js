/**
 * Apply Fee Unique Constraint Migration
 * 
 * This script adds a unique constraint to prevent duplicate fee payments
 * for the same student, enrollment type, month, and academic year.
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'database', 'school.db');
const MIGRATION_FILE = join(__dirname, 'drizzle', '0014_add_fee_unique_constraint.sql');

async function applyMigration() {
  console.log('🔄 Starting fee unique constraint migration...\n');

  try {
    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ Database file not found:', DB_PATH);
      process.exit(1);
    }

    // Read migration SQL
    const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf-8');

    // Connect to database
    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');

    console.log('📊 Checking for duplicate fee payments...');
    
    // Check for duplicates before migration
    const duplicates = db.prepare(`
      SELECT student_id, enrollment_type, month, academic_year, COUNT(*) as count
      FROM fee_payments
      GROUP BY student_id, enrollment_type, month, academic_year
      HAVING COUNT(*) > 1
    `).all();

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate fee payment groups:`);
      duplicates.forEach(dup => {
        console.log(`   - Student ${dup.student_id}, ${dup.enrollment_type}, ${dup.month}, ${dup.academic_year}: ${dup.count} payments`);
      });
      console.log('\n🧹 Removing duplicates (keeping most recent)...');
    } else {
      console.log('✓ No duplicates found\n');
    }

    // Execute migration
    console.log('🔧 Applying unique constraint...');
    db.exec(migrationSQL);

    // Verify the index was created
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name='idx_fee_payments_unique'
    `).all();

    if (indexes.length > 0) {
      console.log('✓ Unique constraint successfully applied\n');
    } else {
      console.error('❌ Failed to create unique constraint');
      process.exit(1);
    }

    // Check final state
    const totalPayments = db.prepare('SELECT COUNT(*) as count FROM fee_payments').get();
    console.log(`📊 Total fee payments in database: ${totalPayments.count}`);

    db.close();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigration();

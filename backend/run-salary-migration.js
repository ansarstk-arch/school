/**
 * Salary Module Migration Runner
 * 
 * This script applies the salary tables migration to the database.
 * Run this script once to set up the salary management tables.
 * 
 * Usage: node run-salary-migration.js
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "database", "school.db");
const MIGRATION_FILE = path.join(__dirname, "drizzle", "0011_add_salary_tables.sql");

console.log("🚀 Starting Salary Module Migration...\n");

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error("❌ Error: Database file not found at:", DB_PATH);
  console.error("Please ensure the database exists before running migrations.");
  process.exit(1);
}

// Check if migration file exists
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error("❌ Error: Migration file not found at:", MIGRATION_FILE);
  process.exit(1);
}

try {
  // Read migration SQL
  const migrationSQL = fs.readFileSync(MIGRATION_FILE, "utf8");
  console.log("📄 Migration file loaded successfully");

  // Connect to database
  const db = new Database(DB_PATH);
  console.log("🔌 Connected to database");

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Check if tables already exist
  const existingTables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('salaries', 'advances', 'advance_payments', 'salary_history')`
    )
    .all();

  if (existingTables.length > 0) {
    console.log("\n⚠️  Warning: Some salary tables already exist:");
    existingTables.forEach((table) => console.log(`   - ${table.name}`));
    console.log("\nContinuing with migration (will skip existing tables)...\n");
  }

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => {
      // Filter out empty statements and comment-only statements
      if (stmt.length === 0) return false;
      const lines = stmt.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      });
      return lines.length > 0;
    })
    .map(stmt => stmt + ';'); // Add semicolon back

  console.log(`\n📝 Executing ${statements.length} SQL statements...\n`);

  // Execute each statement
  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      db.prepare(statement).run();
      successCount++;
      
      // Extract table name for better logging
      const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
      if (tableMatch) {
        console.log(`✅ Created table: ${tableMatch[1]}`);
      } else if (statement.includes("CREATE INDEX")) {
        const indexMatch = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?`?(\w+)`?/i);
        if (indexMatch) {
          console.log(`✅ Created index: ${indexMatch[1]}`);
        }
      }
    } catch (error) {
      if (error.message.includes("already exists")) {
        skipCount++;
        const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
        if (tableMatch) {
          console.log(`⏭️  Skipped (already exists): ${tableMatch[1]}`);
        }
      } else {
        console.error(`\n❌ Error executing statement ${i + 1}:`, error.message);
        console.error("Statement:", statement.substring(0, 100) + "...");
        throw error;
      }
    }
  }

  // Verify tables were created
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('salaries', 'advances', 'advance_payments', 'salary_history')`
    )
    .all();

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   📋 Tables created: ${tables.length}/4`);
  
  if (tables.length === 4) {
    console.log("\n✨ Migration completed successfully!");
    console.log("\n📋 Created tables:");
    tables.forEach((table) => console.log(`   - ${table.name}`));
    
    console.log("\n🎯 Next steps:");
    console.log("   1. Restart your backend server");
    console.log("   2. Access the salary module at /salaries");
    console.log("   3. Access the advances module at /advances");
  } else {
    console.log("\n⚠️  Warning: Not all tables were created");
    console.log("Expected 4 tables, found:", tables.length);
  }

  db.close();
  console.log("\n🔌 Database connection closed");

} catch (error) {
  console.error("\n❌ Migration failed:", error.message);
  console.error("\nStack trace:", error.stack);
  process.exit(1);
}

console.log("\n✅ Migration script completed\n");

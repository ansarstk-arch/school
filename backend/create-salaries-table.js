import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database", "school.db");

console.log("🔧 Creating salaries table...\n");

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

try {
  // Create salaries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_type TEXT NOT NULL CHECK(person_type IN ('Teacher', 'Staff')),
      person_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      base_salary REAL NOT NULL,
      allowances REAL DEFAULT 0,
      bonuses REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      gross_salary REAL NOT NULL,
      net_salary REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK(payment_status IN ('Pending', 'Partial', 'Paid')),
      payment_date TEXT,
      payment_method TEXT CHECK(payment_method IN ('Cash', 'Bank', 'Check', NULL)),
      working_days INTEGER DEFAULT 26,
      present_days INTEGER DEFAULT 0,
      absent_days INTEGER DEFAULT 0,
      leave_days INTEGER DEFAULT 0,
      notes TEXT,
      generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(person_type, person_id, month)
    );
  `);
  console.log("✅ Salaries table created");

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_salaries_person ON salaries(person_type, person_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_salaries_month ON salaries(month);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_salaries_status ON salaries(payment_status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_salaries_year ON salaries(academic_year);`);
  console.log("✅ Indexes created");

  // Verify
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='salaries'`).all();
  if (tables.length > 0) {
    console.log("\n✨ Success! Salaries table is now available.");
  }

} catch (error) {
  console.error("❌ Error:", error.message);
} finally {
  db.close();
}

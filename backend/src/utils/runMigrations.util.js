import { sql } from "drizzle-orm";
import db from "../configs/db/db.config.js";

const columnExists = async (table, column) => {
  const rows = await db.all(sql`PRAGMA table_info(${sql.raw(table)})`);
  return Array.isArray(rows) && rows.some((r) => r.name === column);
};

const tableExists = async (table) => {
  const rows = await db.all(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${sql.raw(`'${table}'`)}`
  );
  return Array.isArray(rows) && rows.length > 0;
};

export async function runStartupMigrations() {
  try {
    if (!(await columnExists("students", "status"))) {
      await db.run(sql`ALTER TABLE students ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_students_status ON students (status)`);
      console.log("[Migration] Added students.status");
    }

    if (!(await columnExists("teachers", "status"))) {
      await db.run(sql`ALTER TABLE teachers ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers (status)`);
      console.log("[Migration] Added teachers.status");
    }

    if (!(await columnExists("teachers", "user_id"))) {
      await db.run(sql`ALTER TABLE teachers ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
      console.log("[Migration] Added teachers.user_id");
    }

    if (!(await columnExists("teachers", "assigned_classes"))) {
      await db.run(sql`ALTER TABLE teachers ADD COLUMN assigned_classes TEXT NOT NULL DEFAULT '[]'`);
      console.log("[Migration] Added teachers.assigned_classes");
    }

    if (!(await columnExists("staff", "user_id"))) {
      await db.run(sql`ALTER TABLE staff ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
      console.log("[Migration] Added staff.user_id");
    }

    const feeCols = await db.all(sql`PRAGMA table_info(fee_payments)`);
    const studentCol = Array.isArray(feeCols) ? feeCols.find((c) => c.name === "student_id") : null;
    if (studentCol?.notnull === 1) {
      await db.run(sql`PRAGMA foreign_keys=OFF`);
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS fee_payments_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          receipt_no TEXT NOT NULL UNIQUE,
          student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
          enrollment_type TEXT NOT NULL,
          month TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          amount REAL NOT NULL,
          paid REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'Unpaid',
          date TEXT NOT NULL,
          collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await db.run(sql`
        INSERT INTO fee_payments_new
        SELECT id, receipt_no, student_id, enrollment_type, month, academic_year,
               amount, paid, status, date, collected_by, notes, created_at, updated_at
        FROM fee_payments
      `);
      await db.run(sql`DROP TABLE fee_payments`);
      await db.run(sql`ALTER TABLE fee_payments_new RENAME TO fee_payments`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_fees_student ON fee_payments (student_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_fees_month ON fee_payments (month)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_fees_status ON fee_payments (status)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_fees_year ON fee_payments (academic_year)`);
      await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_payments_unique ON fee_payments (student_id, enrollment_type, month, academic_year)`);
      await db.run(sql`PRAGMA foreign_keys=ON`);
      console.log("[Migration] fee_payments.student_id is now nullable");
    }

    if (!(await tableExists("sms_endpoints"))) {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS sms_endpoints (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          slot INTEGER NOT NULL,
          name TEXT NOT NULL,
          api_url TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_tested_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_endpoints_slot ON sms_endpoints (slot)`);
      await db.run(sql`
        INSERT INTO sms_endpoints (slot, name, is_active) VALUES
        (1, 'فون ۱', 1),
        (2, 'فون ۲', 1),
        (3, 'فون ۳', 1)
      `);
      console.log("[Migration] Created sms_endpoints with 3 default slots");
    }

    if (!(await columnExists("sms_logs", "endpoint_id"))) {
      await db.run(sql`ALTER TABLE sms_logs ADD COLUMN endpoint_id INTEGER REFERENCES sms_endpoints(id) ON DELETE SET NULL`);
      console.log("[Migration] Added sms_logs.endpoint_id");
    }

    if (!(await columnExists("sms_logs", "attendance_date"))) {
      await db.run(sql`ALTER TABLE sms_logs ADD COLUMN attendance_date TEXT`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_sms_logs_student_date ON sms_logs (student_id, message_type, attendance_date)`);
      console.log("[Migration] Added sms_logs.attendance_date");
    }
  } catch (err) {
    console.error("[Migration] Startup migration error:", err.message);
  }
}

export default runStartupMigrations;

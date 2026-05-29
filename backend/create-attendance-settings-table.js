import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new Database(dbPath);

console.log('Creating attendance_settings table...');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_type TEXT NOT NULL UNIQUE,
      cutoff_time TEXT NOT NULL,
      off_days TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_settings_type ON attendance_settings(institution_type);
  `);

  // Insert default settings
  const insert = db.prepare(`
    INSERT OR IGNORE INTO attendance_settings (institution_type, cutoff_time, off_days)
    VALUES (?, ?, ?)
  `);

  insert.run('School', '09:00', '[5]'); // Friday off
  insert.run('Center', '10:00', '[5]'); // Friday off
  insert.run('Madrasa', '08:00', '[5]'); // Friday off

  console.log('✓ attendance_settings table created successfully');
  console.log('✓ Default settings inserted');
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}

-- Check if attendance table exists and view its structure
PRAGMA table_info(attendance);

-- If the table doesn't exist or has wrong columns, recreate it
-- First, backup existing data if any
CREATE TABLE IF NOT EXISTS attendance_backup AS SELECT * FROM attendance;

-- Drop the old table
DROP TABLE IF EXISTS attendance;

-- Create the correct attendance table
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_type TEXT NOT NULL,
  person_id INTEGER NOT NULL,
  institution_type TEXT,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  attendance_date TEXT NOT NULL,
  status TEXT,
  attendance_method TEXT NOT NULL DEFAULT 'Manual',
  scanned_at TEXT,
  notes TEXT,
  taken_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,
  original_status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(attendance_type, person_id, attendance_date)
);

-- Create indexes
CREATE INDEX idx_attendance_type ON attendance(attendance_type);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_person ON attendance(person_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_method ON attendance(attendance_method);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_updated_by ON attendance(updated_by);
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(attendance_type, person_id, attendance_date);

-- Restore data if backup exists
INSERT INTO attendance SELECT * FROM attendance_backup WHERE EXISTS (SELECT 1 FROM attendance_backup);

-- Drop backup table
DROP TABLE IF EXISTS attendance_backup;

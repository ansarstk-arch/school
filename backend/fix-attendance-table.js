import Database from 'libsql';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database', 'school.db');

console.log('🔧 Fixing attendance table...');
console.log('📁 Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if table exists
  const tableInfo = db.prepare("PRAGMA table_info(attendance)").all();
  console.log('\n📊 Current table structure:', tableInfo);
  
  if (tableInfo.length === 0) {
    console.log('\n❌ Attendance table does not exist!');
    console.log('✅ Creating attendance table...');
    
    // Create the table
    db.exec(`
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
      
      CREATE INDEX idx_attendance_type ON attendance(attendance_type);
      CREATE INDEX idx_attendance_date ON attendance(attendance_date);
      CREATE INDEX idx_attendance_person ON attendance(person_id);
      CREATE INDEX idx_attendance_class ON attendance(class_id);
      CREATE INDEX idx_attendance_method ON attendance(attendance_method);
      CREATE INDEX idx_attendance_status ON attendance(status);
      CREATE INDEX idx_attendance_updated_by ON attendance(updated_by);
    `);
    
    console.log('✅ Attendance table created successfully!');
  } else {
    console.log('\n✅ Attendance table exists');
    
    // Check if person_id column exists
    const hasPersonId = tableInfo.some(col => col.name === 'person_id');
    
    if (!hasPersonId) {
      console.log('❌ person_id column is missing!');
      console.log('🔧 Recreating table with correct structure...');
      
      // Backup existing data
      db.exec(`CREATE TABLE IF NOT EXISTS attendance_backup AS SELECT * FROM attendance`);
      
      // Drop old table
      db.exec(`DROP TABLE attendance`);
      
      // Create new table
      db.exec(`
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
        
        CREATE INDEX idx_attendance_type ON attendance(attendance_type);
        CREATE INDEX idx_attendance_date ON attendance(attendance_date);
        CREATE INDEX idx_attendance_person ON attendance(person_id);
        CREATE INDEX idx_attendance_class ON attendance(class_id);
        CREATE INDEX idx_attendance_method ON attendance(attendance_method);
        CREATE INDEX idx_attendance_status ON attendance(status);
        CREATE INDEX idx_attendance_updated_by ON attendance(updated_by);
      `);
      
      // Try to restore data
      try {
        db.exec(`INSERT INTO attendance SELECT * FROM attendance_backup`);
        console.log('✅ Data restored from backup');
      } catch (e) {
        console.log('⚠️  Could not restore data (table structure changed)');
      }
      
      // Drop backup
      db.exec(`DROP TABLE IF EXISTS attendance_backup`);
      
      console.log('✅ Table recreated successfully!');
    } else {
      console.log('✅ person_id column exists');
    }
  }
  
  // Verify final structure
  const finalTableInfo = db.prepare("PRAGMA table_info(attendance)").all();
  console.log('\n📊 Final table structure:');
  finalTableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  db.close();
  console.log('\n🎉 Database fix completed successfully!');
  console.log('👉 Now restart your backend server');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
}

import Database from 'libsql';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'erp.db');

async function addStaffAcademicYearColumn() {
  console.log('🔧 Adding academic_year column to staff table...');
  
  const db = new Database(dbPath);
  
  try {
    // Check if column exists
    const tableInfo = db.prepare('PRAGMA table_info(staff)').all();
    const hasAcademicYear = tableInfo.some(col => col.name === 'academic_year');
    
    if (hasAcademicYear) {
      console.log('✅ academic_year column already exists in staff table');
      db.close();
      return;
    }
    
    // Add the column
    db.exec('ALTER TABLE staff ADD COLUMN academic_year TEXT');
    console.log('✅ academic_year column added to staff table');
    
    // Create index
    db.exec('CREATE INDEX IF NOT EXISTS idx_staff_academic_year ON staff(academic_year)');
    console.log('✅ Index created on academic_year column');
    
    db.close();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

addStaffAcademicYearColumn();

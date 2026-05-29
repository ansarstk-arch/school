import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database', 'school.db');
const db = new Database(dbPath);

console.log('📚 Applying exam type migration...');

try {
  const migration = readFileSync(join(__dirname, 'drizzle', '0016_add_exam_type.sql'), 'utf-8');
  
  db.exec(migration);
  
  console.log('✅ Exam type migration applied successfully!');
  console.log('✅ examType field added to exams table');
  console.log('✅ Index created on exam_type');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

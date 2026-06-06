import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new Database(dbPath);

console.log('🔄 Adding maternal_uncle_name field to students table...');

try {
  // Add maternal_uncle_name column after grand_father_name
  db.exec(`
    ALTER TABLE students ADD COLUMN maternal_uncle_name TEXT;
  `);
  
  console.log('✅ Successfully added maternal_uncle_name field to students table');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('ℹ️  maternal_uncle_name field already exists');
  } else {
    console.error('❌ Error adding field:', error.message);
    process.exit(1);
  }
}

db.close();
console.log('✅ Migration completed successfully');

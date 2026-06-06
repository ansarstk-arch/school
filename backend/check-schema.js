import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new Database(dbPath);

console.log('🔍 Checking students table schema...\n');

try {
  const result = db.prepare('PRAGMA table_info(students)').all();
  
  console.log('📋 Current students table columns:');
  console.log('==================================');
  result.forEach(col => {
    console.log(`${col.cid}. ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'}`);
  });
  
  const hasMaternalUncle = result.find(col => col.name === 'maternal_uncle_name');
  
  if (hasMaternalUncle) {
    console.log('\n✅ maternal_uncle_name column EXISTS');
  } else {
    console.log('\n❌ maternal_uncle_name column DOES NOT EXIST');
    console.log('   Adding it now...');
    
    db.exec(`ALTER TABLE students ADD COLUMN maternal_uncle_name TEXT;`);
    console.log('✅ Column added successfully!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

db.close();

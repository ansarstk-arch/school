import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, 'database', 'school.db');
const migrationPath = join(__dirname, 'drizzle', '0010_add_dashboard_indexes.sql');

console.log('📊 Applying dashboard performance indexes...');
console.log('Database:', dbPath);

try {
  const db = new Database(dbPath);
  const migration = readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  db.exec('BEGIN TRANSACTION');
  
  for (const statement of statements) {
    console.log('Executing:', statement.substring(0, 60) + '...');
    db.exec(statement);
  }
  
  db.exec('COMMIT');
  
  console.log('✅ Dashboard indexes applied successfully!');
  console.log(`✅ Applied ${statements.length} index statements`);
  
  db.close();
} catch (error) {
  console.error('❌ Error applying indexes:', error.message);
  process.exit(1);
}

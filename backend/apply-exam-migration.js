import db from './src/configs/db/db.config.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function applyMigration() {
  try {
    console.log('Applying exam table migration...\n');
    
    const migrationSQL = fs.readFileSync('./drizzle/0008_update_exams_table.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await db.run(sql.raw(statement));
    }
    
    console.log('\n✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();

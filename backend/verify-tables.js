import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database", "school.db");

const db = new Database(DB_PATH);

const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  AND (name LIKE '%salary%' OR name LIKE '%advance%')
  ORDER BY name
`).all();

console.log("\n📋 Salary-related tables in database:");
if (tables.length === 0) {
  console.log("   ❌ No salary tables found!");
} else {
  tables.forEach(t => console.log(`   ✅ ${t.name}`));
}

db.close();

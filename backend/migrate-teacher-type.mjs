import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, ".env") });

const client = createClient({ url: process.env.LOCAL_DATABASE_URL });

try {
  await client.execute("ALTER TABLE teachers ADD COLUMN teacher_type text NOT NULL DEFAULT 'School'");
  console.log("✅ teacher_type column added successfully");
} catch (e) {
  if (e.message.includes("duplicate column")) {
    console.log("ℹ️  teacher_type column already exists");
  } else {
    console.error("❌ Error:", e.message);
  }
}

client.close?.();

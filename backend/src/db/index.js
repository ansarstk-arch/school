import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";
import "dotenv/config";

let client;
try {
  client = createClient({ url: process.env.LOCAL_DATABASE_URL });

  // Enable foreign keys for local SQLite
  await client.execute("PRAGMA foreign_keys = ON").catch(() => {});
  console.log("🗄️  Using local SQLite database (Offline Mode)");
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  process.exit(1);
}

const db = drizzle(client, { schema });

export default db;

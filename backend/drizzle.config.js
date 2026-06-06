import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: { url: process.env.LOCAL_DATABASE_URL },
});

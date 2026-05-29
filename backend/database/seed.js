import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { users } from "../src/db/schema.js";
import bcrypt from "bcrypt";
import "dotenv/config";
import { eq } from "drizzle-orm";

const isLocal = process.env.DB_MODE === "local";

const client = createClient(
  isLocal
    ? { url: process.env.LOCAL_DATABASE_URL }
    : { url: process.env.REMOTE_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
);

const db = drizzle(client);

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");
    console.log(`📍 Database Mode: ${isLocal ? "LOCAL" : "REMOTE (Turso)"}`);
    console.log("");

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const registrarPassword = await bcrypt.hash("registrar123", 10);

    // Check if admin exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@school.af"));
    
    if (existingAdmin.length === 0) {
      // Create default admin user
      await db.insert(users).values({
        name: "مدیر سیسټم",
        email: "admin@school.af",
        password: adminPassword,
        role: "admin",
        permissions: JSON.stringify({
          students: true,
          teachers: true,
          staff: true,
          parents: true,
          classes: true,
          subjects: true,
          attendance: true,
          exams: true,
          expenses: true,
          fees: true,
          reports: true,
        }),
        isActive: true,
      });
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Check if registrar exists
    const existingRegistrar = await db.select().from(users).where(eq(users.email, "registrar@school.af"));
    
    if (existingRegistrar.length === 0) {
      // Create default registrar user
      await db.insert(users).values({
        name: "راجستر",
        email: "registrar@school.af",
        password: registrarPassword,
        role: "registrar",
        permissions: JSON.stringify({
          students: true,
          teachers: false,
          staff: false,
          parents: true,
          classes: true,
          subjects: false,
          attendance: true,
          exams: false,
          expenses: false,
          fees: true,
          reports: false,
        }),
        isActive: true,
      });
      console.log("✅ Registrar user created");
    } else {
      console.log("ℹ️  Registrar user already exists");
    }

    console.log("");
    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("Default Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 Admin Account:");
    console.log("   Email: admin@school.af");
    console.log("   Password: admin123");
    console.log("");
    console.log("👤 Registrar Account:");
    console.log("   Email: registrar@school.af");
    console.log("   Password: registrar123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();

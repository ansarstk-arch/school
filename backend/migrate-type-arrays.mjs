#!/usr/bin/env node

/**
 * Migration script to convert teacherType and staffType from string to JSON array format
 * This fixes the "Unexpected token 'S', "School" is not valid JSON" error
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { teachers, staff } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import "dotenv/config";

const client = createClient({ url: process.env.LOCAL_DATABASE_URL });
const db = drizzle(client);

async function migrateTypeArrays() {
  console.log('🔄 Starting migration: Convert type fields to JSON arrays...');

  try {
    // Migrate teachers table
    console.log('📝 Migrating teachers table...');
    const allTeachers = await db.select().from(teachers);
    
    for (const teacher of allTeachers) {
      let needsUpdate = false;
      let newTeacherType = teacher.teacherType;

      // Check if teacherType is not already a JSON array
      if (teacher.teacherType && typeof teacher.teacherType === 'string') {
        try {
          // Try to parse as JSON first
          JSON.parse(teacher.teacherType);
          // If parsing succeeds, it's already in correct format
        } catch {
          // If parsing fails, it's a plain string - convert to array
          newTeacherType = JSON.stringify([teacher.teacherType]);
          needsUpdate = true;
        }
      } else if (!teacher.teacherType) {
        // If null or empty, set default
        newTeacherType = JSON.stringify(["School"]);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db.update(teachers)
          .set({ teacherType: newTeacherType })
          .where(eq(teachers.id, teacher.id));
        console.log(`✅ Updated teacher ${teacher.id}: ${teacher.name} - ${teacher.teacherType} → ${newTeacherType}`);
      }
    }

    // Migrate staff table
    console.log('📝 Migrating staff table...');
    const allStaff = await db.select().from(staff);
    
    for (const staffMember of allStaff) {
      let needsUpdate = false;
      let newStaffType = staffMember.staffType;

      // Check if staffType is not already a JSON array
      if (staffMember.staffType && typeof staffMember.staffType === 'string') {
        try {
          // Try to parse as JSON first
          JSON.parse(staffMember.staffType);
          // If parsing succeeds, it's already in correct format
        } catch {
          // If parsing fails, it's a plain string - convert to array
          newStaffType = JSON.stringify([staffMember.staffType]);
          needsUpdate = true;
        }
      } else if (!staffMember.staffType) {
        // If null or empty, set default
        newStaffType = JSON.stringify(["School"]);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db.update(staff)
          .set({ staffType: newStaffType })
          .where(eq(staff.id, staffMember.id));
        console.log(`✅ Updated staff ${staffMember.id}: ${staffMember.name} - ${staffMember.staffType} → ${newStaffType}`);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Teachers processed: ${allTeachers.length}`);
    console.log(`   - Staff processed: ${allStaff.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run the migration
migrateTypeArrays();
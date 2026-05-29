/**
 * Migration Script: Update Teacher Types to JSON Array Format
 * 
 * This script migrates existing teacher records from single string type
 * to JSON array format to support multiple types (School, Center, Madrasa)
 */

import db from './src/configs/db/db.config.js';
import { teachers } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

async function migrateTeacherTypes() {
  console.log('🔄 Starting teacher type migration...\n');

  try {
    // Get all teachers
    const allTeachers = await db.select().from(teachers);
    console.log(`📊 Found ${allTeachers.length} teachers to check\n`);

    let migratedCount = 0;
    let alreadyCorrectCount = 0;
    let errorCount = 0;

    for (const teacher of allTeachers) {
      try {
        let needsUpdate = false;
        let newTeacherType;

        // Check if teacherType is already a JSON array
        if (teacher.teacherType) {
          try {
            const parsed = JSON.parse(teacher.teacherType);
            if (Array.isArray(parsed)) {
              alreadyCorrectCount++;
              console.log(`✓ Teacher ID ${teacher.id} (${teacher.name}) - Already in correct format`);
              continue;
            }
          } catch (e) {
            // Not valid JSON, treat as string
            needsUpdate = true;
          }
        }

        // If we reach here, it's either a string or null
        if (!teacher.teacherType || teacher.teacherType === 'null') {
          // Default to School
          newTeacherType = JSON.stringify(['School']);
          needsUpdate = true;
        } else if (typeof teacher.teacherType === 'string') {
          // Convert string to array
          const trimmed = teacher.teacherType.trim();
          
          // Check if it's one of the valid types
          if (['School', 'Center', 'Madrasa'].includes(trimmed)) {
            newTeacherType = JSON.stringify([trimmed]);
          } else {
            // Default to School if invalid
            newTeacherType = JSON.stringify(['School']);
          }
          needsUpdate = true;
        }

        if (needsUpdate) {
          // Update the teacher record
          await db.update(teachers)
            .set({ 
              teacherType: newTeacherType,
              updatedAt: new Date().toISOString()
            })
            .where(sql`${teachers.id} = ${teacher.id}`);

          migratedCount++;
          console.log(`✓ Teacher ID ${teacher.id} (${teacher.name}) - Migrated from "${teacher.teacherType}" to ${newTeacherType}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating teacher ID ${teacher.id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✓ Successfully migrated: ${migratedCount} teachers`);
    console.log(`✓ Already correct format: ${alreadyCorrectCount} teachers`);
    console.log(`✗ Errors: ${errorCount} teachers`);
    console.log(`📊 Total processed: ${allTeachers.length} teachers`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the logs above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTeacherTypes()
  .then(() => {
    console.log('\n👋 Migration script finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

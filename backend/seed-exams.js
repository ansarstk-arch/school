import db from "./src/db/index.js";
import { exams, classes } from "./src/db/schema.js";
import { eq } from "drizzle-orm";
import { currentShamsiYear } from "./src/lib/afghan-date.js";

async function seedExams() {
  try {
    console.log("🌱 Seeding sample exam data...");

    const currentYear = String(currentShamsiYear());
    
    // First, let's create a sample class if none exists
    const [sampleClass] = await db.insert(classes).values({
      name: "دهمه ټولګي",
      section: "الف",
      type: "School",
      academicYear: currentYear,
      monthlyFee: 1000,
    }).returning().catch(() => [null]);

    if (sampleClass) {
      console.log("✅ Sample class created:", sampleClass.name);
    }

    // Get existing classes for the current year
    const existingClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.academicYear, currentYear))
      .limit(3);

    if (existingClasses.length === 0) {
      console.log("⚠️  No classes found for current academic year. Creating sample classes...");
      
      // Create sample classes
      const sampleClasses = await db.insert(classes).values([
        {
          name: "دهمه ټولګي",
          section: "الف", 
          type: "School",
          academicYear: currentYear,
          monthlyFee: 1000,
        },
        {
          name: "دهمه ټولګي",
          section: "ب",
          type: "School", 
          academicYear: currentYear,
          monthlyFee: 1000,
        },
        {
          name: "یوولسمه ټولګي",
          section: "الف",
          type: "School",
          academicYear: currentYear,
          monthlyFee: 1200,
        }
      ]).returning();
      
      console.log("✅ Sample classes created");
      existingClasses.push(...sampleClasses);
    }

    // Create sample exams
    const classIds = existingClasses.map(c => c.id);
    
    const sampleExams = [
      {
        examTitle: "د لومړي څانګې امتحان",
        institutionType: "School",
        assignedClasses: JSON.stringify(classIds.slice(0, 2)),
        startDate: "2024-03-15",
        endDate: "2024-03-25", 
        status: "فعال",
        academicYear: currentYear,
      },
      {
        examTitle: "د دویمې څانګې امتحان", 
        institutionType: "School",
        assignedClasses: JSON.stringify(classIds),
        startDate: "2024-06-10",
        endDate: "2024-06-20",
        status: "فعال", 
        academicYear: currentYear,
      },
      {
        examTitle: "کلنۍ امتحان",
        institutionType: "School", 
        assignedClasses: JSON.stringify(classIds),
        startDate: "2024-12-01",
        endDate: "2024-12-15",
        status: "غیر فعال",
        academicYear: currentYear,
      }
    ];

    const createdExams = await db.insert(exams).values(sampleExams).returning();
    
    console.log("✅ Sample exams created:");
    createdExams.forEach(exam => {
      console.log(`   - ${exam.examTitle} (${exam.status})`);
    });
    
    console.log("");
    console.log("🎉 Exam seeding completed successfully!");
    console.log(`📅 Academic Year: ${currentYear}`);
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Exam seeding failed:", error);
    process.exit(1);
  }
}

seedExams();
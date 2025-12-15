// scripts/generateStudentQRs.ts
// Generate QR codes for all students in the database

import dotenv from "dotenv";
import { mkdirSync } from "fs";
import { db } from "../src/firebaseConfig.js";
import { saveQRToFile } from "../src/utils/generateQR.js";

dotenv.config();

async function generateStudentQRs() {
  try {
    const STUDENTS_COLLECTION = process.env.FIRESTORE_STUDENTS_COLLECTION || "students";
    console.log(`Generating QR codes for students in collection: ${STUDENTS_COLLECTION}`);

    // Create output directory
    const outputDir = "./qr-codes";
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Get all students
    const snapshot = await db.collection(STUDENTS_COLLECTION).get();
    
    if (snapshot.empty) {
      console.log("No students found. Run 'npm run seed' first.");
      process.exit(1);
    }

    console.log(`Found ${snapshot.size} students. Generating QR codes...`);

    let count = 0;
    for (const doc of snapshot.docs) {
      const student = doc.data();
      const studentId = doc.id;

      // Generate two types of QR codes:
      
      // 1. Simple ID only
      const simpleFilename = `${outputDir}/${studentId}_simple.png`;
      await saveQRToFile(studentId, simpleFilename);
      
      // 2. Full JSON with student data
      const jsonFilename = `${outputDir}/${studentId}_full.png`;
      const jsonData = {
        id: studentId,
        name: student.name || "",
        class: student.class || "",
      };
      await saveQRToFile(jsonData, jsonFilename);
      
      count++;
      console.log(`  ✓ ${studentId}: ${student.name}`);
    }

    console.log(`\n✅ Generated ${count * 2} QR codes in ${outputDir}/`);
    console.log("\nQR code types:");
    console.log("  *_simple.png: Contains only student ID");
    console.log("  *_full.png: Contains JSON with ID, name, and class");
    
    process.exit(0);
  } catch (error) {
    console.error("✗ Error generating QR codes:", error);
    process.exit(1);
  }
}

generateStudentQRs();

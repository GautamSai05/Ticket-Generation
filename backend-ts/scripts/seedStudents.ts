// scripts/seedStudents.ts
// Seed sample students into Firestore

import dotenv from "dotenv";
import { db } from "../src/firebaseConfig.js";

dotenv.config();

// Sample students data
const students = [
  { id: "STU001", name: "Alice Johnson", class: "10A", email: "alice@school.edu" },
  { id: "STU002", name: "Bob Smith", class: "10A", email: "bob@school.edu" },
  { id: "STU003", name: "Charlie Brown", class: "10B", email: "charlie@school.edu" },
  { id: "STU004", name: "Diana Prince", class: "10B", email: "diana@school.edu" },
  { id: "STU005", name: "Ethan Hunt", class: "11A", email: "ethan@school.edu" },
  { id: "STU006", name: "Fiona Green", class: "11A", email: "fiona@school.edu" },
  { id: "STU007", name: "George Wilson", class: "11B", email: "george@school.edu" },
  { id: "STU008", name: "Hannah Lee", class: "11B", email: "hannah@school.edu" },
  { id: "STU009", name: "Ivan Chen", class: "12A", email: "ivan@school.edu" },
  { id: "STU010", name: "Julia Martinez", class: "12A", email: "julia@school.edu" },
];

async function seedStudents() {
  try {
    const STUDENTS_COLLECTION = process.env.FIRESTORE_STUDENTS_COLLECTION || "students";
    console.log(`Seeding students into collection: ${STUDENTS_COLLECTION}`);

    const batch = db.batch();

    for (const student of students) {
      const docRef = db.collection(STUDENTS_COLLECTION).doc(student.id);
      batch.set(docRef, {
        ...student,
        createdAt: new Date(),
      });
    }

    await batch.commit();
    console.log(`✓ Successfully seeded ${students.length} students`);
    
    // Print sample QR data formats
    console.log("\n📱 Sample QR code formats:");
    console.log("   Plain ID:  STU001");
    console.log("   JSON:      " + JSON.stringify({ id: "STU001", name: "Alice Johnson", class: "10A" }));
    
    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding students:", error);
    process.exit(1);
  }
}

seedStudents();

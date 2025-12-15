import { Router } from "express";
import admin from "firebase-admin";
import { db } from "../firebaseConfig";

const router = Router();

/**
 * Helper function to get student details by ID
 * @param studentId - The student ID to query
 * @returns { id, ...data } if student exists, null otherwise
 */
async function getStudentDetails(studentId: string): Promise<any | null> {
  const studentDoc = await db.collection("students").doc(studentId).get();
  if (!studentDoc.exists) {
    return null;
  }
  return { id: studentId, ...studentDoc.data() };
}

/**
 * POST /attendance/scan
 * body: { qrData: string, extra?: object }
 */
router.post("/scan", async (req, res) => {
  try {
    const { qrData, extra } = req.body;

    // 1. Validate qrData input (string, required)
    if (!qrData || typeof qrData !== "string") {
      return res.status(400).json({ error: "qrData must be a non-empty string" });
    }

    let studentId: string;
    let studentDetails: any = {};

    // 2. Try parsing qrData as JSON first (QR codes with embedded student info)
    try {
      const parsed = JSON.parse(qrData);
      if (parsed && typeof parsed === "object" && parsed.id) {
        studentId = parsed.id;
        studentDetails = parsed;
      } else {
        // Not a valid student JSON, use as plain ID
        studentId = qrData;
      }
    } catch {
      // qrData is not JSON, use as plain student ID
      studentId = qrData;
    }

    // 3. If extra JSON is provided, override with that
    if (extra && typeof extra === "object" && extra.id) {
      studentId = extra.id;
      studentDetails = extra;
    }

    // 4. If we still don't have student details, try fetching from database
    if (!studentDetails.id) {
      const dbStudent = await getStudentDetails(studentId);
      if (dbStudent) {
        studentDetails = dbStudent;
      } else {
        // Student not found in DB, create minimal student object
        studentDetails = {
          id: studentId,
          name: "",
          class: "",
        };
      }
    }

    // 5. Check for duplicate attendance today
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const attendanceKey = `${studentId}_${today}`;
    const attendanceByDayRef = db.collection("attendance_by_day").doc(attendanceKey);
    
    const existingAttendance = await attendanceByDayRef.get();
    if (existingAttendance.exists) {
      return res.status(400).json({
        error: "Duplicate attendance",
        message: `Attendance already recorded for student ${studentId} today`,
        studentId,
        studentDetails,
      });
    }

    // 6. Create an attendance document in Firestore collection "attendance"
    const attendanceDoc = {
      studentId,
      student: studentDetails,
      scannedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent") || "",
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("attendance").add(attendanceDoc);

    // 7. Save to attendance_by_day to prevent duplicates
    await attendanceByDayRef.set({
      studentId,
      attendanceId: ref.id,
      date: today,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 8. Return 201 with success message
    return res.status(201).json({
      id: ref.id,
      message: "Attendance recorded successfully",
      studentId,
      student: studentDetails,
    });
  } catch (err) {
    // 9. Handle errors and return internal error
    console.error("attendance error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
